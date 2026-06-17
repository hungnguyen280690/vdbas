import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import './OpexDossierListPage.css'
import { MOCK_DATA, type OpexDossierRecord } from './OpexDossierListPage.mock'
import { useNavigation } from '@/contexts/NavigationContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ColMeta {
  label: string
  width: number
  sortable: boolean
  fixed: boolean
  hideable: boolean
}

interface MsOption {
  value: string
  label: string
  dot: string
}

interface CommittedFilters {
  dossierCode: string
  quick: string
  sources: string[]
  statuses: string[]
  createdBy: string
  fromDate: string
  toDate: string
}

// ── Column definitions ────────────────────────────────────────────────────────

const COLS: Record<string, ColMeta> = {
  STT:              { label: 'STT',            width: 54,  sortable: false, fixed: true,  hideable: false },
  DOSSIER_CODE:     { label: 'Mã hồ sơ',       width: 240, sortable: true,  fixed: false, hideable: true  },
  SEND_DATE:        { label: 'Ngày gửi',        width: 110, sortable: true,  fixed: false, hideable: true  },
  DATA_SOURCE_CODE: { label: 'Nguồn gốc',       width: 130, sortable: true,  fixed: false, hideable: true  },
  F_STATUS:         { label: 'Trạng thái',      width: 160, sortable: true,  fixed: false, hideable: true  },
  CREATED_BY:       { label: 'Người lập',       width: 130, sortable: false, fixed: false, hideable: true  },
  CREATED_DATE:     { label: 'Ngày lập',        width: 160, sortable: true,  fixed: false, hideable: true  },
  BUDGET_UNIT_NAME: { label: 'Đơn vị SDNS',     width: 240, sortable: false, fixed: false, hideable: true  },
  CHECKED_BY:       { label: 'Người kiểm soát', width: 140, sortable: false, fixed: false, hideable: true  },
  CHECKED_DATE:     { label: 'Ngày kiểm soát',  width: 150, sortable: false, fixed: false, hideable: true  },
  APPROVED_BY:      { label: 'Người phê duyệt', width: 140, sortable: false, fixed: false, hideable: true  },
  APPROVED_DATE:    { label: 'Ngày phê duyệt',  width: 150, sortable: false, fixed: false, hideable: true  },
  ACTIONS:          { label: 'Thao tác',        width: 300, sortable: false, fixed: true,  hideable: false },
}

const DEFAULT_ORDER = [
  'STT', 'DOSSIER_CODE', 'BUDGET_UNIT_NAME', 'DATA_SOURCE_CODE',
  'SEND_DATE', 'F_STATUS', 'CREATED_BY', 'CREATED_DATE',
  'CHECKED_BY', 'CHECKED_DATE', 'APPROVED_BY', 'APPROVED_DATE', 'ACTIONS',
]

const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  DEFAULT_ORDER.map(k => [k, COLS[k].width])
)

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const STORAGE_KEY = 'vdbas_opex_list_cols'

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Thủ công', DVKB: 'Dịch vụ kho bạc', AUTO: 'Tự động', TREASURY_SERVICE: 'Dịch vụ KBNN',
}
const SOURCE_COLOR: Record<string, string> = {
  MANUAL: '#722ed1', DVKB: '#13c2c2', AUTO: '#1677ff', TREASURY_SERVICE: '#fa8c16',
}

const SOURCE_OPTIONS: MsOption[] = [
  { value: 'MANUAL', label: 'Thủ công',  dot: '#722ed1' },
  { value: 'DVKB',   label: 'DVC',       dot: '#13c2c2' },
  { value: 'AUTO',   label: 'Tự động',   dot: '#1677ff' },
]

const STATUS_OPTIONS: MsOption[] = [
  { value: 'DRAFT',     label: 'Lưu nháp',          dot: '#9e9e9e' },
  { value: 'SAVED',     label: 'Đã lưu',             dot: '#8c8c8c' },
  { value: 'VALIDATED', label: 'Đã kiểm tra',        dot: '#13c2c2' },
  { value: 'SUBMITTED', label: 'Đã gửi kiểm soát',   dot: '#1677ff' },
  { value: 'APPROVED',  label: 'Đã phê duyệt',       dot: '#389e0d' },
  { value: 'REJECTED',  label: 'Đã từ chối',         dot: '#cf1322' },
  { value: 'COMPLETED', label: 'Đã hoàn thành',      dot: '#237804' },
  { value: 'CANCELLED', label: 'Đã huỷ',             dot: '#fa8c16' },
]

