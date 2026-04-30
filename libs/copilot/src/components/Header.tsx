import { WidgetContext } from '@/context';
import DashboardSidebarButton from '@/evoya/DashboardSidebarButton';
import EvoyaCreatorButton from '@/evoya/EvoyaCreatorButton';
import FavoriteSessionButton from '@/evoya/FavoriteSessionButton';
import ShareSessionButton from '@/evoya/ShareSessionButton';
import AgentList, { AgentListItem } from './AgentList';
import { Maximize2, Minimize, X } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useRecoilValue } from 'recoil';

import AudioPresence from '@chainlit/app/src/components/AudioPresence';
import { Logo } from '@chainlit/app/src/components/Logo';
import ChatProfiles from '@chainlit/app/src/components/header/ChatProfiles';
import NewChatButton from '@chainlit/app/src/components/header/NewChat';
import { Button } from '@chainlit/app/src/components/ui/button';
import { ChainlitContext } from '@chainlit/react-client';
import {
  evoyaCreatorEnabledState,
  firstUserInteraction
} from '@chainlit/react-client';
import {
  sessionIdState,
  useAudio,
  useChatData,
  useConfig
} from '@chainlit/react-client';
import ViewContext from '@/evoya/ViewContext';

const sessionTokenKey = 'session_token';

interface DashboardBridgeAgent {
  id?: number | string;
  chat__id?: number | string;
  chat__uuid?: string;
  chat_uuid?: string;
  chat__name?: string;
  name?: string;
  title?: string;
  agent_uuid?: string;
  uuid?: string;
  user_can_edit?: boolean | string;
  show_agent_menu?: boolean | string;
  show_edit_agent_option?: boolean | string;
  show_test_chat_option?: boolean | string;
  is_curated?: boolean | string;
  is_default?: boolean | string;
}

interface DashboardBridgeData {
  chatAgents?: DashboardBridgeAgent[];
  recent_agents?: DashboardBridgeAgent[];
  resumeChat?: (agentUuid: string, sessionUuid?: string | null, isFavorite?: boolean) => void;
}

declare global {
  interface Window {
    dashboardDataForModal?: () => DashboardBridgeData;
  }
}

interface Props {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  isPopup?: boolean;
}

