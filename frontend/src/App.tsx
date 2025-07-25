import { useContext, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { router } from 'router';

import {
  ChainlitContext,
  useAuth,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import ChatSettingsModal from './components/ChatSettings';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

import { userEnvState } from 'state/user';

declare global {
  interface Window {
    cl_shadowRootElement?: HTMLDivElement;
    transports?: string[];
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  }
}

function App() {
  const { config } = useConfig();

  const apiClient = useContext(ChainlitContext);
  const userEnv = useRecoilValue(userEnvState);
  const { isAuthenticated, data, isReady, setUserFromAPI } = useAuth();
  const { connect, chatProfile, setChatProfile } = useChatSession();

  const configLoaded = !!config;

  const chatProfileOk = configLoaded
    ? config.chatProfiles.length
      ? !!chatProfile
      : true
    : false;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token =
      searchParams.get('access_token') ||
      localStorage.getItem('chainlit_token_iframe');
    apiClient
      .jwtAuth(token)
      .then((res) => setUserFromAPI())
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isReady || !chatProfileOk) {
      return;
    }

    connect({
      transports: window.transports,
      userEnv
    });
  }, [userEnv, isAuthenticated, connect, isReady, chatProfileOk]);

  useEffect(() => {
    if (
      !configLoaded ||
      !config ||
      !config.chatProfiles?.length ||
      chatProfile
    ) {
      return;
    }

    const defaultChatProfile = config.chatProfiles.find(
      (profile) => profile.default
    );

    if (defaultChatProfile) {
      setChatProfile(defaultChatProfile.name);
    } else {
      setChatProfile(config.chatProfiles[0].name);
    }
  }, [configLoaded, config, chatProfile, setChatProfile]);

  if (!configLoaded && isAuthenticated) return null;

  return (
    <ThemeProvider
      storageKey="vite-ui-theme"
      defaultTheme={data?.default_theme}
    >
      <Toaster richColors className="toast" position="top-right" />

      <ChatSettingsModal />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
