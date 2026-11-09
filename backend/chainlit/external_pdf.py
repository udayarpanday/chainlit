"""Click-only, authenticated imports of public PDFs into a private TTL cache.

No model-provided hostname is trusted: DNS answers are checked and the actual
connection is pinned to a checked IP, retaining the original TLS/HTTP hostname.
The cache contains no source URLs, credentials, or model-supplied paths.
"""

import asyncio
import hashlib
import ipaddress
import json
import logging
import os
import re
import socket
import tempfile
import time
from collections import deque
from contextlib import asynccontextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from email.message import Message
from pathlib import Path
from typing import Optional

import aiofiles
import httpx
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from chainlit.auth import get_current_user
from chainlit.config import FILES_DIRECTORY
from chainlit.user import User


_importing_pdf: ContextVar[bool] = ContextVar("importing_external_pdf", default=False)


class _HideImportUrl(logging.Filter):
    def filter(self, record):
        # HTTPX normally logs full URLs, including signed query parameters.
        # Suppress only this downloader's request logs, leaving other calls alone.
        return not _importing_pdf.get()


logging.getLogger("httpx").addFilter(_HideImportUrl())


class ExternalPdfSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CHAINLIT_EXTERNAL_PDF_")

    max_mb: int = Field(default=100, ge=1, le=500)
    ttl_seconds: int = Field(default=3600, ge=300, le=86400)
    timeout_seconds: int = Field(default=120, ge=10, le=300)
    cache_mb: int = Field(default=1024, ge=100, le=10240)
    user_cache_mb: int = Field(default=300, ge=100, le=2048)
    requests_per_minute: int = Field(default=10, ge=1, le=60)
    concurrency: int = Field(default=4, ge=1, le=16)


def public_pdf_url(value: str) -> httpx.URL:
    if len(value) > 4096 or re.search(
        r"[\x00-\x20\x7f\\]|%e2%80%8b|\u200b", value, re.I
    ):
        raise HTTPException(400, "This address cannot be imported.")
    try:
        url = httpx.URL(value)
        host = url.host.lower().rstrip(".")
        if (
            url.scheme != "https"
            or url.userinfo
            or url.port not in (None, 443)
            or not host
            or "." not in host
            or ":" in host
            or re.fullmatch(r"[\d.]+", host)
            or re.search(
                r"(?:^|\.)(?:localhost|local|internal|intranet|lan|home|home\.arpa|test|invalid|onion)$",
                host,
            )
        ):
            raise ValueError
        return url.copy_with(fragment=None)
    except (ValueError, httpx.InvalidURL) as exc:
        raise HTTPException(
            400, "Only public HTTPS document addresses are supported."
        ) from exc


async def pinned_pdf_url(url: httpx.URL) -> httpx.URL:
    """Reject mixed public/private DNS answers and prevent a second DNS lookup."""
    try:
        answers = await asyncio.wait_for(
            asyncio.get_running_loop().getaddrinfo(
                url.host, 443, type=socket.SOCK_STREAM, proto=socket.IPPROTO_TCP
            ),
            timeout=10,
        )
        addresses = [ipaddress.ip_address(answer[4][0]) for answer in answers]
        if not addresses or any(
            not address.is_global
            or address.is_multicast
            or address.is_reserved
            or getattr(address, "ipv4_mapped", None) is not None
            or (
                address.version == 6
                and any(
                    address in ipaddress.ip_network(prefix)
                    for prefix in (
                        "64:ff9b::/96",
                        "64:ff9b:1::/48",
                        "2001::/32",
                        "2002::/16",
                    )
                )
            )
            for address in addresses
        ):
            raise HTTPException(
                400, "This address does not resolve to a public document server."
            )
        # Prefer IPv4 where available; many deployments do not have IPv6 egress.
        address = next((item for item in addresses if item.version == 4), addresses[0])
        return url.copy_with(host=str(address))
    except (OSError, asyncio.TimeoutError) as exc:
        raise HTTPException(502, "The document server could not be reached.") from exc


def pdf_filename(response: httpx.Response, source: httpx.URL) -> str:
    message = Message()
    message["content-disposition"] = response.headers.get("content-disposition", "")
    name = message.get_filename() or source.path.rsplit("/", 1)[-1] or "Document.pdf"
    name = re.sub(r"[\x00-\x1f\x7f/\\]", "_", str(name)).strip(" .")[:180]
    return name if name.lower().endswith(".pdf") else "Document.pdf"


