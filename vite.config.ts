import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { juego: 'index.html' } }, chunkSizeWarningLimit: 1600 },
});