const Header = ({ expanded, setExpanded, isPopup = false }: Props): JSX.Element => {
  const { loading } = useChatData();
  const { config } = useConfig();
  const { audioConnection } = useAudio();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);

  const apiClient = useContext(ChainlitContext);
  const { accessToken, evoya } = useContext(WidgetContext);
  const sessionId = useRecoilValue(sessionIdState);
  const firstInteraction = useRecoilValue(firstUserInteraction);

  const hasChatProfiles = !!config?.chatProfiles?.length;

  const [sessionUuid, setSessionUuid] = useState(evoya?.session_uuid ?? '');
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [recentAgents, setRecentAgents] = useState<AgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [optimisticDefaultAgentId, setOptimisticDefaultAgentId] = useState<string>();

  const mapBridgeAgentToItem = (agent: DashboardBridgeAgent): AgentListItem | null => {
    const toBoolean = (value: boolean | string | undefined) =>
      value === true || value === 'true';

    const agentUuid =
      agent.agent_uuid || agent.uuid || agent.chat__uuid || agent.chat_uuid;
    const numericId = agent.id ?? agent.chat__id;
    const label = agent.name || agent.title || agent.chat__name || 'Untitled Agent';
    if (!agentUuid && !numericId) return null;
    const id = String(agentUuid || numericId);
    return {
      id,
      name: label,
      agentUuid,
      numericId,
      userCanEdit: toBoolean(agent.user_can_edit),
      showAgentMenu:
        agent.show_agent_menu === undefined
          ? true
          : toBoolean(agent.show_agent_menu),
      showEditAgentOption:
        agent.show_edit_agent_option === undefined
          ? true
          : toBoolean(agent.show_edit_agent_option),
      showTestChatOption:
        agent.show_test_chat_option === undefined
          ? true
          : toBoolean(agent.show_test_chat_option),
      isCurated: toBoolean(agent.is_curated),
      isDefault: toBoolean(agent.is_default)
    };
  };

  const syncDashboardBridgeData = () => {
    if (evoya?.type !== 'dashboard' || !window.dashboardDataForModal) return;
    const data = window.dashboardDataForModal();
    
    let chatAgents = (data.chatAgents ?? [])
      .map(mapBridgeAgentToItem)
      .filter((agent): agent is AgentListItem => !!agent);

    const chatAgentsByUuid = new Map<string, AgentListItem>();
    chatAgents.forEach((agent) => {
      if (agent.agentUuid) {
        chatAgentsByUuid.set(agent.agentUuid, agent);
      }
    });

    const recentCandidate = (data.recent_agents ?? [])
      .map(mapBridgeAgentToItem)
      .filter((agent): agent is AgentListItem => !!agent);

    let recent = recentCandidate.map((recentAgent) => {
      if (recentAgent.agentUuid && chatAgentsByUuid.has(recentAgent.agentUuid)) {
        const canonicalAgent = chatAgentsByUuid.get(recentAgent.agentUuid)!;
        return {
          ...canonicalAgent,
          isDefault: canonicalAgent.isDefault || recentAgent.isDefault
        };
      }
      return recentAgent;
    });

    // Preserve order from server, while removing duplicate agents.
    const seenRecentIds = new Set<string>();
    recent = recent.filter((agent) => {
      if (seenRecentIds.has(agent.id)) return false;
      seenRecentIds.add(agent.id);
      return true;
    });

    // Keep UI stable while default-agent API is in flight.
    if (optimisticDefaultAgentId) {
      const hasOptimisticAgent = chatAgents.some(
        (agent) => agent.id === optimisticDefaultAgentId
      );
      if (hasOptimisticAgent) {
        chatAgents = chatAgents.map((agent) => ({
          ...agent,
          isDefault: agent.id === optimisticDefaultAgentId
        }));
        recent = recent.map((agent) => ({
          ...agent,
          isDefault: agent.id === optimisticDefaultAgentId
        }));
      }
    }

    setAgents(chatAgents);
    setRecentAgents(recent);

    const params = new URLSearchParams(window.location.search);
    const urlAgentUuid = params.get('agent_uuid');
    const defaultAgent = chatAgents.find((agent) => agent.isDefault) ?? chatAgents[0];

    setSelectedAgentId((prev) => {
      if (prev && chatAgents.some((agent) => agent.id === prev)) {
        return prev;
      }

      const fromUrl = chatAgents.find(
        (agent) => agent.agentUuid === urlAgentUuid || agent.id === urlAgentUuid
      );

      return fromUrl?.id ?? defaultAgent?.id;
    });

    // Clear optimistic lock once backend payload reflects the new default.
    if (optimisticDefaultAgentId) {
      const backendDefault = (data.chatAgents ?? [])
        .map(mapBridgeAgentToItem)
        .find((agent): agent is AgentListItem => !!agent && !!agent.isDefault);
      if (backendDefault?.id === optimisticDefaultAgentId) {
        setOptimisticDefaultAgentId(undefined);
      }
    }
  };

  const getSessionUuid = async () => {
    try {
      const sessionResponse = await apiClient.get(
        `/chat_session_uuid/${sessionId}/`,
        accessToken
      );
      const sessionJson = await sessionResponse.json();
      setSessionUuid(sessionJson.session_uuid);
      localStorage.setItem(sessionTokenKey, sessionJson.session_uuid);
      document.cookie = `${sessionTokenKey}=${sessionJson.session_uuid};path=/`;
    } catch (e) {
      return;
    }
  };

  useEffect(() => {
    if (!sessionUuid && firstInteraction && !loading) {
      getSessionUuid();
      window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
    }
  }, [firstInteraction, loading, evoya]);

  useEffect(() => {
    if (evoya?.type !== 'dashboard') return;
    syncDashboardBridgeData();
    const onReload = () => syncDashboardBridgeData();
    const onAgentChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        agent_uuid?: string;
        agent?: { uuid?: string; agent_uuid?: string };
      }>;
      const changedUuid =
        customEvent.detail?.agent_uuid ||
        customEvent.detail?.agent?.uuid ||
        customEvent.detail?.agent?.agent_uuid;

      if (!changedUuid) return;

      setSelectedAgentId((prev) => {
        const next = agents.find(
          (agent) => agent.agentUuid === changedUuid || agent.id === changedUuid
        );
        return next?.id ?? prev;
      });
    };

    window.addEventListener('reload-chat-sidebar', onReload);
    window.addEventListener('agent-changed', onAgentChanged as EventListener);
    return () => {
      window.removeEventListener('reload-chat-sidebar', onReload);
      window.removeEventListener('agent-changed', onAgentChanged as EventListener);
    };
  }, [evoya?.type, optimisticDefaultAgentId]);

  const handleAgentSelect = (agent: AgentListItem) => {
    setSelectedAgentId(agent.id);
    window.dispatchEvent(
      new CustomEvent('agent-changed', {
        detail: {
          agent_uuid: agent.agentUuid || agent.id,
          agent: {
            uuid: agent.agentUuid || agent.id,
            agent_uuid: agent.agentUuid || agent.id
          }
        }
      })
    );
  };

  const handleEditAgent = (agent: AgentListItem) => {
    if (!agent.numericId) return;
    window.location.href = `${location.origin}/chat/edit-chat/${agent.numericId}/`;
  };

  const handleOpenTestChat = (agent: AgentListItem) => {
    const agentUuid = agent.agentUuid || agent.id;
    window.open(`${location.origin}/chat/authorize-chat/${agentUuid}/`, '_blank');
  };

  const handleSetDefaultAgent = (agent: AgentListItem) => {
    setOptimisticDefaultAgentId(agent.id);

    const matches = (item: AgentListItem) => {
      if (agent.agentUuid && item.agentUuid) {
        return item.agentUuid === agent.agentUuid;
      }
      if (agent.numericId !== undefined && item.numericId !== undefined) {
        return String(item.numericId) === String(agent.numericId);
      }
      return item.id === agent.id;
    };

    setAgents((previous) =>
      previous.map((item) => ({
        ...item,
        isDefault: matches(item)
      }))
    );
    setRecentAgents((previous) =>
      previous.map((item) => ({
        ...item,
        isDefault: matches(item)
      }))
    );
    setSelectedAgentId(agent.id);
    window.dispatchEvent(
      new CustomEvent('agent-set-default-requested', {
        detail: {
          agent_uuid: agent.agentUuid || agent.id
        }
      })
    );
  };

  return (
    <div
      style={
        evoya.type !== 'dashboard'
          ? { backgroundColor: evoya.chainlitConfig.style.bgcolor }
          : {}
      }
      className={`flex align-center justify-between p-4 border-b border-[#f4f4f4]`}
    >
      <div className="flex items-center gap-3">
        {hasChatProfiles ? <ChatProfiles /> : ''}
        {evoya?.type === 'dashboard' ? (
          <>
            {!creatorEnabled && <DashboardSidebarButton/>}
            {creatorEnabled && (
              <div className="h-9 flex items-center font-bold">Chat</div>
            )}
            {!creatorEnabled && (
              <>
                <AgentList
                  agents={agents.length ? agents : undefined}
                  recentAgents={recentAgents}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={handleAgentSelect}
                  onEditAgent={handleEditAgent}
                  onSetDefaultAgent={handleSetDefaultAgent}
                  onOpenTestChat={handleOpenTestChat}
                />
                <NewChatButton />
              </>
            )}
          </>
        ) : evoya?.headerConfig && evoya?.headerConfig?.text_header ? (
          <div className="text-left leading-[1.25]">
            <h2
              className={evoya?.headerConfig?.text_header?.font || ''}
              style={{
                fontSize: evoya?.headerConfig?.text_header?.size,
                color: evoya?.headerConfig?.text_header?.color
              }}
            >
              {evoya?.headerConfig?.text_header?.title}
            </h2>
          </div>
        ) : (
          evoya?.logo && (
            <img src={evoya.logo} style={{ height: '25px', width: 'auto' }} />
          )
        )}
        {evoya?.headerConfig?.showSessionButton && <NewChatButton newSession={(sessionUuid) => setSessionUuid(sessionUuid ?? '')}/>}
      </div>
      <div className="flex items-center">
        {audioConnection === 'on' ? (
          <AudioPresence
            type="server"
            height={20}
            width={40}
            barCount={4}
            barSpacing={2}
          />
        ) : null}
        {evoya?.type === 'dashboard' && (
          <>
            <ViewContext/>
            {!creatorEnabled && (
              <>
                <FavoriteSessionButton sessionUuid={sessionUuid} />
                <ShareSessionButton sessionUuid={sessionUuid} />
              </>
            )}
          </>
        )}
        {!creatorEnabled && (
          <Button
            size="icon"
            variant="ghost"
            className={evoya?.type !== 'dashboard' && 'hover:bg-transparent'}
            onClick={() => {
              setExpanded(!expanded);
              window.dispatchEvent(new CustomEvent('copilot-open-modal'));
            }}
          >
            {expanded ? (
              <X
                className={`!size-5`}
                style={{
                  color:
                    evoya?.type !== 'dashboard' &&
                    evoya.chainlitConfig.style.color
                }}
              />
            ) : (
              !isPopup && (
                <Maximize2
                  className={`!size-5 `}
                  style={{
                    color:
                      evoya?.type !== 'dashboard' &&
                      evoya.chainlitConfig.style.color
                  }}
                />
              )
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
