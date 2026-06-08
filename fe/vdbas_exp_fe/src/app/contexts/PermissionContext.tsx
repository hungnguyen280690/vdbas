/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { getMyMenus, getMyApis } from '@/shared/services/aclService'
import { MenuItem, ApiPermission } from '@/shared/types'

interface PermissionContextType {
  menus: MenuItem[]
  apiPermissions: ApiPermission[]
  menusLoading: boolean
  apisLoading: boolean
  menusError: Error | null
  apisError: Error | null
  hasApiPermission: (path: string, method: string) => boolean
  hasMenuPermission: (path: string) => boolean
  isLoading: boolean
}

const PermissionContext = createContext<PermissionContextType | null>(null)

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { authenticated } = useAuth()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [apiPermissions, setApiPermissions] = useState<ApiPermission[]>(() => {
    const saved = localStorage.getItem('apiPermissions')
    return saved ? JSON.parse(saved) : []
  })

  const {
    data: menusData,
    isLoading: menusLoading,
    error: menusError,
  } = useQuery<MenuItem[]>({
    queryKey: ['myMenus'],
    queryFn: getMyMenus,
    enabled: authenticated,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: apisData,
    isLoading: apisLoading,
    error: apisError,
  } = useQuery<ApiPermission[]>({
    queryKey: ['myApis'],
    queryFn: getMyApis,
    enabled: authenticated,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (menusData) setMenus(menusData)
  }, [menusData])

  useEffect(() => {
    if (apisData) {
      setApiPermissions(apisData)
      localStorage.setItem('apiPermissions', JSON.stringify(apisData))
    }
  }, [apisData])

  /**
   * Returns true if the authenticated user can call the given API endpoint.
   * Supports path exps: `/api/entities/{id}` matches `/api/entities/123`.
   */
  const hasApiPermission = (path: string, method: string) => {
    if (!authenticated || !apiPermissions.length) return false

    const normalizedPath   = path.split('?')[0].replace(/\/$/, '')
    const normalizedMethod = method.toUpperCase()

    return apiPermissions.some((api) => {
      const apiPath   = api.path?.split('{')[0].replace(/\/$/, '') || ''
      const apiMethod = api.method?.toUpperCase() || 'GET'

      if (apiMethod !== normalizedMethod) return false
      if (apiPath === normalizedPath) return true

      if (apiPath.includes('{') && apiPath.includes('}')) {
        const baseFromPermission = apiPath.replace(/\{[^}]+\}/g, '').replace(/\/$/, '')
        if (normalizedPath === baseFromPermission) return true

        const escaped = apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = escaped.replace(/\\\{[^}]+\\\}/g, '[^/]+')
        if (new RegExp(`^${pattern}$`).test(normalizedPath)) return true
      }

      return false
    })
  }

  /**
   * Returns true if the given path exists in the user's menu tree.
   */
  const hasMenuPermission = (path: string) => {
    if (!authenticated || !menus.length) return false

    const findMenu = (menuList: MenuItem[], targetPath: string): boolean => {
      for (const menu of menuList) {
        if (menu.path === targetPath) return true
        if (menu.children?.length && findMenu(menu.children, targetPath)) return true
      }
      return false
    }

    return findMenu(menus, path)
  }

  const value: PermissionContextType = {
    menus,
    apiPermissions,
    menusLoading,
    apisLoading,
    menusError: (menusError as Error) || null,
    apisError: (apisError as Error) || null,
    hasApiPermission,
    hasMenuPermission,
    isLoading: menusLoading || apisLoading,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) throw new Error('usePermissions must be used within a PermissionProvider')
  return context
}

import { MOCK_MENUS } from '@/mocks/handlers'

// ── Mock Provider for Standalone Development ────────────────────────────────
/**
 * MockPermissionProvider — Bypasses API calls for menus and permissions.
 * Use this in development when VITE_MOCK_AUTH=true.
 */
export const MockPermissionProvider = ({ children }: { children: ReactNode }) => {
  const value: PermissionContextType = {
    menus: MOCK_MENUS,
    apiPermissions: [],
    menusLoading: false,
    apisLoading: false,
    menusError: null,
    apisError: null,
    hasApiPermission: () => true, // Bypass API checks in mock mode
    hasMenuPermission: () => true,
    isLoading: false,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}
