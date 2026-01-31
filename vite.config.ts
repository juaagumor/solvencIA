
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Forzamos la captura de la variable de entorno de GitHub Actions o local
const API_KEY = process.env.API_KEY || '';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.API_KEY': JSON.stringify(API_KEY)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 3000
  }
});
