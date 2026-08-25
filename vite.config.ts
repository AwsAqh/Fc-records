import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/FC-record-web/',
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  server: {
    port: 3000,
  },
});
