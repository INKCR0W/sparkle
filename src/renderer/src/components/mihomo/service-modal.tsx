import React, { useEffect, useState, useCallback } from 'react'
import { Button, Spinner, Card, CardBody, Chip, Divider } from '@heroui/react'
import { Modal } from '@heroui-v3/react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { serviceStatus, testServiceConnection } from '@renderer/utils/ipc'

interface Props {
  onChange: (open: boolean) => void
  onInit: () => Promise<void>
  onInstall: () => Promise<void>
  onUninstall: () => Promise<void>
  onStart: () => Promise<void>
  onRestart: () => Promise<void>
  onStop: () => Promise<void>
}

type ServiceStatusType = 'running' | 'stopped' | 'not-installed' | 'unknown' | 'need-init'
type ConnectionStatusType = 'connected' | 'disconnected' | 'checking' | 'unknown'

const ServiceModal: React.FC<Props> = (props) => {
  const { onChange, onInit, onInstall, onUninstall, onStart, onStop, onRestart } = props
  const { t } = useTranslation('mihomo')
  const tCommon = (key: string) => t(`common:${key}`)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ServiceStatusType | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('checking')

  const checkServiceConnection = useCallback(async (): Promise<void> => {
    if (status === 'running') {
      try {
        setConnectionStatus('checking')
        const connected = await testServiceConnection()
        setConnectionStatus(connected ? 'connected' : 'disconnected')
      } catch {
        setConnectionStatus('disconnected')
      }
    } else {
      setConnectionStatus('disconnected')
    }
  }, [status])

  useEffect(() => {
    const checkStatus = async (): Promise<void> => {
      try {
        const result = await serviceStatus()
        setStatus(result)
      } catch {
        setStatus('not-installed')
      }
    }
    checkStatus()
  }, [])

  useEffect(() => {
    checkServiceConnection()
  }, [status, checkServiceConnection])

  const handleAction = async (
    action: () => Promise<void>,
    isStartAction = false
  ): Promise<void> => {
    setLoading(true)
    try {
      await action()

      await new Promise((resolve) => setTimeout(resolve, 500))

      let result = await serviceStatus()

      if (isStartAction) {
        let retries = 5
        while (retries > 0 && result === 'stopped') {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          result = await serviceStatus()
          retries--
        }
      }

      setStatus(result)
      await checkServiceConnection()
    } catch (e) {
      const errorMsg = String(e)
      if (
        errorMsg.includes(tCommon('errors.userCancelled')) ||
        errorMsg.includes('UserCancelledError')
      ) {
        const result = await serviceStatus()
        setStatus(result)
        await checkServiceConnection()
        return
      }
      alert(e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (): string => {
    if (status === null) return t('service.statusChecking')
    switch (status) {
      case 'running':
        return t('service.statusRunning')
      case 'stopped':
        return t('service.statusStopped')
      case 'not-installed':
        return t('service.statusNotInstalled')
      case 'need-init':
        return t('service.statusNeedInit')
      default:
        return t('service.statusUnknown')
    }
  }

  const getConnectionStatusText = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return t('service.connStatusConnected')
      case 'disconnected':
        return t('service.connStatusDisconnected')
      case 'checking':
        return t('service.connStatusChecking')
      default:
        return t('service.connStatusUnknown')
    }
  }

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={onChange}
        variant="blur"
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="w-112.5">
            <Modal.Header className="flex-col gap-1">
              <Modal.Heading>{t('service.modalTitle')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <Card
                  shadow="sm"
                  className="border-none bg-linear-to-br from-default-50 to-default-100"
                >
                  <CardBody className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t('service.serviceStatus')}</span>
                      </div>
                      {status === null ? (
                        <Chip
                          color="default"
                          variant="flat"
                          size="sm"
                          startContent={<Spinner size="sm" color="current" />}
                        >
                          {t('service.statusChecking')}...
                        </Chip>
                      ) : (
                        <Chip
                          color={
                            status === 'running'
                              ? 'success'
                              : status === 'stopped'
                                ? 'warning'
                                : status === 'not-installed'
                                  ? 'danger'
                                  : status === 'need-init'
                                    ? 'warning'
                                    : 'default'
                          }
                          variant="flat"
                          size="sm"
                        >
                          {getStatusText()}
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t('service.connectionStatus')}</span>
                      </div>
                      {connectionStatus === 'checking' ? (
                        <Chip
                          color="default"
                          variant="flat"
                          size="sm"
                          startContent={<Spinner size="sm" color="current" />}
                        >
                          {t('service.connStatusChecking')}...
                        </Chip>
                      ) : (
                        <Chip
                          color={
                            connectionStatus === 'connected'
                              ? 'success'
                              : connectionStatus === 'disconnected'
                                ? 'danger'
                                : 'default'
                          }
                          variant="flat"
                          size="sm"
                        >
                          {getConnectionStatusText()}
                        </Chip>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Divider />

                <div className="text-xs text-default-500 space-y-2">
                  <div className="flex items-start gap-2">
                    <span>{t('service.description1')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>{t('service.description2')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>{t('service.description3')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>{t('service.description4')}</span>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                variant="light"
                onPress={() => onChange(false)}
                isDisabled={loading}
                className="sm:mr-auto"
              >
                {t('common:actions.close')}
              </Button>

              {status === 'unknown' ? null : status === 'not-installed' ? (
                <Button
                  size="sm"
                  color="primary"
                  variant="shadow"
                  onPress={() => handleAction(onInstall)}
                  isLoading={loading}
                >
                  {t('service.install')}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => handleAction(onInit)}
                    isLoading={loading}
                  >
                    {t('service.init')}
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => handleAction(onRestart)}
                    isLoading={loading}
                  >
                    {t('service.restart')}
                  </Button>
                  {status === 'running' || status === 'need-init' ? (
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      onPress={() => handleAction(onStop)}
                      isLoading={loading}
                    >
                      {t('service.stop')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      color="success"
                      variant="shadow"
                      onPress={() => handleAction(onStart, true)}
                      isLoading={loading}
                    >
                      {t('service.start')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => handleAction(onUninstall)}
                    isLoading={loading}
                  >
                    {t('service.uninstall')}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default ServiceModal
