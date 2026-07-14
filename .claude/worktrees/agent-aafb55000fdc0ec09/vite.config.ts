import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

if (isProd && process.env.VITE_DEEPSEEK_API_KEY) {
  throw new Error('VITE_DEEPSEEK_API_KEY no puede incluirse en un build de producción.')
}

export default defineConfig({
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          pdf: ['pdfjs-dist'],
          excel: ['exceljs'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
