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
        react: { singleton: true, requiredVersion: '^19.2.6', eager: true },
        'react-dom': { singleton: true, requiredVersion: '^19.2.6', eager: true },
        'react-router-dom': { singleton: true, requiredVersion: '^7.15.1' },
        antd: { singleton: true },
        'react-i18next': { singleton: true },
        '@tanstack/react-query': { singleton: true },
      } as any,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: [
      'react',
      'react-dom',
      'antd',
      'react-router-dom',
      'react-i18next',
      '@tanstack/react-query',
    ],
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
