import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'exp',
      filename: 'remoteEntry.js',
      dts: false,
      exposes: {
        // RemoteApp: full app without Keycloak init — for embedding inside the host
        './App': './src/RemoteApp.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.6' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.6' },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3003,
    open: true,
    cors: true,
  },
  preview: {
    port: 3003,
    cors: true,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    outDir: 'dist',
    sourcemap: false,
  },
})
