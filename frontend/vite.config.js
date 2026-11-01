import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

// TODO: set to the real production URL; sitemap.xml and robots.txt are generated from it at build time.
const SITE = 'https://example.com'

// `npm run dev` proxies static resources to FastAPI (uvicorn app.main:app)
export default defineConfig({
  plugins: [react(), Sitemap({ hostname: SITE, dynamicRoutes: ['/contact', '/privacy'] })],
  server: { proxy: { '/resources': 'http://localhost:8000' } },
})
