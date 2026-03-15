import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Internationalisation
          i18n: ['i18next', 'react-i18next'],
          // Icon library
          icons: ['lucide-react'],
          // PDF export (heavy)
          pdf: ['jspdf', 'jspdf-autotable'],
          // Word export (heavy)
          docx: ['docx', 'file-saver'],
          // Canvas / screenshot utility
          canvas: ['html2canvas'],
          // DOM sanitiser
          purify: ['dompurify'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

