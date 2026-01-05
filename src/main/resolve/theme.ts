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
    if (existsSync(file))
      await copyFile(
        file,
        path.join(themesDir(), `${new Date().getTime().toString(16)}-${path.basename(file)}`)
      )
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
  const css = await readTheme(theme)
  await mainWindow?.webContents.removeInsertedCSS(insertedCSSKeyMain || '')
  insertedCSSKeyMain = await mainWindow?.webContents.insertCSS(css)
  try {
    await floatingWindow?.webContents.removeInsertedCSS(insertedCSSKeyFloating || '')
    insertedCSSKeyFloating = await floatingWindow?.webContents.insertCSS(css)
  } catch {
    // ignore
  }
}
