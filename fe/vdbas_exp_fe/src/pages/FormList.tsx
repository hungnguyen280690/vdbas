import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './FormList.css'
import type { DossierRecord, DossierStatus } from './FormList.mock'
import { CapexDossierHooks, MasterDataHooks } from '../hooks/useCapexDossier'
import type { DossierSummary } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DossierStatus, string> = {
  DRAFT: 'Đang hoàn thiện',
  PENDING_CHECK: 'Chờ kiểm soát',
  CHECK_REJECTED: 'Từ chối kiểm soát',
  CHECK_CANCELLED: 'Hủy kiểm soát',
  PENDING_APPROVE: 'Chờ phê duyệt',
  APPROVE_REJECTED: 'Từ chối phê duyệt',
  APPROVE_CANCELLED: 'Hủy phê duyệt',
  APPROVED: 'Đã phê duyệt',
  DELETED: 'Đã xóa',
}

const BADGE_LABEL: Record<string, string> = {
  DRAFT: 'Đang hoàn thiện', PENDING_CHECK: 'Chờ KS', CHECK_REJECTED: 'KS từ chối',
  CHECK_CANCELLED: 'KS huỷ', PENDING_APPROVE: 'Chờ PD', APPROVE_REJECTED: 'PD từ chối',
  APPROVE_CANCELLED: 'PD huỷ', APPROVED: 'Đã phê duyệt', DELETED: 'Đã xoá',
}

const LS_KEY = 'capex_dossier_filter'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return n ? n.toLocaleString('vi-VN') : '0'
}

function parseDMY(s: string): number | null {
  if (!s) return null
  const [d, m, y] = s.split('/')
  if (!d || !m || !y) return null
  return parseInt(y + m.padStart(2, '0') + d.padStart(2, '0'), 10)
}

function fromISODate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function fromISODateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const dt = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
}

