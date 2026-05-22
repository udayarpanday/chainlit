import { WidgetContext } from 'context';
import { Plus } from 'lucide-react';
import React, { useContext } from 'react';

import {
  ChainlitContext,
  useAudio,
  useAuth,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
import { Button } from '@/components/ui/button';

import { useIsMobile } from '@/hooks/use-mobile';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  newSession?: (sessionUuid?: string) => void;
}

const NewChatButton = ({ newSession }: Props) => {
  const { clear } = useChatInteract();
  const { evoya, setAccessToken } = useContext(WidgetContext);
  const apiClient = useContext(ChainlitContext);
  const { setUserFromAPI } = useAuth();

  const { endConversation, audioConnection } = useAudio();
  const isAudioOn = audioConnection === 'on';
  const isMobile = useIsMobile();

  const handleClickOpen = async () => {
    localStorage.removeItem('session_token');
    document.cookie =
      'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.dispatchEvent(new CustomEvent('copilot-new-session'));

    if (isAudioOn) {
      endConversation();
    }

    clear();

    if (evoya?.reset) {
      return;
    }

    if (evoya?.getEvoyaAccessToken && evoya?.chat_uuid) {
      try {
        const newAccessToken = await evoya.getEvoyaAccessToken(
          evoya.chat_uuid,
          undefined,
          {}
        );
        if (newAccessToken) {
          localStorage.setItem('chainlit_token', newAccessToken);
          setAccessToken(newAccessToken);
           apiClient
            .jwtAuth(newAccessToken)
            .then((res) => setUserFromAPI())
            .catch((err) => console.log(err));
        }
      } catch (error) {
        console.error('Failed to get new access token:', error);
      }
    }

    newSession?.('');
  };

  return (
    <div>
      <Button
        variant="outline"
        id="new-chat-button"
        onClick={handleClickOpen}
        className="text-[#7b809a] border-[#7b809a] hover:bg-[#7b809a]/10"
      >
        <Plus className="w-4 h-4" />
        {isMobile ? (
          <Translator path="components.molecules.newChatButton.newChat" />
        ) : (
          <Translator path="navigation.newChat.button" />
        )}
      </Button>
    </div>
  );
};

export default NewChatButton;
