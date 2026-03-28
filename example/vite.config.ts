import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Map 'pane-tabs-layout' to the source files for development
      'pane-tabs-layout': path.resolve(__dirname, '../src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  // Allow serving files from parent directory
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