@dataclass
class CachedPdf:
    id: str
    path: Path
    filename: str
    size: int
    expires_at: float


class ExternalPdfCache:
    def __init__(self, root: Path, settings: ExternalPdfSettings):
        self.root = root
        self.settings = settings
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        self._active = 0
        self._rates: dict[str, deque[float]] = {}
        self._guard = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None

    def owner_dir(self, owner: str) -> Path:
        key = hashlib.sha256(owner.encode()).hexdigest()
        return self.root / key

    def cached(self, owner: str, cache_id: str) -> Optional[CachedPdf]:
        if not re.fullmatch(r"[a-f0-9]{64}", cache_id):
            return None
        directory = self.owner_dir(owner)
        path = directory / f"{cache_id}.pdf"
        try:
            metadata = json.loads((directory / f"{cache_id}.json").read_text())
            if (
                metadata["expires_at"] <= time.time()
                or not path.is_file()
                or path.is_symlink()
                or path.stat().st_size != metadata["size"]
            ):
                return None
            return CachedPdf(
                cache_id,
                path,
                metadata["filename"],
                metadata["size"],
                metadata["expires_at"],
            )
        except (OSError, ValueError, KeyError, TypeError):
            return None

    def cleanup(self):
        now = time.time()
        for directory in self.root.iterdir():
            if not directory.is_dir() or directory.is_symlink():
                continue
            for path in directory.iterdir():
                try:
                    age = now - path.stat().st_mtime
                    limit = (
                        self.settings.timeout_seconds + 30
                        if path.suffix in (".lock", ".part")
                        else self.settings.ttl_seconds
                    )
                    if age > limit:
                        path.unlink(missing_ok=True)
                except FileNotFoundError:
                    pass

    async def _cleanup_loop(self):
        while True:
            await asyncio.sleep(60)
            await asyncio.to_thread(self.cleanup)

    async def close(self):
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    def check_capacity(self, directory: Path):
        maximum = self.settings.max_mb * 1024 * 1024

        def usage(paths):
            total = 0
            for path in paths:
                try:
                    # Every in-flight download reserves its full possible size.
                    total += maximum if path.suffix == ".lock" else path.stat().st_size
                except FileNotFoundError:
                    pass
            return total

        if (
            usage(self.root.glob("*/*.pdf")) + usage(self.root.glob("*/*.lock"))
            > self.settings.cache_mb * 1024 * 1024
            or usage(directory.glob("*.pdf")) + usage(directory.glob("*.lock"))
            > self.settings.user_cache_mb * 1024 * 1024
        ):
            raise HTTPException(
                429, "The preview cache is full. Try again after older previews expire."
            )

    async def import_pdf(self, owner: str, value: str) -> tuple[CachedPdf, bool]:
        source = public_pdf_url(value)
        cache_id = hashlib.sha256(str(source).encode()).hexdigest()
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        if ready := await asyncio.to_thread(self.cached, owner, cache_id):
            return ready, True
        await asyncio.to_thread(self.cleanup)
        directory = self.owner_dir(owner)
        directory.mkdir(mode=0o700, exist_ok=True)
        lock = directory / f"{cache_id}.lock"
        deadline = time.monotonic() + self.settings.timeout_seconds + 15
        while True:
            try:
                fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                os.close(fd)
                break
            except FileExistsError:
                # Other clicks/workers wait on a local reservation, never refetch.
                if ready := await asyncio.to_thread(self.cached, owner, cache_id):
                    return ready, True
                if time.monotonic() >= deadline:
                    raise HTTPException(
                        504, "The PDF import timed out. Retry the preview."
                    )
                await asyncio.sleep(0.2)
        admitted = False
        try:
            if ready := await asyncio.to_thread(self.cached, owner, cache_id):
                return ready, True
            async with self._guard:
                now = time.monotonic()
                self._rates = {
                    key: times
                    for key, times in self._rates.items()
                    if times and times[-1] > now - 60
                }
                if owner not in self._rates and len(self._rates) >= 4096:
                    raise HTTPException(
                        429, "The preview service is busy. Try again shortly."
                    )
                times = self._rates.setdefault(owner, deque())
                while times and times[0] <= now - 60:
                    times.popleft()
                if (
                    len(times) >= self.settings.requests_per_minute
                    or self._active >= self.settings.concurrency
                ):
                    raise HTTPException(429, "Too many PDF imports. Try again shortly.")
                self._active += 1
                admitted = True
                times.append(now)
            await asyncio.to_thread(self.check_capacity, directory)
            try:
                return (
                    await asyncio.wait_for(
                        self._download(source, directory, cache_id),
                        timeout=self.settings.timeout_seconds,
                    ),
                    False,
                )
            except (asyncio.TimeoutError, httpx.TimeoutException) as exc:
                raise HTTPException(
                    504, "The PDF import timed out. Retry the preview."
                ) from exc
            except httpx.HTTPError as exc:
                # HTTPX errors can contain signed URLs or IPs: never expose them.
                raise HTTPException(
                    502,
                    "The document server could not provide this PDF. Open the original instead.",
                ) from exc
        finally:
            lock.unlink(missing_ok=True)
            if admitted:
                async with self._guard:
                    self._active -= 1

    async def _download(
        self, source: httpx.URL, directory: Path, cache_id: str
    ) -> CachedPdf:
        maximum = self.settings.max_mb * 1024 * 1024
        part: Optional[Path] = None
        current = source
        log_token = _importing_pdf.set(True)
        try:
            # No proxy environment, cookies, credentials, referrer, or connection
            # reuse between differently named hosts sharing an IP address.
            async with httpx.AsyncClient(
                trust_env=False,
                follow_redirects=False,
                timeout=httpx.Timeout(20, connect=10),
                limits=httpx.Limits(max_connections=1, max_keepalive_connections=0),
            ) as client:
                for hop in range(4):
                    pinned = await pinned_pdf_url(current)
                    client.cookies.clear()
                    async with client.stream(
                        "GET",
                        pinned,
                        headers={
                            "Host": current.netloc.decode("ascii"),
                            "Accept": "application/pdf, application/octet-stream;q=0.5",
                            "Accept-Encoding": "identity",
                            "User-Agent": "Chainlit-Document-Preview/1.0",
                        },
                        extensions={"sni_hostname": current.host},
                    ) as response:
                        if response.status_code in (301, 302, 303, 307, 308):
                            if hop == 3 or not response.headers.get("location"):
                                raise HTTPException(
                                    422, "This PDF link redirects too many times."
                                )
                            # Resolve against the original hostname, never the IP URL.
                            current = public_pdf_url(
                                str(current.join(response.headers["location"]))
                            )
                            continue
                        if response.status_code != 200:
                            raise HTTPException(
                                422,
                                "This PDF is unavailable or requires access. Open the original instead.",
                            )
                        mime = (
                            response.headers.get("content-type", "")
                            .split(";", 1)[0]
                            .strip()
                            .lower()
                        )
                        if mime not in (
                            "",
                            "application/pdf",
                            "application/octet-stream",
                        ):
                            raise HTTPException(
                                415, "This link does not provide a PDF document."
                            )
                        if response.headers.get(
                            "content-encoding", "identity"
                        ).lower() not in ("", "identity"):
                            raise HTTPException(
                                415, "This server returned an unsupported PDF encoding."
                            )
                        try:
                            length = int(response.headers.get("content-length", "0"))
                        except ValueError:
                            length = 0
                        if length > maximum:
                            raise HTTPException(
                                413,
                                f"This PDF exceeds the {self.settings.max_mb} MB preview limit.",
                            )
                        fd, filename = tempfile.mkstemp(dir=directory, suffix=".part")
                        os.close(fd)
                        part = Path(filename)
                        size = 0
                        prefix = b""
                        tail = b""
                        async with aiofiles.open(part, "wb") as output:
                            async for chunk in response.aiter_raw(chunk_size=65536):
                                size += len(chunk)
                                if size > maximum:
                                    raise HTTPException(
                                        413,
                                        f"This PDF exceeds the {self.settings.max_mb} MB preview limit.",
                                    )
                                prefix = (prefix + chunk)[:8]
                                if len(prefix) >= 8 and not re.match(
                                    rb"%PDF-\d\.\d", prefix
                                ):
                                    raise HTTPException(
                                        415, "This response is not a PDF document."
                                    )
                                tail = (tail + chunk)[-4096:]
                                await output.write(chunk)
                        if (
                            not re.match(rb"%PDF-\d\.\d", prefix)
                            or b"%%EOF" not in tail
                            or (length and length != size)
                        ):
                            raise HTTPException(
                                415, "This PDF is incomplete or invalid."
                            )
                        result = CachedPdf(
                            cache_id,
                            directory / f"{cache_id}.pdf",
                            pdf_filename(response, current),
                            size,
                            time.time() + self.settings.ttl_seconds,
                        )
                        os.replace(part, result.path)
                        part = None
                        fd, filename = tempfile.mkstemp(dir=directory, suffix=".part")
                        os.close(fd)
                        part = Path(filename)
                        part.write_text(
                            json.dumps(
                                {
                                    "filename": result.filename,
                                    "size": size,
                                    "expires_at": result.expires_at,
                                }
                            )
                        )
                        os.replace(part, directory / f"{cache_id}.json")
                        part = None
                        return result
            raise HTTPException(422, "This PDF link could not be imported.")
        finally:
            _importing_pdf.reset(log_token)
            if part:
                part.unlink(missing_ok=True)


