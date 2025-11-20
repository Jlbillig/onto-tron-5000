import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  root: 'csvui',
  base: './',
  
  publicDir: path.resolve(__dirname, 'csvui/public'),
  
  build: {
    outDir: path.resolve(__dirname, 'static/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'csvui/index.html'),
    },
    cssMinify: false,
    minify: 'terser',
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'csvui/src'),
    },
  },
  
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  
  css: {
    postcss: null,
  },
})