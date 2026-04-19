import { Button, Switch } from '@heroui/react'
import { Modal } from '@heroui-v3/react'
import React, { useEffect, useState } from 'react'
import { BaseEditor } from '../base/base-editor-lazy'
import { getOverride, restartCore, setOverride } from '@renderer/utils/ipc'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import ConfirmModal from '../base/base-confirm'

interface Props {
  id: string
  language: 'javascript' | 'yaml'
  onClose: () => void
}

const EditFileModal: React.FC<Props> = (props) => {
  const { id, language, onClose } = props
  const { t } = useTranslation('override')
  useAppConfig()
  const [currData, setCurrData] = useState('')
  const [originalData, setOriginalData] = useState('')
  const [isDiff, setIsDiff] = useState(false)
  const [sideBySide, setSideBySide] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const isModified = currData !== originalData

  const handleClose = (): void => {
    if (isModified) {
      setIsConfirmOpen(true)
    } else {
      onClose()
    }
  }

  const getContent = async (): Promise<void> => {
    const data = await getOverride(id, language === 'javascript' ? 'js' : 'yaml')
    setCurrData(data)
    setOriginalData(data)
  }

  useEffect(() => {
    getContent()
  }, [])

  return (
    <Modal>
      {isConfirmOpen && (
        <ConfirmModal
          title={t('confirmCancel')}
          description={t('unsavedChanges')}
          confirmText={t('discardChanges')}
          cancelText={t('continueEditing')}
          onChange={setIsConfirmOpen}
          onConfirm={onClose}
        />
      )}
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={handleClose}
        variant="blur"
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="mt-4 h-[calc(100%-32px)] max-w-none w-[calc(100%-100px)]">
            <Modal.Header className="app-drag pb-0">
              <Modal.Heading>
                {t('editOverride')}
                {language === 'javascript' ? t('script') : t('config')}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="h-full">
              <BaseEditor
                language={language}
                value={currData}
                originalValue={isDiff ? originalData : undefined}
                onChange={(value) => setCurrData(value)}
                diffRenderSideBySide={sideBySide}
              />
            </Modal.Body>
            <Modal.Footer className="flex justify-between pt-0 pb-0">
              <div className="flex items-center space-x-2">
                <Switch size="sm" isSelected={isDiff} onValueChange={setIsDiff}>
                  {t('showChanges')}
                </Switch>
                <Switch size="sm" isSelected={sideBySide} onValueChange={setSideBySide}>
                  {t('sideBySide')}
                </Switch>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="light" onPress={handleClose}>
                  {t('common:actions.cancel')}
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={async () => {
                    try {
                      await setOverride(id, language === 'javascript' ? 'js' : 'yaml', currData)
                      await restartCore()
                      onClose()
                    } catch (e) {
                      alert(e)
                    }
                  }}
                >
                  {t('common:actions.save')}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default EditFileModal
