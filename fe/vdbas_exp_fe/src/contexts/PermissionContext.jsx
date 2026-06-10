import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext.jsx'
import { getMyMenus, getMyApis } from '../services/aclService.js'

const PermissionContext = createContext(null)

export const PermissionProvider = ({ children }) => {
  const { authenticated } = useAuth()
  const [menus, setMenus] = useState([])
  const [apiPermissions, setApiPermissions] = useState(() => {
    const saved = localStorage.getItem('apiPermissions')
    return saved ? JSON.parse(saved) : []
  })

  const {
    data: menusData,
    isLoading: menusLoading,
    error: menusError,
  } = useQuery({
    queryKey: ['myMenus'],
    queryFn: getMyMenus,
    enabled: authenticated,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: apisData,
    isLoading: apisLoading,
    error: apisError,
  } = useQuery({
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
  const hasApiPermission = (path, method) => {
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
  const hasMenuPermission = (path) => {
    if (!authenticated || !menus.length) return false

    const findMenu = (menuList, targetPath) => {
      for (const menu of menuList) {
        if (menu.path === targetPath) return true
        if (menu.children?.length && findMenu(menu.children, targetPath)) return true
      }
      return false
    }

    return findMenu(menus, path)
  }

  const value = {
    menus,
    apiPermissions,
    menusLoading,
    apisLoading,
    menusError,
    apisError,
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
