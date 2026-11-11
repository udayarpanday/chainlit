import type { Workbook } from 'exceljs';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import scrollbarStyles from '../../../styles/scrollbars.css?raw';

import { validateOfficeArchive } from '../../../lib/loadDocument';
import {
  type SpreadsheetSelection,
  renderSpreadsheet,
  spreadsheetCss,
  spreadsheetTheme
} from '../../../lib/spreadsheetPreview';
import { Button } from '../../ui/button';
import { usePreviewSettings, useRememberScroll } from './PreviewSession';

const frameHtml = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>${scrollbarStyles}${spreadsheetCss}</style></head><body><div id="sheet"></div></body></html>`;

export default function SpreadsheetPreview({ data }: { data: ArrayBuffer }) {
  const [saved, save] = usePreviewSettings('workbook', { sheet: 0, zoom: 1 });
  const [workbook, setWorkbook] = useState<Workbook>();
  const [theme, setTheme] = useState<string[]>([]);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [sheet, setSheet] = useState(saved.sheet);
  const [scale, setScale] = useState(Math.max(0.5, Math.min(2, saved.zoom)));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [truncated, setTruncated] = useState(false);
  const [selection, setSelection] = useState<SpreadsheetSelection>({
    address: 'A1',
    value: ''
  });
  const worksheets = useMemo(
    () => workbook?.worksheets.filter((item) => item.state === 'visible') || [],
    [workbook]
  );

  useEffect(() => {
    let active = true;
    setWorkbook(undefined);
    setError(undefined);
    setReady(false);
    const timer = window.setTimeout(() => {
      active = false;
      setError(
        'This workbook took too long to open. Download the original instead.'
      );
    }, 30000);
    (async () => {
      const archive = await validateOfficeArchive(data, 'xlsx');
      const { default: ExcelJS } = await import('exceljs');
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(data);
      const colors = spreadsheetTheme(
        await archive.file('xl/theme/theme1.xml')?.async('text')
      );
      if (!book.worksheets.some((item) => item.state === 'visible'))
        throw new Error('This workbook has no visible worksheets.');
      if (active) {
        setSheet(
          Math.min(
            saved.sheet,
            book.worksheets.filter((item) => item.state === 'visible').length -
              1
          )
        );
        setTheme(colors);
        setWorkbook(book);
      }
    })()
      .catch(() => {
        if (active)
          setError(
            'This workbook could not be opened. Download the original instead.'
          );
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [data]);

  useEffect(() => {
    const document = frame?.contentDocument;
    const host = document?.getElementById('sheet');
    const worksheet = worksheets[sheet];
    if (!document || !host || !worksheet) return;
    try {
      const rendered = renderSpreadsheet(
        document,
        host,
        worksheet,
        theme,
        setSelection
      );
      setTruncated(rendered.truncated);
      setReady(true);
      frame?.contentWindow?.scrollTo(0, 0);
      return rendered.dispose;
    } catch (error) {
      console.warn('Worksheet preview failed', error);
      setError(
        'This worksheet could not be displayed. Download the original instead.'
      );
    }
  }, [frame, worksheets, sheet, theme]);

  useEffect(() => {
    frame?.contentDocument?.body.style.setProperty('zoom', String(scale));
  }, [frame, scale]);
  useEffect(() => save({ sheet, zoom: scale }), [sheet, scale, save]);
  useRememberScroll(
    'sheet-scroll',
    frame?.contentDocument?.scrollingElement || null,
    ready
  );

  if (error)
    return (
      <p role="alert" className="p-4 text-sm">
        {error}
      </p>
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white text-slate-900">
      <div
        className="flex h-9 shrink-0 items-center border-b border-slate-200 bg-white text-sm"
        aria-label="Formula bar"
      >
        <span
          className="w-16 shrink-0 border-r border-slate-200 text-center text-xs font-medium"
          aria-label="Selected cell"
        >
          {selection.address}
        </span>
        <span className="px-3 font-serif italic text-slate-400" aria-hidden>
          fx
        </span>
        <span
          className="min-w-0 flex-1 select-text truncate pr-3 text-xs"
          title={selection.value}
          aria-label="Cell value"
        >
          {selection.value}
        </span>
      </div>
      {!ready && (
        <p role="status" className="p-3 text-sm">
          Opening workbook…
        </p>
      )}
      <iframe
        title={`${worksheets[sheet]?.name || 'Workbook'} worksheet`}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={frameHtml}
        onLoad={(event) => setFrame(event.currentTarget)}
      />
      <div className="flex h-10 shrink-0 items-center border-t border-slate-200 bg-slate-50">
        <div
          className="flex min-w-0 flex-1 self-stretch overflow-x-auto"
          role="tablist"
          aria-label="Worksheets"
        >
          {worksheets.map((worksheet, index) => (
            <button
              key={worksheet.id}
              role="tab"
              aria-selected={index === sheet}
              tabIndex={index === sheet ? 0 : -1}
              className={`shrink-0 whitespace-nowrap border-r border-slate-200 px-4 text-xs transition-colors ${index === sheet ? 'border-b-2 border-b-emerald-600 bg-white font-semibold text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setSheet(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === 'ArrowRight'
                    ? (index + 1) % worksheets.length
                    : event.key === 'ArrowLeft'
                      ? (index + worksheets.length - 1) % worksheets.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? worksheets.length - 1
                          : undefined;
                if (next === undefined) return;
                event.preventDefault();
                setSheet(next);
                (
                  event.currentTarget.parentElement?.children[
                    next
                  ] as HTMLElement
                )?.focus();
              }}
            >
              {worksheet.name}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 px-1 text-xs">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Zoom out"
            disabled={scale <= 0.5}
            onClick={() => setScale((value) => Math.max(0.5, value - 0.1))}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="w-10 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Zoom in"
            disabled={scale >= 2}
            onClick={() => setScale((value) => Math.min(2, value + 0.1))}
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>
      </div>
      {truncated && (
        <div className="flex h-6 shrink-0 items-center border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
          Showing the first 500 rows and 50 columns
        </div>
      )}
    </div>
  );
}
