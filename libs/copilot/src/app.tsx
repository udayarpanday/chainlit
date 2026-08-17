import { useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import {
  ChainlitContext,
  configState,
  evoyaCreatorEnabledState,
  useAuth,
  useChatInteract
} from '@chainlit/react-client';

import { useCopilotInteract } from './hooks/useCopilotInteract';

import { ThemeProvider } from './ThemeProvider';
import { WidgetContext } from './context';
import {
  COPILOT_THREAD_CHANGED_EVENT_KEY,
  CopilotThreadChangedEventParams
} from './state';
import WidgetEmbedded from './widgetEmbed';

interface Props {
  widgetConfig: IWidgetConfig;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    toggleChainlitCopilot: () => void;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    getChainlitCopilotThreadId: () => string | null;
    clearChainlitCopilotThreadId: (newThreadId?: string) => void;
  }
}

export default function App({ widgetConfig }: Props) {
  const { isAuthenticated, data, setUserFromAPI, setUser } = useAuth();
  const [config, setConfig] = useRecoilState(configState);
  const [, setCreatorEnabled] = useRecoilState(evoyaCreatorEnabledState);
  const { evoya } = useContext(WidgetContext);
  const apiClient = useContext(ChainlitContext);
  const { i18n } = useTranslation();
  const { startNewChat } = useCopilotInteract();
  const { clear } = useChatInteract();
  const languageInUse =
    evoya?.locale || widgetConfig.language || navigator.language || 'en-US';
  const [authError, setAuthError] = useState<string>();
  const [fetchError, setFetchError] = useState<string>();

  useEffect(() => {
    const disableCreatorMode = () => setCreatorEnabled(false);
    const enableCreatorMode = () => setCreatorEnabled(true);

    window.addEventListener('disable-creator-mode', disableCreatorMode);
    window.addEventListener('enable-creator-mode', enableCreatorMode);

    return () => {
      window.removeEventListener('disable-creator-mode', disableCreatorMode);
      window.removeEventListener('enable-creator-mode', enableCreatorMode);
    };
  }, [setCreatorEnabled]);

  useEffect(() => {
    if (evoya?.reset) {
      clear();
    }
  }, [evoya]);

  useEffect(() => {
    if (config && config?.ui && config?.ui?.cot !== 'full') {
      setConfig({
        ...config,
        showEvoyaCreatorButton: evoya?.evoyaCreator?.enabled,
        ...{
          ui: {
            ...config?.ui,
            cot: 'full'
          }
        }
      });
    }
  }, [config]);

  const loadTranslations = async (lang: string) => {
    try {
      const translations = await import(`../../../translations/${lang}.json`);
      i18n.addResourceBundle(lang, 'translation', translations);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error(`Could not load translations for ${lang}:`, error);
      const splitLang = lang.split('-');
      if (splitLang.length === 2 && lang !== 'en-US') {
        loadTranslations(splitLang[0]);
      } else {
        loadTranslations('en-US');
      }
    }
  };

  useEffect(() => {
    loadTranslations(languageInUse);
    setCreatorEnabled(evoya?.evoyaCreator?.initialEnabled ?? false)
  }, []);

  const defaultTheme = widgetConfig.theme || data?.default_theme;

  useEffect(() => {
    if (fetchError) return;
    if (!isAuthenticated) {
      if (!widgetConfig.accessToken) {
        setAuthError('No authentication token provided.');
      } else {
        apiClient
          .jwtAuth(widgetConfig.accessToken)
          .then(() => getUserWithAuth())
          .catch((err) => setAuthError(String(err)));
      }
    } else {
      setAuthError(undefined);
    }
  }, [isAuthenticated, apiClient, fetchError, setAuthError]);

  const getUserWithAuth = async () => {
    const userData = await apiClient
      .getUser(widgetConfig.accessToken || '')
      .catch((err) => setAuthError(String(err)));
      setUserFromAPI();
  };

  useEffect(() => {
    const eventListener = (e: Event) => {
      const customEvent = e as CustomEvent<CopilotThreadChangedEventParams>;
      startNewChat(customEvent?.detail?.newThreadId);
    };

    window.addEventListener(COPILOT_THREAD_CHANGED_EVENT_KEY, eventListener);

    return () => {
      window.removeEventListener(
        COPILOT_THREAD_CHANGED_EVENT_KEY,
        eventListener
      );
    };
  }, []);

  return (
    <ThemeProvider
      storageKey="vite-ui-theme"
      defaultTheme={defaultTheme}
      brandColor={evoya?.brand_color}
    >
      <Toaster className="toast" position="top-right" />
      {evoya?.type === 'default' ? (
        <Widget config={widgetConfig} error={fetchError || authError} />
      ) : (
        <WidgetEmbedded />
      )}
    </ThemeProvider>
  );
}