_cache: Optional[ExternalPdfCache] = None


def get_external_pdf_cache() -> ExternalPdfCache:
    global _cache
    if _cache is None:
        _cache = ExternalPdfCache(
            FILES_DIRECTORY / "document-preview-imports", ExternalPdfSettings()
        )
    return _cache


async def close_external_pdf_cache():
    if _cache:
        await _cache.close()


router = APIRouter(prefix="/project/document-preview")


class ImportPdfRequest(BaseModel):
    url: str = Field(min_length=1, max_length=4096)


def authenticated_owner(current_user: Optional[User]) -> str:
    if current_user is None:
        raise HTTPException(401, "Sign in to preview external PDFs.")
    return current_user.identifier


@router.post("/imports")
async def import_external_pdf(
    body: ImportPdfRequest, current_user=Depends(get_current_user)
):
    owner = authenticated_owner(current_user)
    cache = get_external_pdf_cache()
    try:
        result, reused = await asyncio.wait_for(
            cache.import_pdf(owner, body.url),
            timeout=cache.settings.timeout_seconds + 15,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            504, "The PDF import timed out. Retry the preview."
        ) from exc
    except OSError as exc:
        raise HTTPException(
            503, "The PDF could not be stored. Try again later."
        ) from exc
    return {
        "id": result.id,
        "filename": result.filename,
        "size": result.size,
        "expires_at": result.expires_at,
        "cached": reused,
    }


