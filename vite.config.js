import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page static build: three language pages + 404, rendered by scripts/build.py.
// Hashed bundles go to /static/ (cached immutable); public/assets keeps stable names.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        en: resolve(import.meta.dirname, 'index.html'),
        'zh-hant': resolve(import.meta.dirname, 'zh-hant/index.html'),
        'zh-hans': resolve(import.meta.dirname, 'zh-hans/index.html'),
        404: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
  server: { port: 5682, host: '127.0.0.1' },
  preview: { port: 5682, host: '127.0.0.1' },
});
