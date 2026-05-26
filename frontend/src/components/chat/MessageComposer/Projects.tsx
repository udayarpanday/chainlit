import { cn } from '@/lib/utils';
import { Check, FolderOpen, Search } from 'lucide-react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { WidgetContext } from '@chainlit/copilot/src/context';

import { Button } from '@/components/ui/button';
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
import Translator from '@/components/i18n/Translator';

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

interface ProjectListItem {
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
  isProjectSelected?: (projectUuid: string) => boolean;
  toggleProject?: (project: DashboardBridgeProject) => void;
  removeProject?: (projectUuid: string) => void;
  syncProjectContext?: () => void;
}

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

const getProjectId = (project: DashboardBridgeProject) =>
  project.uuid || project.project_uuid || project.projectUuid || project.id;

const getProjectName = (project: DashboardBridgeProject) =>
  project.name || project.title || project.project__name || 'Untitled Project';

const mapProject = (
  project: DashboardBridgeProject
): ProjectListItem | null => {
  const id = getProjectId(project);
  if (id === undefined || id === null) return null;

  return {
    id: String(id),
    name: getProjectName(project),
    description: project.description,
    raw: project
  };
};

const truncateProjectName = (name: string, length = 34) =>
  name.length > length ? `${name.slice(0, length)}...` : name;

const ProjectRow = ({
  project,
  selected,
  onClick
}: {
  project: ProjectListItem;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] transition-colors',
      selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/70'
    )}
  >
    <FolderOpen  className="h-4 w-4 shrink-0 text-foreground" />
    <span className="min-w-0 flex-1 truncate font-medium">
      {truncateProjectName(project.name, 36)}
    </span>
    {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
  </button>
);

interface Props {
  disabled?: boolean;
}

export default function Projects({ disabled = false }: Props) {
  const { evoya } = useContext(WidgetContext);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [bridgeFilteredProjects, setBridgeFilteredProjects] = useState<
    ProjectListItem[]
  >([]);
  const [selectedProjects, setSelectedProjects] = useState<ProjectListItem[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const syncFromBridge = useCallback(() => {
    const data = getBridgeData();
    if (!data) {
      setProjects([]);
      setBridgeFilteredProjects([]);
      setSelectedProjects([]);
      return;
    }

    const nextProjects = (data.getProjects?.() ?? data.projects ?? [])
      .map(mapProject)
      .filter((project): project is ProjectListItem => !!project);
    const nextSelectedProjects = (
      data.getSelectedProjects?.() ??
      data.selectedProjects ??
      []
    )
      .map(mapProject)
      .filter((project): project is ProjectListItem => !!project);
    const nextFilteredProjects = (
      data.getFilteredProjects?.() ??
      data.filteredProjects ??
      []
    )
      .map(mapProject)
      .filter((project): project is ProjectListItem => !!project);

    setProjects(nextProjects);
    setSelectedProjects(nextSelectedProjects);
    setBridgeFilteredProjects(nextFilteredProjects);
    setQuery(data.getProjectSearch?.() ?? data.projectSearch ?? '');
  }, []);

  useEffect(() => {
    if (evoya?.type !== 'dashboard') return;

    syncFromBridge();
    const handleProjectEvent = () => syncFromBridge();

    projectEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleProjectEvent);
    });

    return () => {
      projectEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleProjectEvent);
      });
    };
  }, [evoya?.type, syncFromBridge]);

  const normalizedQuery = query.trim().toLowerCase();
  const selectedProjectIds = useMemo(
    () => new Set(selectedProjects.map((project) => project.id)),
    [selectedProjects]
  );

  const visibleProjects = useMemo(() => {
    const source =
      bridgeFilteredProjects.length || !normalizedQuery
        ? bridgeFilteredProjects.length
          ? bridgeFilteredProjects
          : projects
        : projects;

    if (!normalizedQuery) return source;

    return source.filter(
      (project) =>
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.description?.toLowerCase().includes(normalizedQuery)
    );
  }, [bridgeFilteredProjects, normalizedQuery, projects]);

  const syncAfterBridgeAction = () => {
    window.setTimeout(syncFromBridge, 0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      syncAfterBridgeAction();
    }
  };

  const handleSearch = (value: string) => {
    const data = getBridgeData();
    setQuery(value);
    data?.setProjectSearch?.(value);
    syncAfterBridgeAction();
  };

  const handleToggleProject = (project: ProjectListItem) => {
    const data = getBridgeData();
    data?.toggleProject?.(project.raw);
    data?.syncProjectContext?.();
    syncAfterBridgeAction();
    setIsOpen(false);
  };

  if (
    evoya?.type !== 'dashboard'
  ) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id="projects-button"
                variant="ghost"
                size="icon"
                className={cn(
                  'relative',
                  'hover:bg-muted',
                  selectedProjects.length
                    &&'text-primary hover:text-primary'
                )}
                disabled={disabled}
              >
                <FolderOpen className="!size-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="components.molecules.project.title" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={14}
        className="z-[9999] w-[350px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search projects..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-base shadow-none focus-visible:ring-1 focus-visible:ring-primary/25 focus-visible:ring-offset-0 md:text-base"
            autoFocus
          />
        </div>

        <div className="mt-3 max-h-[280px] overflow-y-auto pb-1 [scrollbar-width:thin]">
          <div className="space-y-1">
            {visibleProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                selected={selectedProjectIds.has(project.id)}
                onClick={() => handleToggleProject(project)}
              />
            ))}
            {!visibleProjects.length ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                <Translator path="components.molecules.project.empty" />
              </p>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
