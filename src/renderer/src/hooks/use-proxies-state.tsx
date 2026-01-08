import React, { createContext, useContext, ReactNode, useRef, useState, useCallback } from 'react'

interface ProxiesStateContextType {
  getIsOpen: (groupName: string) => boolean
  getSearchValue: (groupName: string) => string
  setIsOpen: (groupName: string, value: boolean) => void
  setSearchValue: (groupName: string, value: string) => void
  syncGroups: (groupNames: string[]) => void
}

const ProxiesStateContext = createContext<ProxiesStateContextType | undefined>(undefined)

export const ProxiesStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isOpenMapRef = useRef<Map<string, boolean>>(new Map())
  const searchValueMapRef = useRef<Map<string, string>>(new Map())
  // 用于触发重渲染的版本号
  const [, setVersion] = useState(0)
  const forceUpdate = useCallback(() => setVersion((v) => v + 1), [])

  const getIsOpen = useCallback((groupName: string) => {
    return isOpenMapRef.current.get(groupName) ?? false
  }, [])

  const getSearchValue = useCallback((groupName: string) => {
    return searchValueMapRef.current.get(groupName) ?? ''
  }, [])

  const setIsOpen = useCallback(
    (groupName: string, value: boolean) => {
      if (isOpenMapRef.current.get(groupName) !== value) {
        isOpenMapRef.current.set(groupName, value)
        forceUpdate()
      }
    },
    [forceUpdate]
  )

  const setSearchValue = useCallback(
    (groupName: string, value: string) => {
      if (searchValueMapRef.current.get(groupName) !== value) {
        searchValueMapRef.current.set(groupName, value)
        forceUpdate()
      }
    },
    [forceUpdate]
  )

  const syncGroups = useCallback(
    (groupNames: string[]) => {
      const groupNameSet = new Set(groupNames)
      let changed = false
      // 删除不存在的组
      for (const key of isOpenMapRef.current.keys()) {
        if (!groupNameSet.has(key)) {
          isOpenMapRef.current.delete(key)
          changed = true
        }
      }
      for (const key of searchValueMapRef.current.keys()) {
        if (!groupNameSet.has(key)) {
          searchValueMapRef.current.delete(key)
          changed = true
        }
      }
      if (changed) {
        forceUpdate()
      }
    },
    [forceUpdate]
  )

  return (
    <ProxiesStateContext.Provider
      value={{ getIsOpen, getSearchValue, setIsOpen, setSearchValue, syncGroups }}
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
