/**
 * RemoteApp — exposed as `exp/App` via Module Federation.
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
import { queryClient } from '@/lib/queryClient'
import { RemoteAuthProvider } from '@/contexts/AuthContext'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext'
import Sidebar from '@/components/Sidebar'
import '@/i18n'

import HomePage from '@/pages/HomePage'
import CategoryGroupsPage from '@/pages/CategoryGroupsPage'
import CapexDossierListPage from '@/pages/CapexDossierListPage'
import CapexDossierDetailPage from '@/pages/CapexDossierDetailPage'
import OpexDossierListPage from '@/pages/OpexDossierListPage'
import OpexDossierDetailPage from '@/pages/OpexDossierDetailPage'
import type { ReactElement } from 'react'

// ── Route registry — add new pages here ───────────────────────────────────────
interface RouteDefinition {
  path: string
  component: ReactElement
}

const ROUTES: RouteDefinition[] = [
  { path: '/', component: <HomePage /> },
  { path: '/category-groups', component: <CategoryGroupsPage /> },
  { path: '/capex-dossiers', component: <CapexDossierListPage /> },
  { path: '/capex-dossiers/detail', component: <CapexDossierDetailPage /> },
  { path: '/opex-dossiers', component: <OpexDossierListPage /> },
  { path: '/opex-dossiers/detail', component: <OpexDossierDetailPage /> },
]

const renderContent = (path: string): ReactElement => {
  const route = ROUTES.find((r) => r.path === path)
  return route ? route.component : <HomePage />
}

const RemoteAppContent: React.FC = () => {
  const { path, navKey, navigate } = useNavigation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    /*
      Flex layout: sidebar (fixed width) + scrollable content.
      Does NOT use position:fixed so it fits inside the host shell correctly.
    */
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((c) => !c)}
        currentPath={path}
        onMenuClick={navigate}
      />
      {/* key={navKey} forces remount on every navigate() call so pages read fresh params */}
      <div key={navKey} style={{ flex: 1, overflow: 'auto', background: '#F5F6F7', padding: 24 }}>
        {renderContent(path)}
      </div>
    </div>
  )
}

const RemoteApp: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider locale={viVN}>
      <RemoteAuthProvider>
        <PermissionProvider>
          <NavigationProvider>
            <RemoteAppContent />
          </NavigationProvider>
        </PermissionProvider>
      </RemoteAuthProvider>
    </ConfigProvider>
  </QueryClientProvider>
)

export default RemoteApp
