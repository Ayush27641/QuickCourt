import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Main REST APIs
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },

      // Auth/UserRegistrationController endpoints (not under /api)
      '/register': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/getAllUsers': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/updateRegistration': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/verify': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ban': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/getName': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },

      // Chat rooms
      '/rooms': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
