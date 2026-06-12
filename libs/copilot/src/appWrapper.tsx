import { makeApiClient } from 'api';
import { useEffect, useMemo, useState } from 'react';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import {
  ChainlitContext,
  setScopedSessionStorageItem
} from '@chainlit/react-client';

import App from './app';
import { WidgetContext } from './context';
import { EvoyaConfig } from './src/evoya/types';

i18nSetupLocalization();
interface Props {
  widgetConfig: IWidgetConfig;
  evoya: EvoyaConfig;
}

export default function AppWrapper({ widgetConfig, evoya }: Props) {
  const [accessToken, setAccessToken] = useState(widgetConfig.accessToken);
  const apiClient = useMemo(
    () => makeApiClient(widgetConfig.chainlitServer),
    [widgetConfig.chainlitServer]
  );
  const widgetContextValue = useMemo(
    () => ({
      accessToken,
      setAccessToken,
      evoya
    }),
    [accessToken, evoya]
  );
  const [customThemeLoaded, setCustomThemeLoaded] = useState(false);

  useEffect(() => {
    setScopedSessionStorageItem('chainlit_token', accessToken || '');
    localStorage.removeItem('chainlit_token');
  }, [accessToken]);

  function completeInitialization() {
    if (widgetConfig.customCssUrl) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = widgetConfig.customCssUrl;
      window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
    }
    setCustomThemeLoaded(true);
  }

  useEffect(() => {
    let fontLoaded = false;

    apiClient
      .get('/public/theme.json', {
        Authorization: `Bearer ${widgetConfig.accessToken}`
      })
      .then(async (res) => {
        try {
          const customTheme = await res.json();
          if (customTheme.custom_fonts?.length) {
            fontLoaded = true;
            customTheme.custom_fonts.forEach((href: string) => {
              const linkEl = document.createElement('link');
              linkEl.rel = 'stylesheet';
              linkEl.href = href;
              window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
            });
          }
          if (customTheme.variables) {
            window.theme = customTheme.variables;
          }
        } finally {
          // If no custom font, default to Inter
          if (!fontLoaded) {
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href =
              'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap';
            window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
          }
          completeInitialization();
        }
      })
      .catch(() => completeInitialization());
  }, []);

  if (!customThemeLoaded) return null;
  return (
    <ChainlitContext.Provider value={apiClient}>
      <WidgetContext.Provider value={widgetContextValue}>
        <RecoilRoot>
          <App widgetConfig={widgetConfig} />
        </RecoilRoot>
      </WidgetContext.Provider>
    </ChainlitContext.Provider>
  );
}
