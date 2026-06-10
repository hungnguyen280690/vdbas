import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Switch,
  Popconfirm,
  message,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '../contexts/PermissionContext.jsx'
import { CategoryGroupsHooks } from '../hooks/useAcl.js'
import CategoryGroupFormModal from '../components/CategoryGroupFormModal.jsx'
import { CategoryGroup } from '../models/CategoryGroup.js'

/**
 * CategoryGroupsPage — sample CRUD page demonstrating every convention
 * from CODING_RULES.md:
 *   • Two-layer filter state (inputFilters + filters)
 *   • useMemo queryParams (0-based page for API)
 *   • Paginated table with sequential-number column
 *   • Permission-gated action buttons
 *   • Switch toggle for active status
 *   • Sorter wired through handleTableChange
 *   • Three-error-case error handling in handlers
 */
const CategoryGroupsPage = () => {
  // 1. Translation
  const { t: translate } = useTranslation()

  // 2. Context
  const { hasApiPermission } = usePermissions()

  // 3. State
  const [pagination, setPagination] = useState({
    current:  1,
    pageSize: 10,
    total:    0,
  })

  // API-committed filters (drives the query)
  const [filters, setFilters] = useState({
    groupCode: '',
    groupName: '',
    status:    undefined,
    sort:      'created_at,desc',
  })

  // Input-controlled values (drives the UI controls — NOT the query)
  const [inputFilters, setInputFilters] = useState({
    groupCode: '',
    groupName: '',
  })

  const [isModalOpen,          setIsModalOpen]          = useState(false)
  const [editingCategoryGroup, setEditingCategoryGroup] = useState(null)

  // 8. Query params — memoized to avoid unnecessary re-renders
  const queryParams = useMemo(() => {
    const params = {
      page:      pagination.current - 1,   // backend uses 0-based pages
      size:      pagination.pageSize,
      groupCode: filters.groupCode || undefined,
      groupName: filters.groupName || undefined,
      sort:      filters.sort,
    }

    // Map the UI status value to backend boolean fields
    if (filters.status === 'active') {
      params.active  = true
      params.deleted = false
    } else if (filters.status === 'inactive') {
      params.active  = false
      params.deleted = false
    } else if (filters.status === 'deleted') {
      params.deleted = true
    }

    return params
  }, [pagination.current, pagination.pageSize, filters])

  // 6. Queries
  const { data, isLoading } = CategoryGroupsHooks.useList(queryParams)

  // 7. Mutations
  const updateActiveMutation        = CategoryGroupsHooks.useUpdateActive()
  const deleteCategoryGroupMutation = CategoryGroupsHooks.useDelete()

  // 8. Derived data
  const categoryGroups = data?.content || data?.data || data || []
  const total          = data?.totalElements || data?.total || categoryGroups.length

  // Permissions
  const canCreate = hasApiPermission('/api/category-groups', 'POST')
  const canUpdate = hasApiPermission('/api/category-groups', 'PUT')
  const canDelete = hasApiPermission('/api/category-groups', 'DELETE')

  // 9. Sync total to pagination state
  useEffect(() => {
    setPagination((prev) => ({ ...prev, total }))
  }, [total])

  // 10. Handlers
  const handleToggleStatus = async (record, checked) => {
    try {
      await updateActiveMutation.mutateAsync({
        groupCode: record[CategoryGroup.GROUP_CODE],
        isActive:  checked,
      })
    } catch (error) {
      if (error._handled) return
      message.error(translate('common.update_fail'))
    }
  }

  const handleTableChange = (newPagination, _tableFilters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current:  newPagination.current,
      pageSize: newPagination.pageSize,
    }))

    if (sorter.field) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc'
      setFilters((prev) => ({
        ...prev,
        sort: `${sorter.field},${direction}`,
      }))
    }
  }

  const handleSearch = () => {
    const { groupCode, groupName } = inputFilters
    const isCodeTooShort = groupCode?.trim().length > 0 && groupCode.trim().length < 3
    const isNameTooShort = groupName?.trim().length > 0 && groupName.trim().length < 3

    if (isCodeTooShort || isNameTooShort) {
      message.warning(translate('common.min_2_char_warning'))
      return
    }

    setPagination((prev) => ({ ...prev, current: 1 }))
    setFilters((prev) => ({
      ...prev,
      groupCode: groupCode.trim(),
      groupName: groupName.trim(),
    }))
  }

  const handleReset = () => {
    setInputFilters({ groupCode: '', groupName: '' })
    setFilters({
      groupCode: '',
      groupName: '',
      status:    undefined,
      sort:      'created_at,desc',
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleCreate = () => {
    setEditingCategoryGroup(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingCategoryGroup(record)
    setIsModalOpen(true)
  }

  const handleDelete = async (groupCode) => {
    try {
      await deleteCategoryGroupMutation.mutateAsync(groupCode)
    } catch (error) {
      if (error._handled) return
      message.error(translate('common.delete_fail'))
    }
  }

  const handleModalClose   = () => { setIsModalOpen(false); setEditingCategoryGroup(null) }
  const handleModalSuccess = () => { setIsModalOpen(false); setEditingCategoryGroup(null) }

  // 11. Column definitions
  const columns = [
    // Serial number
    {
      title:  translate('common.stt'),
      key:    'stt',
      width:  70,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    // Group Code
    {
      title:     translate('categoryGroup.group_code'),
      dataIndex: CategoryGroup.GROUP_CODE,
      key:       CategoryGroup.GROUP_CODE,
      width:     200,
      fixed:     'left',
      sorter:    true,
    },
    // Group Name
    {
      title:     translate('categoryGroup.group_name'),
      dataIndex: CategoryGroup.GROUP_NAME,
      key:       CategoryGroup.GROUP_NAME,
      width:     300,
      sorter:    true,
    },
    // System flag
    {
      title:     translate('categoryGroup.is_system'),
      dataIndex: CategoryGroup.IS_SYSTEM,
      key:       CategoryGroup.IS_SYSTEM,
      width:     110,
      render:    (isSystem) =>
        isSystem
          ? <Tag color="blue">{translate('common.yes')}</Tag>
          : <Tag>{translate('common.no')}</Tag>,
    },
    // Status
    {
      title:     translate('common.status'),
      dataIndex: CategoryGroup.IS_ACTIVE,
      key:       CategoryGroup.IS_ACTIVE,
      width:     130,
      render:    (active, record) => {
        if (record[CategoryGroup.DELETED]) {
          return <Tag color="red">{translate('common.deleted')}</Tag>
        }
        return active
          ? <Tag color="green">{translate('common.active')}</Tag>
          : <Tag color="orange">{translate('common.inactive')}</Tag>
      },
    },
    // Actions — always last, fixed right
    {
      title: translate('common.action'),
      key:   'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {/* Edit */}
          {canUpdate && (
            <Tooltip title={translate('common.edit')}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}

          {/* Toggle active */}
          {canUpdate && (
            <Tooltip title={translate('common.status')}>
              <Switch
                size="small"
                checked={record[CategoryGroup.IS_ACTIVE]}
                loading={updateActiveMutation.isPending}
                onChange={(checked) => handleToggleStatus(record, checked)}
                disabled={record[CategoryGroup.DELETED]}
              />
            </Tooltip>
          )}

          {/* Delete */}
          {canDelete && (
            <Popconfirm
              title={translate('common.confirm_delete_title')}
              description={translate('common.confirm_delete')}
              onConfirm={() => handleDelete(record[CategoryGroup.GROUP_CODE])}
              disabled={record[CategoryGroup.DELETED]}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record[CategoryGroup.DELETED]}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  // 12. Render
  return (
    <div>
      {/* ── Page title bar ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1, margin: 0, color: '#32363A' }}>
          {translate('categoryGroup.title')}
        </h2>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {translate('common.add')}
          </Button>
        )}
      </div>

      {/* ── Filter box ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #D9D9D9',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      }}>
        <div style={{ display: 'grid', gridexpColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6A6D70', marginBottom: 4 }}>
              {translate('categoryGroup.group_code')}
            </div>
            <Input
              value={inputFilters.groupCode}
              placeholder={translate('categoryGroup.placeholder_code')}
              onChange={(e) =>
                setInputFilters((prev) => ({ ...prev, groupCode: e.target.value }))
              }
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6A6D70', marginBottom: 4 }}>
              {translate('categoryGroup.group_name')}
            </div>
            <Input
              value={inputFilters.groupName}
              placeholder={translate('categoryGroup.placeholder_name')}
              onChange={(e) =>
                setInputFilters((prev) => ({ ...prev, groupName: e.target.value }))
              }
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6A6D70', marginBottom: 4 }}>
              {translate('common.status')}
            </div>
            <Select
              value={filters.status}
              placeholder={translate('common.all')}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, status: value }))
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="active">{translate('common.active')}</Select.Option>
              <Select.Option value="inactive">{translate('common.inactive')}</Select.Option>
              <Select.Option value="deleted">{translate('common.deleted')}</Select.Option>
            </Select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {translate('common.reset')}
          </Button>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {translate('common.search')}
          </Button>
        </div>
      </div>

      {/* ── Data table ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #D9D9D9',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid #D9D9D9',
          gap: 10,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: '#32363A' }}>
            {translate('categoryGroup.list_title')}
          </span>
          <span style={{
            fontSize: 12,
            color: '#6A6D70',
            background: '#F5F6F7',
            borderRadius: 12,
            padding: '2px 10px',
            fontWeight: 600,
          }}>
            {translate('common.total_records', { total })}
          </span>
        </div>
        <Table
          dataSource={categoryGroups}
          columns={columns}
          rowKey={CategoryGroup.GROUP_CODE}
          loading={isLoading}
          size="small"
          scroll={{ x: 1200 }}
          onChange={handleTableChange}
          pagination={{
            current:         pagination.current,
            pageSize:        pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal:       (t) => translate('common.total_records', { total: t }),
            pageSizeOptions: ['10', '20', '50', '100'],
            style:           { padding: '12px 20px' },
          }}
        />
      </div>

      {/* ── Form modal ───────────────────────────────────────────────────── */}
      <CategoryGroupFormModal
        open={isModalOpen}
        categoryGroup={editingCategoryGroup}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default CategoryGroupsPage
