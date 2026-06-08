import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/es/locale/vi_VN'
import { AuthProvider } from './auth/AuthProvider'
import { Shell } from './layout/Shell'
import { AppRouter } from './router/AppRouter'

const App: React.FC = () => (
  <BrowserRouter>
    <ConfigProvider locale={viVN}>
      <AntApp>
        <AuthProvider>
          <Shell>
            <AppRouter />
          </Shell>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  </BrowserRouter>
)

export default App
