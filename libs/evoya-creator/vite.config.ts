import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import pps from 'postcss-prefix-selector';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(), 
    svgr({
      svgrOptions: {
        svgo: true,
        replaceAttrValues: { 'black': 'currentColor' }
      }
    }),
    // sentryVitePlugin({
    //   org: "insign",
    //   project: "avaia-chat",
    //   authToken: process.env.REACT_APP_SOURCE_MAP_AUTH
    // }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: '../copilot/tailwind.config.js'
        }),
        autoprefixer(),
        pps({
          prefix: '#evoya-creator-container',
          ignoreFiles: ['markdownEditor/custom.css', 'editor/style.css', '@mdxeditor/editor/dist/style.css'],
          exclude: ['*', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'b', 'ul', 'ol', 'li', 'button'],
        }),
      ]
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        creator: path.resolve(__dirname, 'index.tsx')
      },
      output: [
        {
          name: 'creator',
          dir: '../../../avaia-chat/src/avaia_chat/public/evoya-creator',
          format: 'iife',
          entryFileNames: 'index.js',
          inlineDynamicImports: true
        }
      ]
    }
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      "@mdxeditor/editor/dist/styles/ui.module.css.js": path.resolve(__dirname, "./node_modules/@mdxeditor/editor/dist/styles/ui.module.css.js"),
      "./TableEditor.js": path.resolve(__dirname, "./src/components/markdownEditor/plugins/extend/table/TableEditorWrapper.tsx"),
      "SourceTableEditor": path.resolve(__dirname, "./node_modules/@mdxeditor/editor/dist/plugins/table/TableEditor.js"),
    }
  }
});
