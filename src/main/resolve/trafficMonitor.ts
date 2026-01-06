import { ChildProcess, spawn } from 'child_process'
import { getAppConfig } from '../config'
import { dataDir, resourcesFilesDir } from '../utils/dirs'
import path from 'path'
import { existsSync } from 'fs'
import { readFile, rm, writeFile } from 'fs/promises'

let child: ChildProcess | null = null

export async function startMonitor(detached = false): Promise<void> {
  if (process.platform !== 'win32') return
  if (existsSync(path.join(dataDir(), 'monitor.pid'))) {
    const pid = parseInt(await readFile(path.join(dataDir(), 'monitor.pid'), 'utf-8'))
    if (!isNaN(pid)) {
      try {
        process.kill(pid, 'SIGINT')
      } catch {
        // ignore
      }
    }
    await rm(path.join(dataDir(), 'monitor.pid'))
  }
  stopMonitor()
  const { showTraffic = false } = await getAppConfig()
  if (!showTraffic) return
  child = spawn(path.join(resourcesFilesDir(), 'TrafficMonitor/TrafficMonitor.exe'), [], {
    cwd: path.join(resourcesFilesDir(), 'TrafficMonitor'),
    detached: detached,
    stdio: detached ? 'ignore' : undefined
  })
  child.on('error', () => {
    // ignore
  })
  if (detached) {
    if (child && child.pid) {
      await writeFile(path.join(dataDir(), 'monitor.pid'), child.pid.toString())
    }
    child.unref()
  }
}

export function stopMonitor(): void {
  if (child) {
    child.kill('SIGINT')
    child = null
  }
}
