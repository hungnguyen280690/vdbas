import { useState } from 'react'
import { Layout, Select } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/contexts/AuthContext'
import { usePermissions } from '@/shared/contexts/PermissionContext'
import Sidebar from '@/shared/components/Sidebar'
import HeaderBreadcrumb from '@/shared/components/common/HeaderBreadcrumb'
import HomePage from '@/modules/chi_dt/pages/HomePage'
import CategoryGroupsPage from '@/modules/chi_dt/pages/CategoryGroupsPage'
import type { ReactElement } from 'react'

const { Header, Content } = Layout

// ── Route registry ────────────────────────────────────────────────────────────
// Register new pages here: { path: '/my-page', component: <MyPage /> }
interface RouteDefinition {
  path: string
  component: ReactElement
}

const ROUTES: RouteDefinition[] = [
  { path: '/',                 component: <HomePage />           },
  { path: '/category-groups', component: <CategoryGroupsPage /> },
  // TODO: add feature pages here
]

const renderContent = (currentPath: string): ReactElement => {
  const route = ROUTES.find((r) => r.path === currentPath)
  return route ? route.component : <HomePage />
}

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [currentPath, setCurrentPath]           = useState('/')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { authenticated, loading, user, login, logout } = useAuth()
  const { isLoading: menusLoading }             = usePermissions()
  const { t: translate, i18n }                  = useTranslation()

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading || menusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">{translate('app.initializing')}</p>
        </div>
      </div>
    )
  }

  // ── Unauthenticated state ─────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {translate('app.title')}
            </h1>
            <p className="text-gray-500">{translate('app.login_required')}</p>
          </div>
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">⚠ {translate('app.login_required')}</p>
            </div>
            <button
              onClick={login}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {translate('app.login_btn')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated layout ──────────────────────────────────────────────────
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={currentPath}
        onMenuClick={(path) => setCurrentPath(path)}
      />

      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <HeaderBreadcrumb currentPath={currentPath} />

          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <Select
              defaultValue={i18n.language?.startsWith('en') ? 'en' : 'vi'}
              style={{ width: 120 }}
              onChange={(value) => i18n.changeLanguage(value)}
              options={[
                { value: 'vi', label: 'Tiếng Việt' },
                { value: 'en', label: 'English' },
              ]}
            />

            {/* User label */}
            <span className="text-gray-600 text-sm">
              {user?.preferred_username || user?.email || 'User'}
            </span>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <LogoutOutlined />
              {translate('app.logout_btn')}
            </button>
          </div>
        </Header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <Content
          style={{
            padding: 24,
            background: '#F5F6F7',
            minHeight: 280,
          }}
        >
          {renderContent(currentPath)}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
