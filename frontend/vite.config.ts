import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function normalizeBase(input: string | undefined, fallback: string) {
  const raw = (input ?? fallback).trim();
  if (!raw) return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(
    env.VITE_APP_BASE,
    mode === "development" ? "/" : "/pss/",
  );

  return {
    base,
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
  };
});
