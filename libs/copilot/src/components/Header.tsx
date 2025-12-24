import { WidgetContext } from '@/context';
import DashboardSidebarButton from '@/evoya/DashboardSidebarButton';
import EvoyaCreatorButton from '@/evoya/EvoyaCreatorButton';
import FavoriteSessionButton from '@/evoya/FavoriteSessionButton';
import ShareSessionButton from '@/evoya/ShareSessionButton';
import PrivacyShieldToggle from '@/evoya/privacyShield/PrivacyShieldToggle';
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

const sessionTokenKey = 'session_token';
interface Props {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  isPopup: boolean;
}

const Header = ({ expanded, setExpanded, isPopup }: Props): JSX.Element => {
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
            <DashboardSidebarButton/>
            {creatorEnabled && (
              <div className="h-9 flex items-center font-bold">Chat</div>
            )}
            {!creatorEnabled && (
              <>
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
        {evoya?.headerConfig?.showSessionButton && <NewChatButton />}
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
            <FavoriteSessionButton sessionUuid={sessionUuid} />
            <ShareSessionButton sessionUuid={sessionUuid} />
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
