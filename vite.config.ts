import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import wasm from "vite-plugin-wasm"

export default defineConfig({
    base: "/Paper-Ecash",
    build: {
        target: 'esnext'
    },
    plugins: [react(), wasm()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/unit/setup.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/src/tests/e2e/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/utils/**', 'src/services/**', 'src/components/**'],
        },
    },
    assetsInclude: ["**/*.wasm"],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    worker: {
        format: "es",
        plugins: () => [wasm()],
    },

    optimizeDeps: {
        exclude: [
            "@fedimint/core-web",
        ],
    },
})
