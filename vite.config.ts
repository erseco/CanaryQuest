import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { juego: 'index.html', mogan: 'mogan.html' } }, chunkSizeWarningLimit: 1600 },
});