const STATS_DEF = [
  { status: 'DRAFT',     label: 'Lưu nháp',          cls: 'st-draft'     },
  { status: 'SUBMITTED', label: 'Đã gửi kiểm soát',  cls: 'st-submitted' },
  { status: 'APPROVED',  label: 'Đã phê duyệt',      cls: 'st-approved'  },
  { status: 'REJECTED',  label: 'Đã từ chối',        cls: 'st-rejected'  },
  { status: 'COMPLETED', label: 'Đã hoàn thành',     cls: 'st-completed' },
  { status: 'CANCELLED', label: 'Đã huỷ',            cls: 'st-cancelled' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISO(s: string | null): string {
  if (!s) return ''
  const str = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return ''
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function uiStatus(status: string, assignUser: string): { label: string; cls: string } {
  switch (status) {
    case 'DRAFT':     return { label: 'Lưu nháp',          cls: 'st-draft'     }
    case 'SAVED':     return { label: 'Đã lưu',             cls: 'st-saved'     }
    case 'VALIDATED': return { label: 'Đã kiểm tra',        cls: 'st-validated' }
    case 'SUBMITTED': return { label: 'Đã gửi kiểm soát',   cls: 'st-submitted' }
    case 'APPROVED':
      return assignUser === 'Done'
        ? { label: 'Đã phê duyệt', cls: 'st-approved' }
        : { label: 'Đã kiểm soát', cls: 'st-checked'  }
    case 'REJECTED':
      return assignUser === 'Checker'
        ? { label: 'Từ chối phê duyệt', cls: 'st-rejected' }
        : { label: 'Từ chối kiểm soát', cls: 'st-rejected' }
    case 'COMPLETED': return { label: 'Đã hoàn thành', cls: 'st-completed' }
    case 'CANCELLED': return { label: 'Đã huỷ',         cls: 'st-cancelled' }
    default:          return { label: status || '—',    cls: 'st-draft'     }
  }
}

function canEdit(r: OpexDossierRecord): boolean {
  return r.F_STATUS === 'DRAFT' || r.F_STATUS === 'SAVED' || (r.F_STATUS === 'REJECTED' && r.ASSIGN_USER === 'Maker')
}
function canDelete(r: OpexDossierRecord): boolean {
  return r.F_STATUS === 'DRAFT' || r.F_STATUS === 'SAVED' || (r.F_STATUS === 'REJECTED' && r.ASSIGN_USER === 'Maker')
}
function canSubmit(r: OpexDossierRecord): boolean {
  return r.F_STATUS === 'DRAFT' || r.F_STATUS === 'SAVED' || (r.F_STATUS === 'REJECTED' && r.ASSIGN_USER === 'Maker')
}

function clampOrder(order: string[]): string[] {
  const mid = order.filter(k => k !== 'STT' && k !== 'ACTIONS')
  return ['STT', ...mid, 'ACTIONS']
}

function loadColConfig(): { order: string[]; width: Record<string, number>; visible: Record<string, boolean> } {
  const def = {
    order:   DEFAULT_ORDER.slice(),
    width:   { ...DEFAULT_WIDTHS },
    visible: Object.fromEntries(DEFAULT_ORDER.map(k => [k, true])) as Record<string, boolean>,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return def
    const cfg = JSON.parse(raw) as {
      order?: string[]
      width?: Record<string, number>
      visible?: Record<string, boolean>
    }
    if (cfg.order?.length) {
      const valid = cfg.order.filter(k => COLS[k])
      DEFAULT_ORDER.forEach(k => { if (!valid.includes(k)) valid.push(k) })
      def.order = clampOrder(valid)
    }
    if (cfg.width) Object.entries(cfg.width).forEach(([k, v]) => { if (COLS[k]) def.width[k] = v })
    if (cfg.visible) Object.entries(cfg.visible).forEach(([k, v]) => { if (COLS[k]) def.visible[k] = v })
  } catch { /* ignore */ }
  return def
}

// ── MultiSelect sub-component ─────────────────────────────────────────────────

interface MultiSelectProps {
  options: MsOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
  open: boolean
  onToggle: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  testId?: string
}

function MultiSelectDropdown({
  options, selected, onChange, placeholder, open, onToggle, containerRef, testId,
}: MultiSelectProps) {
  let labelNode: React.ReactNode
  if (selected.length === 0) {
    labelNode = <span className="ms-text placeholder">{placeholder}</span>
  } else if (selected.length === 1) {
    const found = options.find(o => o.value === selected[0])
    labelNode = <span className="ms-text">{found?.label ?? selected[0]}</span>
  } else {
    labelNode = <span className="ms-text">Đã chọn {selected.length}</span>
  }

  function toggle(value: string, checked: boolean) {
    if (checked) onChange([...selected, value])
    else onChange(selected.filter(v => v !== value))
  }

  return (
    <div className={`ms${open ? ' open' : ''}`} ref={containerRef} data-testid={testId}>
      <div
        className="ms-control"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      >
        {labelNode}
        <span className="ms-caret">▾</span>
      </div>
      {open && (
        <div className="ms-panel">
          <div
            className="ms-selectall"
            onClick={e => { e.stopPropagation(); onChange(options.map(o => o.value)) }}
          >
            ✓ Chọn tất cả
          </div>
          {options.map(o => (
            <label key={o.value} className="ms-opt" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                value={o.value}
                checked={selected.includes(o.value)}
                onChange={e => toggle(o.value, e.target.checked)}
              />
              <span className="ms-dot" style={{ background: o.dot }} />
              <span>{o.label}</span>
            </label>
          ))}
          <div
            className="ms-clear"
            onClick={e => { e.stopPropagation(); onChange([]) }}
          >
            ✕ Bỏ chọn tất cả
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const OpexDossierListPage: React.FC = () => {
  const { navigate } = useNavigation()

  // Filter input state (UI layer — changes on every keystroke)
  const [inputDossierCode, setInputDossierCode] = useState('')
  const [inputQuick, setInputQuick] = useState('')
  const [inputCreatedBy, setInputCreatedBy] = useState('')
  const [inputFromDate, setInputFromDate] = useState('')
  const [inputToDate, setInputToDate] = useState('')
  const [advOpen, setAdvOpen] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [msSourceOpen, setMsSourceOpen] = useState(false)
  const [msStatusOpen, setMsStatusOpen] = useState(false)

  // Committed filter state (drives table — only updates on Search click)
  const [searched, setSearched] = useState(false)
  const [committedFilters, setCommittedFilters] = useState<CommittedFilters>({
    dossierCode: '', quick: '', sources: [], statuses: [], createdBy: '', fromDate: '', toDate: '',
  })

  // Pagination & sort
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('CREATED_DATE')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  // Column config (lazy init from localStorage)
  const [colOrder, setColOrder] = useState<string[]>(() => loadColConfig().order)
  const [colWidth, setColWidth] = useState<Record<string, number>>(() => loadColConfig().width)
  const [colVisible, setColVisible] = useState<Record<string, boolean>>(() => loadColConfig().visible)
  const [colCfgOpen, setColCfgOpen] = useState(false)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  // Toast
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  // Refs
  const colCfgRef   = useRef<HTMLDivElement>(null)
  const msSourceRef = useRef<HTMLDivElement>(null)
  const msStatusRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null)
  const dragColRef  = useRef<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived ────────────────────────────────────────────────────────────────

  const visibleCols = useMemo(
    () => colOrder.filter(k => colVisible[k] !== false),
    [colOrder, colVisible]
  )

  const tableMinWidth = useMemo(
    () => visibleCols.reduce((sum, k) => sum + (colWidth[k] ?? 0), 0),
    [visibleCols, colWidth]
  )

  const filtered = useMemo(() => {
    if (!searched) return []
    const { dossierCode, quick, sources, statuses, createdBy, fromDate, toDate } = committedFilters
    const result = MOCK_DATA.records.filter(r => {
      const mCode   = !dossierCode || r.DOSSIER_CODE.toLowerCase().includes(dossierCode)
      const mQuick  = !quick || (r.CREATED_BY ?? '').toLowerCase().includes(quick) || r.BUDGET_UNIT_NAME.toLowerCase().includes(quick)
      const mStatus = !statuses.length || statuses.includes(r.F_STATUS)
      const mSource = !sources.length  || sources.includes(r.DATA_SOURCE_CODE)
      const mCb     = !createdBy || (r.CREATED_BY ?? '').toLowerCase().includes(createdBy)
      const iso     = toISO(r.SEND_DATE)
      const mFrom   = !fromDate || iso >= fromDate
      const mTo     = !toDate   || iso <= toDate
      return mCode && mQuick && mStatus && mSource && mCb && mFrom && mTo
    })
    return result.sort((a, b) => {
      const av = String(a[sortField as keyof OpexDossierRecord] ?? '')
      const bv = String(b[sortField as keyof OpexDossierRecord] ?? '')
      return av.localeCompare(bv) * sortDir
    })
  }, [searched, committedFilters, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pageStart  = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const pageEnd    = Math.min(currentPage * PAGE_SIZE, filtered.length)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setSearched(true)
    setCurrentPage(1)
    setCommittedFilters({
      dossierCode: inputDossierCode.trim().toLowerCase(),
      quick:       inputQuick.trim().toLowerCase(),
      sources:     selectedSources,
      statuses:    selectedStatuses,
      createdBy:   inputCreatedBy.trim().toLowerCase(),
      fromDate:    inputFromDate,
      toDate:      inputToDate,
    })
  }, [inputDossierCode, inputQuick, selectedSources, selectedStatuses, inputCreatedBy, inputFromDate, inputToDate])

  function handleReset() {
    setInputDossierCode(''); setInputQuick(''); setInputCreatedBy('')
    setInputFromDate(''); setInputToDate('')
    setSelectedSources([]); setSelectedStatuses([])
    setSearched(false)
    setCommittedFilters({ dossierCode: '', quick: '', sources: [], statuses: [], createdBy: '', fromDate: '', toDate: '' })
  }

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortField(field); setSortDir(-1) }
    setCurrentPage(1)
  }

  function sortLabel(key: string): string {
    if (!COLS[key].sortable) return ''
    if (sortField === key) return sortDir < 0 ? ' ▼' : ' ▲'
    return ' ⇅'
  }

  // ── Column config ──────────────────────────────────────────────────────────

  function handleSaveColConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: colOrder, width: colWidth, visible: colVisible }))
      showToast('✅ Đã lưu cấu hình cột')
    } catch {
      showToast('⚠ Không lưu được (localStorage bị chặn)')
    }
  }

  function handleResetColConfig() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setColOrder(DEFAULT_ORDER.slice())
    setColWidth({ ...DEFAULT_WIDTHS })
    setColVisible(Object.fromEntries(DEFAULT_ORDER.map(k => [k, true])))
    showToast('↺ Đã khôi phục cột mặc định')
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToastMsg(msg); setToastVisible(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000)
  }

  // ── Column resize ──────────────────────────────────────────────────────────

  function handleResizeMouseDown(key: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    const startW = colWidth[key] ?? COLS[key].width
    resizingRef.current = { key, startX: e.clientX, startW }
    document.body.style.cursor = 'col-resize'
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const newW = Math.max(60, resizingRef.current.startW + ev.clientX - resizingRef.current.startX)
      setColWidth(prev => ({ ...prev, [resizingRef.current!.key]: newW }))
    }
    const onUp = () => {
      resizingRef.current = null
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── Column DnD ────────────────────────────────────────────────────────────

  function handleColDragStart(key: string, e: React.DragEvent) {
    dragColRef.current = key
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleColDragOver(key: string, e: React.DragEvent) {
    if (dragColRef.current && dragColRef.current !== key && !COLS[key].fixed) {
      e.preventDefault(); setDragOverCol(key)
    }
  }
  function handleColDragLeave(key: string) {
    if (dragOverCol === key) setDragOverCol(null)
  }
  function handleColDrop(key: string, e: React.DragEvent) {
    e.preventDefault(); setDragOverCol(null)
    if (!dragColRef.current || dragColRef.current === key || COLS[key].fixed) return
    setColOrder(prev => {
      const o = [...prev]
      const from = o.indexOf(dragColRef.current!)
      const to   = o.indexOf(key)
      if (from < 0 || to < 0) return prev
      o.splice(from, 1); o.splice(to, 0, dragColRef.current!)
      return clampOrder(o)
    })
    dragColRef.current = null
  }
  function handleColDragEnd() { dragColRef.current = null; setDragOverCol(null) }

  // ── Render cell ────────────────────────────────────────────────────────────

  function renderCell(key: string, r: OpexDossierRecord, globalIdx: number): React.ReactNode {
    switch (key) {
      case 'STT': return String(globalIdx)

      case 'DOSSIER_CODE':
        return (
          <a
            className="dossier-link"
            href={`/opex-dossiers/detail?id=${r.id}&mode=view`}
            onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/opex-dossiers/detail', { id: r.id, mode: 'view' }) }}
            data-testid="link-dossier-code"
          >
            {r.DOSSIER_CODE}
          </a>
        )

      case 'F_STATUS': {
        const { label, cls } = uiStatus(r.F_STATUS, r.ASSIGN_USER)
        return <span className={`badge ${cls}`} data-testid={`badge-status-${r.F_STATUS}`}>{label}</span>
      }

      case 'DATA_SOURCE_CODE': {
        const color = SOURCE_COLOR[r.DATA_SOURCE_CODE] || '#8c8c8c'
        const label = SOURCE_LABEL[r.DATA_SOURCE_CODE] || r.DATA_SOURCE_CODE || '—'
        return (
          <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}66` }}>
            {label}
          </span>
        )
      }

      case 'ACTIONS':
        return (
          <div className="action-group" onClick={e => e.stopPropagation()}>
            <a
              className="row-btn"
              href={`/opex-dossiers/detail?id=${r.id}&mode=view`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/opex-dossiers/detail', { id: r.id, mode: 'view' }) }}
              title="Xem"
            >
              👁 Xem
            </a>
            {canEdit(r) && (
              <a
                className="row-btn"
                href={`/opex-dossiers/detail?id=${r.id}&mode=edit`}
                onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/opex-dossiers/detail', { id: r.id, mode: 'edit' }) }}
                title="Sửa"
              >
                ✏️ Sửa
              </a>
            )}
            {canSubmit(r) && (
              <button
                className="row-btn"
                data-event-id="EXP.OPEX_DOSSIER.NEW.SUBMIT"
                onClick={e => { e.stopPropagation(); alert(`[VDBAS-EXP-XXXX] Đã gửi hồ sơ ${r.id} để kiểm soát (prototype).`) }}
                title="Gửi kiểm soát"
              >
                👥 Gửi KS
              </button>
            )}
            {canDelete(r) && (
              <a
                className="row-btn danger"
                href={`/opex-dossiers/detail?id=${r.id}&mode=view&action=delete`}
                onClick={e => { e.preventDefault(); e.stopPropagation(); navigate('/opex-dossiers/detail', { id: r.id, mode: 'view', action: 'delete' }) }}
                title="Xoá"
              >
                🗑 Xoá
              </a>
            )}
          </div>
        )

      default: {
        const v = r[key as keyof OpexDossierRecord]
        return v != null ? String(v) : '—'
      }
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        navigate('/opex-dossiers/detail', { mode: 'new' })
      }
      if (e.key === 'F5') {
        e.preventDefault()
        handleSearch()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate, handleSearch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colCfgRef.current   && !colCfgRef.current.contains(e.target as Node))   setColCfgOpen(false)
      if (msSourceRef.current && !msSourceRef.current.contains(e.target as Node)) setMsSourceOpen(false)
      if (msStatusRef.current && !msStatusRef.current.contains(e.target as Node)) setMsStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [totalPages, currentPage])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* HEADER */}
      <div className="app-header">
        <div className="ah-left">
          <span className="breadcrumb">Quản lý chi › Quản lý chi thường xuyên</span>
          <h1>EXP.OPEX_DOSSIER — Danh sách hồ sơ chi thường xuyên</h1>
        </div>
        <div className="app-header-actions">
          <button
            className="btn-header-default"
            data-event-id="EXP.OPEX_DOSSIER.LIST.EXPORT"
            onClick={() => alert('Export chức năng prototype — Ctrl+Shift+E')}
            data-testid="btn-export"
          >
            📧 Xuất
          </button>
          <a
            className="btn-header-primary"
            href="/opex-dossiers/detail?mode=new"
            onClick={e => { e.preventDefault(); navigate('/opex-dossiers/detail', { mode: 'new' }) }}
            data-event-id="EXP.OPEX_DOSSIER.NEW.OPEN"
            data-testid="btn-create-new"
          >
            + Tạo mới hồ sơ
          </a>
        </div>
      </div>

      <div className="page-wrap">

        {/* FILTER PANEL */}
        <div className="filter-panel">
          <h4>🔍 Bộ lọc tìm kiếm</h4>
          <div className="filter-section-label">Điều kiện chính</div>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Nguồn</label>
              <MultiSelectDropdown
                options={SOURCE_OPTIONS}
                selected={selectedSources}
                onChange={setSelectedSources}
                placeholder="-- Tất cả nguồn --"
                open={msSourceOpen}
                onToggle={() => setMsSourceOpen(p => !p)}
                containerRef={msSourceRef}
                testId="filter-source"
              />
            </div>
            <div className="filter-group">
              <label>Trạng thái</label>
              <MultiSelectDropdown
                options={STATUS_OPTIONS}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="-- Tất cả trạng thái --"
                open={msStatusOpen}
                onToggle={() => setMsStatusOpen(p => !p)}
                containerRef={msStatusRef}
                testId="filter-status"
              />
            </div>
            <div className="filter-group">
              <label>Mã hồ sơ</label>
              <input
                type="text"
                id="search-input"
                data-testid="search-input"
                placeholder="Nhập mã hồ sơ..."
                value={inputDossierCode}
                onChange={e => setInputDossierCode(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Tìm nhanh (người lập/đơn vị)</label>
              <div className="input-search-wrap">
                <input
                  type="text"
                  id="filter-quick"
                  placeholder="Nhập để tìm kiếm..."
                  value={inputQuick}
                  onChange={e => setInputQuick(e.target.value)}
                />
                <span className="si">🔍</span>
              </div>
            </div>
          </div>

          <span className="collapse-toggle" id="adv-toggle" onClick={() => setAdvOpen(p => !p)}>
            {advOpen ? '▼ Điều kiện nâng cao ▼' : '▶ Điều kiện nâng cao ▶'}
          </span>
          {advOpen && (
            <div id="filter-advanced" style={{ marginTop: 12 }}>
              <div className="filter-grid">
                <div className="filter-group">
                  <label>Người lập</label>
                  <input
                    type="text"
                    id="filter-created-by"
                    placeholder="Nhập user..."
                    value={inputCreatedBy}
                    onChange={e => setInputCreatedBy(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Từ ngày (gửi hồ sơ)</label>
                  <input
                    type="date"
                    id="filter-from-date"
                    data-testid="filter-from-date"
                    value={inputFromDate}
                    onChange={e => setInputFromDate(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Đến ngày (gửi hồ sơ)</label>
                  <input
                    type="date"
                    id="filter-to-date"
                    data-testid="filter-to-date"
                    value={inputToDate}
                    onChange={e => setInputToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="filter-actions-bar">
            <button
              className="btn btn-reset"
              data-event-id="EXP.OPEX_DOSSIER.LIST.RESET"
              onClick={handleReset}
            >
              ↺ Đặt lại
            </button>
            <button
              className="btn btn-search"
              data-event-id="EXP.OPEX_DOSSIER.LIST.SEARCH"
              onClick={handleSearch}
            >
              🔍 Tìm kiếm
            </button>
          </div>
        </div>

        {/* SEARCH PROMPT */}
        {!searched && (
          <div className="search-prompt" id="search-prompt">
            <div className="sp-icon">🔎</div>
            <p>Nhập điều kiện và nhấn <strong>&quot;Tìm kiếm&quot;</strong> để hiển thị danh sách hồ sơ.</p>
          </div>
        )}

        {/* RESULTS */}
        {searched && (
          <div id="results-area">

            {/* STATS BAR */}
            <div className="stats-bar" id="stats-bar">
              <span className="stats-total">Tổng hồ sơ: <b>{filtered.length}</b></span>
              {STATS_DEF.map(d => (
                <span key={d.status} className="stat-chip">
                  <span className={`badge ${d.cls}`}>{d.label}</span>{' '}
                  <b>{filtered.filter(r => r.F_STATUS === d.status).length}</b>
                </span>
              ))}
            </div>

            {/* TOOLBAR */}
            <div className="toolbar">
              <div className="toolbar-left">
                <span id="record-count-info" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Tổng kết quả: {filtered.length} bản ghi
                </span>
              </div>
              <div className="toolbar-right" style={{ gap: 6 }}>
                <div className="colcfg-wrap" ref={colCfgRef}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={e => { e.stopPropagation(); setColCfgOpen(p => !p) }}
                    data-event-id="EXP.OPEX_DOSSIER.LIST.COL_CONFIG"
                  >
                    ⚙ Tùy chỉnh cột
                  </button>
                  {colCfgOpen && (
                    <div className="colcfg-panel">
                      <div className="cc-title">Hiển thị cột</div>
                      {colOrder.filter(k => k !== 'STT' && k !== 'ACTIONS').map(k => (
                        <label key={k}>
                          <input
                            type="checkbox"
                            checked={colVisible[k] !== false}
                            onChange={e => setColVisible(prev => ({ ...prev, [k]: e.target.checked }))}
                          />
                          {' '}{COLS[k].label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  data-event-id="EXP.OPEX_DOSSIER.LIST.SAVE_COLS"
                  onClick={handleSaveColConfig}
                >
                  💾 Lưu cấu hình
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  data-event-id="EXP.OPEX_DOSSIER.LIST.RESET_COLS"
                  onClick={handleResetColConfig}
                >
                  ↺ Mặc định
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="table-wrap">
              <table id="data-table" style={{ minWidth: tableMinWidth }}>
                <colgroup>
                  {visibleCols.map(k => (
                    <col key={k} style={{ width: colWidth[k] ?? COLS[k].width }} />
                  ))}
                </colgroup>
                <thead>
                  <tr id="head-row">
                    {visibleCols.map(k => {
                      const col = COLS[k]
                      const isActions = k === 'ACTIONS'
                      const isMovable = !col.fixed
                      const thCls = [
                        isActions ? 'col-actions' : '',
                        isMovable ? 'movable' : '',
                        dragOverCol === k ? 'drag-over' : '',
                      ].filter(Boolean).join(' ')
                      return (
                        <th
                          key={k}
                          className={thCls || undefined}
                          style={{ width: colWidth[k] ?? col.width }}
                          draggable={isMovable}
                          onDragStart={isMovable ? e => handleColDragStart(k, e) : undefined}
                          onDragOver={isMovable ? e => handleColDragOver(k, e) : undefined}
                          onDragLeave={isMovable ? () => handleColDragLeave(k) : undefined}
                          onDrop={isMovable ? e => handleColDrop(k, e) : undefined}
                          onDragEnd={isMovable ? handleColDragEnd : undefined}
                        >
                          <span
                            className="th-label"
                            style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                            onClick={col.sortable ? () => handleSort(k) : undefined}
                          >
                            {col.label}{sortLabel(k)}
                          </span>
                          {!isActions && (
                            <span
                              className="col-resizer"
                              onMouseDown={e => handleResizeMouseDown(k, e)}
                            />
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody id="list-tbody" data-testid="list-tbody">
                  {pageData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleCols.length}>
                        <div className="empty-state">
                          <p>Không có bản ghi phù hợp bộ lọc.</p>
                        </div>
                      </td>
                    </tr>
                  ) : pageData.map((r, i) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + i + 1
                    return (
                      <tr
                        key={r.id}
                        data-record-id={r.id}
                        data-testid={`row-${r.id}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/opex-dossiers/detail', { id: r.id, mode: 'view' })}
                      >
                        {visibleCols.map(k => (
                          <td
                            key={k}
                            className={k === 'ACTIONS' ? 'col-actions' : undefined}
                            onClick={k === 'ACTIONS' ? e => e.stopPropagation() : undefined}
                          >
                            {renderCell(k, r, globalIdx)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="pagination-bar">
              <div id="pagination-info" data-testid="pagination-info">
                Hiển thị {pageStart}–{pageEnd} / {filtered.length} bản ghi
              </div>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  data-testid="pagination-prev"
                  id="btn-prev"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ‹ Trước
                </button>
                <span id="page-indicator" style={{ fontSize: 12, padding: '0 8px' }}>
                  Trang {currentPage}/{totalPages}
                </span>
                <button
                  className="page-btn"
                  data-testid="pagination-next"
                  id="btn-next"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Tiếp ›
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* TOAST */}
      {toastVisible && (
        <div id="col-toast" className="col-toast">{toastMsg}</div>
      )}
    </>
  )
}

export default OpexDossierListPage
