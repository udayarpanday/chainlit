import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  FilePen,
  FolderOpen,
  Lock,
  type LucideIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  StickyNote,
  X
} from 'lucide-react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';

import { WidgetContext } from '@chainlit/copilot/src/context';
import { usePrivacyShield } from '@chainlit/copilot/src/evoya/privacyShield/usePrivacyShield';
import { ICommand, commandsState } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { useIsMobile } from '@/hooks/use-mobile';

type Panel = 'menu' | 'prompts' | 'projects';
type ProjectId = string | number;

interface DashboardBridgeProject {
  id?: ProjectId;
  uuid?: string;
  project_uuid?: string;
  projectUuid?: string;
  name?: string;
  title?: string;
  project__name?: string;
  description?: string;
  slug?: string;
  [key: string]: unknown;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  raw: DashboardBridgeProject;
}

interface DashboardProjectBridgeData {
  projects?: DashboardBridgeProject[];
  selectedProjects?: DashboardBridgeProject[];
  filteredProjects?: DashboardBridgeProject[];
  projectSearch?: string;
  getProjects?: () => DashboardBridgeProject[];
  getSelectedProjects?: () => DashboardBridgeProject[];
  getFilteredProjects?: () => DashboardBridgeProject[];
  getProjectSearch?: () => string;
  setProjectSearch?: (query: string) => void;
  toggleProject?: (project: DashboardBridgeProject) => void;
  removeProject?: (projectUuid: string) => void;
  syncProjectContext?: () => void;
}

interface Props {
  disabled?: boolean;
  isProjectAccessible?: boolean;
  openProjectsRequest?: number;
  onSelectedProjectsChange?: (projects: ProjectListItem[]) => void;
  selectedCommand?: PromptCommand;
  onCommandSelect: (command: PromptCommand) => void;
}

type PromptCommand = ICommand & {
  prompt_content?: string;
};

type PrivacyShieldConfig = {
  enabled?: boolean;
  autoEnable?: boolean;
  privacyAgent?: string;
};

const projectEvents = [
  'reload-chat-sidebar',
  'project-changed',
  'projects-changed',
  'project-context-changed',
  'project-picker-changed'
];

const getBridgeData = () => {
  if (typeof window === 'undefined') return undefined;
  const dashboardWindow = window as Window & {
    dashboardDataForModal?: () => DashboardProjectBridgeData;
  };
  return dashboardWindow.dashboardDataForModal?.();
};

export const removeDashboardProject = (project: ProjectListItem) => {
  const data = getBridgeData();
  if (data?.removeProject) {
    data.removeProject(project.id);
  } else {
    data?.toggleProject?.(project.raw);
  }
  data?.syncProjectContext?.();
  window.setTimeout(
    () => window.dispatchEvent(new Event('project-context-changed')),
    0
  );
};

const getProjectId = (project: DashboardBridgeProject) =>
  project.uuid || project.project_uuid || project.projectUuid || project.id;

const getProjectName = (
  project: DashboardBridgeProject,
  untitledProject: string
) => project.name || project.title || project.project__name || untitledProject;

const mapProject = (
  project: DashboardBridgeProject,
  untitledProject: string
): ProjectListItem | null => {
  const id = getProjectId(project);
  if (id === undefined || id === null) return null;

  return {
    id: String(id),
    name: getProjectName(project, untitledProject),
    description: project.description,
    raw: project
  };
};

const truncateProjectName = (name: string, length = 36) =>
  name.length > length ? `${name.slice(0, length)}...` : name;

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)|(\${1})/g;

  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) return codeBlock;
      if (squareBracket) return `$$\n${squareBracket}\n$$`;
      if (roundBracket) return `$${roundBracket}$`;
      return match;
    }
  );
}

