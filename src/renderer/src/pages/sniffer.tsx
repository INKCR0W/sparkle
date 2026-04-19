import { Button, Input, Switch } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import EditableList from '@renderer/components/base/base-list-editor'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { restartCore } from '@renderer/utils/ipc'
import React, { useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'

const Sniffer: React.FC = () => {
  const { t } = useTranslation('sniffer')
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const { sniffer } = controledMihomoConfig || {}
  const {
    'parse-pure-ip': parsePureIP = true,
    'force-dns-mapping': forceDNSMapping = true,
    'override-destination': overrideDestination = false,
    sniff = {
      HTTP: { ports: [80, 443], 'override-destination': false },
      TLS: { ports: [443] },
      QUIC: { ports: [] }
    },
    'skip-domain': skipDomain = ['+.push.apple.com'],
    'force-domain': forceDomain = [],
    'skip-dst-address': skipDstAddress = [
      '91.105.192.0/23',
      '91.108.4.0/22',
      '91.108.8.0/21',
      '91.108.16.0/21',
      '91.108.56.0/22',
      '95.161.64.0/20',
      '149.154.160.0/20',
      '185.76.151.0/24',
      '2001:67c:4e8::/48',
      '2001:b28:f23c::/47',
      '2001:b28:f23f::/48',
      '2a0a:f280:203::/48'
    ],
    'skip-src-address': skipSrcAddress = []
  } = sniffer || {}
  const [changed, setChanged] = useState(false)
  const [values, originSetValues] = useState({
    parsePureIP,
    forceDNSMapping,
    overrideDestination,
    sniff,
    skipDomain,
    forceDomain,
    skipDstAddress,
    skipSrcAddress
  })
  const setValues = (v: typeof values): void => {
    originSetValues(v)
    setChanged(true)
  }

  const onSave = async (patch: Partial<MihomoConfig>): Promise<void> => {
    try {
      setChanged(false)
      await patchControledMihomoConfig(patch)
      await restartCore()
    } catch (e) {
      alert(e)
    }
  }

  const handleSniffPortChange = (protocol: keyof typeof sniff, value: string): void => {
    setValues({
      ...values,
      sniff: {
        ...values.sniff,
        [protocol]: {
          ...values.sniff[protocol],
          ports: value.split(',').map((port) => port.trim())
        }
      }
    })
  }

  return (
    <BasePage
      title={t('title')}
      header={
        changed && (
          <Button
            size="sm"
            className="app-nodrag"
            color="primary"
            onPress={() =>
              onSave({
                sniffer: {
                  'parse-pure-ip': values.parsePureIP,
                  'force-dns-mapping': values.forceDNSMapping,
                  'override-destination': values.overrideDestination,
                  sniff: values.sniff,
                  'skip-domain': values.skipDomain,
                  'force-domain': values.forceDomain,
                  'skip-dst-address': values.skipDstAddress,
                  'skip-src-address': values.skipSrcAddress
                }
              })
            }
          >
            {t('common:actions.save')}
          </Button>
        )
      }
    >
      <SettingCard>
        <SettingItem compatKey="legacy"
          title={t('overrideDestination')} divider>
          <Switch
            size="sm"
            isSelected={values.overrideDestination}
            onValueChange={(v) => {
              setValues({
                ...values,
                overrideDestination: v,
                sniff: {
                  ...values.sniff,
                  HTTP: {
                    ...values.sniff.HTTP,
                    'override-destination': v,
                    ports: values.sniff.HTTP?.ports || [80, 443]
                  }
                }
              })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('sniffRealIP')} divider>
          <Switch
            size="sm"
            isSelected={values.forceDNSMapping}
            onValueChange={(v) => {
              setValues({ ...values, forceDNSMapping: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('sniffUnmappedIP')} divider>
          <Switch
            size="sm"
            isSelected={values.parsePureIP}
            onValueChange={(v) => {
              setValues({ ...values, parsePureIP: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('httpPorts')} divider>
          <Input
            size="sm"
            className="w-[50%]"
            placeholder={t('common:ui.portPlaceholder')}
            value={values.sniff.HTTP?.ports.join(',')}
            onValueChange={(v) => handleSniffPortChange('HTTP', v)}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('tlsPorts')} divider>
          <Input
            size="sm"
            className="w-[50%]"
            placeholder={t('common:ui.portPlaceholder')}
            value={values.sniff.TLS?.ports.join(',')}
            onValueChange={(v) => handleSniffPortChange('TLS', v)}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('quicPorts')} divider>
          <Input
            size="sm"
            className="w-[50%]"
            placeholder={t('common:ui.portPlaceholder')}
            value={values.sniff.QUIC?.ports.join(',')}
            onValueChange={(v) => handleSniffPortChange('QUIC', v)}
          />
        </SettingItem>
        <EditableList
          title={t('skipDomain')}
          items={values.skipDomain}
          onChange={(list) => setValues({ ...values, skipDomain: list as string[] })}
          placeholder={t('common:ui.domainPlaceholder')}
        />
        <EditableList
          title={t('forceDomain')}
          items={values.forceDomain}
          onChange={(list) => setValues({ ...values, forceDomain: list as string[] })}
          placeholder={t('common:ui.domainPlaceholder2')}
        />
        <EditableList
          title={t('skipDstAddress')}
          items={values.skipDstAddress}
          onChange={(list) => setValues({ ...values, skipDstAddress: list as string[] })}
          placeholder={t('common:ui.addressPlaceholder')}
        />
        <EditableList
          title={t('skipSrcAddress')}
          items={values.skipSrcAddress}
          onChange={(list) => setValues({ ...values, skipSrcAddress: list as string[] })}
          placeholder={t('common:ui.addressPlaceholder2')}
          divider={false}
        />
      </SettingCard>
    </BasePage>
  )
}

export default Sniffer
