/// <reference types="vitest" />
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      '@chainlit/copilot/src': path.resolve(__dirname, '../libs/copilot/src'),
      '@chainlit/react-client': path.resolve(
        __dirname,
        '../libs/react-client/src/index.ts'
      ),
      src: path.resolve(__dirname, '../libs/react-client/src'),
      'socket.io-client': path.resolve(
        __dirname,
        '../libs/react-client/node_modules/socket.io-client'
      )
    },
    // Workspace packages must share the React context and Recoil atom registry.
    dedupe: ['react', 'react-dom', 'recoil']
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup-tests.ts',
    include: ['./**/*.{test,spec}.?(c|m)[jt]s?(x)']
  }
});
