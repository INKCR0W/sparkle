import { copyFile, readdir, readFile, writeFile } from 'fs/promises'
import { themesDir } from '../utils/dirs'
import path from 'path'
import axios from 'axios'
import AdmZip from 'adm-zip'
import { getControledMihomoConfig } from '../config'
import { existsSync } from 'fs'
import { mainWindow } from '..'
import { floatingWindow } from './floatingWindow'

let insertedCSSKeyMain: string | undefined = undefined
let insertedCSSKeyFloating: string | undefined = undefined

function isValidThemeName(theme: string): boolean {
  const normalized = path.normalize(theme)
  return !normalized.includes('..') && !path.isAbsolute(normalized) && normalized === theme
}

function normalizeThemeCss(css: string): string {
  const hasLegacyHeroUIVars = /--heroui-(primary|secondary|warning|danger)\s*:/i.test(css)
  const hasV3Tokens = /--(accent|secondary|warning|danger)\s*:/i.test(css)
  // Check if any target v3 tokens are already hsl-wrapped to prevent double nesting
  const hasPreWrappedHsl = /--(accent|secondary|warning|danger|success|focus)[^:]*:\s*hsl\(/i.test(css)

  if (!hasLegacyHeroUIVars || hasV3Tokens || hasPreWrappedHsl) return css

  return `${css}

/* Sparkle compatibility: HeroUI v2 -> v3 token bridge */
.dark,
.light,
.default,
[data-theme='dark'],
[data-theme='light'],
[data-theme='default'] {
  --accent: hsl(var(--heroui-primary)) !important;
  --accent-foreground: hsl(var(--heroui-primary-foreground, 0 0% 100%)) !important;
  --secondary: hsl(var(--heroui-secondary, var(--heroui-primary))) !important;
  --secondary-foreground: hsl(var(--heroui-secondary-foreground, 0 0% 100%)) !important;
  --success: hsl(var(--heroui-success, 145 79% 44%)) !important;
  --success-foreground: hsl(var(--heroui-success-foreground, 0 0% 100%)) !important;
  --warning: hsl(var(--heroui-warning, 37 91% 55%)) !important;
  --warning-foreground: hsl(var(--heroui-warning-foreground, 0 0% 0%)) !important;
  --danger: hsl(var(--heroui-danger, 339 90% 51%)) !important;
  --danger-foreground: hsl(var(--heroui-danger-foreground, 0 0% 100%)) !important;
  --focus: hsl(var(--heroui-focus, var(--heroui-primary))) !important;
}`
}

export async function resolveThemes(): Promise<{ key: string; label: string }[]> {
  const files = await readdir(themesDir())
  const themes = await Promise.all(
    files
      .filter((file) => file.endsWith('.css'))
      .map(async (file) => {
        const css = (await readFile(path.join(themesDir(), file), 'utf-8')) || ''
        let name = file
        if (css.startsWith('/*')) {
          name = css.split('\n')[0].replace('/*', '').replace('*/', '').trim() || file
        }
        return { key: file, label: name }
      })
  )
  if (themes.find((theme) => theme.key === 'default.css')) {
    return themes
  } else {
    return [{ key: 'default.css', label: '默认' }, ...themes]
  }
}

export async function fetchThemes(): Promise<void> {
  const zipUrl = 'https://github.com/mihomo-party-org/theme-hub/releases/download/latest/themes.zip'
  const { 'mixed-port': mixedPort = 7890 } = await getControledMihomoConfig()
  const zipData = await axios.get(zipUrl, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/octet-stream' },
    ...(mixedPort != 0 && {
      proxy: {
        protocol: 'http',
        host: '127.0.0.1',
        port: mixedPort
      }
    })
  })
  const zip = new AdmZip(zipData.data as Buffer)
  const targetDir = themesDir()
  for (const entry of zip.getEntries()) {
    const normalized = path.normalize(entry.entryName)
    if (normalized.includes('..') || path.isAbsolute(normalized)) {
      throw new Error(`Invalid path in archive: ${entry.entryName}`)
    }
  }
  zip.extractAllTo(targetDir, true)
}

export async function importThemes(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      if (existsSync(file)) {
        await copyFile(
          file,
          path.join(themesDir(), `${new Date().getTime().toString(16)}-${path.basename(file)}`)
        )
      }
    } catch {
      // ignore individual file copy errors
    }
  }
}

export async function readTheme(theme: string): Promise<string> {
  if (!isValidThemeName(theme)) return ''
  if (!existsSync(path.join(themesDir(), theme))) return ''
  return await readFile(path.join(themesDir(), theme), 'utf-8')
}

export async function writeTheme(theme: string, css: string): Promise<void> {
  if (!isValidThemeName(theme)) {
    throw new Error('Invalid theme name')
  }
  await writeFile(path.join(themesDir(), theme), css)
}

export async function applyTheme(theme: string): Promise<void> {
  const css = normalizeThemeCss(await readTheme(theme))
  try {
    await mainWindow?.webContents.removeInsertedCSS(insertedCSSKeyMain || '')
    insertedCSSKeyMain = await mainWindow?.webContents.insertCSS(css)
  } catch {
    // ignore main window errors
  }
  try {
    await floatingWindow?.webContents.removeInsertedCSS(insertedCSSKeyFloating || '')
    insertedCSSKeyFloating = await floatingWindow?.webContents.insertCSS(css)
  } catch {
    // ignore floating window errors
  }
}
