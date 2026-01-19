import type {
  LanguageCode,
  Namespace,
  TranslationResource,
  LoadResult,
  ITranslationLoader,
  ICache,
  TranslationSource
} from './types'
import { ok, err } from './types'
import { LoadError as LoadErrorClass } from './types'
import { deepMerge } from './utils'

interface ElectronWindow {
  electron?: {
    ipcRenderer?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}

export interface ILoadStrategy {
  readonly name: TranslationSource

  load(language: LanguageCode, namespace: Namespace): Promise<TranslationResource>
}

export class BuiltinLoadStrategy implements ILoadStrategy {
  readonly name: TranslationSource = 'builtin'

  async load(language: LanguageCode, namespace: Namespace): Promise<TranslationResource> {
    try {
      let data: Record<string, unknown>

      switch (language) {
        case 'zh-CN':
          data = await import('../../shared/locales/zh-CN.json')
          break
        case 'en-US':
          data = await import('../../shared/locales/en-US.json')
          break
        case 'zh-TW':
          data = await import('../../shared/locales/zh-TW.json')
          break
        default:
          return {}
      }

      const translations = data.default || data
      return translations[namespace] || {}
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'MODULE_NOT_FOUND') {
        console.warn(`[i18n] Failed to load builtin translation: ${language}/${namespace}`, error)
      }
      return {}
    }
  }
}

interface IpcResult {
  success: boolean
  data?: TranslationResource
  error?: string
}

async function loadWithRetry(
  channel: string,
  language: LanguageCode,
  namespace: Namespace,
  maxRetries: number
): Promise<TranslationResource> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = (await (window as ElectronWindow).electron?.ipcRenderer?.invoke(
        channel,
        language,
        namespace
      )) as IpcResult | undefined

      if (result && typeof result === 'object') {
        if ('success' in result && 'data' in result) {
          if (result.success) {
            return result.data || ({} as TranslationResource)
          }

          const errorCode = result.error
          const nonRetryableErrors = [
            'ENOENT', // 文件不存在
            'INVALID_PARAMS', // 参数无效
            'INVALID_FORMAT', // 格式无效
            'PARAM_TOO_LONG', // 参数过长
            'UNSAFE_PATH', // 不安全的路径
            'PARSE_ERROR', // JSON 解析错误
            'STAT_ERROR', // 文件状态检查失败
            'EACCES', // 权限拒绝
            'EPERM', // 操作不允许
            'FILE_TOO_LARGE', // 文件过大
            'VALIDATION_ERROR' // 验证错误
          ]

          if (errorCode && nonRetryableErrors.includes(errorCode)) {
            if (errorCode !== 'ENOENT') {
              console.error(
                `[i18n] Critical error loading translation: ${errorCode} for ${language}/${namespace}`
              )
            }
            return {} as TranslationResource
          }
          throw new Error(`IPC error: ${errorCode}`)
        }
        return result as unknown as TranslationResource
      }

      return {} as TranslationResource
    } catch (error) {
      lastError = error as Error

      const errorMessage = lastError.message || ''
      const errorName = lastError.name || ''

      const isClientError =
        errorName === 'TypeError' ||
        errorName === 'ReferenceError' ||
        errorMessage.includes('is not a function') ||
        errorMessage.includes('is not defined') ||
        errorMessage.includes('Cannot read propert') || // 匹配 property 和 properties
        errorMessage.includes('is not iterable')

      if (isClientError || attempt >= maxRetries) {
        if (isClientError) {
          console.error(
            `[i18n] Non-retryable client error loading translation: ${language}/${namespace}`,
            lastError
          )
        } else {
          console.error(
            `[i18n] Failed to load translation after ${maxRetries + 1} attempts: ${language}/${namespace}`,
            lastError
          )
        }
        return {} as TranslationResource
      }

      console.warn(
        `[i18n] IPC call failed (attempt ${attempt + 1}/${maxRetries + 1}): ${channel}`,
        error
      )

      const delay = Math.min(50 * Math.pow(2, attempt), 500)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return {} as TranslationResource
}

