import { useState, useMemo } from 'react'
import {
  Button, Input, Select, Table, Tag, Space, Tooltip,
  DatePicker, Row, Col, Statistic, Divider,
} from 'antd'
import type { TableProps } from 'antd'
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, DownOutlined, UpOutlined,
} from '@ant-design/icons'
import { useCapexDossier } from '../hooks/useCapexDossier'
import DeleteDossierModal from '../components/DeleteDossierModal'
import { CapexDossier, STATE_LABELS, STATE_TAG_COLOR, type StateCode } from '../models/CapexDossier'

interface CapexDossierListPageProps {
  onNavigate: (id: string | null, mode: 'new' | 'view' | 'edit') => void
}

const CapexDossierListPage = ({ onNavigate }: CapexDossierListPageProps) => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [filters, setFilters] = useState({
    keyword:   '',
    stateCode: undefined as string | undefined,
    source:    undefined as string | undefined,
    sort:      'CREATED_DATE,desc',
  })
  const [inputFilters, setInputFilters] = useState({ keyword: '' })
  const [advOpen, setAdvOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null)

  const queryParams = useMemo(() => ({
    page:      pagination.current - 1,
    size:      pagination.pageSize,
    keyword:   filters.keyword   || undefined,
    stateCode: filters.stateCode || undefined,
    source:    filters.source    || undefined,
    sort:      filters.sort,
  }), [pagination, filters])

  const { data, isLoading } = useCapexDossier.useList(queryParams)
  const deleteMutation      = useCapexDossier.useDelete()

  const records = useMemo(
    () => (data as any)?.content || (data as any)?.data || data || [],
    [data],
  )
  const total       = (data as any)?.totalElements || (data as any)?.total || records.length
  const totalVnd    = records.reduce((s: number, r: any) => s + (r[CapexDossier.TOTAL_VND] || 0), 0)

  const stats = useMemo(() => ({
    draft:         records.filter((r: any) => r[CapexDossier.STATE_CODE] === 'DRAFT').length,
    pendingCheck:  records.filter((r: any) => r[CapexDossier.STATE_CODE] === 'PENDING_CHECK').length,
    pendingApprove:records.filter((r: any) => r[CapexDossier.STATE_CODE] === 'PENDING_APPROVE').length,
    approved:      records.filter((r: any) => r[CapexDossier.STATE_CODE] === 'APPROVED').length,
    rejected:      records.filter((r: any) =>
      ['CHECK_REJECTED', 'APPROVE_REJECTED'].includes(r[CapexDossier.STATE_CODE])).length,
  }), [records])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    setFilters((prev) => ({ ...prev, keyword: inputFilters.keyword.trim() }))
  }

  const handleReset = () => {
    setInputFilters({ keyword: '' })
    setFilters({ keyword: '', stateCode: undefined, source: undefined, sort: 'CREATED_DATE,desc' })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleTableChange: TableProps<any>['onChange'] = (newPagination, _f, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current:  newPagination.current  || 1,
      pageSize: newPagination.pageSize || 10,
    }))
    if (sorter && !Array.isArray(sorter) && sorter.field) {
      const dir = sorter.order === 'ascend' ? 'asc' : 'desc'
      setFilters((prev) => ({ ...prev, sort: `${sorter.field},${dir}` }))
    }
  }

  const handleDelete = async (reason: string) => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync({
        dossierId:       deleteTarget.id,
        deleteReason:    reason,
        confirmReviewed: true,
      })
      setDeleteTarget(null)
    } catch (error: any) {
      if (!error._handled) console.error(error)
    }
  }

  const formatVnd = (n: number) => n?.toLocaleString('vi-VN') ?? '0'

  const columns: TableProps<any>['columns'] = [
    {
      title:  'STT',
      key:    'stt',
      width:  55,
      fixed:  'left',
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title:     'Mã hồ sơ',
      dataIndex: CapexDossier.DOSSIER_CODE,
      key:       CapexDossier.DOSSIER_CODE,
      width:     160,
      fixed:     'left',
      sorter:    true,
      render:    (code: string, record: any) => (
        <a
          style={{ color: '#0b5394', fontWeight: 600 }}
          onClick={() => onNavigate(record.dossierId, 'view')}
        >
          {code}
        </a>
      ),
    },
    {
      title:     'Ngày gửi',
      dataIndex: CapexDossier.SEND_DATE,
      key:       CapexDossier.SEND_DATE,
      width:     120,
      sorter:    true,
    },
    {
      title:     'Trạng thái',
      dataIndex: CapexDossier.STATE_CODE,
      key:       CapexDossier.STATE_CODE,
      width:     150,
      sorter:    true,
      render:    (code: StateCode) => (
        <Tag color={STATE_TAG_COLOR[code]}>{STATE_LABELS[code] ?? code}</Tag>
      ),
    },
    {
      title:     'Người lập',
      dataIndex: CapexDossier.CREATED_BY,
      key:       CapexDossier.CREATED_BY,
      width:     130,
      sorter:    true,
    },
    {
      title:     'Ngày lập',
      dataIndex: CapexDossier.CREATED_DATE,
      key:       CapexDossier.CREATED_DATE,
      width:     160,
      sorter:    true,
    },
    {
      title:     'Lý do từ chối TN',
      dataIndex: CapexDossier.RETURNING_REASON,
      key:       CapexDossier.RETURNING_REASON,
      width:     160,
      ellipsis:  true,
    },
    {
      title:     'Người KS',
      dataIndex: CapexDossier.CHECKED_BY,
      key:       CapexDossier.CHECKED_BY,
      width:     130,
    },
    {
      title:     'Ngày KS',
      dataIndex: CapexDossier.CHECKED_DATE,
      key:       CapexDossier.CHECKED_DATE,
      width:     160,
    },
    {
      title:     'Lý do từ chối KS',
      dataIndex: CapexDossier.CHECK_REJECTION_REASON,
      key:       CapexDossier.CHECK_REJECTION_REASON,
      width:     160,
      ellipsis:  true,
    },
    {
      title:     'Người PD',
      dataIndex: CapexDossier.APPROVED_BY,
      key:       CapexDossier.APPROVED_BY,
      width:     130,
    },
    {
      title:     'Ngày PD',
      dataIndex: CapexDossier.APPROVED_DATE,
      key:       CapexDossier.APPROVED_DATE,
      width:     160,
    },
    {
      title:     'Lý do từ chối PD',
      dataIndex: CapexDossier.APPROVAL_REJECTION_REASON,
      key:       CapexDossier.APPROVAL_REJECTION_REASON,
      width:     160,
      ellipsis:  true,
    },
    {
      title:     'Dự án/Công trình',
      dataIndex: CapexDossier.PROJECT_NAME,
      key:       CapexDossier.PROJECT_NAME,
      width:     220,
      ellipsis:  true,
      sorter:    true,
    },
    {
      title:     'Số CT',
      dataIndex: CapexDossier.DOCUMENT_COUNT,
      key:       CapexDossier.DOCUMENT_COUNT,
      width:     70,
      align:     'center',
      sorter:    true,
    },
    {
      title:     'Tổng tiền VND',
      dataIndex: CapexDossier.TOTAL_VND,
      key:       CapexDossier.TOTAL_VND,
      width:     150,
      align:     'right',
      sorter:    true,
      render:    (n: number) => <span style={{ fontFamily: 'monospace' }}>{formatVnd(n)}</span>,
    },
    {
      title:  'Thao tác',
      key:    'action',
      width:  130,
      fixed:  'right',
      render: (_: any, record: any) => {
        const canEdit = record[CapexDossier.STATE_CODE] === 'DRAFT'
        return (
          <Space size={2}>
            <Tooltip title="Xem (F3)">
              <Button size="small" icon={<EyeOutlined />} onClick={() => onNavigate(record.dossierId, 'view')} />
            </Tooltip>
            <Tooltip title={canEdit ? 'Sửa (F2)' : 'Chỉ sửa khi Đang hoàn thiện'}>
              <Button
                size="small"
                icon={<EditOutlined />}
                disabled={!canEdit}
                onClick={() => onNavigate(record.dossierId, 'edit')}
              />
            </Tooltip>
            <Tooltip title={canEdit ? 'Xoá' : 'Chỉ xoá khi Đang hoàn thiện'}>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!canEdit}
                onClick={() => setDeleteTarget({ id: record.dossierId, code: record[CapexDossier.DOSSIER_CODE] })}
              />
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: 4,
        padding: '12px 24px', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 2 }}>
            Quản lý Chi đầu tư / <strong>Danh sách hồ sơ</strong>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#0b5394', margin: 0 }}>
            Danh sách hồ sơ Chi đầu tư
          </h1>
        </div>
        <Space>
          <Button icon={<ExportOutlined />} title="Xuất Excel/PDF/CSV (Ctrl+Shift+E)">
            Xuất
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onNavigate(null, 'new')}
            title="Tạo mới (Ctrl+N)"
            data-testid="btn-create-new"
          >
            Tạo mới
          </Button>
        </Space>
      </div>

      {/* ── Filter card ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ padding: '16px 20px' }}>
          <Row gutter={[12, 12]} align="bottom">
            <Col flex="1 1 200px">
              <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Tìm nhanh</div>
              <Input
                value={inputFilters.keyword}
                placeholder="Mã hồ sơ, người lập..."
                onChange={(e) => setInputFilters({ keyword: e.target.value })}
                onPressEnter={handleSearch}
                allowClear
                data-testid="search-input"
              />
            </Col>
            <Col style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Trạng thái</div>
              <Select
                value={filters.stateCode}
                placeholder="Tất cả"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => {
                  setFilters((prev) => ({ ...prev, stateCode: v }))
                  setPagination((prev) => ({ ...prev, current: 1 }))
                }}
                data-testid="filter-status"
              >
                {(Object.entries(STATE_LABELS) as [StateCode, string][]).map(([code, label]) => (
                  <Select.Option key={code} value={code}>{label}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col style={{ minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Nguồn</div>
              <Select
                value={filters.source}
                placeholder="Tất cả"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => {
                  setFilters((prev) => ({ ...prev, source: v }))
                  setPagination((prev) => ({ ...prev, current: 1 }))
                }}
              >
                <Select.Option value="Thủ công">Thủ công</Select.Option>
                <Select.Option value="DVC">DVC</Select.Option>
              </Select>
            </Col>
            <Col>
              <Button
                onClick={() => setAdvOpen(!advOpen)}
                icon={advOpen ? <UpOutlined /> : <DownOutlined />}
              >
                Nâng cao
              </Button>
            </Col>
            <Col>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} data-testid="btn-search">
                Tìm kiếm
              </Button>
            </Col>
            <Col>
              <Button icon={<ReloadOutlined />} onClick={handleReset} title="Đặt lại (F5)">
                Đặt lại
              </Button>
            </Col>
          </Row>
        </div>

        {/* Advanced filters */}
        {advOpen && (
          <div style={{ borderTop: '1px solid #dee2e6', padding: '12px 20px', background: '#fafbfd' }}>
            <Row gutter={[12, 12]} align="bottom">
              <Col style={{ minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Loại ngày</div>
                <Select defaultValue="SEND_DATE" style={{ width: '100%' }}>
                  <Select.Option value="SEND_DATE">Ngày gửi</Select.Option>
                  <Select.Option value="CREATED_DATE">Ngày lập</Select.Option>
                  <Select.Option value="CHECKED_DATE">Ngày kiểm soát</Select.Option>
                  <Select.Option value="APPROVED_DATE">Ngày phê duyệt</Select.Option>
                </Select>
              </Col>
              <Col style={{ minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Từ ngày</div>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
              </Col>
              <Col style={{ minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Đến ngày</div>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
              </Col>
              <Col style={{ minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Mã dự án</div>
                <Input placeholder="F4 tra cứu" suffix={<SearchOutlined style={{ color: '#0b5394' }} />} />
              </Col>
              <Col style={{ minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Người lập</div>
                <Input placeholder="F4 tra cứu" suffix={<SearchOutlined style={{ color: '#0b5394' }} />} />
              </Col>
              <Col style={{ minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Người kiểm soát</div>
                <Input placeholder="F4 tra cứu" suffix={<SearchOutlined style={{ color: '#0b5394' }} />} />
              </Col>
              <Col style={{ minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#495057', marginBottom: 4 }}>Người phê duyệt</div>
                <Input placeholder="F4 tra cứu" suffix={<SearchOutlined style={{ color: '#0b5394' }} />} />
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: 4,
        padding: '10px 20px', marginBottom: 12,
      }}>
        <Row gutter={24} align="middle">
          <Col>
            <Statistic title="Tổng hồ sơ" value={total} styles={{ content: { fontSize: 20, color: '#0b5394' } }} />
          </Col>
          <Divider orientation="vertical" style={{ height: 40 }} />
          <Col><span style={{ color: '#6c757d' }}>Đang hoàn thiện:</span> <strong>{stats.draft}</strong></Col>
          <Col><span style={{ color: '#6c757d' }}>Chờ kiểm soát:</span> <strong style={{ color: '#004085' }}>{stats.pendingCheck}</strong></Col>
          <Col><span style={{ color: '#6c757d' }}>Chờ phê duyệt:</span> <strong style={{ color: '#0c5460' }}>{stats.pendingApprove}</strong></Col>
          <Col><span style={{ color: '#6c757d' }}>Đã phê duyệt:</span> <strong style={{ color: '#28a745' }}>{stats.approved}</strong></Col>
          <Col><span style={{ color: '#6c757d' }}>Từ chối:</span> <strong style={{ color: '#dc3545' }}>{stats.rejected}</strong></Col>
          <Divider orientation="vertical" style={{ height: 40 }} />
          <Col>
            <span style={{ color: '#6c757d' }}>Tổng tiền VND:</span>{' '}
            <strong style={{ color: '#0b5394', fontFamily: 'monospace' }}>
              {formatVnd(totalVnd)}
            </strong>
          </Col>
        </Row>
      </div>

      {/* ── Data table ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #dee2e6', borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', borderBottom: '1px solid #dee2e6',
          background: '#f0f4f9',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0b5394' }}>Kết quả tìm kiếm</span>
        </div>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="dossierId"
          loading={isLoading}
          size="small"
          scroll={{ x: 2000 }}
          onChange={handleTableChange}
          data-testid="list-tbody"
          onRow={(record) => ({
            onClick: () => onNavigate(record.dossierId, 'view'),
            style: { cursor: 'pointer' },
          })}
          summary={(pageData) => {
            const sumVnd  = pageData.reduce((s: number, r: any) => s + (r[CapexDossier.TOTAL_VND] || 0), 0)
            const sumDocs = pageData.reduce((s: number, r: any) => s + (r[CapexDossier.DOCUMENT_COUNT] || 0), 0)
            return (
              <Table.Summary.Row style={{ background: '#f0f4f9', fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={14} align="right">
                  Tổng cộng ({pageData.length} hồ sơ):
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="center">{sumDocs}</Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  <span style={{ fontFamily: 'monospace' }}>{formatVnd(sumVnd)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} />
              </Table.Summary.Row>
            )
          }}
          pagination={{
            current:         pagination.current,
            pageSize:        pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal:       (t) => `Hiển thị ${(pagination.current - 1) * pagination.pageSize + 1}–${Math.min(pagination.current * pagination.pageSize, t)} trong tổng số ${t} bản ghi`,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, size) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize: size ?? prev.pageSize }))
            },
          }}
        />
      </div>

      {/* ── Delete modal ────────────────────────────────────────────────────── */}
      <DeleteDossierModal
        open={!!deleteTarget}
        dossierCode={deleteTarget?.code ?? ''}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default CapexDossierListPage
