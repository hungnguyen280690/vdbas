export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthUser {
  sub?: string
  name?: string
  email?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: { roles: string[] }
  resource_access?: Record<string, { roles: string[] }>
  [key: string]: unknown
}

export interface PermissionApp {
  appCode: string
  appUrl: string
}

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  token: string | null
  apps: PermissionApp[] | null
}

export interface AuthContextValue extends AuthState {
  login: () => void
  logout: () => void
  getToken: () => string | null
}
