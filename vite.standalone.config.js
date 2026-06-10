import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds the whole app into one self-contained HTML file that can be
// opened directly from disk — no server or hosting needed.
// Usage: npm run build:standalone → dist-standalone/index.html
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-standalone',
    chunkSizeWarningLimit: 2000,
  },
})
