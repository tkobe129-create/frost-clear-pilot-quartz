import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // GitHub Pages serves this project below /frost-clear-pilot-quartz/.
  base: process.env.GITHUB_PAGES === "true" ? "/frost-clear-pilot-quartz/" : "/",
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-github", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: fileURLToPath(new URL("./github-pages.html", import.meta.url)) },
    },
  },
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  root: repoRoot,
});
