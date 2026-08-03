/// <reference types="vite/client" />

declare global {
  interface Window {
    cl_files_shadowRootElement: HTMLDivElement;
    cl_shadowRootElement: HTMLDivElement;
  }
}

export {};
