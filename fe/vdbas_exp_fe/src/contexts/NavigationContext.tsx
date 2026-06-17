import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import React from 'react'

interface NavigationContextValue {
  path: string
  params: URLSearchParams
  navKey: number
  navigate: (path: string, params?: Record<string, string>) => void
}

const NavigationContext = createContext<NavigationContextValue>({
  path: '/',
  params: new URLSearchParams(),
  navKey: 0,
  navigate: () => {},
})

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({ path: '/', params: new URLSearchParams(), navKey: 0 })

  const navigate = useCallback((newPath: string, newParams?: Record<string, string>) => {
    setState((prev) => ({
      path: newPath,
      params: new URLSearchParams(newParams),
      navKey: prev.navKey + 1,
    }))
  }, [])

  return (
    <NavigationContext.Provider value={{ ...state, navigate }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => useContext(NavigationContext)
