import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react'
import { useAppConfig } from './use-app-config'

interface ProxiesStateContextType {
  isOpenMap: Map<string, boolean>
  searchValueMap: Map<string, string>
  setIsOpen: (groupName: string, value: boolean) => void
  setSearchValue: (groupName: string, value: string) => void
  syncGroups: (groupNames: string[]) => void
}

const ProxiesStateContext = createContext<ProxiesStateContextType | undefined>(undefined)

export const ProxiesStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isOpenMapRef = useRef<Map<string, boolean>>(new Map())
  const searchValueMapRef = useRef<Map<string, string>>(new Map())
  const isUpdatingFromConfigRef = useRef(false)
  const isInitializedRef = useRef(false)
  const patchAppConfigRef = useRef(patchAppConfig)

  const [isOpenMap, setIsOpenMap] = useState<Map<string, boolean>>(new Map())
  const [searchValueMap, setSearchValueMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    patchAppConfigRef.current = patchAppConfig
  }, [patchAppConfig])

  useEffect(() => {
    if (appConfig?.proxyGroupsState) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = undefined
      }

      isUpdatingFromConfigRef.current = true

      const newOpenMap = appConfig.proxyGroupsState.openState
        ? new Map(Object.entries(appConfig.proxyGroupsState.openState))
        : new Map()
      setIsOpenMap(newOpenMap)
      isOpenMapRef.current = newOpenMap

      const newSearchMap = appConfig.proxyGroupsState.searchState
        ? new Map(Object.entries(appConfig.proxyGroupsState.searchState))
        : new Map()
      setSearchValueMap(newSearchMap)
      searchValueMapRef.current = newSearchMap

      isInitializedRef.current = true

      queueMicrotask(() => {
        isUpdatingFromConfigRef.current = false
      })
    } else if (!isInitializedRef.current) {
      isInitializedRef.current = true
    }
  }, [appConfig?.proxyGroupsState])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const debouncedSave = useCallback(() => {
    if (isUpdatingFromConfigRef.current) {
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      if (isUpdatingFromConfigRef.current) {
        return
      }

      patchAppConfigRef
        .current({
          proxyGroupsState: {
            openState: Object.fromEntries(isOpenMapRef.current),
            searchState: Object.fromEntries(searchValueMapRef.current)
          }
        })
        .catch(() => {
          // ignore
        })
    }, 500)
  }, [])

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

  // 监听 state 变化，更新 ref 并触发保存
  useEffect(() => {
    // 如果还未初始化或正在从配置更新，不触发保存
    if (!isInitializedRef.current || isUpdatingFromConfigRef.current) {
      return
    }

    // 更新 ref
    isOpenMapRef.current = isOpenMap
    searchValueMapRef.current = searchValueMap

    // 触发防抖保存
    debouncedSave()
  }, [isOpenMap, searchValueMap, debouncedSave])

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
