import { Button, Input, Select, SelectItem, Switch, Tab, Tabs } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import ConfirmModal, { ConfirmButton } from '@renderer/components/base/base-confirm'
import PermissionModal from '@renderer/components/mihomo/permission-modal'
import ServiceModal from '@renderer/components/mihomo/service-modal'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import PortSetting from '@renderer/components/mihomo/port-setting'
import { platform } from '@renderer/utils/init'
import { IoMdCloudDownload } from 'react-icons/io'
import PubSub from 'pubsub-js'
import {
  manualGrantCorePermition,
  mihomoUpgrade,
  restartCore,
  revokeCorePermission,
  deleteElevateTask,
  checkElevateTask,
  relaunchApp,
  notDialogQuit,
  installService,
  uninstallService,
  startService,
  stopService,
  initService,
  restartService
} from '@renderer/utils/ipc'
import React, { useState, useEffect } from 'react'
import ControllerSetting from '@renderer/components/mihomo/controller-setting'
import EnvSetting from '@renderer/components/mihomo/env-setting'
import AdvancedSetting from '@renderer/components/mihomo/advanced-settings'
import { getSystemCorePaths, getSystemCorePathsCache } from '@renderer/utils/system-core'
import { useTranslation } from '@renderer/hooks/useTranslation'

