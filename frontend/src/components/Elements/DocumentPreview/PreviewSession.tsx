import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { ReactNode } from 'react';

type Settings = Record<string, number | string | boolean>;
type History = Record<string, Settings>;
const storageKey = 'evoya-preview-view-state-v1';
const maxFiles = 100;
declare global {
  var __evoyaPreviewHistory: Map<string, History> | undefined;
}
function history() {
  if (!globalThis.__evoyaPreviewHistory) {
    const values = new Map<string, History>();
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored))
        for (const [key, value] of stored.slice(-maxFiles)) {
          if (
            typeof key !== 'string' ||
            !/^[\da-f]+$/.test(key) ||
            !value ||
            typeof value !== 'object'
          )
            continue;
          const clean: History = Object.create(null);
          for (const [section, settings] of Object.entries(value).slice(
            0,
            12
          )) {
            if (
              !settings ||
              typeof settings !== 'object' ||
              !/^[\w.-]{1,40}$/.test(section)
            )
              continue;
            clean[section] = Object.fromEntries(
              Object.entries(settings)
                .filter(
                  ([name, item]) =>
                    /^[\w.-]{1,40}$/.test(name) &&
                    (typeof item === 'boolean' ||
                      (typeof item === 'number' &&
                        Number.isFinite(item) &&
                        Math.abs(item) < 1e9) ||
                      (typeof item === 'string' && item.length < 80))
                )
                .slice(0, 12)
            );
          }
          values.set(key, clean);
        }
    } catch {
      /* Session storage may be unavailable; the in-memory map still works. */
    }
    globalThis.__evoyaPreviewHistory = values;
    window.addEventListener('pagehide', flushHistory);
  }
  return globalThis.__evoyaPreviewHistory;
}
function flushHistory() {
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify([...history()].slice(-maxFiles))
    );
  } catch {
    /* Keep the in-memory history. */
  }
}
function fileKey(identity: string) {
  const url = new URL(identity, window.location.href);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (
      /^(token|access_token|signature|sig|expires|policy|credential|key-pair-id|x-amz-.+)$/i.test(
        key
      )
    )
      url.searchParams.delete(key);
  }
  url.searchParams.sort();
  // Hash only identity, never retain signed credentials or document contents.
  let a = 0xdeadbeef,
    b = 0x41c6ce57;
  for (const char of url.href) {
    a = Math.imul(a ^ char.charCodeAt(0), 2654435761);
    b = Math.imul(b ^ char.charCodeAt(0), 1597334677);
  }
  return (
    (a >>> 0).toString(16).padStart(8, '0') +
    (b >>> 0).toString(16).padStart(8, '0')
  );
}

export const defaultPreviewTheme = {
  dark: false,
  surface: '#ffffff',
  canvas: '#eef1f5',
  text: '#111827',
  border: '#d1d5db'
};
type PreviewTheme = typeof defaultPreviewTheme;
const ThemeContext = createContext<PreviewTheme>(defaultPreviewTheme);
const HistoryContext = createContext<
  | { value: History; save: (section: string, value: Settings) => void }
  | undefined
>(undefined);
export const usePreviewTheme = () => useContext(ThemeContext);

export function PreviewSession({
  identity,
  children
}: {
  identity: string;
  children: ReactNode;
}) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState(defaultPreviewTheme);
  const context = useMemo(() => {
    const key = fileKey(identity);
    const values = history();
    const value = values.get(key) || {};
    values.delete(key);
    values.set(key, value);
    while (values.size > maxFiles) values.delete(values.keys().next().value!);
    return {
      value,
      save: (section: string, settings: Settings) => {
        value[section] = settings;
      }
    };
  }, [identity]);
  useEffect(() => flushHistory, [context]);
  useLayoutEffect(() => {
    if (!root) return;
    const ancestors: Element[] = [];
    for (let node: Element | null = root; node;) {
      ancestors.push(node);
      node =
        node.parentElement || (node.getRootNode() as ShadowRoot).host || null;
    }
    const read = () => {
      const style = getComputedStyle(root);
      const dark =
        ancestors
          .find(
            (node) =>
              node.classList.contains('dark') ||
              node.classList.contains('light')
          )
          ?.classList.contains('dark') || false;
      const color = (name: string, fallback: string) => {
        const value = style.getPropertyValue(name).trim();
        return !value
          ? fallback
          : CSS.supports('color', value)
            ? value
            : 'hsl(' + value + ')';
      };
      const next = {
        dark,
        surface: color('--background', dark ? '#171717' : '#ffffff'),
        canvas: color('--muted', dark ? '#262626' : '#eef1f5'),
        text: color('--foreground', dark ? '#f1f5f9' : '#111827'),
        border: color('--border', dark ? '#525252' : '#d1d5db')
      };
      setTheme((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next
      );
    };
    read();
    const observer = new MutationObserver(read);
    ancestors.forEach((node) =>
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['class', 'style']
      })
    );
    return () => observer.disconnect();
  }, [root]);
  return (
    <div
      ref={setRoot}
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <HistoryContext.Provider value={context}>
        <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      </HistoryContext.Provider>
    </div>
  );
}

export function usePreviewSettings<T extends Settings>(
  section: string,
  defaults: T
) {
  const context = useContext(HistoryContext);
  const initial = useRef(
    Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => {
        const value = context?.value[section]?.[key];
        return [key, typeof value === typeof fallback ? value : fallback];
      })
    ) as T
  );
  const save = useCallback(
    (patch: Partial<T>) => {
      Object.assign(initial.current, patch);
      context?.save(section, { ...initial.current });
    },
    [context, section]
  );
  useEffect(() => flushHistory, []);
  return [initial.current, save] as const;
}

export function useRememberScroll(
  section: string,
  root: Element | null,
  ready = true
) {
  const [saved, save] = usePreviewSettings(section, { top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!root || !ready) return;
    root.scrollTo({ top: saved.top, left: saved.left });
    const record = () => save({ top: root.scrollTop, left: root.scrollLeft });
    root.addEventListener('scroll', record, { passive: true });
    return () => {
      record();
      root.removeEventListener('scroll', record);
      flushHistory();
    };
  }, [root, ready, save]);
}
