import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

/**
 * MSW Initialization
 * We start the worker only if VITE_MOCK_API is true.
 */
async function enableMocking() {
  if (import.meta.env.VITE_MOCK_API !== 'true') return

  const { worker } = await import('./mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and running.
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

enableMocking().then(() => {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
