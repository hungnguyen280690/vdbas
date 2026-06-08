import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import viVN from 'antd/es/locale/vi_VN'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, MockAuthProvider } from '@/app/contexts/AuthContext'
import { PermissionProvider, MockPermissionProvider } from '@/app/contexts/PermissionContext'
import { queryClient } from '@/shared/api/queryClient'
import App from '@/app/App'
import '@/app/index.css'

// Load api.ts early so the interceptors are registered before any request fires
import '@/shared/api/api'
import '@/app/i18n'

// ── Provider Selection Logic ────────────────────────────────────────────────
// VITE_MOCK_AUTH: Mock providers to bypass Keycloak/ACL
// VITE_MOCK_API: MSW to mock API responses
const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true'
const isMockApi  = import.meta.env.VITE_MOCK_API  === 'true'

const SelectedAuthProvider       = isMockAuth ? MockAuthProvider       : AuthProvider
const SelectedPermissionProvider = isMockAuth ? MockPermissionProvider : PermissionProvider

if (isMockAuth || isMockApi) {
  console.log('🚀 App is running with mocking enabled:', { 
    Auth: isMockAuth ? 'MOCK' : 'REAL', 
    API: isMockApi ? 'MOCK' : 'REAL' 
  })
}

/**
 * MSW Initialization
 * We start the worker only if isMockApi is true.
 */
async function enableMocking() {
  if (!isMockApi) return

  // Prevent multiple starts (e.g. in Module Federation)
  if ((window as any).__MSW_STARTED__) return
  ;(window as any).__MSW_STARTED__ = true

  const { worker } = await import('@/mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and running.
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

enableMocking().then(() => {
  const container = document.getElementById('root')
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <ConfigProvider locale={viVN}>
          <QueryClientProvider client={queryClient}>
            <SelectedAuthProvider>
              <SelectedPermissionProvider>
                <App />
              </SelectedPermissionProvider>
            </SelectedAuthProvider>
          </QueryClientProvider>
        </ConfigProvider>
      </StrictMode>,
    )
  }
})
