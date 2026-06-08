/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/shared/types'

interface AuthContextType {
  authenticated: boolean
  loading: boolean
  user: User | null
  token: string | null
  login: () => void
  logout: () => void
  getToken: () => string | null
  hasRole: (role: string) => boolean
  isTokenValid: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kc_token'))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync token from localStorage
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('kc_token')
      setToken(currentToken)
    }

    window.addEventListener('storage', handleStorageChange)
    // Custom event to sync inside same window
    window.addEventListener('auth-change', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (token && token.includes('.')) {
      try {
        const payload = token.split('.')[1]
        if (payload) {
          const parsedUser = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
          setUser(parsedUser)
        }
      } catch (e) {
        console.error('Failed to parse token:', e)
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [token])

  const login = () => {
    // In Micro Frontend, redirect to host to perform login
    window.location.href = '/'
  }

  const logout = () => {
    localStorage.removeItem('kc_token')
    localStorage.removeItem('kc_refreshToken')
    localStorage.removeItem('apiPermissions')
    setToken(null)
    setUser(null)
    window.location.href = '/'
  }

  const getToken = () => token || localStorage.getItem('kc_token')

  const hasRole = (role: string) => {
    if (!user) return false
    const realmRoles = user.realm_access?.roles || []
    const resourceRoles = Object.values(user.resource_access || {}).flatMap((r) => r.roles || [])
    return realmRoles.includes(role) || resourceRoles.includes(role)
  }

  const isTokenValid = () => !!token

  const value = {
    authenticated: !!token,
    loading,
    user,
    token,
    login,
    logout,
    getToken,
    hasRole,
    isTokenValid,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

// Keep RemoteAuthProvider as an alias for backward compatibility
export const RemoteAuthProvider = AuthProvider

// ── Mock Provider for Standalone Development ────────────────────────────────
/**
 * MockAuthProvider — Bypasses Keycloak login and provides a static user.
 * Use this in development when VITE_MOCK_AUTH=true.
 */
export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  const value: AuthContextType = {
    authenticated: true,
    loading: false,
    user: {
      preferred_username: 'dev.mock',
      email: 'dev@mock.vdbas',
      name: 'Dev Mock User',
      realm_access: { roles: ['ADMIN'] },
    },
    token: 'mock-token',
    login: () => console.log('[MockAuth] Login triggered'),
    logout: () => console.log('[MockAuth] Logout triggered'),
    getToken: () => 'mock-token',
    hasRole: () => true,
    isTokenValid: () => true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
