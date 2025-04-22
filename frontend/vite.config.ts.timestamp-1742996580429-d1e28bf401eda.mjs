// vite.config.ts
import react from "file:///mnt/d/chainlit/frontend/node_modules/.pnpm/@vitejs+plugin-react-swc@3.3.2_vite@5.4.14_@types+node@20.5.7_/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { defineConfig } from "file:///mnt/d/chainlit/frontend/node_modules/.pnpm/vite@5.4.14_@types+node@20.5.7/node_modules/vite/dist/node/index.js";
import svgr from "file:///mnt/d/chainlit/frontend/node_modules/.pnpm/vite-plugin-svgr@4.2.0_rollup@4.31.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///mnt/d/chainlit/frontend/node_modules/.pnpm/vite-tsconfig-paths@4.2.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-tsconfig-paths/dist/index.mjs";
var __vite_injected_original_dirname = "/mnt/d/chainlit/frontend";
var vite_config_default = defineConfig({
  build: {
    emptyOutDir: true,
    rollupOptions: {
      // input: {
      //   copilot: path.resolve(__dirname, 'index.tsx')
      // },
      output: [
        {
          name: "chatpage",
          dir: "/mnt/d/client_works/avaia-chat/src/avaia_chat/public/chatpage",
          format: "iife",
          entryFileNames: "assets/index.js",
          inlineDynamicImports: true
        }
      ]
    }
  },
  plugins: [react(), tsconfigPaths(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      // To prevent conflicts with packages in @chainlit/react-client, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "usehooks-ts": path.resolve(__vite_injected_original_dirname, "./node_modules/usehooks-ts"),
      sonner: path.resolve(__vite_injected_original_dirname, "./node_modules/sonner"),
      lodash: path.resolve(__vite_injected_original_dirname, "./node_modules/lodash"),
      recoil: path.resolve(__vite_injected_original_dirname, "./node_modules/recoil")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9tbnQvZC9jaGFpbmxpdC9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vbW50L2QvY2hhaW5saXQvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBpbnB1dDoge1xuICAgICAgLy8gICBjb3BpbG90OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXgudHN4JylcbiAgICAgIC8vIH0sXG4gICAgICBvdXRwdXQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjaGF0cGFnZScsXG4gICAgICAgICAgZGlyOiAnL21udC9kL2NsaWVudF93b3Jrcy9hdmFpYS1jaGF0L3NyYy9hdmFpYV9jaGF0L3B1YmxpYy9jaGF0cGFnZScsXG4gICAgICAgICAgZm9ybWF0OiAnaWlmZScsXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvaW5kZXguanMnLFxuICAgICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdHNjb25maWdQYXRocygpLCBzdmdyKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAvLyBUbyBwcmV2ZW50IGNvbmZsaWN0cyB3aXRoIHBhY2thZ2VzIGluIEBjaGFpbmxpdC9yZWFjdC1jbGllbnQsIHdlIG5lZWQgdG8gc3BlY2lmeSB0aGUgcmVzb2x1dGlvbiBwYXRocyBmb3IgdGhlc2UgZGVwZW5kZW5jaWVzLlxuICAgICAgcmVhY3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxuICAgICAgJ3VzZWhvb2tzLXRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3VzZWhvb2tzLXRzJyksXG4gICAgICBzb25uZXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9zb25uZXInKSxcbiAgICAgIGxvZGFzaDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL2xvZGFzaCcpLFxuICAgICAgcmVjb2lsOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvcmVjb2lsJylcbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwUCxPQUFPLFdBQVc7QUFDNVEsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sVUFBVTtBQUNqQixPQUFPLG1CQUFtQjtBQUoxQixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxhQUFhO0FBQUEsSUFDYixlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFJYixRQUFRO0FBQUEsUUFDTjtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sS0FBSztBQUFBLFVBQ0wsUUFBUTtBQUFBLFVBQ1IsZ0JBQWdCO0FBQUEsVUFDaEIsc0JBQXNCO0FBQUEsUUFDeEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsY0FBYyxHQUFHLEtBQUssQ0FBQztBQUFBLEVBQzFDLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQTtBQUFBLE1BRXBDLE9BQU8sS0FBSyxRQUFRLGtDQUFXLHNCQUFzQjtBQUFBLE1BQ3JELGVBQWUsS0FBSyxRQUFRLGtDQUFXLDRCQUE0QjtBQUFBLE1BQ25FLFFBQVEsS0FBSyxRQUFRLGtDQUFXLHVCQUF1QjtBQUFBLE1BQ3ZELFFBQVEsS0FBSyxRQUFRLGtDQUFXLHVCQUF1QjtBQUFBLE1BQ3ZELFFBQVEsS0FBSyxRQUFRLGtDQUFXLHVCQUF1QjtBQUFBLElBQ3pEO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
