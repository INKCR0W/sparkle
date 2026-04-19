import React, { useEffect, useMemo, useState } from 'react'
import { Select, SelectItem } from '@heroui/react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { getInterfaces } from '@renderer/utils/ipc'

const InterfaceSelect: React.FC<{
  value: string
  exclude?: string[]
  onChange: (iface: string) => void
}> = ({ value, onChange, exclude = [] }) => {
  const { t } = useTranslation('common')
  const [ifaces, setIfaces] = useState<string[]>([])
  const excludeKey = useMemo(() => JSON.stringify([...exclude].sort()), [exclude])
  useEffect(() => {
    const excludeSet = new Set(exclude)
    const fetchInterfaces = async (): Promise<void> => {
      try {
        const names = Object.keys(await getInterfaces())
        setIfaces(names.filter((name) => !excludeSet.has(name)))
      } catch {
        setIfaces([])
      }
    }
    fetchInterfaces()
  }, [excludeKey])

  return (
    <Select
      size="sm"
      className="w-75"
      selectedKeys={new Set([value])}
      disallowEmptySelection={true}
      onSelectionChange={(v) => onChange(v.currentKey as string)}
    >
      <SelectItem key="">{t('ui.disabled')}</SelectItem>
      <>
        {ifaces.map((name) => (
          <SelectItem key={name}>{name}</SelectItem>
        ))}
      </>
    </Select>
  )
}

export default InterfaceSelect
