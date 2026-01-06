import { getAppConfig } from '../config'
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'
import path from 'path'
import {
  appConfigPath,
  controledMihomoConfigPath,
  dataDir,
  overrideConfigPath,
  overrideDir,
  profileConfigPath,
  profilesDir,
  subStoreDir,
  themesDir
} from '../utils/dirs'

function isValidFilename(filename: string): boolean {
  const normalized = path.normalize(filename)
  return !normalized.includes('..') && !path.isAbsolute(normalized) && !filename.includes('/')
}

function isValidWebdavUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function webdavBackup(): Promise<boolean> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  if (!isValidWebdavUrl(webdavUrl)) {
    throw new Error('Invalid WebDAV URL')
  }

  const zip = new AdmZip()

  zip.addLocalFile(appConfigPath())
  zip.addLocalFile(controledMihomoConfigPath())
  zip.addLocalFile(profileConfigPath())
  zip.addLocalFile(overrideConfigPath())
  zip.addLocalFolder(themesDir(), 'themes')
  zip.addLocalFolder(profilesDir(), 'profiles')
  zip.addLocalFolder(overrideDir(), 'override')
  zip.addLocalFolder(subStoreDir(), 'substore')
  const date = new Date()
  const zipFileName = `${process.platform}_${dayjs(date).format('YYYY-MM-DD_HH-mm-ss')}.zip`

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  try {
    await client.createDirectory(webdavDir)
  } catch {
    // ignore
  }

  return await client.putFileContents(`${webdavDir}/${zipFileName}`, zip.toBuffer())
}

export async function webdavRestore(filename: string): Promise<void> {
  if (!isValidFilename(filename)) {
    throw new Error('Invalid filename')
  }

  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  if (!isValidWebdavUrl(webdavUrl)) {
    throw new Error('Invalid WebDAV URL')
  }

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  const zipData = await client.getFileContents(`${webdavDir}/${filename}`)
  const zip = new AdmZip(zipData as Buffer)
  const targetDir = dataDir()
  for (const entry of zip.getEntries()) {
    const normalized = path.normalize(entry.entryName)
    if (normalized.includes('..') || path.isAbsolute(normalized)) {
      throw new Error(`Invalid path in archive: ${entry.entryName}`)
    }
  }
  zip.extractAllTo(targetDir, true)
}

export async function listWebdavBackups(): Promise<string[]> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  if (!isValidWebdavUrl(webdavUrl)) {
    throw new Error('Invalid WebDAV URL')
  }

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  const files = await client.getDirectoryContents(webdavDir, { glob: '*.zip' })
  if (Array.isArray(files)) {
    return files.map((file) => file.basename)
  } else {
    return files.data.map((file) => file.basename)
  }
}

export async function webdavDelete(filename: string): Promise<void> {
  if (!isValidFilename(filename)) {
    throw new Error('Invalid filename')
  }

  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  if (!isValidWebdavUrl(webdavUrl)) {
    throw new Error('Invalid WebDAV URL')
  }

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  await client.deleteFile(`${webdavDir}/${filename}`)
}
