import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // pdfmake y exceljs (~1 MB) se cargan solo al generar un PDF o un Excel,
  // no al abrir la app: no hace falta avisar por su tamaño
  build: { chunkSizeWarningLimit: 1000 },
  optimizeDeps: {
    exclude: ['@techstark/opencv-js', 'tesseract.js'],
  },
})
