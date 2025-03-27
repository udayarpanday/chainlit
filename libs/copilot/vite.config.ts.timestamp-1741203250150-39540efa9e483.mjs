// vite.config.ts
import react from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/@vitejs+plugin-react-swc@3.3.2_vite@5.4.14_@types+node@20.5.7_/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { defineConfig } from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite@5.4.14_@types+node@20.5.7/node_modules/vite/dist/node/index.js";
import svgr from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite-plugin-svgr@4.2.0_rollup@4.24.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///mnt/d/chainlit/libs/copilot/node_modules/.pnpm/vite-tsconfig-paths@4.2.0_typescript@5.2.2_vite@5.4.14_@types+node@20.5.7_/node_modules/vite-tsconfig-paths/dist/index.mjs";
var __vite_injected_original_dirname = "/mnt/d/chainlit/libs/copilot";
var vite_config_default = defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  build: {
    // sourcemap:true,
    rollupOptions: {
      input: {
        copilot: path.resolve(__vite_injected_original_dirname, "index.tsx")
      },
      output: [
        {
          name: "copilot",
          dir: "/mnt/d/client_works/avaia-chat/src/avaia_chat/public/copilot",
          format: "iife",
          entryFileNames: "index.js",
          inlineDynamicImports: true
        }
      ]
    }
  },
  resolve: {
    alias: {
      // To prevent conflicts with packages in @chainlit/app, we need to specify the resolution paths for these dependencies.
      react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "@chainlit/copilot": path.resolve(__vite_injected_original_dirname, ""),
      "@chainlit": path.resolve(__vite_injected_original_dirname, "./node_modules/@chainlit"),
      postcss: path.resolve(__vite_injected_original_dirname, "./node_modules/postcss"),
      tailwindcss: path.resolve(__vite_injected_original_dirname, "./node_modules/tailwindcss"),
      i18next: path.resolve(__vite_injected_original_dirname, "./node_modules/i18next"),
      sonner: path.resolve(__vite_injected_original_dirname, "./node_modules/sonner"),
      "highlight.js": path.resolve(__vite_injected_original_dirname, "./node_modules/highlight.js"),
      "react-i18next": path.resolve(__vite_injected_original_dirname, "./node_modules/react-i18next"),
      "usehooks-ts": path.resolve(__vite_injected_original_dirname, "./node_modules/usehooks-ts"),
      lodash: path.resolve(__vite_injected_original_dirname, "./node_modules/lodash"),
      recoil: path.resolve(__vite_injected_original_dirname, "./node_modules/recoil")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvbGlicy9jb3BpbG90XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2QvY2hhaW5saXQvbGlicy9jb3BpbG90L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvZC9jaGFpbmxpdC9saWJzL2NvcGlsb3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0c2NvbmZpZ1BhdGhzKCksIHN2Z3IoKV0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIHNvdXJjZW1hcDp0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBpbnB1dDoge1xyXG4gICAgICAgIGNvcGlsb3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC50c3gnKVxyXG4gICAgICB9LFxyXG4gICAgICBvdXRwdXQ6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiAnY29waWxvdCcsXHJcbiAgICAgICAgICBkaXI6ICcvbW50L2QvY2xpZW50X3dvcmtzL2F2YWlhLWNoYXQvc3JjL2F2YWlhX2NoYXQvcHVibGljL2NvcGlsb3QnLFxyXG4gICAgICAgICAgZm9ybWF0OiAnaWlmZScsXHJcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2luZGV4LmpzJyxcclxuICAgICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAvLyBUbyBwcmV2ZW50IGNvbmZsaWN0cyB3aXRoIHBhY2thZ2VzIGluIEBjaGFpbmxpdC9hcHAsIHdlIG5lZWQgdG8gc3BlY2lmeSB0aGUgcmVzb2x1dGlvbiBwYXRocyBmb3IgdGhlc2UgZGVwZW5kZW5jaWVzLlxyXG4gICAgICByZWFjdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0JyksXHJcbiAgICAgICdAY2hhaW5saXQvY29waWxvdCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcnKSxcclxuICAgICAgJ0BjaGFpbmxpdCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9AY2hhaW5saXQnKSxcclxuICAgICAgcG9zdGNzczogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3Bvc3Rjc3MnKSxcclxuICAgICAgdGFpbHdpbmRjc3M6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy90YWlsd2luZGNzcycpLFxyXG4gICAgICBpMThuZXh0OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvaTE4bmV4dCcpLFxyXG4gICAgICBzb25uZXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9zb25uZXInKSxcclxuICAgICAgJ2hpZ2hsaWdodC5qcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMnKSxcclxuICAgICAgJ3JlYWN0LWkxOG5leHQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvcmVhY3QtaTE4bmV4dCcpLFxyXG4gICAgICAndXNlaG9va3MtdHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvdXNlaG9va3MtdHMnKSxcclxuICAgICAgbG9kYXNoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvbG9kYXNoJyksXHJcbiAgICAgIHJlY29pbDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlY29pbCcpLFxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1EsT0FBTyxXQUFXO0FBQ3hSLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFDakIsT0FBTyxtQkFBbUI7QUFKMUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQUEsRUFDMUMsT0FBTztBQUFBO0FBQUEsSUFFTCxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsUUFDTCxTQUFTLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsTUFDOUM7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixLQUFLO0FBQUEsVUFDTCxRQUFRO0FBQUEsVUFDUixnQkFBZ0I7QUFBQSxVQUNoQixzQkFBc0I7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxPQUFPLEtBQUssUUFBUSxrQ0FBVyxzQkFBc0I7QUFBQSxNQUNyRCxxQkFBcUIsS0FBSyxRQUFRLGtDQUFXLEVBQUU7QUFBQSxNQUMvQyxhQUFhLEtBQUssUUFBUSxrQ0FBVywwQkFBMEI7QUFBQSxNQUMvRCxTQUFTLEtBQUssUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxNQUN6RCxhQUFhLEtBQUssUUFBUSxrQ0FBVyw0QkFBNEI7QUFBQSxNQUNqRSxTQUFTLEtBQUssUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxNQUN6RCxRQUFRLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN2RCxnQkFBZ0IsS0FBSyxRQUFRLGtDQUFXLDZCQUE2QjtBQUFBLE1BQ3JFLGlCQUFpQixLQUFLLFFBQVEsa0NBQVcsOEJBQThCO0FBQUEsTUFDdkUsZUFBZSxLQUFLLFFBQVEsa0NBQVcsNEJBQTRCO0FBQUEsTUFDbkUsUUFBUSxLQUFLLFFBQVEsa0NBQVcsdUJBQXVCO0FBQUEsTUFDdkQsUUFBUSxLQUFLLFFBQVEsa0NBQVcsdUJBQXVCO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