const Mihomo: React.FC = () => {
  const { t } = useTranslation('mihomo')
  const { appConfig, patchAppConfig } = useAppConfig()
  const { core = 'mihomo', maxLogDays = 7, corePermissionMode = 'elevated' } = appConfig || {}
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const { ipv6, 'log-level': logLevel = 'info' } = controledMihomoConfig || {}

  const [upgrading, setUpgrading] = useState(false)
  const [showGrantConfirm, setShowGrantConfirm] = useState(false)
  const [showUnGrantConfirm, setShowUnGrantConfirm] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [pendingPermissionMode, setPendingPermissionMode] = useState<string>('')
  const [systemCorePaths, setSystemCorePaths] = useState<string[]>(getSystemCorePathsCache() || [])
  const [loadingPaths, setLoadingPaths] = useState(false)

  useEffect(() => {
    if (core !== 'system') return
    const cached = getSystemCorePathsCache()
    if (cached !== null) {
      setSystemCorePaths(cached)
      return
    }

    setLoadingPaths(true)
    getSystemCorePaths()
      .then(setSystemCorePaths)
      .finally(() => setLoadingPaths(false))
  }, [core])

  const onChangeNeedRestart = async (patch: Partial<MihomoConfig>): Promise<void> => {
    await patchControledMihomoConfig(patch)
    await restartCore()
  }

  const handleConfigChangeWithRestart = async (key: string, value: unknown): Promise<void> => {
    try {
      await patchAppConfig({ [key]: value })
      await restartCore()
      PubSub.publish('mihomo-core-changed')
    } catch (e) {
      alert(e)
    }
  }

  const handleCoreUpgrade = async (): Promise<void> => {
    try {
      setUpgrading(true)
      await mihomoUpgrade()
      setTimeout(() => PubSub.publish('mihomo-core-changed'), 2000)
    } catch (e) {
      if (typeof e === 'string' && e.includes('already using latest version')) {
        new Notification(t('alreadyLatest'))
      } else {
        alert(e)
      }
    } finally {
      setUpgrading(false)
    }
  }

  const handleCoreChange = async (newCore: 'mihomo' | 'mihomo-alpha' | 'system'): Promise<void> => {
    if (newCore === 'system') {
      const paths = await getSystemCorePaths()

      if (paths.length === 0) {
        new Notification(t('coreNotFound'), {
          body: t('coreNotFoundDesc')
        })
        return
      }

      if (!appConfig?.systemCorePath || !paths.includes(appConfig.systemCorePath)) {
        await patchAppConfig({ systemCorePath: paths[0] })
      }
    }
    await handleConfigChangeWithRestart('core', newCore)
  }

  const handlePermissionModeChange = async (key: string): Promise<void> => {
    if (platform === 'win32') {
      if (key !== 'elevated') {
        if (await checkElevateTask()) {
          setPendingPermissionMode(key)
          setShowUnGrantConfirm(true)
        } else {
          patchAppConfig({ corePermissionMode: key as 'elevated' | 'service' })
        }
      } else if (key === 'elevated') {
        setPendingPermissionMode(key)
        setShowGrantConfirm(true)
      }
    } else {
      patchAppConfig({ corePermissionMode: key as 'elevated' | 'service' })
    }
  }

  const unGrantButtons: ConfirmButton[] = [
    {
      key: 'cancel',
      text: t('common:actions.cancel'),
      variant: 'light',
      onPress: () => {}
    },
    {
      key: 'confirm',
      text: platform === 'win32' ? t('cancelWithoutRestart') : t('confirmRevoke'),
      color: 'warning',
      onPress: async () => {
        try {
          if (platform === 'win32') {
            await deleteElevateTask()
            new Notification(t('taskCanceled'))
          } else {
            await revokeCorePermission()
            new Notification(t('permissionRevoked'))
          }
          await patchAppConfig({
            corePermissionMode: pendingPermissionMode as 'elevated' | 'service'
          })

          await restartCore()
        } catch (e) {
          alert(e)
        }
      }
    },
    ...(platform === 'win32'
      ? [
          {
            key: 'cancel-and-restart',
            text: t('cancelAndRestart'),
            color: 'danger' as const,
            onPress: async () => {
              try {
                await deleteElevateTask()
                new Notification(t('taskCanceled'))
                await patchAppConfig({
                  corePermissionMode: pendingPermissionMode as 'elevated' | 'service'
                })
                await relaunchApp()
              } catch (e) {
                alert(e)
              }
            }
          }
        ]
      : [])
  ]

  return (
    <BasePage title={t('title')}>
      {showGrantConfirm && (
        <ConfirmModal
          onChange={setShowGrantConfirm}
          title={t('confirmTaskSchedule')}
          description={t('confirmTaskScheduleDesc')}
          onConfirm={async () => {
            await patchAppConfig({
              corePermissionMode: pendingPermissionMode as 'elevated' | 'service'
            })
            await notDialogQuit()
          }}
        />
      )}
      {showUnGrantConfirm && (
        <ConfirmModal
          onChange={setShowUnGrantConfirm}
          title={t('confirmCancelTask')}
          description={t('confirmCancelTaskDesc')}
          buttons={unGrantButtons}
        />
      )}
      {showPermissionModal && (
        <PermissionModal
          onChange={setShowPermissionModal}
          onRevoke={async () => {
            if (platform === 'win32') {
              await deleteElevateTask()
              new Notification(t('taskCanceled'))
            } else {
              await revokeCorePermission()
              new Notification(t('permissionRevoked'))
            }
            await restartCore()
          }}
          onGrant={async () => {
            await manualGrantCorePermition()
            new Notification(t('permissionGranted'))
            await restartCore()
          }}
        />
      )}
      {showServiceModal && (
        <ServiceModal
          onChange={setShowServiceModal}
          onInit={async () => {
            await initService()
            new Notification(t('serviceInitSuccess'))
          }}
          onInstall={async () => {
            await installService()
            new Notification(t('serviceInstallSuccess'))
          }}
          onUninstall={async () => {
            await uninstallService()
            new Notification(t('serviceUninstallSuccess'))
          }}
          onStart={async () => {
            await startService()
            new Notification(t('serviceStartSuccess'))
          }}
          onRestart={async () => {
            await restartService()
            new Notification(t('serviceRestartSuccess'))
          }}
          onStop={async () => {
            await stopService()
            new Notification(t('serviceStopSuccess'))
          }}
        />
      )}
      <SettingCard>
        <SettingItem
          title={t('version')}
          actions={
            core === 'mihomo' || core === 'mihomo-alpha' ? (
              <Button
                size="sm"
                isIconOnly
                title={t('upgrade')}
                variant="light"
                isLoading={upgrading}
                onPress={handleCoreUpgrade}
              >
                <IoMdCloudDownload className="text-lg" />
              </Button>
            ) : null
          }
          divider
        >
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-37.5"
            size="sm"
            selectedKeys={new Set([core])}
            disallowEmptySelection={true}
            onSelectionChange={(v) =>
              handleCoreChange(v.currentKey as 'mihomo' | 'mihomo-alpha' | 'system')
            }
          >
            <SelectItem key="mihomo">{t('coreType.builtin')}</SelectItem>
            <SelectItem key="mihomo-alpha">{t('coreType.builtinAlpha')}</SelectItem>
            <SelectItem key="system">{t('coreType.system')}</SelectItem>
          </Select>
        </SettingItem>
        {core === 'system' && (
          <SettingItem title={t('systemCorePath')} divider>
            <Select
              classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
              className="w-87.5"
              size="sm"
              selectedKeys={new Set([appConfig?.systemCorePath || ''])}
              disallowEmptySelection={systemCorePaths.length > 0}
              isDisabled={loadingPaths}
              onSelectionChange={(v) => {
                const selectedPath = v.currentKey as string
                if (selectedPath) handleConfigChangeWithRestart('systemCorePath', selectedPath)
              }}
            >
              {loadingPaths ? (
                <SelectItem key="">{t('searchingCore')}</SelectItem>
              ) : systemCorePaths.length > 0 ? (
                systemCorePaths.map((path) => <SelectItem key={path}>{path}</SelectItem>)
              ) : (
                <SelectItem key="">{t('coreNotFoundShort')}</SelectItem>
              )}
            </Select>
            {!loadingPaths && systemCorePaths.length === 0 && (
              <div className="mt-2 text-sm text-warning">{t('coreNotFoundTip')}</div>
            )}
          </SettingItem>
        )}
        {platform === 'darwin' && (
          <SettingItem title={t('runMode')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={corePermissionMode}
              disabledKeys={['service']}
              onSelectionChange={(key) => handlePermissionModeChange(key as string)}
            >
              <Tab
                key="elevated"
                //title={platform === 'win32' ? t('runModeElevated') : t('runModeAuth')}
                title={t('runModeAuth')}
              />
              <Tab key="service" title={t('runModeService')} />
            </Tabs>
          </SettingItem>
        )}
        <SettingItem title={platform === 'win32' ? t('taskStatus') : t('authStatus')} divider>
          <Button size="sm" color="primary" onPress={() => setShowPermissionModal(true)}>
            {t('manage')}
          </Button>
        </SettingItem>
        {platform === 'darwin' && (
          <SettingItem title={t('serviceStatus')} divider>
            <Button size="sm" color="primary" onPress={() => setShowServiceModal(true)}>
              {t('manage')}
            </Button>
          </SettingItem>
        )}
        <SettingItem title={t('ipv6')} divider>
          <Switch
            size="sm"
            isSelected={ipv6}
            onValueChange={(v) => onChangeNeedRestart({ ipv6: v })}
          />
        </SettingItem>
        <SettingItem title={t('logRetentionDays')} divider>
          <Input
            size="sm"
            type="number"
            className="w-25"
            value={maxLogDays.toString()}
            onValueChange={(v) => patchAppConfig({ maxLogDays: parseInt(v) })}
          />
        </SettingItem>
        <SettingItem title={t('logLevel')}>
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-25"
            size="sm"
            selectedKeys={new Set([logLevel])}
            disallowEmptySelection={true}
            onSelectionChange={(v) =>
              onChangeNeedRestart({ 'log-level': v.currentKey as LogLevel })
            }
          >
            <SelectItem key="silent">{t('logLevelSilent')}</SelectItem>
            <SelectItem key="error">{t('logLevelError')}</SelectItem>
            <SelectItem key="warning">{t('logLevelWarning')}</SelectItem>
            <SelectItem key="info">{t('logLevelInfo')}</SelectItem>
            <SelectItem key="debug">{t('logLevelDebug')}</SelectItem>
          </Select>
        </SettingItem>
      </SettingCard>
      <PortSetting />
      <ControllerSetting />
      <EnvSetting />
      <AdvancedSetting />
    </BasePage>
  )
}

export default Mihomo
