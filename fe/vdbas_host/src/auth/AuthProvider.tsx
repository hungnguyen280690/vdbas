import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import keycloak from '../lib/keycloak'
import type { AuthContextValue, AuthState, PermissionApp } from './types'

const AuthContext = createContext<AuthContextValue | null>(null)

const initialState: AuthState = {
  status: 'loading',
  user: null,
  token: null,
  apps: null,
}

const fetchUserApps = async (token: string): Promise<PermissionApp[] | null> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
  try {
    const res = await fetch(`${baseUrl}/me/apps`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-User-Id': '6FCD264E878349EF9C5B32A6DA90448C', // TODO: remove after API gateway is applied
      },
    })
    if (!res.ok) throw new Error('Failed to fetch apps')
    const data = await res.json()
    return data
  } catch (err) {
    console.error('Error fetching user apps:', err)
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState)
  const initCalledRef = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (initCalledRef.current) {
      if (keycloak.authenticated !== undefined) {
        let apps: PermissionApp[] | null = null
        const cachedApps = localStorage.getItem('user_apps')
        if (cachedApps) {
          try {
            apps = JSON.parse(cachedApps)
          } catch (e) {
            // ignore
          }
        }
        setState({
          status: keycloak.authenticated ? 'authenticated' : 'unauthenticated',
          user: (keycloak.tokenParsed as AuthState['user']) ?? null,
          token: keycloak.token ?? null,
          apps: apps,
        })
      }
      return
    }
    initCalledRef.current = true

    keycloak
      .init({
        onLoad: 'login-required',   // Redirect to Keycloak if not authenticated
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then(async (isAuth) => {
        let apps: PermissionApp[] | null = null

        if (isAuth && keycloak.token) {
          // Store token in localStorage so remote apps can read it
          localStorage.setItem('kc_token', keycloak.token)
          window.dispatchEvent(new Event('auth-change'))
          if (keycloak.refreshToken) {
            localStorage.setItem('kc_refreshToken', keycloak.refreshToken)
          }

          apps = await fetchUserApps(keycloak.token)
          if (apps) {
            localStorage.setItem('user_apps', JSON.stringify(apps))
            apps.forEach((app) => {
              if (app.appCode && app.appUrl) {
                localStorage.setItem(`app_url_${app.appCode.toLowerCase()}`, app.appUrl)
              }
            })
          }
        }

        setState({
          status: isAuth ? 'authenticated' : 'unauthenticated',
          user: (keycloak.tokenParsed as AuthState['user']) ?? null,
          token: keycloak.token ?? null,
          apps: apps,
        })
      })
      .catch(() => {
        setState({ status: 'unauthenticated', user: null, token: null, apps: null })
        initCalledRef.current = false
      })

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            localStorage.setItem('kc_token', keycloak.token)
            window.dispatchEvent(new Event('auth-change'))
            setState((prev) => ({ ...prev, token: keycloak.token ?? null }))
          }
        })
        .catch(() => {
          setState({ status: 'unauthenticated', user: null, token: null, apps: null })
          localStorage.removeItem('kc_token')
          keycloak.logout()
        })
    }

    keycloak.onAuthRefreshSuccess = () => {
      if (keycloak.token) {
        localStorage.setItem('kc_token', keycloak.token)
        window.dispatchEvent(new Event('auth-change'))
        setState((prev) => ({ ...prev, token: keycloak.token ?? null }))
      }
    }
  }, [])

  const login = useCallback(() => keycloak.login(), [])

  const logout = useCallback(() => {
    const cachedApps = localStorage.getItem('user_apps')
    if (cachedApps) {
      try {
        const apps = JSON.parse(cachedApps) as PermissionApp[]
        apps.forEach((app) => {
          localStorage.removeItem(`app_url_${app.appCode.toLowerCase()}`)
        })
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('kc_token')
    localStorage.removeItem('kc_refreshToken')
    localStorage.removeItem('apiPermissions')
    localStorage.removeItem('user_apps')
    window.dispatchEvent(new Event('auth-change'))
    keycloak.logout()
  }, [])

  const getToken = useCallback(() => state.token, [state.token])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
