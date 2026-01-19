import {
  changeCurrentProfile,
  getAppConfig,
  getControledMihomoConfig,
  getProfileConfig,
  patchAppConfig,
  patchControledMihomoConfig
} from '../config'
import icoIcon from '../../../resources/icon.ico?asset'
import pngIcon from '../../../resources/icon.png?asset'
import templateIcon from '../../../resources/iconTemplate.png?asset'
import {
  mihomoChangeProxy,
  mihomoCloseAllConnections,
  mihomoGroups,
  mihomoGroupDelay,
  patchMihomoConfig
} from '../core/mihomoApi'
import { mainWindow, setNotQuitDialog, showMainWindow, triggerMainWindow } from '..'
import { t } from '../utils/i18n'
import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  shell,
  Tray
} from 'electron'
import { dataDir, logDir, mihomoCoreDir, mihomoWorkDir } from '../utils/dirs'
import { triggerSysProxy } from '../sys/sysproxy'
import { quitWithoutCore, restartCore, isCoreRestarting } from '../core/manager'
import { floatingWindow, triggerFloatingWindow } from './floatingWindow'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { applyTheme } from './theme'

export let tray: Tray | null = null
let customTrayWindow: BrowserWindow | null = null
let trayIconUpdateRegistered = false
let updateTrayMenuRegistered = false

const TRAY_RETRY_DELAYS = [200, 500, 1000, 2000, 3000]
const TRAY_INITIAL_DELAY = 100

let trayFailureNotification: Notification | null = null

function formatDelayText(delay: number): string {
  if (delay === 0) {
    return 'Timeout'
  } else if (delay > 0) {
    return `${delay} ms`
  }
  return ''
}

function positionCustomTrayWindow(win: BrowserWindow): void {
  if (!tray) return
  const trayBounds = tray.getBounds()
  const { width: winW, height: winH } = win.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const { x: dx, y: dy, width: dw, height: dh } = display.workArea
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winW / 2)
  let y =
    process.platform === 'darwin'
      ? Math.round(trayBounds.y + trayBounds.height + 6)
      : Math.round(trayBounds.y - winH - 6)
  x = Math.min(Math.max(x, dx), dx + dw - winW)
  y = Math.min(Math.max(y, dy), dy + dh - winH)
  win.setPosition(x, y, false)
}

function hideCustomTray(): void {
  if (customTrayWindow && !customTrayWindow.isDestroyed()) {
    customTrayWindow.hide()
  }
}

async function showCustomTray(): Promise<void> {
  const { useCustomTrayMenu = false, customTheme = 'default.css' } = await getAppConfig()
  if (!useCustomTrayMenu) {
    await updateTrayMenu()
    return
  }

  if (!customTrayWindow || customTrayWindow.isDestroyed()) {
    customTrayWindow = new BrowserWindow({
      width: 380,
      height: 520,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      fullscreenable: false,
      focusable: true,
      hasShadow: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        spellcheck: false,
        sandbox: false
      }
    })

    customTrayWindow.on('blur', () => {
      hideCustomTray()
    })
    customTrayWindow.on('close', () => {
      customTrayWindow = null
    })
    customTrayWindow.on('ready-to-show', () => {
      applyTheme(customTheme)
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await customTrayWindow
        .loadURL(`${process.env['ELECTRON_RENDERER_URL']}/traymenu.html`)
        .catch(() => {})
    } else {
      await customTrayWindow.loadFile(join(__dirname, '../renderer/traymenu.html')).catch(() => {})
    }
  }

  positionCustomTrayWindow(customTrayWindow)
  customTrayWindow.show()
  customTrayWindow.focus()
}

async function handleTrayClick(): Promise<void> {
  const { useCustomTrayMenu = false } = await getAppConfig()
  if (useCustomTrayMenu) {
    await showCustomTray()
  } else {
    await updateTrayMenu()
  }
}

