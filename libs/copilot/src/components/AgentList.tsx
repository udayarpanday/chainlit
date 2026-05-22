import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Clock3,
  EllipsisVertical,
  Search,
  X,
  UserRound
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@chainlit/app/src/components/ui/button';
import { Input } from '@chainlit/app/src/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { Translator } from '@chainlit/app/src/components/i18n';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

export interface AgentListItem {
  id: string;
  name: string;
  agentUuid?: string;
  numericId?: number | string;
  userCanEdit?: boolean;
  showAgentMenu?: boolean;
  showEditAgentOption?: boolean;
  showTestChatOption?: boolean;
  isCurated?: boolean;
  isPinned?: boolean;
  isRecent?: boolean;
  isDefault?: boolean;
  sessionUuid?: string;
  isFavorite?: boolean;
}

interface AgentListProps {
  agents?: AgentListItem[];
  recentAgents?: AgentListItem[];
  selectedAgentId?: string;
  onSelectAgent?: (agent: AgentListItem) => void;
  onEditAgent?: (agent: AgentListItem) => void;
  onSetDefaultAgent?: (agent: AgentListItem) => void;
  onOpenTestChat?: (agent: AgentListItem) => void;
  onNewChat?: () => void;
  className?: string;
}

const sectionTitleClassName =
  'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

const truncateAgentName = (name: string, length = 30) =>
  name.length > length
    ? `${name.slice(0, length)}...`
    : name;

const AgentRow = ({
  agent,
  selected,
  showDefaultBadge = false,
  onEditAgent,
  onSetDefaultAgent,
  onOpenTestChat,
  onClick
}: {
  agent: AgentListItem;
  selected: boolean;
  showDefaultBadge?: boolean;
  onEditAgent?: (agent: AgentListItem) => void;
  onSetDefaultAgent?: (agent: AgentListItem) => void;
  onOpenTestChat?: (agent: AgentListItem) => void;
  onClick: () => void;
}) => {
  const canShowMenu = agent.showAgentMenu !== false;
  const canEditAgent =
    !!onEditAgent &&
    canShowMenu &&
    agent.showEditAgentOption !== false &&
    !agent.isCurated;
  const canSetDefaultAgent = !!onSetDefaultAgent && canShowMenu;
  const canOpenTestChat =
    !!onOpenTestChat && canShowMenu && agent.showTestChatOption !== false;
  const hasMenuItems = canEditAgent || canSetDefaultAgent || canOpenTestChat;

  return (
    <div
      className={cn(
        'group w-full h-11 rounded-xl px-3 flex items-center justify-between text-left transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 flex items-center gap-2.5"
      >
        <UserRound className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-base font-medium text-left">
          {truncateAgentName(agent.name,30)}
        </span>
      </button>
      <span className="flex items-center gap-2">
        {showDefaultBadge && agent.isDefault ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Translator path="agentList.default" />
          </span>
        ) : null}
        {hasMenuItems ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-accent"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-52 z-[10010] rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl"
            >
              {canEditAgent ? (
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  onClick={() => onEditAgent?.(agent)}
                >
                  <Translator path="agentList.edit_agent" />
                </DropdownMenuItem>
              ) : null}
              {canSetDefaultAgent ? (
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  onClick={() => onSetDefaultAgent?.(agent)}
                >
                  <Translator path="agentList.set_default_agent" />
                </DropdownMenuItem>
              ) : null}
              {canOpenTestChat ? (
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  onClick={() => onOpenTestChat?.(agent)}
                >
                  <Translator path="agentList.open_test_chat" />
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </span>
    </div>
  );
};


export default function AgentList({
  agents = [],
  recentAgents,
  selectedAgentId,
  onSelectAgent,
  onEditAgent,
  onSetDefaultAgent,
  onOpenTestChat,
  className
}: AgentListProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedAgent = useMemo(
    () =>
      agents.find((agent) => agent.id === selectedAgentId) ??
      recentAgents?.find((agent) => agent.id === selectedAgentId) ??
      agents[0],
    [agents, recentAgents, selectedAgentId]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredAgents = useMemo(() => {
    if (!normalizedQuery) return agents;
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(normalizedQuery)
    );
  }, [agents, normalizedQuery]);

  const recentSource = recentAgents ?? agents.filter((agent) => agent.isRecent);
  const recentList = recentSource.filter(
    (agent) =>
      !normalizedQuery ||
      agent.name.toLowerCase().includes(normalizedQuery)
  );
  const allAgents = filteredAgents.filter((agent) => !agent.isPinned);

  const handleSelect = (agent: AgentListItem) => {
    onSelectAgent?.(agent);
    setIsOpen(false);
  };

  const closeAgentList = () => setIsOpen(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('flex items-center gap-1.5', className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="border-primary text-primary hover:text-primary"
            onClick={(event) => {
              event.preventDefault();
              setIsOpen((open) => !open);
            }}
          >
            <UserRound className="h-4 w-4 text-primary" />
            <span className="md:max-w-[170px] max-w-0 md:block hidden truncate">
              {selectedAgent?.name ? truncateAgentName(selectedAgent.name,20) : ''}
            </span>
            <ChevronDown className="h-4 w-4 text-primary" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="z-[9999] w-[850px] max-w-[95vw] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.16)] max-md:fixed max-md:inset-0 max-md:h-[100dvh] max-md:w-screen max-md:max-w-none max-md:rounded-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('agentList.search')}
                className="h-10 rounded-xl border-transparent bg-white/55 pl-9 pr-3 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-transparent"
                autoFocus
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={closeAgentList}
              className="hidden h-10 w-10 rounded-xl border-none bg-transparent text-black shadow-none hover:bg-transparent hover:text-black max-md:inline-flex"
              aria-label={t('threadHistory.sidebar.actions.close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[560px] overflow-x-hidden overflow-y-auto max-md:max-h-[calc(100dvh-62px)] [scrollbar-color:rgba(148,163,184,0.8)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300">
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-[1.75fr_1fr]">
            <div className="space-y-4 p-3 md:border-r md:border-slate-200">
              <div className="space-y-1">
                <div className={cn(sectionTitleClassName, 'px-1')}>
                  <Translator path="agentList.all_agents" />
                </div>
                {allAgents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedAgent?.id}
                    showDefaultBadge
                    onEditAgent={onEditAgent}
                    onSetDefaultAgent={onSetDefaultAgent}
                    onOpenTestChat={onOpenTestChat}
                    onClick={() => handleSelect(agent)}
                  />
                ))}
                {!allAgents.length ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    <Translator path="agentList.no_agents" />
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1 p-3">
              <div
                className={cn(
                  sectionTitleClassName,
                  'flex items-center gap-2 px-1'
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />
                <Translator path="agentList.recent" />
              </div>
              {recentList.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  selected={agent.id === selectedAgent?.id}
                  showDefaultBadge
                  onEditAgent={onEditAgent}
                  onSetDefaultAgent={onSetDefaultAgent}
                  onOpenTestChat={onOpenTestChat}
                  onClick={() => handleSelect(agent)}
                />
              ))}
              {!recentList.length ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">
                  <Translator path="agentList.no_recent" />
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
