import React, { useState, useEffect } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Select, SelectItem, Switch, Tab, Tabs, Tooltip } from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import {
  copyEnv,
  patchControledMihomoConfig,
  restartCore,
  startNetworkDetection,
  stopNetworkDetection
} from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'
import { IoIosHelpCircle } from 'react-icons/io'
import { BiCopy } from 'react-icons/bi'
import EditableList from '../base/base-list-editor'

const emptyArray: string[] = []

const AdvancedSettings: React.FC = () => {
  const { t } = useTranslation('settings')
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    controlDns = true,
    controlSniff = true,
    pauseSSID,
    mihomoCpuPriority = 'PRIORITY_NORMAL',
    autoLightweight = false,
    autoLightweightDelay = 60,
    autoLightweightMode = 'core',
    envType = [platform === 'win32' ? 'powershell' : 'bash'],
    networkDetection = false,
    networkDetectionBypass = ['VMware', 'vEthernet'],
    networkDetectionInterval = 10
  } = appConfig || {}

  const pauseSSIDArray = pauseSSID ?? emptyArray

  const [pauseSSIDInput, setPauseSSIDInput] = useState(pauseSSIDArray)

  const [bypass, setBypass] = useState(networkDetectionBypass)
  const [interval, setInterval] = useState(networkDetectionInterval)

  useEffect(() => {
    setPauseSSIDInput(pauseSSIDArray)
  }, [pauseSSIDArray])

  return (
    <SettingCard title={t('advanced.title')}>
      <SettingItem
        title={t('advanced.autoLightweight')}
        actions={
          <Tooltip content={t('advanced.autoLightweightTip')}>
            <Button isIconOnly size="sm" variant="light">
              <IoIosHelpCircle className="text-lg" />
            </Button>
          </Tooltip>
        }
        divider
      >
        <Switch
          size="sm"
          isSelected={autoLightweight}
          onValueChange={(v) => {
            patchAppConfig({ autoLightweight: v })
          }}
        />
      </SettingItem>
      {autoLightweight && (
        <>
          <SettingItem compatKey="legacy"
          title={t('advanced.lightweightMode')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={autoLightweightMode}
              onSelectionChange={(v) => {
                patchAppConfig({ autoLightweightMode: v as 'core' | 'tray' })
                if (v === 'core') {
                  patchAppConfig({ autoLightweightDelay: Math.max(autoLightweightDelay, 5) })
                }
              }}
            >
              <Tab key="core" title={t('advanced.lightweightModeCore')} />
              <Tab key="tray" title={t('advanced.lightweightModeTray')} />
            </Tabs>
          </SettingItem>
          <SettingItem compatKey="legacy"
          title={t('advanced.lightweightDelay')} divider>
            <Input
              size="sm"
              className="w-25"
              type="number"
              endContent={t('common:ui.seconds')}
              value={autoLightweightDelay.toString()}
              onValueChange={async (v: string) => {
                let num = parseInt(v)
                if (isNaN(num)) num = 0
                const minDelay = autoLightweightMode === 'core' ? 5 : 0
                if (num < minDelay) num = minDelay
                await patchAppConfig({ autoLightweightDelay: num })
              }}
            />
          </SettingItem>
        </>
      )}
      <SettingItem
        title={t('advanced.copyEnvType')}
        actions={envType.map((type) => (
          <Button
            key={type}
            title={type}
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => copyEnv(type)}
          >
            <BiCopy className="text-lg" />
          </Button>
        ))}
        divider
      >
        <Select
          classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
          className="w-37.5"
          size="sm"
          selectionMode="multiple"
          selectedKeys={new Set(envType)}
          disallowEmptySelection={true}
          onSelectionChange={async (v) => {
            try {
              await patchAppConfig({
                envType: Array.from(v) as ('bash' | 'fish' | 'cmd' | 'powershell' | 'nushell')[]
              })
            } catch (e) {
              alert(e)
            }
          }}
        >
          <SelectItem key="bash">Bash</SelectItem>
          <SelectItem key="fish">Fish</SelectItem>
          <SelectItem key="cmd">CMD</SelectItem>
          <SelectItem key="powershell">PowerShell</SelectItem>
          <SelectItem key="nushell">NuShell</SelectItem>
        </Select>
      </SettingItem>
      {platform === 'win32' && (
        <SettingItem compatKey="legacy"
          title={t('advanced.corePriority')} divider>
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-37.5"
            size="sm"
            selectedKeys={new Set([mihomoCpuPriority])}
            disallowEmptySelection={true}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({
                  mihomoCpuPriority: v.currentKey as Priority
                })
                await restartCore()
              } catch (e) {
                alert(e)
              }
            }}
          >
            <SelectItem key="PRIORITY_HIGHEST">{t('advanced.priority.realtime')}</SelectItem>
            <SelectItem key="PRIORITY_HIGH">{t('advanced.priority.high')}</SelectItem>
            <SelectItem key="PRIORITY_ABOVE_NORMAL">
              {t('advanced.priority.aboveNormal')}
            </SelectItem>
            <SelectItem key="PRIORITY_NORMAL">{t('advanced.priority.normal')}</SelectItem>
            <SelectItem key="PRIORITY_BELOW_NORMAL">
              {t('advanced.priority.belowNormal')}
            </SelectItem>
            <SelectItem key="PRIORITY_LOW">{t('advanced.priority.low')}</SelectItem>
          </Select>
        </SettingItem>
      )}
      <SettingItem compatKey="legacy"
          title={t('advanced.controlDns')} divider>
        <Switch
          size="sm"
          isSelected={controlDns}
          onValueChange={async (v) => {
            try {
              await patchAppConfig({ controlDns: v })
              await patchControledMihomoConfig({})
              await restartCore()
            } catch (e) {
              alert(e)
            }
          }}
        />
      </SettingItem>
      <SettingItem compatKey="legacy"
          title={t('advanced.controlSniff')} divider>
        <Switch
          size="sm"
          isSelected={controlSniff}
          onValueChange={async (v) => {
            try {
              await patchAppConfig({ controlSniff: v })
              await patchControledMihomoConfig({})
              await restartCore()
            } catch (e) {
              alert(e)
            }
          }}
        />
      </SettingItem>
      <SettingItem
        title={t('advanced.networkDetection')}
        actions={
          <Tooltip content={t('advanced.networkDetectionTip')}>
            <Button isIconOnly size="sm" variant="light">
              <IoIosHelpCircle className="text-lg" />
            </Button>
          </Tooltip>
        }
        divider
      >
        <Switch
          size="sm"
          isSelected={networkDetection}
          onValueChange={(v) => {
            patchAppConfig({ networkDetection: v })
            if (v) {
              startNetworkDetection()
            } else {
              stopNetworkDetection()
            }
          }}
        />
      </SettingItem>
      {networkDetection && (
        <>
          <SettingItem compatKey="legacy"
          title={t('advanced.networkDetectionInterval')} divider>
            <div className="flex">
              {interval !== networkDetectionInterval && (
                <Button
                  size="sm"
                  color="primary"
                  className="mr-2"
                  onPress={async () => {
                    await patchAppConfig({ networkDetectionInterval: interval })
                    await startNetworkDetection()
                  }}
                >
                  {t('common:actions.confirm')}
                </Button>
              )}
              <Input
                size="sm"
                type="number"
                className="w-25"
                endContent={t('common:ui.seconds')}
                value={interval.toString()}
                min={1}
                onValueChange={(v) => {
                  const num = parseInt(v)
                  setInterval(isNaN(num) || num < 1 ? 1 : num)
                }}
              />
            </div>
          </SettingItem>
          <SettingItem compatKey="legacy"
          title={t('advanced.networkDetectionBypass')}>
            {bypass.length != networkDetectionBypass.length && (
              <Button
                size="sm"
                color="primary"
                onPress={async () => {
                  await patchAppConfig({ networkDetectionBypass: bypass })
                  await startNetworkDetection()
                }}
              >
                {t('common:actions.confirm')}
              </Button>
            )}
          </SettingItem>
          <EditableList items={bypass} onChange={(list) => setBypass(list as string[])} />
        </>
      )}
      <SettingItem compatKey="legacy"
          title={t('advanced.pauseSSID')}>
        {pauseSSIDInput.join('') !== pauseSSIDArray.join('') && (
          <Button
            size="sm"
            color="primary"
            onPress={() => {
              patchAppConfig({ pauseSSID: pauseSSIDInput })
            }}
          >
            {t('common:actions.confirm')}
          </Button>
        )}
      </SettingItem>
      <EditableList
        items={pauseSSIDInput}
        onChange={(list) => setPauseSSIDInput(list as string[])}
        divider={false}
      />
    </SettingCard>
  )
}

export default AdvancedSettings
