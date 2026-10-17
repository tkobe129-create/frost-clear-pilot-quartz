import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

// Prefer Netlify preset when building on Netlify CI; keep Vercel for local/Grok builds.
const nitroPreset = process.env.NETLIFY ? "netlify" : "vercel";

// The server runtime is used for TanStack Start rendering and platform PWA
// middleware only. Authentication and all business data now use Supabase.
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    // Arena proxies the live preview through a generated host name.
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    // Preserve the platform's PWA/install and preview branding middleware.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: nitroPreset,
            serverDir: "./server",
          }) as Plugin,
        ]
      : []),
    viteReact(),
  ],
}));
