import { addProfileItem, getCurrentProfileItem, getProfileConfig } from '../config'

const intervalPool: Record<string, NodeJS.Timeout> = {}

function calculateUpdateDelay(item: ProfileItem): number {
  if (!item.interval) {
    return -1
  }

  const now = Date.now()
  const lastUpdated = item.updated || 0
  const intervalMs = item.interval * 60 * 1000
  const timeSinceLastUpdate = now - lastUpdated

  if (timeSinceLastUpdate >= intervalMs) {
    return 0
  }

  return intervalMs - timeSinceLastUpdate
}

function scheduleProfileUpdate(item: ProfileItem, initialDelay: number): void {
  if (intervalPool[item.id]) {
    clearTimeout(intervalPool[item.id])
  }

  const intervalMs = item.interval! * 60 * 1000

  const doUpdate = async (): Promise<void> => {
    try {
      await addProfileItem(item)
    } catch {
      // ignore
    }
    intervalPool[item.id] = setTimeout(doUpdate, intervalMs)
  }

  intervalPool[item.id] = setTimeout(doUpdate, initialDelay)
}

export async function initProfileUpdater(): Promise<void> {
  const { items, current } = await getProfileConfig()
  for (const item of items.filter((i) => i.id !== current)) {
    if (item.type === 'remote' && item.interval && item.autoUpdate !== false) {
      const delay = calculateUpdateDelay(item)
      if (delay === -1) continue

      if (delay === 0) {
        try {
          await addProfileItem(item)
        } catch {
          // ignore
        }
      }

      scheduleProfileUpdate(item, delay === 0 ? item.interval * 60 * 1000 : delay)
    }
  }

  const currentItem = await getCurrentProfileItem()
  if (currentItem?.type === 'remote' && currentItem.interval && currentItem.autoUpdate !== false) {
    const delay = calculateUpdateDelay(currentItem)

    if (delay === 0) {
      try {
        await addProfileItem(currentItem)
      } catch {
        // ignore
      }
    }

    const actualDelay = (delay === 0 ? currentItem.interval * 60 * 1000 : delay) + 10000
    scheduleProfileUpdate(currentItem, actualDelay)
  }
}

export async function addProfileUpdater(item: ProfileItem): Promise<void> {
  if (item.type === 'remote' && item.interval && item.autoUpdate !== false) {
    const delay = calculateUpdateDelay(item)
    if (delay === -1) return

    if (delay === 0) {
      try {
        await addProfileItem(item)
      } catch {
        // ignore
      }
    }

    scheduleProfileUpdate(item, delay === 0 ? item.interval * 60 * 1000 : delay)
  }
}

export async function delProfileUpdater(id: string): Promise<void> {
  if (intervalPool[id]) {
    clearTimeout(intervalPool[id])
    delete intervalPool[id]
  }
}

export function stopAllProfileUpdaters(): void {
  Object.keys(intervalPool).forEach((id) => {
    if (intervalPool[id]) {
      clearTimeout(intervalPool[id])
      delete intervalPool[id]
    }
  })
}