export class ExternalLoadStrategy implements ILoadStrategy {
  readonly name: TranslationSource = 'external'

  private readonly maxRetries: number

  constructor(maxRetries = 1) {
    this.maxRetries = maxRetries
  }

  async load(language: LanguageCode, namespace: Namespace): Promise<TranslationResource> {
    if (
      typeof window === 'undefined' ||
      !(window as ElectronWindow).electron?.ipcRenderer?.invoke
    ) {
      return {}
    }

    return await loadWithRetry('i18n:loadExternal', language, namespace, this.maxRetries)
  }
}

export class CustomLoadStrategy implements ILoadStrategy {
  readonly name: TranslationSource = 'custom'

  private readonly maxRetries: number

  constructor(maxRetries = 1) {
    this.maxRetries = maxRetries
  }

  async load(language: LanguageCode, namespace: Namespace): Promise<TranslationResource> {
    if (
      typeof window === 'undefined' ||
      !(window as ElectronWindow).electron?.ipcRenderer?.invoke
    ) {
      return {}
    }

    return await loadWithRetry('i18n:loadCustom', language, namespace, this.maxRetries)
  }
}

export interface TranslationLoaderConfig {
  readonly cache: ICache<string, LoadResult>

  readonly strategies: ReadonlyMap<TranslationSource, ILoadStrategy>
}

export class TranslationLoader implements ITranslationLoader {
  private readonly cache: ICache<string, LoadResult>
  private readonly strategies: ReadonlyMap<TranslationSource, ILoadStrategy>

  constructor(config: TranslationLoaderConfig) {
    this.cache = config.cache
    this.strategies = config.strategies
  }

  async load(language: LanguageCode, namespace: Namespace): Promise<LoadResult> {
    const cacheKey = `${language}\x00${namespace}`

    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const results = await Promise.allSettled([
        this.loadFromStrategy('builtin', language, namespace),
        this.loadFromStrategy('external', language, namespace),
        // this.loadFromStrategy('custom', language, namespace)
        Promise.resolve({})
      ])

      const builtin = results[0].status === 'fulfilled' ? results[0].value : {}
      const external = results[1].status === 'fulfilled' ? results[1].value : {}
      const custom = results[2].status === 'fulfilled' ? results[2].value : {}

      const merged = deepMerge<TranslationResource>(builtin, external, custom)

      const result = ok({
        builtin,
        external,
        custom,
        merged
      })

      this.cache.set(cacheKey, result)

      return result
    } catch (error) {
      const loadError = new LoadErrorClass(
        `Failed to load translation: ${language}/${namespace}`,
        language,
        namespace,
        error instanceof Error ? error : undefined
      )

      return err(loadError)
    }
  }

  private async loadFromStrategy(
    source: TranslationSource,
    language: LanguageCode,
    namespace: Namespace
  ): Promise<TranslationResource> {
    const strategy = this.strategies.get(source)
    if (!strategy) {
      console.warn(`[i18n] Strategy not found: ${source}`)
      return {}
    }

    try {
      return await strategy.load(language, namespace)
    } catch (error) {
      console.error(`[i18n] Strategy ${source} failed:`, error)
      return {}
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  clearLanguageCache(language: LanguageCode): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${language}\x00`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }
}

export function createTranslationLoader(
  cache: ICache<string, LoadResult>,
  maxRetries = 1
): ITranslationLoader {
  const strategies = new Map<TranslationSource, ILoadStrategy>([
    ['builtin', new BuiltinLoadStrategy()],
    ['external', new ExternalLoadStrategy(maxRetries)],
    ['custom', new CustomLoadStrategy(maxRetries)]
  ])

  return new TranslationLoader({ cache, strategies })
}
