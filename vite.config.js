import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://davidrangel6-dev.github.io/BBB/
  base: '/BBB/',
  plugins: [react()],
})
