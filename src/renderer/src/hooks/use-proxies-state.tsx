import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'

interface ProxiesStateContextType {
  isOpenMap: Map<string, boolean>
  searchValueMap: Map<string, string>
  setIsOpen: (groupName: string, value: boolean) => void
  setSearchValue: (groupName: string, value: string) => void
  syncGroups: (groupNames: string[]) => void
}

const ProxiesStateContext = createContext<ProxiesStateContextType | undefined>(undefined)

export const ProxiesStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpenMap, setIsOpenMap] = useState<Map<string, boolean>>(new Map())
  const [searchValueMap, setSearchValueMap] = useState<Map<string, string>>(new Map())

  const setIsOpen = useCallback((groupName: string, value: boolean) => {
    setIsOpenMap((prev) => {
      if (prev.get(groupName) === value) return prev
      const next = new Map(prev)
      next.set(groupName, value)
      return next
    })
  }, [])

  const setSearchValue = useCallback((groupName: string, value: string) => {
    setSearchValueMap((prev) => {
      if (prev.get(groupName) === value) return prev
      const next = new Map(prev)
      next.set(groupName, value)
      return next
    })
  }, [])

  const syncGroups = useCallback((groupNames: string[]) => {
    const groupNameSet = new Set(groupNames)
    setIsOpenMap((prev) => {
      let changed = false
      for (const key of prev.keys()) {
        if (!groupNameSet.has(key)) {
          changed = true
          break
        }
      }
      if (!changed) return prev
      const next = new Map(prev)
      for (const key of next.keys()) {
        if (!groupNameSet.has(key)) {
          next.delete(key)
        }
      }
      return next
    })
    setSearchValueMap((prev) => {
      let changed = false
      for (const key of prev.keys()) {
        if (!groupNameSet.has(key)) {
          changed = true
          break
        }
      }
      if (!changed) return prev
      const next = new Map(prev)
      for (const key of next.keys()) {
        if (!groupNameSet.has(key)) {
          next.delete(key)
        }
      }
      return next
    })
  }, [])

  return (
    <ProxiesStateContext.Provider
      value={{ isOpenMap, searchValueMap, setIsOpen, setSearchValue, syncGroups }}
    >
      {children}
    </ProxiesStateContext.Provider>
  )
}

export const useProxiesState = (): ProxiesStateContextType => {
  const context = useContext(ProxiesStateContext)
  if (context === undefined) {
    throw new Error('useProxiesState must be used within a ProxiesStateProvider')
  }
  return context
}
