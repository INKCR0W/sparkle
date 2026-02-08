import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs
} from '@heroui/react'
import React, { useState, useEffect } from 'react'
import SettingItem from '../base/base-setting-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import debounce from '@renderer/utils/debounce'

interface Props {
  onClose: () => void
}

const ProxySettingModal: React.FC<Props> = (props) => {
  const { onClose } = props
  const { t } = useTranslation('proxy')
  const { appConfig, patchAppConfig } = useAppConfig()

  const {
    proxyCols = 'auto',
    proxyDisplayOrder = 'default',
    groupDisplayLayout = 'single',
    proxyDisplayLayout = 'double',
    autoCloseConnection = true,
    delayTestUrl,
    delayTestUrlScope = 'group',
    delayTestConcurrency,
    delayTestTimeout
  } = appConfig || {}

  const [url, setUrl] = useState(delayTestUrl ?? '')

  const setUrlDebounce = debounce((v: string) => {
    patchAppConfig({ delayTestUrl: v })
  }, 500)

  useEffect(() => {
    setUrl(delayTestUrl ?? '')
  }, [delayTestUrl])

  return (
    <Modal
      backdrop="blur"
      classNames={{ backdrop: 'top-[48px]' }}
      size="xl"
      hideCloseButton
      isOpen={true}
      onOpenChange={onClose}
      scrollBehavior="inside"
    >
      <ModalContent className="flag-emoji">
        <ModalHeader className="flex pb-0">{t('settings')}</ModalHeader>
        <ModalBody className="py-2 gap-1">
          <SettingItem title={t('proxyCols')} divider>
            <Select
              classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
              className="w-[150px]"
              size="sm"
              selectedKeys={new Set([proxyCols])}
              disallowEmptySelection={true}
              onSelectionChange={async (v) => {
                await patchAppConfig({ proxyCols: v.currentKey as 'auto' | '1' | '2' | '3' | '4' })
              }}
            >
              <SelectItem key="auto">{t('proxyColsAuto')}</SelectItem>
              <SelectItem key="1">{t('proxyCols1')}</SelectItem>
              <SelectItem key="2">{t('proxyCols2')}</SelectItem>
              <SelectItem key="3">{t('proxyCols3')}</SelectItem>
              <SelectItem key="4">{t('proxyCols4')}</SelectItem>
            </Select>
          </SettingItem>
          <SettingItem title={t('proxyDisplayOrder')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={proxyDisplayOrder}
              onSelectionChange={async (v) => {
                await patchAppConfig({
                  proxyDisplayOrder: v as 'default' | 'delay' | 'name'
                })
              }}
            >
              <Tab key="default" title={t('orderBy.default')} />
              <Tab key="delay" title={t('orderBy.delay')} />
              <Tab key="name" title={t('orderBy.name')} />
            </Tabs>
          </SettingItem>
          <SettingItem title={t('groupDisplayLayout')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={groupDisplayLayout}
              onSelectionChange={async (v) => {
                await patchAppConfig({
                  groupDisplayLayout: v as 'hidden' | 'single' | 'double'
                })
              }}
            >
              <Tab key="hidden" title={t('displayLayout.hidden')} />
              <Tab key="single" title={t('displayLayout.single')} />
              <Tab key="double" title={t('displayLayout.double')} />
            </Tabs>
          </SettingItem>
          <SettingItem title={t('proxyDisplayLayout')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={proxyDisplayLayout}
              onSelectionChange={async (v) => {
                await patchAppConfig({
                  proxyDisplayLayout: v as 'hidden' | 'single' | 'double'
                })
              }}
            >
              <Tab key="hidden" title={t('displayLayout.hidden')} />
              <Tab key="single" title={t('displayLayout.single')} />
              <Tab key="double" title={t('displayLayout.double')} />
            </Tabs>
          </SettingItem>
          <SettingItem title={t('autoCloseConnection')} divider>
            <Switch
              size="sm"
              isSelected={autoCloseConnection}
              onValueChange={(v) => {
                patchAppConfig({ autoCloseConnection: v })
              }}
            />
          </SettingItem>
          <SettingItem title={t('delayTestUrl')} divider>
            <Input
              size="sm"
              className="w-[60%]"
              value={url}
              placeholder={t('delayTestUrlPlaceholder')}
              onValueChange={(v) => {
                setUrl(v)
                setUrlDebounce(v)
              }}
            />
          </SettingItem>
          <SettingItem title={t('delayTestUrlScope')} divider>
            <Tabs
              size="sm"
              color="primary"
              selectedKey={delayTestUrlScope}
              onSelectionChange={async (v) => {
                await patchAppConfig({
                  delayTestUrlScope: v as 'group' | 'global'
                })
              }}
            >
              <Tab key="group" title={t('delayTestUrlScope.group')} />
              <Tab key="global" title={t('delayTestUrlScope.global')} />
            </Tabs>
          </SettingItem>
          <SettingItem title={t('delayTestConcurrency')} divider>
            <Input
              type="number"
              size="sm"
              className="w-[100px]"
              value={delayTestConcurrency?.toString()}
              placeholder={t('delayTestConcurrencyPlaceholder')}
              onValueChange={(v) => {
                patchAppConfig({ delayTestConcurrency: parseInt(v) })
              }}
            />
          </SettingItem>
          <SettingItem title={t('delayTestTimeout')}>
            <Input
              type="number"
              size="sm"
              className="w-[100px]"
              value={delayTestTimeout?.toString()}
              placeholder={t('delayTestTimeoutPlaceholder')}
              onValueChange={(v) => {
                patchAppConfig({ delayTestTimeout: parseInt(v) })
              }}
            />
          </SettingItem>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="light" onPress={onClose}>
            {t('common:actions.close')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ProxySettingModal
