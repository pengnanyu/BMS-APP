import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import vesaErrorReporter from "./.vesa/vite-error-plugin.js";
import vesaDesignMode from "./.vesa/vite-design-mode-plugin.js";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [vesaErrorReporter(), vesaDesignMode(), tailwindcss(), react()],
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
