import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'whitelogoheader512x512px.png'],
      manifest: {
        name: 'Syria 14 | سيريا 14',
        short_name: 'Syria 14',
        description:
          'The leading bilingual real estate platform for Syria. Find apartments, villas and commercial properties.',
        theme_color: '#1F2C3D',
        background_color: '#F5F2EC',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'whitelogoheader512x512px.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'whitelogoheader512x512px.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'whitelogoheader512x512px.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache only compiled assets; hero images are too large and change often
        globPatterns: ['**/*.{js,css,html,ico}'],
        runtimeCaching: [
          {
            // Property images and public file uploads from Supabase Storage
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase REST API — always try network; listings change frequently
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour fallback
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),

    // Sentry source-map upload runs only when all three envs are set,
    // which is typically only in production builds on Vercel.
    ...(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
