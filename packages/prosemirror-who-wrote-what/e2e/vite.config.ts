import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "fixtures/test-harness"),
  server: {
    port: 3334,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@whoWroteWhat": resolve(__dirname, "../src"),
    },
  },
  optimizeDeps: {
    include: [
      "prosemirror-state",
      "prosemirror-view",
      "prosemirror-model",
      "prosemirror-schema-basic",
      "prosemirror-example-setup",
      "y-prosemirror",
      "yjs",
    ],
  },
});
