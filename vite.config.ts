import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const vesaPlugins = fs.existsSync(new URL("./.vesa", import.meta.url))
  ? [
      (await import("./.vesa/vite-error-plugin.js")).default(),
      (await import("./.vesa/vite-design-mode-plugin.js")).default(),
    ]
  : [];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [...vesaPlugins, tailwindcss(), react()],
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
