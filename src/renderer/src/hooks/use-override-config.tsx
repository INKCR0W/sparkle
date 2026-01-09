import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import useSWR from 'swr'
import {
  getOverrideConfig,
  setOverrideConfig as set,
  addOverrideItem as add,
  removeOverrideItem as remove,
  updateOverrideItem as update
} from '@renderer/utils/ipc'

interface OverrideConfigContextType {
  overrideConfig: OverrideConfig | undefined
  setOverrideConfig: (config: OverrideConfig) => Promise<void>
  mutateOverrideConfig: () => void
  addOverrideItem: (item: Partial<OverrideItem>) => Promise<void>
  updateOverrideItem: (item: OverrideItem) => Promise<void>
  removeOverrideItem: (id: string) => Promise<void>
}

const OverrideConfigContext = createContext<OverrideConfigContextType | undefined>(undefined)

export const OverrideConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: overrideConfig, mutate: mutateOverrideConfig } = useSWR('getOverrideConfig', () =>
    getOverrideConfig()
  )

  const setOverrideConfig = async (config: OverrideConfig): Promise<void> => {
    try {
      await set(config)
    } catch (e) {
      alert(e)
    } finally {
      mutateOverrideConfig()
    }
  }

  const addOverrideItem = async (item: Partial<OverrideItem>): Promise<void> => {
    try {
      await add(item)
    } catch (e) {
      alert(e)
    } finally {
      mutateOverrideConfig()
    }
  }

  const removeOverrideItem = async (id: string): Promise<void> => {
    try {
      await remove(id)
    } catch (e) {
      alert(e)
    } finally {
      mutateOverrideConfig()
    }
  }

  const updateOverrideItem = async (item: OverrideItem): Promise<void> => {
    try {
      await update(item)
    } catch (e) {
      alert(e)
    } finally {
      mutateOverrideConfig()
    }
  }

  useEffect(() => {
    const unsubOverrideConfigUpdated = window.electron.ipcRenderer.on(
      'overrideConfigUpdated',
      () => {
        mutateOverrideConfig()
      }
    )
    return (): void => {
      unsubOverrideConfigUpdated()
    }
  }, [mutateOverrideConfig])

  return (
    <OverrideConfigContext.Provider
      value={{
        overrideConfig,
        setOverrideConfig,
        mutateOverrideConfig,
        addOverrideItem,
        removeOverrideItem,
        updateOverrideItem
      }}
    >
      {children}
    </OverrideConfigContext.Provider>
  )
}

export const useOverrideConfig = (): OverrideConfigContextType => {
  const context = useContext(OverrideConfigContext)
  if (context === undefined) {
    throw new Error('useOverrideConfig must be used within an OverrideConfigProvider')
  }
  return context
}
