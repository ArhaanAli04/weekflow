import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WeekFlow',
        short_name: 'WeekFlow',
        description: 'Personal activity tracker and performance app',
        theme_color: '#0E0E17',
        background_color: '#0E0E17',
        display: 'standalone',
      },
    }),
  ],
});
