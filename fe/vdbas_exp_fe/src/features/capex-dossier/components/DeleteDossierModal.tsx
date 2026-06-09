import { useState } from 'react'
import { Modal, Form, Input, Checkbox, Button } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

interface DeleteDossierModalProps {
  open:        boolean
  dossierCode: string
  onCancel:    () => void
  onConfirm:   (reason: string) => void
  loading?:    boolean
}

const DeleteDossierModal = ({ open, dossierCode, onCancel, onConfirm, loading }: DeleteDossierModalProps) => {
  const [form] = Form.useForm()
  const [reason,    setReason]    = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const canConfirm = reason.trim().length >= 10 && confirmed

  const handleConfirm = () => {
    if (canConfirm) onConfirm(reason.trim())
  }

  const handleCancel = () => {
    form.resetFields()
    setReason('')
    setConfirmed(false)
    onCancel()
  }

  return (
    <Modal
      open={open}
      title={
        <span>
          <WarningOutlined style={{ color: '#dc3545', marginRight: 8 }} />
          Xác nhận xoá hồ sơ
        </span>
      }
      onCancel={handleCancel}
      width={520}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Huỷ
        </Button>,
        <Button
          key="confirm"
          danger
          type="primary"
          disabled={!canConfirm}
          loading={loading}
          onClick={handleConfirm}
          data-testid="btn-confirm-delete"
        >
          Xác nhận xoá
        </Button>,
      ]}
    >
      <p style={{ marginBottom: 16, fontSize: 13 }}>
        Bạn đang thực hiện xoá hồ sơ <strong>{dossierCode}</strong>. Hành động này không thể hoàn tác.
      </p>

      <Form form={form} layout="vertical">
        <Form.Item
          label={
            <span>
              Lý do xoá <span style={{ color: '#dc3545' }}>*</span>
              <span style={{ fontWeight: 400, color: '#6c757d', marginLeft: 4 }}>(tối thiểu 10 ký tự)</span>
            </span>
          }
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Nhập lý do xoá hồ sơ..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            status={reason.length > 0 && reason.trim().length < 10 ? 'error' : undefined}
            data-testid="input-delete-reason"
          />
        </Form.Item>

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ fontSize: 13 }}
          data-testid="checkbox-confirm-reviewed"
        >
          Tôi đã rà soát và xác nhận xoá hồ sơ này
        </Checkbox>
      </Form>
    </Modal>
  )
}

export default DeleteDossierModal
