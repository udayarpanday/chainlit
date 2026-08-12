import { useEffect, useContext } from 'react';
import { WidgetContext } from '@/context';

const CreatorChat = (): JSX.Element => {
  const { config } = useContext(WidgetContext);

  useEffect(() => {
    const creatorContainer = document.getElementById(
      'copilot-embedded-container-creator'
    );
    const existingChatContainer = window.cl_shadowRootElement_container;
    const originalParent =
      existingChatContainer?.parentElement ??
      document.getElementById('copilot-embedded-container');

    if (!existingChatContainer) {
      fetch(`${config.apiBaseUrl}/api/agent/user/list/`)
        .then((response) => response.json())
        .then((agents) => {
          const defaultAgent = agents.find((agent) => agent.is_default).uuid;
          loadChatWithUuid(defaultAgent)
        })
    } else {
      creatorContainer?.appendChild(existingChatContainer);
    }

    return () => {
      const chatContainer = window.cl_shadowRootElement_container;
      const returnContainer =
        originalParent ?? document.getElementById('copilot-embedded-container');

      if (
        returnContainer?.isConnected &&
        chatContainer?.parentElement === creatorContainer
      ) {
        returnContainer.appendChild(chatContainer);
      }
    };
  }, [])

  const loadChatWithUuid = (uuid: string) => {
    window.unmountChainlitWidget();
    console.log(config, 'config');
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
        hideWaterMark: config?.hideWaterMark,
        additionalInfo: config?.additionalInfo,
        evoyaCreator: {
          enabled: true,
          initialEnabled: true
        },
        brand_color: config?.brand_color,
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
