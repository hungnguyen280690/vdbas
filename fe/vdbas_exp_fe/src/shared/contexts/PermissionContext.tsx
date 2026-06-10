import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { getMyMenus, getMyApis } from '@/shared/services/aclService'
import type { MenuItem, ApiPermission, PermissionContextValue } from '@/shared/types/index'

const PermissionContext = createContext<PermissionContextValue | null>(null)

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated } = useAuth()
  const [menus,          setMenus]          = useState<MenuItem[]>([])
  const [apiPermissions, setApiPermissions] = useState<ApiPermission[]>(() => {
    const saved = localStorage.getItem('apiPermissions')
    return saved ? (JSON.parse(saved) as ApiPermission[]) : []
  })

  const { data: menusData, isLoading: menusLoading, error: menusError } =
    useQuery<MenuItem[]>({ queryKey: ['myMenus'], queryFn: getMyMenus, enabled: authenticated, staleTime: 5 * 60 * 1000 })

  const { data: apisData, isLoading: apisLoading, error: apisError } =
    useQuery<ApiPermission[]>({ queryKey: ['myApis'], queryFn: getMyApis, enabled: authenticated, staleTime: 5 * 60 * 1000 })

  useEffect(() => { if (menusData) setMenus(menusData) }, [menusData])
  useEffect(() => {
    if (apisData) { setApiPermissions(apisData); localStorage.setItem('apiPermissions', JSON.stringify(apisData)) }
  }, [apisData])

  const hasApiPermission = (path: string, method: string): boolean => {
    if (!authenticated || !apiPermissions.length) return false
    const normalizedPath   = path.split('?')[0].replace(/\/$/, '')
    const normalizedMethod = method.toUpperCase()
    return apiPermissions.some((api) => {
      const apiPath   = api.path?.split('{')[0].replace(/\/$/, '') ?? ''
      const apiMethod = api.method?.toUpperCase() ?? 'GET'
      if (apiMethod !== normalizedMethod) return false
      if (apiPath === normalizedPath) return true
      if (apiPath.includes('{')) {
        const base = apiPath.replace(/\{[^}]+\}/g, '').replace(/\/$/, '')
        if (normalizedPath === base) return true
        const pattern = apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+')
        if (new RegExp(`^${pattern}$`).test(normalizedPath)) return true
      }
      return false
    })
  }

  const hasMenuPermission = (path: string): boolean => {
    if (!authenticated || !menus.length) return false
    const find = (list: MenuItem[], target: string): boolean =>
      list.some((m) => m.path === target || (!!m.children?.length && find(m.children, target)))
    return find(menus, path)
  }

  return (
    <PermissionContext.Provider value={{
      menus, apiPermissions,
      menusLoading, apisLoading, menusError, apisError,
      hasApiPermission, hasMenuPermission,
      isLoading: menusLoading || apisLoading,
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = (): PermissionContextValue => {
  const ctx = useContext(PermissionContext)
  if (!ctx) throw new Error('usePermissions must be used within a PermissionProvider')
  return ctx
}