export const buildContextMenu = async (): Promise<Menu> => {
  const { mode, tun } = await getControledMihomoConfig()
  const {
    sysProxy,
    onlyActiveDevice = false,
    envType = process.platform === 'win32' ? ['powershell'] : ['bash'],
    autoCloseConnection,
    proxyInTray = true,
    // useCustomTrayMenu = false,
    triggerSysProxyShortcut = '',
    showFloatingWindowShortcut = '',
    showWindowShortcut = '',
    triggerTunShortcut = '',
    ruleModeShortcut = '',
    globalModeShortcut = '',
    directModeShortcut = '',
    quitWithoutCoreShortcut = '',
    restartAppShortcut = ''
  } = await getAppConfig()
  let groupsMenu: Electron.MenuItemConstructorOptions[] = []
  if (proxyInTray && process.platform !== 'linux') {
    try {
      const groups = await mihomoGroups()
      groupsMenu = groups.map((group) => {
        const currentProxy = group.all.find((proxy) => proxy?.name === group.now)
        const delay = currentProxy?.history?.length
          ? currentProxy.history[currentProxy.history.length - 1].delay
          : -1
        const displayDelay = formatDelayText(delay)

        return {
          id: group.name,
          label: group.name,
          sublabel: displayDelay,
          type: 'submenu',
          submenu: [
            {
              id: `${group.name}-test`,
              label: t('main.tray.retest'),
              type: 'normal',
              click: async (): Promise<void> => {
                try {
                  await mihomoGroupDelay(group.name, group.testUrl)
                  ipcMain.emit('updateTrayMenu')
                } catch (e) {
                  // ignore
                }
              }
            },
            { type: 'separator' },
            ...group.all
              .filter((proxy): proxy is NonNullable<typeof proxy> => proxy != null)
              .map((proxy) => {
                const proxyDelay = proxy.history?.length
                  ? proxy.history[proxy.history.length - 1].delay
                  : -1
                const proxyDisplayDelay = formatDelayText(proxyDelay)
                return {
                  id: proxy.name,
                  label: proxy.name,
                  sublabel: proxyDisplayDelay,
                  type: 'radio' as const,
                  checked: proxy.name === group.now,
                  click: async (): Promise<void> => {
                    await mihomoChangeProxy(group.name, proxy.name)
                    if (autoCloseConnection) {
                      await mihomoCloseAllConnections()
                    }
                  }
                }
              })
          ]
        }
      })
      groupsMenu.unshift({ type: 'separator' })
    } catch (e) {
      // ignore
      // 避免出错时无法创建托盘菜单
    }
  }
  const { current, items = [] } = await getProfileConfig()

  const contextMenu = [
    {
      id: 'show',
      accelerator: showWindowShortcut,
      label: t('main.tray.showWindow'),
      type: 'normal',
      click: (): void => {
        showMainWindow()
      }
    },
    {
      id: 'show-floating',
      accelerator: showFloatingWindowShortcut,
      label: floatingWindow?.isVisible()
        ? t('main.tray.hideFloating')
        : t('main.tray.showFloating'),
      type: 'normal',
      click: async (): Promise<void> => {
        await triggerFloatingWindow()
      }
    },
    // { type: 'separator' },
    // {
    //   type: 'checkbox',
    //   label: '自定义托盘菜单',
    //   checked: useCustomTrayMenu,
    //   click: async (item): Promise<void> => {
    //     await patchAppConfig({ useCustomTrayMenu: item.checked })
    //     ipcMain.emit('updateTrayMenu')
    //   }
    // },
    { type: 'separator' },
    {
      type: 'checkbox',
      label: t('main.tray.systemProxy'),
      accelerator: triggerSysProxyShortcut,
      checked: sysProxy.enable,
      click: async (item): Promise<void> => {
        const enable = item.checked
        try {
          await triggerSysProxy(enable, onlyActiveDevice)
          await patchAppConfig({ sysProxy: { enable } })
          mainWindow?.webContents.send('appConfigUpdated')
          floatingWindow?.webContents.send('appConfigUpdated')
        } catch (e) {
          // ignore
        } finally {
          ipcMain.emit('updateTrayMenu')
        }
      }
    },
    {
      type: 'checkbox',
      label: t('main.tray.tun'),
      accelerator: triggerTunShortcut,
      checked: tun?.enable ?? false,
      enabled: !isCoreRestarting(),
      click: async (item): Promise<void> => {
        if (isCoreRestarting()) return

        const enable = item.checked
        try {
          if (enable) {
            await patchControledMihomoConfig({ tun: { enable }, dns: { enable: true } })
          } else {
            await patchControledMihomoConfig({ tun: { enable } })
          }
          mainWindow?.webContents.send('controledMihomoConfigUpdated')
          floatingWindow?.webContents.send('controledMihomoConfigUpdated')
          await restartCore()
        } catch {
          // ignore
        } finally {
          ipcMain.emit('updateTrayMenu')
        }
      }
    },
    { type: 'separator' },
    {
      type: 'submenu',
      label: t('main.tray.outboundMode', {
        mode:
          mode === 'rule'
            ? t('main.tray.rule')
            : mode === 'global'
              ? t('main.tray.global')
              : t('main.tray.direct')
      }),
      submenu: [
        {
          id: 'rule',
          label: t('main.tray.ruleMode'),
          accelerator: ruleModeShortcut,
          type: 'radio',
          checked: mode === 'rule',
          click: async (): Promise<void> => {
            await patchControledMihomoConfig({ mode: 'rule' })
            await patchMihomoConfig({ mode: 'rule' })
            mainWindow?.webContents.send('controledMihomoConfigUpdated')
            mainWindow?.webContents.send('groupsUpdated')
            ipcMain.emit('updateTrayMenu')
          }
        },
        {
          id: 'global',
          label: t('main.tray.globalMode'),
          accelerator: globalModeShortcut,
          type: 'radio',
          checked: mode === 'global',
          click: async (): Promise<void> => {
            await patchControledMihomoConfig({ mode: 'global' })
            await patchMihomoConfig({ mode: 'global' })
            mainWindow?.webContents.send('controledMihomoConfigUpdated')
            mainWindow?.webContents.send('groupsUpdated')
            ipcMain.emit('updateTrayMenu')
          }
        },
        {
          id: 'direct',
          label: t('main.tray.directMode'),
          accelerator: directModeShortcut,
          type: 'radio',
          checked: mode === 'direct',
          click: async (): Promise<void> => {
            await patchControledMihomoConfig({ mode: 'direct' })
            await patchMihomoConfig({ mode: 'direct' })
            mainWindow?.webContents.send('controledMihomoConfigUpdated')
            mainWindow?.webContents.send('groupsUpdated')
            ipcMain.emit('updateTrayMenu')
          }
        }
      ]
    },
    ...groupsMenu,
    { type: 'separator' },
    {
      type: 'submenu',
      label: t('main.tray.subscriptionConfig'),
      submenu: items.map((item) => {
        return {
          type: 'radio',
          label: item.name,
          checked: item.id === current,
          click: async (): Promise<void> => {
            if (item.id === current) return
            await changeCurrentProfile(item.id)
            mainWindow?.webContents.send('profileConfigUpdated')
            ipcMain.emit('updateTrayMenu')
          }
        }
      })
    },
    { type: 'separator' },
    {
      type: 'submenu',
      label: t('main.tray.openDirectory'),
      submenu: [
        {
          type: 'normal',
          label: t('main.tray.appDirectory'),
          click: (): Promise<string> => shell.openPath(dataDir())
        },
        {
          type: 'normal',
          label: t('main.tray.workDirectory'),
          click: (): Promise<string> => shell.openPath(mihomoWorkDir())
        },
        {
          type: 'normal',
          label: t('main.tray.coreDirectory'),
          click: (): Promise<string> => shell.openPath(mihomoCoreDir())
        },
        {
          type: 'normal',
          label: t('main.tray.logDirectory'),
          click: (): Promise<string> => shell.openPath(logDir())
        }
      ]
    },
    envType.length > 1
      ? {
          type: 'submenu',
          label: t('main.tray.copyEnvVar'),
          submenu: envType.map((type) => {
            return {
              id: type,
              label: type,
              type: 'normal',
              click: async (): Promise<void> => {
                await copyEnv(type)
              }
            }
          })
        }
      : {
          id: 'copyenv',
          label: t('main.tray.copyEnvVar'),
          type: 'normal',
          click: async (): Promise<void> => {
            await copyEnv(envType[0])
          }
        },
    { type: 'separator' },
    {
      id: 'quitWithoutCore',
      label: t('main.tray.quitWithoutCore'),
      type: 'normal',
      accelerator: quitWithoutCoreShortcut,
      click: (): void => {
        setNotQuitDialog()
        quitWithoutCore()
      }
    },
    {
      id: 'restart',
      label: t('main.tray.restartApp'),
      type: 'normal',
      accelerator: restartAppShortcut,
      click: (): void => {
        setNotQuitDialog()
        app.relaunch()
        app.quit()
      }
    },
    {
      id: 'quit',
      label: t('main.tray.quit'),
      type: 'normal',
      accelerator: 'CommandOrControl+Q',
      click: (): void => {
        setNotQuitDialog()
        app.quit()
      }
    }
  ] as Electron.MenuItemConstructorOptions[]
  return Menu.buildFromTemplate(contextMenu)
}

