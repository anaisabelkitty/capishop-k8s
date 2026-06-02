// Configuración de Vite para el proyecto Vue de CapiShop
// Define el proxy para redirigir las peticiones /api al backend durante desarrollo

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // En desarrollo redirige las peticiones /api al backend en localhost:3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})