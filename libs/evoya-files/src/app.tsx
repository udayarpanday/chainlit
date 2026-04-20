import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import FilePicker from './components/FilePicker';

import { ThemeProvider } from '../../copilot/src/ThemeProvider';
import Widget from './widget';

i18nSetupLocalization();
interface Props {
  initialPath: string;
  apiBaseUrl: string;
}

export default function App({ initialPath, apiBaseUrl }: Props) {
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    try {
      const translations = await import(
        `../../../translations/${languageInUse}.json`
      );
      i18n.addResourceBundle(languageInUse, 'translation', translations);
      i18n.changeLanguage(languageInUse);
    } catch (error) {
      console.error(`Could not load translations for ${languageInUse}:`, error);
    }
  };
  
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={'light'}>
      <Toaster richColors className="toast" position="top-right" />
      {/* <FilePicker apiBaseUrl={apiBaseUrl} initialPath={initialPath} /> */}
      <Widget apiBaseUrl={apiBaseUrl} initialPath={initialPath} />
    </ThemeProvider>
  );

  // return (
  //   <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
  //     <Toaster richColors className="toast" position="top-right" />
  //     {evoya.type === 'default' ? (
  //       <Widget config={widgetConfig} error={fetchError || authError} />
  //     ) : (
  //       <WidgetEmbedded />
  //     )}
  //   </ThemeProvider>
  // );
}
