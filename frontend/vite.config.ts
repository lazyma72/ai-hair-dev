import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/pss/",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        // target: "http://120.78.3.29:8888",
        rewrite: (path) => path.replace(/^\/api/, "/api/pss"),
      },
    },
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
}));
