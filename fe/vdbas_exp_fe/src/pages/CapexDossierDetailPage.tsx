import React, { useState, useEffect, useRef, useMemo } from 'react'
import { message } from 'antd'
import './CapexDossierDetailPage.css'
import { useNavigation } from '@/contexts/NavigationContext'
import { DossierHooks } from '@/hooks/useDossier'
import { LovHooks } from '@/hooks/useLov'
import { newIdempotencyKey } from '@/services/dossierService'
import type { DataSourceCode, DossierDetail } from '@/types/index'

type PageMode = 'new' | 'edit' | 'view'
type BtnState = 'show' | 'hide' | 'disable'

interface FormState {
  DOSSIER_CODE: string
  SEND_DATE: string // hiển thị dd/mm/yyyy
  DATA_SOURCE_CODE: string // code contract: THU_CONG | DVC
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_TYPE: string // MILITARY | CITIZEN
  PROJECT_SPECIFIC_CODE: string
  PROJECT_SPECIFIC_NAME: string
  // Gộp Chủ đầu tư (INVESTOR) + Ban QLDA (PROJECT_MANAGEMENT) → 1 trường tổ chức.
  // Giữ tên ORGANIZATION_CODE, map vào organizationCode khi gửi BE.
  ORGANIZATION_CODE: string
  ORGANIZATION_NAME: string
}

interface BtnRule {
  EDIT: BtnState; DELETE: BtnState; SUBMIT: BtnState
  APPROVE: BtnState; REJECT: BtnState; CANCEL: BtnState
  COPY: BtnState; PRINT: BtnState
}

// ── BTN_MATRIX ────────────────────────────────────────────────────────────────
const BTN_MATRIX: Record<string, BtnRule> = {
  DRAFT:     { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'disable' },
  SAVED:     { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'show' },
  VALIDATED: { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'show', COPY:'show', PRINT:'show' },
  SUBMITTED: { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'show', REJECT:'show', CANCEL:'hide', COPY:'hide', PRINT:'disable' },
  APPROVED:  { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'show', REJECT:'show', CANCEL:'hide', COPY:'show', PRINT:'show' },
  REJECTED:  { EDIT:'show', DELETE:'show',    SUBMIT:'show', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
  COMPLETED: { EDIT:'hide', DELETE:'hide',    SUBMIT:'hide', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
  CANCELLED: { EDIT:'hide', DELETE:'disable', SUBMIT:'hide', APPROVE:'hide', REJECT:'hide', CANCEL:'hide', COPY:'show', PRINT:'show' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  DRAFT:'Lưu nháp', SAVED:'Đã lưu', VALIDATED:'Đã kiểm tra', SUBMITTED:'Đã gửi kiểm soát',
  APPROVED:'Đã phê duyệt', REJECTED:'Đã từ chối', COMPLETED:'Hoàn thành', CANCELLED:'Đã huỷ',
}

function formatNum(n: number | null | undefined): string {
  if (!n) return '0'
  return n.toLocaleString('vi-VN')
}

function getBtnRule(status: string | undefined): BtnRule {
  if (!status) return BTN_MATRIX['DRAFT']
  return BTN_MATRIX[status] ?? BTN_MATRIX['DRAFT']
}

function todayStr(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/** yyyy-MM-dd hoặc ISO date-time → dd/mm/yyyy. */
function isoToDisplay(s: string | null | undefined): string {
  if (!s) return ''
  const p = String(s).split('T')[0].split('-')
  if (p.length < 3) return String(s)
  return `${p[2]}/${p[1]}/${p[0]}`
}

/** dd/mm/yyyy (hoặc đã yyyy-MM-dd) → yyyy-MM-dd cho contract. */
function displayToIso(s: string): string {
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const p = s.split('/')
  if (p.length < 3) return s
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`
}

const EMPTY_FORM: FormState = {
  DOSSIER_CODE: '', SEND_DATE: '', DATA_SOURCE_CODE: 'THU_CONG',
  PROJECT_CODE: '', PROJECT_NAME: '', PROJECT_TYPE: '',
  PROJECT_SPECIFIC_CODE: '', PROJECT_SPECIFIC_NAME: '',
  ORGANIZATION_CODE: '', ORGANIZATION_NAME: '',
}

const DOSSIER_TYPE_CODE = 'CAPEX' // luồng hiện tại chỉ tạo hồ sơ Chi đầu tư

// ── Component ─────────────────────────────────────────────────────────────────
const CapexDossierDetailPage: React.FC = () => {
  const { params, navigate } = useNavigation()
  const mode = (params.get('mode') || 'view') as PageMode
  const recordId = params.get('id') || undefined
  const copyId = params.get('copy') || undefined

  // view/edit → load recordId; new+copy → load nguồn để prefill
  const sourceId = mode === 'new' ? copyId : recordId
  const { data: detail, isLoading } = DossierHooks.useDetail(sourceId)
  const record: DossierDetail | null = mode !== 'new' ? (detail ?? null) : null

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createM  = DossierHooks.useCreate()
  const updateM  = DossierHooks.useUpdate()
  const draftM   = DossierHooks.useSaveDraft()
  const submitM  = DossierHooks.useSubmit()
  const approveM = DossierHooks.useApprove()
  const rejectM  = DossierHooks.useReject()
  const deleteM  = DossierHooks.useDelete()
  const removeDocM = DossierHooks.useRemoveDocument()
  const deleteAttM = DossierHooks.useDeleteAttachment()

  // ── LOV ──────────────────────────────────────────────────────────────────────
  const projectsQ = LovHooks.useProjects()
  const orgQ = LovHooks.useOrganizations()
  const dataSourcesQ = LovHooks.useDataSources()

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
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  // dự án đặc thù theo project đã chọn
  const specQ = LovHooks.useProjectSpecific(form.PROJECT_CODE || undefined)

  // ── Prefill form khi detail tải xong ─────────────────────────────────────────
  useEffect(() => {
    if (mode === 'new' && !copyId) {
      setForm({ ...EMPTY_FORM, SEND_DATE: todayStr() })
      return
    }
    if (!detail) return
    setForm({
      DOSSIER_CODE: mode === 'new' ? '' : detail.dossierCode,
      SEND_DATE: mode === 'new' ? todayStr() : isoToDisplay(detail.sendDate),
      DATA_SOURCE_CODE: detail.dataSourceCode,
      PROJECT_CODE: detail.projectCode,
      PROJECT_NAME: detail.projectName,
      // BE detail không trả projectType — suy ra MILITARY khi có mã dự án đặc thù.
      PROJECT_TYPE: detail.projectSpecificCode ? 'MILITARY' : '',
      PROJECT_SPECIFIC_CODE: detail.projectSpecificCode || '',
      PROJECT_SPECIFIC_NAME: detail.projectSpecificName || '',
      // BE đã gộp Chủ đầu tư + Ban QLDA thành 1 "tổ chức" (organizationCode).
      ORGANIZATION_CODE: detail.organizationCode,
      ORGANIZATION_NAME: detail.organizationName,
    })
  }, [detail, mode, copyId])

  // ── Derived ───────────────────────────────────────────────────────────────
  const showMilitary = form.PROJECT_TYPE === 'MILITARY' || !!form.PROJECT_SPECIFIC_CODE

  const docs = detail?.documents ?? []
  const docTotal = detail?.totalBaseAmount ?? docs.reduce((s, d) => s + (d.baseAmount || 0), 0)

  const statusBadgeText = record ? (record.fStatusName || STATUS_LABELS[record.fStatus] || record.fStatus) : 'Lưu nháp'
  const statusBadgeClass = record ? 'status-' + record.fStatus : 'status-DRAFT'

  const pageTitle =
    mode === 'new' ? 'Tạo mới — Hồ sơ Chi đầu tư'
    : mode === 'edit' ? `Chỉnh sửa — ${record?.dossierCode || ''}`
    : `${record?.dossierCode || ''} — Chi tiết`

  const btnMatrix = useMemo(() => getBtnRule(record?.fStatus), [record])
  const vBtn = (key: keyof BtnRule): BtnState => (mode === 'view' && record ? btnMatrix[key] : 'hide')
  const showBtn = (key: keyof BtnRule) => vBtn(key) !== 'hide'
  const disableBtn = (key: keyof BtnRule) => vBtn(key) === 'disable'

  const isViewMode = mode === 'view'
  const isNewOrEdit = mode === 'new' || mode === 'edit'
  const fieldDisabled = (alwaysDisabled?: boolean) => alwaysDisabled || isViewMode

  const savePending = createM.isPending || updateM.isPending || draftM.isPending

  // ── Audit / Approval logs ────────────────────────────────────────────────────
  const auditQ = DossierHooks.useAuditLog(recordId, { page: 1, pageSize: 20 })
  const approvalQ = DossierHooks.useApprovalLog(recordId)

  const approvalSteps = useMemo(() => {
    const wf = approvalQ.data?.workflow ?? []
    const last = (role: string) => wf.filter(w => w.actionRole === role).slice(-1)[0]
    const maker = last('MAKER'); const checker = last('CHECKER'); const approver = last('APPROVER')
    return [
      { role: 'Maker', cls: maker ? 'done' : 'active', user: maker?.actionUserName || record?.createdBy || '(Đang lập)', label: maker?.stateLabel || 'Đã lập', date: isoToDisplay(maker?.actionDate) },
      { role: 'Checker', cls: checker ? (checker.stateCode === 'REJECTED' ? 'rejected' : 'done') : '', user: checker?.actionUserName || '(Chờ kiểm soát)', label: checker?.stateLabel || 'Chờ kiểm soát', date: isoToDisplay(checker?.actionDate) },
      { role: 'Approver', cls: approver ? (approver.stateCode === 'REJECTED' ? 'rejected' : 'done') : '', user: approver?.actionUserName || '(Chờ phê duyệt)', label: approver?.stateLabel || 'Chờ phê duyệt', date: isoToDisplay(approver?.actionDate) },
    ]
  }, [approvalQ.data, record])

  const approvalDetailMsg = useMemo(() => {
    const wf = approvalQ.data?.workflow ?? []
    const reject = [...wf].reverse().find(w => w.stateCode === 'REJECTED' && w.reason)
    if (reject) return { text: `Lý do từ chối: ${reject.reason}`, color: 'var(--danger)' }
    if (approvalQ.data?.currentStatus === 'COMPLETED') return { text: '✔ Hoàn thành — đã ghi sổ Sổ cái (GL)', color: '#389e0d' }
    return null
  }, [approvalQ.data])

  // ── Attachments ──────────────────────────────────────────────────────────────
  const attachmentsQ = DossierHooks.useAttachments(recordId)

  // ── Lookup ────────────────────────────────────────────────────────────────
  const lkRef = useRef<HTMLInputElement>(null)

  const lkEntries = useMemo(() => {
    let all: { code: string; name: string }[] = []
    if (lkKey === 'PROJECT') all = (projectsQ.data ?? []).map(p => ({ code: p.projectCode, name: p.projectName }))
    // BE gộp Chủ đầu tư + Ban QLDA → tổ chức; F4 ĐVQHNS tra trên /lov/organizations.
    else if (lkKey === 'BOARD') all = (orgQ.data ?? []).map(o => ({ code: o.organizationCode, name: o.organizationName }))
    else if (lkKey === 'SPEC') all = (specQ.data ?? []).map(p => ({ code: p.projectSpecificCode, name: p.projectSpecificName }))
    if (!lkSearch.trim()) return all
    const q = lkSearch.toLowerCase()
    return all.filter(r => (r.code + ' ' + r.name).toLowerCase().includes(q))
  }, [lkKey, lkSearch, projectsQ.data, orgQ.data, specQ.data])

  const lkTitle = lkKey === 'PROJECT' ? '🏛 Chọn Mã dự án/công trình'
    : lkKey === 'BOARD' ? '🏛 Chọn Mã ĐVQHNS'
    : lkKey === 'SPEC' ? '🏛 Chọn Mã dự án đặc thù' : '🏛 Chọn'

  useEffect(() => {
    if (isLkOpen) setTimeout(() => lkRef.current?.focus(), 50)
  }, [isLkOpen])

  function openLookup(key: string) {
    if (isViewMode) return
    setLkKey(key); setLkSearch(''); setIsLkOpen(true)
  }

  function closeLookup() { setIsLkOpen(false); setLkKey(null) }

  function pickLookup(code: string) {
    if (lkKey === 'PROJECT') {
      const p = projectsQ.data?.find(x => x.projectCode === code)
      if (p) {
        // /lov/projects chỉ trả organizationCode → tra tên từ /lov/organizations.
        const orgName = orgQ.data?.find(o => o.organizationCode === p.organizationCode)?.organizationName ?? ''
        setForm(f => ({
          ...f,
          PROJECT_CODE: p.projectCode,
          PROJECT_NAME: p.projectName,
          PROJECT_TYPE: p.projectTypeCode,
          ORGANIZATION_CODE: p.organizationCode,
          ORGANIZATION_NAME: orgName,
          PROJECT_SPECIFIC_CODE: '',
          PROJECT_SPECIFIC_NAME: '',
        }))
      }
    } else if (lkKey === 'BOARD') {
      const o = orgQ.data?.find(x => x.organizationCode === code)
      setForm(f => ({ ...f, ORGANIZATION_CODE: code, ORGANIZATION_NAME: o?.organizationName ?? '' }))
    } else if (lkKey === 'SPEC') {
      const sp = specQ.data?.find(x => x.projectSpecificCode === code)
      setForm(f => ({ ...f, PROJECT_SPECIFIC_CODE: code, PROJECT_SPECIFIC_NAME: sp?.projectSpecificName ?? '' }))
    }
    setIsDirty(true)
    closeLookup()
  }

  function handleProjectCodeChange(val: string) {
    setForm(f => ({ ...f, PROJECT_CODE: val }))
    setIsDirty(true)
  }

  function handleBoardChange(val: string) {
    setForm(f => ({ ...f, ORGANIZATION_CODE: val }))
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

  async function onSave() {
    if (!form.PROJECT_CODE || !form.SEND_DATE || !form.ORGANIZATION_CODE) {
      message.warning('Vui lòng nhập đầy đủ các trường bắt buộc (*)')
      return
    }
    try {
      if (mode === 'edit' && recordId && detail) {
        await updateM.mutateAsync({
          id: recordId,
          data: {
            version: detail.version,
            sendDate: displayToIso(form.SEND_DATE),
            projectCode: form.PROJECT_CODE,
            projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
          },
        })
        setIsDirty(false)
      } else {
        const res = await createM.mutateAsync({
          data: {
            sendDate: displayToIso(form.SEND_DATE),
            dataSourceCode: form.DATA_SOURCE_CODE as DataSourceCode,
            dossierTypeCode: DOSSIER_TYPE_CODE,
            // BE gộp Chủ đầu tư + Ban QLDA → organizationCode (lấy từ ô ĐVQHNS).
            organizationCode: form.ORGANIZATION_CODE,
            projectCode: form.PROJECT_CODE,
            projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
          },
          idemKey: newIdempotencyKey(),
        })
        setIsDirty(false)
        setHasSaved(true)
        // chuyển sang edit hồ sơ vừa tạo để thêm chứng từ
        navigate('/capex-dossiers/detail', { id: res.id, mode: 'edit' })
      }
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Lưu hồ sơ thất bại')
    }
  }

  async function onSaveDraft() {
    // BE: "Lưu nháp" là autosave gắn vào hồ sơ ĐÃ tồn tại (bắt buộc dossierId).
    // Ở chế độ tạo mới chưa có hồ sơ → tạo hồ sơ trước (dùng luồng Lưu).
    if (mode !== 'edit' || !recordId) {
      await onSave()
      return
    }
    try {
      await draftM.mutateAsync({
        data: {
          dossierId: recordId,
          sendDate: form.SEND_DATE ? displayToIso(form.SEND_DATE) : undefined,
          dataSourceCode: (form.DATA_SOURCE_CODE as DataSourceCode) || undefined,
          dossierTypeCode: DOSSIER_TYPE_CODE,
          organizationCode: form.ORGANIZATION_CODE || undefined,
          projectCode: form.PROJECT_CODE || undefined,
          projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
        },
        idemKey: newIdempotencyKey(),
      })
      setIsDirty(false)
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Lưu nháp thất bại')
    }
  }

  async function onSubmit() {
    if (!recordId || !detail) return
    if (!window.confirm('Bạn có chắc muốn Gửi kiểm soát?\n\nSau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ kiểm soát.')) return
    try {
      await submitM.mutateAsync({ id: recordId, body: { version: detail.version }, idemKey: newIdempotencyKey() })
      navigateBack()
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Gửi kiểm soát thất bại')
    }
  }

  async function onApprove() {
    if (!recordId) return
    if (!window.confirm('Xác nhận phê duyệt hồ sơ này?')) return
    try {
      await approveM.mutateAsync({ id: recordId, body: {}, idemKey: newIdempotencyKey() })
      navigateBack()
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Phê duyệt thất bại')
    }
  }

  async function onReject() {
    if (!recordId) return
    const reason = window.prompt('Nhập lý do từ chối (tối thiểu 10 ký tự):')
    if (!reason) return
    if (reason.trim().length < 10) {
      message.warning('Lý do từ chối phải có tối thiểu 10 ký tự')
      return
    }
    try {
      await rejectM.mutateAsync({ id: recordId, body: { reason: reason.trim() }, idemKey: newIdempotencyKey() })
      navigateBack()
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Từ chối thất bại')
    }
  }

  // "Hủy bỏ" = soft-delete → CANCELLED (contract không có endpoint cancel riêng — §11 GAP).
  function onCancelRecord() {
    setIsDeleteOpen(true)
  }

  function onCopy() {
    navigate('/capex-dossiers/detail', { copy: record?.id ?? '', mode: 'new' })
  }

  async function onConfirmDelete() {
    if (!recordId) return
    try {
      await deleteM.mutateAsync({ id: recordId, body: { deleteReason, confirmReviewed } })
      setIsDeleteOpen(false)
      navigateBack()
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Xoá hồ sơ thất bại')
    }
  }

  async function handleRemoveDoc(docId: string) {
    if (!recordId) return
    if (!window.confirm('Xóa chứng từ?')) return
    try {
      await removeDocM.mutateAsync({ id: recordId, docId })
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Xoá chứng từ thất bại')
    }
  }

  async function handleDeleteAttachment(attId: string) {
    if (!recordId) return
    if (!window.confirm('Xóa file đính kèm?')) return
    try {
      await deleteAttM.mutateAsync({ id: recordId, attId })
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error('Xoá file thất bại')
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, isLkOpen, isViewMode, form, detail, recordId])

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
                onClick={() => window.print()}
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
        {isLoading && mode !== 'new' && (
          <div className="info-label" style={{ margin: '12px 0' }}>⏳ Đang tải hồ sơ...</div>
        )}
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
              <div className="form-group" data-field-code="DOSSIER_CODE" data-spec-ref="B1.1.row1">
                <label>Mã hồ sơ <span className="req">*</span></label>
                <input
                  name="DOSSIER_CODE" type="text" className="form-control"
                  readOnly disabled
                  placeholder="(Tự động sinh sau khi Lưu)"
                  value={form.DOSSIER_CODE}
                  data-testid="input-invest-payment-file-id"
                />
              </div>

              {/* SEND_DATE */}
              <div className="form-group" data-field-code="SEND_DATE" data-spec-ref="B1.1.row2">
                <label>Ngày gửi hồ sơ <span className="req">*</span></label>
                <input
                  name="SEND_DATE" type="text" className="form-control"
                  placeholder="dd/mm/yyyy"
                  value={form.SEND_DATE}
                  onChange={(e) => { setForm((f) => ({ ...f, SEND_DATE: e.target.value })); setIsDirty(true) }}
                  disabled={fieldDisabled()}
                  data-testid="input-send-date"
                  style={{ maxWidth: '160px' }}
                />
              </div>

              {/* DATA_SOURCE_CODE */}
              <div className="form-group" data-field-code="DATA_SOURCE_CODE" data-spec-ref="B1.1.row10" data-lov="LOV.03">
                <label>Nguồn <span className="req">*</span></label>
                <select
                  name="DATA_SOURCE_CODE" className="form-control"
                  value={form.DATA_SOURCE_CODE}
                  onChange={(e) => { setForm((f) => ({ ...f, DATA_SOURCE_CODE: e.target.value })); setIsDirty(true) }}
                  disabled={fieldDisabled(mode === 'edit' || isViewMode)}
                  data-testid="select-source"
                >
                  {(dataSourcesQ.data ?? [{ code: 'THU_CONG', name: 'Thủ công', isDefault: true }, { code: 'DVC', name: 'DVC', isDefault: false }]).map(ds => (
                    <option key={ds.code} value={ds.code}>{ds.name}</option>
                  ))}
                </select>
              </div>

              {/* F_STATUS (Label) */}
              <div className="form-group" data-field-code="F_STATUS" data-spec-ref="B1.1.row4" data-lov="LOV.STATUS">
                <label>Trạng thái hồ sơ <span className="req">*</span></label>
                <div
                  className="form-control"
                  style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5' }}
                  data-testid="label-status"
                >
                  <span className={`status-badge ${statusBadgeClass}`}>{statusBadgeText}</span>
                </div>
              </div>

              {/* PROJECT_CODE */}
              <div
                className="form-group"
                data-field-code="PROJECT_CODE" data-spec-ref="B1.1.row3" data-lov="LOV.01"
              >
                <label>Mã dự án/công trình <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="PROJECT_CODE" type="text"
                    className="form-control"
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.PROJECT_CODE}
                    onChange={(e) => handleProjectCodeChange(e.target.value)}
                    disabled={fieldDisabled()}
                    data-testid="input-project-id"
                    data-lookup="PROJECT"
                  />
                  <button type="button" className="btn-lookup" title="F4 — Tra cứu dự án" data-testid="btn-lookup-project" onClick={() => openLookup('PROJECT')} disabled={fieldDisabled()}>🔍</button>
                </div>
              </div>

              {/* PROJECT_NAME */}
              <div className="form-group" data-field-code="PROJECT_NAME" data-spec-ref="B1.1.row4" data-lov="LOV.01">
                <label>Tên dự án/công trình <span className="cond">(*)</span></label>
                <input
                  name="PROJECT_NAME" type="text" className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã dự án)"
                  value={form.PROJECT_NAME}
                  data-testid="input-project-name"
                />
              </div>

              {/* PROJECT_SPECIFIC_CODE — Military only */}
              {showMilitary && (
                <div className="form-group" id="group-PROJECT_SPECIFIC_CODE" data-field-code="PROJECT_SPECIFIC_CODE" data-spec-ref="B1.1.row5" data-lov="LOV.01">
                  <label>Mã dự án đặc thù</label>
                  <div className="input-group">
                    <input
                      name="PROJECT_SPECIFIC_CODE" type="text" className="form-control"
                      placeholder="F4 — Tra cứu mã đặc thù"
                      value={form.PROJECT_SPECIFIC_CODE}
                      onChange={(e) => { setForm((f) => ({ ...f, PROJECT_SPECIFIC_CODE: e.target.value })); setIsDirty(true) }}
                      disabled={fieldDisabled()}
                      data-testid="input-project-spec-id"
                      data-lookup="SPEC"
                    />
                    <button type="button" className="btn-lookup" title="F4" data-testid="btn-lookup-spec" onClick={() => openLookup('SPEC')} disabled={fieldDisabled()}>🔍</button>
                  </div>
                </div>
              )}

              {/* PROJECT_SPECIFIC_NAME — Military only */}
              {showMilitary && (
                <div className="form-group" id="group-PROJECT_SPECIFIC_NAME" data-field-code="PROJECT_SPECIFIC_NAME" data-spec-ref="B1.1.row6" data-lov="LOV.01">
                  <label>Tên dự án đặc thù <span className="cond">(*)</span></label>
                  <input
                    name="PROJECT_SPECIFIC_NAME" type="text" className="form-control"
                    readOnly
                    placeholder="(Tự động fill)"
                    value={form.PROJECT_SPECIFIC_NAME}
                    data-testid="input-project-spec-name"
                  />
                </div>
              )}

              {/* ORGANIZATION_CODE — giao diện giữ nguyên; trỏ vào organizationCode */}
              <div className="form-group" data-field-code="ORGANIZATION_CODE" data-spec-ref="B1.1.row7" data-lov="LOV.05">
                <label>Mã ĐVQHNS <span className="req">*</span></label>
                <div className="input-group">
                  <input
                    name="ORGANIZATION_CODE" type="text" className="form-control"
                    placeholder="Nhập hoặc F4 để tra cứu"
                    value={form.ORGANIZATION_CODE}
                    onChange={(e) => handleBoardChange(e.target.value)}
                    disabled={fieldDisabled()}
                    data-testid="input-project-management-board-id"
                    data-lookup="BOARD"
                  />
                  <button type="button" className="btn-lookup" title="F4 — Tra cứu ĐVQHNS" data-testid="btn-lookup-board" onClick={() => openLookup('BOARD')} disabled={fieldDisabled()}>🔍</button>
                </div>
              </div>

              {/* ORGANIZATION_NAME */}
              <div className="form-group span-3" data-field-code="ORGANIZATION_NAME" data-spec-ref="B1.1.row8" data-lov="LOV.05">
                <label>Tên ĐVQHNS <span className="cond">(*)</span></label>
                <input
                  name="ORGANIZATION_NAME" type="text" className="form-control"
                  readOnly
                  placeholder="(Tự động fill theo Mã ĐVQHNS)"
                  value={form.ORGANIZATION_NAME}
                  data-testid="input-project-management-board-name"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar" style={{ position: 'static', boxShadow: 'none', padding: '16px 0 0 0', marginTop: '16px', border: 'none', borderTop: '1px dashed var(--border)', borderRadius: 0 }}>
              <div className="action-bar-left">
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
                {isViewMode && showBtn('CANCEL') && (
                  <button className="btn btn-warning" data-btn="CANCEL" data-testid="btn-cancel-record" data-event-id="EXP.CAPEX_DOSSIER.CANCEL" onClick={onCancelRecord} title="Hủy bỏ hồ sơ" disabled={disableBtn('CANCEL')}>
                    ⊘ Hủy bỏ
                  </button>
                )}
              </div>
              <div className="action-bar-right">
                {isNewOrEdit && (
                  <button className="btn btn-default" data-testid="btn-cancel" data-event-id="EXP.CAPEX_DOSSIER.NEW.CANCEL" onClick={onCancel} title="Huỷ (Esc)">
                    Huỷ <span className="shortcut">Esc</span>
                  </button>
                )}
                {isViewMode && (
                  <button className="btn btn-default" data-testid="btn-back" data-event-id="EXP.CAPEX_DOSSIER.VIEW.BACK" onClick={navigateBack} title="Quay lại danh sách">
                    ← Quay lại
                  </button>
                )}
                {isNewOrEdit && (
                  <button className="btn btn-default" data-testid="btn-save-draft" data-event-id="EXP.CAPEX_DOSSIER.NEW.SAVE_DRAFT" onClick={onSaveDraft} disabled={savePending} title="Lưu nháp (Ctrl+Shift+S)">
                    💾 Lưu nháp <span className="shortcut">Ctrl+Shift+S</span>
                  </button>
                )}
                {isNewOrEdit && (
                  <button className="btn btn-primary" data-testid="btn-save" data-event-id="EXP.CAPEX_DOSSIER.NEW.SAVE" onClick={onSave} disabled={savePending} title="Lưu (Ctrl+S)">
                    ✔ Lưu <span className="shortcut">Ctrl+S</span>
                  </button>
                )}
                {isNewOrEdit && (
                  <button
                    className="btn btn-success"
                    style={{ background: '#28a745', color: '#fff', borderColor: '#28a745' }}
                    id="btn-add-doc-global"
                    data-testid="btn-add-doc-global"
                    data-event-id="EXP.CAPEX_DOSSIER.NEW.ADD_DOC"
                    disabled={mode === 'new' && !hasSaved}
                    onClick={() => message.info('Màn hình thêm chứng từ (Giấy ĐNTT) chưa được tích hợp — TODO')}
                  >
                    + Thêm mới chứng từ
                  </button>
                )}
                {isViewMode && showBtn('COPY') && (
                  <button className="btn btn-default" data-btn="COPY" data-testid="btn-copy" data-event-id="EXP.CAPEX_DOSSIER.NEW.COPY" onClick={onCopy} disabled={disableBtn('COPY')}>
                    📋 Sao chép
                  </button>
                )}
                {isViewMode && showBtn('SUBMIT') && (
                  <button
                    className="btn btn-primary"
                    data-btn="SUBMIT"
                    data-testid="btn-submit"
                    data-event-id="EXP.CAPEX_DOSSIER.NEW.SUBMIT"
                    onClick={onSubmit}
                    disabled={disableBtn('SUBMIT') || submitM.isPending || !detail?.documents?.length}
                  >
                    📤 Gửi phê duyệt
                  </button>
                )}
                {isViewMode && showBtn('REJECT') && (
                  <button className="btn btn-danger" data-btn="REJECT" data-testid="btn-reject" data-event-id="EXP.CAPEX_DOSSIER.REJECT" onClick={onReject} disabled={disableBtn('REJECT') || rejectM.isPending}>
                    ✖ Từ chối
                  </button>
                )}
                {isViewMode && showBtn('APPROVE') && (
                  <button className="btn btn-primary" data-btn="APPROVE" data-testid="btn-approve" data-event-id="EXP.CAPEX_DOSSIER.APPROVE" onClick={onApprove} disabled={disableBtn('APPROVE') || approveM.isPending}>
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
                        onClick={() => message.info('Màn hình thêm chứng từ (Giấy ĐNTT) chưa được tích hợp — TODO')}
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
                            <tr key={d.id}>
                              <td>{d.seqNo ?? i + 1}</td>
                              <td>
                                <a href="#" onClick={(e) => { e.preventDefault(); message.info('Màn hình chi tiết chứng từ chưa được tích hợp — TODO') }}>
                                  {d.documentName}
                                </a>
                              </td>
                              <td>{d.documentNo}</td>
                              <td>{isoToDisplay(d.documentDate)}</td>
                              <td>{isoToDisplay(d.accountingDate)}</td>
                              <td className="text-right">{d.originalAmount ? formatNum(d.originalAmount) : '—'}</td>
                              <td className="text-right">{formatNum(d.baseAmount)}</td>
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <button type="button" className="btn btn-ghost btn-sm" title="Xem" style={{ padding: '4px', fontSize: '16px', border: 'none' }} onClick={() => message.info('Màn hình chứng từ DNTT chưa được tích hợp — TODO')}>👁️</button>
                                {!isViewMode && (
                                  <button type="button" className="btn btn-ghost btn-sm" title="Sửa" style={{ padding: '4px', fontSize: '14px', border: 'none' }} onClick={() => message.info('Màn hình sửa chứng từ chưa được tích hợp — TODO')}>✏️</button>
                                )}
                                {!isViewMode && (
                                  <button type="button" className="btn btn-ghost btn-sm" title="Xóa" style={{ padding: '4px', fontSize: '14px', border: 'none', color: 'var(--danger)' }}
                                    onClick={() => handleRemoveDoc(d.id)}
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
            {/* Danh sách đính kèm hiện có */}
            {(attachmentsQ.data?.length ?? 0) > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Loại</th><th>Tên file</th><th>Dung lượng</th><th>Người tải</th><th style={{ width: 80, textAlign: 'center' }}>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    {attachmentsQ.data!.map(att => (
                      <tr key={att.id}>
                        <td>{att.attachmentTypeName}</td>
                        <td>{att.fileName}</td>
                        <td>{att.fileSizeDisplay}</td>
                        <td>{att.createdBy}</td>
                        <td style={{ textAlign: 'center' }}>
                          {!isViewMode && (
                            <button type="button" className="btn btn-ghost btn-sm" title="Xóa" style={{ border: 'none', color: 'var(--danger)' }} onClick={() => handleDeleteAttachment(att.id)}>🗑️</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                onClick={() => message.info('Form chọn loại đính kèm + upload chưa được tích hợp — TODO (useUploadAttachment đã sẵn sàng)')}
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
                  <th>STT</th><th>Người thực hiện</th><th>Thời gian</th>
                  <th>Hành động</th><th>Bảng</th><th>IP</th>
                </tr>
              </thead>
              <tbody id="history-tbody">
                {(auditQ.data?.items?.length ?? 0) === 0 ? (
                  <tr><td colSpan={6} className="grid-empty">Chưa có lịch sử</td></tr>
                ) : (
                  auditQ.data!.items.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td>{a.userDisplayName || a.userId}</td>
                      <td>{isoToDisplay(a.actionTimestamp)}</td>
                      <td>{a.actionType}</td>
                      <td>{a.tableName}</td>
                      <td>{a.ipAddress}</td>
                    </tr>
                  ))
                )}
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
              <span id="lk-title">{lkTitle}</span>
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
              <span className="lk-count">{lkEntries.length} bản ghi</span>
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
                Bạn đang thực hiện xoá hồ sơ <strong id="delete-record-id">{record?.dossierCode || ''}</strong>. Hành động này không thể hoàn tác.
              </p>
              <div className="form-group" style={{ marginBottom: '12px' }} data-field-code="DELETE_REASON" data-spec-ref="B3.1.row3">
                <label>Lý do xoá <span className="req">*</span> <small style={{ fontWeight: 'normal' }}>(tối thiểu 10 ký tự)</small></label>
                <textarea
                  id="delete-reason" name="DELETE_REASON" className="form-control"
                  rows={3} maxLength={500}
                  placeholder="Nhập lý do xoá hồ sơ..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  data-testid="input-delete-reason"
                />
                <div className={`char-counter${deleteReason.length < 10 ? ' warn' : ''}`}>{deleteReason.length} / 500</div>
              </div>
              <div className="form-check" data-field-code="CONFIRM_REVIEWED" data-spec-ref="B3.1.row4">
                <input
                  type="checkbox" id="confirm-reviewed"
                  checked={confirmReviewed}
                  onChange={(e) => setConfirmReviewed(e.target.checked)}
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
                disabled={!canConfirmDelete || deleteM.isPending}
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
