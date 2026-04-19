import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import InterfaceSelect from '../base/interface-select'
import { restartCore } from '@renderer/utils/ipc'
import { Button, Input, Switch, Tab, Tabs, Tooltip } from '@heroui/react'
import { useState } from 'react'
import { IoIosHelpCircle } from 'react-icons/io'

const AdvancedSetting: React.FC = () => {
  const { t } = useTranslation('mihomo')
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const {
    'unified-delay': unifiedDelay,
    'tcp-concurrent': tcpConcurrent,
    'disable-keep-alive': disableKeepAlive = false,
    'find-process-mode': findProcessMode = 'always',
    'interface-name': interfaceName = '',
    'keep-alive-idle': idle = 15,
    'keep-alive-interval': interval = 15,
    profile = {},
    tun = {}
  } = controledMihomoConfig || {}
  const { 'store-selected': storeSelected, 'store-fake-ip': storeFakeIp } = profile
  const { device = 'mihomo' } = tun

  const [idleInput, setIdleInput] = useState(idle)
  const [intervalInput, setIntervalInput] = useState(interval)

  const onChangeNeedRestart = async (patch: Partial<MihomoConfig>): Promise<void> => {
    await patchControledMihomoConfig(patch)
    await restartCore()
  }

  return (
    <SettingCard title={t('advanced.title')}>
      <SettingItem title={t('advanced.findProcess')} divider>
        <Tabs
          size="sm"
          color="primary"
          selectedKey={findProcessMode}
          onSelectionChange={(key) => {
            onChangeNeedRestart({ 'find-process-mode': key as FindProcessMode })
          }}
        >
          <Tab key="strict" title={t('advanced.auto')}></Tab>
          <Tab key="off" title={t('advanced.off')}></Tab>
          <Tab key="always" title={t('advanced.on')}></Tab>
        </Tabs>
      </SettingItem>
      <SettingItem title={t('advanced.storeSelected')} divider>
        <Switch
          size="sm"
          isSelected={storeSelected}
          onValueChange={(v) => {
            onChangeNeedRestart({ profile: { 'store-selected': v } })
          }}
        />
      </SettingItem>
      <SettingItem title={t('advanced.storeFakeIP')} divider>
        <Switch
          size="sm"
          isSelected={storeFakeIp}
          onValueChange={(v) => {
            onChangeNeedRestart({ profile: { 'store-fake-ip': v } })
          }}
        />
      </SettingItem>
      <SettingItem
        title={t('advanced.unifiedDelay')}
        actions={
          <Tooltip content={t('advanced.unifiedDelayTip')}>
            <Button isIconOnly size="sm" variant="light">
              <IoIosHelpCircle className="text-lg" />
            </Button>
          </Tooltip>
        }
        divider
      >
        <Switch
          size="sm"
          isSelected={unifiedDelay}
          onValueChange={(v) => {
            onChangeNeedRestart({ 'unified-delay': v })
          }}
        />
      </SettingItem>
      <SettingItem
        title={t('advanced.tcpConcurrent')}
        actions={
          <Tooltip content={t('advanced.tcpConcurrentTip')}>
            <Button isIconOnly size="sm" variant="light">
              <IoIosHelpCircle className="text-lg" />
            </Button>
          </Tooltip>
        }
        divider
      >
        <Switch
          size="sm"
          isSelected={tcpConcurrent}
          onValueChange={(v) => {
            onChangeNeedRestart({ 'tcp-concurrent': v })
          }}
        />
      </SettingItem>
      <SettingItem title={t('advanced.disableKeepAlive')} divider>
        <Switch
          size="sm"
          isSelected={disableKeepAlive}
          onValueChange={(v) => {
            onChangeNeedRestart({ 'disable-keep-alive': v })
          }}
        />
      </SettingItem>
      <SettingItem title={t('advanced.keepAliveInterval')} divider>
        <div className="flex">
          {intervalInput !== interval && (
            <Button
              size="sm"
              color="primary"
              className="mr-2"
              onPress={async () => {
                await onChangeNeedRestart({ 'keep-alive-interval': intervalInput })
              }}
            >
              {t('common:actions.confirm')}
            </Button>
          )}
          <Input
            size="sm"
            type="number"
            className="w-[100px]"
            value={intervalInput.toString()}
            min={0}
            onValueChange={(v) => {
              const num = parseInt(v)
              setIntervalInput(isNaN(num) ? 0 : num)
            }}
          />
        </div>
      </SettingItem>
      <SettingItem title={t('advanced.keepAliveIdle')} divider>
        <div className="flex">
          {idleInput !== idle && (
            <Button
              size="sm"
              color="primary"
              className="mr-2"
              onPress={async () => {
                await onChangeNeedRestart({ 'keep-alive-idle': idleInput })
              }}
            >
              {t('common:actions.confirm')}
            </Button>
          )}
          <Input
            size="sm"
            type="number"
            className="w-[100px]"
            value={idleInput.toString()}
            min={0}
            onValueChange={(v) => {
              const num = parseInt(v)
              setIdleInput(isNaN(num) ? 0 : num)
            }}
          />
        </div>
      </SettingItem>
      <SettingItem title={t('advanced.interfaceName')}>
        <InterfaceSelect
          value={interfaceName}
          exclude={[device, 'lo']}
          onChange={(iface) => onChangeNeedRestart({ 'interface-name': iface })}
        />
      </SettingItem>
    </SettingCard>
  )
}

export default AdvancedSetting
