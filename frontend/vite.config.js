import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static-only build: deploys as-is to Netlify / Vercel (set Root Directory
// to `frontend/` OR build locally and drag `dist/`). Backend URL comes from
// VITE_API_URL at build time.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000' } },
  build: { outDir: 'dist', sourcemap: false },
})
