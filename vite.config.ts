import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/weaving-machine/',
  server: {
    port: 5173,
    host: true,
  },
});
