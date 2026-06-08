import { useState, useEffect, useMemo } from 'react'
import {
  Button, Form, Input, Select, DatePicker, Tabs, Table, Tag, Space,
  Upload, message, Steps, Tooltip, Row, Col,
} from 'antd'
import {
  ArrowLeftOutlined, PrinterOutlined, EditOutlined, DeleteOutlined,
  SaveOutlined, SendOutlined, UploadOutlined, SearchOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCapexDossier } from '../hooks/useCapexDossier'
import DeleteDossierModal from '../components/DeleteDossierModal'
import { CapexDossier, STATE_LABELS, STATE_TAG_COLOR, type StateCode } from '../models/CapexDossier'

type PageMode = 'new' | 'view' | 'edit'

interface CapexDossierDetailPageProps {
  recordId: string | null
  mode:     PageMode
  onBack:   () => void
  onEdit?:  (id: string) => void
}

const CapexDossierDetailPage = ({ recordId, mode, onBack, onEdit }: CapexDossierDetailPageProps) => {
  const [form] = Form.useForm()
  const [activeTab,     setActiveTab]     = useState('general')
  const [isDirty,       setIsDirty]       = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [isMilitary,    setIsMilitary]    = useState(false)

  const { data: record, isLoading } = useCapexDossier.useDetail(recordId ?? '')
  const createMutation = useCapexDossier.useCreate({ onSuccess: () => onBack() })
  const updateMutation = useCapexDossier.useUpdate({ onSuccess: () => onBack() })
  const deleteMutation = useCapexDossier.useDelete({ onSuccess: () => onBack() })
  const { data: projectsData } = useCapexDossier.useProjects()
  const projects = useMemo(() => (projectsData as any[]) ?? [], [projectsData])

  const isView     = mode === 'view'
  const isNew      = mode === 'new'
  const stateCode  = (record as any)?.[CapexDossier.STATE_CODE] as StateCode | undefined
  const canDelete  = stateCode === 'DRAFT'
  const hasDocuments = ((record as any)?.[CapexDossier.DOCUMENTS]?.length ?? 0) > 0

  const pageTitle =
    isNew  ? 'Tạo mới — Hồ sơ Chi đầu tư'
    : mode === 'edit' ? `Chỉnh sửa — ${(record as any)?.[CapexDossier.DOSSIER_CODE] ?? ''}`
    : `${(record as any)?.[CapexDossier.DOSSIER_CODE] ?? ''} — Chi tiết`

  // Populate form when record loads (edit/view)
  useEffect(() => {
    if (!record) return
    const r = record as any
    const proj = projects.find((p: any) => p.projectCode === r[CapexDossier.PROJECT_CODE])
    setIsMilitary(proj?.projectType === 'Military')
    form.setFieldsValue({
      [CapexDossier.DOSSIER_CODE]:            r[CapexDossier.DOSSIER_CODE] ?? '',
      [CapexDossier.SEND_DATE]:               r[CapexDossier.SEND_DATE]
        ? dayjs(r[CapexDossier.SEND_DATE], 'YYYY-MM-DD')
        : dayjs(),
      [CapexDossier.DATA_SOURCE_CODE]:        r[CapexDossier.DATA_SOURCE_CODE] ?? 'MANUAL',
      [CapexDossier.PROJECT_CODE]:            r[CapexDossier.PROJECT_CODE]  ?? '',
      [CapexDossier.PROJECT_NAME]:            r[CapexDossier.PROJECT_NAME]  ?? '',
      [CapexDossier.PROJECT_SPECIFIC_CODE]:   r[CapexDossier.PROJECT_SPECIFIC_CODE]  ?? '',
      [CapexDossier.PROJECT_SPECIFIC_NAME]:   r[CapexDossier.PROJECT_SPECIFIC_NAME]  ?? '',
      [CapexDossier.PROJECT_MANAGEMENT_CODE]: r[CapexDossier.PROJECT_MANAGEMENT_CODE] ?? '',
      [CapexDossier.PROJECT_MANAGEMENT_NAME]: r[CapexDossier.PROJECT_MANAGEMENT_NAME] ?? '',
      [CapexDossier.STATE_CODE]:              STATE_LABELS[stateCode ?? 'DRAFT'],
    })
  }, [record, form, stateCode, projects])

  useEffect(() => {
    if (isNew) {
      form.setFieldsValue({
        [CapexDossier.SEND_DATE]:        dayjs(),
        [CapexDossier.DATA_SOURCE_CODE]: 'MANUAL',
        [CapexDossier.STATE_CODE]:       STATE_LABELS['DRAFT'],
      })
    }
  }, [isNew, form])

  const onProjectCodeChange = (code: string) => {
    const proj = projects.find((p: any) => p.projectCode === code)
    setIsMilitary(proj?.projectType === 'Military')
    form.setFieldsValue({
      [CapexDossier.PROJECT_NAME]:            proj?.projectName            ?? '',
      [CapexDossier.PROJECT_MANAGEMENT_CODE]: proj?.projectManagementCode  ?? '',
      [CapexDossier.PROJECT_MANAGEMENT_NAME]: proj?.projectManagementName  ?? '',
      [CapexDossier.PROJECT_SPECIFIC_CODE]:   '',
      [CapexDossier.PROJECT_SPECIFIC_NAME]:   '',
    })
    setIsDirty(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        [CapexDossier.SEND_DATE]: values[CapexDossier.SEND_DATE]?.format('YYYY-MM-DD'),
      }
      if (isNew) {
        await createMutation.mutateAsync(payload)
      } else {
        await updateMutation.mutateAsync({ dossierId: recordId!, ...payload })
      }
    } catch (err: any) {
      if (err.errorFields) return
      if (!err._handled) message.error('Lưu hồ sơ thất bại')
    }
  }

  const handleSaveDraft = () => {
    message.success('Lưu nháp thành công')
    setIsDirty(false)
  }

  const handleSubmit = async () => {
    if (!hasDocuments && !isNew) {
      message.warning('Cần có ít nhất một chứng từ trước khi gửi kiểm soát')
      return
    }
    try {
      await handleSave()
    } catch {
      /* validation failed */
    }
  }

  const handleDelete = async (reason: string) => {
    if (!recordId) return
    await deleteMutation.mutateAsync({
      dossierId:       recordId,
      deleteReason:    reason,
      confirmReviewed: true,
    })
    setShowDelete(false)
  }

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?')) onBack()
    } else {
      onBack()
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ── Document grid columns ────────────────────────────────────────────────
  const docColumns = [
    { title: 'STT',              key: 'stt',       width: 50, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Số chứng từ',      dataIndex: 'DOCUMENT_NUMBER',           key: 'DOCUMENT_NUMBER' },
    { title: 'Ngày chứng từ',    dataIndex: 'DOCUMENT_DATE',             key: 'DOCUMENT_DATE',    width: 130 },
    { title: 'Ngày hạch toán',   dataIndex: 'ACCOUNTING_DATE',           key: 'ACCOUNTING_DATE',  width: 130 },
    { title: 'Tên chứng từ',     dataIndex: 'DOC_NAME',                  key: 'DOC_NAME', ellipsis: true },
    { title: 'Số tiền nguyên tệ', dataIndex: 'PAYMENT_REQUEST_AMOUNT',   key: 'PAYMENT_REQUEST_AMOUNT', align: 'right' as const, render: (n: number) => n ? n.toLocaleString('vi-VN') : '—' },
    { title: 'Số tiền VND',      dataIndex: 'PAYMENT_REQUEST_AMOUNT_VND', key: 'PAYMENT_REQUEST_AMOUNT_VND', align: 'right' as const, render: (n: number) => <span style={{ fontFamily: 'monospace' }}>{n?.toLocaleString('vi-VN') ?? '0'}</span> },
  ]

  const documents = (record as any)?.[CapexDossier.DOCUMENTS] ?? []

  // ── History table columns ─────────────────────────────────────────────────
  const historyColumns = [
    { title: 'STT',                key: 'stt',     width: 50,  render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Người tạo',          dataIndex: 'createdBy',       key: 'createdBy' },
    { title: 'Ngày tạo',           dataIndex: 'createdDate',     key: 'createdDate' },
    { title: 'Người cập nhật cuối', dataIndex: 'lastUpdatedBy',  key: 'lastUpdatedBy' },
    { title: 'Ngày cập nhật cuối', dataIndex: 'lastUpdatedDate', key: 'lastUpdatedDate' },
    { title: 'Hành động',          dataIndex: 'action',          key: 'action' },
  ]

  const historyRecords = record
    ? [{
        createdBy:       (record as any)[CapexDossier.CREATED_BY],
        createdDate:     (record as any)[CapexDossier.CREATED_DATE],
        lastUpdatedBy:   (record as any)[CapexDossier.LAST_UPDATED_BY],
        lastUpdatedDate: (record as any)[CapexDossier.LAST_UPDATED_DATE],
        action:          'Tạo mới',
      }]
    : []

  // ── Approval workflow ────────────────────────────────────────────────────
  const approvalStatus = stateCode
  const makerDone    = !!approvalStatus
  const checkerDone  = ['PENDING_APPROVE', 'APPROVE_REJECTED', 'APPROVE_CANCELLED', 'APPROVED'].includes(approvalStatus ?? '')
  const approverDone = approvalStatus === 'APPROVED'
  const checkerRejected  = approvalStatus === 'CHECK_REJECTED'
  const approverRejected = approvalStatus === 'APPROVE_REJECTED'

  // ── Tab items ─────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key:      'general',
      label:    'Thông tin chung',
      children: (
        <Form
          form={form}
          layout="vertical"
          disabled={isView || isLoading}
          onValuesChange={() => setIsDirty(true)}
          style={{ padding: '16px 20px' }}
        >
          {isNew && (
            <div style={{
              background: '#e8f0fb', borderLeft: '3px solid #0b5394',
              padding: '8px 12px', borderRadius: '0 4px 4px 0',
              fontSize: 12, color: '#0b5394', marginBottom: 16,
            }}>
              Điền đầy đủ thông tin và bấm <strong>Lưu</strong> để tạo hồ sơ.
              Mã hồ sơ sẽ được tự động sinh sau khi lưu lần đầu.
            </div>
          )}

          <Row gutter={24}>
            {/* Row 1 */}
            <Col span={8}>
              <Form.Item name={CapexDossier.DOSSIER_CODE} label="Mã hồ sơ">
                <Input disabled placeholder="(Tự động sinh sau khi Lưu)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={CapexDossier.SEND_DATE}
                label={<span>Ngày gửi hồ sơ <span style={{ color: '#dc3545' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng chọn ngày gửi' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={CapexDossier.DATA_SOURCE_CODE}
                label={<span>Nguồn <span style={{ color: '#dc3545' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng chọn nguồn' }]}
              >
                <Select disabled={mode !== 'new'}>
                  <Select.Option value="MANUAL">Thủ công</Select.Option>
                  <Select.Option value="DVC">DVC</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Row 2 */}
            <Col span={16}>
              <Form.Item
                name={CapexDossier.PROJECT_CODE}
                label={<span>Mã dự án/công trình <span style={{ color: '#dc3545' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã dự án' }]}
              >
                <Input.Group compact>
                  <Form.Item name={CapexDossier.PROJECT_CODE} noStyle>
                    <Input
                      style={{ width: 'calc(100% - 32px)' }}
                      placeholder="Nhập hoặc F4 để tra cứu"
                      onChange={(e) => onProjectCodeChange(e.target.value)}
                    />
                  </Form.Item>
                  <Tooltip title="F4 — Tra cứu dự án">
                    <Button icon={<SearchOutlined />} />
                  </Tooltip>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={CapexDossier.PROJECT_NAME}
                label={<span>Tên dự án/công trình <span style={{ color: '#fd7e14' }}>(*)</span></span>}
              >
                <Input readOnly placeholder="(Tự động fill theo Mã dự án)" />
              </Form.Item>
            </Col>

            {/* Military fields */}
            {isMilitary && (
              <>
                <Col span={16}>
                  <Form.Item name={CapexDossier.PROJECT_SPECIFIC_CODE} label="Mã dự án đặc thù">
                    <Input.Group compact>
                      <Form.Item name={CapexDossier.PROJECT_SPECIFIC_CODE} noStyle>
                        <Input style={{ width: 'calc(100% - 32px)' }} placeholder="F4 — Chỉ dành cho Military" />
                      </Form.Item>
                      <Tooltip title="F4">
                        <Button icon={<SearchOutlined />} />
                      </Tooltip>
                    </Input.Group>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={CapexDossier.PROJECT_SPECIFIC_NAME}
                    label={<span>Tên dự án đặc thù <span style={{ color: '#fd7e14' }}>(*)</span></span>}
                  >
                    <Input readOnly placeholder="(Tự động fill)" />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* Row 3 */}
            <Col span={16}>
              <Form.Item
                name={CapexDossier.PROJECT_MANAGEMENT_CODE}
                label={<span>Mã ĐVQHNS <span style={{ color: '#dc3545' }}>*</span></span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã ĐVQHNS' }]}
              >
                <Input.Group compact>
                  <Form.Item name={CapexDossier.PROJECT_MANAGEMENT_CODE} noStyle>
                    <Input style={{ width: 'calc(100% - 32px)' }} placeholder="Nhập hoặc F4 để tra cứu" />
                  </Form.Item>
                  <Tooltip title="F4 — Tra cứu ĐVQHNS">
                    <Button icon={<SearchOutlined />} />
                  </Tooltip>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={CapexDossier.PROJECT_MANAGEMENT_NAME}
                label={<span>Tên ĐVQHNS <span style={{ color: '#fd7e14' }}>(*)</span></span>}
              >
                <Input readOnly placeholder="(Tự động fill theo Mã ĐVQHNS)" />
              </Form.Item>
            </Col>

            {/* Row 4 */}
            <Col span={8}>
              <Form.Item name={CapexDossier.STATE_CODE} label="Trạng thái hồ sơ">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      key:      'documents',
      label:    'Danh sách chứng từ',
      disabled: isNew,
      children: (
        <div style={{ padding: '16px 20px' }}>
          {isNew ? (
            <div style={{ background: '#e8f0fb', borderLeft: '3px solid #0b5394', padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 12, color: '#0b5394' }}>
              Lưu hồ sơ trước để có thể thêm chứng từ.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0b5394' }}>Danh sách chứng từ</span>
                {mode === 'edit' && (
                  <Button size="small" title="Ctrl+Shift+N">+ Thêm mới chứng từ</Button>
                )}
              </div>
              <Table
                dataSource={documents}
                columns={docColumns}
                rowKey="DOCUMENT_NUMBER"
                size="small"
                pagination={false}
                locale={{ emptyText: 'Chưa có chứng từ nào' }}
                summary={(rows) => {
                  const sumVnd = (rows as any[]).reduce((s, r) => s + (r.PAYMENT_REQUEST_AMOUNT_VND || 0), 0)
                  return (
                    <Table.Summary.Row style={{ background: '#f0f4f9', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">Tổng cộng:</Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right">—</Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right">
                        <span style={{ fontFamily: 'monospace' }}>{sumVnd.toLocaleString('vi-VN')}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )
                }}
              />
            </>
          )}
        </div>
      ),
    },
    {
      key:      'attach',
      label:    'Đính kèm tài liệu',
      children: (
        <div style={{ padding: '16px 20px' }}>
          {mode !== 'view' && (
            <Upload.Dragger
              name="files"
              multiple
              accept=".pdf,.jpg,.png,.docx"
              beforeUpload={() => false}
              style={{ marginBottom: 16 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="ant-upload-hint">Hỗ trợ: PDF, JPG, PNG, DOCX — Tối đa 10MB/file</p>
            </Upload.Dragger>
          )}
          <Table
            dataSource={[]}
            columns={[
              { title: 'Tên file',       dataIndex: 'fileName',     key: 'fileName' },
              { title: 'Loại tài liệu',  dataIndex: 'docType',      key: 'docType' },
              { title: 'Kích thước',     dataIndex: 'fileSize',     key: 'fileSize' },
              { title: 'Người upload',   dataIndex: 'uploadedBy',   key: 'uploadedBy' },
              { title: 'Ngày upload',    dataIndex: 'uploadedDate', key: 'uploadedDate' },
              { title: 'Thao tác',       key: 'action', render: () => null },
            ]}
            size="small"
            pagination={false}
            locale={{ emptyText: 'Chưa có file đính kèm' }}
          />
        </div>
      ),
    },
    {
      key:      'history',
      label:    'Lịch sử giao dịch',
      children: (
        <div style={{ padding: '16px 20px' }}>
          <Table
            dataSource={historyRecords}
            columns={historyColumns}
            rowKey="createdDate"
            size="small"
            pagination={false}
            locale={{ emptyText: 'Chưa có lịch sử' }}
          />
        </div>
      ),
    },
    {
      key:      'approval',
      label:    'Trạng thái phê duyệt',
      children: (
        <div style={{ padding: '24px 40px' }}>
          <Steps
            current={
              approverDone ? 2
              : checkerDone || ['PENDING_APPROVE'].includes(approvalStatus ?? '') ? 1
              : 0
            }
            status={
              approverRejected ? 'error'
              : checkerRejected ? 'error'
              : approverDone    ? 'finish'
              : 'process'
            }
            items={[
              {
                title:       'Người lập',
                description: (record as any)?.[CapexDossier.CREATED_BY] ?? '—',
                icon:        makerDone ? <CheckCircleOutlined /> : undefined,
              },
              {
                title:       'Người kiểm soát',
                description: (record as any)?.[CapexDossier.CHECKED_BY] ?? (checkerDone ? '—' : 'Đang chờ'),
              },
              {
                title:       'Người phê duyệt',
                description: (record as any)?.[CapexDossier.APPROVED_BY] ?? (approverDone ? '—' : 'Đang chờ'),
              },
            ]}
          />
          {checkerRejected && (
            <div style={{ marginTop: 16, background: '#f8d7da', borderLeft: '3px solid #dc3545', padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 12, color: '#721c24' }}>
              Từ chối kiểm soát: {(record as any)?.[CapexDossier.CHECK_REJECTION_REASON] ?? '—'}
            </div>
          )}
          {approverRejected && (
            <div style={{ marginTop: 16, background: '#f8d7da', borderLeft: '3px solid #dc3545', padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 12, color: '#721c24' }}>
              Từ chối phê duyệt: {(record as any)?.[CapexDossier.APPROVAL_REJECTION_REASON] ?? '—'}
            </div>
          )}
          {approverDone && (
            <div style={{ marginTop: 16, background: '#d4edda', borderLeft: '3px solid #28a745', padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 12, color: '#155724' }}>
              ✔ Đã phê duyệt lúc {(record as any)?.[CapexDossier.APPROVED_DATE] ?? '—'}
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: 4,
        padding: '12px 24px', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 2 }}>
            <span
              style={{ color: '#0b5394', cursor: 'pointer' }}
              onClick={onBack}
            >
              Danh sách hồ sơ Chi đầu tư
            </span>
            {' / '}
            <strong>{isNew ? 'Tạo mới' : (record as any)?.[CapexDossier.DOSSIER_CODE] ?? 'Chi tiết'}</strong>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#0b5394', margin: 0 }}>{pageTitle}</h1>
        </div>
        <Space>
          {isView && (
            <>
              <Button icon={<PrinterOutlined />} size="small" title="In phiếu (Ctrl+P)">In phiếu</Button>
              {stateCode === 'DRAFT' && (
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  title="Sửa (F2)"
                  onClick={() => onEdit?.(recordId!)}
                >
                  Sửa
                </Button>
              )}
            </>
          )}
          {stateCode && (
            <Tag color={STATE_TAG_COLOR[stateCode]} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12 }}>
              {STATE_LABELS[stateCode]}
            </Tag>
          )}
          {!stateCode && isNew && (
            <Tag color="default" style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12 }}>
              Đang hoàn thiện
            </Tag>
          )}
        </Space>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: 4,
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none',
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ margin: 0 }}
          tabBarStyle={{ padding: '0 20px', marginBottom: 0 }}
        />
      </div>

      {/* ── Sticky action bar ────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: '0 0 4px 4px',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', bottom: 0, boxShadow: '0 -2px 8px rgba(0,0,0,.08)',
      }}>
        {/* Left — danger actions */}
        <div>
          {!isView && !isNew && canDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setShowDelete(true)}
              title="Xoá (Delete)"
            >
              Xoá
            </Button>
          )}
        </div>

        {/* Right — default/primary actions */}
        <Space>
          {isView ? (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Quay lại</Button>
          ) : (
            <>
              <Button onClick={handleCancel} title="Huỷ (Esc)">Huỷ</Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
                title="Lưu nháp (Ctrl+Shift+S)"
              >
                Lưu nháp
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isSaving}
                onClick={handleSave}
                title="Lưu (Ctrl+S)"
              >
                Lưu
              </Button>
              {stateCode === 'DRAFT' && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  disabled={!hasDocuments && !isNew}
                  onClick={handleSubmit}
                  title="Gửi kiểm soát (F9)"
                >
                  Gửi kiểm soát
                </Button>
              )}
            </>
          )}
        </Space>
      </div>

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      <DeleteDossierModal
        open={showDelete}
        dossierCode={(record as any)?.[CapexDossier.DOSSIER_CODE] ?? ''}
        loading={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default CapexDossierDetailPage
