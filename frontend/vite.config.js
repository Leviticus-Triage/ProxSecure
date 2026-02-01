import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Backend port: use 8000 for default, or 8080 if you run uvicorn on 8080
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  base: '/',
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
});
