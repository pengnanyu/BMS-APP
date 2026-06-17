import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import vesaErrorReporter from "./.vesa/vite-error-plugin.js";
import vesaDesignMode from "./.vesa/vite-design-mode-plugin.js";
import { fileURLToPath, URL } from "node:url";
import fs from "fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const hasEsaConfig = fs.existsSync(new URL("esa.jsonc", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    ...(hasEsaConfig
      ? {
          proxy: {
            "/api": {
              target: "http://127.0.0.1:18080",
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  plugins: [vesaErrorReporter(), vesaDesignMode(), tailwindcss(), react()].filter(Boolean),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
