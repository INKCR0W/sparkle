import React, { useEffect, useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider
} from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import {
  checkCorePermission,
  checkElevateTask,
  manualGrantCorePermition,
  revokeCorePermission
} from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'

interface Props {
  onChange: (open: boolean) => void
  onRevoke: () => Promise<void>
  onGrant: () => Promise<void>
}

const PermissionModal: React.FC<Props> = (props) => {
  const { onChange, onRevoke, onGrant } = props
  const { t } = useTranslation('mihomo')
  const tCommon = (key: string) => t(`common:${key}`)
  const { appConfig: { disableAnimation = false } = {} } = useAppConfig()
  const [loading, setLoading] = useState<{ mihomo?: boolean; 'mihomo-alpha'?: boolean }>({})
  const [hasPermission, setHasPermission] = useState<
    { mihomo: boolean; 'mihomo-alpha': boolean } | boolean | null
  >(null)
  const isWindows = platform === 'win32'

  const checkPermissions = async (): Promise<void> => {
    try {
      const result = isWindows ? await checkElevateTask() : await checkCorePermission()
      setHasPermission(result)
    } catch {
      setHasPermission(isWindows ? false : { mihomo: false, 'mihomo-alpha': false })
    }
  }

  useEffect(() => {
    checkPermissions()
  }, [])

  const handleAction = async (action: () => Promise<void>): Promise<void> => {
    setLoading({ mihomo: true, 'mihomo-alpha': true })
    try {
      await action()
      onChange(false)
    } catch (e) {
      const errorMsg = String(e)
      if (
        errorMsg.includes(tCommon('errors.userCancelled')) ||
        errorMsg.includes('UserCancelledError')
      ) {
        await checkPermissions()
        return
      }
      alert(e)
    } finally {
      setLoading({})
    }
  }

  const handleCoreAction = async (
    coreName: 'mihomo' | 'mihomo-alpha',
    isGrant: boolean
  ): Promise<void> => {
    setLoading({ ...loading, [coreName]: true })
    try {
      if (isGrant) {
        await manualGrantCorePermition([coreName])
      } else {
        await revokeCorePermission([coreName])
      }
      await checkPermissions()
    } catch (e) {
      const errorMsg = String(e)
      if (
        errorMsg.includes(tCommon('errors.userCancelled')) ||
        errorMsg.includes('UserCancelledError')
      ) {
        await checkPermissions()
        return
      }
      alert(e)
    } finally {
      setLoading({ ...loading, [coreName]: false })
    }
  }

  const getStatusText = (coreName: 'mihomo' | 'mihomo-alpha'): string => {
    if (hasPermission === null) return t('permission.checking')
    if (typeof hasPermission === 'boolean')
      return hasPermission ? t('permission.authorized') : t('permission.unauthorized')
    return hasPermission[coreName] ? t('permission.authorized') : t('permission.unauthorized')
  }

  const getStatusColor = (coreName: 'mihomo' | 'mihomo-alpha'): string => {
    if (hasPermission === null) return 'bg-default-400 animate-pulse'
    if (typeof hasPermission === 'boolean') {
      return hasPermission ? 'bg-success' : 'bg-warning'
    }
    return hasPermission[coreName] ? 'bg-success' : 'bg-warning'
  }

  return (
    <Modal
      backdrop={disableAnimation ? 'transparent' : 'blur'}
      disableAnimation={disableAnimation}
      hideCloseButton
      isOpen={true}
      size="5xl"
      onOpenChange={onChange}
      scrollBehavior="inside"
      classNames={{
        base: 'max-w-none w-full',
        backdrop: 'top-[48px]'
      }}
    >
      <ModalContent className="w-112.5">
        <ModalHeader className="flex flex-col gap-1">
          {isWindows ? t('permission.taskScheduleManagement') : t('permission.coreAuthManagement')}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {isWindows ? (
              <>
                <Card
                  shadow="sm"
                  className="border-none bg-linear-to-br from-default-50 to-default-100"
                >
                  <CardBody className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t('permission.taskStatus')}</span>
                      </div>
                      <Chip
                        color={
                          typeof hasPermission === 'boolean'
                            ? hasPermission
                              ? 'success'
                              : 'warning'
                            : 'default'
                        }
                        variant="flat"
                        size="sm"
                      >
                        {hasPermission === null
                          ? t('permission.checking') + '...'
                          : typeof hasPermission === 'boolean'
                            ? hasPermission
                              ? t('permission.registered')
                              : t('permission.unregistered')
                            : t('permission.unknown')}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                <Divider />

                <div className="text-xs text-default-500 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{t('permission.taskDesc1')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{t('permission.taskDesc2')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{t('permission.taskDesc3')}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Card shadow="sm" className="border-none">
                    <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-medium">{t('coreType.builtin')}</h4>
                        </div>
                        <Chip
                          color={getStatusColor('mihomo') === 'bg-success' ? 'success' : 'warning'}
                          variant="flat"
                          size="sm"
                        >
                          {getStatusText('mihomo')}
                        </Chip>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-3 px-4 pb-4">
                      {typeof hasPermission !== 'boolean' && hasPermission?.mihomo ? (
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          onPress={() => handleCoreAction('mihomo', false)}
                          isLoading={loading.mihomo}
                          fullWidth
                        >
                          {t('permission.revoke')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="primary"
                          variant="shadow"
                          onPress={() => handleCoreAction('mihomo', true)}
                          isLoading={loading.mihomo}
                          fullWidth
                        >
                          {t('permission.grant')}
                        </Button>
                      )}
                    </CardBody>
                  </Card>

                  <Card shadow="sm" className="border-none">
                    <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-medium">
                            {t('coreType.builtinAlpha')}
                          </h4>
                        </div>
                        <Chip
                          color={
                            getStatusColor('mihomo-alpha') === 'bg-success' ? 'success' : 'warning'
                          }
                          variant="flat"
                          size="sm"
                        >
                          {getStatusText('mihomo-alpha')}
                        </Chip>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-3 px-4 pb-4">
                      {typeof hasPermission !== 'boolean' && hasPermission?.['mihomo-alpha'] ? (
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          onPress={() => handleCoreAction('mihomo-alpha', false)}
                          isLoading={loading['mihomo-alpha']}
                          fullWidth
                        >
                          {t('permission.revoke')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="primary"
                          variant="shadow"
                          onPress={() => handleCoreAction('mihomo-alpha', true)}
                          isLoading={loading['mihomo-alpha']}
                          fullWidth
                        >
                          {t('permission.grant')}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                </div>

                <div className="text-xs text-default-500 space-y-2">
                  <div className="flex items-start gap-2">
                    <span>{t('permission.authDesc1')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>{t('permission.authDesc2')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="space-x-2">
          <Button
            size="sm"
            variant="light"
            onPress={() => onChange(false)}
            isDisabled={Object.values(loading).some((v) => v)}
          >
            {t('common:actions.close')}
          </Button>
          {isWindows &&
            (() => {
              const hasAnyPermission = typeof hasPermission === 'boolean' ? hasPermission : false
              const isLoading = Object.values(loading).some((v) => v)

              return hasAnyPermission ? (
                <Button
                  size="sm"
                  color="warning"
                  onPress={() => handleAction(onRevoke)}
                  isLoading={isLoading}
                >
                  {t('permission.unregister')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => handleAction(onGrant)}
                  isLoading={isLoading}
                >
                  {t('permission.register')}
                </Button>
              )
            })()}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PermissionModal
