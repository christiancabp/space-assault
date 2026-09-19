import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { decidePilot } from './api/_pilotCore'

/**
 * Dev-only: serve POST /api/pilot from the Vite dev server so the AI pilot works
 * under `npm run dev` without needing `vercel dev`. Production uses the real
 * serverless function at api/pilot.ts; both share ./api/_pilotCore. The key is
 * read server-side (this Node process) and never reaches the client bundle.
 */
function pilotDevApi(apiKey: string): Plugin {
  return {
    name: 'pilot-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/pilot', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({ error: 'TYPESAFE_API_KEY missing in .env.local' })
          )
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          try {
            const { state } = JSON.parse(body || '{}')
            const decision = await decidePilot(state, apiKey)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(decision))
          } catch (err) {
            console.error('[pilot dev] error', err)
            res.statusCode = 502
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'AI pilot upstream error' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (incl. non-VITE_ ones) so the dev middleware can read the
  // server-side key from .env.local.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), pilotDevApi(env.TYPESAFE_API_KEY ?? '')],
    build: {
      rollupOptions: {
        output: {
          // Split stable vendor code into its own chunks so game-code changes
          // don't invalidate the (large, rarely-changing) three.js download
          manualChunks: {
            react: ['react', 'react-dom'],
            three: ['three'],
            r3f: [
              '@react-three/fiber',
              '@react-three/drei',
              '@react-three/postprocessing',
              'postprocessing',
            ],
          },
        },
      },
      // three.js alone is ~700 KB minified; that's expected, not a regression
      chunkSizeWarningLimit: 900,
    },
  }
})