function toRecord(d: DossierSummary): DossierRecord {
  return {
    id: d.dossierId,
    DOSSIER_CODE: d.dossierCode,
    SEND_DATE: fromISODate(d.sendDate),
    PROJECT_CODE: d.projectCode,
    PROJECT_NAME: d.projectName,
    PROJECT_TYPE: 'Citizen',
    PROJECT_MANAGEMENT_CODE: '',
    PROJECT_MANAGEMENT_NAME: '',
    STATE_CODE: d.stateCode as DossierStatus,
    DATA_SOURCE_CODE: d.dataSourceCode,
    CREATED_BY: d.createdBy,
    CREATED_DATE: fromISODateTime(d.createdDate),
    LAST_UPDATED_DATE: '',
    TOTAL_VND: d.totalAmountVnd,
    DOCUMENT_COUNT: d.documentCount,
    CHECKED_BY: d.checkedBy ?? undefined,
    CHECKED_DATE: fromISODate(d.checkedDate) || undefined,
    APPROVED_BY: d.approvedBy ?? undefined,
    APPROVED_DATE: fromISODate(d.approvedDate) || undefined,
    CHECK_REJECTION_REASON: d.checkRejectionReason ?? undefined,
    APPROVAL_REJECTION_REASON: d.approvalRejectionReason ?? undefined,
    RETURNING_REASON: d.returningReason ?? undefined,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Filters {
  q: string
  st: string
  src: string
  dossier: string
  creator: string
  checker: string
  approver: string
  projectId: string
  fromDate: string
  toDate: string
  dateType: string
}

const EMPTY_FILTERS: Filters = {
  q: '', st: '', src: '', dossier: '', creator: '',
  checker: '', approver: '', projectId: '', fromDate: '', toDate: '',
  dateType: 'SEND_DATE',
}

interface Props {
  showRejectedCol?: boolean
  showCheckedCol?: boolean
  currentUser?: string
  onNavigate?: (path: string, params?: Record<string, string>) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

const FormList: React.FC<Props> = ({
  showRejectedCol: showRejectedColProp = false,
  showCheckedCol: showCheckedColProp = false,
  currentUser,
  onNavigate,
}) => {
  // ── Filter state
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [advOpen, setAdvOpen] = useState(false)

  // ── Sort
  const [sortField, setSortField] = useState('CREATED_DATE')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ── Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ── Row selection
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // ── Conditional columns (driven by API metadata; exposed as props for testability)
  const [showRejectedCol] = useState(showRejectedColProp)
  const [showCheckedCol] = useState(showCheckedColProp)

  // ── Modal open/close
  const [isUserLookupOpen, setIsUserLookupOpen] = useState(false)
  const [isDossierLookupOpen, setIsDossierLookupOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // ── User lookup sub-state
  const [userLookupTarget, setUserLookupTarget] = useState('creator')
  const [userLookupTitle, setUserLookupTitle] = useState('Tra cứu Người dùng')
  const [lovUserName, setLovUserName] = useState('')
  const [lovUserRole, setLovUserRole] = useState('')

  // ── Dossier lookup sub-state
  const [lovDossierCode, setLovDossierCode] = useState('')
  const [lovDossierProject, setLovDossierProject] = useState('')
  const [lovDossierState, setLovDossierState] = useState('')

  // ── localStorage saved filter visibility
  const [savedFilterExists, setSavedFilterExists] = useState(() => !!localStorage.getItem(LS_KEY))

  // ── Refs for auto-focus
  const lovUserNameRef = useRef<HTMLInputElement>(null)
  const lovDossierCodeRef = useRef<HTMLInputElement>(null)

  // ── API ──────────────────────────────────────────────────────────────────────

  const { data: apiData, isLoading, isError } = CapexDossierHooks.useList({ size: 1000 })
  const submitMutation = CapexDossierHooks.useSubmit()
  const { data: usersData } = MasterDataHooks.useUsers({
    keyword: lovUserName || undefined,
    role: lovUserRole ? lovUserRole as 'Maker' | 'Checker' | 'Approver' : undefined,
  })
  const allRecords = useMemo(() => (apiData?.content ?? []).map(toRecord), [apiData])

  // ── Derived: filtered + sorted ─────────────────────────────────────────────

  const filtered = useMemo<DossierRecord[]>(() => {
    const q = filters.q.toLowerCase().trim()
    const fromNum = parseDMY(filters.fromDate)
    const toNum = parseDMY(filters.toDate)

    const result = allRecords.filter((r) => {
      const matchQ = !q || Object.values(r).join(' ').toLowerCase().includes(q)
      const matchSt = !filters.st || r.STATE_CODE === filters.st
      const matchSrc = !filters.src || r.DATA_SOURCE_CODE === filters.src
      const matchCreator = !filters.creator || (r.CREATED_BY || '').toLowerCase().includes(filters.creator.toLowerCase())
      const matchChecker = !filters.checker || (r.CHECKED_BY || '').toLowerCase().includes(filters.checker.toLowerCase())
      const matchApprover = !filters.approver || (r.APPROVED_BY || '').toLowerCase().includes(filters.approver.toLowerCase())
      const matchProject = !filters.projectId || (r.PROJECT_CODE || '').toLowerCase().includes(filters.projectId.toLowerCase())
      const matchDossier = !filters.dossier || (r.DOSSIER_CODE || '').toLowerCase().includes(filters.dossier.toLowerCase())

      let matchDate = true
      if (fromNum || toNum) {
        const raw = ((r as unknown as Record<string, unknown>)[filters.dateType] as string || '').substring(0, 10)
        const rNum = parseDMY(raw)
        if (rNum === null) {
          matchDate = false
        } else {
          if (fromNum && rNum < fromNum) matchDate = false
          if (toNum && rNum > toNum) matchDate = false
        }
      }

      return matchQ && matchSt && matchSrc && matchCreator && matchChecker &&
             matchApprover && matchProject && matchDossier && matchDate
    })

    result.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortField] ?? ''
      const vb = (b as unknown as Record<string, unknown>)[sortField] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'vi')
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [allRecords, filters, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageData = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: filtered.length,
    draft: filtered.filter((r) => r.STATE_CODE === 'DRAFT').length,
    pendingCheck: filtered.filter((r) => r.STATE_CODE === 'PENDING_CHECK').length,
    pendingApprove: filtered.filter((r) => r.STATE_CODE === 'PENDING_APPROVE').length,
    approved: filtered.filter((r) => r.STATE_CODE === 'APPROVED').length,
    rejected: filtered.filter((r) => r.STATE_CODE === 'CHECK_REJECTED' || r.STATE_CODE === 'APPROVE_REJECTED').length,
    totalVnd: filtered.reduce((s, r) => s + (r.TOTAL_VND ?? 0), 0),
  }), [filtered])

  // ── Filter tag helpers ─────────────────────────────────────────────────────

  const activeTags = useMemo(() => {
    const tags: { label: string; field: string }[] = []
    if (filters.st) tags.push({ label: `Trạng thái: ${STATUS_LABELS[filters.st as DossierStatus] ?? filters.st}`, field: 'status' })
    if (filters.src) tags.push({ label: `Nguồn: ${filters.src}`, field: 'source' })
    if (filters.dossier) tags.push({ label: `Hồ sơ: ${filters.dossier}`, field: 'dossier' })
    if (filters.creator) tags.push({ label: `Người lập: ${filters.creator}`, field: 'creator' })
    if (filters.checker) tags.push({ label: `Người KS: ${filters.checker}`, field: 'checker' })
    if (filters.approver) tags.push({ label: `Người PD: ${filters.approver}`, field: 'approver' })
    if (filters.projectId) tags.push({ label: `Dự án: ${filters.projectId}`, field: 'projectId' })
    if (filters.fromDate || filters.toDate) {
      const dtLabels: Record<string, string> = { SEND_DATE: 'Ngày gửi', CREATED_DATE: 'Ngày lập', CHECKED_DATE: 'Ngày kiểm soát', APPROVED_DATE: 'Ngày phê duyệt' }
      const dtLabel = dtLabels[filters.dateType] ?? 'Ngày'
      const range = [filters.fromDate, filters.toDate].filter(Boolean).join(' → ')
      tags.push({ label: `${dtLabel}: ${range}`, field: 'dateRange' })
    }
    return tags
  }, [filters])

  const advFilterCount = [filters.creator, filters.checker, filters.approver, filters.projectId, filters.fromDate, filters.toDate].filter(Boolean).length

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setCurrentPage(1)
  }, [sortField])

  const resetFilter = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setCurrentPage(1)
  }, [])

  const resetAdvFilter = useCallback(() => {
    setFilters((f) => ({ ...f, creator: '', checker: '', approver: '', projectId: '', fromDate: '', toDate: '' }))
  }, [])

  const clearTag = useCallback((field: string) => {
    setFilters((f) => {
      switch (field) {
        case 'status':    return { ...f, st: '' }
        case 'source':    return { ...f, src: '' }
        case 'dossier':   return { ...f, dossier: '' }
        case 'creator':   return { ...f, creator: '' }
        case 'checker':   return { ...f, checker: '' }
        case 'approver':  return { ...f, approver: '' }
        case 'projectId': return { ...f, projectId: '' }
        case 'dateRange': return { ...f, fromDate: '', toDate: '' }
        default:          return f
      }
    })
    setCurrentPage(1)
  }, [])

  function goToDetail(id: string, mode: string, extra?: Record<string, string>) {
    if (onNavigate) {
      onNavigate('/capex-dossier/detail', { id, mode, ...extra })
    } else {
      window.location.href = `form_detail.html?id=${id}&mode=${mode}${extra?.action ? '&action=' + extra.action : ''}`
    }
  }
  function goToNew() {
    if (onNavigate) {
      onNavigate('/capex-dossier/detail', { mode: 'new' })
    } else {
      window.location.href = 'form_detail.html?mode=new'
    }
  }
  function viewRecord(id: string) { goToDetail(id, 'view') }
  function editRecord(id: string) { goToDetail(id, 'edit') }
  function deleteRecord(id: string) { goToDetail(id, 'view', { action: 'delete' }) }
  async function submitRecord(id: string, code: string) {
    if (window.confirm(`Gửi kiểm soát hồ sơ ${code}?`)) {
      try {
        await submitMutation.mutateAsync(id)
      } catch (error: unknown) {
        if ((error as Record<string, unknown>)._handled) return
        window.alert('[MSG-ERR-SUBMIT] Lỗi khi gửi hồ sơ kiểm soát')
      }
    }
  }
  const getSelectedRecord = useCallback((): DossierRecord | null => {
    if (!selectedRowId) return null
    return allRecords.find((r) => r.id === selectedRowId) ?? null
  }, [allRecords, selectedRowId])

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const goToPage = (p: number) => {
    setCurrentPage(Math.max(1, Math.min(p, totalPages)))
  }

  const pageButtons = () => {
    const pages: number[] = []
    const delta = 2
    for (let i = Math.max(1, safeCurrentPage - delta); i <= Math.min(totalPages, safeCurrentPage + delta); i++) pages.push(i)
    return pages
  }

  const paginationInfo = filtered.length === 0
    ? 'Không có kết quả'
    : `Hiển thị ${(safeCurrentPage - 1) * pageSize + 1} – ${Math.min(safeCurrentPage * pageSize, filtered.length)} trong tổng số ${filtered.length} bản ghi`

  // ── localStorage ───────────────────────────────────────────────────────────

  function saveFilter() {
    localStorage.setItem(LS_KEY, JSON.stringify(filters))
    setSavedFilterExists(true)
    window.alert('✔ Đã lưu bộ lọc hiện tại')
  }

  function loadFilter() {
    const saved = localStorage.getItem(LS_KEY)
    if (!saved) { window.alert('Chưa có bộ lọc nào được lưu'); return }
    try {
      const f = JSON.parse(saved) as Partial<Filters>
      setFilters({ ...EMPTY_FILTERS, ...f })
      setCurrentPage(1)
      window.alert('✔ Đã áp dụng bộ lọc đã lưu')
    } catch {
      window.alert('Không đọc được bộ lọc đã lưu')
    }
  }

  // ── User LOV ───────────────────────────────────────────────────────────────

  function openUserLookup(target: string, title: string) {
    setUserLookupTarget(target)
    setUserLookupTitle(title)
    setLovUserName('')
    setLovUserRole('')
    setIsUserLookupOpen(true)
  }

  function selectUserLOV(username: string) {
    setFilters((f) => {
      switch (userLookupTarget) {
        case 'creator':  return { ...f, creator: username }
        case 'checker':  return { ...f, checker: username }
        case 'approver': return { ...f, approver: username }
        default:         return f
      }
    })
    setCurrentPage(1)
    setIsUserLookupOpen(false)
  }

  const filteredUserLOV = usersData ?? []

  // ── Dossier LOV ────────────────────────────────────────────────────────────

  function openDossierLookup() {
    setLovDossierCode('')
    setLovDossierProject('')
    setLovDossierState('')
    setIsDossierLookupOpen(true)
  }

  function selectDossier(dossierCode: string) {
    setFilters((f) => ({ ...f, dossier: dossierCode }))
    setCurrentPage(1)
    setIsDossierLookupOpen(false)
  }

  const filteredDossierLOV = allRecords.filter((r) =>
    (!lovDossierCode || r.DOSSIER_CODE.toLowerCase().includes(lovDossierCode.toLowerCase())) &&
    (!lovDossierProject || r.PROJECT_NAME.toLowerCase().includes(lovDossierProject.toLowerCase())) &&
    (!lovDossierState || r.STATE_CODE === lovDossierState)
  )

  // ── Export ─────────────────────────────────────────────────────────────────

  function doExport(fmt: string) {
    setIsExportOpen(false)
    window.alert(`✔ [EXP.CAPEX_DOSSIER.LIST.EXPORT] Xuất ${filtered.length} hồ sơ định dạng ${fmt.toUpperCase()}\n${filtered.length > 50000 ? 'Đang xử lý bất đồng bộ — sẽ thông báo qua email khi xong.' : 'Đang tải xuống...'}`)
  }

  // ── Auto-focus in modals ───────────────────────────────────────────────────

  useEffect(() => {
    if (isUserLookupOpen) lovUserNameRef.current?.focus()
  }, [isUserLookupOpen])

  useEffect(() => {
    if (isDossierLookupOpen) lovDossierCodeRef.current?.focus()
  }, [isDossierLookupOpen])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape — close dossier lookup if open
      if (e.key === 'Escape') {
        if (isDossierLookupOpen) { setIsDossierLookupOpen(false); return }
        if (isUserLookupOpen) { setIsUserLookupOpen(false); return }
        if (isExportOpen) { setIsExportOpen(false); return }
      }

      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        goToNew()
      }

      if (e.key === 'F5') {
        e.preventDefault()
        resetFilter()
      }

      if (e.key === 'F2') {
        e.preventDefault()
        const r = getSelectedRecord()
        if (r) editRecord(r.id)
      }

      if (e.key === 'F3') {
        e.preventDefault()
        const r = getSelectedRecord()
        if (r) viewRecord(r.id)
      }

      if (e.key === 'F4') {
        e.preventDefault()
        openDossierLookup()
      }

      if (e.key === 'F9') {
        e.preventDefault()
        const r = getSelectedRecord()
        if (r && r.STATE_CODE === 'DRAFT' && r.DOCUMENT_COUNT > 0) submitRecord(r.id, r.DOSSIER_CODE)
        else if (r) window.alert('Cần có chứng từ và trạng thái Đang hoàn thiện để gửi kiểm soát')
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        const r = getSelectedRecord()
        if (r) deleteRecord(r.id)
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        setIsExportOpen(true)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isDossierLookupOpen, isUserLookupOpen, isExportOpen, resetFilter, getSelectedRecord])

  // ── Row click handler ──────────────────────────────────────────────────────

  function handleRowClick(e: React.MouseEvent, id: string) {
    if ((e.target as HTMLElement).closest('.actions-col')) return
    setSelectedRowId(id)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const roleBg = (role: string) => role === 'Approver' ? '#d4edda' : role === 'Checker' ? '#cce5ff' : '#e9ecef'
  const roleColor = (role: string) => role === 'Approver' ? '#155724' : role === 'Checker' ? '#004085' : '#495057'

  if (isLoading) return <div className="page-wrapper"><div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div></div>
  if (isError)   return <div className="page-wrapper"><div style={{ padding: 40, color: 'red' }}>Lỗi tải dữ liệu. Vui lòng thử lại.</div></div>

  return (
    <div className="page-wrapper">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">Quản lý Chi đầu tư / <strong>Danh sách hồ sơ</strong></div>
          <h1 className="page-title">📁 Danh sách hồ sơ Chi đầu tư</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" data-testid="btn-export"
            title="Xuất Excel/PDF/CSV (Ctrl+Shift+E)"
            onClick={() => setIsExportOpen(true)}>
            📥 Xuất <span style={{ fontSize: 10, color: '#999', marginLeft: 2 }}>Ctrl+Shift+E</span>
          </button>
          <button className="btn btn-primary" data-testid="btn-new" data-permission="Maker"
            title="Tạo mới (Ctrl+N)"
            onClick={goToNew}>
            + Tạo mới <span style={{ fontSize: 10, opacity: .75, marginLeft: 2 }}>Ctrl+N</span>
          </button>
        </div>
      </div>

      {/* Search / Filter Card */}
      <div className="card">
        <div className="card-body">
          {/* Quick search row */}
          <div className="search-row">
            <div className="search-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Tìm nhanh</label>
              <div className="input-group">
                <input type="text" className="form-control" data-testid="search-input" data-spec-ref="B2.1"
                  placeholder="🔍 Mã hồ sơ, người lập..."
                  style={{ borderRadius: '4px 0 0 4px' }}
                  value={filters.q}
                  onChange={(e) => { setFilters((f) => ({ ...f, q: e.target.value })); setCurrentPage(1) }} />
              </div>
            </div>

            <div className="search-group">
              <label>Trạng thái</label>
              <select className="form-control" data-testid="filter-state-code" data-spec-ref="B2.1"
                value={filters.st}
                onChange={(e) => { setFilters((f) => ({ ...f, st: e.target.value })); setCurrentPage(1) }}>
                <option value="">Tất cả</option>
                <option value="DRAFT">Đang hoàn thiện</option>
                <option value="PENDING_CHECK">Chờ kiểm soát</option>
                <option value="CHECK_REJECTED">Từ chối kiểm soát</option>
                <option value="CHECK_CANCELLED">Hủy kiểm soát</option>
                <option value="PENDING_APPROVE">Chờ phê duyệt</option>
                <option value="APPROVE_REJECTED">Từ chối phê duyệt</option>
                <option value="APPROVE_CANCELLED">Hủy phê duyệt</option>
                <option value="APPROVED">Đã phê duyệt</option>
              </select>
            </div>

            <div className="search-group">
              <label>Mã hồ sơ</label>
              <div className="input-group">
                <input type="text" className="form-control" data-spec-ref="B2.1"
                  placeholder="Nhập hoặc F4" style={{ minWidth: 140 }}
                  value={filters.dossier}
                  onChange={(e) => { setFilters((f) => ({ ...f, dossier: e.target.value })); setCurrentPage(1) }} />
                <button className="btn-lookup" title="F4" onClick={openDossierLookup}>🔍</button>
              </div>
            </div>

            <div className="search-group">
              <label>Nguồn</label>
              <select className="form-control" data-spec-ref="B2.1"
                value={filters.src}
                onChange={(e) => { setFilters((f) => ({ ...f, src: e.target.value })); setCurrentPage(1) }}>
                <option value="">Tất cả</option>
                <option value="Thủ công">Thủ công</option>
                <option value="DVC">DVC</option>
              </select>
            </div>

            <div className="search-group">
              <label>&nbsp;</label>
              <button className="btn btn-default" onClick={() => setAdvOpen((v) => !v)}>
                Nâng cao {advOpen ? '▲' : '▼'}{' '}
                {advFilterCount > 0 && (
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
                    {advFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="search-group">
              <label>&nbsp;</label>
              <button className="btn btn-primary" data-testid="btn-search" onClick={() => setCurrentPage(1)}>🔍 Tìm kiếm</button>
            </div>

            <div className="search-group">
              <label>&nbsp;</label>
              <button className="btn btn-default" data-testid="btn-reset-filter"
                title="Đặt lại (F5 / Ctrl+R)" onClick={resetFilter}>↺ Đặt lại</button>
            </div>

            <div className="search-group">
              <label>&nbsp;</label>
              <button className="btn btn-default" title="Lưu bộ lọc hiện tại" onClick={saveFilter}>💾 Lưu bộ lọc</button>
            </div>

            {savedFilterExists && (
              <div className="search-group">
                <label>&nbsp;</label>
                <button className="btn btn-default" title="Áp dụng bộ lọc đã lưu" onClick={loadFilter}>📂 Áp dụng lọc đã lưu</button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filter */}
        <div className={`adv-filter-area${advOpen ? ' open' : ''}`}>
          <div className="search-row" style={{ marginBottom: 10 }}>
            <div className="search-group">
              <label>Loại ngày</label>
              <select className="form-control" data-spec-ref="B2.1"
                value={filters.dateType}
                onChange={(e) => setFilters((f) => ({ ...f, dateType: e.target.value }))}>
                <option value="SEND_DATE">Ngày gửi</option>
                <option value="CREATED_DATE">Ngày lập</option>
                <option value="CHECKED_DATE">Ngày kiểm soát</option>
                <option value="APPROVED_DATE">Ngày phê duyệt</option>
              </select>
            </div>

            <div className="search-group">
              <label>Từ ngày</label>
              <input type="text" className="form-control" data-spec-ref="B2.1"
                placeholder="dd/mm/yyyy"
                value={filters.fromDate}
                onChange={(e) => { setFilters((f) => ({ ...f, fromDate: e.target.value })); setCurrentPage(1) }} />
            </div>

            <div className="search-group">
              <label>Đến ngày</label>
              <input type="text" className="form-control" data-spec-ref="B2.1"
                placeholder="dd/mm/yyyy"
                value={filters.toDate}
                onChange={(e) => { setFilters((f) => ({ ...f, toDate: e.target.value })); setCurrentPage(1) }} />
            </div>

            <div className="search-group">
              <label>Mã dự án</label>
              <div className="input-group">
                <input type="text" className="form-control" data-spec-ref="B2.1"
                  placeholder="F4 tra cứu"
                  value={filters.projectId}
                  onChange={(e) => { setFilters((f) => ({ ...f, projectId: e.target.value })); setCurrentPage(1) }} />
                <button className="btn-lookup" title="F4">🔍</button>
              </div>
            </div>

            <div className="search-group">
              <label>Người lập</label>
              <div className="input-group">
                <input type="text" className="form-control" data-spec-ref="B2.1"
                  placeholder="F4 tra cứu"
                  value={filters.creator}
                  onChange={(e) => { setFilters((f) => ({ ...f, creator: e.target.value })); setCurrentPage(1) }} />
                <button className="btn-lookup" title="F4 — Tra cứu người lập"
                  onClick={() => openUserLookup('creator', 'Tra cứu Người lập')}>🔍</button>
              </div>
            </div>

            <div className="search-group">
              <label>Người kiểm soát</label>
              <div className="input-group">
                <input type="text" className="form-control" data-spec-ref="B2.1"
                  placeholder="F4 tra cứu"
                  value={filters.checker}
                  onChange={(e) => { setFilters((f) => ({ ...f, checker: e.target.value })); setCurrentPage(1) }} />
                <button className="btn-lookup" title="F4 — Tra cứu người kiểm soát"
                  onClick={() => openUserLookup('checker', 'Tra cứu Người kiểm soát')}>🔍</button>
              </div>
            </div>

            <div className="search-group">
              <label>Người phê duyệt</label>
              <div className="input-group">
                <input type="text" className="form-control" data-spec-ref="B2.1"
                  placeholder="F4 tra cứu"
                  value={filters.approver}
                  onChange={(e) => { setFilters((f) => ({ ...f, approver: e.target.value })); setCurrentPage(1) }} />
                <button className="btn-lookup" title="F4 — Tra cứu người phê duyệt"
                  onClick={() => openUserLookup('approver', 'Tra cứu Người phê duyệt')}>🔍</button>
              </div>
            </div>

            <div className="search-group" style={{ alignSelf: 'flex-end', gap: 4, flexDirection: 'row' }}>
              <button className="btn btn-default btn-sm" onClick={resetAdvFilter}>Xóa bộ lọc</button>
              <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>🔍 Tìm kiếm</button>
            </div>
          </div>

          {/* Filter tags */}
          <div className="filter-tags">
            {activeTags.map((t) => (
              <div key={t.field} className="filter-tag">
                {t.label}
                <button onClick={() => clearTag(t.field)} title="Xóa bộ lọc">×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="stats-bar" id="stats-bar">
            <div className="stat-item">
              <span className="stat-value" id="stat-total">{stats.total}</span>
              <span className="stat-label">Tổng hồ sơ</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div className="stat-item"><span className="stat-dot" style={{ background: '#6c757d' }} /><span id="stat-draft">{stats.draft}</span> Đang hoàn thiện</div>
            <div className="stat-item"><span className="stat-dot" style={{ background: '#004085' }} /><span id="stat-pending-check">{stats.pendingCheck}</span> Chờ kiểm soát</div>
            <div className="stat-item"><span className="stat-dot" style={{ background: '#0c5460' }} /><span id="stat-pending-approve">{stats.pendingApprove}</span> Chờ phê duyệt</div>
            <div className="stat-item"><span className="stat-dot" style={{ background: '#28a745' }} /><span id="stat-approved">{stats.approved}</span> Đã phê duyệt</div>
            <div className="stat-item"><span className="stat-dot" style={{ background: '#dc3545' }} /><span id="stat-rejected">{stats.rejected}</span> Từ chối</div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div className="stat-item">
              <span style={{ fontWeight: 700, color: 'var(--primary)' }} id="stat-total-vnd">{formatNum(stats.totalVnd)} VND</span>
              <span className="stat-label">Tổng tiền VND</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ marginBottom: 0, borderBottom: 'none', borderRadius: '4px 4px 0 0' }}>
        <div className="card-header">
          <span>Kết quả tìm kiếm</span>
          <select className="page-size-select" title="Số bản ghi/trang"
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1) }}>
            <option value="20">20/trang</option>
            <option value="50">50/trang</option>
            <option value="100">100/trang</option>
            <option value="200">200/trang</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="list-table">
            <thead>
              <tr>
                <th data-api-field="list[].dossierCode" data-spec-ref="B2.2.row1"
                  title="Click để sắp xếp" onClick={() => handleSort('DOSSIER_CODE')}>Mã hồ sơ ↕</th>
                <th data-api-field="list[].sendDate" data-spec-ref="B2.2.row2" onClick={() => handleSort('SEND_DATE')}>Ngày gửi ↕</th>
                <th data-api-field="list[].stateCode" data-spec-ref="B2.2.row3" onClick={() => handleSort('STATE_CODE')}>Trạng thái ↕</th>
                <th data-api-field="list[].createdBy" data-spec-ref="B2.2.row4" onClick={() => handleSort('CREATED_BY')}>Người lập ↕</th>
                <th data-api-field="list[].createdDate" data-spec-ref="B2.2.row5" onClick={() => handleSort('CREATED_DATE')}>Ngày lập ↕</th>
                <th data-api-field="list[].returningReason" data-spec-ref="B2.2.row6"
                  data-conditional-show="hasRejectedDoc"
                  hidden={!showRejectedCol}
                  onClick={() => handleSort('RETURNING_REASON')}>Lý do từ chối tiếp nhận ↕</th>
                <th data-api-field="list[].checkedBy" data-spec-ref="B2.2.row7"
                  data-conditional-show="hasCheckedDoc"
                  hidden={!showCheckedCol}
                  onClick={() => handleSort('CHECKED_BY')}>Người kiểm soát ↕</th>
                <th data-api-field="list[].checkedDate" data-spec-ref="B2.2.row8"
                  data-conditional-show="hasCheckedDoc"
                  hidden={!showCheckedCol}
                  onClick={() => handleSort('CHECKED_DATE')}>Ngày kiểm soát ↕</th>
                <th data-api-field="list[].checkRejectionReason" data-spec-ref="B2.2.row9" className="no-sort">Lý do từ chối/hủy kiểm soát</th>
                <th data-api-field="list[].approvedBy" data-spec-ref="B2.2.row10" className="no-sort">Người phê duyệt</th>
                <th data-api-field="list[].approvedDate" data-spec-ref="B2.2.row11" onClick={() => handleSort('APPROVED_DATE')}>Ngày phê duyệt ↕</th>
                <th data-api-field="list[].approvalRejectionReason" data-spec-ref="B2.2.row12" className="no-sort">Lý do từ chối/hủy phê duyệt</th>
                <th data-field-code="PROJECT_NAME" data-api-field="list[].projectName" data-spec-ref="B2.2.row1b" onClick={() => handleSort('PROJECT_NAME')}>Tên dự án ↕</th>
                <th data-api-field="list[].documentCount" style={{ textAlign: 'center' }} onClick={() => handleSort('DOCUMENT_COUNT')}>Số CT ↕</th>
                <th data-api-field="list[].totalVnd" onClick={() => handleSort('TOTAL_VND')}>Tổng tiền VND ↕</th>
                <th className="no-sort" data-spec-ref="B2.2.rowN" style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody data-testid="list-tbody">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    Không có hồ sơ nào khớp với điều kiện tìm kiếm
                  </td>
                </tr>
              ) : pageData.map((r) => {
                const canEdit = (r.STATE_CODE === 'DRAFT' || r.STATE_CODE === 'CHECK_CANCELLED') && (!currentUser || r.CREATED_BY === currentUser)
                const canDelete = r.STATE_CODE === 'DRAFT' && (!currentUser || r.CREATED_BY === currentUser)
                const isSelected = selectedRowId === r.id
                return (
                  <tr key={r.id} data-record-id={r.id} data-testid={`row-${r.id}`}
                    className={isSelected ? 'row-selected' : ''}
                    onClick={(e) => handleRowClick(e, r.id)}
                    onDoubleClick={() => viewRecord(r.id)}>
                    <td>
                      <span className="table-link" style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); viewRecord(r.id) }}>{r.DOSSIER_CODE}</span>
                    </td>
                    <td>{r.SEND_DATE}</td>
                    <td><span className={`badge badge-${r.STATE_CODE}`}>{STATUS_LABELS[r.STATE_CODE]}</span></td>
                    <td>{r.CREATED_BY}</td>
                    <td>{r.CREATED_DATE}</td>
                    <td hidden={!showRejectedCol} data-conditional-show="hasRejectedDoc">{r.RETURNING_REASON ?? ''}</td>
                    <td hidden={!showCheckedCol} data-conditional-show="hasCheckedDoc">{r.CHECKED_BY ?? ''}</td>
                    <td hidden={!showCheckedCol} data-conditional-show="hasCheckedDoc">{r.CHECKED_DATE ?? ''}</td>
                    <td>{r.CHECK_REJECTION_REASON ?? ''}</td>
                    <td>{r.APPROVED_BY ?? ''}</td>
                    <td>{r.APPROVED_DATE ?? ''}</td>
                    <td>{r.APPROVAL_REJECTION_REASON ?? ''}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.PROJECT_NAME}>{r.PROJECT_NAME}</td>
                    <td style={{ textAlign: 'center' }}>{r.DOCUMENT_COUNT}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNum(r.TOTAL_VND ?? 0)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions-col">
                        <button className="btn btn-ghost btn-sm" title="Xem (F3)"
                          data-testid={`btn-view-${r.id}`}
                          onClick={() => viewRecord(r.id)}>👁 Xem</button>
                        <button className="btn btn-ghost btn-sm"
                          title={canEdit ? 'Sửa (F2)' : 'Chỉ sửa khi Đang hoàn thiện'}
                          data-testid={`btn-edit-${r.id}`}
                          disabled={!canEdit}
                          onClick={() => editRecord(r.id)}>✏ Sửa</button>
                        <button className="btn btn-ghost-danger btn-sm"
                          title={canDelete ? 'Xoá' : 'Chỉ xoá khi Đang hoàn thiện'}
                          data-testid={`btn-delete-${r.id}`}
                          disabled={!canDelete}
                          onClick={() => deleteRecord(r.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={13} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                  Tổng cộng (<span id="footer-count">{filtered.length}</span> hồ sơ):
                </td>
                <td style={{ textAlign: 'center' }}>{filtered.reduce((s, r) => s + (r.DOCUMENT_COUNT ?? 0), 0)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNum(filtered.reduce((s, r) => s + (r.TOTAL_VND ?? 0), 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-row card" style={{ borderTop: 'none', borderRadius: '0 0 4px 4px', marginBottom: 0 }}>
        <div className="pagination-info" id="pagination-info" data-testid="pagination-info">{paginationInfo}</div>
        <div className="pagination-controls">
          <button className="page-btn" id="btn-first" disabled={safeCurrentPage <= 1}
            data-testid="pagination-first" onClick={() => goToPage(1)} title="Trang đầu">«</button>
          <button className="page-btn" id="btn-prev" disabled={safeCurrentPage <= 1}
            data-testid="pagination-prev" onClick={() => goToPage(safeCurrentPage - 1)}>‹ Trước</button>
          <span style={{ display: 'flex', gap: 3 }}>
            {pageButtons().map((p) => (
              <button key={p} className={`page-btn${p === safeCurrentPage ? ' active' : ''}`}
                onClick={() => goToPage(p)}>{p}</button>
            ))}
          </span>
          <button className="page-btn" id="btn-next" disabled={safeCurrentPage >= totalPages}
            data-testid="pagination-next" onClick={() => goToPage(safeCurrentPage + 1)}>Sau ›</button>
          <button className="page-btn" id="btn-last" disabled={safeCurrentPage >= totalPages}
            data-testid="pagination-last" onClick={() => goToPage(totalPages)} title="Trang cuối">»</button>
        </div>
      </div>

      {/* User Lookup Dialog */}
      {isUserLookupOpen && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 80 }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsUserLookupOpen(false) }}>
          <div className="modal" style={{ minWidth: 520, maxWidth: 640, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span style={{ fontSize: 16 }}>👤</span>
              <span className="modal-title" id="user-lookup-title">{userLookupTitle}</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                onClick={() => setIsUserLookupOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="search-group" style={{ flex: 1, minWidth: 160 }}>
                  <label>Tên / Username</label>
                  <input type="text" className="form-control" ref={lovUserNameRef}
                    placeholder="Tìm chứa" value={lovUserName}
                    onChange={(e) => setLovUserName(e.target.value)} />
                </div>
                <div className="search-group" style={{ minWidth: 130 }}>
                  <label>Vai trò</label>
                  <select className="form-control" value={lovUserRole}
                    onChange={(e) => setLovUserRole(e.target.value)}>
                    <option value="">Tất cả</option>
                    <option value="Maker">Maker</option>
                    <option value="Checker">Checker</option>
                    <option value="Approver">Approver</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Username</th>
                    <th>Họ tên</th>
                    <th>Vai trò</th>
                    <th>Đơn vị</th>
                  </tr>
                </thead>
                <tbody id="lov-user-tbody">
                  {filteredUserLOV.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không có kết quả</td></tr>
                  ) : filteredUserLOV.map((u) => (
                    <tr key={u.username} style={{ cursor: 'pointer' }}
                      onClick={() => selectUserLOV(u.username)}>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{u.username}</td>
                      <td>{u.fullname}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, background: roleBg(u.role), color: roleColor(u.role), padding: '2px 8px', borderRadius: 10 }}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }} id="lov-user-count">{filteredUserLOV.length} kết quả</span>
              <button className="btn btn-default" onClick={() => setIsUserLookupOpen(false)}>Đóng (Esc)</button>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Lookup Dialog */}
      {isDossierLookupOpen && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 80 }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsDossierLookupOpen(false) }}>
          <div className="modal" style={{ minWidth: 640, maxWidth: 800, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span style={{ fontSize: 16 }}>📁</span>
              <span className="modal-title">
                Tra cứu Hồ sơ <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(F4)</span>
              </span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                onClick={() => setIsDossierLookupOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '12px 20px' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="search-group" style={{ flex: 1, minWidth: 160 }}>
                  <label>Mã hồ sơ</label>
                  <input type="text" className="form-control" ref={lovDossierCodeRef}
                    placeholder="Tìm chứa" value={lovDossierCode}
                    onChange={(e) => setLovDossierCode(e.target.value)} />
                </div>
                <div className="search-group" style={{ flex: 2, minWidth: 200 }}>
                  <label>Tên dự án</label>
                  <input type="text" className="form-control"
                    placeholder="Tìm chứa" value={lovDossierProject}
                    onChange={(e) => setLovDossierProject(e.target.value)} />
                </div>
                <div className="search-group" style={{ minWidth: 150 }}>
                  <label>Trạng thái</label>
                  <select className="form-control" value={lovDossierState}
                    onChange={(e) => setLovDossierState(e.target.value)}>
                    <option value="">Tất cả</option>
                    <option value="DRAFT">Đang hoàn thiện</option>
                    <option value="PENDING_CHECK">Chờ kiểm soát</option>
                    <option value="PENDING_APPROVE">Chờ phê duyệt</option>
                    <option value="APPROVED">Đã phê duyệt</option>
                    <option value="CHECK_REJECTED">KS từ chối</option>
                    <option value="APPROVE_REJECTED">PD từ chối</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Mã hồ sơ</th>
                    <th>Dự án</th>
                    <th>Trạng thái</th>
                    <th>Người lập</th>
                  </tr>
                </thead>
                <tbody id="lov-dossier-tbody">
                  {filteredDossierLOV.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không có kết quả</td></tr>
                  ) : filteredDossierLOV.map((r) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }}
                      onClick={() => selectDossier(r.DOSSIER_CODE)}>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.DOSSIER_CODE}</td>
                      <td>{r.PROJECT_NAME}</td>
                      <td><span className={`badge badge-${r.STATE_CODE}`}>{BADGE_LABEL[r.STATE_CODE] ?? r.STATE_CODE}</span></td>
                      <td>{r.CREATED_BY}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }} id="lov-dossier-count">{filteredDossierLOV.length} kết quả</span>
              <button className="btn btn-default" onClick={() => setIsDossierLookupOpen(false)}>Đóng (Esc)</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {isExportOpen && (
        <div className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsExportOpen(false) }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span style={{ fontSize: 16 }}>📥</span>
              <span className="modal-title">Xuất dữ liệu</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Chọn định dạng xuất (<span id="export-count">{filtered.length}</span> hồ sơ khớp bộ lọc):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-default" style={{ justifyContent: 'flex-start', gap: 12 }} onClick={() => doExport('excel')}>
                  <span style={{ fontSize: 18 }}>📊</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 600 }}>Excel (.xlsx)</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phù hợp để chỉnh sửa và tổng hợp</div></div>
                </button>
                <button className="btn btn-default" style={{ justifyContent: 'flex-start', gap: 12 }} onClick={() => doExport('pdf')}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 600 }}>PDF</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>In ấn và lưu trữ chính thức</div></div>
                </button>
                <button className="btn btn-default" style={{ justifyContent: 'flex-start', gap: 12 }} onClick={() => doExport('csv')}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 600 }}>CSV</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tích hợp với các hệ thống khác</div></div>
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                * Nếu &gt; 50.000 bản ghi: xuất bất đồng bộ, thông báo qua email khi hoàn thành
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setIsExportOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormList
