import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { i18nSetupLocalization } from '@chainlit/app/src/i18n';

import { ThemeProvider } from '../../copilot/src/ThemeProvider';
import Widget from './widget';
import WidgetCompact from './widget-compact';

i18nSetupLocalization();
interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
  workspaceId?: string;
  projectId?: string;
  file?: string;
  mime?: string;
  type: string;
}

export default function App({ initialPath, apiBaseUrl, csrfToken, workspaceId, projectId, type, file, mime, }: Props) {
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

  if (type === "compact") {
    return (
      <ThemeProvider storageKey="vite-ui-theme" defaultTheme={'light'}>
        <Toaster richColors className="toast" position="top-right" />
        {/* <FilePicker apiBaseUrl={apiBaseUrl} initialPath={initialPath} /> */}
        <WidgetCompact
          apiBaseUrl={apiBaseUrl}
          initialPath={initialPath}
          csrfToken={csrfToken}
          workspaceId={workspaceId}
          projectId={projectId}
        />
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={'light'}>
      <Toaster richColors className="toast" position="top-right" />
      {/* <FilePicker apiBaseUrl={apiBaseUrl} initialPath={initialPath} /> */}
      <Widget
        apiBaseUrl={apiBaseUrl}
        initialPath={initialPath}
        csrfToken={csrfToken}
        workspaceId={workspaceId}
        projectId={projectId}
        file={file}
        mime={mime}
      />
    </ThemeProvider>
  );
}
