import { createContext } from 'react';

interface FilePickerContext {
  apiBaseUrl: string;
}

const defaultContext = {
  apiBaseUrl: 'http://localhost:800/api/'
};

const FilePickerContext = createContext<FilePickerContext>(defaultContext);

export { FilePickerContext, defaultContext };
