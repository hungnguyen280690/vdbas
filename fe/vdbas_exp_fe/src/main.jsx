import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext.jsx'
import { PermissionProvider } from '@/contexts/PermissionContext.jsx'
import { queryClient } from '@/lib/queryClient.js'
import App from '@/App.jsx'
import '@/index.css'

// Load api.js early so the interceptors are registered before any request fires
import '@/services/api.js'
import '@/i18n.js'

createRoot(document.getElementById('root')).render(
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
