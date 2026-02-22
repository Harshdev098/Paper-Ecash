import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  base: '/Paper-Ecash',
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
        format: 'es',
        plugins: () => [wasm()],
    },
    optimizeDeps: {
        exclude: ['@fedimint/core-web'],
    },
})