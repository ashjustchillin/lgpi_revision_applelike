import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/firestore',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  resolve: {
    alias: {},
  },
})