async function createWindowsTray(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, TRAY_INITIAL_DELAY))

  let lastError: Error | null = null

  try {
    tray = new Tray(icoIcon)
    const bounds = tray.getBounds()

    if (bounds.width > 0 && bounds.height > 0) {
      return true
    }

    console.warn('托盘图标 bounds 无效，准备重试')
    tray.destroy()
    tray = null
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error))
    console.error('托盘图标创建失败:', lastError)
    if (tray) {
      try {
        tray.destroy()
      } catch {
        // ignore
      }
      tray = null
    }
  }

  for (let i = 0; i < TRAY_RETRY_DELAYS.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, TRAY_RETRY_DELAYS[i]))

    try {
      tray = new Tray(icoIcon)
      const bounds = tray.getBounds()

      if (bounds.width > 0 && bounds.height > 0) {
        console.log(`托盘图标在第 ${i + 1} 次重试后创建成功`)
        return true
      }

      console.warn(`第 ${i + 1} 次重试：托盘图标 bounds 仍然无效`)
      tray.destroy()
      tray = null
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`第 ${i + 1} 次重试失败:`, lastError)
      if (tray) {
        try {
          tray.destroy()
        } catch {
          // ignore
        }
        tray = null
      }
    }
  }

  console.error('托盘图标创建失败：已达到最大重试次数', lastError)
  return false
}

