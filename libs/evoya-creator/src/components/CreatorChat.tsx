import { useEffect, useContext, useState } from 'react';
import { WidgetContext } from '@/context';

const CreatorChat = (): JSX.Element => {
  const { config } = useContext(WidgetContext);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!window.cl_shadowRootElement_container) {
      fetch(`${config.apiBaseUrl}/api/agent/user/list/`)
        .then((response) => response.json())
        .then((agents) => {
          setAgents(agents);
          const defaultAgent = agents.find((agent) => agent.is_default).uuid;
          setSelectedAgent(defaultAgent)
          loadChatWithUuid(defaultAgent)
        })
    } else {
      document.getElementById('copilot-embedded-container-creator')?.appendChild(window.cl_shadowRootElement_container)
    }
  }, [])

  const loadChatWithUuid = (uuid: string) => {
    window.unmountChainlitWidget();
    setTimeout(() => window.initCopilotChat(
      {
        chat_uuid: uuid,
        container: document.getElementById('copilot-embedded-container-creator'),
        session_uuid: null,
        reset: true,
        type: 'dashboard',
        is_favorite: false,
        csrf_token: config.csrfToken,
        // overlay: this.overlayOpen,
        privacyShield: {
          enabled: false
        },
        evoyaCreator: {
          enabled: true,
          initialEnabled: true
        },
        speechToText: true,
        workspace_id: config.workspaceId
      }
    ), 200);
  }

  return (
    <>
      <div id="copilot-embedded-container-creator" style={{ width: "100%", height: "100%" }}></div>
    </>
  )
};

export default CreatorChat;
