import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, GraduationCap, Wrench } from 'lucide-react';
import { WidgetContext } from '@chainlit/copilot/src/context';
import {
  ChainlitContext,
  getScopedSessionStorageItem
} from '@chainlit/react-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
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
  panel: 'menu' | 'prompts' | 'projects' | Category;
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
    if (agentUuid)
      void request(controller.signal)
        .then(setConfiguration)
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              t(
                'components.molecules.configurationMenu.resources.loadError',
                'Unable to load agent settings. Reopen the menu to retry.'
              )
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
    setQuery('');
    setError('');
  }, [category, configuration]);

  const labels: Record<Category, string> = {
    dataSources: t(
      'components.molecules.configurationMenu.resources.dataSources',
      'Data Sources'
    ),
    skills: t(
      'components.molecules.configurationMenu.resources.skills',
      'Skills'
    ),
    tools: t('components.molecules.configurationMenu.resources.tools', 'Tools')
  };
  if (evoya?.type !== 'dashboard' || (panel !== 'menu' && !category))
    return null;
  const restricted = t(
    'components.molecules.configurationMenu.resources.privateOnly',
    'Only available for private agents. Manage these settings for team and curated agents on the agent edit page.'
  );
  const save = async () => {
    if (!category || !configuration?.canEdit || saving) return;
    setSaving(true);
    setError('');
    const controller = new AbortController();
    saveController.current = controller;
    try {
      const next = await request(controller.signal, { category, selected });
      if (controller.signal.aborted) return;
      setConfiguration(next);
      onCategoryChange(undefined);
    } catch {
      if (controller.signal.aborted) return;
      setError(
        t(
          'components.molecules.configurationMenu.resources.saveError',
          'Unable to save settings. Your changes have not been saved.'
        )
      );
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  };

  if (category && configuration) {
    const entries = configuration.groups[category];
    const dirty = entries.some(
      (entry) => entry.active !== selected.includes(entry.id)
    );
    return (
      <div className="w-full">
        <div className="border-b px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{labels[category]}</h3>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => {
                onCategoryChange(undefined);
                setError('');
              }}
            >
              {t(
                'components.molecules.configurationMenu.resources.back',
                'Back'
              )}
            </Button>
          </div>
          <Input
            aria-label={t(
              'components.molecules.configurationMenu.resources.search',
              'Search by title'
            )}
            placeholder={t(
              'components.molecules.configurationMenu.resources.search',
              'Search by title'
            )}
            className="h-10 rounded-xl border-transparent bg-white/55 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 md:text-sm"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1 [scrollbar-width:thin]">
          {entries
            .filter((entry) =>
              entry.name.toLowerCase().includes(query.trim().toLowerCase())
            )
            .map((entry) => (
              <label
                key={entry.id}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/70"
              >
                <Checkbox
                  checked={selected.includes(entry.id)}
                  disabled={
                    !configuration.canEdit ||
                    entry.editable === false ||
                    disabled ||
                    saving
                  }
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked === true
                        ? [...current, entry.id]
                        : current.filter((id) => id !== entry.id)
                    )
                  }
                />
                <span className="break-words text-sm">{entry.name}</span>
              </label>
            ))}
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
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2.5">
          {configuration.managementUrls[category] && (
            <a
              className="text-sm text-primary underline"
              href={configuration.managementUrls[category]}
            >
              {t(
                'components.molecules.configurationMenu.resources.manage',
                'Manage {{category}}',
                { category: labels[category] }
              )}
            </a>
          )}
          {configuration.canEdit && (
            <Button
              size="sm"
              disabled={disabled || saving || !dirty}
              onClick={() => void save()}
            >
              {saving
                ? t(
                    'components.molecules.configurationMenu.resources.saving',
                    'Saving…'
                  )
                : t(
                    'components.molecules.configurationMenu.resources.save',
                    'Save'
                  )}
            </Button>
          )}
        </div>
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
        const unavailable = disabled || !configuration?.available;
        return (
          <TooltipProvider key={key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={unavailable ? 0 : undefined} className="block">
                  <button
                    type="button"
                    disabled={unavailable}
                    className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
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
                    {labels[key]}
                  </button>
                </span>
              </TooltipTrigger>
              {unavailable && (
                <TooltipContent className="max-w-xs">
                  {configuration
                    ? restricted
                    : error ||
                      t(
                        'components.molecules.configurationMenu.resources.loading',
                        'Loading agent settings…'
                      )}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );
}
