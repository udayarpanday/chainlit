import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  Database,
  GraduationCap,
  Wrench
} from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WidgetContext } from '@chainlit/copilot/src/context';
import {
  ChainlitContext,
  getScopedSessionStorageItem
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

type Category = 'dataSources' | 'skills' | 'tools';
type Entry = { id: string; name: string; active: boolean; editable?: boolean };
type Configuration = {
  available: boolean;
  canEdit: boolean;
  groups: Record<Category, Entry[]>;
  managementUrls: Partial<Record<Category, string>>;
};

export default function AgentResourceSettings({
  disabled,
  panel,
  onCategoryChange
}: {
  disabled: boolean;
  panel: 'menu' | 'models' | 'prompts' | 'projects' | Category;
  onCategoryChange: (category?: Category) => void;
}) {
  const { t } = useTranslation();
  const { evoya, accessToken } = useContext(WidgetContext);
  const apiClient = useContext(ChainlitContext);
  const [configuration, setConfiguration] = useState<Configuration>();
  const category =
    panel === 'dataSources' || panel === 'skills' || panel === 'tools'
      ? panel
      : undefined;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ category: Category }>();
  const saveController = useRef<AbortController>();
  const agentUuid = evoya?.chat_uuid;
  const baseUrl = evoya?.api?.baseUrl?.replace(/\/$/, '');
  const path = `/api/agent/${encodeURIComponent(agentUuid ?? '')}/chat-configuration/`;
  const endpoint = baseUrl
    ? `${baseUrl}${path}`
    : apiClient.buildEndpoint(path);
  const token =
    accessToken ??
    getScopedSessionStorageItem('chainlit_token') ??
    getScopedSessionStorageItem('chainlit_token_iframe');
  const request = useCallback(
    async (signal: AbortSignal, body?: object) => {
      const response = await fetch(endpoint, {
        method: body ? 'POST' : 'GET',
        credentials: 'include',
        signal,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body
            ? {
                'Content-Type': 'application/json',
                'X-CSRFToken': evoya?.api?.csrf_token ?? ''
              }
            : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<Configuration>;
    },
    [endpoint, token, evoya?.api?.csrf_token]
  );

  useEffect(() => {
    const controller = new AbortController();
    saveController.current?.abort();
    setConfiguration(undefined);
    setError('');
    setSaving(false);
    setSaved(undefined);
    if (agentUuid)
      void request(controller.signal)
        .then(setConfiguration)
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              t('components.molecules.configurationMenu.resources.loadError')
            );
        });
    return () => {
      controller.abort();
      saveController.current?.abort();
    };
  }, [agentUuid, request, t]);

  useEffect(() => {
    if (!category || !configuration) return;
    setSelected(
      configuration.groups[category]
        .filter((entry) => entry.active)
        .map((entry) => entry.id)
    );
  }, [category, configuration]);

  useEffect(() => {
    setQuery('');
    setError('');
    setSaved(undefined);
  }, [category]);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(undefined), 3000);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const labels: Record<Category, string> = {
    dataSources: t(
      'components.molecules.configurationMenu.resources.dataSources'
    ),
    skills: t('components.molecules.configurationMenu.resources.skills'),
    tools: t('components.molecules.configurationMenu.resources.tools')
  };
  if (evoya?.type !== 'dashboard' || (panel !== 'menu' && !category))
    return null;
  const restricted = t(
    'components.molecules.configurationMenu.resources.readOnly',
    { defaultValue: "You don't have permission to change this selection." }
  );
  const save = async (nextSelected: string[]) => {
    if (
      !category ||
      !configuration?.canEdit ||
      !configuration.available ||
      disabled ||
      saving
    )
      return;
    const previousSelected = selected;
    setSelected(nextSelected);
    setSaving(true);
    setError('');
    setSaved(undefined);
    const controller = new AbortController();
    saveController.current = controller;
    try {
      const next = await request(controller.signal, {
        category,
        selected: nextSelected
      });
      if (controller.signal.aborted) return;
      setConfiguration(next);
      setSaved({ category });
    } catch {
      if (controller.signal.aborted) return;
      setSelected(previousSelected);
      setError(t('components.molecules.configurationMenu.resources.saveError'));
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  };

  if (category && configuration) {
    const entries = configuration.groups[category];
    return (
      <div className="w-full">
        <div className="border-b px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              aria-label={t('common.actions.back', { defaultValue: 'Back' })}
              onClick={() => {
                onCategoryChange(undefined);
                setError('');
              }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <h3 className="min-w-0 truncate font-medium">{labels[category]}</h3>
            <span
              role="status"
              aria-live="polite"
              className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            >
              {saved?.category === category ? (
                <>
                  <Check
                    className="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  {t('components.molecules.configurationMenu.resources.saved', {
                    defaultValue: 'Permanently saved'
                  })}
                </>
              ) : null}
            </span>
          </div>
          <Input
            aria-label={t(
              'components.molecules.configurationMenu.resources.search'
            )}
            placeholder={t(
              'components.molecules.configurationMenu.resources.search'
            )}
            className="h-10 rounded-xl border-transparent bg-white/55 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 md:text-sm"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">
          {entries
            .filter((entry) =>
              entry.name.toLowerCase().includes(query.trim().toLowerCase())
            )
            .map((entry) => {
              const readOnly =
                !configuration.available ||
                !configuration.canEdit ||
                entry.editable === false;
              const rowDisabled = readOnly || disabled || saving;
              const tooltipText = readOnly
                ? restricted
                : t(
                    'components.molecules.configurationMenu.resources.permanentChanges',
                    {
                      defaultValue: 'Changes are saved permanently.'
                    }
                  );
              return (
                <TooltipProvider key={entry.id} delayDuration={100}>
                  <Tooltip>
                    <label
                      aria-disabled={rowDisabled}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2',
                        rowDisabled
                          ? 'cursor-not-allowed text-muted-foreground'
                          : 'cursor-pointer hover:bg-accent/70'
                      )}
                      onClick={
                        rowDisabled
                          ? (event) => event.preventDefault()
                          : undefined
                      }
                    >
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex shrink-0"
                          tabIndex={readOnly ? 0 : undefined}
                          aria-label={
                            readOnly
                              ? `${entry.name}: ${restricted}`
                              : undefined
                          }
                        >
                          <Checkbox
                            aria-label={entry.name}
                            aria-description={tooltipText}
                            checked={selected.includes(entry.id)}
                            disabled={rowDisabled}
                            className={
                              rowDisabled ? 'pointer-events-none' : undefined
                            }
                            onCheckedChange={(checked) =>
                              void save(
                                checked === true
                                  ? [...selected, entry.id]
                                  : selected.filter((id) => id !== entry.id)
                              )
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <span className="break-words text-sm">{entry.name}</span>
                    </label>
                    <TooltipPortal
                      container={
                        window.cl_shadowRootElement?.isConnected
                          ? window.cl_shadowRootElement
                          : document.body
                      }
                    >
                      <TooltipContent
                        data-resource-tooltip
                        side="top"
                        align="start"
                        sideOffset={8}
                        className="z-[10000] max-w-xs"
                      >
                        {tooltipText}
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          {!entries.some((entry) =>
            entry.name.toLowerCase().includes(query.trim().toLowerCase())
          ) && (
            <p className="text-sm text-muted-foreground">
              {t('chat.input.no_results')}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {configuration.managementUrls[category] && (
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2.5">
            <a
              className="text-sm text-primary underline"
              href={configuration.managementUrls[category]}
            >
              {t('components.molecules.configurationMenu.resources.manage', {
                category: labels[category]
              })}
            </a>
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      {(['dataSources', 'skills', 'tools'] as const).map((key) => {
        const Icon = {
          dataSources: Database,
          skills: GraduationCap,
          tools: Wrench
        }[key];
        const unavailable = disabled || !configuration;
        const activeCount =
          configuration?.groups[key].filter((entry) => entry.active).length ??
          0;
        return (
          <div key={key} className="space-y-1 p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={unavailable ? 0 : undefined}
                    className="block"
                  >
                    <button
                      type="button"
                      disabled={unavailable}
                      className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] text-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={() => {
                        setSelected(
                          configuration!.groups[key]
                            .filter((entry) => entry.active)
                            .map((entry) => entry.id)
                        );
                        setQuery('');
                        setError('');
                        onCategoryChange(key);
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {labels[key]}
                      </span>
                      {activeCount > 0 ? (
                        <span className="shrink-0 text-xs text-primary">
                          {activeCount}
                        </span>
                      ) : null}
                    </button>
                  </span>
                </TooltipTrigger>
                {unavailable && (
                  <TooltipContent className="max-w-xs">
                    {error ||
                      t(
                        'components.molecules.configurationMenu.resources.loading'
                      )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      })}
    </>
  );
}
