import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['sql.js', 'sql.js/dist/sql-wasm.js'],
  },
  assetsInclude: ['**/*.wasm'],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
