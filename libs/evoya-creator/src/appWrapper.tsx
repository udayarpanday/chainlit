import { WidgetContext } from './context';
import { RecoilRoot } from 'recoil';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import { EvoyaCreatorConfig } from './types';
import CreatorFrame from './components/CreatorFrame';

import { ThemeProvider } from './components/ThemeProvider';
import { useEffect } from 'react';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

i18nSetupLocalization();
interface Props {
  config: EvoyaCreatorConfig;
}

export default function AppWrapper({ config }: Props) {
  const defaultTheme = config.theme || 'light';
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';

  useEffect(() => {
    loadTranslations(languageInUse);
  }, []);

  const loadTranslations = async (lang: string) => {
    try {
      const translations = await import(
        `../../../translations/${lang}.json`
      );
      i18n.addResourceBundle(lang, 'translation', translations);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error(`Could not load translations for ${lang}:`, error);
      loadTranslations('en-US');
    }
  };

  return (
    <RecoilRoot>
      <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
        <WidgetContext.Provider
          value={{
            config
          }}
        >
          <CreatorFrame />
        </WidgetContext.Provider>
      </ThemeProvider>
    </RecoilRoot>
  );
}
