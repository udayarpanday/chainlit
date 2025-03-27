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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9tbnQvZC9jaGFpbmxpdC9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vbW50L2QvY2hhaW5saXQvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIGJ1aWxkOiB7XHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgLy8gaW5wdXQ6IHtcclxuICAgICAgLy8gICBjb3BpbG90OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXgudHN4JylcclxuICAgICAgLy8gfSxcclxuICAgICAgb3V0cHV0OiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogJ2NoYXRwYWdlJyxcclxuICAgICAgICAgIGRpcjogJy9tbnQvZC9jbGllbnRfd29ya3MvYXZhaWEtY2hhdC9zcmMvYXZhaWFfY2hhdC9wdWJsaWMvY2hhdHBhZ2UnLFxyXG4gICAgICAgICAgZm9ybWF0OiAnaWlmZScsXHJcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9pbmRleC5qcycsXHJcbiAgICAgICAgICBpbmxpbmVEeW5hbWljSW1wb3J0czogdHJ1ZSxcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH1cclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0c2NvbmZpZ1BhdGhzKCksIHN2Z3IoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgLy8gVG8gcHJldmVudCBjb25mbGljdHMgd2l0aCBwYWNrYWdlcyBpbiBAY2hhaW5saXQvcmVhY3QtY2xpZW50LCB3ZSBuZWVkIHRvIHNwZWNpZnkgdGhlIHJlc29sdXRpb24gcGF0aHMgZm9yIHRoZXNlIGRlcGVuZGVuY2llcy5cclxuICAgICAgcmVhY3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxyXG4gICAgICAndXNlaG9va3MtdHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvdXNlaG9va3MtdHMnKSxcclxuICAgICAgc29ubmVyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvc29ubmVyJyksXHJcbiAgICAgIGxvZGFzaDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL2xvZGFzaCcpLFxyXG4gICAgICByZWNvaWw6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWNvaWwnKVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFAsT0FBTyxXQUFXO0FBQzVRLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFDakIsT0FBTyxtQkFBbUI7QUFKMUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BSWIsUUFBUTtBQUFBLFFBQ047QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLEtBQUs7QUFBQSxVQUNMLFFBQVE7QUFBQSxVQUNSLGdCQUFnQjtBQUFBLFVBQ2hCLHNCQUFzQjtBQUFBLFFBQ3hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFBQSxFQUMxQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxNQUVwQyxPQUFPLEtBQUssUUFBUSxrQ0FBVyxzQkFBc0I7QUFBQSxNQUNyRCxlQUFlLEtBQUssUUFBUSxrQ0FBVyw0QkFBNEI7QUFBQSxNQUNuRSxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN2RCxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN2RCxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