@router.api_route("/imports/{cache_id}/file", methods=["GET", "HEAD"])
async def imported_pdf_file(cache_id: str, current_user=Depends(get_current_user)):
    owner = authenticated_owner(current_user)
    result = await asyncio.to_thread(get_external_pdf_cache().cached, owner, cache_id)
    if result is None:
        raise HTTPException(
            404,
            "This preview has expired or is unavailable. Reopen the preview to import it again.",
        )
    # Starlette serves 206/416 byte ranges locally; no remote request is made.
    # Identity encoding prevents GZipMiddleware from altering byte offsets.
    return FileResponse(
        result.path,
        media_type="application/pdf",
        filename=result.filename,
        content_disposition_type="attachment",
        headers={
            "Cache-Control": "private, no-store",
            "Content-Encoding": "identity",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Disposition, ETag",
            "Content-Security-Policy": "sandbox; default-src 'none'",
            "Vary": "Cookie, Authorization",
        },
    )


def register_external_pdf_preview(app: FastAPI):
    """Attach to an installed Chainlit app without changing site-packages.

    Older Chainlit versions end in a GET catch-all; append-only registration
    would still let that route shadow the cached file endpoint. Keep both
    preview routes ahead of it, and skip routes provided by a newer Chainlit.
    """
    from chainlit.config import config

    mounted = APIRouter(
        prefix=config.run.root_path, dependency_overrides_provider=app
    )
    mounted.include_router(router)
    missing = [
        route
        for route in mounted.routes
        if not any(
            getattr(existing, "path", None) == route.path
            and route.methods.issubset(getattr(existing, "methods", set()) or set())
            for existing in app.router.routes
        )
    ]
    if not missing:
        return
    app.router.routes = missing + app.router.routes
    app.openapi_schema = None
    original_lifespan = app.router.lifespan_context

    @asynccontextmanager
    async def preview_lifespan(application):
        async with original_lifespan(application) as state:
            try:
                yield state
            finally:
                await close_external_pdf_cache()

    app.router.lifespan_context = preview_lifespan
