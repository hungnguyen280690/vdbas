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
        './App': './src/app/RemoteApp.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.6' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.6' },
        antd: { singleton: true },
        '@tanstack/react-query': { singleton: true },
        'react-i18next': { singleton: true },
      },
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
      'react-i18next',
      '@tanstack/react-query',
    ],
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
