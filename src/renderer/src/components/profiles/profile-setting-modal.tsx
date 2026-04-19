import { Button, Switch, Input, Tab, Tabs, Tooltip } from '@heroui/react'
import { Modal } from '@heroui-v3/react'
import React, { useState, useEffect, useRef } from 'react'
import SettingItem from '../base/base-setting-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { getGistUrl, getUserAgent } from '@renderer/utils/ipc'
import debounce from '@renderer/utils/debounce'
import { IoIosHelpCircle } from 'react-icons/io'
import { BiCopy } from 'react-icons/bi'

interface Props {
  onClose: () => void
}

const ProfileSettingModal: React.FC<Props> = (props) => {
  const { onClose } = props
  const { t } = useTranslation('profile')
  const { appConfig, patchAppConfig } = useAppConfig()

  const {
    profileDisplayDate = 'update',
    userAgent,
    diffWorkDir = false,
    githubToken = ''
  } = appConfig || {}

  const [ua, setUa] = useState(userAgent ?? '')
  const [defaultUserAgent, setDefaultUserAgent] = useState<string>('')
  const userAgentFetched = useRef(false)

  const setUaDebounce = debounce((v: string) => {
    patchAppConfig({ userAgent: v })
  }, 500)

  useEffect(() => {
    if (!userAgentFetched.current) {
      userAgentFetched.current = true
      getUserAgent().then((ua) => {
        setDefaultUserAgent(ua)
      })
    }
  }, [])

  useEffect(() => {
    setUa(userAgent ?? '')
  }, [userAgent])

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={onClose}
        variant="blur"
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="max-w-md flag-emoji">
            <Modal.Header className="pb-0">
              <Modal.Heading>{t('settings')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="py-2 gap-1">
              <SettingItem compatKey="legacy" title={t('displayDate')} divider>
                <Tabs
                  size="sm"
                  color="primary"
                  selectedKey={profileDisplayDate}
                  onSelectionChange={async (v) => {
                    await patchAppConfig({
                      profileDisplayDate: v as 'expire' | 'update'
                    })
                  }}
                >
                  <Tab key="update" title={t('sortBy.updateTime')} />
                  <Tab key="expire" title={t('sortBy.expireTime')} />
                </Tabs>
              </SettingItem>
              <SettingItem
                compatKey="legacy"
                title={t('diffWorkDir')}
                actions={
                  <Tooltip content={t('diffWorkDirTip')}>
                    <Button isIconOnly size="sm" variant="light">
                      <IoIosHelpCircle className="text-lg" />
                    </Button>
                  </Tooltip>
                }
                divider
              >
                <Switch
                  size="sm"
                  isSelected={diffWorkDir}
                  onValueChange={(v) => {
                    patchAppConfig({ diffWorkDir: v })
                  }}
                />
              </SettingItem>
              <SettingItem compatKey="legacy" title={t('userAgent')} divider>
                <Input
                  size="sm"
                  className="w-[60%]"
                  value={ua}
                  placeholder={`${t('userAgentPlaceholder')} ${defaultUserAgent}`}
                  onValueChange={(v) => {
                    setUa(v)
                    setUaDebounce(v)
                  }}
                />
              </SettingItem>
              <SettingItem
                compatKey="legacy"
                title={t('syncToGist')}
                actions={
                  <Button
                    title={t('copyGistUrl')}
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={async () => {
                      try {
                        const url = await getGistUrl()
                        if (url !== '') {
                          await navigator.clipboard.writeText(`${url}/raw/sparkle.yaml`)
                        }
                      } catch (e) {
                        alert(e)
                      }
                    }}
                  >
                    <BiCopy className="text-lg" />
                  </Button>
                }
              >
                <Input
                  type="password"
                  size="sm"
                  className="w-[60%]"
                  value={githubToken}
                  placeholder={t('githubTokenPlaceholder')}
                  onValueChange={(v) => {
                    patchAppConfig({ githubToken: v })
                  }}
                />
              </SettingItem>
            </Modal.Body>
            <Modal.CloseTrigger className="app-nodrag" />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default ProfileSettingModal
