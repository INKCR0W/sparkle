import { app, ipcMain } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface TranslationData {
  [key: string]: string | TranslationData
}

let translations: TranslationData = {}
let currentLanguage = 'zh-CN'

function deepMerge(target: TranslationData, source: TranslationData): TranslationData {
  const result = { ...target }
  const maxDepth = 10

  function merge(
    targetObj: TranslationData,
    sourceObj: TranslationData,
    depth: number,
    visited: WeakSet<object>
  ): TranslationData {
    if (depth > maxDepth) {
      console.warn('[i18n] deepMerge: max depth exceeded, stopping recursion')
      return targetObj
    }

    if (typeof sourceObj === 'object' && sourceObj !== null) {
      if (visited.has(sourceObj)) {
        console.warn('[i18n] deepMerge: circular reference detected, skipping')
        return targetObj
      }
      visited.add(sourceObj)
    }

    const merged = { ...targetObj }

    for (const key in sourceObj) {
      if (Object.prototype.hasOwnProperty.call(sourceObj, key)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          console.error(`[i18n] deepMerge: dangerous key detected and rejected: ${key}`)
          continue
        }

        const sourceValue = sourceObj[key]
        const targetValue = merged[key]

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          merged[key] = merge(
            targetValue as TranslationData,
            sourceValue as TranslationData,
            depth + 1,
            visited
          )
        } else {
          merged[key] = sourceValue
        }
      }
    }

    return merged
  }

  return merge(result, source, 0, new WeakSet<object>())
}

export function initMainI18n(): void {
  const locale = app.getLocale()
  currentLanguage =
    locale.startsWith('zh-TW') || locale.startsWith('zh-HK')
      ? 'zh-TW'
      : locale.startsWith('en')
        ? 'en-US'
        : 'zh-CN'

  loadTranslations()

  ipcMain.on('languageChanged', (_event, language: string) => {
    changeLanguage(language)
  })
}

function loadTranslations(): void {
  try {
    let builtinPath: string
    let customPath: string
    let fallbackPath: string

    if (app.isPackaged) {
      builtinPath = join(process.resourcesPath, 'resources', 'locales', `${currentLanguage}.json`)
      customPath = join(app.getPath('userData'), 'locales', `${currentLanguage}.json`)
      fallbackPath = join(process.resourcesPath, 'resources', 'locales', 'zh-CN.json')
    } else {
      // 在开发模式下，使用 app.getAppPath() 获取项目根目录
      const appPath = app.getAppPath()
      builtinPath = join(appPath, 'src', 'shared', 'locales', `${currentLanguage}.json`)
      customPath = join(app.getPath('userData'), 'locales', `${currentLanguage}.json`)
      fallbackPath = join(appPath, 'src', 'shared', 'locales', 'zh-CN.json')
    }

    let builtinData: TranslationData = {}
    if (existsSync(builtinPath)) {
      const data = readFileSync(builtinPath, 'utf-8')
      builtinData = JSON.parse(data)
    } else if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8')
      builtinData = JSON.parse(data)
    }

    let customData: TranslationData = {}
    if (existsSync(customPath)) {
      try {
        const data = readFileSync(customPath, 'utf-8')
        customData = JSON.parse(data)
      } catch (error) {
        console.warn('[i18n] Failed to load custom translations:', error)
      }
    }

    translations = deepMerge(builtinData, customData)
  } catch (error) {
    console.error('[i18n] Failed to load translations:', error)
    translations = {}
  }
}

export function t(keyPath: string, params?: Record<string, string | number>): string {
  const keys = keyPath.split('.')
  let value: string | TranslationData | undefined = translations

  for (const key of keys) {
    if (typeof value === 'object' && value !== null) {
      value = value[key]
    } else {
      return keyPath
    }
  }

  if (typeof value !== 'string') {
    return keyPath
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() ?? match
    })
  }

  return value
}

export function changeLanguage(lang: string): void {
  currentLanguage = lang
  loadTranslations()
}

export function getCurrentLanguage(): string {
  return currentLanguage
}
