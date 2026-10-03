import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import cookieParser from 'cookie-parser';
import express from 'express';
import { apiRouter } from './src/server/api.ts';
import { securityHeadersMiddleware } from './src/server/security.ts';
import { initDatabase } from './src/db/client.ts';
import { seedDatabase } from './src/db/seed.ts';

function fullstackApiPlugin(): Plugin {
  return {
    name: 'fullstack-api-plugin',
    async configureServer(server) {
      try {
        await initDatabase();
        await seedDatabase();
      } catch (err) {
        console.error('Failed to init/seed DB in dev server:', err);
      }

      const app = express();
      app.use(securityHeadersMiddleware);
      app.use(cookieParser());
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      app.use(apiRouter);

      server.middlewares.use('/api', app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), fullstackApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
