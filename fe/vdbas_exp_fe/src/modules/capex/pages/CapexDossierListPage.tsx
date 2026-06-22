import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { message } from 'antd'
import './CapexDossierListPage.css'
import { useNavigation } from '@/contexts/NavigationContext'
import { DossierHooks } from '@/modules/capex/hooks/useDossier'
import { getDossier, exportDossiers, newIdempotencyKey } from '@/modules/capex/services/dossierService'
import type {
  DossierSummary, DossierListParams, DossierStatus, DataSourceCode,
  DossierSortBy, SortDir, DossierDateField, ExportDossiersParams,
} from '@/types/index'

// ── Types ─────────────────────────────────────────────────────────────────────

// Hàng hiển thị trên grid — adapter map từ DossierSummary (camelCase) sang
// các field UPPER_SNAKE mà render code đang dùng (giữ nguyên UI prototype).
interface DossierRecord {
  id: string
  DOSSIER_CODE: string
  PROJECT_CODE: string
  PROJECT_NAME: string
  DATA_SOURCE_CODE: string
  SEND_DATE: string
  F_STATUS: string
  ASSIGN_USER: string
  CREATED_BY: string
  CREATED_DATE: string
  DOCUMENT_COUNT: number
  TOTAL_LOCAL_AMOUNT: number
}

type BtnState = 'show' | 'hide' | 'disable'

interface BtnRule {
  EDIT: BtnState
  DELETE: BtnState
  SUBMIT: BtnState
  APPROVE: BtnState
  REJECT: BtnState
  COPY: BtnState
}

interface ColConfig {
  key: string
  label: string
  width: number
  sortable: boolean
  hideable: boolean
  frozen?: boolean
  visible: boolean
  _version?: string
}

interface FilterInputs {
  docId: string
  projectId: string
  search: string
  dateField: string
  fromDate: string
  toDate: string
  createdBy: string
}

interface CommittedFilters {
  filters: FilterInputs
  status: string[]
  source: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20 // contract: pageSize ∈ [20,50,100,200]
const COL_STORAGE_KEY = 'CHI_CAPEX_DOSSIER_COL_CONFIG'
const COL_VERSION = 'v2'
const FILTER_STATE_KEY = 'CHI_CAPEX_DOSSIER_FILTER_STATE'

// nhãn TV (UI) → code enum contract
const SOURCE_LABEL_TO_CODE: Record<string, DataSourceCode> = { 'Thủ công': 'THU_CONG', 'DVC': 'DVC' }

const DEFAULT_FILTERS: FilterInputs = {
  docId: '', projectId: '', search: '',
  dateField: 'SEND_DATE', fromDate: '', toDate: '', createdBy: '',
}

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: 'STT',                label: 'STT',              width: 48,  sortable: false, hideable: false, visible: true },
  { key: 'DOSSIER_CODE',       label: 'Mã hồ sơ',         width: 150, sortable: true,  hideable: false, visible: true },
  { key: 'PROJECT_CODE',       label: 'Mã dự án',         width: 110, sortable: true,  hideable: true,  visible: true },
  { key: 'DATA_SOURCE_CODE',   label: 'Nguồn gốc',        width: 100, sortable: true,  hideable: true,  visible: true },
  { key: 'SEND_DATE',          label: 'Ngày gửi',         width: 100, sortable: true,  hideable: true,  visible: true },
  { key: 'F_STATUS',           label: 'Trạng thái',       width: 140, sortable: true,  hideable: true,  visible: true },
  { key: 'CREATED_BY',         label: 'Người lập',        width: 120, sortable: true,  hideable: true,  visible: true },
  { key: 'CREATED_DATE',       label: 'Ngày lập',         width: 150, sortable: true,  hideable: true,  visible: true },
  { key: 'PROJECT_NAME',       label: 'Dự án/Công trình', width: 220, sortable: true,  hideable: true,  visible: true },
  { key: 'DOCUMENT_COUNT',     label: 'Số CT',            width: 70,  sortable: true,  hideable: true,  visible: true },
  { key: 'TOTAL_LOCAL_AMOUNT', label: 'Tổng tiền VND',    width: 150, sortable: true,  hideable: true,  visible: true },
  { key: 'ACTIONS',            label: 'Thao tác',         width: 390, sortable: false, hideable: false, frozen: true, visible: true },
]

// Cột grid (UPPER_SNAKE) → sortBy enum contract
const SORT_FIELD_MAP: Record<string, DossierSortBy> = {
  DOSSIER_CODE: 'DOSSIER_CODE',
  PROJECT_CODE: 'PROJECT_CODE',
  SEND_DATE: 'SEND_DATE',
  CREATED_DATE: 'CREATED_DATE',
  F_STATUS: 'F_STATUS',
}

