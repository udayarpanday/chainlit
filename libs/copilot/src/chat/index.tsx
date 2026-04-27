import { WidgetContext } from '@/context';
import { useContext, useEffect } from 'react';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import ChatBody from './body';

export default function ChatWrapper() {
  const { accessToken, evoya } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  const { sendMessage } = useChatInteract();

  useEffect(() => {
    if (evoya?.session_uuid) {
      localStorage.setItem('session_token', evoya.session_uuid);
    }
  }, [evoya?.session_uuid]);

  useEffect(() => {
    if (session?.socket?.connected) return;
    connect({
      // @ts-expect-error window typing
      transports: window.transports,
      userEnv: {},
      accessToken: `Bearer ${accessToken}`,
      evoya
    });
  }, [accessToken, connect, evoya, evoya?.session_uuid]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitMessage = sendMessage;
  }, [sendMessage]);

  return <ChatBody />;
}
