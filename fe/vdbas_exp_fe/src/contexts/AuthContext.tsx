import { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextValue, JwtUser } from '@/types/index'

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_AUTH    = import.meta.env.VITE_MOCK_AUTH === 'true'
const MOCK_API_URL = (import.meta.env.VITE_ACL_API_BASE_URL as string | undefined)?.replace(/\/api.*$/, '') ?? 'http://localhost:9090'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem('kc_token'))
  const [user,    setUser]    = useState<JwtUser | null>(null)
  const [loading, setLoading] = useState(true)

  // In mock mode, auto-fetch a fake token if none is present
  useEffect(() => {
    if (!MOCK_AUTH || localStorage.getItem('kc_token')) return
    fetch(`${MOCK_API_URL}/api/mock/token`)
      .then((r) => r.json())
      .then(({ token: t }: { token: string }) => {
        localStorage.setItem('kc_token', t)
        setToken(t)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('kc_token'))
    window.addEventListener('storage', sync)
    window.addEventListener('auth-change', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-change', sync) }
  }, [])

  useEffect(() => {
    if (token) {
      try {
        const payload = token.split('.')[1]
        setUser(JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtUser)
      } catch (e) {
        console.error('Failed to parse token:', e)
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [token])

  const login  = () => { window.location.href = '/' }
  const logout = () => {
    localStorage.removeItem('kc_token')
    localStorage.removeItem('kc_refreshToken')
    localStorage.removeItem('apiPermissions')
    setToken(null); setUser(null)
    window.location.href = '/'
  }
  const getToken    = (): string | null => token || localStorage.getItem('kc_token')
  const hasRole = (role: string): boolean => {
    if (!user) return false
    const realmRoles    = user.realm_access?.roles ?? []
    const resourceRoles = Object.values(user.resource_access ?? {}).flatMap((r) => r.roles ?? [])
    return realmRoles.includes(role) || resourceRoles.includes(role)
  }
  const isTokenValid = (): boolean => !!token

  return (
    <AuthContext.Provider value={{ authenticated: !!token, loading, user, token, login, logout, getToken, hasRole, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const RemoteAuthProvider = AuthProvider
