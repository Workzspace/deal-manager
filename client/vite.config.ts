import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the frontend runs on port 5173 and the API on port 4000.
// This proxy forwards any request starting with /api to the backend so we don't
// run into cross-origin (CORS) problems and the app behaves like one website.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
