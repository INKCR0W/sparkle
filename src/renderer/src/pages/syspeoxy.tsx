import { Button, Input, Switch, Tab, Tabs, Tooltip } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import EditableList from '@renderer/components/base/base-list-editor'
import PacEditorModal from '@renderer/components/sysproxy/pac-editor-modal'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { platform } from '@renderer/utils/init'
import { openUWPTool, triggerSysProxy } from '@renderer/utils/ipc'
import React, { Key, useEffect, useState } from 'react'
import ByPassEditorModal from '@renderer/components/sysproxy/bypass-editor-modal'
import { IoIosHelpCircle } from 'react-icons/io'
import { useTranslation } from '@renderer/hooks/useTranslation'

const defaultPacScript = `
function FindProxyForURL(url, host) {
  return "PROXY 127.0.0.1:%mixed-port%; SOCKS5 127.0.0.1:%mixed-port%; DIRECT;";
}
`

const Sysproxy: React.FC = () => {
  const { t } = useTranslation('sysproxy')
  const defaultBypass: string[] =
    platform === 'linux'
      ? [
          'localhost',
          '.local',
          '127.0.0.1/8',
          '192.168.0.0/16',
          '10.0.0.0/8',
          '172.16.0.0/12',
          '::1'
        ]
      : platform === 'darwin'
        ? [
            '127.0.0.1/8',
            '192.168.0.0/16',
            '10.0.0.0/8',
            '172.16.0.0/12',
            'localhost',
            '*.local',
            '*.crashlytics.com',
            '<local>'
          ]
        : [
            'localhost',
            '127.*',
            '192.168.*',
            '10.*',
            '172.16.*',
            '172.17.*',
            '172.18.*',
            '172.19.*',
            '172.20.*',
            '172.21.*',
            '172.22.*',
            '172.23.*',
            '172.24.*',
            '172.25.*',
            '172.26.*',
            '172.27.*',
            '172.28.*',
            '172.29.*',
            '172.30.*',
            '172.31.*',
            '<local>'
          ]

  const { appConfig, patchAppConfig } = useAppConfig()
  const { sysProxy, onlyActiveDevice = false } =
    appConfig || ({ sysProxy: { enable: false } } as AppConfig)
  const [changed, setChanged] = useState(false)
  const [values, originSetValues] = useState({
    enable: sysProxy.enable,
    host: sysProxy.host ?? '',
    bypass: sysProxy.bypass ?? defaultBypass,
    mode: sysProxy.mode ?? 'manual',
    pacScript: sysProxy.pacScript ?? defaultPacScript,
    settingMode: sysProxy.settingMode ?? 'exec'
  })
  useEffect(() => {
    originSetValues((prev) => ({
      ...prev,
      enable: sysProxy.enable
    }))
  }, [sysProxy.enable])
  const [openEditor, setOpenEditor] = useState(false)
  const [openPacEditor, setOpenPacEditor] = useState(false)

  const setValues = (v: typeof values): void => {
    originSetValues(v)
    setChanged(true)
  }
  const validateHost = (host: string): boolean => {
    if (!host) return true
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (ipMatch) {
      return ipMatch.slice(1).every((octet) => {
        const num = parseInt(octet, 10)
        return num >= 0 && num <= 255
      })
    }
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$|^[a-zA-Z0-9]$/
    return hostnameRegex.test(host)
  }

  const validateBypass = (bypass: string[]): boolean => {
    if (!bypass || bypass.length === 0) return true
    // 支持的格式：
    // - 域名: localhost, example.com, *.example.com, .local
    // - IP: 192.168.1.1, 127.0.0.1/8
    // - 通配符: 127.*, 192.168.*, 10.*
    // - 特殊: <local>, ::1
    const bypassRegex =
      /^(\*\.)?[a-zA-Z0-9*.-]+(\.\*)?$|^\.[a-zA-Z0-9-]+$|^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^\d{1,3}\.\*$|^(\d{1,3}\.){2}\*$|^(\d{1,3}\.){3}\*$|^<[a-z]+>$|^::1$/
    return bypass.every(
      (item) => typeof item === 'string' && item.trim().length > 0 && bypassRegex.test(item.trim())
    )
  }

  const validatePacScript = (script: string): boolean => {
    if (!script) return false
    return /function\s+FindProxyForURL\s*\(/.test(script)
  }

  const onSave = async (): Promise<void> => {
    if (!validateHost(values.host)) {
      alert(t('hostInvalid'))
      return
    }

    if (!validateBypass(values.bypass)) {
      alert(t('bypassInvalid'))
      return
    }

    if (values.mode === 'auto' && !validatePacScript(values.pacScript)) {
      alert(t('pacInvalid'))
      return
    }

    const saveValues = {
      ...values,
      host: values.host || '127.0.0.1',
      bypass: values.bypass.map((item) => item.trim())
    }
    try {
      await patchAppConfig({ sysProxy: saveValues })
      setChanged(false)
    } catch (e) {
      alert(e)
      return
    }
    if (saveValues.enable) {
      try {
        await triggerSysProxy(saveValues.enable, onlyActiveDevice)
      } catch (e) {
        alert(e)
        await patchAppConfig({ sysProxy: { enable: false } })
      }
    }
  }

  return (
    <BasePage
      title={t('title')}
      header={
        changed && (
          <Button color="primary" className="app-nodrag" size="sm" onPress={onSave}>
            {t('common:actions.save')}
          </Button>
        )
      }
    >
      {openPacEditor && (
        <PacEditorModal
          script={values.pacScript || defaultPacScript}
          onCancel={() => setOpenPacEditor(false)}
          onConfirm={(script: string) => {
            setValues({ ...values, pacScript: script })
            setOpenPacEditor(false)
          }}
        />
      )}
      {openEditor && (
        <ByPassEditorModal
          bypass={values.bypass}
          onCancel={() => setOpenEditor(false)}
          onConfirm={async (list: string[]) => {
            setOpenEditor(false)
            setValues({
              ...values,
              bypass: list
            })
          }}
        />
      )}
      <SettingCard className="sysproxy-settings">
        <SettingItem compatKey="legacy"
          title={t('host')} divider>
          <Input
            size="sm"
            className="w-[50%]"
            value={values.host}
            placeholder={t('hostPlaceholder')}
            onValueChange={(v) => {
              setValues({ ...values, host: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('mode')} divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={values.mode}
            onSelectionChange={(key: Key) => setValues({ ...values, mode: key as SysProxyMode })}
          >
            <Tab key="manual" title={t('modeManual')} />
            <Tab key="auto" title={t('modeAuto')} />
          </Tabs>
        </SettingItem>
        {platform === 'win32' && (
          <SettingItem compatKey="legacy"
          title={t('uwpTool')} divider>
            <Button
              size="sm"
              onPress={async () => {
                await openUWPTool()
              }}
            >
              {t('openUwpTool')}
            </Button>
          </SettingItem>
        )}
        {platform === 'darwin' && (
          <>
            <SettingItem compatKey="legacy"
          title={t('setMethod')} divider>
              <Tabs
                size="sm"
                color="primary"
                selectedKey={values.settingMode}
                onSelectionChange={(key) => {
                  setValues({ ...values, settingMode: key as 'exec' | 'service' })
                }}
              >
                <Tab key="exec" title={t('setMethodExec')} />
                <Tab key="service" title={t('setMethodService')} />
              </Tabs>
            </SettingItem>
            <SettingItem
              compatKey="legacy"
              title={t('activeInterfaceOnly')}
              actions={
                <Tooltip
                  content={
                    <>
                      <div>{t('activeInterfaceOnlyTip')}</div>
                    </>
                  }
                >
                  <Button isIconOnly size="sm" variant="light">
                    <IoIosHelpCircle className="text-lg" />
                  </Button>
                </Tooltip>
              }
              divider
            >
              <Switch
                size="sm"
                isSelected={onlyActiveDevice}
                isDisabled={!values.settingMode || values.settingMode !== 'service'}
                onValueChange={(v) => {
                  patchAppConfig({ onlyActiveDevice: v })
                }}
              />
            </SettingItem>
          </>
        )}
        {values.mode === 'auto' && (
          <SettingItem compatKey="legacy"
          title={t('mode')}>
            <Button size="sm" onPress={() => setOpenPacEditor(true)}>
              {t('editPac')}
            </Button>
          </SettingItem>
        )}
        {values.mode === 'manual' && (
          <>
            <SettingItem compatKey="legacy"
          title={t('addDefaultBypass')} divider>
              <Button
                size="sm"
                onPress={() => {
                  setValues({
                    ...values,
                    bypass: Array.from(new Set([...defaultBypass, ...values.bypass]))
                  })
                }}
              >
                {t('addDefaultBypass')}
              </Button>
            </SettingItem>
            <SettingItem compatKey="legacy"
          title={t('bypassList')}>
              <Button
                size="sm"
                onPress={async () => {
                  setOpenEditor(true)
                }}
              >
                {t('common:actions.edit')}
              </Button>
            </SettingItem>
            <EditableList
              items={values.bypass}
              onChange={(list) => setValues({ ...values, bypass: list as string[] })}
              placeholder={t('bypassPlaceholder')}
              divider={false}
            />
          </>
        )}
      </SettingCard>
    </BasePage>
  )
}

export default Sysproxy
