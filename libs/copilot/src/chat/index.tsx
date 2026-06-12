import { WidgetContext } from '@/context';
import { useContext, useEffect } from 'react';

import {
  setScopedSessionStorageItem,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';

import ChatBody from './body';

export default function ChatWrapper() {
  const { accessToken, evoya } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  const { sendMessage } = useChatInteract();
  const evoyaSessionUuid = evoya?.session_uuid || '';

  useEffect(() => {
    if (evoyaSessionUuid) {
      setScopedSessionStorageItem('session_token', evoyaSessionUuid);
      localStorage.removeItem('session_token');
      document.cookie =
        'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }, [evoyaSessionUuid]);

  useEffect(() => {
    if (session?.socket) return;
    connect({
      // @ts-expect-error window typing
      transports: window.transports,
      userEnv: {},
      accessToken: `Bearer ${accessToken}`,
      evoya: { session_uuid: evoyaSessionUuid }
    });
  }, [accessToken, connect, evoyaSessionUuid, session?.socket]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitMessage = sendMessage;
  }, [sendMessage]);

  return <ChatBody />;
}
