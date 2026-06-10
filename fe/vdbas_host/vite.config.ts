import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      // No static remotes — all remote URLs come from /api/me/apps at runtime.
      // registerRemotes() + loadRemote() in AppRouter handle dynamic registration.
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.6' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.6' },
        'react-router-dom': { singleton: true, requiredVersion: '^7.15.1' },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  preview: {
    port: 3000,
    cors: true,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    outDir: 'dist',
  },
})
