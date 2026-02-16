import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Heart Card',
        short_name: 'Heart Card',
        description: 'A loyalty card for love—add hearts when they do something sweet',
        theme_color: '#e11d48',
        background_color: '#fef2f2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/heart.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/heart.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
