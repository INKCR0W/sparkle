import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { I18nContext } from './context'
import type { I18nContextState } from './context'
import { initRendererI18n, cleanupRendererI18n, i18n } from '../i18n'
import type { LanguageCode, LoadResult } from '../../../shared/i18n/types'
import { createLanguageCode } from '../../../shared/i18n/types'

export interface I18nProviderProps {
  children: React.ReactNode

  fallback?: React.ReactNode

  errorFallback?: (error: Error, retry: () => void) => React.ReactNode

  onInitialized?: (language: LanguageCode) => void

  onLanguageChanged?: (from: LanguageCode, to: LanguageCode) => void

  onError?: (error: Error) => void
}

export function I18nProvider({
  children,
  fallback,
  errorFallback,
  onInitialized,
  onLanguageChanged,
  onError
}: I18nProviderProps): React.ReactElement {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [language, setLanguage] = useState<LanguageCode | null>(null)

  const reinitLockRef = React.useRef(false)

  const cleanupTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const mountedRef = React.useRef(true)

  const onInitializedRef = React.useRef(onInitialized)
  const onLanguageChangedRef = React.useRef(onLanguageChanged)
  const onErrorRef = React.useRef(onError)

  React.useEffect(() => {
    onInitializedRef.current = onInitialized
    onLanguageChangedRef.current = onLanguageChanged
    onErrorRef.current = onError
  }, [onInitialized, onLanguageChanged, onError])

  const initialize = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await initRendererI18n()
      const currentLanguage = createLanguageCode(i18n.language)
      setLanguage(currentLanguage)
      setReady(true)
      setLoading(false)

      window.electron.ipcRenderer.send('languageChanged', currentLanguage)

      if (onInitializedRef.current) {
        onInitializedRef.current(currentLanguage)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setLoading(false)
      setReady(false)

      if (onErrorRef.current) {
        onErrorRef.current(error)
      }

      console.error('[i18n] Failed to initialize:', error)
    }
  }, [])

  const changeLanguage = useCallback(async (newLanguage: LanguageCode) => {
    if (!i18n) {
      throw new Error('i18n not initialized')
    }

    const oldLanguage = createLanguageCode(i18n.language)

    try {
      const hasResources = i18n.hasResourceBundle(newLanguage, 'common')

      if (!hasResources) {
        const { createTranslationLoader } = await import('../../../shared/i18n/loader')
        const { createLRUCache } = await import('../../../shared/i18n/cache')
        const { I18N_CONFIG } = await import('../../../shared/i18n/config')

        const cache = createLRUCache<string, LoadResult>({ maxSize: 100 })
        const loader = createTranslationLoader(cache)

        const languagesToLoad = [newLanguage, ...I18N_CONFIG.fallbackLanguage].filter(
          (lang, index, self) => self.indexOf(lang) === index
        )

        for (const lang of languagesToLoad) {
          const langHasResources = i18n.hasResourceBundle(lang, 'common')
          if (langHasResources) {
            continue
          }

          await i18n.changeLanguage(lang)
          const normalizedLang = i18n.language

          for (const ns of I18N_CONFIG.namespaces) {
            try {
              const result = await loader.load(lang, ns)
              if (result.success) {
                i18n.addResourceBundle(normalizedLang, ns as string, result.data.merged, true, true)
              }
            } catch (error) {
              console.error(`[i18n] Failed to load ${lang}/${ns}:`, error)
            }
          }
        }
      }

      await i18n.changeLanguage(newLanguage)
      setLanguage(newLanguage)

      window.electron.ipcRenderer.send('languageChanged', newLanguage)

      try {
        const { destroyDriver } = await import('../utils/driver')
        destroyDriver()
      } catch (error) {
        console.warn('[i18n] Failed to destroy driver on language change:', error)
      }

      if (onLanguageChangedRef.current) {
        onLanguageChangedRef.current(oldLanguage, newLanguage)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to change language')
      console.error('[i18n] Failed to change language:', error)

      if (onErrorRef.current) {
        onErrorRef.current(error)
      }

      throw error
    }
  }, [])

  const reinitialize = useCallback(async () => {
    if (reinitLockRef.current) {
      console.warn('[i18n] Already reinitializing, skipping')
      return
    }

    reinitLockRef.current = true

    try {
      setLoading(true)

      cleanupRendererI18n()

      await new Promise((resolve) => setTimeout(resolve, 100))

      await initialize()
    } finally {
      reinitLockRef.current = false
    }
  }, [initialize])

  useEffect(() => {
    mountedRef.current = true

    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    initialize().catch((err) => {
      if (mountedRef.current) {
        console.error('[i18n] Initialization failed:', err)
      }
    })

    return () => {
      mountedRef.current = false

      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current)
        cleanupTimerRef.current = null
      }

      cleanupTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) {
          cleanupRendererI18n()
        }
        cleanupTimerRef.current = null
      }, 100)
    }
  }, [initialize])

  const contextValue = useMemo<I18nContextState>(
    () => ({
      i18n,
      ready,
      language,
      error,
      loading,
      changeLanguage,
      reinitialize
    }),
    [ready, language, error, loading, changeLanguage, reinitialize]
  )

  if (error && errorFallback) {
    return <>{errorFallback(error, reinitialize)}</>
  }

  if (loading && fallback) {
    return <>{fallback}</>
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export function DefaultLoadingFallback(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}
        />
        <p style={{ color: '#666' }}>Loading translations...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function DefaultErrorFallback({
  error,
  retry
}: {
  error: Error
  retry: () => void
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
        <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>Translation Error</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>{error.message}</p>
        <button
          onClick={retry}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}

export function I18nProviderWithDefaults({
  children,
  ...props
}: Omit<I18nProviderProps, 'fallback' | 'errorFallback'>): React.ReactElement {
  return (
    <I18nProvider
      fallback={<DefaultLoadingFallback />}
      errorFallback={(error, retry) => <DefaultErrorFallback error={error} retry={retry} />}
      {...props}
    >
      {children}
    </I18nProvider>
  )
}
