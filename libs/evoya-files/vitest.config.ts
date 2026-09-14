/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      react: path.resolve(__dirname, 'node_modules/react')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['./tests/**/*.{test,spec}.?(c|m)[jt]s?(x)']
  }
});
