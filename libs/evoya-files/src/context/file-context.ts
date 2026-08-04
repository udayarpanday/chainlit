import { createContext } from 'react';

interface FilePickerContext {
  apiBaseUrl: string;
  csrfToken?: string;
  isSuperuser?: boolean;
  showConnectButton?: boolean;
  projectId?: string;
  workspaceId?: string;
  type: string;
  brandColor?: string | null;
}

const defaultContext = {
  apiBaseUrl: 'http://localhost:800',
  csrfToken: '',
  isSuperuser: false,
  showConnectButton: false,
  type: 'default'
};

const FilePickerContext = createContext<FilePickerContext>(defaultContext);

export { FilePickerContext, defaultContext };
