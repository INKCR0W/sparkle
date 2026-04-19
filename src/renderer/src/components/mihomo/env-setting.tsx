import React, { useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Switch } from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { restartCore } from '@renderer/utils/ipc'
import EditableList from '../base/base-list-editor'
import { platform } from '@renderer/utils/init'

const EnvSetting: React.FC = () => {
  const { t } = useTranslation('mihomo')
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    disableLoopbackDetector,
    disableEmbedCA,
    disableSystemCA,
    disableNftables,
    safePaths = []
  } = appConfig || {}
  const handleConfigChangeWithRestart = async (key: string, value: unknown): Promise<void> => {
    try {
      await patchAppConfig({ [key]: value })
      await restartCore()
    } catch (e) {
      alert(e)
    } finally {
      PubSub.publish('mihomo-core-changed')
    }
  }
  const [safePathsInput, setSafePathsInput] = useState(safePaths)

  return (
    <SettingCard title={t('env.title')}>
      <SettingItem compatKey="legacy"
          title={t('env.disableSystemCA')} divider>
        <Switch
          size="sm"
          isSelected={disableSystemCA}
          onValueChange={(v) => {
            handleConfigChangeWithRestart('disableSystemCA', v)
          }}
        />
      </SettingItem>
      <SettingItem compatKey="legacy"
          title={t('env.disableEmbedCA')} divider>
        <Switch
          size="sm"
          isSelected={disableEmbedCA}
          onValueChange={(v) => {
            handleConfigChangeWithRestart('disableEmbedCA', v)
          }}
        />
      </SettingItem>
      <SettingItem compatKey="legacy"
          title={t('env.disableLoopbackDetector')} divider>
        <Switch
          size="sm"
          isSelected={disableLoopbackDetector}
          onValueChange={(v) => {
            handleConfigChangeWithRestart('disableLoopbackDetector', v)
          }}
        />
      </SettingItem>
      {platform == 'linux' && (
        <SettingItem compatKey="legacy"
          title={t('env.disableNftables')} divider>
          <Switch
            size="sm"
            isSelected={disableNftables}
            onValueChange={(v) => {
              handleConfigChangeWithRestart('disableNftables', v)
            }}
          />
        </SettingItem>
      )}
      <SettingItem compatKey="legacy"
          title={t('env.safePaths')}>
        {safePathsInput.join('') != safePaths.join('') && (
          <Button
            size="sm"
            color="primary"
            onPress={() => {
              handleConfigChangeWithRestart('safePaths', safePathsInput)
            }}
          >
            {t('common:actions.confirm')}
          </Button>
        )}
      </SettingItem>
      <EditableList
        items={safePathsInput}
        onChange={(items) => setSafePathsInput(items as string[])}
        divider={false}
      />{' '}
    </SettingCard>
  )
}

export default EnvSetting