const STATUS_DEF: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Lưu nháp',         cls: 'bd' },
  SAVED:     { label: 'Đã lưu',           cls: 'bd' },
  VALIDATED: { label: 'Đã kiểm tra',      cls: 'bs' },
  SUBMITTED: { label: 'Đã gửi kiểm soát', cls: 'bs' },
  APPROVED:  { label: 'Đã phê duyệt',     cls: 'bg' },
  REJECTED:  { label: 'Đã từ chối',       cls: 'br' },
  COMPLETED: { label: 'Hoàn thành',       cls: 'bg' },
  CANCELLED: { label: 'Đã huỷ',           cls: 'bo' },
}

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: '⚪ Lưu nháp' },
  { value: 'SAVED',     label: '💾 Đã lưu' },
  { value: 'VALIDATED', label: '🔎 Đã kiểm tra' },
  { value: 'SUBMITTED', label: '🔵 Đã gửi kiểm soát' },
  { value: 'APPROVED',  label: '🟢 Đã phê duyệt / Đã kiểm soát' },
  { value: 'REJECTED',  label: '🔴 Đã từ chối' },
  { value: 'COMPLETED', label: '✅ Hoàn thành' },
  { value: 'CANCELLED', label: '🚫 Đã huỷ' },
]
const ALL_STATUS_VALUES = STATUS_OPTIONS.map(o => o.value)
const ALL_SOURCE_VALUES = ['Thủ công', 'DVC']

