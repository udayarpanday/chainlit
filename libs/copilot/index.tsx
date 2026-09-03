import React from 'react';
import ReactDOM from 'react-dom/client';

import { type IStep, resetScopedChatSession } from '@chainlit/react-client';

// @ts-expect-error inline css
import sonnercss from './sonner.css?inline';
// @ts-expect-error inline css
import tailwindcss from './src/index.css?inline';
// @ts-expect-error inline css
import hljscss from 'highlight.js/styles/monokai-sublime.css?inline';

import AppWrapper from './src/appWrapper';
import { EvoyaConfig } from './src/evoya/types';
import {
  clearChainlitCopilotThreadId,
  getChainlitCopilotThreadId
} from './src/state';
import { IWidgetConfig } from './src/types';

const id = 'chainlit-copilot';
let root: ReactDOM.Root | null = null;
let hostElement: HTMLDivElement | null = null;

const cleanupWidget = () => {
  root?.unmount();
  root = null;

  hostElement?.remove();
  hostElement = null;

  document
    .querySelectorAll<HTMLElement>(`#${id}`)
    .forEach((element) => element.remove());
};

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    cl_shadowRootElement_container: HTMLDivElement;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    mountChainlitWidget: (config: IWidgetConfig, evoya: EvoyaConfig) => void;
    unmountChainlitWidget: () => void;
    toggleChainlitCopilot: () => void;
    sendChainlitMessage: (message: IStep) => void;
    getChainlitCopilotThreadId: () => string | null;
    clearChainlitCopilotThreadId: (newThreadId?: string) => void;
  }
}

window.mountChainlitWidget = (config: IWidgetConfig, evoya: EvoyaConfig) => {
  cleanupWidget();

  if (evoya.reset) {
    resetScopedChatSession(!evoya.session_uuid);
  }

  hostElement = document.createElement('div');
  hostElement.id = id;

  if (evoya.container !== null) {
    hostElement.style.height = '100%';
    hostElement.style.width = '100%';
    evoya.container.appendChild(hostElement);
  } else {
    document.body.appendChild(hostElement);
  }

  const shadowContainer = hostElement.attachShadow({ mode: 'open' });
  const shadowRootElement = document.createElement('div');
  shadowRootElement.id = 'cl-shadow-root';
  shadowContainer.appendChild(shadowRootElement);
  if (evoya.container !== null) {
    shadowRootElement.style.height = '100%';
    shadowRootElement.style.width = '100%';
  }

  window.cl_shadowRootElement = shadowRootElement;
  window.cl_shadowRootElement_container = hostElement;

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
    ${evoya.additionalCss ?? ''}
  `;
  shadowContainer.appendChild(resetStyles);

  root = ReactDOM.createRoot(shadowRootElement);
  root.render(
    <React.StrictMode>
      <style type="text/css">{tailwindcss.toString()}</style>
      <style type="text/css">{sonnercss.toString()}</style>
      <style type="text/css">{hljscss.toString()}</style>
      <AppWrapper widgetConfig={config} evoya={evoya} />
    </React.StrictMode>
  );
};

window.unmountChainlitWidget = cleanupWidget;

window.sendChainlitMessage = () => {
  console.info('Copilot is not active. Please check if the widget is mounted.');
};

window.getChainlitCopilotThreadId = getChainlitCopilotThreadId;
window.clearChainlitCopilotThreadId = clearChainlitCopilotThreadId;
