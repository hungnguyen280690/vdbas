import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { queryClient } from '@/lib/queryClient'
import App from '@/App'
import '@/index.css'

// Load api early so the interceptors are registered before any request fires
import '@/services/api'
import '@/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={viVN}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
