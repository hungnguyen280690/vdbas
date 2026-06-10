import { useEffect, useState } from 'react'
import { Modal, Form, Input, Button, Switch, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { CategoryGroupsHooks } from '../hooks/useAcl.js'
import DynamicExtAttributes from './common/DynamicExtAttributes.jsx'
import { CategoryGroup } from '../models/CategoryGroup.js'

/**
 * CategoryGroupFormModal — create / edit form for a category group.
 *
 * Props:
 *   open          {boolean}       Whether the modal is visible.
 *   categoryGroup {object|null}   Record to edit, or null for create mode.
 *   onClose       {Function}      Called when the user cancels.
 *   onSuccess     {Function}      Called after a successful create / update.
 */
const CategoryGroupFormModal = ({ open, categoryGroup, onClose, onSuccess }) => {
  // 1. Translation
  const { t: translate } = useTranslation()

  // 3. Local state
  const [extAttributes, setExtAttributes] = useState({})

  // 4. Form instance
  const [form] = Form.useForm()

  // 7. Mutations
  const createMutation = CategoryGroupsHooks.useCreate()
  const updateMutation = CategoryGroupsHooks.useUpdate()

  // 8. Derived
  const isEditMode = !!categoryGroup
  const isPending  = createMutation.isPending || updateMutation.isPending

  // 9. Effects — populate / reset form when modal opens
  useEffect(() => {
    if (!open) return

    if (categoryGroup) {
      // Edit mode — populate all fields from the record
      form.setFieldsValue({
        [CategoryGroup.GROUP_CODE]: categoryGroup[CategoryGroup.GROUP_CODE],
        [CategoryGroup.GROUP_NAME]: categoryGroup[CategoryGroup.GROUP_NAME],
        [CategoryGroup.IS_SYSTEM]:  categoryGroup[CategoryGroup.IS_SYSTEM],
        [CategoryGroup.IS_ACTIVE]:  categoryGroup[CategoryGroup.IS_ACTIVE],
        [CategoryGroup.DELETED]:    categoryGroup[CategoryGroup.DELETED],
      })

      // Parse extAttributes (may arrive as a JSON string or plain object)
      let initialExtAttrs = categoryGroup[CategoryGroup.EXT_ATTRIBUTES] || {}
      if (typeof initialExtAttrs === 'string') {
        try {
          initialExtAttrs = JSON.parse(initialExtAttrs)
        } catch {
          initialExtAttrs = {}
        }
      }
      setExtAttributes(initialExtAttrs)
    } else {
      // Create mode — reset to clean state, then set defaults
      form.resetFields()
      form.setFieldsValue({
        [CategoryGroup.IS_ACTIVE]: true,
        [CategoryGroup.IS_SYSTEM]: false,
        [CategoryGroup.DELETED]:   false,
      })
      setExtAttributes({})
    }
  }, [open, categoryGroup, form])

  // 10. Handlers
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        [CategoryGroup.GROUP_CODE]:     values[CategoryGroup.GROUP_CODE],
        [CategoryGroup.GROUP_NAME]:     values[CategoryGroup.GROUP_NAME],
        [CategoryGroup.IS_SYSTEM]:      values[CategoryGroup.IS_SYSTEM]  ?? false,
        [CategoryGroup.IS_ACTIVE]:      values[CategoryGroup.IS_ACTIVE]  ?? true,
        [CategoryGroup.DELETED]:        values[CategoryGroup.DELETED]    ?? false,
        [CategoryGroup.EXT_ATTRIBUTES]: Object.keys(extAttributes).length > 0
          ? JSON.stringify(extAttributes)
          : null,
      }

      if (isEditMode) {
        await updateMutation.mutateAsync({
          [CategoryGroup.GROUP_CODE]: categoryGroup[CategoryGroup.GROUP_CODE],
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }

      onSuccess()
    } catch (error) {
      if (error.errorFields) return          // AntD validation — inline messages already shown
      if (error._handled)    return          // Interceptor already showed a notification
      message.error(
        error.message ||
        (isEditMode ? translate('common.update_fail') : translate('common.create_fail'))
      )
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setExtAttributes({})
    onClose()
  }

  // 12. Render
  return (
    <Modal
      open={open}
      title={
        isEditMode
          ? translate('categoryGroup.edit_title')
          : translate('categoryGroup.create_title')
      }
      onCancel={handleCancel}
      maskClosable={false}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={isPending}>
          {translate('common.cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={isPending} onClick={handleSubmit}>
          {translate('common.save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* Group Code */}
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
          <Input
            placeholder={translate('categoryGroup.placeholder_code')}
            disabled={isEditMode}
          />
        </Form.Item>

        {/* Group Name */}
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

        {/* Extended attributes */}
        <Form.Item label={translate('categoryGroup.ext_attributes')}>
          <DynamicExtAttributes
            value={extAttributes}
            onChange={setExtAttributes}
            scope="CATEGORY_GROUP"
          />
        </Form.Item>

        {/* Boolean flags row */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name={CategoryGroup.IS_SYSTEM}
            label={translate('categoryGroup.is_system')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={translate('common.yes')}
              unCheckedChildren={translate('common.no')}
              disabled={isEditMode && categoryGroup?.[CategoryGroup.IS_SYSTEM]}
            />
          </Form.Item>

          <Form.Item
            name={CategoryGroup.IS_ACTIVE}
            label={translate('categoryGroup.is_active')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={translate('common.active')}
              unCheckedChildren={translate('common.inactive')}
            />
          </Form.Item>
        </div>

        {/* Deleted flag — only shown in edit mode */}
        {isEditMode && (
          <Form.Item
            name={CategoryGroup.DELETED}
            label={translate('common.deleted')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={translate('common.yes')}
              unCheckedChildren={translate('common.no')}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default CategoryGroupFormModal
