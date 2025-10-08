import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import Editor from './src/components/markdownEditorStandalone/index';

let root: ReactDOM.Root | null = null;

declare global {
  interface Window {
    mountMDXEditor: ({ onChange, selector }: { onChange: (value: string) => void; selector: string;}) => void;
    updateMDXEditor: ({ content }: { content: string; }) => void;
    unmountMDXEditor: () => void;
  }
}

const id = 'evoya-mdx-editor';

window.mountMDXEditor = ({ selector, onChange }) => {
  const textarea = document.querySelector(selector);

  if (!textarea || !(textarea instanceof HTMLTextAreaElement)) return;

  const content = textarea.value;

  const container = document.createElement('div');
  container.id = id;
  

  textarea.parentNode?.insertBefore(container, textarea);

  const cache = createCache({
    key: 'css',
    prepend: true,
    container: container
  });

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <CacheProvider value={cache}>
        <Editor content={content} onChange={onChange} />
      </CacheProvider>
    </React.StrictMode>
  );
};

window.unmountMDXEditor = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.updateMDXEditor = () => null;
