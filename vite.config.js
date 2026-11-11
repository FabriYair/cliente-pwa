
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Gestión de Cursos PWA',
        short_name: 'Cursos PWA',
        description: 'Aplicación de gestión de cursos con Vue y Laravel',
        start_url: '/',
        display: 'standalone',
        background_color: '#f1f5f9',
        theme_color: '#14213d',

        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        runtimeCaching: [
          {
            // Guardar solamente el listado público de cursos
            urlPattern: ({ url, request }) =>
              url.origin === 'http://127.0.0.1:8000' &&
              url.pathname === '/api/cursos-publicos' &&
              request.method === 'GET',

            handler: 'NetworkFirst',

            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,

              cacheableResponse: {
                statuses: [200]
              },

              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ]
})
