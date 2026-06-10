import { useEffect, useState } from 'react'
import { Modal, Form, Input, Button, Switch, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { CategoryGroupsHooks } from '../hooks/useAcl'
import DynamicExtAttributes from './common/DynamicExtAttributes'
import { CategoryGroup } from '../models/CategoryGroup'
import type { CategoryGroupRecord, ExtAttributes } from '@/types/index'

interface CategoryGroupFormModalProps {
  open: boolean
  categoryGroup: CategoryGroupRecord | null
  onClose: () => void
  onSuccess: () => void
}

const CategoryGroupFormModal: React.FC<CategoryGroupFormModalProps> = ({
  open, categoryGroup, onClose, onSuccess,
}) => {
  const { t: translate } = useTranslation()
  const [extAttributes, setExtAttributes] = useState<ExtAttributes>({})
  const [form] = Form.useForm()
  const createMutation = CategoryGroupsHooks.useCreate()
  const updateMutation = CategoryGroupsHooks.useUpdate()
  const isEditMode = !!categoryGroup
  const isPending  = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    if (categoryGroup) {
      form.setFieldsValue({
        [CategoryGroup.GROUP_CODE]: categoryGroup[CategoryGroup.GROUP_CODE],
        [CategoryGroup.GROUP_NAME]: categoryGroup[CategoryGroup.GROUP_NAME],
        [CategoryGroup.IS_SYSTEM]:  categoryGroup[CategoryGroup.IS_SYSTEM],
        [CategoryGroup.IS_ACTIVE]:  categoryGroup[CategoryGroup.IS_ACTIVE],
        [CategoryGroup.DELETED]:    categoryGroup[CategoryGroup.DELETED],
      })
      let initialExtAttrs: ExtAttributes = (categoryGroup[CategoryGroup.EXT_ATTRIBUTES] as ExtAttributes) || {}
      if (typeof initialExtAttrs === 'string') {
        try { initialExtAttrs = JSON.parse(initialExtAttrs) as ExtAttributes } catch { initialExtAttrs = {} }
      }
      setExtAttributes(initialExtAttrs)
    } else {
      form.resetFields()
      form.setFieldsValue({
        [CategoryGroup.IS_ACTIVE]: true,
        [CategoryGroup.IS_SYSTEM]: false,
        [CategoryGroup.DELETED]:   false,
      })
      setExtAttributes({})
    }
  }, [open, categoryGroup, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        [CategoryGroup.GROUP_CODE]:     values[CategoryGroup.GROUP_CODE] as string,
        [CategoryGroup.GROUP_NAME]:     values[CategoryGroup.GROUP_NAME] as string,
        [CategoryGroup.IS_SYSTEM]:      (values[CategoryGroup.IS_SYSTEM] as boolean)  ?? false,
        [CategoryGroup.IS_ACTIVE]:      (values[CategoryGroup.IS_ACTIVE] as boolean)  ?? true,
        [CategoryGroup.DELETED]:        (values[CategoryGroup.DELETED] as boolean)    ?? false,
        [CategoryGroup.EXT_ATTRIBUTES]: Object.keys(extAttributes).length > 0
          ? JSON.stringify(extAttributes)
          : null,
      }
      if (isEditMode) {
        await updateMutation.mutateAsync({
          groupCode: categoryGroup![CategoryGroup.GROUP_CODE] as string,
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess()
    } catch (error) {
      const err = error as { errorFields?: unknown; _handled?: boolean; message?: string }
      if (err.errorFields || err._handled) return
      message.error(err.message || (isEditMode ? translate('common.update_fail') : translate('common.create_fail')))
    }
  }

  const handleCancel = () => { form.resetFields(); setExtAttributes({}); onClose() }

  return (
    <Modal
      open={open}
      title={isEditMode ? translate('categoryGroup.edit_title') : translate('categoryGroup.create_title')}
      onCancel={handleCancel}
      maskClosable={false}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={isPending}>{translate('common.cancel')}</Button>,
        <Button key="submit" type="primary" loading={isPending} onClick={handleSubmit}>{translate('common.save')}</Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name={CategoryGroup.GROUP_CODE}
          label={translate('categoryGroup.group_code')}
          rules={[
            { required: true, message: translate('common.required_field') },
            { pattern: /^[A-Z0-9_]+$/, message: translate('common.invalid_format') },
            { min: 3, message: translate('common.min_2_char_warning') },
            { max: 50, message: translate('common.max_length', { max: 50 }) },
          ]}
        >
          <Input placeholder={translate('categoryGroup.placeholder_code')} disabled={isEditMode} />
        </Form.Item>
        <Form.Item
          name={CategoryGroup.GROUP_NAME}
          label={translate('categoryGroup.group_name')}
          rules={[
            { required: true, message: translate('common.required_field') },
            { min: 3, message: translate('common.min_2_char_warning') },
            { max: 255, message: translate('common.max_length', { max: 255 }) },
          ]}
        >
          <Input placeholder={translate('categoryGroup.placeholder_name')} />
        </Form.Item>
        <Form.Item label={translate('categoryGroup.ext_attributes')}>
          <DynamicExtAttributes value={extAttributes} onChange={setExtAttributes} scope="CATEGORY_GROUP" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name={CategoryGroup.IS_SYSTEM} label={translate('categoryGroup.is_system')} valuePropName="checked">
            <Switch
              checkedChildren={translate('common.yes')}
              unCheckedChildren={translate('common.no')}
              disabled={isEditMode && !!(categoryGroup?.[CategoryGroup.IS_SYSTEM])}
            />
          </Form.Item>
          <Form.Item name={CategoryGroup.IS_ACTIVE} label={translate('categoryGroup.is_active')} valuePropName="checked">
            <Switch checkedChildren={translate('common.active')} unCheckedChildren={translate('common.inactive')} />
          </Form.Item>
        </div>
        {isEditMode && (
          <Form.Item name={CategoryGroup.DELETED} label={translate('common.deleted')} valuePropName="checked">
            <Switch checkedChildren={translate('common.yes')} unCheckedChildren={translate('common.no')} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default CategoryGroupFormModal
