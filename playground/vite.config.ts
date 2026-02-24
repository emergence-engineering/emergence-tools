import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/ee-prosemirror-tools/",
  resolve: {
    mainFields: ["source", "module", "main"],
  },
});