const BTN_MATRIX: Record<string, BtnRule> = {
  DRAFT:     { EDIT: 'show', DELETE: 'show',    SUBMIT: 'show', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  SAVED:     { EDIT: 'show', DELETE: 'show',    SUBMIT: 'show', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  VALIDATED: { EDIT: 'show', DELETE: 'show',    SUBMIT: 'show', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  SUBMITTED: { EDIT: 'hide', DELETE: 'hide',    SUBMIT: 'hide', APPROVE: 'show', REJECT: 'show', COPY: 'hide' },
  APPROVED:  { EDIT: 'hide', DELETE: 'hide',    SUBMIT: 'hide', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  REJECTED:  { EDIT: 'show', DELETE: 'show',    SUBMIT: 'show', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  COMPLETED: { EDIT: 'hide', DELETE: 'hide',    SUBMIT: 'hide', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
  CANCELLED: { EDIT: 'hide', DELETE: 'disable', SUBMIT: 'hide', APPROVE: 'hide', REJECT: 'hide', COPY: 'show' },
}

// ── Pure helpers (outside component) ─────────────────────────────────────────

/** yyyy-MM-dd hoặc ISO date-time → dd/mm/yyyy để hiển thị. */
function isoToDisplay(s: string | null | undefined): string {
  if (!s) return ''
  const datePart = String(s).split('T')[0]
  const p = datePart.split('-')
  if (p.length < 3) return String(s)
  return `${p[2]}/${p[1]}/${p[0]}`
}

/** DossierSummary (contract) → DossierRecord (UI). */
function toRow(s: DossierSummary): DossierRecord {
  return {
    id: s.id,
    DOSSIER_CODE: s.dossierCode,
    PROJECT_CODE: s.projectCode,
    PROJECT_NAME: s.projectName,
    DATA_SOURCE_CODE: s.dataSourceName || s.dataSourceCode,
    SEND_DATE: isoToDisplay(s.sendDate),
    F_STATUS: s.fStatus,
    ASSIGN_USER: '', // không có trong summary — sub-state APPROVED chỉ dựa F_STATUS
    CREATED_BY: s.createdBy,
    CREATED_DATE: isoToDisplay(s.createdDate),
    DOCUMENT_COUNT: s.documentCount,
    TOTAL_LOCAL_AMOUNT: s.totalBaseAmount,
  }
}

function uiStatus(r: DossierRecord): { label: string; cls: string } {
  return STATUS_DEF[r.F_STATUS] ?? { label: r.F_STATUS, cls: 'bd' }
}

function btnRule(r: DossierRecord): BtnRule {
  return BTN_MATRIX[r.F_STATUS] ?? BTN_MATRIX.DRAFT
}

function fmtAmt(n: number | null | undefined): string {
  return n != null ? n.toLocaleString('vi-VN') : '—'
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function loadColConfig(): ColConfig[] {
  try {
    const saved = localStorage.getItem(COL_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ColConfig[]
      if (parsed[0]?._version !== COL_VERSION) {
        localStorage.removeItem(COL_STORAGE_KEY)
        return DEFAULT_COLUMNS.map(c => ({ ...c, visible: true }))
      }
      const realCols = parsed.filter(c => c.key)
      const merged = realCols
        .filter(c => DEFAULT_COLUMNS.find(d => d.key === c.key))
        .map(c => ({ ...DEFAULT_COLUMNS.find(d => d.key === c.key)!, ...c }))
      DEFAULT_COLUMNS.forEach(d => {
        if (!merged.find(c => c.key === d.key)) merged.push({ ...d, visible: true })
      })
      return merged
    }
  } catch { /* ignore malformed config */ void 0 }
  return DEFAULT_COLUMNS.map(c => ({ ...c, visible: true }))
}

/** Commit filter (UI) → query params contract. */
function buildListParams(
  committed: CommittedFilters | null,
  page: number,
  sortField: string,
  sortDir: 'asc' | 'desc',
): DossierListParams {
  const p: DossierListParams = {
    page,                         // 1-based theo contract
    pageSize: PAGE_SIZE,
    sortBy: SORT_FIELD_MAP[sortField] ?? 'CREATED_DATE',
    sortDir: sortDir.toUpperCase() as SortDir,
  }
  if (!committed) return p
  const { filters: f, status, source } = committed
  if (f.docId) p.dossierCode = f.docId
  if (f.projectId) p.projectCode = f.projectId
  if (f.search) p.search = f.search
  if (f.createdBy) p.createdBy = f.createdBy
  if (f.fromDate || f.toDate) {
    p.dateField = f.dateField as DossierDateField
    if (f.fromDate) p.fromDate = f.fromDate
    if (f.toDate) p.toDate = f.toDate
  }
  if (status.length) p.fStatus = status as DossierStatus[]
  if (source.length) p.dataSourceCode = source.map(s => SOURCE_LABEL_TO_CODE[s] ?? (s as DataSourceCode))
  return p
}

// ── Component ─────────────────────────────────────────────────────────────────

const CapexDossierListPage: React.FC = () => {
  const { navigate } = useNavigation()

  const [hasSearched, setHasSearched] = useState(false)
  const [committed, setCommitted] = useState<CommittedFilters | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [sortField, setSortField] = useState('CREATED_DATE')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [inputFilters, setInputFilters] = useState<FilterInputs>(DEFAULT_FILTERS)
  const [dateRangeError, setDateRangeError] = useState(false)

  const [multiSelect, setMultiSelect] = useState<{ status: string[]; source: string[] }>({ status: [], source: [] })
  const [msOpen, setMsOpen] = useState<{ status: boolean; source: boolean }>({ status: false, source: false })

  const [advOpen, setAdvOpen] = useState(false)

  const [colConfig, setColConfig] = useState<ColConfig[]>(loadColConfig)
  const [colConfigOpen, setColConfigOpen] = useState(false)

  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const colConfigRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null)
  const dragColRef = useRef<string | null>(null)
  const filterStateRef = useRef({ hasSearched, inputFilters, multiSelect, advOpen, currentPage })

  useEffect(() => {
    filterStateRef.current = { hasSearched, inputFilters, multiSelect, advOpen, currentPage }
  }, [hasSearched, inputFilters, multiSelect, advOpen, currentPage])

  // ── Server query ─────────────────────────────────────────────────────────────
  const queryParams = useMemo(
    () => buildListParams(committed, currentPage, sortField, sortDir),
    [committed, currentPage, sortField, sortDir],
  )
  const { data, isLoading, isError } = DossierHooks.useList(queryParams, hasSearched)

  const rows = useMemo(() => (data?.items ?? []).map(toRow), [data])
  const totalRecords = data?.pagination?.totalRecords ?? 0
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1)
  const pageData = useMemo(() => ({ rows, start: (currentPage - 1) * PAGE_SIZE }), [rows, currentPage])

  // ── Mutations ────────────────────────────────────────────────────────────────
  const submitMutation = DossierHooks.useSubmit()

  // ── showToast ──────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2200)
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleResetFilterRef = useRef<() => void>(() => {})
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        navigate('/capex-dossiers/detail', { mode: 'new' })
      }
      if (e.key === 'F5') {
        e.preventDefault()
        handleResetFilterRef.current()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Close multi-select on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.multi-select-wrap')) {
        setMsOpen({ status: false, source: false })
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // ── Close col-config dropdown on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!colConfigRef.current?.contains(e.target as Node)) {
        setColConfigOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Column resize — document-level mouse events ───────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const newW = Math.max(60, resizingRef.current.startW + e.clientX - resizingRef.current.startX)
      setColConfig(prev => prev.map(c => c.key === resizingRef.current!.key ? { ...c, width: newW } : c))
    }
    const onUp = () => {
      if (!resizingRef.current) return
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      resizingRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  // ── sessionStorage — save on beforeunload ─────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const s = filterStateRef.current
      if (!s.hasSearched) return
      sessionStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
        source: s.multiSelect.source,
        statuses: s.multiSelect.status,
        ...s.inputFilters,
        advOpen: s.advOpen,
        currentPage: s.currentPage,
      }))
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── sessionStorage — restore on mount ────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(FILTER_STATE_KEY)
    if (!saved) return
    sessionStorage.removeItem(FILTER_STATE_KEY)
    try {
      const s = JSON.parse(saved)
      const restoredFilters: FilterInputs = {
        docId: s.docId ?? '',
        projectId: s.projectId ?? '',
        search: s.search ?? '',
        dateField: s.dateField ?? 'SEND_DATE',
        fromDate: s.fromDate ?? '',
        toDate: s.toDate ?? '',
        createdBy: s.createdBy ?? '',
      }
      const restoredMs = {
        status: s.statuses ?? [],
        source: s.source ?? [],
      }
      setInputFilters(restoredFilters)
      setMultiSelect(restoredMs)
      if (s.advOpen) setAdvOpen(true)
      setCommitted({ filters: restoredFilters, status: restoredMs.status, source: restoredMs.source })
      setHasSearched(true)
      setCurrentPage(s.currentPage ?? 1)
    } catch { /* ignore malformed sessionStorage */ void 0 }
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────
  function handleSearch() {
    if (inputFilters.fromDate && inputFilters.toDate && inputFilters.toDate < inputFilters.fromDate) {
      setDateRangeError(true)
      return
    }
    setDateRangeError(false)
    setCommitted({ filters: inputFilters, status: multiSelect.status, source: multiSelect.source })
    setHasSearched(true)
    setCurrentPage(1)
  }

  function handleResetFilter() {
    setInputFilters(DEFAULT_FILTERS)
    setMultiSelect({ status: [], source: [] })
    setDateRangeError(false)
    setHasSearched(false)
    setCommitted(null)
  }
  // Keep ref up to date so the keydown handler always calls the latest version
  handleResetFilterRef.current = handleResetFilter

  // ── Sort (server-side) ──────────────────────────────────────────────────────
  function handleSort(field: string) {
    if (!SORT_FIELD_MAP[field]) return
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
    setCurrentPage(1)
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  function goPage(p: number) {
    if (p < 1 || p > totalPages) return
    setCurrentPage(p)
  }

  // ── Stats (từ statusCounts + totalBaseAmount server) ────────────────────────
  const stats = useMemo(() => {
    const groups: Record<string, { count: number; cls: string }> = {}
    ;(data?.statusCounts ?? []).forEach(sc => {
      const def = STATUS_DEF[sc.status]
      const label = sc.statusName || def?.label || sc.status
      groups[label] = { count: sc.count, cls: def?.cls ?? 'bd' }
    })
    return { groups, totalVnd: data?.totalBaseAmount ?? 0, total: totalRecords }
  }, [data, totalRecords])

  // ── Column config ─────────────────────────────────────────────────────────
  function saveColConfig() {
    const payload = [{ _version: COL_VERSION } as ColConfig, ...colConfig]
    localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(payload))
    showToast('✅ Đã lưu cấu hình cột')
  }

  function resetColConfig() {
    localStorage.removeItem(COL_STORAGE_KEY)
    setColConfig(DEFAULT_COLUMNS.map(c => ({ ...c, visible: true })))
    showToast('↺ Đã đặt lại về mặc định')
  }

  // ── Column resize ─────────────────────────────────────────────────────────
  function handleResizeMouseDown(key: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const col = colConfig.find(c => c.key === key)
    if (!col) return
    resizingRef.current = { key, startX: e.clientX, startW: col.width }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // ── Column DnD ────────────────────────────────────────────────────────────
  function handleColDragStart(key: string, e: React.DragEvent) {
    dragColRef.current = key
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', key)
  }

  function handleColDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleColDrop(key: string, e: React.DragEvent) {
    e.preventDefault()
    const fromKey = e.dataTransfer.getData('text/plain')
    if (!fromKey || fromKey === key) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const insertBefore = e.clientX < rect.left + rect.width / 2
    setColConfig(prev => {
      const cols = [...prev]
      const fromIdx = cols.findIndex(c => c.key === fromKey)
      const [moved] = cols.splice(fromIdx, 1)
      const toIdx = cols.findIndex(c => c.key === key)
      cols.splice(insertBefore ? toIdx : toIdx + 1, 0, moved)
      return cols
    })
    dragColRef.current = null
  }

  function handleColDragEnd() {
    dragColRef.current = null
  }

  // ── Row actions ───────────────────────────────────────────────────────────
  function handleRowClick(id: string) {
    navigate('/capex-dossiers/detail', { id, mode: 'view' })
  }

  // Gửi kiểm soát từ grid: fetch detail để lấy version → submit (optimistic lock).
  async function handleConfirmSubmit(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('Xác nhận gửi kiểm soát hồ sơ này?')) return
    try {
      const detail = await getDossier(id)
      await submitMutation.mutateAsync({ id, body: { version: detail.version }, idemKey: newIdempotencyKey() })
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Gửi kiểm soát thất bại')
    }
  }

  function handleCopyRecord(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigate('/capex-dossiers/detail', { copy: id, mode: 'new' })
  }

  async function handleExport() {
    try {
      const base = buildListParams(committed, 1, sortField, sortDir)
      const params: ExportDossiersParams = { format: 'EXCEL' }
      if (base.dossierCode) params.dossierCode = base.dossierCode
      if (base.projectCode) params.projectCode = base.projectCode
      if (base.fromDate) params.fromDate = base.fromDate
      if (base.toDate) params.toDate = base.toDate
      if (base.fStatus) params.fStatus = base.fStatus
      if (base.dataSourceCode) params.dataSourceCode = base.dataSourceCode
      const blob = await exportDossiers(params)
      downloadBlob(blob, 'capex-dossiers.xlsx')
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Xuất dữ liệu thất bại')
    }
  }

  // ── Multi-select label ────────────────────────────────────────────────────
  function getMsLabel(name: 'status' | 'source'): React.ReactNode {
    const sel = multiSelect[name]
    if (sel.length === 0) {
      const empty = name === 'status' ? '-- Tất cả trạng thái --' : '-- Tất cả nguồn --'
      return <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empty}</span>
    }
    const text = name === 'status'
      ? sel.map(v => STATUS_DEF[v]?.label ?? v).join(', ')
      : sel.join(', ')
    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderCell(col: ColConfig, r: DossierRecord, stt: number): React.ReactNode {
    switch (col.key) {
      case 'STT':
        return <td key={col.key} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{stt}</td>
      case 'DOSSIER_CODE':
        return (
          <td key={col.key}>
            <a
              className="btn-link"
              href="#"
              onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/capex-dossiers/detail', { id: r.id, mode: 'view' }) }}
              data-testid={`link-${r.id}`}
            >
              {r.DOSSIER_CODE ?? '—'}
            </a>
          </td>
        )
      case 'PROJECT_CODE':
        return <td key={col.key}>{r.PROJECT_CODE ?? '—'}</td>
      case 'DATA_SOURCE_CODE':
        return (
          <td key={col.key}>
            {r.DATA_SOURCE_CODE === 'Thủ công'
              ? <span className="src-chip src-m">Thủ công</span>
              : <span className="src-chip src-a">{r.DATA_SOURCE_CODE ?? '—'}</span>}
          </td>
        )
      case 'SEND_DATE':
        return <td key={col.key}>{r.SEND_DATE ?? '—'}</td>
      case 'F_STATUS': {
        const s = uiStatus(r)
        return <td key={col.key}><span className={`badge ${s.cls}`}>{s.label}</span></td>
      }
      case 'CREATED_BY':
        return <td key={col.key}>{r.CREATED_BY ?? '—'}</td>
      case 'CREATED_DATE':
        return <td key={col.key}>{r.CREATED_DATE ?? '—'}</td>
      case 'PROJECT_NAME':
        return <td key={col.key} className="cell-overflow" title={r.PROJECT_NAME ?? ''}>{r.PROJECT_NAME ?? '—'}</td>
      case 'DOCUMENT_COUNT':
        return <td key={col.key} style={{ textAlign: 'center' }}>{r.DOCUMENT_COUNT != null ? r.DOCUMENT_COUNT : '—'}</td>
      case 'TOTAL_LOCAL_AMOUNT':
        return <td key={col.key} className="amount"><strong>{fmtAmt(r.TOTAL_LOCAL_AMOUNT)}</strong></td>
      case 'ACTIONS':
        return renderActionCell(r)
      default:
        return <td key={col.key}>—</td>
    }
  }

  function renderActionCell(r: DossierRecord): React.ReactNode {
    const rule = btnRule(r)
    return (
      <td key="ACTIONS" className="col-actions" onClick={e => e.stopPropagation()}>
        <div className="action-group">
          <button className="btn btn-ghost" onClick={() => navigate('/capex-dossiers/detail', { id: r.id, mode: 'view' })} data-event-id="EXP.CAPEX_DOSSIER.VIEW.OPEN">👁 Xem</button>
          {rule.EDIT !== 'hide' && (
            <button
              className="btn btn-ghost"
              disabled={rule.EDIT === 'disable'}
              onClick={() => navigate('/capex-dossiers/detail', { id: r.id, mode: 'edit' })}
              data-event-id="EXP.CAPEX_DOSSIER.EDIT.OPEN"
            >✏️ Sửa</button>
          )}
          {rule.SUBMIT !== 'hide' && (
            <button
              className="btn btn-ghost"
              disabled={rule.SUBMIT === 'disable' || submitMutation.isPending}
              onClick={e => handleConfirmSubmit(r.id, e)}
              data-event-id="EXP.CAPEX_DOSSIER.NEW.SUBMIT"
            >📤 Gửi PD</button>
          )}
          {rule.APPROVE !== 'hide' && (
            <button className="btn btn-ghost" onClick={() => navigate('/capex-dossiers/detail', { id: r.id, mode: 'view' })} data-event-id="EXP.CAPEX_DOSSIER.APPROVE">✅ Duyệt</button>
          )}
          {rule.REJECT !== 'hide' && (
            <button className="btn btn-ghost" onClick={() => navigate('/capex-dossiers/detail', { id: r.id, mode: 'view' })} data-event-id="EXP.CAPEX_DOSSIER.REJECT">✖ Từ chối</button>
          )}
          {rule.COPY !== 'hide' && (
            <button
              className="btn btn-ghost"
              disabled={rule.COPY === 'disable'}
              onClick={e => handleCopyRecord(r.id, e)}
              data-event-id="EXP.CAPEX_DOSSIER.NEW.COPY"
            >📋 Copy</button>
          )}
          {rule.DELETE !== 'hide' && (
            <button
              className="btn btn-ghost danger"
              disabled={rule.DELETE === 'disable'}
              onClick={() => navigate('/capex-dossiers/detail', { id: r.id, mode: 'view' })}
              data-event-id="EXP.CAPEX_DOSSIER.DELETE.OPEN"
            >🗑 Xoá</button>
          )}
        </div>
      </td>
    )
  }

  function renderTableHeader() {
    return (
      <tr id="col-header-row">
        {colConfig.filter(c => c.visible).map(col => {
          const isSorted = sortField === col.key
          const thClass = [
            col.sortable ? 'sortable' : '',
            col.frozen ? 'col-actions' : '',
            isSorted ? sortDir : '',
          ].filter(Boolean).join(' ')
          return (
            <th
              key={col.key}
              data-col-key={col.key}
              className={thClass || undefined}
              style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
              draggable={!col.frozen}
              onDragStart={col.frozen ? undefined : e => handleColDragStart(col.key, e)}
              onDragOver={col.frozen ? undefined : handleColDragOver}
              onDrop={col.frozen ? undefined : e => handleColDrop(col.key, e)}
              onDragEnd={handleColDragEnd}
              onClick={col.sortable ? () => handleSort(col.key) : undefined}
            >
              {col.label}
              {col.sortable && <span className="si">⇅</span>}
              {!col.frozen && (
                <div
                  className="col-resize-handle"
                  data-col-key={col.key}
                  onMouseDown={e => handleResizeMouseDown(col.key, e)}
                />
              )}
            </th>
          )
        })}
      </tr>
    )
  }

  function renderPagination() {
    const s = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    const e = Math.min(currentPage * PAGE_SIZE, totalRecords)
    const buttons: React.ReactNode[] = []
    buttons.push(
      <button key="prev" className="pg-btn" onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
    )
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        buttons.push(
          <button key={i} className={`pg-btn${i === currentPage ? ' active' : ''}`} onClick={() => goPage(i)}>{i}</button>
        )
      } else if (Math.abs(i - currentPage) === 3) {
        buttons.push(
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
        )
      }
    }
    buttons.push(
      <button key="next" className="pg-btn" onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
    )
    return (
      <div className="pagination" id="pagination">
        <div className="pg-info" id="pg-info">Hiển thị {s}–{e} / {totalRecords} bản ghi</div>
        <div className="pg-btns" id="pg-btns">{buttons}</div>
      </div>
    )
  }

  const viewMode = !hasSearched
    ? 'initial'
    : (!isLoading && rows.length === 0 ? 'no-result' : 'table')

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* App header */}
      <div className="app-header">
        <div className="app-header-left">
          <div className="breadcrumb">Quản lý chi › Quản lý chi đầu tư</div>
          <h1>EXP.CAPEX_DOSSIER — Danh sách hồ sơ Chi đầu tư</h1>
        </div>
        <div className="app-header-actions">
          <button
            className="btn-header-default"
            onClick={handleExport}
            disabled
            title="BE chưa hỗ trợ endpoint export (GET /exp/capex/dossiers/export) — tạm khóa"
            data-testid="btn-export"
            data-event-id="EXP.CAPEX_DOSSIER.LIST.EXPORT"
          >
            📥 Xuất
          </button>
          <button
            className="btn-header-primary"
            id="btn-create-new"
            data-testid="btn-create-new"
            data-event-id="EXP.CAPEX_DOSSIER.NEW.OPEN"
            onClick={() => navigate('/capex-dossiers/detail', { mode: 'new' })}
          >
            + Tạo mới hồ sơ
          </button>
        </div>
      </div>

      <div className="main">

        {/* ═══ FILTER CARD ═══ */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔍 Bộ lọc tìm kiếm</span>
          </div>
          <div className="card-body">

            {/* ── Basic filters ── */}
            <div className="filter-grid" id="filter-basic">
              <div className="filter-section-label">Điều kiện chính</div>

              {/* DATA_SOURCE_CODE — multi-select */}
              <div className="form-group" id="grp-source" data-field="DATA_SOURCE_CODE" data-spec-ref="B2.row1">
                <label>Nguồn</label>
                <div className="multi-select-wrap" id="ms-wrap-source">
                  <div
                    className={`ms-trigger${msOpen.source ? ' open' : ''}`}
                    id="ms-trigger-source"
                    onClick={() => setMsOpen(p => ({ ...p, source: !p.source }))}
                    data-testid="filter-source"
                  >
                    {getMsLabel('source')}
                    <span>▾</span>
                  </div>
                  {msOpen.source && (
                    <div className="ms-dropdown open" id="ms-dropdown-source">
                      <div className="ms-option">
                        <input
                          type="checkbox" value="Thủ công" id="ms-src-manual"
                          checked={multiSelect.source.includes('Thủ công')}
                          onChange={e => setMultiSelect(p => ({
                            ...p,
                            source: e.target.checked ? [...p.source, 'Thủ công'] : p.source.filter(v => v !== 'Thủ công'),
                          }))}
                        />
                        <label htmlFor="ms-src-manual">
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#531dab', display: 'inline-block', flexShrink: 0 }} /> Thủ công
                        </label>
                      </div>
                      <div className="ms-option">
                        <input
                          type="checkbox" value="DVC" id="ms-src-dvc"
                          checked={multiSelect.source.includes('DVC')}
                          onChange={e => setMultiSelect(p => ({
                            ...p,
                            source: e.target.checked ? [...p.source, 'DVC'] : p.source.filter(v => v !== 'DVC'),
                          }))}
                        />
                        <label htmlFor="ms-src-dvc">
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#006d75', display: 'inline-block', flexShrink: 0 }} /> DVC
                        </label>
                      </div>
                      <div className="ms-actions" style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border, #eee)', marginTop: 4 }}>
                        <div className="ms-clear" onClick={() => setMultiSelect(p => ({ ...p, source: [...ALL_SOURCE_VALUES] }))} data-testid="ms-selectall-source">✓ Chọn tất cả</div>
                        <div className="ms-clear" onClick={() => setMultiSelect(p => ({ ...p, source: [] }))}>✕ Bỏ chọn tất cả</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* F_STATUS — multi-select */}
              <div className="form-group span2" data-field="F_STATUS" data-spec-ref="B2.row5">
                <label>Trạng thái</label>
                <div className="multi-select-wrap" id="ms-wrap-status">
                  <div
                    className={`ms-trigger${msOpen.status ? ' open' : ''}`}
                    id="ms-trigger-status"
                    onClick={() => setMsOpen(p => ({ ...p, status: !p.status }))}
                    data-testid="filter-status"
                  >
                    {getMsLabel('status')}
                    <span>▾</span>
                  </div>
                  {msOpen.status && (
                    <div className="ms-dropdown open" id="ms-dropdown-status">
                      {STATUS_OPTIONS.map(opt => (
                        <div key={opt.value} className="ms-option">
                          <input
                            type="checkbox" value={opt.value} id={`ms-${opt.value}`}
                            checked={multiSelect.status.includes(opt.value)}
                            onChange={e => setMultiSelect(p => ({
                              ...p,
                              status: e.target.checked
                                ? [...p.status, opt.value]
                                : p.status.filter(v => v !== opt.value),
                            }))}
                          />
                          <label htmlFor={`ms-${opt.value}`} style={{ cursor: 'pointer', fontSize: 13 }}>{opt.label}</label>
                        </div>
                      ))}
                      <div className="ms-actions" style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border, #eee)', marginTop: 4 }}>
                        <div className="ms-clear" onClick={() => setMultiSelect(p => ({ ...p, status: [...ALL_STATUS_VALUES] }))} data-testid="ms-selectall-status">✓ Chọn tất cả</div>
                        <div className="ms-clear" onClick={() => setMultiSelect(p => ({ ...p, status: [] }))}>✕ Bỏ chọn tất cả</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER_CODE */}
              <div className="form-group" data-field="DOSSIER_CODE" data-spec-ref="B2.row2">
                <label>Mã hồ sơ</label>
                <input
                  type="text" id="filter-doc-id" placeholder="Nhập mã hồ sơ..."
                  data-testid="filter-doc-id"
                  value={inputFilters.docId}
                  onChange={e => setInputFilters(p => ({ ...p, docId: e.target.value }))}
                />
              </div>

              {/* PROJECT_CODE */}
              <div className="form-group" data-field="PROJECT_CODE" data-spec-ref="B2.row3">
                <label>Mã dự án/CT</label>
                <input
                  type="text" id="filter-project-id" placeholder="Nhập mã dự án..."
                  data-testid="filter-project-id"
                  value={inputFilters.projectId}
                  onChange={e => setInputFilters(p => ({ ...p, projectId: e.target.value }))}
                />
              </div>

              {/* Quick search */}
              <div className="form-group span2" data-field="SEARCH">
                <label>Tìm nhanh (Người lập / Tên dự án)</label>
                <div className="input-lookup-wrap">
                  <input
                    type="text" id="filter-search" placeholder="Nhập để tìm kiếm..."
                    autoComplete="off" data-testid="search-input"
                    value={inputFilters.search}
                    onChange={e => setInputFilters(p => ({ ...p, search: e.target.value }))}
                  />
                  <span className="lookup-icon" title="Tìm theo Người lập / Tên dự án">🔍</span>
                </div>
              </div>
            </div>

            {/* ── Advanced filters ── */}
            <div style={{ marginTop: 14 }}>
              <div className="collapse-toggle" id="adv-toggle" onClick={() => setAdvOpen(p => !p)}>
                <span>{advOpen ? '🔽' : '▶'} Điều kiện nâng cao</span>
                <span
                  className="collapse-icon" id="adv-icon"
                  style={{ transform: advOpen ? '' : 'rotate(-90deg)' }}
                >▼</span>
              </div>
              <div
                className="collapsible-section" id="adv-section"
                style={{ maxHeight: advOpen ? '600px' : '0', overflow: 'hidden', marginTop: 10 }}
              >
                <div className="filter-grid">
                  <div className="form-group" data-field="DATE_FIELD" data-spec-ref="B2.row10">
                    <label>Loại ngày lọc</label>
                    <select
                      id="filter-date-field" data-testid="filter-date-field"
                      value={inputFilters.dateField}
                      onChange={e => setInputFilters(p => ({ ...p, dateField: e.target.value }))}
                    >
                      <option value="SEND_DATE">Ngày gửi</option>
                      <option value="CREATED_DATE">Ngày lập</option>
                      <option value="CHECKED_DATE">Ngày kiểm soát</option>
                      <option value="APPROVED_DATE">Ngày phê duyệt</option>
                    </select>
                  </div>

                  <div className="form-group" id="grp-from-date" data-field="FROM_DATE" data-spec-ref="B2.row11">
                    <label>Từ ngày</label>
                    <input
                      type="date" id="filter-from-date" data-testid="filter-from-date"
                      value={inputFilters.fromDate}
                      onChange={e => setInputFilters(p => ({ ...p, fromDate: e.target.value }))}
                    />
                  </div>

                  <div className={`form-group${dateRangeError ? ' has-error' : ''}`} id="grp-to-date" data-field="TO_DATE" data-spec-ref="B2.row12">
                    <label>Đến ngày</label>
                    <input
                      type="date" id="filter-to-date" data-testid="filter-to-date"
                      value={inputFilters.toDate}
                      onChange={e => { setInputFilters(p => ({ ...p, toDate: e.target.value })); setDateRangeError(false) }}
                    />
                    <span
                      className="error-msg" id="err-date-range"
                      style={{ display: dateRangeError ? 'block' : 'none' }}
                    >Đến ngày phải ≥ Từ ngày</span>
                  </div>

                  <div className="form-group" data-field="CREATED_BY" data-spec-ref="B2.row13">
                    <label>Người lập</label>
                    <div className="input-lookup-wrap">
                      <input
                        type="text" id="filter-created-by" placeholder="Username người lập..."
                        data-testid="filter-created-by"
                        value={inputFilters.createdBy}
                        onChange={e => setInputFilters(p => ({ ...p, createdBy: e.target.value }))}
                      />
                      <span className="lookup-icon" title="Tra cứu NSD">🔍</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter actions */}
            <div className="filter-actions">
              <button
                className="btn btn-default"
                onClick={handleResetFilter}
                data-testid="btn-reset"
                data-event-id="EXP.CAPEX_DOSSIER.LIST.RESET"
              >↺ Đặt lại</button>
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                data-testid="btn-search"
                data-event-id="EXP.CAPEX_DOSSIER.LIST.SEARCH"
              >🔍 Tìm kiếm</button>
            </div>

          </div>
        </div>

        {/* ═══ RESULT CARD ═══ */}
        <div className="card">
          <div className="card-body">

            {/* Stats bar */}
            {viewMode === 'table' && (
              <div className="stats-bar" id="stats-bar">
                <div className="stat-item">
                  <span>Tổng hồ sơ:</span>
                  <span className="stat-count">{stats.total}</span>
                </div>
                {Object.entries(stats.groups).map(([label, g]) => (
                  <div key={label} className="stat-item">
                    <span className={`badge ${g.cls}`}>{label}</span>
                    <span className="stat-count">{g.count}</span>
                  </div>
                ))}
                <div className="stat-item" style={{ marginLeft: 'auto' }}>
                  <span>Tổng tiền VND:</span>
                  <span className="stat-count" style={{ color: 'var(--primary)' }}>{fmtAmt(stats.totalVnd)}</span>
                </div>
              </div>
            )}

            {/* Table toolbar */}
            {viewMode === 'table' && (
              <div className="table-toolbar" id="table-toolbar">
                <span className="text-muted" id="result-count">Tổng kết quả: {totalRecords} bản ghi</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div className="col-config-wrap" ref={colConfigRef}>
                    <button
                      className="btn btn-default"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                      onClick={() => setColConfigOpen(p => !p)}
                      data-testid="btn-col-config"
                    >⚙ Tùy chỉnh cột</button>
                    {colConfigOpen && (
                      <div className="col-config-dropdown open" id="col-config-dropdown">
                        <div style={{ padding: '6px 14px 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hiện/ẩn cột</div>
                        {colConfig.map(col => (
                          <div
                            key={col.key}
                            className={`col-config-item${!col.hideable ? ' disabled' : ''}`}
                            onClick={col.hideable ? () => setColConfig(prev => prev.map(c => c.key === col.key ? { ...c, visible: !c.visible } : c)) : undefined}
                            title={!col.hideable ? 'Cột bắt buộc hiển thị' : ''}
                          >
                            <input
                              type="checkbox"
                              checked={col.visible}
                              disabled={!col.hideable}
                              id={`chk-col-${col.key}`}
                              onChange={col.hideable ? () => setColConfig(prev => prev.map(c => c.key === col.key ? { ...c, visible: !c.visible } : c)) : undefined}
                            />
                            <label htmlFor={`chk-col-${col.key}`} style={{ cursor: col.hideable ? 'pointer' : 'default' }}>{col.label}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-default" style={{ padding: '5px 12px', fontSize: 12 }} onClick={saveColConfig} data-testid="btn-save-col-config">💾 Lưu cấu hình</button>
                  <button className="btn btn-default" style={{ padding: '5px 12px', fontSize: 12 }} onClick={resetColConfig} data-testid="btn-reset-col-config">↺ Mặc định</button>
                </div>
              </div>
            )}

            {/* Initial state */}
            {viewMode === 'initial' && (
              <div className="empty-state" id="state-initial">
                <div className="icon">🔍</div>
                <p>Nhập điều kiện và ấn <strong>Tìm kiếm</strong> để xem danh sách</p>
                <small>Bộ lọc đều không bắt buộc — có thể tìm kiếm với toàn bộ hồ sơ</small>
              </div>
            )}

            {/* Loading */}
            {hasSearched && isLoading && (
              <div className="empty-state" id="state-loading">
                <div className="icon">⏳</div>
                <p>Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error */}
            {hasSearched && isError && !isLoading && (
              <div className="empty-state" id="state-error">
                <div className="icon">⚠️</div>
                <p>Không tải được danh sách hồ sơ</p>
                <small>Vui lòng thử lại</small>
              </div>
            )}

            {/* No result */}
            {viewMode === 'no-result' && !isError && (
              <div className="empty-state" id="state-no-result">
                <div className="icon">📭</div>
                <p>Không tìm thấy bản ghi phù hợp</p>
                <small>Thử thay đổi điều kiện tìm kiếm</small>
              </div>
            )}

            {/* Table */}
            {viewMode === 'table' && !isLoading && (
              <div style={{ overflowX: 'auto' }} id="table-wrap">
                <table id="data-table" style={{ minWidth: colConfig.filter(c => c.visible).reduce((s, c) => s + c.width, 0) }}>
                  <thead id="data-thead">{renderTableHeader()}</thead>
                  <tbody id="table-body">
                    {pageData.rows.map((r, idx) => (
                      <tr key={r.id} onClick={() => handleRowClick(r.id)} data-id={r.id}>
                        {colConfig.filter(c => c.visible).map(col => renderCell(col, r, pageData.start + idx + 1))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {viewMode === 'table' && !isLoading && renderPagination()}

          </div>
        </div>

      </div>

      {/* Toast */}
      <div className={`col-toast${toastVisible ? ' show' : ''}`} id="col-toast">{toastMsg}</div>
    </>
  )
}

export default CapexDossierListPage
