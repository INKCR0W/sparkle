import { Button, Tooltip } from '@heroui/react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import {
  checkUpdate,
  createHeapSnapshot,
  quitApp,
  quitWithoutCore,
  resetAppConfig,
  cancelUpdate
} from '@renderer/utils/ipc'
import { useState, useEffect } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import UpdaterModal from '../updater/updater-modal'
import { version } from '@renderer/utils/init'
import { IoIosHelpCircle } from 'react-icons/io'
import { startTour } from '@renderer/utils/driver'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../base/base-confirm'

const Actions: React.FC = () => {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const [newVersion, setNewVersion] = useState('')
  const [changelog, setChangelog] = useState('')
  const [openUpdate, setOpenUpdate] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    downloading: boolean
    progress: number
    error?: string
  }>({
    downloading: false,
    progress: 0
  })

  useEffect(() => {
    const handleUpdateStatus = (
      _: Electron.IpcRendererEvent,
      status: typeof updateStatus
    ): void => {
      setUpdateStatus(status)
    }

    const unsubscribe = window.electron.ipcRenderer.on('update-status', handleUpdateStatus)

    return (): void => {
      unsubscribe()
    }
  }, [])

  const handleCancelUpdate = async (): Promise<void> => {
    try {
      await cancelUpdate()
      setUpdateStatus({ downloading: false, progress: 0 })
    } catch (e) {
      // ignore
    }
  }

  return (
    <>
      {openUpdate && (
        <UpdaterModal
          onClose={() => setOpenUpdate(false)}
          version={newVersion}
          changelog={changelog}
          updateStatus={updateStatus}
          onCancel={handleCancelUpdate}
        />
      )}
      {confirmOpen && (
        <ConfirmModal
          onChange={setConfirmOpen}
          title={t('actions.confirmReset')}
          description={<>⚠️ {t('actions.confirmResetDesc')}</>}
          confirmText={t('actions.confirmDelete')}
          cancelText={t('common:actions.cancel')}
          onConfirm={resetAppConfig}
        />
      )}
      <SettingCard>
        <SettingItem compatKey="legacy"
          title={t('actions.openGuide')} divider>
          <Button size="sm" onPress={() => startTour(navigate)}>
            {t('actions.openGuide')}
          </Button>
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('actions.checkUpdate')} divider>
          <Button
            size="sm"
            isLoading={checkingUpdate}
            onPress={async () => {
              try {
                setCheckingUpdate(true)
                const version = await checkUpdate()
                if (version) {
                  setNewVersion(version.version)
                  setChangelog(version.changelog)
                  setOpenUpdate(true)
                } else {
                  new window.Notification(t('actions.latestVersion'), {
                    body: t('actions.noUpdateNeeded')
                  })
                }
              } catch (e) {
                alert(e)
              } finally {
                setCheckingUpdate(false)
              }
            }}
          >
            {t('actions.checkUpdate')}
          </Button>
        </SettingItem>
        <SettingItem
          title={t('actions.resetApp')}
          actions={
            <Tooltip content={t('actions.resetAppTip')}>
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Button size="sm" onPress={() => setConfirmOpen(true)}>
            {t('actions.resetApp')}
          </Button>
        </SettingItem>
        <SettingItem
          title={t('actions.clearCache')}
          actions={
            <Tooltip content={t('actions.clearCacheTip')}>
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Button size="sm" onPress={() => localStorage.clear()}>
            {t('actions.clearCache')}
          </Button>
        </SettingItem>
        <SettingItem
          title={t('actions.createHeapSnapshot')}
          actions={
            <Tooltip content={t('actions.createHeapSnapshotTip')}>
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Button size="sm" onPress={createHeapSnapshot}>
            {t('actions.createHeapSnapshot')}
          </Button>
        </SettingItem>
        <SettingItem
          title={t('actions.quitWithoutCore')}
          actions={
            <Tooltip content={t('actions.quitWithoutCoreTip')}>
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Button size="sm" onPress={quitWithoutCore}>
            {t('common:actions.exit')}
          </Button>
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('actions.quitApp')} divider>
          <Button size="sm" onPress={quitApp}>
            {t('actions.quitApp')}
          </Button>
        </SettingItem>
        <SettingItem compatKey="legacy"
          title={t('actions.appVersion')}>
          <div>v{version}</div>
        </SettingItem>
      </SettingCard>
    </>
  )
}

export default Actions
