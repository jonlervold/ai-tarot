import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(process.env.PORT || env.PORT) || 3001

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://localhost:${port}`,
      },
    },
  }
})
