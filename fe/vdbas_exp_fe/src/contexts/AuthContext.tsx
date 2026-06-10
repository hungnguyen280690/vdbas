import { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextValue, JwtUser } from '@/types/index'

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem('kc_token'))
  const [user,    setUser]    = useState<JwtUser | null>(null)
  const [loading, setLoading] = useState(true)

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

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const RemoteAuthProvider = AuthProvider
