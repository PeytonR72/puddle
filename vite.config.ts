import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // DuckDB-WASM ships its own worker scripts and .wasm files. Pre-bundling
  // rewrites them into something that no longer finds its siblings, so leave
  // the package alone and let src/duckdb/bundles.ts resolve the assets.
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
  test: {
    // Node only. Nothing under test touches the DOM yet, and adding a DOM
    // environment is a decision to make when the first component needs one.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
