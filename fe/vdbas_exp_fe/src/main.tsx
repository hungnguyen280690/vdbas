import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/shared/contexts/AuthContext'
import { PermissionProvider } from '@/shared/contexts/PermissionContext'
import { queryClient } from '@/shared/lib/queryClient'
import App from '@/App'
import '@/shared/index.css'

// Load api early so the interceptors are registered before any request fires
import '@/shared/services/api'
import '@/shared/i18n'

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
