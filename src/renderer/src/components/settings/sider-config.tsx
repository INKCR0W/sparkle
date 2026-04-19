import React from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { RadioGroup, Radio } from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'

const SiderConfig: React.FC = () => {
  const { t } = useTranslation('settings')
  const { appConfig, patchAppConfig } = useAppConfig()

  const titleMap = {
    sysproxyCardStatus: t('sider.sysproxyCardStatus'),
    tunCardStatus: t('sider.tunCardStatus'),
    profileCardStatus: t('sider.profileCardStatus'),
    proxyCardStatus: t('sider.proxyCardStatus'),
    ruleCardStatus: t('sider.ruleCardStatus'),
    resourceCardStatus: t('sider.resourceCardStatus'),
    overrideCardStatus: t('sider.overrideCardStatus'),
    connectionCardStatus: t('sider.connectionCardStatus'),
    mihomoCoreCardStatus: t('sider.mihomoCoreCardStatus'),
    dnsCardStatus: t('sider.dnsCardStatus'),
    sniffCardStatus: t('sider.sniffCardStatus'),
    logCardStatus: t('sider.logCardStatus'),
    substoreCardStatus: t('sider.substoreCardStatus')
  }

  const {
    sysproxyCardStatus = 'col-span-1',
    tunCardStatus = 'col-span-1',
    profileCardStatus = 'col-span-2',
    proxyCardStatus = 'col-span-2',
    ruleCardStatus = 'col-span-1',
    resourceCardStatus = 'col-span-1',
    overrideCardStatus = 'col-span-1',
    connectionCardStatus = 'col-span-2',
    mihomoCoreCardStatus = 'col-span-2',
    dnsCardStatus = 'col-span-1',
    sniffCardStatus = 'col-span-1',
    logCardStatus = 'col-span-1',
    substoreCardStatus = 'col-span-1'
  } = appConfig || {}

  const cardStatus = {
    sysproxyCardStatus,
    tunCardStatus,
    profileCardStatus,
    proxyCardStatus,
    ruleCardStatus,
    resourceCardStatus,
    overrideCardStatus,
    connectionCardStatus,
    mihomoCoreCardStatus,
    dnsCardStatus,
    sniffCardStatus,
    logCardStatus,
    substoreCardStatus
  }

  return (
    <SettingCard title={t('sider.title')}>
      {Object.keys(cardStatus).map((key, index, array) => {
        return (
          <SettingItem
            compatKey="legacy"
            title={titleMap[key]}
            key={key}
            divider={index !== array.length - 1}
          >
            <RadioGroup
              orientation="horizontal"
              value={cardStatus[key]}
              onValueChange={(v) => {
                patchAppConfig({ [key]: v as CardStatus })
              }}
            >
              <Radio value="col-span-2">{t('common:ui.large')}</Radio>
              <Radio value="col-span-1">{t('common:ui.small')}</Radio>
              <Radio value="hidden">{t('common:ui.hidden')}</Radio>
            </RadioGroup>
          </SettingItem>
        )
      })}
    </SettingCard>
  )
}

export default SiderConfig
