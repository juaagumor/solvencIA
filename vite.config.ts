
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite inyectará estas variables en el código final
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});
