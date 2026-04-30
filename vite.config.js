import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    svelte({
      onwarn: (warning, defaultHandler) => {
        if (warning.code?.startsWith('a11y_')) return
        defaultHandler?.(warning)
      },
    }),
  ],
  root: 'web/src',
  base: './',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(import.meta.dirname, 'web/src/index.html'),
    },
  },
  server: {
    port: 5173,
    open: true,
    host: '127.0.0.1',
  },
})
