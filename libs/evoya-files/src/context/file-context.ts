import { createContext } from 'react';

interface FilePickerContext {
  apiBaseUrl: string;
  csrfToken?: string;
}

const defaultContext = {
  apiBaseUrl: 'http://localhost:800',
  csrfToken: ''
};

const FilePickerContext = createContext<FilePickerContext>(defaultContext);

export { FilePickerContext, defaultContext };
