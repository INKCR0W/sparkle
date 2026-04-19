import { Button, Modal } from '@heroui-v3/react'
import { BaseEditor } from '@renderer/components/base/base-editor-lazy'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import React, { useState } from 'react'
interface Props {
  script: string
  onCancel: () => void
  onConfirm: (script: string) => void
}
const PacEditorModal: React.FC<Props> = (props) => {
  const { t } = useTranslation('sysproxy')
  const { script, onCancel, onConfirm } = props
  useAppConfig()
  const [currData, setCurrData] = useState(script)

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={onCancel}
        variant="blur"
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="mt-4 h-[calc(100%-32px)] max-w-none w-[calc(100%-100px)]">
            <Modal.Header className="app-drag pb-0">
              <Modal.Heading>{t('editPac')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="h-full">
              <BaseEditor
                language="javascript"
                value={currData}
                onChange={(value) => setCurrData(value || '')}
              />
            </Modal.Body>
            <Modal.Footer className="pt-0 pb-0">
              <Button size="sm" variant="secondary" onPress={onCancel}>
                {t('common:actions.cancel')}
              </Button>
              <Button size="sm" onPress={() => onConfirm(currData)}>
                {t('common:actions.confirm')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default PacEditorModal
