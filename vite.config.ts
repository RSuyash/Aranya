import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: "Terra Ecological Platform",
        short_name: "Terra",
        start_url: "/",
        display: "standalone",
        background_color: "#050814",
        theme_color: "#006D77",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        file_handlers: [
          {
            action: "/projects",
            accept: {
              "application/vnd.terra.project+zip": [".terx", ".fldx"]
            },
            icons: [
              {
                src: "/icons/file-fldx.png",
                sizes: "512x512",
                type: "image/png"
              }
            ]
          }
        ]
      } as any
    })
  ],
})
