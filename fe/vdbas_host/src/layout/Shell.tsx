import React from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Header } from './Header'
import { LoadingScreen } from './LoadingScreen'

interface ShellProps {
  children: React.ReactNode
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen message="Đang xác thực..." />
  }

  // Keycloak onLoad: 'login-required' handles the redirect automatically.
  // This state briefly appears before Keycloak redirects.
  if (status === 'unauthenticated') {
    return <LoadingScreen message="Đang chuyển đến trang đăng nhập..." />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      <Header />
      <main style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
      }}>
        {children}
      </main>
    </div>
  )
}
