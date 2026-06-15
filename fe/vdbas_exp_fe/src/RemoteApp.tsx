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
import Sidebar from '@/components/Sidebar'
import '@/i18n'

import HomePage from '@/pages/HomePage'
import CategoryGroupsPage from '@/pages/CategoryGroupsPage'
import FormList from '@/pages/FormList'
import FormDetail from '@/pages/FormDetail'
import type { ReactElement } from 'react'

const RemoteApp: React.FC = () => {
  const [currentPath, setCurrentPath]           = useState('/')
  const [navParams, setNavParams]               = useState<Record<string, string>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigate = (path: string, params: Record<string, string> = {}) => {
    setCurrentPath(path)
    setNavParams(params)
  }

  const renderContent = (): ReactElement => {
    if (currentPath === '/category-groups')      return <CategoryGroupsPage />
    if (currentPath === '/capex-dossiers')       return <FormList onNavigate={navigate} />
    if (currentPath === '/capex-dossier/detail') {
      return <FormDetail mode={navParams.mode as 'new' | 'edit' | 'view'} recordId={navParams.id ?? null} onNavigate={navigate} />
    }
    return <HomePage />
  }

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
                onMenuClick={(path) => navigate(path)}
              />
              <div style={{
                flex: 1,
                overflow: 'auto',
                background: '#F5F6F7',
                padding: 24,
              }}>
                {renderContent()}
              </div>
            </div>
          </PermissionProvider>
        </RemoteAuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default RemoteApp
