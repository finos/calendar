import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { icsFeedsPlugin } from './vite-plugin-ics-feeds.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), icsFeedsPlugin({ env, mode, root: process.cwd() })],
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@fullcalendar')) {
              return 'fullcalendar';
            }
            if (id.includes('node_modules/ical.js') || id.includes('node_modules/rrule')) {
              return 'ics-parse';
            }
          },
        },
      },
    },
    test: {
      environment: 'node',
    },
  };
});
