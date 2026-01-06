import axios from 'axios'
import { getAppConfig, getControledMihomoConfig } from '../config'
import { getRuntimeConfigStr } from '../core/factory'

interface GistInfo {
  id: string
  description: string
  html_url: string
}

function isValidGistId(id: string): boolean {
  // GitHub gist ID 是 32 个字符的十六进制字符串
  return /^[a-f0-9]{32}$/i.test(id)
}

async function listGists(token: string): Promise<GistInfo[]> {
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  const res = await axios.get('https://api.github.com/gists', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    ...(port != 0 && {
      proxy: {
        protocol: 'http',
        host: '127.0.0.1',
        port
      }
    }),
    responseType: 'json'
  })
  return res.data as GistInfo[]
}

async function createGist(token: string, content: string): Promise<void> {
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  await axios.post(
    'https://api.github.com/gists',
    {
      description: 'Auto Synced Sparkle Runtime Config',
      public: false,
      files: { 'sparkle.yaml': { content } }
    },
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      ...(port != 0 && {
        proxy: {
          protocol: 'http',
          host: '127.0.0.1',
          port
        }
      })
    }
  )
}

async function createGistAndReturn(token: string, content: string): Promise<GistInfo> {
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  const res = await axios.post(
    'https://api.github.com/gists',
    {
      description: 'Auto Synced Sparkle Runtime Config',
      public: false,
      files: { 'sparkle.yaml': { content } }
    },
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      ...(port != 0 && {
        proxy: {
          protocol: 'http',
          host: '127.0.0.1',
          port
        }
      })
    }
  )
  return res.data as GistInfo
}

async function updateGist(token: string, id: string, content: string): Promise<void> {
  if (!isValidGistId(id)) {
    throw new Error('Invalid gist id')
  }
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  await axios.patch(
    `https://api.github.com/gists/${encodeURIComponent(id)}`,
    {
      description: 'Auto Synced Sparkle Runtime Config',
      files: { 'sparkle.yaml': { content } }
    },
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      ...(port != 0 && {
        proxy: {
          protocol: 'http',
          host: '127.0.0.1',
          port
        }
      })
    }
  )
}

export async function getGistUrl(): Promise<string> {
  const { githubToken } = await getAppConfig()
  if (!githubToken) return ''
  try {
    const gists = await listGists(githubToken)
    const gist = gists.find((gist) => gist.description === 'Auto Synced Sparkle Runtime Config')
    if (gist) {
      return gist.html_url
    } else {
      // 直接创建新 gist 并返回 URL，避免二次查询
      const newGist = await createGistAndReturn(githubToken, await getRuntimeConfigStr())
      return newGist.html_url
    }
  } catch (e) {
    console.warn('Failed to get gist URL:', e instanceof Error ? e.message : e)
    return ''
  }
}

export async function uploadRuntimeConfig(): Promise<void> {
  const { githubToken } = await getAppConfig()
  if (!githubToken) return
  try {
    const gists = await listGists(githubToken)
    const gist = gists.find((gist) => gist.description === 'Auto Synced Sparkle Runtime Config')
    const config = await getRuntimeConfigStr()
    if (gist) {
      await updateGist(githubToken, gist.id, config)
    } else {
      await createGist(githubToken, config)
    }
  } catch (e) {
    console.warn('Failed to upload runtime config:', e instanceof Error ? e.message : e)
  }
}
