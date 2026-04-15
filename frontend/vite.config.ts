import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        // target: "http://120.78.3.29:3000/",
        // target: "http://120.78.3.29:81/api/dev/museen-dashboard",
        target: "http://localhost:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
