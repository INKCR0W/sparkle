import { cn, Button, Input, Switch, Tooltip } from '@heroui/react'
import { Dropdown, Label, Modal, Separator, Surface } from '@heroui-v3/react'
import type { ReactNode } from 'react'
import React, { useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useOverrideConfig } from '@renderer/hooks/use-override-config'
import { restartCore } from '@renderer/utils/ipc'
import { MdDeleteForever } from 'react-icons/md'
import { FaPlus } from 'react-icons/fa6'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { IoIosHelpCircle } from 'react-icons/io'

interface Props {
  item: ProfileItem
  isCurrent: boolean
  updateProfileItem: (item: ProfileItem) => Promise<void>
  onClose: () => void
}

const EditInfoModal: React.FC<Props> = (props) => {
  const { item, isCurrent, updateProfileItem, onClose } = props
  const { t } = useTranslation('profile')
  useAppConfig()
  const { overrideConfig } = useOverrideConfig()
  const { items: overrideItems = [] } = overrideConfig || {}
  const [values, setValues] = useState({ ...item, autoUpdate: item.autoUpdate ?? true })
  const fieldWidth = 'w-full'

  const onSave = async (): Promise<void> => {
    try {
      const itemToSave = {
        ...values,
        override: values.override?.filter(
          (i) =>
            overrideItems.find((t) => t.id === i) && !overrideItems.find((t) => t.id === i)?.global
        )
      }

      await updateProfileItem(itemToSave)
      if (item.id && isCurrent) {
        await restartCore()
      }
      onClose()
    } catch (e) {
      alert(e)
    }
  }

  const renderField = (
    title: string,
    content: ReactNode,
    options?: {
      actions?: ReactNode
      align?: 'start' | 'center'
      divider?: boolean
    }
  ) => {
    const { actions, align = 'center', divider = true } = options || {}

    return (
      <Surface key={title} variant="transparent" className="flex flex-col">
        <Surface
          variant="transparent"
          className={cn(
            'grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 py-2',
            align === 'start' ? 'items-start' : 'items-center'
          )}
        >
          <Surface variant="transparent" className="flex min-h-9 items-center gap-2">
            <Label className="text-sm leading-6 text-foreground-500">{title}</Label>
            {actions}
          </Surface>
          <Surface variant="transparent" className="flex min-w-0 justify-end">
            {content}
          </Surface>
        </Surface>
        {divider ? <Separator variant="tertiary" className="bg-default-100/70" /> : null}
      </Surface>
    )
  }

  const overrideContent = (
    <Surface variant="secondary" className="flex flex-col gap-2 rounded-2xl p-3">
      {overrideItems
        .filter((i) => i.global)
        .map((i) => {
          return (
            <Button
              key={i.id}
              disabled
              fullWidth
              variant="flat"
              size="sm"
              className="justify-start"
            >
              {i.name} ({t('override:global')})
            </Button>
          )
        })}
      {values.override?.map((i) => {
        if (!overrideItems.find((t) => t.id === i)) return null
        if (overrideItems.find((t) => t.id === i)?.global) return null

        return (
          <Surface key={i} variant="transparent" className="flex items-center gap-2">
            <Button disabled fullWidth variant="flat" size="sm" className="justify-start">
              {overrideItems.find((t) => t.id === i)?.name}
            </Button>
            <Button
              color="warning"
              variant="flat"
              size="sm"
              onPress={() => {
                setValues({
                  ...values,
                  override: values.override?.filter((t) => t !== i)
                })
              }}
            >
              <MdDeleteForever className="text-lg" />
            </Button>
          </Surface>
        )
      })}
      <Dropdown>
        <Dropdown.Trigger>
          <Button fullWidth size="sm" variant="flat" color="default">
            <FaPlus />
          </Button>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu
            onAction={(key) => {
              setValues({
                ...values,
                override: Array.from(values.override || []).concat(key.toString())
              })
            }}
          >
            {overrideItems.filter((i) => !values.override?.includes(i.id) && !i.global).length >
            0 ? (
              overrideItems
                .filter((i) => !values.override?.includes(i.id) && !i.global)
                .map((i) => (
                  <Dropdown.Item id={i.id} key={i.id} textValue={i.name}>
                    <Label>{i.name}</Label>
                  </Dropdown.Item>
                ))
            ) : (
              <Dropdown.Item id="empty" key="empty" textValue={t('noAvailableOverride')} isDisabled>
                <Label>{t('noAvailableOverride')}</Label>
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Surface>
  )

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={true}
        onOpenChange={onClose}
        variant="blur"
        className="top-12 h-[calc(100%-48px)]"
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="w-[min(500px,calc(100%-24px))] max-w-none">
            <Modal.Header className="app-drag pb-1">
              <Modal.Heading>{item.id ? t('editInfo') : t('importRemote')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="no-scrollbar max-h-[70vh] overflow-y-auto pt-1 pb-2">
              <Surface variant="transparent" className="flex flex-col">
                {renderField(
                  t('name'),
                  <Input
                    size="sm"
                    className={cn(fieldWidth)}
                    value={values.name}
                    onValueChange={(v) => {
                      setValues({ ...values, name: v })
                    }}
                  />
                )}
                {values.type === 'remote' &&
                  renderField(
                    t('url'),
                    <Input
                      size="sm"
                      className={cn(fieldWidth)}
                      value={values.url}
                      onValueChange={(v) => {
                        setValues({ ...values, url: v })
                      }}
                    />,
                    { align: 'start' }
                  )}
                {values.type === 'remote' &&
                  renderField(
                    t('fingerprint'),
                    <Input
                      size="sm"
                      className={cn(fieldWidth)}
                      value={values.fingerprint ?? ''}
                      onValueChange={(v) => {
                        setValues({ ...values, fingerprint: v.trim() || undefined })
                      }}
                    />
                  )}
                {values.type === 'remote' &&
                  renderField(
                    t('userAgent'),
                    <Input
                      size="sm"
                      className={cn(fieldWidth)}
                      value={values.ua ?? ''}
                      onValueChange={(v) => {
                        setValues({ ...values, ua: v.trim() || undefined })
                      }}
                    />
                  )}
                {values.type === 'remote' &&
                  renderField(
                    t('verifyFormat'),
                    <Switch
                      size="sm"
                      isSelected={values.verify ?? false}
                      onValueChange={(v) => {
                        setValues({ ...values, verify: v })
                      }}
                    />
                  )}
                {values.type === 'remote' &&
                  renderField(
                    t('useProxy'),
                    <Switch
                      size="sm"
                      isSelected={values.useProxy ?? false}
                      onValueChange={(v) => {
                        setValues({ ...values, useProxy: v })
                      }}
                    />
                  )}
                {values.type === 'remote' &&
                  renderField(
                    t('autoUpdate'),
                    <Switch
                      size="sm"
                      isSelected={values.autoUpdate ?? false}
                      onValueChange={(v) => {
                        setValues({ ...values, autoUpdate: v })
                      }}
                    />
                  )}
                {values.type === 'remote' &&
                  values.autoUpdate &&
                  renderField(
                    t('updateInterval'),
                    <Input
                      size="sm"
                      type="number"
                      className={cn(fieldWidth)}
                      value={values.interval?.toString() ?? ''}
                      onValueChange={(v) => {
                        setValues({ ...values, interval: parseInt(v) })
                      }}
                      isDisabled={values.locked}
                    />,
                    {
                      actions: values.locked ? (
                        <Tooltip content={t('intervalLockedTip')}>
                          <Button isIconOnly size="sm" variant="light">
                            <IoIosHelpCircle className="text-lg" />
                          </Button>
                        </Tooltip>
                      ) : undefined
                    }
                  )}
                {renderField(t('override:title'), overrideContent, { align: 'start', divider: false })}
              </Surface>
            </Modal.Body>
            <Modal.Footer className="justify-end pt-2">
              <Button size="sm" variant="light" onPress={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button size="sm" color="primary" onPress={onSave}>
                {item.id ? t('common:actions.save') : t('common:actions.import')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default EditInfoModal
