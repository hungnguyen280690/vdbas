/**
 * RemoteApp — exposed as `exp/App` via Module Federation.
 *
 * This component is loaded by the vdbas_host shell. It:
 *  - Skips Keycloak initialization (the host has already authenticated)
 *  - Reads the bearer token from localStorage (set by the host's AuthProvider)
 *  - Renders the full app layout: sidebar + content
 */
import { useState, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import viVN from 'antd/es/locale/vi_VN'
import { queryClient } from '@/shared/api/queryClient'
import { RemoteAuthProvider, MockAuthProvider } from '@/app/contexts/AuthContext'
import { PermissionProvider, MockPermissionProvider } from '@/app/contexts/PermissionContext'
import Sidebar from '@/shared/components/common/Sidebar'
import '@/app/i18n'

import HomePage from '@/features/home/pages/HomePage'
import CategoryGroupsPage from '@/features/category-groups/pages/CategoryGroupsPage'
import CapexDossierPage from '@/features/capex-dossier/pages/CapexDossierPage'

// ── Provider Selection Logic ────────────────────────────────────────────────
const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true'
const isMockApi  = import.meta.env.VITE_MOCK_API  === 'true'

const SelectedAuthProvider       = isMockAuth ? MockAuthProvider       : RemoteAuthProvider
const SelectedPermissionProvider = isMockAuth ? MockPermissionProvider : PermissionProvider

/**
 * MSW Initialization for RemoteApp
 * Note: Service Worker scope might be tricky in Module Federation.
 */
async function enableMocking() {
  if (!isMockApi) return
  
  // Prevent multiple starts (especially when running inside a Host that already has MSW)
  if ((window as any).__MSW_STARTED__) {
    console.log('[RemoteApp] MSW is already running. Skipping redundant start.')
    return
  }
  ;(window as any).__MSW_STARTED__ = true

  try {
    const { worker } = await import('@/mocks/browser')
    // Let it use the default location (relative to the current origin: 3001)
    // This requires mockServiceWorker.js to be present in the HOST's public folder.
    return await worker.start({
      onUnhandledRequest: 'bypass',
    })
  } catch (err) {
    console.error('[RemoteApp] MSW failed to start. Ensure mockServiceWorker.js is in the HOST public folder.', err)
  }
}

// ── Route registry — add new pages here ───────────────────────────────────────
const ROUTES = [
  { path: '/',                 component: <HomePage />           },
  { path: '/category-groups',  component: <CategoryGroupsPage /> },
  { path: '/capex-dossiers',   component: <CapexDossierPage />   },
]

const renderContent = (currentPath: string) => {
  const route = ROUTES.find((r) => r.path === currentPath)
  return route ? route.component : <HomePage />
}

const RemoteApp = () => {
  const [currentPath, setCurrentPath] = useState('/')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMockingReady, setIsMockingReady] = useState(!isMockApi)

  useEffect(() => {
    if (isMockApi) {
      enableMocking().then(() => setIsMockingReady(true))
    }
  }, [])

  if (!isMockingReady) {
    return null // Or a loader
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <SelectedAuthProvider>
          <SelectedPermissionProvider>
            {/*
              Flex layout: sidebar (fixed width) + scrollable content.
              Does NOT use position:fixed so it fits inside the host shell correctly.
            */}
            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
              <Sidebar
                collapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed((c) => !c)}
                currentPath={currentPath}
                onMenuClick={setCurrentPath}
              />
              <div style={{
                flex: 1,
                overflow: 'auto',
                background: '#F5F6F7',
                padding: 24,
              }}>
                {renderContent(currentPath)}
              </div>
            </div>
          </SelectedPermissionProvider>
        </SelectedAuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default RemoteApp