function MenuRow({
  active,
  disabled,
  icon: Icon,
  label,
  status,
  onClick
}: {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  status?: string | number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] transition-colors',
        active ? 'text-primary' : 'text-foreground',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:bg-accent focus:bg-accent focus:outline-none'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {status !== undefined ? (
        <span className="shrink-0 text-xs text-primary">{status}</span>
      ) : null}
    </button>
  );
}

export default function ConfigurationMenu({
  disabled = false,
  isProjectAccessible = false,
  openProjectsRequest = 0,
  onSelectedProjectsChange,
  selectedCommand,
  onCommandSelect
}: Props) {
  const { t } = useTranslation();
  const { evoya } = useContext(WidgetContext);
  const commands = useRecoilValue(commandsState) as PromptCommand[];
  const isMobile = useIsMobile();
  const {
    enabled: privacyEnabled,
    setEnabled: setPrivacyEnabled,
    enabledVisual,
    setEnabledVisual,
    sections
  } = usePrivacyShield();
  const [open, setOpen] = useState(false);
  const [configurationTooltipOpen, setConfigurationTooltipOpen] =
    useState(false);
  const [panel, setPanel] = useState<Panel>('menu');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [bridgeFilteredProjects, setBridgeFilteredProjects] = useState<
    ProjectListItem[]
  >([]);
  const [selectedProjects, setSelectedProjects] = useState<ProjectListItem[]>(
    []
  );
  const [projectQuery, setProjectQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PromptCommand[]>([]);
  const [hoveredCommand, setHoveredCommand] = useState<PromptCommand | null>(
    null
  );
  const promptInputRef = useRef<HTMLInputElement>(null);
  const autoEnabledAgentRef = useRef<string | undefined>();

  const isDashboard = evoya?.type === 'dashboard';
  const hasPrompts = isDashboard && commands.length > 0;
  const hasProjects = isDashboard && isProjectAccessible;
  const hasCreator = !!evoya?.evoyaCreator?.enabled;
  const privacyShieldConfig = evoya?.api?.privacyShield as
    | PrivacyShieldConfig
    | undefined;
  const hasPrivacy = !!privacyShieldConfig?.enabled;
  const hasActions = hasPrompts || hasProjects || hasCreator || hasPrivacy;

  const syncProjectsFromBridge = useCallback(() => {
    const untitledProject = t(
      'components.molecules.configurationMenu.untitledProject'
    );
    const data = getBridgeData();
    if (!data) {
      setProjects([]);
      setBridgeFilteredProjects([]);
      setSelectedProjects([]);
      onSelectedProjectsChange?.([]);
      return;
    }

    const nextProjects = (data.getProjects?.() ?? data.projects ?? [])
      .map((project) => mapProject(project, untitledProject))
      .filter((project): project is ProjectListItem => !!project);
    const nextSelectedProjects = (
      data.getSelectedProjects?.() ??
      data.selectedProjects ??
      []
    )
      .map((project) => mapProject(project, untitledProject))
      .filter((project): project is ProjectListItem => !!project);
    const nextFilteredProjects = (
      data.getFilteredProjects?.() ??
      data.filteredProjects ??
      []
    )
      .map((project) => mapProject(project, untitledProject))
      .filter((project): project is ProjectListItem => !!project);

    setProjects(nextProjects);
    setSelectedProjects(nextSelectedProjects);
    onSelectedProjectsChange?.(nextSelectedProjects);
    setBridgeFilteredProjects(nextFilteredProjects);
    setProjectQuery(data.getProjectSearch?.() ?? data.projectSearch ?? '');
  }, [onSelectedProjectsChange, t]);

  useEffect(() => {
    setSearchResults(commands);
  }, [commands]);

  useEffect(() => {
    if (!hasProjects) return;

    syncProjectsFromBridge();
    const handleProjectEvent = () => syncProjectsFromBridge();

    projectEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleProjectEvent);
    });

    return () => {
      projectEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleProjectEvent);
      });
    };
  }, [hasProjects, syncProjectsFromBridge]);

  useEffect(() => {
    if (!hasProjects || openProjectsRequest === 0) return;

    setPanel('projects');
    setOpen(true);
    window.setTimeout(syncProjectsFromBridge, 0);
  }, [hasProjects, openProjectsRequest, syncProjectsFromBridge]);

  useEffect(() => {
    if (!open || panel !== 'prompts') return;

    window.setTimeout(() => promptInputRef.current?.focus(), 100);
  }, [open, panel]);

  useEffect(() => {
    const autoEnable = privacyShieldConfig?.autoEnable;
    const privacyAgent = privacyShieldConfig?.privacyAgent ?? 'default';

    if (!autoEnable || autoEnabledAgentRef.current === privacyAgent) return;

    autoEnabledAgentRef.current = privacyAgent;
    setPrivacyEnabled(true);
  }, [
    privacyShieldConfig?.autoEnable,
    privacyShieldConfig?.privacyAgent,
    setPrivacyEnabled
  ]);

  const normalizedProjectQuery = projectQuery.trim().toLowerCase();
  const selectedProjectIds = useMemo(
    () => new Set(selectedProjects.map((project) => project.id)),
    [selectedProjects]
  );

  const visibleProjects = useMemo(() => {
    const source =
      bridgeFilteredProjects.length || !normalizedProjectQuery
        ? bridgeFilteredProjects.length
          ? bridgeFilteredProjects
          : projects
        : projects;

    if (!normalizedProjectQuery) return source;

    return source.filter(
      (project) =>
        project.name.toLowerCase().includes(normalizedProjectQuery) ||
        project.description?.toLowerCase().includes(normalizedProjectQuery)
    );
  }, [bridgeFilteredProjects, normalizedProjectQuery, projects]);

  const displayedCommand =
    hoveredCommand || selectedCommand || searchResults[0] || null;

  const dismissConfigurationTooltip = () => setConfigurationTooltipOpen(false);

  const openPanel = (nextPanel: Panel) => {
    dismissConfigurationTooltip();
    setPanel(nextPanel);
    setOpen(true);
    if (nextPanel === 'projects') {
      window.setTimeout(syncProjectsFromBridge, 0);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    dismissConfigurationTooltip();
    setOpen(nextOpen);
    if (!nextOpen) {
      setPanel('menu');
      setHoveredCommand(null);
      setSearchResults(commands);
      return;
    }

    if (panel === 'projects') {
      window.setTimeout(syncProjectsFromBridge, 0);
    }
  };

  const handlePromptSearch = (value: string) => {
    if (!value.trim()) {
      setSearchResults(commands);
      return;
    }

    const normalizedValue = value.toLowerCase();
    setSearchResults(
      commands.filter(
        (command) =>
          command.id.toLowerCase().includes(normalizedValue) ||
          command.description?.toLowerCase().includes(normalizedValue) ||
          command.prompt_content?.toLowerCase().includes(normalizedValue)
      )
    );
  };

  const handleProjectSearch = (value: string) => {
    const data = getBridgeData();
    setProjectQuery(value);
    data?.setProjectSearch?.(value);
    window.setTimeout(syncProjectsFromBridge, 0);
  };

  const handleToggleProject = (project: ProjectListItem) => {
    dismissConfigurationTooltip();
    const data = getBridgeData();
    data?.toggleProject?.(project.raw);
    data?.syncProjectContext?.();
    window.setTimeout(syncProjectsFromBridge, 0);
    setOpen(false);
  };

  const handleOpenCreator = () => {
    dismissConfigurationTooltip();
    const restoreContent = localStorage.getItem('evoya-creator');
    const creatorWindow = window as Window & {
      openEvoyaCreator?: (
        message: { output: string },
        config: { type: string; brand_color?: string }
      ) => void;
    };

    if (restoreContent) {
      const restoreContentObj = JSON.parse(restoreContent);
      creatorWindow.openEvoyaCreator?.(
        { output: escapeBrackets(restoreContentObj.content) },
        {
          type: restoreContentObj.type,
          brand_color: evoya?.brand_color ?? undefined
        }
      );
    } else {
      creatorWindow.openEvoyaCreator?.(
        { output: '' },
        { type: 'markdown', brand_color: evoya?.brand_color ?? undefined }
      );
    }

    setOpen(false);
  };

  if (!hasActions) return null;

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <TooltipProvider delayDuration={100}>
          <Tooltip
            open={configurationTooltipOpen && !open}
            onOpenChange={(nextOpen) =>
              setConfigurationTooltipOpen(nextOpen && !open)
            }
          >
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  id="chat-input-configuration-button"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted"
                  disabled={disabled}
                  onPointerDown={dismissConfigurationTooltip}
                  onClick={() => {
                    dismissConfigurationTooltip();
                    setPanel('menu');
                  }}
                >
                  <SlidersHorizontal className="!size-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            {configurationTooltipOpen && !open ? (
              <TooltipContent>
                {t('components.molecules.configurationMenu.title')}
              </TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>

        <PopoverContent
          onCloseAutoFocus={(event) => event.preventDefault()}
          align={isMobile ? 'center' : 'start'}
          side="top"
          sideOffset={12}
          className={cn(
            'focus:outline-none p-0',
            panel === 'menu'
              ? 'w-[300px]'
              : panel === 'projects'
              ? 'w-[27vw] min-w-[320px] overflow-hidden p-0'
              : 'w-[50vw] min-w-[320px]'
          )}
          style={{
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? '-82vh' : '-10px',
            right: isMobile ? 'auto' : '-5px',
            left: isMobile ? '45px' : 'auto',
            transform: 'none',
            zIndex: 50
          }}
        >
          {panel === 'menu' ? (
            <div className="space-y-1 p-1">
              <MenuRow
                icon={StickyNote}
                label={t(
                  'components.molecules.configurationMenu.promptLibrary'
                )}
                active={!!selectedCommand}
                disabled={!hasPrompts || disabled}
                onClick={() => openPanel('prompts')}
              />
              <MenuRow
                icon={FolderOpen}
                label={t('components.molecules.project.title')}
                active={selectedProjects.length > 0}
                status={
                  selectedProjects.length ? selectedProjects.length : undefined
                }
                disabled={!hasProjects || disabled}
                onClick={() => openPanel('projects')}
              />
              <MenuRow
                icon={FilePen}
                label={t('components.molecules.evoyaCreatorButton.label')}
                disabled={!hasCreator || disabled}
                onClick={handleOpenCreator}
              />
              <MenuRow
                icon={ShieldCheck}
                label={t('components.organisms.privacyShield.title')}
                active={privacyEnabled}
                status={
                  privacyEnabled
                    ? t('components.molecules.configurationMenu.enabled')
                    : undefined
                }
                disabled={!hasPrivacy || disabled}
                onClick={() => {
                  dismissConfigurationTooltip();
                  setPrivacyEnabled(!privacyEnabled);
                }}
              />
            </div>
          ) : null}

          {panel === 'prompts' ? (
            <div className="w-full">
              <Command className="rounded-xl p-0 [&_[cmdk-input-wrapper]:focus-within]:ring-1 [&_[cmdk-input-wrapper]:focus-within]:ring-primary/20 [&_[cmdk-input-wrapper]]:h-10 [&_[cmdk-input-wrapper]]:rounded-xl [&_[cmdk-input-wrapper]]:border [&_[cmdk-input-wrapper]]:border-transparent [&_[cmdk-input-wrapper]]:bg-white/55 [&_[cmdk-input-wrapper]]:px-3 [&_[cmdk-input-wrapper]]:shadow-sm [&_[cmdk-input-wrapper]_svg]:text-slate-400 [&_[cmdk-input-wrapper]_svg]:opacity-100">
                <div className="border-b px-3 py-2.5">
                  <CommandInput
                    ref={promptInputRef}
                    placeholder={t(
                      'components.molecules.configurationMenu.searchPrompts'
                    )}
                    className="h-10 px-0 py-0 text-base md:text-sm"
                    onValueChange={handlePromptSearch}
                    autoFocus
                  />
                </div>
                <CommandList className="max-h-[60vh] md:max-h-[300px] !overflow-hidden">
                  <CommandEmpty>{t('chat.input.no_results')}</CommandEmpty>
                  <div className="flex flex-col md:flex-row">
                    <CommandGroup className="h-[280px] w-full overflow-auto p-2 md:w-[500px]">
                      {searchResults.map((command) => (
                        <CommandItem
                          key={command.id}
                          onSelect={() => {
                            dismissConfigurationTooltip();
                            onCommandSelect(command);
                            setPanel('menu');
                            setHoveredCommand(null);
                            setSearchResults(commands);
                            setOpen(false);
                          }}
                          className="command-item cursor-pointer justify-between rounded-md px-3 py-3"
                          onMouseEnter={() => setHoveredCommand(command)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {command.id}
                            </div>
                            <div className="truncate text-xs font-light">
                              {command.description}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {searchResults.length > 0 && !isMobile ? (
                      <div className="h-[280px] w-full overflow-auto border-t-2 md:border-l md:border-t-0">
                        <div className="flex-1 p-2">
                          <div className="relative rounded-md bg-gray-50 p-4">
                            <p className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                              {displayedCommand?.prompt_content ||
                                t(
                                  'components.molecules.configurationMenu.promptPreview'
                                )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CommandList>
              </Command>
            </div>
          ) : null}

          {panel === 'projects' ? (
            <div>
              <div className="border-b px-3 py-2.5">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={projectQuery}
                    onChange={(event) =>
                      handleProjectSearch(event.target.value)
                    }
                    placeholder={t(
                      'components.molecules.configurationMenu.searchProjects'
                    )}
                    className="h-10 rounded-xl border-transparent bg-white/55 pl-9 pr-3 text-base shadow-sm focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0 md:text-sm"
                    autoFocus={!isMobile}
                  />
                </div>
              </div>

              <div className="max-h-[280px] overflow-y-auto p-2 [scrollbar-width:thin]">
                <div className="space-y-1">
                  {visibleProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleToggleProject(project)}
                      aria-pressed={selectedProjectIds.has(project.id)}
                      className={cn(
                        'group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] transition-colors',
                        selectedProjectIds.has(project.id)
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/70'
                      )}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0 text-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {truncateProjectName(project.name)}
                      </span>
                      {selectedProjectIds.has(project.id) ? (
                        <X className="h-4 w-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  ))}
                  {!visibleProjects.length ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      {t('components.molecules.project.empty')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {selectedProjects.length > 0 ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-muted hover:text-primary"
                onClick={() => openPanel('projects')}
                disabled={disabled}
              >
                <FolderOpen className="!size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('components.molecules.project.title')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}

      {hasPrivacy && privacyEnabled ? (
        <>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-muted hover:text-primary"
                  onClick={() => setPrivacyEnabled(false)}
                  disabled={disabled}
                  aria-pressed={privacyEnabled}
                >
                  <Lock className="!size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('components.molecules.configurationMenu.privacyActive')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted"
                  onClick={() => setEnabledVisual(!enabledVisual)}
                  disabled={disabled || sections.length === 0}
                >
                  {enabledVisual ? (
                    <EyeOff className="!size-5" />
                  ) : (
                    <Eye className="!size-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {enabledVisual
                  ? t(
                      'components.molecules.configurationMenu.hideAnonymizedText'
                    )
                  : t(
                      'components.molecules.configurationMenu.showAnonymizedText'
                    )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : null}
    </div>
  );
}
