import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split stable vendor code into its own chunks so game-code changes
        // don't invalidate the (large, rarely-changing) three.js download
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three'],
          r3f: [
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/postprocessing',
            'postprocessing',
          ],
        },
      },
    },
    // three.js alone is ~700 KB minified; that's expected, not a regression
    chunkSizeWarningLimit: 900,
  },
})
