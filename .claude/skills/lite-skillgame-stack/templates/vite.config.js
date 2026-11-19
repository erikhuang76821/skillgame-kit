import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',          // top-level await in main.js
    assetsInlineLimit: 0,      // every asset stays a hashed file (cacheable, visible to size-check)
    reportCompressedSize: true,
    sourcemap: false,
  },
});
