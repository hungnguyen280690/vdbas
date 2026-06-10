import { useState, useEffect } from 'react'
import { Input, Select, DatePicker, Button, Checkbox, Radio } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useAttributeMetadata } from '../../hooks/useMetadata'
import type { ExtAttributes, AttributeMetadata } from '@/types/index'

dayjs.locale('vi')
const { TextArea } = Input

interface DynamicExtAttributesProps {
  value?: ExtAttributes
  onChange?: (value: ExtAttributes) => void
  scope: string
  nonDeletableKeys?: string[]
}

const DynamicExtAttributes: React.FC<DynamicExtAttributesProps> = ({
  value = {},
  onChange,
  scope,
  nonDeletableKeys = [],
}) => {
  const { data: metadataList = [], isLoading } = useAttributeMetadata(scope)
  const [extAttributes, setExtAttributes] = useState<ExtAttributes>(value)

  useEffect(() => { setExtAttributes(value || {}) }, [value])

  const handleAttributeChange = (key: string, val: unknown) => {
    const newAttrs = { ...extAttributes, [key]: val !== '' ? val : undefined }
    setExtAttributes(newAttrs)
    onChange?.(newAttrs)
  }

  const handleRemoveAttribute = (key: string) => {
    const newAttrs = { ...extAttributes }
    delete newAttrs[key]
    setExtAttributes(newAttrs)
    onChange?.(newAttrs)
  }

  const handleAddAttribute = () => {
    const assigned  = Object.keys(extAttributes)
    const available = metadataList.filter((m) => !assigned.includes(m.key))
    const source = available.length ? available : null
    const key = source
      ? source[0]?.key
      : prompt('Nhập tên thuộc tính tuỳ chỉnh:')?.trim()
    if (!key || assigned.includes(key)) return
    const meta = metadataList.find((m) => m.key === key)
    handleAttributeChange(key, meta?.type === 'checkbox' ? false : '')
  }

  const renderInput = (key: string, attrValue: unknown): React.ReactNode => {
    const config: AttributeMetadata | undefined = metadataList.find((m) => m.key === key)
    if (!config) {
      return <Input value={attrValue as string} onChange={(e) => handleAttributeChange(key, e.target.value)} placeholder="Giá trị" style={{ flex: 1 }} />
    }
    switch (config.type) {
      case 'select':
      case 'listbox': {
        const isMultiple = config.multiple || config.type === 'listbox'
        return <Select mode={isMultiple ? 'multiple' : undefined} allowClear value={attrValue as string | string[]} onChange={(val) => handleAttributeChange(key, val)} placeholder={`Chọn ${config.label}`} style={{ flex: 1 }} options={config.options?.map((o) => ({ label: o.label, value: o.value }))} />
      }
      case 'radio':
        return <Radio.Group value={attrValue as string} onChange={(e) => handleAttributeChange(key, e.target.value)} style={{ flex: 1 }}>{config.options?.map((o) => <Radio key={o.value} value={o.value}>{o.label}</Radio>)}</Radio.Group>
      case 'checkbox':
        return <Checkbox checked={!!attrValue} onChange={(e) => handleAttributeChange(key, e.target.checked)}>{config.label}</Checkbox>
      case 'date':
        return <DatePicker value={attrValue ? dayjs(attrValue as string) : null} onChange={(date) => handleAttributeChange(key, date ? date.toISOString() : null)} style={{ flex: 1 }} format="DD/MM/YYYY" />
      case 'area':
        return <TextArea value={attrValue as string} onChange={(e) => handleAttributeChange(key, e.target.value)} placeholder={`Nhập ${config.label}`} autoSize={{ minRows: 1, maxRows: 4 }} style={{ flex: 1 }} />
      default:
        return <Input value={attrValue as string} onChange={(e) => handleAttributeChange(key, e.target.value)} placeholder="Giá trị" style={{ flex: 1 }} />
    }
  }

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div className="mb-2">
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddAttribute} style={{ width: '100%' }} loading={isLoading}>Thêm thuộc tính</Button>
      </div>
      {Object.keys(extAttributes).length === 0 && !isLoading && (
        <div className="text-gray-400 text-center py-2">Chưa có thuộc tính mở rộng</div>
      )}
      {Object.entries(extAttributes).map(([key, attrValue]) => (
        <div key={key} className="mb-2 flex gap-2 items-start">
          <Input value={metadataList.find((m) => m.key === key)?.label || key} disabled style={{ width: '30%', backgroundColor: '#f0f0f0', color: 'rgba(0,0,0,0.65)' }} />
          {renderInput(key, attrValue)}
          {!nonDeletableKeys.includes(key) && (
            <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveAttribute(key)} />
          )}
        </div>
      ))}
    </div>
  )
}

export default DynamicExtAttributes
