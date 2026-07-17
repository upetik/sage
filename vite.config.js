import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // the static demo is served from a subpath (github pages), so use relative urls there
  base: process.env.VITE_STATIC === '1' ? './' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:4400',
      '/images': 'http://localhost:4400',
    },
  },
});
