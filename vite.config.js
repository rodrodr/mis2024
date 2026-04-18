import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: false,
  },
  plugins: [
    tailwindcss(),
  ],
});
