import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('kc_token'))
  const [user, setUser] = useState(null)
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
    if (token) {
      try {
        const payload = token.split('.')[1]
        const parsedUser = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        setUser(parsedUser)
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

  const hasRole = (role) => {
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
