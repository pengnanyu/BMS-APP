import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const vesaPlugins = fs.existsSync(new URL("./.vesa", import.meta.url))
  ? [
      (await import("./.vesa/vite-error-plugin.js")).default(),
      (await import("./.vesa/vite-design-mode-plugin.js")).default(),
    ]
  : [];

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    ...ve saPlugins,
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "aibms-logo.png",
        "favicon.svg",
        "fonts/JetBrainsMono-latin.woff2",
        "robots.txt",
      ],
      manifest: {
        name: "AIBMS - 智能电池管理系统",
        short_name: "AIBMS",
        description: "AIBMS 智能电池管理上位机系统",
        theme_color: "#d4940a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "aibms-logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "aibms-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "aibms-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,woff2,png,svg,html}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ui\.aibms\.net\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "aibms-ui-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: {
          ui: ["@radix-ui/react-select", "@radix-ui/react-dialog", "sonner"],
        },
      },
    },
  },
}));
