import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input } from '@heroui/react'
import { listWebdavBackups, webdavBackup } from '@renderer/utils/ipc'
import WebdavRestoreModal from './webdav-restore-modal'
import debounce from '@renderer/utils/debounce'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'

const WebdavConfig: React.FC = () => {
  const { t } = useTranslation('settings')
  const { appConfig, patchAppConfig } = useAppConfig()
  const { webdavUrl, webdavUsername, webdavPassword, webdavDir = 'sparkle' } = appConfig || {}
  const [backuping, setBackuping] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [filenames, setFilenames] = useState<string[]>([])
  const [restoreOpen, setRestoreOpen] = useState(false)

  const [webdav, setWebdav] = useState({ webdavUrl, webdavUsername, webdavPassword, webdavDir })
  const setWebdavDebounce = debounce(({ webdavUrl, webdavUsername, webdavPassword, webdavDir }) => {
    patchAppConfig({ webdavUrl, webdavUsername, webdavPassword, webdavDir })
  }, 500)
  const handleBackup = async (): Promise<void> => {
    setBackuping(true)
    try {
      await webdavBackup()
      new window.Notification(t('backup.webdav.backupSuccess'), {
        body: t('backup.webdav.backupSuccessDesc')
      })
    } catch (e) {
      alert(e)
    } finally {
      setBackuping(false)
    }
  }

  const handleRestore = async (): Promise<void> => {
    try {
      setRestoring(true)
      const filenames = await listWebdavBackups()
      setFilenames(filenames)
      setRestoreOpen(true)
    } catch (e) {
      alert(`${t('backup.webdav.fetchListFailed')}：${e}`)
    } finally {
      setRestoring(false)
    }
  }
  return (
    <>
      {restoreOpen && (
        <WebdavRestoreModal filenames={filenames} onClose={() => setRestoreOpen(false)} />
      )}
      <SettingCard title={t('backup.webdav.title')}>
        <SettingItem compatKey="legacy"
          title={t('backup.webdav.url')} divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={webdav.webdavUrl}
            onValueChange={(v) => {
              setWebdav({ ...webdav, webdavUrl: v })
              setWebdavDebounce({ ...webdav, webdavUrl: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('backup.webdav.dir')} divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={webdav.webdavDir}
            onValueChange={(v) => {
              setWebdav({ ...webdav, webdavDir: v })
              setWebdavDebounce({ ...webdav, webdavDir: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('backup.webdav.username')} divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={webdav.webdavUsername}
            onValueChange={(v) => {
              setWebdav({ ...webdav, webdavUsername: v })
              setWebdavDebounce({ ...webdav, webdavUsername: v })
            }}
          />
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('backup.webdav.password')} divider>
          <Input
            size="sm"
            className="w-[60%]"
            type="password"
            value={webdav.webdavPassword}
            onValueChange={(v) => {
              setWebdav({ ...webdav, webdavPassword: v })
              setWebdavDebounce({ ...webdav, webdavPassword: v })
            }}
          />
        </SettingItem>
        <div className="flex justify0between">
          <Button isLoading={backuping} fullWidth size="sm" className="mr-1" onPress={handleBackup}>
            {t('common:actions.backup')}
          </Button>
          <Button
            isLoading={restoring}
            fullWidth
            size="sm"
            className="ml-1"
            onPress={handleRestore}
          >
            {t('common:actions.restore')}
          </Button>
        </div>
      </SettingCard>
    </>
  )
}

export default WebdavConfig
