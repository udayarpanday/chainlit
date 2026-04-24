import React from 'react';
import ReactDOM from 'react-dom/client';

import AppWrapper from './src/appWrapper';
import {
  EvoyaCreatorConfig,
  SelectionContext,
} from './src/types';

import sonnercss from '../copilot/sonner.css?inline';
import tailwindcss from '../copilot/src/index.css?inline';

import type { IStep } from 'client-types/';

import themejson from '../evoya-files/theme.json';

const id = 'evoya-md-editor';
let root: ReactDOM.Root | null = null;

declare global {
  interface Window {
    mdx_shadowRootElement: HTMLDivElement;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    mountEvoyaCreatorWidget: (config: EvoyaCreatorConfig) => void;
    unmountEvoyaCreatorWidget: () => void;
    openEvoyaCreator: (message: IStep, config: any) => void;
    getEvoyaCreatorContent: () => string | null;
    getEvoyaCreatorContentSelection: () => SelectionContext | null;
    // updateEvoyaCreator: (message: string) => void;
    updateEvoyaCreator: (message: IStep) => void;
  }
}

window.mountEvoyaCreatorWidget = (config: EvoyaCreatorConfig) => {
  const container = document.createElement('div');
  container.id = id;
  config.container.appendChild(container);
  container.style.height = '100%';

  window.mdx_shadowRootElement = container;
  
  window.theme = themejson.variables;

  const tailwindStyles = document.createElement('style');
  tailwindStyles.textContent = tailwindcss.toString();
  config.container.appendChild(tailwindStyles);

  const sonnerStyles = document.createElement('style');
  sonnerStyles.textContent = sonnercss.toString();
  config.container.appendChild(sonnerStyles);

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <AppWrapper config={config} />
    </React.StrictMode>
  );
};

window.unmountEvoyaCreatorWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.openEvoyaCreator = () => {
  console.info('Evoya Creator not initialized');
};

window.getEvoyaCreatorContent = () => null;
window.getEvoyaCreatorContentSelection = () => null;
window.updateEvoyaCreator = () => null;
