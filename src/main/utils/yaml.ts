import yaml from 'yaml'

export function parseYaml<T = unknown>(content: string): T {
  const processedContent = addYamlTagsToProxiesShortId(content)

  const result = yaml.parse(processedContent, {
    merge: true
  })
  // 返回解析结果，如果为 null/undefined 则返回空对象
  // 注意：调用方应检查返回值是否符合预期类型
  return (result ?? {}) as T
}

export function stringifyYaml(data: unknown): string {
  return yaml.stringify(data)
}

function addYamlTagsToProxiesShortId(yamlContent: string, includeNestedProxies = false): string {
  if (!yamlContent.includes('proxies:') || !yamlContent.includes('short-id:')) {
    return yamlContent
  }

  const lines = yamlContent.split('\n')
  const result: string[] = []
  let ctx = { proxies: false, proxy: false, reality: false }
  const lvl = { proxies: -1, proxy: -1, reality: -1 }
  const shortIdRegex = /^(\s*short-id:\s*)([^\s#]+)(.*)$/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      result.push(line)
      continue
    }

    const indent = line.length - line.trimStart().length

    if (trimmed.startsWith('proxies:') && (includeNestedProxies || indent === 0)) {
      ctx = { proxies: true, proxy: false, reality: false }
      lvl.proxies = indent
    } else if (ctx.proxies && indent <= lvl.proxies && !trimmed.startsWith('-')) {
      ctx = { proxies: false, proxy: false, reality: false }
    }

    if (ctx.proxies) {
      if (trimmed.startsWith('-')) {
        ctx = { ...ctx, proxy: true, reality: false }
        lvl.proxy = indent
      } else if (ctx.proxy && indent <= lvl.proxy) {
        ctx = { ...ctx, proxy: false, reality: false }
      }

      if (ctx.proxy) {
        if (trimmed.startsWith('reality-opts:')) {
          ctx.reality = true
          lvl.reality = indent
        } else if (ctx.reality && indent <= lvl.reality) {
          ctx.reality = false
        }

        if (ctx.reality && trimmed.includes('short-id:')) {
          const match = line.match(shortIdRegex)
          if (match) {
            const [, prefix, value, suffix] = match
            if (
              value.toLowerCase() !== 'null' &&
              value !== '~' &&
              !value.startsWith('!!') &&
              !value.startsWith('{') &&
              !value.startsWith('[')
            ) {
              result.push(`${prefix}!!str ${value}${suffix}`)
              continue
            }
          }
        }
      }
    }

    result.push(line)
  }

  return result.join('\n')
}
