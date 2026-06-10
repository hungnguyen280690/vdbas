/**
 * RemoteApp for chi_dt — exposed as `exp/ChiDauTu` via Module Federation.
 *
 * This component is loaded by the vdbas_host shell. It:
 *  - Skips Keycloak initialization (the host has already authenticated)
 *  - Reads the bearer token from localStorage (set by the host's AuthProvider)
 *  - Renders the full app layout: sidebar + content
 */
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { queryClient } from '@/shared/lib/queryClient'
import { RemoteAuthProvider } from '@/shared/contexts/AuthContext'
import { PermissionProvider } from '@/shared/contexts/PermissionContext'
import Sidebar from '@/shared/components/Sidebar'
import '@/shared/i18n'

import HomePage from './pages/HomePage'
import CategoryGroupsPage from './pages/CategoryGroupsPage'
import type { ReactElement } from 'react'

// ── Route registry — add new pages here ───────────────────────────────────────
interface RouteDefinition {
  path: string
  component: ReactElement
}

const ROUTES: RouteDefinition[] = [
  { path: '/',                 component: <HomePage />           },
  { path: '/category-groups', component: <CategoryGroupsPage /> },
]

const renderContent = (currentPath: string): ReactElement => {
  const route = ROUTES.find((r) => r.path === currentPath)
  return route ? route.component : <HomePage />
}

const RemoteApp: React.FC = () => {
  const [currentPath, setCurrentPath]           = useState('/')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <RemoteAuthProvider>
          <PermissionProvider>
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
          </PermissionProvider>
        </RemoteAuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default RemoteApp
