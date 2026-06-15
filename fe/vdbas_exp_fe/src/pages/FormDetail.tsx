import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './FormDetail.css'
import type { DossierRecord, DossierStatus, LovEntry } from './FormDetail.mock'
import { CapexDossierHooks, MasterDataHooks } from '../hooks/useCapexDossier'
import type { DossierDetail, ProjectInfo, DataSourceCode } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type PageMode = 'new' | 'edit' | 'view'
type TabId = 'tab-general' | 'tab-documents' | 'tab-attach' | 'tab-history' | 'tab-approval'

interface FormState {
  DOSSIER_CODE: string
  SEND_DATE: string
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_SPECIFIC_CODE: string
  PROJECT_SPECIFIC_NAME: string
  PROJECT_MANAGEMENT_CODE: string
  PROJECT_MANAGEMENT_NAME: string
  STATE_CODE: DossierStatus
  DATA_SOURCE_CODE: string
}

interface LovFilters {
  code: string
  name: string
  type: string
  seg6: string
}

interface FormDetailProps {
  mode?: PageMode
  recordId?: string | null
  isConcurrentlyEdited?: boolean
  currentHour?: number
  onNavigate?: (path: string, params?: Record<string, string>) => void
}

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayDMY(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function getInitialForm(record: DossierRecord | null): FormState {
  if (record) {
    return {
      DOSSIER_CODE: record.DOSSIER_CODE,
      SEND_DATE: record.SEND_DATE,
      PROJECT_CODE: record.PROJECT_CODE,
      PROJECT_NAME: record.PROJECT_NAME,
      PROJECT_SPECIFIC_CODE: record.PROJECT_SPECIFIC_CODE ?? '',
      PROJECT_SPECIFIC_NAME: record.PROJECT_SPECIFIC_NAME ?? '',
      PROJECT_MANAGEMENT_CODE: record.PROJECT_MANAGEMENT_CODE,
      PROJECT_MANAGEMENT_NAME: record.PROJECT_MANAGEMENT_NAME,
      STATE_CODE: record.STATE_CODE,
      DATA_SOURCE_CODE: record.DATA_SOURCE_CODE,
    }
  }
  return {
    DOSSIER_CODE: '',
    SEND_DATE: todayDMY(),
    PROJECT_CODE: '',
    PROJECT_NAME: '',
    PROJECT_SPECIFIC_CODE: '',
    PROJECT_SPECIFIC_NAME: '',
    PROJECT_MANAGEMENT_CODE: '',
    PROJECT_MANAGEMENT_NAME: '',
    STATE_CODE: 'DRAFT',
    DATA_SOURCE_CODE: 'Thủ công',
  }
}

function formatVND(n: number | null | undefined): string {
  if (!n) return '0'
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 })
}

function formatFX(n: number | null | undefined): string {
  if (!n) return '—'
  return n.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function nowDMYHMS(): string {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`
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

function toISODate(dmy: string): string {
  if (!dmy) return ''
  const [d, m, y] = dmy.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function toDetailRecord(d: DossierDetail): DossierRecord {
  const docTotalVnd = (d.documents ?? []).reduce((s, doc) =>
    s + (doc.lines ?? []).reduce((ls, ln) => ls + (ln.paymentRequestAmountVnd ?? 0), 0), 0)
  return {
    id: d.dossierId,
    DOSSIER_CODE: d.dossierCode,
    SEND_DATE: fromISODate(d.sendDate),
    PROJECT_CODE: d.projectCode,
    PROJECT_NAME: d.projectName,
    PROJECT_TYPE: d.projectSpecificCode ? 'Military' : 'Citizen',
    PROJECT_SPECIFIC_CODE: d.projectSpecificCode ?? null,
    PROJECT_SPECIFIC_NAME: d.projectSpecificName ?? null,
    PROJECT_MANAGEMENT_CODE: d.projectManagementCode,
    PROJECT_MANAGEMENT_NAME: d.projectManagementName,
    STATE_CODE: d.stateCode,
    DATA_SOURCE_CODE: d.dataSourceCode,
    CREATED_BY: d.createdBy,
    CREATED_DATE: fromISODateTime(d.createdDate),
    LAST_UPDATED_BY: d.updatedBy,
    LAST_UPDATED_DATE: fromISODateTime(d.updatedDate),
    TOTAL_VND: docTotalVnd,
    DOCUMENT_COUNT: (d.documents ?? []).length,
    documents: (d.documents ?? []).map(doc => ({
      DOCUMENT_NUMBER: doc.documentNumber,
      DOCUMENT_DATE: fromISODate(doc.documentDate),
      ACCOUNTING_DATE: fromISODate(doc.accountingDate),
      DOC_NAME: doc.projectItemName ?? '',
      PAYMENT_REQUEST_AMOUNT: (doc.lines ?? []).reduce((s, ln) => s + (ln.paymentRequestAmount ?? 0), 0) || null,
      PAYMENT_REQUEST_AMOUNT_VND: (doc.lines ?? []).reduce((s, ln) => s + (ln.paymentRequestAmountVnd ?? 0), 0),
      currencyTypeCode: doc.currencyTypeCode,
    })),
    CHECKED_BY: d.checkedBy ?? undefined,
    CHECKED_DATE: fromISODate(d.checkedDate) || undefined,
    APPROVED_BY: d.approvedBy ?? undefined,
    APPROVED_DATE: fromISODate(d.approvedDate) || undefined,
    CHECK_REJECTION_REASON: d.checkRejectionReason ?? undefined,
    APPROVAL_REJECTION_REASON: d.approvalRejectionReason ?? undefined,
  }
}

function toProjectLovEntry(p: ProjectInfo): LovEntry {
  return {
    PROJECT_CODE: p.projectCode,
    PROJECT_NAME: p.projectName,
    PROJECT_TYPE: p.projectTypeCode,
    PROJECT_SPECIFIC_CODE: p.projectSpecificCode ?? null,
    PROJECT_SPECIFIC_NAME: p.projectSpecificName ?? null,
    GL_SEGMENT6_CODE: p.projectManagementCode,
    GL_SEGMENT6_NAME: p.projectManagementName,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormDetail({
  mode: modeProp,
  recordId: recordIdProp,
  isConcurrentlyEdited = false,
  currentHour = new Date().getHours(),
  onNavigate,
}: FormDetailProps) {
  // Resolve mode and recordId from props or URL
  const searchParams = new URLSearchParams(window.location.search)
  const initialMode = modeProp ?? ((searchParams.get('mode') || 'view') as PageMode)
  const initialRecordId = recordIdProp !== undefined ? recordIdProp : searchParams.get('id')
  const autoAction = searchParams.get('action')

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode] = useState<PageMode>(initialMode)
  const [form, setForm] = useState<FormState>(() => getInitialForm(null))
  const [activeTab, setActiveTab] = useState<TabId>('tab-general')
  const [isDirty, setIsDirty] = useState(false)
  const [showMilitaryFields, setShowMilitaryFields] = useState(false)

  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isLookupOpen, setIsLookupOpen] = useState(false)
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [isConcurrentOpen, setIsConcurrentOpen] = useState(false)
  const [isOutsideHourOpen, setIsOutsideHourOpen] = useState(false)
  const [isSessionExpiredOpen] = useState(false)

  // Delete dialog form
  const [deleteReason, setDeleteReason] = useState('')
  const [confirmReviewed, setConfirmReviewed] = useState(false)
  const [deletedBy, setDeletedBy] = useState('')
  const [deletedDate, setDeletedDate] = useState('')

  // Lookup
  const [lookupTarget, setLookupTarget] = useState<'project' | 'board' | 'spec'>('project')
  const [lovFilters, setLovFilters] = useState<LovFilters>({ code: '', name: '', type: '', seg6: '' })
  const { data: projectsData } = MasterDataHooks.useProjects({
    code: lovFilters.code || undefined,
    name: lovFilters.name || undefined,
    projectTypeCode: lovFilters.type ? lovFilters.type as 'Military' | 'Citizen' : undefined,
    projectManagementCode: lovFilters.seg6 || undefined,
  })
  const lovResults: LovEntry[] = useMemo(() => (projectsData ?? []).map(toProjectLovEntry), [projectsData])

  // Attachment form
  const [attachDocType, setAttachDocType] = useState('')
  const [attachNote, setAttachNote] = useState('')

  // Duplicate check state
  const [dupProject] = useState('')
  const [dupBoard] = useState('')

  const lovCodeInputRef = useRef<HTMLInputElement>(null)
  const deleteReasonRef = useRef<HTMLTextAreaElement>(null)
  const autoDeleteTriggeredRef = useRef(false)

  // ── API ──────────────────────────────────────────────────────────────────────

  const { data: apiDetail, isLoading: isDetailLoading } = CapexDossierHooks.useDetail(initialRecordId ?? '')
  const { data: allProjectsData } = MasterDataHooks.useProjects()
  const createMutation = CapexDossierHooks.useCreate({ skipNotification: false })
  const updateMutation = CapexDossierHooks.useUpdate(initialRecordId ?? '', { skipNotification: false })
  const deleteMutation = CapexDossierHooks.useDelete()
  const submitMutation = CapexDossierHooks.useSubmit()

  // ── Derived from API ──────────────────────────────────────────────────────────

  const record: DossierRecord | null = apiDetail ? toDetailRecord(apiDetail) : null
  const allProjectLovEntries = useMemo(() => (allProjectsData ?? []).map(toProjectLovEntry), [allProjectsData])

  // Initialize form when record loads asynchronously
  useEffect(() => {
    if (apiDetail && initialMode !== 'new') {
      setForm(getInitialForm(toDetailRecord(apiDetail)))
      setShowMilitaryFields(apiDetail.projectSpecificCode != null)
    }
  }, [apiDetail]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ────────────────────────────────────────────────────────────────
  const docs = record?.documents ?? []
  const canEdit = record ? ['DRAFT', 'CHECK_CANCELLED'].includes(record.STATE_CODE) : false
  const canDelete = record?.STATE_CODE === 'DRAFT'
  const canSubmit = docs.length > 0
  const isViewMode = mode === 'view'
  const isReadOnly = (field: 'source') => {
    if (field === 'source') return mode === 'edit' || mode === 'view'
    return false
  }
  const deleteConfirmEnabled = deleteReason.length >= 10 && confirmReviewed

  const pageTitle =
    mode === 'new' ? 'Tạo mới — Hồ sơ Chi đầu tư'
    : mode === 'edit' ? `Chỉnh sửa — ${record?.DOSSIER_CODE || ''}`
    : `${record?.DOSSIER_CODE || ''} — Chi tiết`

  // ── Navigation helper ──────────────────────────────────────────────────────
  function navigateTo(path: string, params?: Record<string, string>) {
    if (onNavigate) {
      onNavigate(path, params)
    } else {
      // Fallback to HTML-style navigation
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      window.location.href = path + qs
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  // Outside-hour warning
  useEffect(() => {
    if (mode === 'new' || mode === 'edit') {
      if (currentHour < 8 || currentHour >= 17) {
        const t = setTimeout(() => setIsOutsideHourOpen(true), 1200)
        return () => clearTimeout(t)
      }
    }
  }, [mode, currentHour])

  // Concurrent edit check
  useEffect(() => {
    if (mode === 'edit' && record && record.PROJECT_TYPE === 'Military' && record.STATE_CODE === 'DRAFT' && isConcurrentlyEdited) {
      const t = setTimeout(() => setIsConcurrentOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [mode, record, isConcurrentlyEdited])

  // Auto-open delete dialog (record loads async — guard against re-trigger)
  useEffect(() => {
    if (autoAction === 'delete' && record && canDelete && !autoDeleteTriggeredRef.current) {
      autoDeleteTriggeredRef.current = true
      const t = setTimeout(() => openDeleteDialog(), 300)
      return () => clearTimeout(t)
    }
  }, [record, canDelete]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus lookup input when opened
  useEffect(() => {
    if (isLookupOpen) {
      setTimeout(() => lovCodeInputRef.current?.focus(), 50)
    }
  }, [isLookupOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S — save
      if (e.ctrlKey && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        if (mode === 'new') onSave()
        else if (mode === 'edit') onSaveEdit()
      }
      // Ctrl+Shift+S — save draft
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        onSaveDraft()
      }
      // F9 — submit
      if (e.key === 'F9') {
        e.preventDefault()
        onSubmit()
      }
      // Escape — cancel / close modals
      if (e.key === 'Escape') {
        if (isLookupOpen) { setIsLookupOpen(false); return }
        if (isDeleteOpen) { setIsDeleteOpen(false); return }
        if (isCancelConfirmOpen) { setIsCancelConfirmOpen(false); return }
        onCancel()
      }
      // Enter — confirm delete when dialog open
      if (e.key === 'Enter' && isDeleteOpen && deleteConfirmEnabled) {
        e.preventDefault()
        onConfirmDelete()
      }
      // F2 — switch to edit (view mode only)
      if (e.key === 'F2' && mode === 'view') {
        e.preventDefault()
        handleSwitchToEdit()
      }
      // F4 — open lookup
      if (e.key === 'F4') {
        e.preventDefault()
        const focused = document.activeElement as HTMLInputElement | null
        if (focused?.name === 'PROJECT_MANAGEMENT_CODE') {
          openLookup('board')
        } else {
          openLookup('project')
        }
      }
      // Alt+H — history tab
      if (e.altKey && e.key === 'h') {
        e.preventDefault()
        setActiveTab('tab-history')
      }
      // Alt+P — approval tab
      if (e.altKey && e.key === 'p') {
        e.preventDefault()
        setActiveTab('tab-approval')
      }
      // Ctrl+Shift+N — add document
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        alert('Prototype: Mở LOV.Chứng từ để thêm mới chứng từ (Ctrl+Shift+N)')
      }
      // Ctrl+U — upload attachment
      if (e.ctrlKey && !e.shiftKey && e.key === 'u') {
        e.preventDefault()
        document.querySelector<HTMLElement>('[data-testid="upload-zone-attachments"]')?.click()
      }
      // Ctrl+J — download attachment
      if (e.ctrlKey && !e.shiftKey && e.key === 'j') {
        e.preventDefault()
        alert('Prototype: Tải xuống file đính kèm đã chọn (Ctrl+J)')
      }
      // Shift+Delete — remove attachment
      if (e.shiftKey && e.key === 'Delete') {
        e.preventDefault()
        alert('Prototype: Xoá file đính kèm đã chọn (Shift+Delete)')
      }
      // Ctrl+P — print preview
      if (e.ctrlKey && !e.shiftKey && e.key === 'p') {
        e.preventDefault()
        openPrintPreview()
      }
      // Ctrl+Shift+C — copy dossier
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        if (record) {
          alert(`Prototype: Sao chép hồ sơ ${record.DOSSIER_CODE}\n→ Mở form Thêm mới với dữ liệu được pre-fill từ hồ sơ gốc (Ctrl+Shift+C)`)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mode, isDeleteOpen, isCancelConfirmOpen, isLookupOpen, deleteConfirmEnabled, isDirty]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form handlers ──────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setIsDirty(true)
  }

  function handleProjectCodeChange(val: string) {
    const proj = allProjectLovEntries.find(p => p.PROJECT_CODE === val)
    setForm(f => ({
      ...f,
      PROJECT_CODE: val,
      PROJECT_NAME: proj?.PROJECT_NAME ?? '',
      PROJECT_MANAGEMENT_CODE: proj ? proj.GL_SEGMENT6_CODE : f.PROJECT_MANAGEMENT_CODE,
      PROJECT_MANAGEMENT_NAME: proj ? proj.GL_SEGMENT6_NAME : f.PROJECT_MANAGEMENT_NAME,
    }))
    setShowMilitaryFields(proj?.PROJECT_TYPE === 'Military')
    setIsDirty(true)
  }

  function handleBoardCodeChange(val: string) {
    const proj = allProjectLovEntries.find(p => p.GL_SEGMENT6_CODE === val)
    setForm(f => ({
      ...f,
      PROJECT_MANAGEMENT_CODE: val,
      PROJECT_MANAGEMENT_NAME: proj?.GL_SEGMENT6_NAME ?? '',
    }))
    setIsDirty(true)
  }

  // ── Action handlers ────────────────────────────────────────────────────────

  function handleSwitchToEdit() {
    if (record) {
      navigateTo('/capex-dossier/detail', { id: record.id, mode: 'edit' })
    }
  }

  function onCancel() {
    if (isDirty) {
      setIsCancelConfirmOpen(true)
    } else {
      navigateTo('/capex-dossiers')
    }
  }

  const validateForm = useCallback((): boolean => {
    if (!form.PROJECT_CODE) {
      alert('[MSG-ERR-REQUIRED] ⚠ Vui lòng nhập Mã dự án/công trình')
      return false
    }
    if (!form.PROJECT_NAME) {
      alert('[MSG-ERR-REQUIRED] ⚠ Tên dự án/công trình không được để trống khi đã chọn Mã dự án')
      return false
    }
    if (!form.PROJECT_MANAGEMENT_CODE) {
      alert('[MSG-ERR-REQUIRED] ⚠ Vui lòng nhập Mã ĐVQHNS')
      return false
    }
    if (!form.PROJECT_MANAGEMENT_NAME) {
      alert('[MSG-ERR-REQUIRED] ⚠ Tên ĐVQHNS không được để trống khi đã chọn Mã ĐVQHNS')
      return false
    }
    if (!form.SEND_DATE) {
      alert('[MSG-ERR-REQUIRED] ⚠ Vui lòng nhập Ngày gửi hồ sơ')
      return false
    }
    return true
  }, [form])

  async function onSave() {
    if (!validateForm()) return
    try {
      await createMutation.mutateAsync({
        sendDate: toISODate(form.SEND_DATE),
        projectCode: form.PROJECT_CODE,
        projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
        projectManagementCode: form.PROJECT_MANAGEMENT_CODE,
        dataSourceCode: form.DATA_SOURCE_CODE as DataSourceCode,
      })
      setIsDirty(false)
      navigateTo('/capex-dossiers')
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      window.alert('[MSG-ERR-SAVE] Lỗi khi tạo hồ sơ')
    }
  }

  async function onSaveEdit() {
    if (!validateForm()) return
    try {
      await updateMutation.mutateAsync({
        sendDate: toISODate(form.SEND_DATE),
        projectCode: form.PROJECT_CODE,
        projectSpecificCode: form.PROJECT_SPECIFIC_CODE || undefined,
        projectManagementCode: form.PROJECT_MANAGEMENT_CODE,
        version: apiDetail?.version ?? 0,
      })
      setIsDirty(false)
      navigateTo('/capex-dossiers')
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      window.alert('[MSG-ERR-SAVE] Lỗi khi cập nhật hồ sơ')
    }
  }

  async function onSaveDraft() {
    if (!validateForm()) return
    try {
      if (mode === 'new') {
        await createMutation.mutateAsync({
          sendDate: toISODate(form.SEND_DATE),
          projectCode: form.PROJECT_CODE,
          projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
          projectManagementCode: form.PROJECT_MANAGEMENT_CODE,
          dataSourceCode: form.DATA_SOURCE_CODE as DataSourceCode,
        })
      } else {
        await updateMutation.mutateAsync({
          sendDate: toISODate(form.SEND_DATE),
          projectCode: form.PROJECT_CODE,
          projectSpecificCode: form.PROJECT_SPECIFIC_CODE || undefined,
          projectManagementCode: form.PROJECT_MANAGEMENT_CODE,
          version: apiDetail?.version ?? 0,
        })
      }
      setIsDirty(false)
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      window.alert('[MSG-ERR-SAVE] Lỗi khi lưu nháp')
    }
  }

  async function onSubmit() {
    if (!validateForm()) return
    if (!canSubmit) {
      window.alert('[MSG-ERR-SUBMIT] Không thể gửi kiểm soát. Hồ sơ cần có ít nhất 1 chứng từ.')
      return
    }
    if (window.confirm('Bạn có chắc muốn Gửi kiểm soát?\n\nSau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ kiểm soát.')) {
      try {
        await submitMutation.mutateAsync(record!.id)
        navigateTo('/capex-dossiers')
      } catch (error: unknown) {
        if ((error as Record<string, unknown>)._handled) return
        window.alert('[MSG-ERR-SUBMIT] Lỗi khi gửi hồ sơ kiểm soát')
      }
    }
  }

  function openDeleteDialog() {
    setDeleteReason('')
    setConfirmReviewed(false)
    setDeletedBy(record?.CREATED_BY || 'current.user')
    setDeletedDate(nowDMYHMS())
    setIsDeleteOpen(true)
  }

  async function onConfirmDelete() {
    try {
      await deleteMutation.mutateAsync({
        id: record!.id,
        data: { deleteReason, confirmReviewed },
      })
      setIsDeleteOpen(false)
      navigateTo('/capex-dossiers')
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      window.alert('[MSG-ERR-DELETE] Lỗi khi xoá hồ sơ')
    }
  }

  // ── Lookup ─────────────────────────────────────────────────────────────────

  function openLookup(target: 'project' | 'board' | 'spec') {
    setLookupTarget(target)
    setLovFilters({ code: '', name: '', type: '', seg6: '' })
    setIsLookupOpen(true)
  }

  function selectLov(p: LovEntry) {
    if (lookupTarget === 'board') {
      handleBoardCodeChange(p.GL_SEGMENT6_CODE)
    } else {
      handleProjectCodeChange(p.PROJECT_CODE)
    }
    setIsLookupOpen(false)
  }

  // ── Print Preview ──────────────────────────────────────────────────────────

  function openPrintPreview() {
    if (!record && mode !== 'view') {
      alert('Chỉ in được khi đang xem hồ sơ')
      return
    }
    setIsPrintOpen(true)
  }

  // ── Approval workflow ──────────────────────────────────────────────────────

  function getWorkflowCircle(status: DossierStatus) {
    const checkerStates = ['PENDING_CHECK', 'CHECK_REJECTED', 'CHECK_CANCELLED']
    const approverStates = ['PENDING_APPROVE', 'APPROVE_REJECTED', 'APPROVE_CANCELLED', 'APPROVED']
    const makerClass = record ? 'done' : 'active'
    let checkerClass = ''
    let approverClass = ''
    let line1Class = ''
    let line2Class = ''

    if (checkerStates.includes(status)) {
      checkerClass = 'active'
      line1Class = 'done'
    } else if (approverStates.includes(status)) {
      checkerClass = 'done'
      line1Class = 'done'
      line2Class = 'done'
      if (status === 'APPROVED') approverClass = 'done'
      else if (status.includes('REJECT')) approverClass = 'rejected'
      else approverClass = 'active'
    }

    return { makerClass, checkerClass, approverClass, line1Class, line2Class }
  }

  // ── History ────────────────────────────────────────────────────────────────

  function buildHistory() {
    if (!record) return []
    const entries = [
      { seq: 1, user: record.CREATED_BY, date: record.CREATED_DATE, action: 'TẠO MỚI', detail: `DOSSIER_CODE: (new) → ${record.DOSSIER_CODE || 'HS-CHI-2026-XXXX'} | STATE_CODE: (new) → DRAFT | DATA_SOURCE_CODE: (new) → ${record.DATA_SOURCE_CODE}` },
      { seq: 2, user: record.LAST_UPDATED_BY || record.CREATED_BY, date: record.LAST_UPDATED_DATE || record.CREATED_DATE, action: 'CẬP NHẬT', detail: `SEND_DATE: (old) → ${record.SEND_DATE}` },
    ]
    if (record.CHECKED_BY) entries.push({ seq: 3, user: record.CHECKED_BY, date: record.CHECKED_DATE || '', action: 'KIỂM SOÁT', detail: `STATE_CODE: PENDING_CHECK → ${record.STATE_CODE}` })
    if (record.APPROVED_BY) entries.push({ seq: 4, user: record.APPROVED_BY, date: record.APPROVED_DATE || '', action: 'PHÊ DUYỆT', detail: 'STATE_CODE: PENDING_APPROVE → APPROVED' })
    return entries
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isDetailLoading && initialRecordId) {
    return (
      <div className="form-detail-root">
        <div className="page-wrapper">
          <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  const wf = record ? getWorkflowCircle(record.STATE_CODE) : { makerClass: 'active', checkerClass: '', approverClass: '', line1Class: '', line2Class: '' }
  const history = buildHistory()
  const docTotalVND = docs.reduce((s, d) => s + (d.PAYMENT_REQUEST_AMOUNT_VND || 0), 0)
  const docTotalFX = docs.reduce((s, d) => s + (d.PAYMENT_REQUEST_AMOUNT || 0), 0)
  const hasFX = docTotalFX > 0

  return (
    <div className="form-detail-root">
      <div className="page-wrapper">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              <span onClick={() => navigateTo('/capex-dossiers')}>Danh sách hồ sơ Chi đầu tư</span>
              &nbsp;/&nbsp;
              <span>{pageTitle}</span>
            </div>
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          <div className="header-actions">
            {/* In phiếu — only VIEW */}
            <button
              className="btn btn-default btn-sm"
              hidden={mode !== 'view'}
              data-testid="btn-print"
              title="In phiếu (Ctrl+P)"
              onClick={openPrintPreview}
            >
              🖨 In phiếu <span className="shortcut">Ctrl+P</span>
            </button>
            {/* Sửa — VIEW mode */}
            <button
              className="btn btn-default btn-sm"
              hidden={mode !== 'view'}
              data-testid="btn-edit"
              disabled={!canEdit}
              title={canEdit ? 'Sửa (F2)' : `Không thể sửa ở trạng thái ${record?.STATE_CODE || ''}`}
              onClick={handleSwitchToEdit}
              data-disabled-reason={`Không thể sửa ở trạng thái ${record?.STATE_CODE || ''}`}
            >
              ✏ Sửa <span className="shortcut">F2</span>
            </button>
            {/* Status badge */}
            <span className={`status-badge status-${form.STATE_CODE}`}>
              {STATUS_LABELS[form.STATE_CODE] || form.STATE_CODE}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card" style={{ marginBottom: 0, borderBottom: 'none', borderRadius: '4px 4px 0 0' }}>
          <div className="tab-nav">
            <button
              className={`tab-btn${activeTab === 'tab-general' ? ' active' : ''}`}
              onClick={() => setActiveTab('tab-general')}
            >
              📋 Thông tin chung
            </button>
            <button
              className={`tab-btn${activeTab === 'tab-documents' ? ' active' : ''}`}
              hidden={mode === 'new'}
              data-tab-documents=""
              onClick={() => setActiveTab('tab-documents')}
            >
              📄 Danh sách chứng từ
            </button>
            <button
              className={`tab-btn${activeTab === 'tab-attach' ? ' active' : ''}`}
              onClick={() => setActiveTab('tab-attach')}
            >
              📎 Đính kèm tài liệu
            </button>
            <button
              className={`tab-btn${activeTab === 'tab-history' ? ' active' : ''}`}
              title="Alt+H"
              onClick={() => setActiveTab('tab-history')}
            >
              🕐 Lịch sử <span className="shortcut">Alt+H</span>
            </button>
            <button
              className={`tab-btn${activeTab === 'tab-approval' ? ' active' : ''}`}
              title="Alt+P"
              onClick={() => setActiveTab('tab-approval')}
            >
              ✅ Trạng thái phê duyệt <span className="shortcut">Alt+P</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="card" style={{ borderRadius: '0', borderTop: 'none' }}>

          {/* TAB: Thông tin chung */}
          <div className={`tab-pane${activeTab === 'tab-general' ? ' active' : ''}`} id="tab-general">
            {/* Info banner for NEW mode */}
            <div className="info-label" hidden={mode !== 'new'}>
              💡 Điền đầy đủ thông tin và bấm <strong>Lưu</strong> để tạo hồ sơ. Mã hồ sơ sẽ được tự động sinh sau khi lưu lần đầu.
            </div>

            <div className="form-grid">
              {/* DOSSIER_CODE */}
              <div
                className="form-group"
                data-field-code="DOSSIER_CODE"
                data-field-type="String"
                data-component="TextBox"
                data-required="Y"
                data-max-length="30"
                data-spec-ref="B1.1.row1"
                data-validation="VAL-11,VAL-17"
              >
                <label>Mã hồ sơ <span className="req">*</span></label>
                <input
                  name="DOSSIER_CODE"
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="(Tự động sinh sau khi Lưu)"
                  value={form.DOSSIER_CODE}
                  onChange={() => {}}
                  data-api-field="dossierCode"
                  data-testid="input-dossier-code"
                />
              </div>

              {/* SEND_DATE */}
              <div
                className="form-group"
                data-field-code="SEND_DATE"
                data-field-type="Date"
                data-component="DatePicker"
                data-required="Y"
                data-spec-ref="B1.1.row2"
                data-validation="VAL-02,VAL-04,VAL-08"
              >
                <label>Ngày gửi hồ sơ <span className="req">*</span></label>
                <input
                  name="SEND_DATE"
                  type="text"
                  className="form-control"
                  placeholder="dd/mm/yyyy"
                  value={form.SEND_DATE}
                  disabled={isViewMode}
                  onChange={e => setField('SEND_DATE', e.target.value)}
                  data-api-field="sendDate"
                  data-testid="input-send-date"
                />
              </div>

              {/* PROJECT_CODE */}
              <div
                className="form-group span-2"
                data-field-code="PROJECT_CODE"
                data-field-type="String"
                data-component="DropdownLookup"
                data-required="Y"
                data-max-length="20"
                data-spec-ref="B1.1.row3"
                data-validation="VAL-01,VAL-03,VAL-06"
                data-lov="LOV.01"
              >
                <label>Mã dự án/công trình <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="PROJECT_CODE"
                    type="text"
                    className="form-control"
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.PROJECT_CODE}
                    disabled={isViewMode}
                    onChange={e => handleProjectCodeChange(e.target.value)}
                    data-api-field="projectCode"
                    data-testid="input-project-code"
                  />
                  <button
                    type="button"
                    className="btn-lookup"
                    title="F4 — Tra cứu dự án"
                    data-testid="btn-lookup-project"
                    disabled={isViewMode}
                    onClick={() => openLookup('project')}
                  >🔍</button>
                </div>
              </div>

              {/* PROJECT_NAME */}
              <div
                className="form-group"
                data-field-code="PROJECT_NAME"
                data-field-type="String"
                data-component="TextBox"
                data-required="C"
                data-max-length="255"
                data-spec-ref="B1.1.row4"
                data-validation="VAL-06"
                data-lov="LOV.01"
              >
                <label>Tên dự án/công trình <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_NAME"
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã dự án)"
                  value={form.PROJECT_NAME}
                  onChange={() => {}}
                  data-api-field="projectName"
                  data-testid="input-project-name"
                />
              </div>

              {/* PROJECT_SPECIFIC_CODE — Military only */}
              <div
                className="form-group"
                id="group-PROJECT_SPECIFIC_CODE"
                data-field-code="PROJECT_SPECIFIC_CODE"
                data-field-type="String"
                data-component="DropdownLookup"
                data-required="N"
                data-max-length="20"
                data-spec-ref="B1.1.row5"
                data-validation="VAL-03,VAL-06"
                data-show-when="PROJECT_TYPE === 'Military'"
                data-lov="LOV.01"
                hidden={!showMilitaryFields}
              >
                <label>Mã dự án đặc thù</label>
                <div className="input-group">
                  <input
                    name="PROJECT_SPECIFIC_CODE"
                    type="text"
                    className="form-control"
                    placeholder="F4 — Chỉ dành cho Military"
                    value={form.PROJECT_SPECIFIC_CODE}
                    disabled={isViewMode}
                    onChange={e => setField('PROJECT_SPECIFIC_CODE', e.target.value)}
                    data-api-field="projectSpecificCode"
                    data-testid="input-project-specific-code"
                  />
                  <button
                    type="button"
                    className="btn-lookup"
                    title="F4"
                    data-testid="btn-lookup-spec"
                    disabled={isViewMode}
                    onClick={() => openLookup('spec')}
                  >🔍</button>
                </div>
              </div>

              {/* PROJECT_SPECIFIC_NAME — Military only */}
              <div
                className="form-group"
                id="group-PROJECT_SPECIFIC_NAME"
                data-field-code="PROJECT_SPECIFIC_NAME"
                data-field-type="String"
                data-component="TextBox"
                data-required="C"
                data-max-length="255"
                data-spec-ref="B1.1.row6"
                data-validation="VAL-06"
                data-show-when="PROJECT_TYPE === 'Military'"
                data-lov="LOV.01"
                hidden={!showMilitaryFields}
              >
                <label>Tên dự án đặc thù <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_SPECIFIC_NAME"
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="(Tự động fill)"
                  value={form.PROJECT_SPECIFIC_NAME}
                  onChange={() => {}}
                  data-api-field="projectSpecificName"
                  data-testid="input-project-specific-name"
                />
              </div>

              {/* PROJECT_MANAGEMENT_CODE */}
              <div
                className="form-group span-2"
                data-field-code="PROJECT_MANAGEMENT_CODE"
                data-field-type="String"
                data-component="DropdownLookup"
                data-required="Y"
                data-max-length="20"
                data-spec-ref="B1.1.row7"
                data-validation="VAL-01,VAL-03,VAL-06"
                data-lov="LOV.05"
              >
                <label>Mã ĐVQHNS <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="PROJECT_MANAGEMENT_CODE"
                    type="text"
                    className="form-control"
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.PROJECT_MANAGEMENT_CODE}
                    disabled={isViewMode}
                    onChange={e => handleBoardCodeChange(e.target.value)}
                    data-api-field="projectManagementCode"
                    data-testid="input-project-management-code"
                  />
                  <button
                    type="button"
                    className="btn-lookup"
                    title="F4 — Tra cứu ĐVQHNS"
                    data-testid="btn-lookup-board"
                    disabled={isViewMode}
                    onClick={() => openLookup('board')}
                  >🔍</button>
                </div>
              </div>

              {/* PROJECT_MANAGEMENT_NAME */}
              <div
                className="form-group"
                data-field-code="PROJECT_MANAGEMENT_NAME"
                data-field-type="String"
                data-component="TextBox"
                data-required="C"
                data-max-length="255"
                data-spec-ref="B1.1.row8"
                data-validation="VAL-06"
                data-lov="LOV.05"
              >
                <label>Tên ĐVQHNS <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_MANAGEMENT_NAME"
                  type="text"
                  className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã ĐVQHNS)"
                  value={form.PROJECT_MANAGEMENT_NAME}
                  onChange={() => {}}
                  data-api-field="projectManagementName"
                  data-testid="input-project-management-name"
                />
              </div>

              {/* STATE_CODE — Label component */}
              <div
                className="form-group"
                data-field-code="STATE_CODE"
                data-field-type="String"
                data-component="Label"
                data-required="Y"
                data-spec-ref="B1.1.row9"
                data-validation="VAL-13"
                data-lov="LOV.STATUS"
              >
                <label>Trạng thái hồ sơ <span className="req">*</span></label>
                <span
                  data-value={form.STATE_CODE}
                  data-api-field="stateCode"
                  data-testid="input-state-code"
                >
                  {STATUS_LABELS[form.STATE_CODE] || form.STATE_CODE}
                </span>
              </div>

              {/* DATA_SOURCE_CODE */}
              <div
                className="form-group"
                data-field-code="DATA_SOURCE_CODE"
                data-field-type="String"
                data-component="Dropdown"
                data-required="Y"
                data-spec-ref="B1.1.row10"
                data-validation="VAL-03"
                data-lov="LOV.03"
              >
                <label>Nguồn <span className="req">*</span></label>
                <select
                  name="DATA_SOURCE_CODE"
                  className="form-control"
                  value={form.DATA_SOURCE_CODE}
                  disabled={isReadOnly('source')}
                  onChange={e => setField('DATA_SOURCE_CODE', e.target.value)}
                  data-api-field="dataSourceCode"
                  data-testid="input-data-source-code"
                >
                  <option value="Thủ công">Thủ công</option>
                  <option value="DVC">DVC</option>
                </select>
              </div>
            </div>
          </div>

          {/* TAB: Danh sách chứng từ */}
          <div className={`tab-pane${activeTab === 'tab-documents' ? ' active' : ''}`} id="tab-documents">
            <div className="info-label" hidden={mode !== 'new'}>
              💡 Lưu hồ sơ trước để có thể thêm chứng từ.
            </div>
            <div id="doc-grid-area" hidden={mode === 'new'}>
              <input
                type="hidden"
                name="CURRENCY_TYPE_CODE"
                id="doc-currency"
                data-field-code="CURRENCY_TYPE_CODE"
                data-api-field="documents[].currencyTypeCode"
                value="VND"
                readOnly
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Danh sách chứng từ</span>
                <button
                  className="btn btn-default btn-sm"
                  hidden={mode !== 'edit'}
                  data-testid="btn-add-doc"
                  title="Thêm mới chứng từ (Ctrl+Shift+N)"
                  onClick={() => alert('Prototype: Mở LOV.Chứng từ để thêm mới chứng từ')}
                >
                  + Thêm mới chứng từ <span className="shortcut">Ctrl+Shift+N</span>
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" id="doc-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }} data-field-code="DOC_SEQ_NO">STT</th>
                      <th data-field-code="DOCUMENT_NUMBER">Số chứng từ</th>
                      <th data-field-code="DOCUMENT_DATE">Ngày chứng từ</th>
                      <th data-field-code="ACCOUNTING_DATE">Ngày hạch toán</th>
                      <th data-field-code="CURRENCY_TYPE_CODE" data-api-field="documents[].currencyTypeCode">Loại tiền</th>
                      <th
                        className="text-right"
                        data-field-code="PAYMENT_REQUEST_AMOUNT"
                        hidden={!hasFX}
                      >
                        Số tiền nguyên tệ
                      </th>
                      <th className="text-right" data-field-code="PAYMENT_REQUEST_AMOUNT_VND">Số tiền VND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.length === 0 ? (
                      <tr><td colSpan={hasFX ? 7 : 6} className="grid-empty">Chưa có chứng từ nào</td></tr>
                    ) : docs.map((d, i) => (
                      <tr key={d.DOCUMENT_NUMBER}>
                        <td>{i + 1}</td>
                        <td>
                          <a
                            href="#"
                            className="table-link"
                            onClick={e => { e.preventDefault(); alert(`Prototype: Mở EXP.CAPEX_DOSSIER.3.3.1 — ${d.DOCUMENT_NUMBER}`) }}
                          >
                            {d.DOCUMENT_NUMBER}
                          </a>
                        </td>
                        <td>{d.DOCUMENT_DATE}</td>
                        <td>{d.ACCOUNTING_DATE}</td>
                        <td>{d.currencyTypeCode || d.currency || 'VND'}</td>
                        <td className="text-right col-fx" hidden={!hasFX}>{formatFX(d.PAYMENT_REQUEST_AMOUNT)}</td>
                        <td className="text-right">{formatVND(d.PAYMENT_REQUEST_AMOUNT_VND)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={hasFX ? 5 : 4} style={{ textAlign: 'right', fontWeight: 600 }}>Tổng cộng:</td>
                      <td className="text-right" hidden={!hasFX}>{hasFX ? formatFX(docTotalFX) : '—'}</td>
                      <td className="text-right">{formatVND(docTotalVND)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* TAB: Đính kèm tài liệu */}
          <div className={`tab-pane${activeTab === 'tab-attach' ? ' active' : ''}`} id="tab-attach">
            <div hidden={mode === 'view'}>
              <div
                className="upload-zone"
                data-testid="upload-zone-attachments"
                data-field-code="FILE_BLOB"
                data-spec-ref="B3.3.row4"
                onClick={() => alert('Prototype: Chọn file để upload (≤10MB, định dạng pdf/jpg/png/docx)')}
              >
                <p>📎 Kéo thả file vào đây hoặc click để chọn</p>
                <p style={{ marginTop: 4, fontSize: 11 }}>Hỗ trợ: PDF, JPG, PNG, DOCX — Tối đa 10MB/file</p>
                <button className="btn btn-default btn-sm" style={{ marginTop: 8 }} data-testid="btn-upload">Chọn file</button>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <div
                  className="form-group"
                  style={{ minWidth: 200 }}
                  data-field-code="DOC_TYPE"
                  data-component="Dropdown"
                  data-required="Y"
                  data-spec-ref="B3.3.row2"
                  data-lov="LOV.DOC_TYPE"
                >
                  <label>Loại tài liệu <span className="req">*</span></label>
                  <select
                    name="DOC_TYPE"
                    className="form-control"
                    value={attachDocType}
                    onChange={e => setAttachDocType(e.target.value)}
                    data-testid="select-doc-type"
                    data-api-field="attachments[].archiveType"
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="ORIGINAL">Chứng từ gốc</option>
                    <option value="CONTRACT">Hợp đồng</option>
                    <option value="INVOICE">Hoá đơn</option>
                    <option value="STATEMENT">Bảng kê</option>
                    <option value="OTHER">Văn bản khác</option>
                  </select>
                </div>
                <div
                  className="form-group"
                  style={{ flex: 1, minWidth: 240 }}
                  data-field-code="NOTE"
                  data-component="TextArea"
                  data-required="N"
                  data-spec-ref="B3.3.row3"
                  data-max-length="250"
                >
                  <label>Mô tả</label>
                  <textarea
                    name="NOTE"
                    className="form-control"
                    maxLength={250}
                    rows={2}
                    placeholder="Mô tả file đính kèm (tuỳ chọn)"
                    value={attachNote}
                    onChange={e => setAttachNote(e.target.value)}
                    data-testid="input-note"
                    data-api-field="attachments[].description"
                  />
                </div>
              </div>
            </div>
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th data-field-code="FILE_NAME">Tên file</th>
                  <th data-field-code="DOC_TYPE">Loại tài liệu</th>
                  <th data-field-code="FILE_SIZE">Kích thước</th>
                  <th data-field-code="UPLOADED_BY">Người upload</th>
                  <th data-field-code="UPLOADED_DATE">Ngày upload</th>
                  <th className="no-sort">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="grid-empty">Chưa có file đính kèm</td></tr>
              </tbody>
            </table>
          </div>

          {/* TAB: Lịch sử giao dịch */}
          <div className={`tab-pane${activeTab === 'tab-history' ? ' active' : ''}`} id="tab-history">
            <table className="history-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  <th data-field-code="CREATED_BY">Người thực hiện</th>
                  <th data-field-code="ACTION_DATE" data-api-field="approvalHistory[].actionDate">Thời gian thực hiện</th>
                  <th>Loại thao tác</th>
                  <th>Chi tiết thay đổi (oldValue → newValue)</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="grid-empty">Chưa có lịch sử</td></tr>
                ) : history.map(e => (
                  <tr key={e.seq}>
                    <td>{e.seq}</td>
                    <td>{e.user}</td>
                    <td>{e.date}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>{e.action}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#495057' }}>{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TAB: Trạng thái phê duyệt */}
          <div className={`tab-pane${activeTab === 'tab-approval' ? ' active' : ''}`} id="tab-approval">
            <div className="workflow">
              <div className="workflow-step">
                <div className={`workflow-step-circle${wf.makerClass ? ' ' + wf.makerClass : ''}`}>M</div>
                <div className="workflow-step-label">
                  Người lập<br /><small>{record?.CREATED_BY || '—'}</small>
                </div>
              </div>
              <div className={`workflow-line${wf.line1Class ? ' ' + wf.line1Class : ''}`} />
              <div className="workflow-step">
                <div className={`workflow-step-circle${wf.checkerClass ? ' ' + wf.checkerClass : ''}`}>C</div>
                <div className="workflow-step-label">
                  Người kiểm soát<br />
                  <small>
                    {wf.checkerClass === 'active' ? (record?.CHECKED_BY || 'Đang chờ')
                      : wf.checkerClass === 'done' ? (record?.CHECKED_BY || '—')
                      : '—'}
                  </small>
                </div>
              </div>
              <div className={`workflow-line${wf.line2Class ? ' ' + wf.line2Class : ''}`} />
              <div className="workflow-step">
                <div className={`workflow-step-circle${wf.approverClass ? ' ' + wf.approverClass : ''}`}>A</div>
                <div className="workflow-step-label">
                  Người phê duyệt<br />
                  <small>
                    {wf.approverClass === 'done' ? (record?.APPROVED_BY || '—')
                      : wf.approverClass ? (record?.APPROVED_BY || 'Đang chờ')
                      : '—'}
                  </small>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
              {record?.STATE_CODE === 'CHECK_REJECTED' && (
                <span style={{ color: 'var(--danger)' }}>Từ chối kiểm soát: {record.CHECK_REJECTION_REASON || '—'}</span>
              )}
              {record?.STATE_CODE === 'APPROVE_REJECTED' && (
                <span style={{ color: 'var(--danger)' }}>Từ chối phê duyệt: {record.APPROVAL_REJECTION_REASON || '—'}</span>
              )}
              {record?.STATE_CODE === 'APPROVED' && (
                <span style={{ color: 'var(--success)' }}>✔ Đã phê duyệt lúc {record.APPROVED_DATE || '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar (sticky bottom) */}
        <div className="action-bar">
          <div className="action-bar-left">
            {/* Xoá — VIEW only, DRAFT state */}
            <button
              className="btn btn-danger"
              hidden={mode !== 'view'}
              data-testid="btn-delete"
              data-action="delete"
              disabled={!canDelete}
              title="Xoá (Delete)"
              data-disabled-reason="Chỉ xóa được khi hồ sơ ở trạng thái Đang hoàn thiện và là Maker gốc"
              onClick={openDeleteDialog}
            >
              🗑 Xoá <span className="shortcut">Del</span>
            </button>
          </div>
          <div className="action-bar-right">
            {/* Huỷ — new/edit */}
            <button
              className="btn btn-default"
              hidden={mode === 'view'}
              data-testid="btn-cancel"
              title="Huỷ (Esc)"
              onClick={onCancel}
            >
              Huỷ <span className="shortcut">Esc</span>
            </button>
            {/* Quay lại — view */}
            <button
              className="btn btn-default"
              hidden={mode !== 'view'}
              data-testid="btn-back"
              title="Quay lại danh sách"
              onClick={() => navigateTo('/capex-dossiers')}
            >
              ← Quay lại
            </button>
            {/* Lưu nháp — new/edit */}
            <button
              className="btn btn-default"
              hidden={mode === 'view'}
              data-testid="btn-save-draft"
              title="Lưu nháp (Ctrl+Shift+S)"
              onClick={onSaveDraft}
            >
              💾 Lưu nháp <span className="shortcut">Ctrl+Shift+S</span>
            </button>
            {/* Lưu — NEW mode */}
            <button
              className="btn btn-primary"
              hidden={mode !== 'new'}
              data-testid="btn-save"
              title="Lưu (Ctrl+S)"
              data-event="EXP.CAPEX_DOSSIER.NEW.SAVE"
              onClick={onSave}
            >
              ✔ Lưu <span className="shortcut">Ctrl+S</span>
            </button>
            {/* Lưu — EDIT mode */}
            <button
              className="btn btn-primary"
              hidden={mode !== 'edit'}
              id="btn-save-edit"
              data-testid="btn-save-edit"
              title="Lưu (Ctrl+S)"
              data-event="EXP.CAPEX_DOSSIER.EDIT.SAVE"
              onClick={onSaveEdit}
            >
              ✔ Lưu <span className="shortcut">Ctrl+S</span>
            </button>
            {/* Gửi kiểm soát — new/edit */}
            <button
              className="btn btn-primary"
              hidden={mode === 'view'}
              id="btn-submit"
              data-testid="btn-submit"
              title="Gửi kiểm soát (F9)"
              disabled={!canSubmit}
              data-disabled-reason="Cần có ít nhất 1 chứng từ hợp lệ trước khi gửi kiểm soát"
              onClick={onSubmit}
            >
              🚀 Gửi kiểm soát <span className="shortcut">F9</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsDeleteOpen(false)}>
          <div className="modal" role="dialog" aria-modal={true} aria-labelledby="delete-dialog-title">
            <div className="modal-header">
              <span className="icon-warn">⚠</span>
              <span className="modal-title" id="delete-dialog-title">Xác nhận xoá hồ sơ</span>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: 13 }}>
                Bạn đang thực hiện xoá hồ sơ <strong>{record?.DOSSIER_CODE}</strong>. Hành động này không thể hoàn tác.
              </p>
              <div className="form-group" data-field-code="STATE_CODE" data-component="Label" data-spec-ref="B3.1.row2" style={{ marginBottom: 12 }}>
                <label>Trạng thái hiện tại</label>
                <span>{STATUS_LABELS[record?.STATE_CODE as DossierStatus] || record?.STATE_CODE}</span>
              </div>
              <div
                className="form-group"
                style={{ marginBottom: 12 }}
                data-field-code="DELETE_REASON"
                data-field-type="String"
                data-component="TextArea"
                data-required="Y"
                data-spec-ref="B3.1.row3"
                data-validation="VAL-16"
                data-max-length="500"
              >
                <label>Lý do xoá <span className="req">*</span> <small style={{ fontWeight: 'normal' }}>(tối thiểu 10 ký tự)</small></label>
                <textarea
                  ref={deleteReasonRef}
                  id="delete-reason"
                  name="DELETE_REASON"
                  className="form-control"
                  rows={3}
                  maxLength={500}
                  placeholder="Nhập lý do xoá hồ sơ..."
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  data-api-field="deleteReason"
                  data-testid="input-delete-reason"
                />
                <div className={`char-counter${deleteReason.length < 10 ? ' warn' : ''}`}>
                  {deleteReason.length} / 500
                </div>
              </div>
              <div
                className="form-check"
                data-field-code="CONFIRM_REVIEWED"
                data-field-type="Boolean"
                data-component="Checkbox"
                data-required="Y"
                data-spec-ref="B3.1.row4"
                data-validation="VAL-16"
              >
                <input
                  type="checkbox"
                  id="confirm-reviewed"
                  checked={confirmReviewed}
                  onChange={e => setConfirmReviewed(e.target.checked)}
                  data-api-field="confirmReviewed"
                  data-testid="input-confirm-reviewed"
                />
                <label htmlFor="confirm-reviewed">Tôi đã rà soát và xác nhận xoá hồ sơ này</label>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1 }} data-field-code="DELETED_BY" data-field-type="String" data-component="Label" data-spec-ref="B3.1.row5">
                  <label>Người xoá</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={deletedBy}
                    data-api-field="deletedBy"
                    data-testid="input-deleted-by"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }} data-field-code="DELETED_DATE" data-field-type="DateTime" data-component="Label" data-spec-ref="B3.1.row6">
                  <label>Thời gian xoá</label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={deletedDate}
                    data-api-field="deletedDate"
                    data-testid="input-deleted-date"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" data-testid="btn-cancel-delete" onClick={() => setIsDeleteOpen(false)}>Huỷ</button>
              <button
                className="btn btn-danger"
                disabled={!deleteConfirmEnabled}
                data-action="confirm-delete"
                data-testid="btn-confirm-delete"
                onClick={onConfirmDelete}
              >
                Xác nhận xoá <span className="shortcut">Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {isCancelConfirmOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsCancelConfirmOpen(false)}>
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
              <button className="btn btn-primary" onClick={() => navigateTo('/capex-dossiers')}>Xác nhận huỷ</button>
            </div>
          </div>
        </div>
      )}

      {/* Lookup Popup */}
      {isLookupOpen && (
        <div
          className="modal-overlay"
          style={{ alignItems: 'flex-start', paddingTop: 60 }}
          onClick={e => e.target === e.currentTarget && setIsLookupOpen(false)}
        >
          <div className="modal" style={{ minWidth: 700, maxWidth: 860, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span style={{ fontSize: 16 }}>🔍</span>
              <span className="modal-title">Tra cứu Dự án / Công trình (LOV.01)</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setIsLookupOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ minWidth: 150 }}>
                  <label>Mã dự án</label>
                  <input ref={lovCodeInputRef} type="text" className="form-control" placeholder="Tìm chính xác / chứa" value={lovFilters.code} onChange={e => setLovFilters(f => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                  <label>Tên dự án</label>
                  <input type="text" className="form-control" placeholder="Tìm chứa, không phân biệt hoa thường" value={lovFilters.name} onChange={e => setLovFilters(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ minWidth: 130 }}>
                  <label>Loại dự án</label>
                  <select className="form-control" value={lovFilters.type} onChange={e => setLovFilters(f => ({ ...f, type: e.target.value }))}>
                    <option value="">Tất cả</option>
                    <option value="Military">Military</option>
                    <option value="Citizen">Citizen</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 140 }}>
                  <label>Mã ĐVQHNS</label>
                  <input type="text" className="form-control" placeholder="Lọc theo BQL" value={lovFilters.seg6} onChange={e => setLovFilters(f => ({ ...f, seg6: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Mã dự án</th>
                    <th>Tên dự án</th>
                    <th>Loại</th>
                    <th>Mã ĐVQHNS</th>
                    <th>Tên ĐVQHNS</th>
                  </tr>
                </thead>
                <tbody>
                  {lovResults.length === 0 ? (
                    <tr><td colSpan={5} className="grid-empty">Không có kết quả</td></tr>
                  ) : lovResults.map((p, i) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => selectLov(p)}>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.PROJECT_CODE}</td>
                      <td>{p.PROJECT_NAME}</td>
                      <td>
                        <span className="status-badge" style={{
                          background: p.PROJECT_TYPE === 'Military' ? '#cce5ff' : '#d4edda',
                          color: p.PROJECT_TYPE === 'Military' ? '#004085' : '#155724',
                          fontSize: 11,
                        }}>
                          {p.PROJECT_TYPE}
                        </span>
                      </td>
                      <td>{p.GL_SEGMENT6_CODE}</td>
                      <td>{p.GL_SEGMENT6_NAME}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lovResults.length} kết quả</span>
              <button className="btn btn-default" onClick={() => setIsLookupOpen(false)}>Đóng (Esc)</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Dialog */}
      {isDuplicateOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsDuplicateOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="icon-warn" style={{ color: 'var(--warning)' }}>⚠</span>
              <span className="modal-title">Phát hiện hồ sơ tương tự</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 8 }}>Đã có hồ sơ được lập gần đây với cùng:</p>
              <ul style={{ fontSize: 13, paddingLeft: 20, marginBottom: 12, color: 'var(--primary)' }}>
                <li>Mã dự án: {dupProject}</li>
                <li>Mã ĐVQHNS: {dupBoard}</li>
              </ul>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bạn có muốn tiếp tục tạo hồ sơ mới?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => { setIsDuplicateOpen(false); navigateTo('/capex-dossiers') }}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => setIsDuplicateOpen(false)}>Tiếp tục</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Dialog */}
      {isPrintOpen && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 40 }} onClick={e => e.target === e.currentTarget && setIsPrintOpen(false)}>
          <div className="modal" style={{ minWidth: 720, maxWidth: 860, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span style={{ fontSize: 16 }}>🖨</span>
              <span className="modal-title">Preview in phiếu — Hồ sơ Chi đầu tư</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setIsPrintOpen(false)}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 24, background: '#f0f0f0' }}>
              <div id="print-content" style={{ background: '#fff', padding: 32, maxWidth: 640, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,.15)', fontFamily: 'serif' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold' }}>NGÂN HÀNG PHÁT TRIỂN VIỆT NAM</div>
                  <div style={{ fontSize: 11 }}>VDBAS — Hệ thống quản lý chi đầu tư</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12, textTransform: 'uppercase' }}>Phiếu hồ sơ Chi đầu tư</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Mã hồ sơ: {form.DOSSIER_CODE || '—'}</div>
                </div>
                <hr style={{ border: '1px solid #ccc', margin: '16px 0' }} />
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ padding: '4px 8px', width: '40%', color: '#555', fontWeight: 'bold' }}>Mã hồ sơ</td><td style={{ padding: '4px 8px' }}>{form.DOSSIER_CODE || '—'}</td></tr>
                    <tr style={{ background: '#f9f9f9' }}><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Ngày gửi</td><td style={{ padding: '4px 8px' }}>{form.SEND_DATE || '—'}</td></tr>
                    <tr><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Dự án/Công trình</td><td style={{ padding: '4px 8px' }}>{form.PROJECT_CODE} — {form.PROJECT_NAME}</td></tr>
                    <tr style={{ background: '#f9f9f9' }}><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Đơn vị QHNS</td><td style={{ padding: '4px 8px' }}>{form.PROJECT_MANAGEMENT_CODE} — {form.PROJECT_MANAGEMENT_NAME}</td></tr>
                    <tr><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Trạng thái</td><td style={{ padding: '4px 8px' }}>{STATUS_LABELS[form.STATE_CODE] || form.STATE_CODE}</td></tr>
                    <tr style={{ background: '#f9f9f9' }}><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Nguồn</td><td style={{ padding: '4px 8px' }}>{form.DATA_SOURCE_CODE}</td></tr>
                    <tr><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Người lập</td><td style={{ padding: '4px 8px' }}>{record?.CREATED_BY || '—'}</td></tr>
                    <tr style={{ background: '#f9f9f9' }}><td style={{ padding: '4px 8px', fontWeight: 'bold' }}>Ngày lập</td><td style={{ padding: '4px 8px' }}>{record?.CREATED_DATE || '—'}</td></tr>
                  </tbody>
                </table>
                <hr style={{ border: '1px solid #ccc', margin: '16px 0' }} />
                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Danh sách chứng từ</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'left' }}>STT</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ccc' }}>Số chứng từ</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ccc' }}>Ngày CT</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'right' }}>Số tiền VND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 8, color: '#999' }}>Chưa có chứng từ</td></tr>
                    ) : docs.map((d, i) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{i + 1}</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{d.DOCUMENT_NUMBER}</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{d.DOCUMENT_DATE}</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc', textAlign: 'right' }}>{formatVND(d.PAYMENT_REQUEST_AMOUNT_VND)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                      <td colSpan={3} style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'right' }}>Tổng cộng:</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'right' }}>{formatVND(docTotalVND)}</td>
                    </tr>
                  </tfoot>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, fontSize: 12 }}>
                  <div style={{ textAlign: 'center', width: '30%' }}><div style={{ borderTop: '1px solid #333', paddingTop: 4, marginTop: 40 }}>Người lập</div></div>
                  <div style={{ textAlign: 'center', width: '30%' }}><div style={{ borderTop: '1px solid #333', paddingTop: 4, marginTop: 40 }}>Người kiểm soát</div></div>
                  <div style={{ textAlign: 'center', width: '30%' }}><div style={{ borderTop: '1px solid #333', paddingTop: 4, marginTop: 40 }}>Người phê duyệt</div></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setIsPrintOpen(false)}>Đóng</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨 In (Ctrl+P browser)</button>
            </div>
          </div>
        </div>
      )}

      {/* Concurrent Edit Dialog */}
      {isConcurrentOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsConcurrentOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="icon-warn">⚠</span>
              <span className="modal-title">Hồ sơ đang được chỉnh sửa</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13 }}>Hồ sơ đang được <strong>nguyen.van.other</strong> chỉnh sửa, vui lòng thử lại sau.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Mã lỗi: MSG-ERR-CONCURRENT</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => navigateTo('/capex-dossiers')}>← Quay lại danh sách</button>
              <button className="btn btn-primary" onClick={() => setIsConcurrentOpen(false)}>Thử lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Outside-Hour Warning */}
      {isOutsideHourOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsOutsideHourOpen(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span style={{ color: 'var(--warning)', fontSize: 20 }}>⏰</span>
              <span className="modal-title">Ngoài giờ giao dịch</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13 }}>Hiện tại ngoài giờ giao dịch (08:00 – 17:00). Hồ sơ sẽ được xử lý vào ngày làm việc tiếp theo.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Mã: MSG-WRN-OUTSIDE-HOUR</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setIsOutsideHourOpen(false)}>Đã hiểu, tiếp tục</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Expired Dialog */}
      {isSessionExpiredOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="icon-warn">🔒</span>
              <span className="modal-title">Phiên đăng nhập hết hạn</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13 }}>Phiên làm việc đã hết hạn. Dữ liệu đang nhập sẽ được lưu tạm.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Mã: MSG-ERR-SESSION</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => alert('Prototype: Redirect to login page')}>Đăng nhập lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
