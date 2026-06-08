export interface User {
  preferred_username?: string
  email?: string
  name?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, { roles: string[] }>
  [key: string]: any
}

export interface MenuItem {
  code: string
  name: string
  path?: string
  children?: MenuItem[]
  [key: string]: any
}

export interface ApiPermission {
  path: string
  method: string
  [key: string]: any
}