export async function createTray(): Promise<void> {
  const { useDockIcon = true } = await getAppConfig()

  if (process.platform === 'linux') {
    tray = new Tray(pngIcon)
    const menu = await buildContextMenu()
    tray.setContextMenu(menu)
  } else if (process.platform === 'darwin') {
    const icon = nativeImage.createFromPath(templateIcon).resize({ height: 16 })
    icon.setTemplateImage(true)
    tray = new Tray(icon)
  } else if (process.platform === 'win32') {
    const success = await createWindowsTray()

    if (!success) {
      trayFailureNotification = new Notification({
        title: 'Sparkle - 托盘图标创建失败',
        body: '托盘图标无法正常显示。应用功能不受影响，但您可能需要重启应用来恢复托盘功能。'
      })
      trayFailureNotification.show()
      return
    }
  }

  tray?.setToolTip('Sparkle')
  tray?.setIgnoreDoubleClickEvents(true)
  if (process.platform === 'darwin') {
    if (!useDockIcon && app.dock) {
      app.dock.hide()
    }
    if (!trayIconUpdateRegistered) {
      trayIconUpdateRegistered = true
      ipcMain.on('trayIconUpdate', async (_, png: string) => {
        const image = nativeImage.createFromDataURL(png).resize({ height: 16 })
        image.setTemplateImage(true)
        tray?.setImage(image)
      })
    }
    tray?.addListener('right-click', async () => {
      await triggerMainWindow()
    })
    tray?.addListener('click', async () => {
      await handleTrayClick()
    })
  }
  if (process.platform === 'win32') {
    tray?.addListener('click', async () => {
      await triggerMainWindow()
    })
    tray?.addListener('right-click', async () => {
      await handleTrayClick()
    })
  }
  if (process.platform === 'linux') {
    tray?.addListener('click', async () => {
      await triggerMainWindow()
    })
    if (!updateTrayMenuRegistered) {
      updateTrayMenuRegistered = true
      ipcMain.on('updateTrayMenu', async () => {
        await updateTrayMenu()
      })
    }
  }
}

async function updateTrayMenu(): Promise<void> {
  const menu = await buildContextMenu()
  tray?.popUpContextMenu(menu) // 弹出菜单
  if (process.platform === 'linux') {
    tray?.setContextMenu(menu)
  }
}

ipcMain.on('customTray:close', () => {
  hideCustomTray()
})

export async function copyEnv(type: 'bash' | 'cmd' | 'powershell' | 'nushell'): Promise<void> {
  const { 'mixed-port': mixedPort = 7890 } = await getControledMihomoConfig()
  const { sysProxy } = await getAppConfig()
  const { host, bypass = [] } = sysProxy
  const bypassStr = bypass?.join(',') || ''
  switch (type) {
    case 'bash': {
      clipboard.writeText(
        `export https_proxy=http://${host || '127.0.0.1'}:${mixedPort} http_proxy=http://${host || '127.0.0.1'}:${mixedPort} all_proxy=http://${host || '127.0.0.1'}:${mixedPort} no_proxy=${bypassStr}`
      )
      break
    }
    case 'cmd': {
      clipboard.writeText(
        `set http_proxy=http://${host || '127.0.0.1'}:${mixedPort}\r\nset https_proxy=http://${host || '127.0.0.1'}:${mixedPort}\r\nset no_proxy=${bypassStr}`
      )
      break
    }
    case 'powershell': {
      clipboard.writeText(
        `$env:HTTP_PROXY="http://${host || '127.0.0.1'}:${mixedPort}"; $env:HTTPS_PROXY="http://${host || '127.0.0.1'}:${mixedPort}"; $env:no_proxy="${bypassStr}"`
      )
      break
    }
    case 'nushell': {
      clipboard.writeText(
        `load-env {http_proxy:"http://${host || '127.0.0.1'}:${mixedPort}", https_proxy:"http://${host || '127.0.0.1'}:${mixedPort}", no_proxy:"${bypassStr}"}`
      )
      break
    }
  }
}

export async function showTrayIcon(): Promise<void> {
  if (!tray) {
    await createTray()
  }
}

export async function closeTrayIcon(): Promise<void> {
  if (tray) {
    tray.destroy()
  }
  tray = null
  if (customTrayWindow) {
    customTrayWindow.destroy()
  }
  customTrayWindow = null
  trayIconUpdateRegistered = false
  updateTrayMenuRegistered = false
}

export function setDockVisible(visible: boolean): void {
  if (process.platform === 'darwin' && app.dock) {
    if (visible) {
      app.dock.show()
    } else {
      app.dock.hide()
    }
  }
}
