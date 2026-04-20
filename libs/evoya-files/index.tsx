import React from 'react';
import ReactDOM from 'react-dom/client';

import sonnercss from '../copilot/sonner.css?inline';
import tailwindcss from '../copilot/src/index.css?inline';

import App from './src/app';

import themejson from './theme.json';

const id = 'evoya-file-picker';
let root: ReactDOM.Root | null = null;

type EvoyaFilesConfig = {
  initialPath: string;
  container: HTMLElement;
  apiBaseUrl: string;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    mountEvoyaFilesWidget: (config: EvoyaFilesConfig) => void;
    unmountEvoyaFilesWidget: () => void;
  }
}

window.mountEvoyaFilesWidget = (config: EvoyaFilesConfig) => {
  const container = document.createElement('div');
  container.id = id;
  config.container.appendChild(container);
  // container.style.height = '100%';

  // const cache = createCache({
  //   key: 'css',
  //   prepend: true,
  //   container: container
  // });
  const shadowContainer = container.attachShadow({ mode: 'open' });
  const shadowRootElement = document.createElement('div');
  shadowRootElement.id = 'cl-shadow-root';
  shadowContainer.appendChild(shadowRootElement);

  window.cl_shadowRootElement = shadowRootElement;

  window.theme = themejson.variables;

  const resetStyles = document.createElement('style');
  resetStyles.textContent = `
    :host {
      all: initial;
    }
    #cl-shadow-root {
      font-family: sans-serif;
      color: inherit;
      box-sizing: border-box;
    }
  `;
  shadowContainer.appendChild(resetStyles);

  const tailwindStyles = document.createElement('style');
  tailwindStyles.textContent = tailwindcss.toString();
  shadowContainer.appendChild(tailwindStyles);

  const sonnerStyles = document.createElement('style');
  sonnerStyles.textContent = sonnercss.toString();
  shadowContainer.appendChild(sonnerStyles);

  // root = ReactDOM.createRoot(container);
  root = ReactDOM.createRoot(shadowRootElement);
  root.render(
    <React.StrictMode>
      <App initialPath={config.initialPath} apiBaseUrl={config.apiBaseUrl} />
    </React.StrictMode>
  );
};

window.unmountEvoyaFilesWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};
