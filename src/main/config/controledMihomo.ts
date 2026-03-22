import { controledMihomoConfigPath } from '../utils/dirs'
import { readFile, writeFile } from 'fs/promises'
import { parseYaml, stringifyYaml } from '../utils/yaml'
import { generateProfile } from '../core/factory'
import { getAppConfig } from './app'
import { defaultControledMihomoConfig } from '../utils/template'
import { deepMerge } from '../utils/merge'

let controledMihomoConfig: Partial<MihomoConfig> // mihomo.yaml

export async function getControledMihomoConfig(force = false): Promise<Partial<MihomoConfig>> {
  if (force || !controledMihomoConfig) {
    try {
      const data = await readFile(controledMihomoConfigPath(), 'utf-8')
      controledMihomoConfig = parseYaml<Partial<MihomoConfig>>(data) || defaultControledMihomoConfig
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
      controledMihomoConfig = defaultControledMihomoConfig
      await writeFile(controledMihomoConfigPath(), stringifyYaml(controledMihomoConfig), 'utf-8')
    }
  }
  if (typeof controledMihomoConfig !== 'object')
    controledMihomoConfig = defaultControledMihomoConfig

  const portFields = ['port', 'socks-port', 'mixed-port', 'redir-port', 'tproxy-port'] as const
  for (const field of portFields) {
    if (field in controledMihomoConfig) {
      const value = controledMihomoConfig[field]
      if (typeof value === 'number' && isNaN(value)) {
        controledMihomoConfig[field] = 0
      } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10)
        controledMihomoConfig[field] = isNaN(parsed) ? 0 : parsed
      }
    }
  }

  return controledMihomoConfig
}

export async function patchControledMihomoConfig(patch: Partial<MihomoConfig>): Promise<void> {
  await getControledMihomoConfig()
  const { controlDns = true, controlSniff = true } = await getAppConfig()
  if (!controlDns) {
    delete controledMihomoConfig.dns
    delete controledMihomoConfig.hosts
  } else {
    // 从不接管状态恢复
    if (controledMihomoConfig.dns?.ipv6 === undefined) {
      controledMihomoConfig.dns = defaultControledMihomoConfig.dns
    }
  }
  if (!controlSniff) {
    delete controledMihomoConfig.sniffer
  } else {
    // 从不接管状态恢复
    if (!controledMihomoConfig.sniffer) {
      controledMihomoConfig.sniffer = defaultControledMihomoConfig.sniffer
    }
  }
  if (patch.dns?.['nameserver-policy']) {
    controledMihomoConfig.dns = controledMihomoConfig.dns || {}
    controledMihomoConfig.dns['nameserver-policy'] = patch.dns['nameserver-policy']
  }
  if (patch.dns?.['use-hosts']) {
    controledMihomoConfig.hosts = patch.hosts
  }
  controledMihomoConfig = deepMerge(controledMihomoConfig, patch)

  // 写入前清理 NaN 端口值
  const portFields = ['port', 'socks-port', 'mixed-port', 'redir-port', 'tproxy-port'] as const
  for (const field of portFields) {
    if (field in controledMihomoConfig) {
      const value = controledMihomoConfig[field]
      if (typeof value === 'number' && isNaN(value)) {
        controledMihomoConfig[field] = 0
      }
    }
  }

  await generateProfile()
  await writeFile(controledMihomoConfigPath(), stringifyYaml(controledMihomoConfig), 'utf-8')
}
