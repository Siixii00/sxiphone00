import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin-cloudflare'

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
