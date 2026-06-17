import React, { useState, useEffect, useRef, useMemo } from 'react'
import './CapexDossierDetailPage.css'
import { MOCK_DATA } from './CapexDossierDetailPage.mock'
import type { DossierRecord, DocumentRecord } from './CapexDossierDetailPage.mock'
import { useNavigation } from '@/contexts/NavigationContext'

type PageMode = 'new' | 'edit' | 'view'
type BtnState = 'show' | 'hide' | 'disable'

interface FormState {
  DOSSIER_CODE: string
  SEND_DATE: string
  DATA_SOURCE_CODE: string
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_SPECIFIC_CODE: string
  PROJECT_SPECIFIC_NAME: string
  PROJECT_MANAGEMENT_CODE: string
  PROJECT_MANAGEMENT_NAME: string
}

interface BtnRule {
  EDIT: BtnState; DELETE: BtnState; SUBMIT: BtnState
  APPROVE: BtnState; REJECT: BtnState; CANCEL: BtnState
  COPY: BtnState; PRINT: BtnState
}

interface LkEntry { code: string; name: string }

// ── LOV Data ─────────────────────────────────────────────────────────────────
const LOV01 = [
  { PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military' as const, PROJECT_SPECIFIC_CODE: '001200037', PROJECT_SPECIFIC_NAME: 'Dự án TM02', GL_SEGMENT6_CODE: '1059227', GL_SEGMENT6_NAME: 'BQL Cục thông tin BQP' },
  { PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military' as const, PROJECT_SPECIFIC_CODE: '001200038', PROJECT_SPECIFIC_NAME: 'Dự án TM03', GL_SEGMENT6_CODE: '1059227', GL_SEGMENT6_NAME: 'BQL Cục thông tin BQP' },
  { PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen' as const, PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null, GL_SEGMENT6_CODE: '3029123', GL_SEGMENT6_NAME: 'BQLDA bệnh viện Bạch Mai' },
]

const LK_DATA: Record<string, LkEntry[]> = {
  PROJECT: [
    { code: '7004686', name: 'Các dự án thuộc dự án bộ quốc phòng' },
    { code: '7122155', name: 'Dự án nâng cấp bệnh viện Bạch Mai' },
  ],
  BOARD: [
    { code: '3029123', name: 'BQLDA bệnh viện Bạch Mai' },
    { code: '1059227', name: 'BQL Cục thông tin BQP' },
  ],
  SPEC: [
    { code: '001200037', name: 'Dự án TM02' },
    { code: '001200038', name: 'Dự án TM03' },
  ],
  ITEM:     [{ code: 'HM_7122155_003', name: 'Hạng mục xây lắp' }, { code: 'HM_7004686_001', name: 'Hạng mục mua sắm thiết bị' }],
  CONTRACT: [{ code: 'Cont_7122155_004', name: 'Hợp đồng thi công xây lắp' }, { code: 'Cont_7004686_002', name: 'Hợp đồng cung cấp thiết bị' }],
  GUARANTEE:[{ code: 'Guarantee_7122155_004', name: 'Bảo lãnh tạm ứng HĐ 004' }],
  DATA_SOURCE_CODE: [{ code: 'Thủ công', name: 'Lập thủ công trên hệ thống' }, { code: 'DVC', name: 'Tiếp nhận từ Dịch vụ công' }],
  YESNO:    [{ code: 'Có', name: 'Có bảo lãnh tạm ứng' }, { code: 'Không', name: 'Không có bảo lãnh tạm ứng' }],
}

const LK_TITLES: Record<string, string> = {
  PROJECT: '🏛 Chọn Mã dự án/công trình',
  BOARD: '🏛 Chọn Mã ĐVQHNS',
  SPEC: '🏛 Chọn Mã dự án đặc thù',
  ITEM: '🏛 Chọn Mã hạng mục',
  CONTRACT: '🏛 Chọn Mã hợp đồng/dự toán',
  DATA_SOURCE_CODE: '🏛 Chọn Nguồn',
  GUARANTEE: '🏛 Chọn Mã bảo lãnh',
  YESNO: '🏛 Chọn',
}

// ── BTN_MATRIX ────────────────────────────────────────────────────────────────
const BTN_MATRIX: Record<string, BtnRule> = {
  DRAFT:     { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'disable' },
  SAVED:     { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'show' },
  VALIDATED: { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'show' },
  SUBMITTED: { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'show', REJECT:'show', CANCEL:'hide', COPY:'hide', PRINT:'disable' },
  APPROVED:  { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
  REJECTED:  { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
  COMPLETED: { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
  CANCELLED: { EDIT:'hide', DELETE:'disable', SUBMIT:'hide', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  DRAFT:'Lưu nháp', SAVED:'Đã lưu', VALIDATED:'Đã kiểm tra', SUBMITTED:'Đã gửi kiểm soát',
  APPROVED:'Đã phê duyệt', REJECTED:'Đã từ chối', COMPLETED:'Hoàn thành', CANCELLED:'Đã huỷ',
}

function statusUiLabel(r: DossierRecord): string {
  if (r.F_STATUS === 'APPROVED' && r.ASSIGN_USER === 'Approver') return 'Đã kiểm soát'
  return STATUS_LABELS[r.F_STATUS] || r.F_STATUS
}

function statusUiClass(r: DossierRecord): string {
  if (r.F_STATUS === 'APPROVED' && r.ASSIGN_USER === 'Approver') return 'status-APPROVED-CHECK'
  return 'status-' + r.F_STATUS
}

function formatNum(n: number | null | undefined): string {
  if (!n) return '0'
  return n.toLocaleString('vi-VN')
}

function getBtnRule(r: DossierRecord | null): BtnRule {
  if (!r) return BTN_MATRIX['DRAFT']
  if (r.F_STATUS === 'APPROVED' && r.ASSIGN_USER === 'Approver') return BTN_MATRIX['SUBMITTED']
  return BTN_MATRIX[r.F_STATUS] ?? BTN_MATRIX['DRAFT']
}

function todayStr(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// ── Component ─────────────────────────────────────────────────────────────────
const CapexDossierDetailPage: React.FC = () => {
  // URL params — read from NavigationContext (set by navigate() in list/detail pages)
  const { params, navigate } = useNavigation()
  const mode = (params.get('mode') || 'view') as PageMode
  const recordId = params.get('id')

  const record = useMemo(
    () => (recordId ? MOCK_DATA.records.find((r) => r.id === recordId) ?? null : null),
    [recordId],
  )

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('tab-general')
  const [isDirty, setIsDirty] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [confirmReviewed, setConfirmReviewed] = useState(false)
  const [isLkOpen, setIsLkOpen] = useState(false)
  const [lkKey, setLkKey] = useState<string | null>(null)
  const [lkSearch, setLkSearch] = useState('')
  const [hasSaved, setHasSaved] = useState(false)
  const [projectCodeError, setProjectCodeError] = useState('')
  const [docs, setDocs] = useState<DocumentRecord[]>(() =>
    mode !== 'new' && record ? record.documents : [],
  )

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => {
    if (record) {
      return {
        DOSSIER_CODE: record.DOSSIER_CODE,
        SEND_DATE: record.SEND_DATE,
        DATA_SOURCE_CODE: record.DATA_SOURCE_CODE,
        PROJECT_CODE: record.PROJECT_CODE,
        PROJECT_NAME: record.PROJECT_NAME,
        PROJECT_SPECIFIC_CODE: record.PROJECT_SPECIFIC_CODE || '',
        PROJECT_SPECIFIC_NAME: record.PROJECT_SPECIFIC_NAME || '',
        PROJECT_MANAGEMENT_CODE: record.PROJECT_MANAGEMENT_CODE,
        PROJECT_MANAGEMENT_NAME: record.PROJECT_MANAGEMENT_NAME,
      }
    }
    return {
      DOSSIER_CODE: '',
      SEND_DATE: todayStr(),
      DATA_SOURCE_CODE: 'Thủ công',
      PROJECT_CODE: '',
      PROJECT_NAME: '',
      PROJECT_SPECIFIC_CODE: '',
      PROJECT_SPECIFIC_NAME: '',
      PROJECT_MANAGEMENT_CODE: '',
      PROJECT_MANAGEMENT_NAME: '',
    }
  })

  // ── Derived ───────────────────────────────────────────────────────────────
  const showMilitary = useMemo(() => {
    const proj = LOV01.find((p) => p.PROJECT_CODE === form.PROJECT_CODE)
    return (proj?.PROJECT_TYPE ?? record?.PROJECT_TYPE) === 'Military'
  }, [form.PROJECT_CODE, record])

  const docTotal = useMemo(
    () => docs.reduce((s, d) => s + (d.VND_PAYMENT_AMOUNT || 0), 0),
    [docs],
  )

  const statusBadgeText = record ? statusUiLabel(record) : 'Lưu nháp'
  const statusBadgeClass = record ? statusUiClass(record) : 'status-DRAFT'

  const pageTitle =
    mode === 'new' ? 'Tạo mới — Hồ sơ Chi đầu tư'
    : mode === 'edit' ? `Chỉnh sửa — ${record?.DOSSIER_CODE || ''}`
    : `${record?.DOSSIER_CODE || ''} — Chi tiết`

  const btnMatrix = useMemo(() => getBtnRule(record), [record])
  const vBtn = (key: keyof BtnRule): BtnState => (mode === 'view' && record ? btnMatrix[key] : 'hide')
  const showBtn = (key: keyof BtnRule) => vBtn(key) !== 'hide'
  const disableBtn = (key: keyof BtnRule) => vBtn(key) === 'disable'

  const isViewMode = mode === 'view'
  const isNewOrEdit = mode === 'new' || mode === 'edit'
  const fieldDisabled = (alwaysDisabled?: boolean) => alwaysDisabled || isViewMode

  // ── Approval workflow steps ───────────────────────────────────────────────
  const approvalSteps = useMemo(() => {
    if (!record) {
      return [
        { role: 'Maker', cls: 'active', user: '(Đang lập)', label: '', date: '' },
        { role: 'Checker', cls: '', user: '(Chờ kiểm soát)', label: '', date: '' },
        { role: 'Approver', cls: '', user: '(Chờ phê duyệt)', label: '', date: '' },
      ]
    }
    const st = record.F_STATUS
    const asg = record.ASSIGN_USER
    const checkerPassed = st === 'APPROVED' || st === 'COMPLETED' || (st === 'REJECTED' && asg === 'Checker')

    let checker: { cls: string; user: string; label: string; date: string }
    if (st === 'REJECTED' && asg === 'Maker')
      checker = { cls: 'rejected', label: 'Đã từ chối', user: record.CHECKED_BY || '—', date: record.CHECKED_DATE || '' }
    else if (checkerPassed)
      checker = { cls: 'done', label: 'Đã kiểm soát', user: record.CHECKED_BY || '—', date: record.CHECKED_DATE || '' }
    else if (st === 'SUBMITTED')
      checker = { cls: 'active', label: 'Chờ kiểm soát', user: record.CHECKED_BY || '(Chờ kiểm soát)', date: '' }
    else
      checker = { cls: '', label: 'Chờ kiểm soát', user: '(Chờ kiểm soát)', date: '' }

    let approver: { cls: string; user: string; label: string; date: string }
    if (st === 'REJECTED' && asg === 'Checker')
      approver = { cls: 'rejected', label: 'Đã từ chối', user: record.APPROVED_BY || '—', date: record.APPROVED_DATE || '' }
    else if (st === 'COMPLETED' || (st === 'APPROVED' && asg === 'Done'))
      approver = { cls: 'done', label: 'Đã phê duyệt', user: record.APPROVED_BY || '—', date: record.APPROVED_DATE || '' }
    else if (st === 'APPROVED' && asg === 'Approver')
      approver = { cls: 'active', label: 'Chờ phê duyệt', user: record.APPROVED_BY || '(Chờ phê duyệt)', date: '' }
    else
      approver = { cls: '', label: 'Chờ phê duyệt', user: '(Chờ phê duyệt)', date: '' }

    const cancelled = st === 'CANCELLED'
    return [
      { role: 'Maker', cls: cancelled ? 'rejected' : 'done', label: cancelled ? 'Đã huỷ' : 'Đã lập', user: record.CREATED_BY || '—', date: record.CREATED_DATE || '' },
      { role: 'Checker', cls: cancelled ? '' : checker.cls, label: checker.label, user: cancelled ? '—' : checker.user, date: checker.date },
      { role: 'Approver', cls: cancelled ? '' : approver.cls, label: approver.label, user: cancelled ? '—' : approver.user, date: approver.date },
    ]
  }, [record])

  const approvalDetailMsg = useMemo(() => {
    if (!record) return null
    const st = record.F_STATUS; const asg = record.ASSIGN_USER
    if (st === 'REJECTED' && asg === 'Maker') return { text: `Lý do từ chối kiểm soát: ${record.CHECK_REJECTION_REASON || '—'}`, color: 'var(--danger)' }
    if (st === 'REJECTED' && asg === 'Checker') return { text: `Lý do từ chối phê duyệt: ${record.APPROVAL_REJECTION_REASON || '—'}`, color: 'var(--danger)' }
    if (st === 'APPROVED' && asg === 'Done') return { text: `✔ Đã phê duyệt lúc ${record.APPROVED_DATE || '—'}`, color: '#389e0d' }
    if (st === 'COMPLETED') return { text: '✔ Hoàn thành — đã ghi sổ Sổ cái (GL)', color: '#389e0d' }
    if (st === 'CANCELLED') return { text: `Hồ sơ đã huỷ${record.DELETE_REASON ? ': ' + record.DELETE_REASON : ''}`, color: 'var(--text-muted)' }
    return null
  }, [record])

  // ── Lookup ────────────────────────────────────────────────────────────────
  const lkRef = useRef<HTMLInputElement>(null)

  const lkEntries = useMemo(() => {
    if (!lkKey) return []
    const all = LK_DATA[lkKey] || []
    if (!lkSearch.trim()) return all
    const q = lkSearch.toLowerCase()
    return all.filter((r) => (r.code + ' ' + r.name).toLowerCase().includes(q))
  }, [lkKey, lkSearch])

  useEffect(() => {
    if (isLkOpen) setTimeout(() => lkRef.current?.focus(), 50)
  }, [isLkOpen])

  function openLookup(key: string) {
    if (isViewMode) return
    setLkKey(key); setLkSearch(''); setIsLkOpen(true)
  }

  function closeLookup() { setIsLkOpen(false); setLkKey(null) }

  function pickLookup(code: string) {
    if (!lkKey) return
    const r = (LK_DATA[lkKey] || []).find((x) => String(x.code) === String(code))
    if (!r) return
    if (lkKey === 'PROJECT') handleProjectCodeChange(r.code)
    else if (lkKey === 'BOARD') handleBoardIdChange(r.code)
    else if (lkKey === 'SPEC') setForm((f) => ({ ...f, PROJECT_SPECIFIC_CODE: r.code, PROJECT_SPECIFIC_NAME: r.name }))
    setIsDirty(true)
    closeLookup()
  }

  // ── Cascading LOV ─────────────────────────────────────────────────────────
  function handleProjectCodeChange(val: string) {
    setProjectCodeError(val.length > 7 ? 'Mã dự án bị thừa ký tự!' : '')
    const proj = LOV01.find((p) => p.PROJECT_CODE === val)
    if (proj) {
      setForm((f) => ({
        ...f,
        PROJECT_CODE: val,
        PROJECT_NAME: proj.PROJECT_NAME,
        PROJECT_MANAGEMENT_CODE: f.PROJECT_MANAGEMENT_CODE || proj.GL_SEGMENT6_CODE,
        PROJECT_MANAGEMENT_NAME: f.PROJECT_MANAGEMENT_NAME || proj.GL_SEGMENT6_NAME,
      }))
    } else {
      setForm((f) => ({ ...f, PROJECT_CODE: val, PROJECT_NAME: '' }))
    }
    setIsDirty(true)
  }

  function handleBoardIdChange(val: string) {
    const proj = LOV01.find((p) => p.GL_SEGMENT6_CODE === val)
    setForm((f) => ({ ...f, PROJECT_MANAGEMENT_CODE: val, PROJECT_MANAGEMENT_NAME: proj?.GL_SEGMENT6_NAME ?? '' }))
    setIsDirty(true)
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function navigateBack() {
    navigate('/capex-dossiers')
  }

  function onCancel() {
    if (isDirty) setIsCancelConfirmOpen(true)
    else navigateBack()
  }

  function onSave() {
    if (form.PROJECT_CODE && form.PROJECT_CODE !== '7122155' && form.PROJECT_CODE !== '7004686') {
      alert('⚠ Mã dự án không tồn tại! Vui lòng nhập đúng mã (ví dụ: 7122155)')
      return
    }
    if (!form.PROJECT_CODE || !form.SEND_DATE || !form.PROJECT_MANAGEMENT_CODE) {
      alert('⚠ Vui lòng nhập đầy đủ các trường bắt buộc (*)')
      return
    }
    const newFileId = 'HS-CHI-2026-' + String(Date.now()).slice(-4)
    setForm((f) => ({ ...f, DOSSIER_CODE: newFileId }))
    alert('✔ [VDBAS-CHI-0000]: Lưu hồ sơ thành công!\n\nMã hồ sơ: ' + newFileId + '\nBạn có thể bắt đầu Thêm mới chứng từ.')
    setIsDirty(false)
    setHasSaved(true)
  }

  function onSaveDraft() {
    alert('💾 [VDBAS-CHI-0000]: Lưu nháp thành công!\nTrạng thái: Đang hoàn thiện')
    setIsDirty(false)
  }

  function onSubmit() {
    if (window.confirm('Bạn có chắc muốn Gửi kiểm soát?\n\nSau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ kiểm soát.')) {
      alert('✔ [VDBAS-CHI-0001]: Đã gửi hồ sơ để kiểm soát!\nThông báo đã gửi đến Người kiểm soát.')
      navigateBack()
    }
  }

  function onApprove() {
    if (window.confirm('Xác nhận phê duyệt hồ sơ này?')) {
      alert('[VDBAS-CHI-0003] Đã phê duyệt hồ sơ thành công.')
      navigateBack()
    }
  }

  function onReject() {
    const reason = window.prompt('Nhập lý do từ chối:')
    if (reason && reason.trim()) {
      alert('[VDBAS-CHI-0004] Đã từ chối hồ sơ. Lý do: ' + reason.trim())
      navigateBack()
    }
  }

  function onCancelRecord() {
    if (window.confirm('Xác nhận hủy bỏ hồ sơ này? Hồ sơ sẽ chuyển trạng thái "Đã huỷ".')) {
      alert('[VDBAS-CHI-0005] Đã hủy bỏ hồ sơ.')
      navigateBack()
    }
  }

  function onCopy() {
    navigate('/capex-dossiers/detail', { copy: record?.id ?? '', mode: 'new' })
  }

  function onConfirmDelete() {
    alert('✔ [VDBAS-CHI-0002]: Xoá hồ sơ thành công!\nHồ sơ đã được ẩn khỏi danh sách.')
    navigateBack()
  }

  function switchToEdit() {
    if (record) navigate('/capex-dossiers/detail', { id: record.id, mode: 'edit' })
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLkOpen) { closeLookup(); return }
        onCancel(); return
      }
      if (e.key === 'F4') {
        const el = document.activeElement as HTMLElement
        if (el?.dataset?.lookup && !isViewMode) { e.preventDefault(); openLookup(el.dataset.lookup) }
        return
      }
      if (e.key === 'F2' && isViewMode) { e.preventDefault(); switchToEdit(); return }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') { e.preventDefault(); onSaveDraft(); return }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); onSave(); return }
      if (e.key === 'F9') { e.preventDefault(); onSubmit(); return }
      if (e.altKey && e.key === 'h') { setActiveTab('tab-history'); return }
      if (e.altKey && e.key === 'p') { setActiveTab('tab-approval'); return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isDirty, isLkOpen, isViewMode])

  const canConfirmDelete = deleteReason.length >= 10 && confirmReviewed
  const showDocGrid = mode !== 'new' || hasSaved

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* App Header */}
      <div className="app-header">
        <div className="left">
          <div className="breadcrumb">
            <span style={{ cursor: 'pointer' }} onClick={navigateBack}>Danh sách hồ sơ Chi đầu tư</span>
            &rsaquo; <span data-page-title>{pageTitle}</span>
          </div>
          <h1 data-page-title>{pageTitle}</h1>
        </div>
        <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="header-actions">
            {isViewMode && showBtn('PRINT') && (
              <button
                className="btn btn-default"
                data-testid="btn-print"
                data-btn="PRINT"
                data-event-id="EXP.CAPEX_DOSSIER.VIEW.PRINT"
                title="In phiếu (Ctrl+P)"
                disabled={disableBtn('PRINT')}
              >
                🖨️ In phiếu <span className="shortcut">Ctrl+P</span>
              </button>
            )}
            {isViewMode && showBtn('EDIT') && (
              <button
                className="btn btn-default"
                data-testid="btn-edit-top"
                data-btn="EDIT"
                data-event-id="EXP.CAPEX_DOSSIER.EDIT.OPEN"
                onClick={switchToEdit}
                title="Sửa (F2)"
              >
                ✏️ Sửa <span className="shortcut">F2</span>
              </button>
            )}
          </div>
          <span className={`status-badge ${statusBadgeClass}`}>{statusBadgeText}</span>
        </div>
      </div>

      <div className="page-wrapper">
        {/* Tab Navigation */}
        <div className="card" style={{ marginBottom: 0, borderBottom: 'none', borderRadius: '4px 4px 0 0' }}>
          <div className="tab-nav" id="tab-nav">
            {[
              { id: 'tab-general', label: '📋 Thông tin hồ sơ', eventId: 'EXP.CAPEX_DOSSIER.VIEW.GENERAL' },
              { id: 'tab-attach', label: '📎 Đính kèm tài liệu', eventId: 'EXP.CAPEX_DOSSIER.VIEW.ATTACHMENTS' },
              { id: 'tab-history', label: '🕐 Lịch sử', eventId: 'EXP.CAPEX_DOSSIER.VIEW.HISTORY', title: 'Alt+H' },
              { id: 'tab-approval', label: '✅ Trạng thái phê duyệt', eventId: 'EXP.CAPEX_DOSSIER.VIEW.APPROVAL', title: 'Alt+P' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                data-event-id={tab.eventId}
                title={tab.title}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="card" style={{ borderRadius: '0', borderTop: 'none' }}>

          {/* TAB: Thông tin hồ sơ */}
          <div className={`tab-pane${activeTab === 'tab-general' ? ' active' : ''}`} id="tab-general">
            {mode === 'new' && (
              <div className="info-label">
                💡 Điền đầy đủ thông tin và bấm <strong>Lưu</strong> để tạo hồ sơ. Mã hồ sơ sẽ được tự động sinh sau khi lưu lần đầu.
              </div>
            )}

            <div className="form-grid">
              {/* DOSSIER_CODE */}
              <div className="form-group" data-field-code="DOSSIER_CODE" data-field-type="String" data-component="TextBox" data-required="Y" data-max-length="30" data-spec-ref="B1.1.row1" data-validation="VAL-11,VAL-17" data-show-when="" data-lov="">
                <label>Mã hồ sơ <span className="req">*</span></label>
                <input
                  name="DOSSIER_CODE" type="text" className="form-control"
                  readOnly disabled
                  placeholder="(Tự động sinh sau khi Lưu)"
                  value={form.DOSSIER_CODE}
                  data-api-field="header.investPaymentFileId"
                  data-testid="input-invest-payment-file-id"
                />
              </div>

              {/* SEND_DATE */}
              <div className="form-group" data-field-code="SEND_DATE" data-field-type="Date" data-component="DatePicker" data-required="Y" data-spec-ref="B1.1.row2" data-validation="VAL-02,VAL-04,VAL-08" data-show-when="" data-lov="">
                <label>Ngày gửi hồ sơ <span className="req">*</span></label>
                <input
                  name="SEND_DATE" type="text" className="form-control"
                  placeholder="dd/mm/yyyy"
                  value={form.SEND_DATE}
                  onChange={(e) => { setForm((f) => ({ ...f, SEND_DATE: e.target.value })); setIsDirty(true) }}
                  disabled={fieldDisabled()}
                  data-api-field="header.sendDate"
                  data-testid="input-send-date"
                  style={{ maxWidth: '160px' }}
                />
              </div>

              {/* DATA_SOURCE_CODE */}
              <div className="form-group" data-field-code="DATA_SOURCE_CODE" data-field-type="String" data-component="Dropdown" data-required="Y" data-spec-ref="B1.1.row10" data-validation="VAL-03" data-show-when="" data-lov="LOV.03">
                <label>Nguồn <span className="req">*</span></label>
                <select
                  name="DATA_SOURCE_CODE" className="form-control"
                  value={form.DATA_SOURCE_CODE}
                  onChange={(e) => { setForm((f) => ({ ...f, DATA_SOURCE_CODE: e.target.value })); setIsDirty(true) }}
                  disabled={fieldDisabled(mode === 'edit' || isViewMode)}
                  data-api-field="header.source"
                  data-testid="select-source"
                >
                  <option value="Thủ công">Thủ công</option>
                  <option value="DVC">DVC</option>
                </select>
              </div>

              {/* F_STATUS (Label) */}
              <div className="form-group" data-field-code="F_STATUS" data-field-type="String" data-component="Label" data-required="Y" data-spec-ref="B1.1.row4" data-validation="VAL-13" data-show-when="" data-lov="LOV.STATUS">
                <label>Trạng thái hồ sơ <span className="req">*</span></label>
                <div
                  className="form-control"
                  style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5' }}
                  data-api-field="header.investPaymentFileStatus"
                  data-testid="label-status"
                >
                  <span className={`status-badge ${statusBadgeClass}`}>{statusBadgeText}</span>
                </div>
              </div>

              {/* PROJECT_CODE */}
              <div
                className={`form-group${projectCodeError ? ' has-error' : ''}`}
                data-field-code="PROJECT_CODE" data-field-type="String" data-component="DropdownLookup"
                data-required="Y" data-max-length="20" data-spec-ref="B1.1.row3"
                data-validation="VAL-01,VAL-03,VAL-06" data-show-when="" data-lov="LOV.01"
              >
                <label>Mã dự án/công trình <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="PROJECT_CODE" type="text"
                    className={`form-control${projectCodeError ? ' error' : ''}`}
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.PROJECT_CODE}
                    onChange={(e) => handleProjectCodeChange(e.target.value)}
                    disabled={fieldDisabled()}
                    data-api-field="header.projectId"
                    data-testid="input-project-id"
                    data-lookup="PROJECT"
                  />
                  <button type="button" className="btn-lookup" title="F4 — Tra cứu dự án" data-testid="btn-lookup-project" onClick={() => openLookup('PROJECT')} disabled={fieldDisabled()}>🔍</button>
                </div>
                {projectCodeError && <span className="error-msg" style={{ display: 'block' }}>{projectCodeError}</span>}
              </div>

              {/* PROJECT_NAME */}
              <div className="form-group" data-field-code="PROJECT_NAME" data-field-type="String" data-component="TextBox" data-required="C" data-max-length="255" data-spec-ref="B1.1.row4" data-validation="VAL-06" data-show-when="" data-lov="LOV.01">
                <label>Tên dự án/công trình <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_NAME" type="text" className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã dự án)"
                  value={form.PROJECT_NAME}
                  data-api-field="header.projectName"
                  data-testid="input-project-name"
                />
              </div>

              {/* PROJECT_SPECIFIC_CODE — Military only */}
              {showMilitary && (
                <div className="form-group" id="group-PROJECT_SPECIFIC_CODE" data-field-code="PROJECT_SPECIFIC_CODE" data-field-type="String" data-component="DropdownLookup" data-required="N" data-max-length="20" data-spec-ref="B1.1.row5" data-validation="VAL-03,VAL-06" data-show-when="PROJECT_TYPE === 'Military'" data-lov="LOV.01">
                  <label>Mã dự án đặc thù</label>
                  <div className="input-group">
                    <input
                      name="PROJECT_SPECIFIC_CODE" type="text" className="form-control"
                      placeholder="F4 — Tra cứu mã đặc thù"
                      value={form.PROJECT_SPECIFIC_CODE}
                      onChange={(e) => { setForm((f) => ({ ...f, PROJECT_SPECIFIC_CODE: e.target.value })); setIsDirty(true) }}
                      disabled={fieldDisabled()}
                      data-api-field="header.projectSpecId"
                      data-testid="input-project-spec-id"
                      data-lookup="SPEC"
                    />
                    <button type="button" className="btn-lookup" title="F4" data-testid="btn-lookup-spec" onClick={() => openLookup('SPEC')} disabled={fieldDisabled()}>🔍</button>
                  </div>
                </div>
              )}

              {/* PROJECT_SPECIFIC_NAME — Military only */}
              {showMilitary && (
                <div className="form-group" id="group-PROJECT_SPECIFIC_NAME" data-field-code="PROJECT_SPECIFIC_NAME" data-field-type="String" data-component="TextBox" data-required="C" data-max-length="255" data-spec-ref="B1.1.row6" data-validation="VAL-06" data-show-when="PROJECT_TYPE === 'Military'" data-lov="LOV.01">
                  <label>Tên dự án đặc thù <span className="cond">(*)</span></label>
                  <input
                    name="PROJECT_SPECIFIC_NAME" type="text" className="form-control"
                    readOnly
                    placeholder="(Tự động fill)"
                    value={form.PROJECT_SPECIFIC_NAME}
                    data-api-field="header.projectSpecName"
                    data-testid="input-project-spec-name"
                  />
                </div>
              )}

              {/* PROJECT_MANAGEMENT_CODE */}
              <div className="form-group" data-field-code="PROJECT_MANAGEMENT_CODE" data-field-type="String" data-component="DropdownLookup" data-required="Y" data-max-length="20" data-spec-ref="B1.1.row7" data-validation="VAL-01,VAL-03,VAL-06" data-show-when="" data-lov="LOV.01.GL_SEGMENT6">
                <label>Mã ĐVQHNS <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="PROJECT_MANAGEMENT_CODE" type="text" className="form-control"
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.PROJECT_MANAGEMENT_CODE}
                    onChange={(e) => handleBoardIdChange(e.target.value)}
                    disabled={fieldDisabled()}
                    data-api-field="header.projectManagementBoardId"
                    data-testid="input-project-management-board-id"
                    data-lookup="BOARD"
                  />
                  <button type="button" className="btn-lookup" title="F4 — Tra cứu ĐVQHNS" data-testid="btn-lookup-board" onClick={() => openLookup('BOARD')} disabled={fieldDisabled()}>🔍</button>
                </div>
              </div>

              {/* PROJECT_MANAGEMENT_NAME */}
              <div className="form-group span-3" data-field-code="PROJECT_MANAGEMENT_NAME" data-field-type="String" data-component="TextBox" data-required="C" data-max-length="255" data-spec-ref="B1.1.row8" data-validation="VAL-06" data-show-when="" data-lov="LOV.01.GL_SEGMENT6">
                <label>Tên ĐVQHNS <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_MANAGEMENT_NAME" type="text" className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã ĐVQHNS)"
                  value={form.PROJECT_MANAGEMENT_NAME}
                  data-api-field="header.projectManagementBoardName"
                  data-testid="input-project-management-board-name"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar" style={{ position: 'static', boxShadow: 'none', padding: '16px 0 0 0', marginTop: '16px', border: 'none', borderTop: '1px dashed var(--border)', borderRadius: 0 }}>
              <div className="action-bar-left">
                {/* Delete: view mode via BTN_MATRIX; edit mode always show */}
                {(isViewMode && showBtn('DELETE')) && (
                  <button className="btn btn-danger" data-testid="btn-delete" data-btn="DELETE" data-event-id="EXP.CAPEX_DOSSIER.DELETE.OPEN" title="Xoá (Delete)" data-action="delete"
                    disabled={disableBtn('DELETE')}
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    🗑 Xoá <span className="shortcut">Del</span>
                  </button>
                )}
                {mode === 'edit' && (
                  <button className="btn btn-danger" data-testid="btn-delete" data-btn="DELETE" data-event-id="EXP.CAPEX_DOSSIER.DELETE.OPEN" title="Xoá (Delete)" data-action="delete"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    🗑 Xoá <span className="shortcut">Del</span>
                  </button>
                )}
                {/* Cancel Record: view mode via BTN_MATRIX */}
                {isViewMode && showBtn('CANCEL') && (
                  <button className="btn btn-warning" data-btn="CANCEL" data-testid="btn-cancel-record" data-event-id="EXP.CAPEX_DOSSIER.CANCEL" onClick={onCancelRecord} title="Hủy bỏ hồ sơ" disabled={disableBtn('CANCEL')}>
                    ⊘ Hủy bỏ
                  </button>
                )}
              </div>
              <div className="action-bar-right">
                {/* Cancel edit/new */}
                {isNewOrEdit && (
                  <button className="btn btn-default" data-testid="btn-cancel" data-event-id="EXP.CAPEX_DOSSIER.NEW.CANCEL" onClick={onCancel} title="Huỷ (Esc)">
                    Huỷ <span className="shortcut">Esc</span>
                  </button>
                )}
                {/* Back (view) */}
                {isViewMode && (
                  <button className="btn btn-default" data-testid="btn-back" data-event-id="EXP.CAPEX_DOSSIER.VIEW.BACK" onClick={navigateBack} title="Quay lại danh sách">
                    ← Quay lại
                  </button>
                )}
                {/* Save draft */}
                {isNewOrEdit && (
                  <button className="btn btn-default" data-testid="btn-save-draft" data-event-id="EXP.CAPEX_DOSSIER.NEW.SAVE_DRAFT" onClick={onSaveDraft} title="Lưu nháp (Ctrl+Shift+S)">
                    💾 Lưu nháp <span className="shortcut">Ctrl+Shift+S</span>
                  </button>
                )}
                {/* Save */}
                {isNewOrEdit && (
                  <button className="btn btn-primary" data-testid="btn-save" data-event-id="EXP.CAPEX_DOSSIER.NEW.SAVE" onClick={onSave} title="Lưu (Ctrl+S)">
                    ✔ Lưu <span className="shortcut">Ctrl+S</span>
                  </button>
                )}
                {/* Add doc (global) */}
                {isNewOrEdit && (
                  <button
                    className="btn btn-success"
                    style={{ background: '#28a745', color: '#fff', borderColor: '#28a745' }}
                    id="btn-add-doc-global"
                    data-testid="btn-add-doc-global"
                    data-event-id="EXP.CAPEX_DOSSIER.NEW.ADD_DOC"
                    disabled={mode === 'new' && !hasSaved}
                    onClick={() => window.alert('[Prototype] Màn hình chọn chứng từ chưa được tích hợp vào React')}
                  >
                    + Thêm mới chứng từ
                  </button>
                )}
                {/* Copy */}
                {isViewMode && showBtn('COPY') && (
                  <button className="btn btn-default" data-btn="COPY" data-testid="btn-copy" data-event-id="EXP.CAPEX_DOSSIER.NEW.COPY" onClick={onCopy} disabled={disableBtn('COPY')}>
                    📋 Sao chép
                  </button>
                )}
                {/* Submit */}
                {isViewMode && showBtn('SUBMIT') && (
                  <button
                    className="btn btn-primary"
                    data-btn="SUBMIT"
                    data-testid="btn-submit"
                    data-event-id="EXP.CAPEX_DOSSIER.NEW.SUBMIT"
                    onClick={onSubmit}
                    disabled={disableBtn('SUBMIT') || !record?.documents?.length}
                  >
                    📤 Gửi phê duyệt
                  </button>
                )}
                {/* Reject */}
                {isViewMode && showBtn('REJECT') && (
                  <button className="btn btn-danger" data-btn="REJECT" data-testid="btn-reject" data-event-id="EXP.CAPEX_DOSSIER.REJECT" onClick={onReject} disabled={disableBtn('REJECT')}>
                    ✖ Từ chối
                  </button>
                )}
                {/* Approve */}
                {isViewMode && showBtn('APPROVE') && (
                  <button className="btn btn-primary" data-btn="APPROVE" data-testid="btn-approve" data-event-id="EXP.CAPEX_DOSSIER.APPROVE" onClick={onApprove} disabled={disableBtn('APPROVE')}>
                    ✅ Phê duyệt
                  </button>
                )}
              </div>
            </div>

            {/* Document section (B1.2) */}
            <div id="tab-documents-section" style={{ marginTop: '16px', paddingTop: '24px', borderTop: '1px dashed var(--border)' }}>
              {mode === 'new' && !hasSaved && (
                <div className="info-label" id="doc-new-notice">
                  💡 Lưu hồ sơ trước để có thể thêm chứng từ.
                </div>
              )}
              {showDocGrid && (
                <div id="doc-grid-area">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>Danh sách chứng từ</span>
                    {(mode === 'edit' || (mode === 'new' && hasSaved)) && (
                      <button
                        className="btn btn-primary btn-sm"
                        id="btn-add-doc"
                        data-testid="btn-add-doc"
                        data-event-id="EXP.CAPEX_DOSSIER.NEW.ADD_DOC"
                        title="Thêm mới chứng từ"
                        onClick={() => window.alert('[Prototype] Màn hình chọn chứng từ chưa được tích hợp vào React')}
                      >
                        + Thêm mới chứng từ
                      </button>
                    )}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" id="doc-table">
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}>Số TT</th>
                          <th>Tên chứng từ</th>
                          <th>Số chứng từ</th>
                          <th>Ngày chứng từ</th>
                          <th>Ngày hạch toán</th>
                          <th className="text-right">Số tiền nguyên tệ</th>
                          <th className="text-right">Số tiền VND</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody id="doc-tbody">
                        {docs.length === 0 ? (
                          <tr><td colSpan={8} className="grid-empty">Chưa có chứng từ nào</td></tr>
                        ) : (
                          docs.map((d, i) => (
                            <tr key={d.DOC_ID}>
                              <td>{i + 1}</td>
                              <td>
                                <a href="#" onClick={(e) => { e.preventDefault(); alert(`Prototype: Mở chi tiết — ${d.DOC_ID}`) }}>
                                  {d.DOC_ID}
                                </a>
                              </td>
                              <td>{d.DOC_DATE}</td>
                              <td>{d.POSTING_DATE}</td>
                              <td>{d.DOC_NAME}</td>
                              <td className="text-right">{d.PAYMENT_AMOUNT ? formatNum(d.PAYMENT_AMOUNT) : '—'}</td>
                              <td className="text-right">{formatNum(d.VND_PAYMENT_AMOUNT)}</td>
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <button type="button" className="btn btn-ghost btn-sm" title="Xem" style={{ padding: '4px', fontSize: '16px', border: 'none' }} onClick={() => window.alert('[Prototype] Màn hình chứng từ DNTT chưa được tích hợp vào React')}>👁️</button>
                                {!isViewMode && (
                                  <button type="button" className="btn btn-ghost btn-sm" title="Sửa" style={{ padding: '4px', fontSize: '14px', border: 'none' }} onClick={() => window.alert('[Prototype] Màn hình chứng từ DNTT chưa được tích hợp vào React')}>✏️</button>
                                )}
                                {!isViewMode && (
                                  <button type="button" className="btn btn-ghost btn-sm" title="Xóa" style={{ padding: '4px', fontSize: '14px', border: 'none', color: 'var(--danger)' }}
                                    onClick={() => { if (window.confirm('Xóa chứng từ?')) setDocs((prev) => prev.filter((x) => x.DOC_ID !== d.DOC_ID)) }}
                                  >🗑️</button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'right' }}>Tổng cộng:</td>
                          <td className="text-right" id="doc-total">{formatNum(docTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TAB: Đính kèm */}
          <div className={`tab-pane${activeTab === 'tab-attach' ? ' active' : ''}`} id="tab-attach">
            <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              [Chuẩn đính kèm chung VDBAS — sự kiện: EXP.CAPEX_DOSSIER.ATTACH.UPLOAD]
            </div>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
              <div>Kéo thả file vào đây hoặc</div>
              <button
                type="button" className="btn btn-primary" style={{ marginTop: '8px' }}
                data-testid="btn-upload-file"
                data-event-id="EXP.CAPEX_DOSSIER.ATTACH.UPLOAD"
              >
                Chọn file
              </button>
              <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-muted)' }}>
                Hỗ trợ: PDF, DOCX, XLSX, JPG, PNG — Tối đa 10MB/file
              </div>
            </div>
          </div>

          {/* TAB: Lịch sử */}
          <div className={`tab-pane${activeTab === 'tab-history' ? ' active' : ''}`} id="tab-history">
            <table className="history-table">
              <thead>
                <tr>
                  <th>STT</th><th>Người tạo</th><th>Ngày tạo</th>
                  <th>Người cập nhật cuối</th><th>Ngày cập nhật cuối</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody id="history-tbody">
                <tr><td colSpan={6} className="grid-empty">Chưa có lịch sử</td></tr>
              </tbody>
            </table>
          </div>

          {/* TAB: Trạng thái phê duyệt */}
          <div className={`tab-pane${activeTab === 'tab-approval' ? ' active' : ''}`} id="tab-approval">
            <div className="workflow" id="approval-workflow">
              {approvalSteps.map((sp, i) => (
                <React.Fragment key={sp.role}>
                  {i > 0 && <div className="wf-arrow">→</div>}
                  <div className={`wf-step${sp.cls ? ' ' + sp.cls : ''}`}>
                    <div className="wf-role">{sp.role}</div>
                    <div className="wf-user">{sp.user || '—'}</div>
                    <div className="wf-date">{sp.label}{sp.date ? ' · ' + sp.date : ''}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {approvalDetailMsg && (
              <div id="approval-detail" style={{ fontSize: '13px', textAlign: 'center', marginTop: '12px', color: approvalDetailMsg.color }}>
                {approvalDetailMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lookup Modal */}
      {isLkOpen && (
        <div className="lk-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeLookup() }}>
          <div className="lk-box" role="dialog" aria-modal>
            <div className="lk-head">
              <span id="lk-title">{lkKey ? LK_TITLES[lkKey] || '🏛 Chọn' : ''}</span>
              <button className="lk-x" onClick={closeLookup}>✕</button>
            </div>
            <div className="lk-search-row">
              <input
                ref={lkRef}
                type="text" className="lk-search"
                placeholder="Tìm theo mã hoặc tên..."
                value={lkSearch}
                onChange={(e) => setLkSearch(e.target.value)}
              />
              <span className="lk-count">{lkEntries.length} / {lkKey ? (LK_DATA[lkKey] || []).length : 0} bản ghi</span>
            </div>
            <div className="lk-table-wrap">
              <table className="lk-table">
                <thead>
                  <tr><th style={{ width: '180px' }}>Mã</th><th>Tên</th></tr>
                </thead>
                <tbody id="lk-tbody">
                  {lkEntries.length === 0 ? (
                    <tr><td colSpan={2} className="lk-empty">Không tìm thấy kết quả</td></tr>
                  ) : (
                    lkEntries.map((r) => (
                      <tr key={r.code} onClick={() => pickLookup(String(r.code))}>
                        <td className="lk-code">{r.code}</td>
                        <td>{r.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="lk-foot">
              <span className="lk-hint">Click vào dòng để chọn • Esc để đóng</span>
              <button className="btn btn-default" onClick={closeLookup}>Đóng (Esc)</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog (B3.1) */}
      {isDeleteOpen && (
        <div className="modal-overlay" id="dialog-delete-confirm" onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteOpen(false) }}>
          <div className="modal" role="dialog" aria-modal aria-labelledby="delete-dialog-title">
            <div className="modal-header">
              <span className="icon-warn">⚠</span>
              <span className="modal-title" id="delete-dialog-title">Xác nhận xoá hồ sơ</span>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '12px', fontSize: '13px' }}>
                Bạn đang thực hiện xoá hồ sơ <strong id="delete-record-id">{record?.DOSSIER_CODE || ''}</strong>. Hành động này không thể hoàn tác.
              </p>
              <div className="form-group" style={{ marginBottom: '12px' }} data-field-code="DELETE_REASON" data-field-type="String" data-component="TextArea" data-required="Y" data-spec-ref="B3.1.row3" data-validation="VAL-16">
                <label>Lý do xoá <span className="req">*</span> <small style={{ fontWeight: 'normal' }}>(tối thiểu 10 ký tự)</small></label>
                <textarea
                  id="delete-reason" name="DELETE_REASON" className="form-control"
                  rows={3} maxLength={500}
                  placeholder="Nhập lý do xoá hồ sơ..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  data-api-field="deleteReason"
                  data-testid="input-delete-reason"
                />
                <div className={`char-counter${deleteReason.length < 10 ? ' warn' : ''}`}>{deleteReason.length} / 500</div>
              </div>
              <div className="form-check" data-field-code="CONFIRM_REVIEWED" data-field-type="Boolean" data-component="Checkbox" data-required="Y" data-spec-ref="B3.1.row4" data-validation="VAL-16">
                <input
                  type="checkbox" id="confirm-reviewed"
                  checked={confirmReviewed}
                  onChange={(e) => setConfirmReviewed(e.target.checked)}
                  data-api-field="confirmReviewed"
                  data-testid="checkbox-confirm-reviewed"
                />
                <label htmlFor="confirm-reviewed">Tôi đã rà soát và xác nhận xoá hồ sơ này</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" data-testid="btn-cancel-delete" data-event-id="EXP.CAPEX_DOSSIER.DELETE.CANCEL" onClick={() => setIsDeleteOpen(false)}>Huỷ</button>
              <button
                className="btn btn-danger"
                id="btn-confirm-delete"
                disabled={!canConfirmDelete}
                data-action="confirm-delete"
                data-testid="btn-confirm-delete"
                data-event-id="EXP.CAPEX_DOSSIER.DELETE.CONFIRM"
                onClick={onConfirmDelete}
              >
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {isCancelConfirmOpen && (
        <div className="modal-overlay" id="dialog-cancel-confirm" onClick={(e) => { if (e.target === e.currentTarget) setIsCancelConfirmOpen(false) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="icon-warn">❓</span>
              <span className="modal-title">Xác nhận huỷ</span>
            </div>
            <div className="modal-body">
              <p>Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setIsCancelConfirmOpen(false)}>Tiếp tục chỉnh sửa</button>
              <button className="btn btn-primary" onClick={navigateBack}>Xác nhận huỷ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CapexDossierDetailPage
