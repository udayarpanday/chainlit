import React from 'react';
import ReactDOM from 'react-dom/client';

import Editor from './src/components/markdownEditorStandalone/index';

import sonnercss from '../copilot/sonner.css?inline';
import tailwindcss from '../copilot/src/index.css?inline';

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

  const tailwindStyles = document.createElement('style');
  tailwindStyles.textContent = tailwindcss.toString();
  container.appendChild(tailwindStyles);

  // const sonnerStyles = document.createElement('style');
  // sonnerStyles.textContent = sonnercss.toString();
  // container.appendChild(sonnerStyles);

  textarea.parentNode?.insertBefore(container, textarea);

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <Editor content={content} onChange={onChange} />
    </React.StrictMode>
  );
};

window.unmountMDXEditor = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.updateMDXEditor = () => null;
