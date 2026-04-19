import { Button, Label, Link, Modal, ProgressBar } from '@heroui-v3/react'
import ReactMarkdown from 'react-markdown'
import React, { useState } from 'react'
import { downloadAndInstallUpdate } from '@renderer/utils/ipc'
import { FiX, FiDownload } from 'react-icons/fi'
import { useTranslation } from '@renderer/hooks/useTranslation'

interface Props {
  version: string
  changelog: string
  updateStatus?: {
    downloading: boolean
    progress: number
    error?: string
  }
  onCancel?: () => void
  onClose: () => void
}

const UpdaterModal: React.FC<Props> = (props) => {
  const { t } = useTranslation('updater')
  const { version, changelog, updateStatus, onCancel, onClose } = props
  const [downloading, setDownloading] = useState(false)

  const onUpdate = async (): Promise<void> => {
    try {
      setDownloading(true)
      await downloadAndInstallUpdate(version)
    } catch (e) {
      alert(e)
      setDownloading(false)
    }
  }

  const handleCancel = (): void => {
    if (updateStatus?.downloading && onCancel) {
      setDownloading(false)
      onCancel()
    } else {
      onClose()
    }
  }

  const isDownloading = updateStatus?.downloading || downloading
  const releaseUrl = version.includes('beta')
    ? 'https://github.com/INKCR0W/sparkle/releases/tag/pre-release'
    : `https://github.com/INKCR0W/sparkle/releases/tag/${version}`

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={onClose}
        variant="blur"
        isDismissable={!isDownloading}
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <div className="flex items-center gap-2">
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <FiDownload className="size-5" />
                </Modal.Icon>
                <Modal.Heading>
                  {version} {t('versionReady')}
                </Modal.Heading>
              </div>
              {!isDownloading && (
                <Link className="app-nodrag" href={releaseUrl} target="_blank" rel="noreferrer">
                  {t('goToDownload')}
                </Link>
              )}
            </Modal.Header>
            <Modal.Body className="h-full">
              {updateStatus?.downloading && (
                <div className="mb-4 space-y-3">
                  <ProgressBar
                    aria-label={t('downloadProgress')}
                    color="accent"
                    size="sm"
                    value={updateStatus.progress}
                  >
                    <Label>{t('downloadProgress')}</Label>
                    <ProgressBar.Output />
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  {updateStatus.error && (
                    <div className="text-sm text-danger">{updateStatus.error}</div>
                  )}
                </div>
              )}
              {!updateStatus?.downloading && (
                <div className="markdown-body select-text">
                  <ReactMarkdown
                    components={{
                      a: ({ ...markdownProps }) => (
                        <Link href={markdownProps.href} target="_blank" rel="noreferrer">
                          {markdownProps.children}
                        </Link>
                      ),
                      code: ({ children }) => (
                        <code className="rounded-md bg-default px-1.5 py-0.5 text-sm">
                          {children}
                        </code>
                      ),
                      h3: ({ ...markdownProps }) => (
                        <h3 className="text-lg font-bold" {...markdownProps} />
                      ),
                      li: ({ children }) => <li className="list-disc list-inside">{children}</li>
                    }}
                  >
                    {changelog}
                  </ReactMarkdown>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="pt-0 pb-0">
              <Button
                size="sm"
                className="h-7 min-w-0 px-3 text-sm leading-none"
                variant="secondary"
                onPress={handleCancel}
              >
                {updateStatus?.downloading ? (
                  <>
                    <FiX />
                    {t('cancelDownload')}
                  </>
                ) : (
                  t('common:actions.cancel')
                )}
              </Button>
              {!updateStatus?.downloading && (
                <Button
                  size="sm"
                  className="h-7 min-w-0 px-3 text-sm leading-none"
                  isPending={downloading}
                  onPress={onUpdate}
                >
                  <FiDownload />
                  {t('updateNow')}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default UpdaterModal
