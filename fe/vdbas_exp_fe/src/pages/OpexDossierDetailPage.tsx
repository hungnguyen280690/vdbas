import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './OpexDossierDetailPage.css'
import { type DossierRecord, type DocumentRecord } from './OpexDossierDetailPage.mock'
import { useNavigation } from '@/contexts/NavigationContext'
import { OpexDossierHooks } from '@/hooks/useOpexDossier'
import { newIdempotencyKey } from '@/services/opexDossierService'
import type { OpexDossierDetail } from '@/types/index'

// ── Types ──────────────────────────────────────────────────────────────────────
type PageMode = 'new' | 'edit' | 'view'
type BtnState = 'show' | 'hide' | 'disable'

interface CMatrixEntry {
  edit: BtnState; del: BtnState; submit: BtnState
  approve: BtnState; reject: BtnState; cancel: BtnState
  copy: BtnState; print: BtnState
}

interface DocEntry {
  typeName: string; typeCode: string
  number: string; date: string; postingDate: string
  currency: string; amount: string; vnd: string
}

interface DocEntryErrors {
  number: boolean; date: boolean; postingDate: boolean; amount: boolean
}

interface DocTypeItem { code: string; name: string; mod: string }

// ── Constants ──────────────────────────────────────────────────────────────────
const SEGMENT_MAP: Record<string, string> = {
  '0000001': 'DVQHNS 0000001',
  '1056333': 'Công ty TNHH MTV bất động sản Á Châu',
  '1170918': 'Văn phòng Sở du lịch thành phố Hà Nội',
  '1171277': 'Cơ quan Báo và phát thanh, truyền hình Hà Nội',
  '1059441': 'Trường trung học Công nghiệp Hà Nội',
  '1058252': 'Sở Du lịch Hà Nội',
}

const DOC_FORM_FILE: Record<string, string> = {
  'C202a': 'form_detail_c202a.html',
  'C202b': 'form_detail_c202b.html',
  'C2-02a/NS': 'form_detail_c202a.html',
  'C2-02b/NS': 'form_detail_c202b.html',
}

const DOC_TYPE_FORM_MAP: Record<string, { file: string; label: string }> = {
  'C2-02a/NS': { file: 'form_detail_c202a.html', label: 'Giấy rút dự toán NSNN (không kèm theo nộp ngân sách nhà nước) C2-02a/NS' },
  'C2-02b/NS': { file: 'form_detail_c202b.html', label: 'Giấy rút dự toán NSNN (kèm theo nộp ngân sách nhà nước) C2-02b/NS' },
}

const DOC_TYPES: DocTypeItem[] = [
  { code: 'C2-03/NS',       name: 'Giấy đề nghị thanh toán tạm ứng (Mẫu số 10) C2-03/NS',                                          mod: 'EXP.OPEX.DOC.MANAGE.6'  },
  { code: 'C2-08/NS',       name: 'Giấy đề nghị thanh toán tạm ứng bằng ngoại tệ (Mẫu số 11) C2-08/NS',                            mod: 'EXP.OPEX.DOC.MANAGE.7'  },
  { code: 'C2-02a/NS',      name: 'Giấy rút dự toán ngân sách nhà nước (không kèm theo nộp ngân sách nhà nước) (Mẫu số 13) C2-02a/NS', mod: 'EXP.OPEX.DOC.MANAGE.8'  },
  { code: 'C2-02b/NS',      name: 'Giấy rút dự toán ngân sách nhà nước (kèm theo nộp ngân sách nhà nước) (Mẫu số 14) C2-02b/NS',   mod: 'EXP.OPEX.DOC.MANAGE.9'  },
  { code: 'C2-06a/NS',      name: 'Giấy rút dự toán ngân sách nhà nước bằng ngoại tệ (Mẫu số 15) C2-06a/NS',                       mod: 'EXP.OPEX.DOC.MANAGE.10' },
  { code: 'C2-06b/NS',      name: 'Giấy rút dự toán kiêm thu ngân sách nhà nước (Mẫu số 16) C2-06b/NS',                             mod: 'EXP.OPEX.DOC.MANAGE.11' },
  { code: 'C4-02a/NS',      name: 'Ủy nhiệm chi (không kèm theo nộp ngân sách nhà nước) (Mẫu số 17) C4-02a/NS',                    mod: 'EXP.OPEX.DOC.MANAGE.12' },
  { code: 'C4-02c/NS',      name: 'Ủy nhiệm chi (kèm theo nộp ngân sách nhà nước) (Mẫu số 18) C4-02c/NS',                          mod: 'EXP.OPEX.DOC.MANAGE.13' },
  { code: 'C4-02b/NS',      name: 'Ủy nhiệm chi (ngoại tệ) (Mẫu số 19) C4-02b/NS',                                                 mod: 'EXP.OPEX.DOC.MANAGE.14' },
  { code: 'C2-05a/NS',      name: 'Giấy nộp trả kinh phí (Mẫu số 08) C2-05a/NS',                                                   mod: 'EXP.OPEX.DOC.MANAGE.2'  },
  { code: 'C2-19/NS - CTX', name: 'Giấy đề nghị ghi thu, ghi chi vốn vay ODA, vốn vay ưu đãi, viện trợ không hoàn lại (C2-19/NS) - Chi thường xuyên', mod: 'EXP.OPEX.DOC.MANAGE.4'  },
  { code: 'C2-18/NS - CTX', name: 'Giấy đề nghị thanh toán tạm ứng số đã ghi thu, ghi chi (Mẫu số 12) C2-18/NS - Chi thường xuyên', mod: 'EXP.OPEX.DOC.MANAGE.5'  },
  { code: 'DS DTTH',        name: 'Danh sách thanh toán cho đối tượng thụ hưởng',                                                   mod: 'EXP.OPEX.DOC.MANAGE.15' },
  { code: 'DS LHS',         name: 'Danh sách thanh toán cho lưu học sinh',                                                          mod: 'EXP.OPEX.DOC.MANAGE.16' },
  { code: 'C2-10/NS',       name: 'Giấy đề nghị điều chỉnh số liệu ngân sách (Mẫu số 09) C2-10/NS',                                mod: 'EXP.OPEX.DOC.MANAGE.3'  },
]

// BTN_MATRIX theo 11-state OPEX (§7). Lưu ý: nút "approve" được tái dùng cho cả
// Kiểm soát (PENDING_CHECKER→check) lẫn Phê duyệt (CHECKED/APPROVAL_PENDING→approve);
// nút "cancel" tái dùng cho Trả lại (check-return) và Huỷ duyệt (approve-cancel).
// SoD/role (MAKER/CHECKER/APPROVER) do BE chốt — UI chưa gate theo claim JWT (GAP).
const C_MATRIX: Record<string, CMatrixEntry> = {
  DRAFT:               { edit:'show', del:'show', submit:'show', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'disable' },
  REJECTED_BY_CHECKER: { edit:'show', del:'show', submit:'show', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  CHECK_REJECTED:      { edit:'show', del:'show', submit:'show', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  PENDING_CHECKER:     { edit:'hide', del:'hide', submit:'hide', approve:'show', reject:'show', cancel:'show', copy:'hide', print:'disable' },
  CHECKED:             { edit:'hide', del:'hide', submit:'hide', approve:'show', reject:'show', cancel:'show', copy:'hide', print:'show'    },
  APPROVAL_PENDING:    { edit:'hide', del:'hide', submit:'hide', approve:'show', reject:'show', cancel:'show', copy:'hide', print:'show'    },
  APPROVED:            { edit:'hide', del:'hide', submit:'hide', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  APPROVAL_REJECTED:   { edit:'hide', del:'hide', submit:'hide', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  CHECK_CANCELLED:     { edit:'hide', del:'hide', submit:'hide', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  APPROVAL_CANCELLED:  { edit:'hide', del:'hide', submit:'hide', approve:'hide', reject:'hide', cancel:'hide', copy:'show', print:'show'    },
  DELETED:             { edit:'hide', del:'hide', submit:'hide', approve:'hide', reject:'hide', cancel:'hide', copy:'hide', print:'hide'    },
}

const EXCHANGE_RATE: Record<string, number> = { VND: 1, USD: 25400, EUR: 27200 }

// Trạng thái Maker còn sửa/xoá được (VAL-13). SoD/ownership do BE chốt.
const MAKER_EDITABLE = new Set<string>(['DRAFT', 'REJECTED_BY_CHECKER', 'CHECK_REJECTED'])

// ── Helpers ────────────────────────────────────────────────────────────────────
function vdbasToISO(s: string): string {
  if (!s) return ''
  s = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return ''
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function vdbasToDMY(s: string): string {
  if (!s) return ''
  s = s.trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return s
  return `${m[3]}/${m[2]}/${m[1]}`
}

function uiStatus(st: string): { label: string; cls: string } {
  switch (st) {
    case 'DRAFT':               return { label: 'Lưu nháp', cls: 'st-draft' }
    case 'PENDING_CHECKER':     return { label: 'Chờ kiểm soát', cls: 'st-submitted' }
    case 'CHECKED':             return { label: 'Đã kiểm soát', cls: 'st-checked' }
    case 'APPROVAL_PENDING':    return { label: 'Chờ phê duyệt', cls: 'st-submitted' }
    case 'APPROVED':            return { label: 'Đã phê duyệt', cls: 'st-approved' }
    case 'CHECK_REJECTED':      return { label: 'Từ chối kiểm soát', cls: 'st-rejected' }
    case 'REJECTED_BY_CHECKER': return { label: 'Trả lại người lập', cls: 'st-rejected' }
    case 'APPROVAL_REJECTED':   return { label: 'Từ chối phê duyệt', cls: 'st-rejected' }
    case 'CHECK_CANCELLED':     return { label: 'Huỷ kiểm soát', cls: 'st-cancelled' }
    case 'APPROVAL_CANCELLED':  return { label: 'Huỷ phê duyệt', cls: 'st-cancelled' }
    case 'DELETED':             return { label: 'Đã xoá', cls: 'st-cancelled' }
    default:                    return { label: st || '—', cls: 'st-draft' }
  }
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtVnd(n: number): string {
  return Number(n).toLocaleString('vi-VN')
}

// Adapter: OpexDossierDetail (camelCase contract) → shape render UI (UPPER_SNAKE).
// GAP: contract detail KHÔNG có checkedBy/approvedBy/*Date → tab Lịch sử/Phê duyệt dùng
// approval-log/audit-log (useApprovalLog/useAuditLog) cho dữ liệu đầy đủ — hiện để trống.
function mapDetail(d: OpexDossierDetail): DossierRecord {
  return {
    id: d.id,
    DOSSIER_CODE: d.dossierCode ?? '',
    BUDGET_UNIT_CODE: d.organizationCode ?? '',
    BUDGET_UNIT_NAME: d.organizationName ?? '',
    DOSSIER_DATE: d.sendDate ?? '',
    CREATED_BY: d.createdBy ?? '',
    CREATED_DATE: d.createdDate ?? '',
    DATA_SOURCE_CODE: d.dataSourceCode ?? '',
    CHECKED_BY: null, CHECKED_DATE: null, APPROVED_BY: null, APPROVED_DATE: null,
    CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
    TREASURY_CODE: d.treasuryCode ?? '', TREASURY_NAME: d.treasuryName ?? '',
    F_VER: d.version ?? 1,
    documents: (d.documents ?? []).map((doc, i): DocumentRecord => ({
      SEQ: i + 1,
      DOC_TYPE_CODE: doc.documentTypeCode,
      DOC_NUMBER: doc.documentNo,
      DOC_NAME: doc.documentName,
      DOC_DATE: doc.documentDate ?? '',
      POSTING_DATE: doc.accountingDate ?? '',
      AMOUNT: doc.originalAmount ?? 0,
      CURRENCY_CODE: doc.currencyCode ?? 'VND',
      VND_AMOUNT: doc.baseAmount ?? 0,
    })),
    STATE_CODE: d.fStatus,
    ASSIGN_USER: d.assignUser ?? '',
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
const OpexDossierDetailPage: React.FC = () => {
  const { params, navigate } = useNavigation()
  const paramMode = (params.get('mode') || 'new') as PageMode
  const recordId  = params.get('id')

  // Load detail từ API (thay MOCK find). Hook tự bỏ qua khi recordId rỗng (mode 'new').
  const { data: detailData } = OpexDossierHooks.useDetail(recordId ?? undefined)
  const initialRecord = useMemo<DossierRecord | null>(
    () => (detailData ? mapDetail(detailData) : null),
    [detailData],
  )

  // Mutations
  const createMut         = OpexDossierHooks.useCreate()
  const updateMut         = OpexDossierHooks.useUpdate()
  const draftMut          = OpexDossierHooks.useSaveDraft()
  const submitMut         = OpexDossierHooks.useSubmit()
  const checkMut          = OpexDossierHooks.useCheck()
  const approveMut        = OpexDossierHooks.useApprove()
  const rejectByCheckerMut  = OpexDossierHooks.useRejectByChecker()
  const rejectByApproverMut = OpexDossierHooks.useRejectByApprover()
  const returnByCheckerMut  = OpexDossierHooks.useReturnByChecker()
  const cancelApprovalMut   = OpexDossierHooks.useCancelApproval()
  const deleteMut         = OpexDossierHooks.useDelete()
  const copyMut           = OpexDossierHooks.useCopy()

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [currentMode, setCurrentMode] = useState<PageMode>(paramMode)
  const isViewMode   = currentMode === 'view'
  const isNewOrEdit  = currentMode === 'new' || currentMode === 'edit'

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'general' | 'attachments' | 'history' | 'approval'>('general')

  // ── Dirty tracking ────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)

  // ── Form fields ───────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => {
    if (currentMode === 'new') {
      return { BUDGET_UNIT_CODE: '', BUDGET_UNIT_NAME: '', DOSSIER_CODE: '', DOSSIER_DATE: todayISO(), CREATED_BY: 'nguyen.van.an', STATE_CODE: 'DRAFT', DATA_SOURCE_CODE: 'MANUAL' }
    }
    const r = initialRecord
    return {
      BUDGET_UNIT_CODE: r?.BUDGET_UNIT_CODE ?? '',
      BUDGET_UNIT_NAME: r?.BUDGET_UNIT_NAME ?? '',
      DOSSIER_CODE:     r?.DOSSIER_CODE ?? '',
      DOSSIER_DATE:     vdbasToISO(r?.DOSSIER_DATE ?? ''),
      CREATED_BY:       r?.CREATED_BY ?? '',
      STATE_CODE:       r?.STATE_CODE ?? 'DRAFT',
      DATA_SOURCE_CODE: r?.DATA_SOURCE_CODE ?? '',
    }
  })

  // ── Documents list ────────────────────────────────────────────────────────
  const [docs, setDocs] = useState<DocumentRecord[]>(() => initialRecord?.documents ?? [])

  // Đổ form + docs khi detail tải xong (view/edit). 'new' giữ nguyên input người dùng.
  useEffect(() => {
    if (currentMode === 'new' || !initialRecord) return
    setForm({
      BUDGET_UNIT_CODE: initialRecord.BUDGET_UNIT_CODE,
      BUDGET_UNIT_NAME: initialRecord.BUDGET_UNIT_NAME,
      DOSSIER_CODE:     initialRecord.DOSSIER_CODE,
      DOSSIER_DATE:     vdbasToISO(initialRecord.DOSSIER_DATE),
      CREATED_BY:       initialRecord.CREATED_BY,
      STATE_CODE:       initialRecord.STATE_CODE,
      DATA_SOURCE_CODE: initialRecord.DATA_SOURCE_CODE,
    })
    setDocs(initialRecord.documents ?? [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecord])

  // ── Validation errors ─────────────────────────────────────────────────────
  const [errors, setErrors] = useState({ BUDGET_UNIT_CODE: false, DOSSIER_DATE: false, DATA_SOURCE_CODE: false })

  // ── Delete dialog ─────────────────────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen]         = useState(false)
  const [deleteReason, setDeleteReason]         = useState('')
  const [confirmReviewed, setConfirmReviewed]   = useState(false)
  const deleteReasonRef = useRef<HTMLTextAreaElement>(null)

  const confirmDeleteDisabled = deleteReason.length < 10 || !confirmReviewed

  // ── Cancel confirm dialog ─────────────────────────────────────────────────
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // ── Doc type LOV ──────────────────────────────────────────────────────────
  const [isDocTypeOpen, setIsDocTypeOpen]         = useState(false)
  const [lovSearch, setLovSearch]                 = useState('')
  const [lovSelectedCodes, setLovSelectedCodes]   = useState<Set<string>>(new Set())
  const lovSearchRef = useRef<HTMLInputElement>(null)

  const lovVisible = useMemo(() => {
    const kw = lovSearch.trim().toLowerCase()
    return kw ? DOC_TYPES.filter(d => d.code.toLowerCase().includes(kw) || d.name.toLowerCase().includes(kw)) : DOC_TYPES
  }, [lovSearch])

  const toggleLovRow = (code: string) => {
    setLovSelectedCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }

  const toggleCheckAll = (checked: boolean) => {
    setLovSelectedCodes(prev => {
      const next = new Set(prev)
      if (checked) lovVisible.forEach(d => next.add(d.code))
      else         lovVisible.forEach(d => next.delete(d.code))
      return next
    })
  }

  // ── Segment LOV ───────────────────────────────────────────────────────────
  const [isSegmentLovOpen, setIsSegmentLovOpen] = useState(false)
  const [segSearch, setSegSearch]               = useState('')
  const segSearchRef = useRef<HTMLInputElement>(null)

  const segVisible = useMemo(() => {
    const kw = segSearch.trim().toLowerCase()
    return kw
      ? Object.entries(SEGMENT_MAP).filter(([k, v]) => k.includes(kw) || v.toLowerCase().includes(kw))
      : Object.entries(SEGMENT_MAP)
  }, [segSearch])

  // ── Iframe modal ──────────────────────────────────────────────────────────
  const [isIframeOpen, setIsIframeOpen]   = useState(false)
  const [iframeSrc, setIframeSrc]         = useState('about:blank')
  const [iframeTitle, setIframeTitle]     = useState('📄 Tạo mới chứng từ')
  const [iframeSubtitle, setIframeSubtitle] = useState('')
  const [iframeShowConfirm, setIframeShowConfirm] = useState(true)

  // Queues for multi-step doc creation (useRef to avoid stale closures)
  const iframeDocQueueRef    = useRef<DocTypeItem[]>([])
  const iframeDocIdxRef      = useRef(0)
  const iframeCurrentDocType = useRef<DocTypeItem | null>(null)
  const pendingSimpleRef     = useRef<DocTypeItem[]>([])
  const docEntryQueueRef     = useRef<DocTypeItem[]>([])
  const docEntryIdxRef       = useRef(0)

  // ── Doc entry popup ───────────────────────────────────────────────────────
  const [isDocEntryOpen, setIsDocEntryOpen] = useState(false)
  const [docEntry, setDocEntry]             = useState<DocEntry>({ typeName: '', typeCode: '', number: '', date: '', postingDate: '', currency: 'VND', amount: '', vnd: '' })
  const [docEntryErrors, setDocEntryErrors] = useState<DocEntryErrors>({ number: false, date: false, postingDate: false, amount: false })
  const [docEntryTitle, setDocEntryTitle]   = useState('📄 Nhập thông tin chứng từ')
  const docEntryNumberRef = useRef<HTMLInputElement>(null)

  const pendingDocTypeRef = useRef<DocTypeItem | null>(null)

  // ── Computed / Derived ────────────────────────────────────────────────────
  const record = initialRecord

  const canEditDocState = useCallback(() => {
    const r = record
    return !!r && MAKER_EDITABLE.has(r.STATE_CODE)
  }, [record])

  const statusUi = useMemo(() => uiStatus(form.STATE_CODE), [form.STATE_CODE])

  const matrixEntry: CMatrixEntry = useMemo(() => {
    return C_MATRIX[form.STATE_CODE] ?? C_MATRIX['DRAFT']
  }, [form.STATE_CODE])

  const btnVisible = (key: keyof CMatrixEntry): boolean => {
    if (!isViewMode) return false
    return matrixEntry[key] !== 'hide'
  }
  const btnDisabled = (key: keyof CMatrixEntry): boolean => {
    if (!isViewMode) return false
    return matrixEntry[key] === 'disable'
  }

  const submitDisabled = isViewMode
    ? (matrixEntry.submit === 'disable' || (matrixEntry.submit === 'show' && docs.length === 0))
    : false

  const submitTitle = (isViewMode && matrixEntry.submit === 'show' && docs.length === 0)
    ? 'Cần có ít nhất 1 chứng từ'
    : 'Gửi kiểm soát (F9)'

  // ── Approval workflow steps ───────────────────────────────────────────────
  const wfSteps = useMemo(() => {
    const r = record
    if (!r) return { maker: { cls: 'done', user: '—', status: 'Đã lập', date: '' }, checker: { cls: '', user: '—', status: 'Chưa thực hiện', date: '' }, approver: { cls: '', user: '—', status: 'Chưa thực hiện', date: '' } }

    const maker = { cls: 'done', user: r.CREATED_BY || 'SYSTEM', status: 'Đã lập', date: r.CREATED_DATE || '' }

    let checker = { cls: '', user: '—', status: 'Chưa thực hiện', date: '' }
    if (r.STATE_CODE === 'REJECTED' && r.ASSIGN_USER === 'Maker') {
      checker = { cls: 'rejected', user: r.CHECKED_BY ?? '—', status: 'Từ chối kiểm soát', date: r.CHECKED_DATE ?? '' }
    } else if (r.CHECKED_BY) {
      checker = { cls: 'done', user: r.CHECKED_BY, status: 'Đã kiểm soát', date: r.CHECKED_DATE ?? '' }
    } else if (r.STATE_CODE === 'SUBMITTED') {
      checker = { cls: 'active', user: '—', status: 'Chờ kiểm soát', date: '' }
    } else if (r.STATE_CODE === 'CANCELLED') {
      checker = { cls: 'cancelled', user: r.CHECKED_BY ?? '—', status: 'Đã huỷ', date: r.CHECKED_DATE ?? '' }
    }

    let approver = { cls: '', user: '—', status: 'Chưa thực hiện', date: '' }
    if (r.STATE_CODE === 'REJECTED' && r.ASSIGN_USER === 'Checker') {
      approver = { cls: 'rejected', user: r.APPROVED_BY ?? '—', status: 'Từ chối phê duyệt', date: r.APPROVED_DATE ?? '' }
    } else if (r.APPROVED_BY && (r.STATE_CODE === 'APPROVED' || r.STATE_CODE === 'COMPLETED')) {
      approver = { cls: 'done', user: r.APPROVED_BY, status: r.STATE_CODE === 'COMPLETED' ? 'Hoàn thành' : 'Đã phê duyệt', date: r.APPROVED_DATE ?? '' }
    } else if (r.STATE_CODE === 'APPROVED' && r.ASSIGN_USER === 'Approver') {
      approver = { cls: 'active', user: '—', status: 'Chờ phê duyệt', date: '' }
    }

    return { maker, checker, approver }
  }, [record])

  // ── History rows ──────────────────────────────────────────────────────────
  const historyRows = useMemo(() => {
    const r = record
    if (!r) return []
    const rows = [{ no: 1, user: r.CREATED_BY, date: r.CREATED_DATE, action: 'TẠO MỚI', old: '—', newv: 'Lưu nháp (DRAFT), F_VER=1' }]
    if (r.CHECKED_BY) rows.push({ no: 2, user: r.CHECKED_BY, date: r.CHECKED_DATE ?? '—', action: 'KIỂM SOÁT', old: 'Đã gửi kiểm soát (SUBMITTED)', newv: 'Đã kiểm soát (APPROVED)' })
    if (r.APPROVED_BY) rows.push({ no: 3, user: r.APPROVED_BY, date: r.APPROVED_DATE ?? '—', action: 'PHÊ DUYỆT', old: 'Đã kiểm soát (APPROVED)', newv: 'Đã phê duyệt (APPROVED)' })
    return rows
  }, [record])

  // ── Auto-focus in modals ──────────────────────────────────────────────────
  useEffect(() => { if (isDeleteOpen) setTimeout(() => deleteReasonRef.current?.focus(), 50) }, [isDeleteOpen])
  useEffect(() => { if (isDocTypeOpen) setTimeout(() => lovSearchRef.current?.focus(), 50) }, [isDocTypeOpen])
  useEffect(() => { if (isSegmentLovOpen) setTimeout(() => segSearchRef.current?.focus(), 50) }, [isSegmentLovOpen])
  useEffect(() => { if (isDocEntryOpen) setTimeout(() => docEntryNumberRef.current?.focus(), 50) }, [isDocEntryOpen])

  // ── Listen for postMessage from iframe ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'DOC_SAVED') return
      confirmIframeDoc()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Segment LOV — takes highest priority
      if (isSegmentLovOpen) {
        if (e.key === 'Escape') { e.preventDefault(); setIsSegmentLovOpen(false) }
        return
      }
      // Iframe open
      if (isIframeOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closeIframeModal() }
        return
      }
      // Doc type LOV
      if (isDocTypeOpen) {
        if (e.key === 'Enter')  { e.preventDefault(); confirmDocTypeSelection() }
        if (e.key === 'Escape') { e.preventDefault(); setIsDocTypeOpen(false) }
        return
      }
      // Doc entry popup
      if (isDocEntryOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closeDocEntryPopup() }
        return
      }
      // Delete dialog
      if (isDeleteOpen) {
        if (e.key === 'Escape') { e.preventDefault(); setIsDeleteOpen(false) }
        if (e.key === 'Enter' && !confirmDeleteDisabled) { e.preventDefault(); handleConfirmDelete() }
        return
      }
      // Cancel confirm dialog
      if (isCancelConfirmOpen) {
        if (e.key === 'Escape') { e.preventDefault(); setIsCancelConfirmOpen(false) }
        return
      }
      // Global shortcuts
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); if (isNewOrEdit) handleSave() }
      if (e.key === 'Escape') { e.preventDefault(); handleCancel() }
      if (e.key === 'F2' && isViewMode) { e.preventDefault(); setCurrentMode('edit') }
      if (e.key === 'F9') { e.preventDefault(); handleSubmit() }
      if (e.altKey && (e.key === 'h' || e.key === 'H')) { e.preventDefault(); setActiveTab('history') }
      if (e.altKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); setActiveTab('approval') }
      if (e.key === 'F10') { e.preventDefault(); openDocTypePopup() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSegmentLovOpen, isIframeOpen, isDocTypeOpen, isDocEntryOpen, isDeleteOpen, isCancelConfirmOpen, isViewMode, isNewOrEdit, confirmDeleteDisabled])

  // ── Form handlers ─────────────────────────────────────────────────────────
  const setFormField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setIsDirty(true)
  }

  const handleBudgetUnitCodeChange = (val: string) => {
    const des = SEGMENT_MAP[val.trim()] ?? ''
    setForm(f => ({ ...f, BUDGET_UNIT_CODE: val, BUDGET_UNIT_NAME: des }))
    setIsDirty(true)
    setErrors(e => ({ ...e, BUDGET_UNIT_CODE: false }))
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSave = () => {
    const errs = {
      BUDGET_UNIT_CODE: !form.BUDGET_UNIT_CODE,
      DOSSIER_DATE:     !form.DOSSIER_DATE,
      DATA_SOURCE_CODE: !form.DATA_SOURCE_CODE,
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      alert('[VDBAS-VAL-0002] Vui lòng điền đầy đủ thông tin bắt buộc (*)')
      return
    }
    setIsDirty(false)

    if (currentMode === 'new') {
      // GAP: form chưa có ô nhập treasuryCode (BE create yêu cầu). Lấy từ record nếu có, else rỗng (BE 400).
      createMut.mutate(
        {
          data: {
            organizationCode: form.BUDGET_UNIT_CODE,
            treasuryCode: record?.TREASURY_CODE ?? '', // TODO: bổ sung field Kho bạc trên form
            sendDate: form.DOSSIER_DATE,
            dataSourceCode: form.DATA_SOURCE_CODE,
            dossierTypeCode: 'OPEX',
          },
          idemKey: newIdempotencyKey(),
        },
        { onSuccess: () => navigate('/opex-dossiers') },
      )
    } else if (recordId) {
      updateMut.mutate(
        {
          id: recordId,
          data: {
            version: record?.F_VER ?? 1, // optimistic lock (VAL-15)
            organizationCode: form.BUDGET_UNIT_CODE,
            treasuryCode: record?.TREASURY_CODE ?? '',
            sendDate: form.DOSSIER_DATE,
          },
          idemKey: newIdempotencyKey(),
        },
        { onSuccess: () => setCurrentMode('view') },
      )
    }
  }

  const handleSaveDraft = () => {
    setIsDirty(false)
    draftMut.mutate(
      {
        data: {
          organizationCode: form.BUDGET_UNIT_CODE || undefined,
          treasuryCode: record?.TREASURY_CODE || undefined,
          sendDate: form.DOSSIER_DATE || undefined,
          dataSourceCode: form.DATA_SOURCE_CODE || undefined,
          dossierTypeCode: 'OPEX',
        },
        idemKey: newIdempotencyKey(),
      },
      { onSuccess: () => navigate('/opex-dossiers') },
    )
  }

  const handleSubmit = () => {
    if (!recordId) { alert('[VDBAS-VAL-0002] Vui lòng lưu hồ sơ trước khi gửi kiểm soát.'); return }
    submitMut.mutate({ id: recordId, idemKey: newIdempotencyKey() }, { onSuccess: () => navigate('/opex-dossiers') })
  }

  const handleCancel = () => {
    if (isDirty) setIsCancelConfirmOpen(true)
    else navigate('/opex-dossiers')
  }

  // Nút "Phê duyệt" tái dùng: PENDING_CHECKER → kiểm soát (check); CHECKED/APPROVAL_PENDING → phê duyệt (approve).
  const handleApprove = () => {
    if (!recordId) return
    const idemKey = newIdempotencyKey()
    if (form.STATE_CODE === 'PENDING_CHECKER') {
      checkMut.mutate({ id: recordId, idemKey }, { onSuccess: () => navigate('/opex-dossiers') })
    } else {
      approveMut.mutate({ id: recordId, idemKey }, { onSuccess: () => navigate('/opex-dossiers') })
    }
  }

  // Nút "Từ chối": Checker (PENDING_CHECKER) → check-reject; Approver (CHECKED/APPROVAL_PENDING) → approve-reject.
  const handleReject = () => {
    if (!recordId) return
    const r = prompt('Nhập lý do từ chối (tối thiểu 10 ký tự):')
    if (r === null) return
    if (r.trim().length < 10) { alert('[VDBAS-VAL-0002] Lý do từ chối tối thiểu 10 ký tự.'); return }
    const vars = { id: recordId, body: { reason: r.trim() }, idemKey: newIdempotencyKey() }
    const opts = { onSuccess: () => navigate('/opex-dossiers') }
    if (form.STATE_CODE === 'PENDING_CHECKER') rejectByCheckerMut.mutate(vars, opts)
    else rejectByApproverMut.mutate(vars, opts)
  }

  // Nút "Hủy bỏ" tái dùng: PENDING_CHECKER → trả về Maker (check-return); CHECKED/APPROVAL_PENDING → huỷ về Checker (approve-cancel).
  const handleCancelBiz = () => {
    if (!recordId) return
    const r = prompt('Nhập lý do (tối thiểu 10 ký tự):')
    if (r === null) return
    if (r.trim().length < 10) { alert('[VDBAS-VAL-0002] Lý do tối thiểu 10 ký tự.'); return }
    const vars = { id: recordId, body: { reason: r.trim() }, idemKey: newIdempotencyKey() }
    const opts = { onSuccess: () => navigate('/opex-dossiers') }
    if (form.STATE_CODE === 'PENDING_CHECKER') returnByCheckerMut.mutate(vars, opts)
    else cancelApprovalMut.mutate(vars, opts)
  }

  const handleCopy = () => {
    if (!recordId) return
    copyMut.mutate(
      { id: recordId, idemKey: newIdempotencyKey() },
      { onSuccess: (res) => navigate('/opex-dossiers/detail', { id: res.id, mode: 'edit' }) },
    )
  }

  const handlePrint = () => window.print()

  // ── Delete dialog ─────────────────────────────────────────────────────────
  const openDeleteDialog = () => {
    setDeleteReason('')
    setConfirmReviewed(false)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!recordId) return
    deleteMut.mutate(
      { id: recordId, body: { deleteReason, confirmReviewed }, idemKey: newIdempotencyKey() },
      {
        onSuccess: () => { setIsDeleteOpen(false); navigate('/opex-dossiers') },
      },
    )
  }

  // ── Segment LOV ───────────────────────────────────────────────────────────
  const selectSegment = (code: string) => {
    setForm(f => ({ ...f, BUDGET_UNIT_CODE: code, BUDGET_UNIT_NAME: SEGMENT_MAP[code] ?? '' }))
    setIsDirty(true)
    setIsSegmentLovOpen(false)
  }

  // ── Doc type LOV ──────────────────────────────────────────────────────────
  const openDocTypePopup = () => {
    setLovSearch('')
    setLovSelectedCodes(new Set())
    setIsDocTypeOpen(true)
  }

  const confirmDocTypeSelection = () => {
    const selected = DOC_TYPES.filter(d => lovSelectedCodes.has(d.code))
    if (!selected.length) return
    setIsDocTypeOpen(false)
    setLovSelectedCodes(new Set())

    const iframeItems = selected.filter(d => DOC_TYPE_FORM_MAP[d.code])
    const simpleItems = selected.filter(d => !DOC_TYPE_FORM_MAP[d.code])

    if (iframeItems.length > 0) {
      iframeDocQueueRef.current = iframeItems
      iframeDocIdxRef.current = 0
      pendingSimpleRef.current = simpleItems
      openIframeDocModal(iframeItems[0])
    } else {
      openDocEntryQueue(simpleItems, 0)
    }
  }

  // ── Iframe modal ──────────────────────────────────────────────────────────
  const openIframeDocModal = (docType: DocTypeItem) => {
    iframeCurrentDocType.current = docType
    const mapEntry = DOC_TYPE_FORM_MAP[docType.code]
    const total = iframeDocQueueRef.current.length
    const cur   = iframeDocIdxRef.current + 1
    setIframeTitle(`📄 Tạo mới chứng từ: ${docType.code}${total > 1 ? ` (${cur}/${total})` : ''}`)
    setIframeSubtitle(mapEntry.label)
    setIframeShowConfirm(true)
    const dosCode = record?.DOSSIER_CODE ?? 'NEW'
    setIframeSrc(`${mapEntry.file}?mode=new&embedded=1&dossier=${encodeURIComponent(dosCode)}`)
    setIsIframeOpen(true)
  }

  const openDocIframe = (docNumber: string, iframeMode: 'view' | 'edit') => {
    const doc = docs.find(d => d.DOC_NUMBER === docNumber)
    if (!doc) { alert('Không tìm thấy chứng từ: ' + docNumber); return }
    const docType = (doc.DOC_TYPE ?? doc.DOC_TYPE_CODE ?? '') as string
    const formFile = DOC_FORM_FILE[docType]
    if (!formFile) { openDocAlert(docNumber); return }

    const modeLabel = iframeMode === 'edit' ? '✏️ Sửa chứng từ' : '👁 Xem chứng từ'
    const docLabel  = (docType.includes('202a') || docType === 'C2-02a/NS') ? 'C2-02a/NS' : 'C2-02b/NS'
    setIframeTitle(`${modeLabel}: ${docLabel}`)
    setIframeSubtitle(doc.DOC_NAME)
    setIframeShowConfirm(iframeMode === 'edit')

    const p = new URLSearchParams({ embedded: '1', mode: iframeMode, docId: docNumber, docType, dossier: record?.DOSSIER_CODE ?? '', dossierStatus: record?.STATE_CODE ?? 'DRAFT', sourceType: (doc.SOURCE_TYPE as string) ?? 'MANUAL', dossierSent: record?.DOSSIER_DATE ?? '', _doc: JSON.stringify({ ...doc, DOSSIER_ID: record?.DOSSIER_CODE ?? '', DOSSIER_SENT_DATE: record?.DOSSIER_DATE ?? '' }) })
    setIframeSrc(`${formFile}?${p.toString()}`)
    setIsIframeOpen(true)
  }

  const openDocAlert = (docNumber: string) => {
    const doc = docs.find(d => d.DOC_NUMBER === docNumber)
    if (!doc) { alert('Chứng từ: ' + docNumber); return }
    alert([
      '📄 Chi tiết chứng từ', '',
      'Số CT     : ' + doc.DOC_NUMBER,
      'Tên CT    : ' + doc.DOC_NAME,
      'Ngày CT   : ' + doc.DOC_DATE,
      'Ngày HT   : ' + doc.POSTING_DATE,
      'Số tiền   : ' + fmtVnd(doc.AMOUNT) + ' ' + doc.CURRENCY_CODE,
      'Quy VND   : ' + fmtVnd(doc.VND_AMOUNT) + ' VND',
    ].join('\n'))
  }

  const closeIframeModal = () => {
    setIsIframeOpen(false)
    setIframeSrc('about:blank')
    iframeCurrentDocType.current = null
  }

  const confirmIframeDoc = () => {
    const docType = iframeCurrentDocType.current
    if (!docType) return

    const dosCode = record?.DOSSIER_CODE ?? 'NEW'
    const seq     = docs.length + 1
    const newDoc: DocumentRecord = {
      SEQ: seq,
      DOC_NUMBER:   `${dosCode}-${docType.code}-${String(seq).padStart(4, '0')}`,
      DOC_TYPE_CODE: docType.code,
      DOC_NAME:     docType.name,
      DOC_DATE:     '—',
      POSTING_DATE: '—',
      AMOUNT:       0,
      CURRENCY_CODE: 'VND',
      VND_AMOUNT:   0,
    }
    setDocs(prev => [...prev, newDoc])
    setIsDirty(true)
    closeIframeModal()

    iframeDocIdxRef.current++
    const queue = iframeDocQueueRef.current
    if (iframeDocIdxRef.current < queue.length) {
      setTimeout(() => openIframeDocModal(queue[iframeDocIdxRef.current]), 200)
    } else if (pendingSimpleRef.current.length > 0) {
      const pending = [...pendingSimpleRef.current]
      pendingSimpleRef.current = []
      setTimeout(() => openDocEntryQueue(pending, 0), 200)
    }
  }

  // ── Doc entry popup ───────────────────────────────────────────────────────
  const openDocEntryQueue = (list: DocTypeItem[], idx: number) => {
    if (idx >= list.length) return
    docEntryQueueRef.current  = list
    docEntryIdxRef.current    = idx
    openDocEntryForm(list[idx])
  }

  const openDocEntryForm = (docType: DocTypeItem) => {
    pendingDocTypeRef.current = docType
    const total = docEntryQueueRef.current.length
    const cur   = docEntryIdxRef.current + 1
    setDocEntryTitle(`📄 Nhập thông tin chứng từ${total > 1 ? ` (${cur}/${total})` : ''}: ${docType.code}`)
    setDocEntry({ typeName: `${docType.code} — ${docType.name}`, typeCode: docType.code, number: '', date: '', postingDate: '', currency: 'VND', amount: '', vnd: '' })
    setDocEntryErrors({ number: false, date: false, postingDate: false, amount: false })
    setIsDocEntryOpen(true)
  }

  const closeDocEntryPopup = () => {
    setIsDocEntryOpen(false)
    pendingDocTypeRef.current = null
  }

  const updateVndDisplay = (amount: string, currency: string) => {
    const amt = parseFloat(amount.replace(/,/g, '')) || 0
    const vnd = amt * (EXCHANGE_RATE[currency] ?? 1)
    return vnd > 0 ? vnd.toLocaleString('vi-VN') : ''
  }

  const saveDocEntry = () => {
    const errs: DocEntryErrors = {
      number:       !docEntry.number.trim(),
      date:         !docEntry.date.trim(),
      postingDate:  !docEntry.postingDate.trim(),
      amount:       !docEntry.amount.trim() || isNaN(parseFloat(docEntry.amount.replace(/,/g, ''))) || parseFloat(docEntry.amount.replace(/,/g, '')) <= 0,
    }
    setDocEntryErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const docType  = pendingDocTypeRef.current!
    const amt      = parseFloat(docEntry.amount.replace(/,/g, ''))
    const currency = docEntry.currency
    const vnd      = amt * (EXCHANGE_RATE[currency] ?? 1)
    const dosCode  = record?.DOSSIER_CODE ?? 'NEW'
    const seq      = docs.length + 1
    const newDoc: DocumentRecord = {
      SEQ:           seq,
      DOC_NUMBER:    `${dosCode}-${docType.code}-${String(seq).padStart(4, '0')}`,
      DOC_TYPE_CODE: docType.code,
      DOC_NAME:      docType.name,
      DOC_DATE:      vdbasToDMY(docEntry.date),
      POSTING_DATE:  vdbasToDMY(docEntry.postingDate),
      AMOUNT:        amt,
      CURRENCY_CODE: currency,
      VND_AMOUNT:    vnd,
    }
    setDocs(prev => [...prev, newDoc])
    setIsDirty(true)
    closeDocEntryPopup()

    docEntryIdxRef.current++
    if (docEntryIdxRef.current < docEntryQueueRef.current.length) {
      setTimeout(() => openDocEntryForm(docEntryQueueRef.current[docEntryIdxRef.current]), 150)
    }
  }

  const handleDeleteDoc = (docNumber: string) => {
    if (!canEditDocState()) return
    if (!confirm('Xác nhận xoá chứng từ: ' + docNumber + '?')) return
    setDocs(prev => prev.filter(d => d.DOC_NUMBER !== docNumber))
  }

  // ── Page title, mode badge, breadcrumb ────────────────────────────────────
  const pageTitle = currentMode === 'new'
    ? 'Tạo mới hồ sơ chi thường xuyên'
    : currentMode === 'edit'
      ? `Chỉnh sửa — ${form.DOSSIER_CODE}`
      : (form.DOSSIER_CODE || '—')

  const modeBadge = currentMode === 'new'
    ? { text: '● MỚI', cls: 'mode-new' }
    : currentMode === 'edit'
      ? { text: '✏ SỬA', cls: 'mode-edit' }
      : { text: '👁 XEM', cls: 'mode-view' }

  const breadcrumb = currentMode === 'new'
    ? '/ Chi thường xuyên / Hồ sơ / Tạo mới'
    : currentMode === 'edit'
      ? `/ Chi thường xuyên / Hồ sơ / ${form.DOSSIER_CODE} / Sửa`
      : `/ Chi thường xuyên / Hồ sơ / ${form.DOSSIER_CODE}`

  const editAllowed = canEditDocState()

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── HEADER ── */}
      <div className="app-header">
        <span className="logo">VDBAS</span>
        <span className="breadcrumb" id="breadcrumb">{breadcrumb}</span>
      </div>

      {/* ── INFO BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow)' }}>
        <span id="status-badge-bar">
          <span className={`badge ${statusUi.cls}`}>{statusUi.label}</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }} id="ver-info">
          {record ? `Phiên bản: ${record.F_VER ?? 1}` : ''}
        </span>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="page-wrap">
        <div className="page-title-row">
          <span className="page-title" data-page-title id="page-title">{pageTitle}</span>
          <span className={`page-mode-badge ${modeBadge.cls}`} id="mode-badge">{modeBadge.text}</span>
        </div>

        {/* ── MAIN CARD (tabs) ── */}
        <div className="card" id="section-main">
          <div className="card-header" style={{ padding: '0 16px' }}>
            <div className="tab-bar">
              <button className={`tab-btn${activeTab === 'general' ? ' active' : ''}`}     onClick={() => setActiveTab('general')}     title="Thông tin chung">📋 Thông tin chung</button>
              <button className={`tab-btn${activeTab === 'attachments' ? ' active' : ''}`} onClick={() => setActiveTab('attachments')} title="Đính kèm tài liệu">📎 Đính kèm tài liệu</button>
              <button className={`tab-btn${activeTab === 'history' ? ' active' : ''}`}     onClick={() => setActiveTab('history')}     data-testid="tab-history"          title="Alt+H">📋 Lịch sử giao dịch (Alt+H)</button>
              <button className={`tab-btn${activeTab === 'approval' ? ' active' : ''}`}    onClick={() => setActiveTab('approval')}    data-testid="tab-approval-status"  title="Alt+P">✅ Trạng thái phê duyệt (Alt+P)</button>
            </div>
          </div>

          {/* ── Tab: Thông tin chung ── */}
          <div className={`tab-pane${activeTab === 'general' ? ' active' : ''}`} id="tab-general">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <span className="card-badge" id="dossier-code-header">{currentMode !== 'new' ? form.DOSSIER_CODE : ''}</span>
              </div>
              <div className="form-grid">

                {/* BUDGET_UNIT_CODE */}
                <div className="form-group"
                     data-field-code="BUDGET_UNIT_CODE" data-field-type="String" data-component="DropdownLookup"
                     data-required="Y" data-spec-ref="B1.1.row1" data-validation="VAL-01,VAL-03"
                     data-api-field="header.glSegment6" data-lov="LOV.07.6">
                  <label>Mã ĐVSDNS <span className="req">*</span></label>
                  <div className="lookup-wrap">
                    <input
                      name="BUDGET_UNIT_CODE" type="text" maxLength={20}
                      data-testid="lookup-gl-segment6"
                      data-api-field="header.glSegment6"
                      placeholder="Chọn mã đơn vị... (F4)"
                      value={form.BUDGET_UNIT_CODE}
                      disabled={isViewMode || (currentMode === 'edit')}
                      onChange={e => handleBudgetUnitCodeChange(e.target.value)}
                      style={isViewMode || (currentMode === 'edit') ? { background: '#f5f5f5', color: '#666', cursor: 'not-allowed', borderColor: '#e0e0e0' } : {}}
                    />
                    <button
                      className="lookup-btn"
                      onClick={() => { if (!isViewMode && currentMode !== 'edit') { setSegSearch(''); setIsSegmentLovOpen(true) } }}
                      disabled={isViewMode || (currentMode === 'edit')}
                      title="F4"
                    >🔍 F4</button>
                  </div>
                  {errors.BUDGET_UNIT_CODE && <span className="error-hint show" id="err-BUDGET_UNIT_CODE">Vui lòng nhập Mã ĐVSDNS</span>}
                </div>

                {/* BUDGET_UNIT_NAME */}
                <div className="form-group"
                     data-field-code="BUDGET_UNIT_NAME" data-field-type="String" data-component="TextBox"
                     data-required="Y" data-spec-ref="B1.1.row2" data-validation="VAL-05"
                     data-api-field="header.glSegment6Des">
                  <label>Tên ĐVSDNS <span className="req">*</span></label>
                  <input
                    name="BUDGET_UNIT_NAME" type="text" readOnly
                    data-testid="input-gl-segment6-des"
                    data-api-field="header.glSegment6Des"
                    placeholder="Tự động điền theo Mã ĐVSDNS"
                    value={form.BUDGET_UNIT_NAME}
                    disabled
                  />
                </div>

                {/* DOSSIER_CODE */}
                <div className="form-group"
                     data-field-code="DOSSIER_CODE" data-field-type="String" data-component="TextBox"
                     data-required="N" data-spec-ref="B1.1.row3" data-validation="VAL-11"
                     data-api-field="header.dossierCode" data-immutable="true">
                  <label>Mã hồ sơ <span className="auto-label">(tự sinh)</span></label>
                  <input
                    name="DOSSIER_CODE" type="text" readOnly
                    data-testid="input-dossier-code"
                    data-api-field="header.dossierCode"
                    placeholder="Hệ thống tự sinh khi lưu"
                    value={form.DOSSIER_CODE}
                    disabled
                  />
                </div>

                {/* DOSSIER_DATE */}
                <div className="form-group"
                     data-field-code="DOSSIER_DATE" data-field-type="Date" data-component="DatePicker"
                     data-required="Y" data-spec-ref="B1.1.row4" data-validation="VAL-01,VAL-02,VAL-08"
                     data-api-field="header.sendDate">
                  <label>Ngày gửi hồ sơ <span className="req">*</span></label>
                  <input
                    name="DOSSIER_DATE" type="date"
                    data-testid="input-send-date"
                    data-api-field="header.sendDate"
                    value={form.DOSSIER_DATE}
                    disabled={isViewMode || (currentMode === 'edit')}
                    onChange={e => { setFormField('DOSSIER_DATE', e.target.value); setErrors(err => ({ ...err, DOSSIER_DATE: false })) }}
                  />
                  {errors.DOSSIER_DATE && <span className="error-hint show" id="err-DOSSIER_DATE">Vui lòng nhập Ngày gửi hợp lệ</span>}
                </div>

                {/* CREATED_BY */}
                <div className="form-group"
                     data-field-code="CREATED_BY" data-field-type="String" data-component="TextBox"
                     data-required="N" data-spec-ref="B1.1.row5" data-api-field="header.createdBy"
                     data-immutable="true">
                  <label>Người lập <span className="auto-label">(tự điền)</span></label>
                  <input
                    name="CREATED_BY" type="text" readOnly
                    data-testid="input-created-by"
                    data-api-field="header.createdBy"
                    placeholder="User hiện tại"
                    value={form.CREATED_BY}
                    disabled
                  />
                </div>

                {/* STATE_CODE */}
                <div className="form-group"
                     data-field-code="STATE_CODE" data-field-type="String" data-component="TextBox"
                     data-required="N" data-spec-ref="B1.1.row6" data-validation="VAL-13"
                     data-api-field="header.opexDossierStatus" data-immutable="true">
                  <label>Trạng thái hồ sơ <span className="auto-label">(tự động)</span></label>
                  <div className="field-readonly" id="status-display-field">
                    <span className={`badge ${statusUi.cls}`} data-testid="badge-status">{statusUi.label}</span>
                  </div>
                  <input name="STATE_CODE" type="hidden" data-testid="input-opex-dossier-status" data-api-field="header.opexDossierStatus" value={form.STATE_CODE} readOnly />
                </div>

                {/* DATA_SOURCE_CODE */}
                <div className="form-group"
                     data-field-code="DATA_SOURCE_CODE" data-field-type="String" data-component="Dropdown"
                     data-required="Y" data-spec-ref="B1.1.row7" data-validation="VAL-01,VAL-03"
                     data-api-field="header.source" data-lov="LOV.04">
                  <label>Nguồn <span className="req">*</span></label>
                  <select
                    name="DATA_SOURCE_CODE"
                    data-testid="select-source"
                    data-api-field="header.source"
                    value={form.DATA_SOURCE_CODE}
                    disabled={isViewMode}
                    onChange={e => { setFormField('DATA_SOURCE_CODE', e.target.value); setErrors(err => ({ ...err, DATA_SOURCE_CODE: false })) }}
                  >
                    <option value="">— Chọn nguồn —</option>
                    <option value="MANUAL">Thủ công</option>
                    <option value="DVKB">Dịch vụ kho bạc</option>
                    <option value="AUTO">Tự động</option>
                  </select>
                  {errors.DATA_SOURCE_CODE && <span className="error-hint show" id="err-DATA_SOURCE_CODE">Vui lòng chọn Nguồn</span>}
                </div>

              </div>{/* /form-grid */}

              {/* ── Danh sách chứng từ ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px', borderTop: '1px dashed var(--border)', paddingTop: 14 }}>
                <span className="area-title" style={{ margin: 0, border: 0, padding: 0 }}>📄 Danh sách chứng từ thanh toán</span>
                {isNewOrEdit && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    id="btn-add-doc"
                    data-testid="btn-add-doc"
                    data-event-id="EXP.OPEX_DOSSIER.NEW.ADD_DOC"
                    onClick={openDocTypePopup}
                    title="F10"
                  >➕ Thêm mới Chứng từ (F10)</button>
                )}
              </div>
              <div className="doc-grid-wrap">
                <table className="doc-grid">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Số chứng từ</th>
                      <th>Tên chứng từ</th>
                      <th>Ngày chứng từ</th>
                      <th>Ngày hạch toán</th>
                      <th className="amount-cell">Số tiền nguyên tệ</th>
                      <th>Loại tiền</th>
                      <th className="amount-cell">Số tiền VND</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="list-tbody-documents" data-testid="list-tbody-documents">
                    {docs.length === 0 ? (
                      <tr id="no-docs-row"><td colSpan={9} style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>Chưa có chứng từ</td></tr>
                    ) : docs.map((d, i) => {
                      const docType    = (d.DOC_TYPE ?? d.DOC_TYPE_CODE ?? '') as string
                      const formFile   = DOC_FORM_FILE[docType]
                      const hasForm    = !!formFile
                      const isTs       = (d.SOURCE_TYPE as string) === 'TREASURY_SERVICE'
                      return (
                        <tr key={d.DOC_NUMBER || i}>
                          <td>{d.SEQ || i + 1}</td>
                          <td>
                            {hasForm
                              ? <a className="doc-number-link" href="#" title={`Xem chi tiết: ${d.DOC_NUMBER}`} onClick={e => { e.preventDefault(); openDocIframe(d.DOC_NUMBER, editAllowed ? 'edit' : 'view') }}>{d.DOC_NUMBER}</a>
                              : <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{d.DOC_NUMBER}</span>}
                          </td>
                          <td style={{ maxWidth: 250 }}>
                            {d.DOC_NAME}
                            {isTs && <span style={{ display: 'inline-block', marginLeft: 6, fontSize: 10, background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap' }}>🏛 Dịch vụ KB</span>}
                          </td>
                          <td>{d.DOC_DATE}</td>
                          <td>{d.POSTING_DATE}</td>
                          <td className="amount-cell">{fmtVnd(d.AMOUNT)}</td>
                          <td>{d.CURRENCY_CODE}</td>
                          <td className="amount-cell">{fmtVnd(d.VND_AMOUNT)}</td>
                          <td>
                            <div className="action-group">
                              {hasForm
                                ? <span className="icon-btn view" title="Xem chứng từ (F3)" onClick={() => openDocIframe(d.DOC_NUMBER, 'view')}>👁</span>
                                : <span className="icon-btn view" title="Xem chứng từ (F3)" onClick={() => openDocAlert(d.DOC_NUMBER)}>👁</span>}
                              {editAllowed && hasForm
                                ? <span className="icon-btn edit" title="Sửa chứng từ (F2)" data-testid="btn-edit-doc" onClick={() => openDocIframe(d.DOC_NUMBER, 'edit')}>✏️</span>
                                : <span className="icon-btn" style={{ opacity: .3, cursor: 'not-allowed' }} title={editAllowed ? 'Không có form chứng từ' : 'Trạng thái hồ sơ không cho phép sửa'}>✏️</span>}
                              {editAllowed
                                ? <span className="icon-btn del" title="Xoá chứng từ" onClick={() => handleDeleteDoc(d.DOC_NUMBER)}>🗑</span>
                                : <span className="icon-btn" style={{ opacity: .3, cursor: 'not-allowed' }} title="Không thể xoá">🗑</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>{/* /tab-general */}

          {/* ── Tab: Đính kèm ── */}
          <div className={`tab-pane${activeTab === 'attachments' ? ' active' : ''}`} id="tab-attachments">
            <div className="upload-zone" data-testid="upload-zone-attachments" onClick={() => alert('Upload file — Ctrl+U\nGiới hạn: ≤10MB; pdf/jpg/png/docx')}>
              <div style={{ fontSize: 32 }}>📁</div>
              <p><strong>Kéo thả file vào đây</strong> hoặc click để chọn</p>
              <p style={{ fontSize: 11 }}>Định dạng: pdf, jpg, png, docx | Tối đa: 10MB/file | Phím tắt: Ctrl+U</p>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>[Prototype] Danh sách file đính kèm sẽ hiển thị ở đây</div>
          </div>

          {/* ── Tab: Lịch sử ── */}
          <div className={`tab-pane${activeTab === 'history' ? ' active' : ''}`} id="tab-history" data-testid="history-table">
            <table className="history-table">
              <thead>
                <tr><th>STT</th><th>Người thực hiện</th><th>Thời gian</th><th>Hành động</th><th>Giá trị cũ</th><th>Giá trị mới</th></tr>
              </thead>
              <tbody id="history-tbody">
                {historyRows.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>Chưa có lịch sử</td></tr>
                  : historyRows.map(r => (
                    <tr key={r.no}>
                      <td>{r.no}</td>
                      <td>{r.user || '—'}</td>
                      <td>{r.date || '—'}</td>
                      <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.action}</span></td>
                      <td style={{ color: 'var(--accent)' }}>{r.old}</td>
                      <td style={{ color: 'var(--success)' }}>{r.newv}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ── Tab: Phê duyệt ── */}
          <div className={`tab-pane${activeTab === 'approval' ? ' active' : ''}`} id="tab-approval" data-testid="approval-workflow">
            <div className="wf-flow" id="approval-flow">
              <div className={`wf-step${wfSteps.maker.cls ? ' ' + wfSteps.maker.cls : ''}`} id="step-maker" title={wfSteps.maker.date}>
                <div className="wf-role">Maker</div>
                <div className="wf-user" id="step-maker-user">{wfSteps.maker.user}</div>
                <div className="wf-status" id="step-maker-status">{wfSteps.maker.status}</div>
              </div>
              <div className="wf-arrow">→</div>
              <div className={`wf-step${wfSteps.checker.cls ? ' ' + wfSteps.checker.cls : ''}`} id="step-checker" title={wfSteps.checker.date}>
                <div className="wf-role">Checker</div>
                <div className="wf-user" id="step-checker-user">{wfSteps.checker.user}</div>
                <div className="wf-status" id="step-checker-status">{wfSteps.checker.status}</div>
              </div>
              <div className="wf-arrow">→</div>
              <div className={`wf-step${wfSteps.approver.cls ? ' ' + wfSteps.approver.cls : ''}`} id="step-approver" title={wfSteps.approver.date}>
                <div className="wf-role">Approver</div>
                <div className="wf-user" id="step-approver-user">{wfSteps.approver.user}</div>
                <div className="wf-status" id="step-approver-status">{wfSteps.approver.status}</div>
              </div>
            </div>
          </div>
        </div>{/* /card */}
      </div>{/* /page-wrap */}

      {/* ── FOOTER ACTION BAR ── */}
      <div className="footer-bar" id="footer-bar">
        {/* LEFT: danger buttons — view mode */}
        {isViewMode && btnVisible('del') && (
          <button className="btn btn-danger" data-show-mode="view" data-testid="btn-delete"
            id="btn-delete-top" data-event-id="EXP.OPEX_DOSSIER.VIEW.DELETE_OPEN"
            disabled={btnDisabled('del')}
            onClick={openDeleteDialog} title="Xoá hồ sơ">🗑 Xoá</button>
        )}
        {isViewMode && (
          <button className="btn btn-secondary" data-show-mode="view" data-testid="btn-back"
            data-event-id="EXP.OPEX_DOSSIER.VIEW.BACK"
            onClick={() => navigate('/opex-dossiers')} title="Quay lại danh sách">← Danh sách</button>
        )}

        <div className="footer-bar-right">
          {/* NEW/EDIT mode buttons */}
          {isNewOrEdit && (
            <>
              <button className="btn btn-secondary" data-show-mode="new,edit" data-testid="btn-cancel"
                data-event-id="EXP.OPEX_DOSSIER.NEW.CANCEL"
                onClick={handleCancel} title="Huỷ thay đổi (Esc)">✖ Huỷ</button>
              <button className="btn btn-secondary" data-show-mode="new,edit" data-testid="btn-save-draft"
                data-event-id="EXP.OPEX_DOSSIER.NEW.SAVE_DRAFT"
                onClick={handleSaveDraft} title="Lưu nháp">📋 Lưu nháp</button>
              <button className="btn btn-primary" data-show-mode="new,edit" data-testid="btn-save"
                data-event-id="EXP.OPEX_DOSSIER.NEW.SAVE" id="btn-save"
                onClick={handleSave} title="Lưu (Ctrl+S)">💾 Lưu (Ctrl+S)</button>
            </>
          )}

          {/* VIEW mode matrix buttons */}
          {isViewMode && btnVisible('print') && (
            <button className="btn btn-secondary" data-show-mode="view" id="btn-print" data-testid="btn-print"
              data-event-id="EXP.OPEX_DOSSIER.VIEW.PRINT"
              disabled={btnDisabled('print')}
              onClick={handlePrint} title="In / Xuất">🖨 In</button>
          )}
          {isViewMode && btnVisible('copy') && (
            <button className="btn btn-secondary" data-show-mode="view" id="btn-copy" data-testid="btn-copy"
              data-event-id="EXP.OPEX_DOSSIER.VIEW.COPY"
              disabled={btnDisabled('copy')}
              onClick={handleCopy} title="Sao chép hồ sơ">📑 Sao chép</button>
          )}
          {isViewMode && btnVisible('cancel') && (
            <button className="btn btn-warning" data-show-mode="view" id="btn-cancel-biz" data-testid="btn-cancel-biz"
              data-event-id="EXP.OPEX_DOSSIER.VIEW.CANCEL"
              disabled={btnDisabled('cancel')}
              onClick={handleCancelBiz} title="Hủy bỏ hồ sơ (không hoàn tác)">⊘ Hủy bỏ</button>
          )}

          {/* submit: data-show-mode="view,edit" */}
          {(isViewMode ? btnVisible('submit') : isNewOrEdit) && (
            <button className="btn btn-success" data-show-mode="view,edit" data-testid="btn-submit"
              data-event-id="EXP.OPEX_DOSSIER.VIEW.SUBMIT" id="btn-submit"
              disabled={isViewMode ? submitDisabled : false}
              onClick={handleSubmit} title={submitTitle}>📤 Gửi kiểm soát (F9)</button>
          )}

          {isViewMode && btnVisible('reject') && (
            <button className="btn btn-danger" data-show-mode="view" id="btn-reject" data-testid="btn-reject"
              data-event-id="EXP.OPEX_DOSSIER.APPROVER.REJECT"
              disabled={btnDisabled('reject')}
              onClick={handleReject} title="Từ chối hồ sơ">✖ Từ chối</button>
          )}
          {isViewMode && btnVisible('approve') && (
            <button className="btn btn-primary" data-show-mode="view" id="btn-approve" data-testid="btn-approve"
              data-event-id="EXP.OPEX_DOSSIER.APPROVER.APPROVE"
              disabled={btnDisabled('approve')}
              onClick={handleApprove} title="Phê duyệt hồ sơ">✅ Phê duyệt</button>
          )}
          {isViewMode && btnVisible('edit') && (
            <button className="btn btn-primary" data-show-mode="view" data-testid="btn-edit"
              data-event-id="EXP.OPEX_DOSSIER.VIEW.EDIT_OPEN" id="btn-edit-top"
              disabled={btnDisabled('edit')}
              onClick={() => setCurrentMode('edit')} title="Chỉnh sửa (F2)">✏️ Sửa (F2)</button>
          )}
        </div>
      </div>

      {/* ── DELETE DIALOG ── */}
      {isDeleteOpen && (
        <div className="dialog-overlay" id="dialog-delete-confirm" onClick={e => { if (e.target === e.currentTarget) setIsDeleteOpen(false) }}>
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>🗑 Xác nhận xoá hồ sơ</h3>
              <button onClick={() => setIsDeleteOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="dialog-body">
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                Bạn đang xoá hồ sơ: <strong id="delete-dossier-code">{record?.DOSSIER_CODE ?? '—'}</strong><br />
                Trạng thái: <span id="delete-status-badge"><span className={`badge ${statusUi.cls}`}>{statusUi.label}</span></span>
              </div>
              <div className="form-group">
                <label>Lý do xoá <span className="req">*</span> <span style={{ fontSize: 10, color: 'var(--muted)' }}>(tối thiểu 10 ký tự)</span></label>
                <textarea
                  id="input-delete-reason"
                  data-testid="input-delete-reason"
                  ref={deleteReasonRef}
                  rows={3}
                  placeholder="Nhập lý do xoá (≥10 ký tự, ≤500 ký tự)..."
                  maxLength={500}
                  data-field-code="DELETE_REASON"
                  data-validation="VAL-16"
                  data-spec-ref="B3.1.row3"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                />
                <span className="error-hint show" id="err-delete-reason" style={{ color: 'var(--muted)' }}>
                  Đã nhập: <span id="reason-count">{deleteReason.length}</span>/500 ký tự (cần ≥10)
                </span>
              </div>
              <div className="form-check">
                <input type="checkbox" id="checkbox-confirm-reviewed"
                  data-testid="checkbox-confirm-reviewed"
                  data-field-code="CONFIRM_REVIEWED"
                  data-spec-ref="B3.1.row4"
                  checked={confirmReviewed}
                  onChange={e => setConfirmReviewed(e.target.checked)}
                />
                <label htmlFor="checkbox-confirm-reviewed">Tôi đã rà soát và xác nhận xoá hồ sơ này</label>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)}>Huỷ (Esc)</button>
              <button className="btn btn-danger" id="btn-confirm-delete"
                data-testid="btn-confirm-delete"
                data-event-id="EXP.OPEX_DOSSIER.VIEW.DELETE_CONFIRM"
                data-action="confirm-delete"
                disabled={confirmDeleteDisabled}
                onClick={handleConfirmDelete}>
                Xác nhận xoá (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL CONFIRM DIALOG ── */}
      {isCancelConfirmOpen && (
        <div className="dialog-overlay" id="dialog-cancel-confirm" onClick={e => { if (e.target === e.currentTarget) setIsCancelConfirmOpen(false) }}>
          <div className="dialog-box">
            <div className="dialog-header" style={{ background: 'var(--muted)' }}>
              <h3>⚠️ Xác nhận huỷ</h3>
              <button onClick={() => setIsCancelConfirmOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="dialog-body">
              <p style={{ fontSize: 13 }}>Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ và rời khỏi trang này?</p>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setIsCancelConfirmOpen(false)}>Tiếp tục nhập</button>
              <button className="btn btn-danger" onClick={() => { setIsCancelConfirmOpen(false); navigate('/opex-dossiers') }}>Xác nhận huỷ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN IFRAME MODAL ── */}
      {isIframeOpen && (
        <div id="popup-doc-iframe" className="doc-iframe-overlay">
          <div className="doc-iframe-box">
            <div className="doc-iframe-header">
              <h3 id="iframe-modal-title">{iframeTitle}</h3>
              <span className="iframe-note" id="iframe-modal-subtitle">{iframeSubtitle}</span>
              <div className="doc-iframe-actions">
                {iframeShowConfirm && (
                  <button className="doc-iframe-confirm" id="btn-iframe-confirm" onClick={confirmIframeDoc}>✔ Xác nhận & Thêm vào hồ sơ</button>
                )}
                <button className="doc-iframe-close" id="btn-iframe-close" onClick={closeIframeModal}>
                  {iframeShowConfirm ? '✕ Đóng (Esc)' : '✕ Đóng'}
                </button>
              </div>
            </div>
            <iframe
              id="doc-iframe-frame"
              className="doc-iframe-frame"
              src={iframeSrc}
              title="Tạo mới chứng từ"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            />
          </div>
        </div>
      )}

      {/* ── LOV CHỌN LOẠI CHỨNG TỪ ── */}
      {isDocTypeOpen && (
        <div className="lov-overlay" id="popup-doc-type" onClick={e => { if (e.target === e.currentTarget) setIsDocTypeOpen(false) }}>
          <div className="lov-box">
            <div className="lov-header">
              <h3>📋 Chọn loại chứng từ</h3>
              <button className="lov-close" onClick={() => setIsDocTypeOpen(false)} title="Esc">✕</button>
            </div>
            <div className="lov-search-bar">
              <input
                type="text" id="lov-search"
                ref={lovSearchRef}
                placeholder="🔍 Tìm kiếm theo mã hoặc tên chứng từ..."
                value={lovSearch}
                onChange={e => setLovSearch(e.target.value)}
              />
              <span id="lov-count-label">{lovVisible.length} / {DOC_TYPES.length} loại</span>
            </div>
            <div className="lov-table-wrap">
              <table className="lov-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" id="lov-check-all"
                        checked={lovVisible.length > 0 && lovVisible.every(d => lovSelectedCodes.has(d.code))}
                        onChange={e => toggleCheckAll(e.target.checked)}
                        title="Chọn tất cả"
                      />
                    </th>
                    <th>Mã loại CT</th>
                    <th>Tên loại chứng từ</th>
                  </tr>
                </thead>
                <tbody id="lov-tbody">
                  {lovVisible.length === 0
                    ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>Không tìm thấy loại chứng từ phù hợp</td></tr>
                    : lovVisible.map(d => (
                      <tr key={d.code} className={lovSelectedCodes.has(d.code) ? 'selected' : ''} onClick={() => toggleLovRow(d.code)}>
                        <td>
                          <input type="checkbox" checked={lovSelectedCodes.has(d.code)}
                            onChange={() => toggleLovRow(d.code)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--primary)' }}>{d.code}</td>
                        <td>{d.name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="lov-footer">
              <span className="lov-selected-count" id="lov-selected-label">
                {lovSelectedCodes.size > 0 ? `Đã chọn ${lovSelectedCodes.size} loại chứng từ` : 'Chưa chọn loại nào'}
              </span>
              <div className="lov-actions">
                <button className="btn btn-secondary" onClick={() => setIsDocTypeOpen(false)}>Huỷ (Esc)</button>
                <button className="btn btn-primary" id="btn-lov-confirm"
                  disabled={lovSelectedCodes.size === 0}
                  onClick={confirmDocTypeSelection}>✔ Chọn (Enter)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP NHẬP THÔNG TIN CHỨNG TỪ ── */}
      {isDocEntryOpen && (
        <div className="lov-overlay" id="popup-doc-entry" onClick={e => { if (e.target === e.currentTarget) closeDocEntryPopup() }}>
          <div className="doc-form-box">
            <div className="doc-form-header">
              <h3 id="doc-entry-title">{docEntryTitle}</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }} onClick={closeDocEntryPopup} title="Esc">✕</button>
            </div>
            <div className="doc-form-body">
              <div className="form-group span-full">
                <label>Loại chứng từ <span className="req">*</span></label>
                <input type="text" id="doc-entry-type-name" readOnly style={{ background: '#f5f5f5', color: '#444' }} value={docEntry.typeName} />
              </div>
              <div className="form-group">
                <label>Số chứng từ <span className="req">*</span></label>
                <input type="text" id="doc-entry-number" ref={docEntryNumberRef}
                  placeholder="Nhập số chứng từ..." maxLength={50}
                  value={docEntry.number}
                  onChange={e => { setDocEntry(de => ({ ...de, number: e.target.value })); setDocEntryErrors(err => ({ ...err, number: false })) }}
                />
                {docEntryErrors.number && <span className="error-hint show" id="err-doc-number">Vui lòng nhập số chứng từ</span>}
              </div>
              <div className="form-group">
                <label>Ngày chứng từ <span className="req">*</span></label>
                <input type="date" id="doc-entry-date"
                  value={docEntry.date}
                  onChange={e => { setDocEntry(de => ({ ...de, date: e.target.value })); setDocEntryErrors(err => ({ ...err, date: false })) }}
                />
                {docEntryErrors.date && <span className="error-hint show" id="err-doc-date">Vui lòng nhập ngày hợp lệ</span>}
              </div>
              <div className="form-group">
                <label>Ngày hạch toán <span className="req">*</span></label>
                <input type="date" id="doc-entry-posting-date"
                  value={docEntry.postingDate}
                  onChange={e => { setDocEntry(de => ({ ...de, postingDate: e.target.value })); setDocEntryErrors(err => ({ ...err, postingDate: false })) }}
                />
                {docEntryErrors.postingDate && <span className="error-hint show" id="err-doc-posting-date">Vui lòng nhập ngày hạch toán</span>}
              </div>
              <div className="form-group">
                <label>Loại tiền <span className="req">*</span></label>
                <select id="doc-entry-currency"
                  value={docEntry.currency}
                  onChange={e => {
                    const cur = e.target.value
                    const vnd = updateVndDisplay(docEntry.amount, cur)
                    setDocEntry(de => ({ ...de, currency: cur, vnd }))
                  }}
                >
                  <option value="VND">VND — Việt Nam đồng</option>
                  <option value="USD">USD — Đô la Mỹ</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền nguyên tệ <span className="req">*</span></label>
                <input type="text" id="doc-entry-amount" placeholder="0"
                  value={docEntry.amount}
                  onChange={e => {
                    const amt = e.target.value
                    const vnd = updateVndDisplay(amt, docEntry.currency)
                    setDocEntry(de => ({ ...de, amount: amt, vnd }))
                    setDocEntryErrors(err => ({ ...err, amount: false }))
                  }}
                />
                {docEntryErrors.amount && <span className="error-hint show" id="err-doc-amount">Vui lòng nhập số tiền hợp lệ (&gt; 0)</span>}
              </div>
              <div className="form-group span-full">
                <label>Số tiền VND <span style={{ fontSize: 10, color: 'var(--info)' }}>(tự tính)</span></label>
                <input type="text" id="doc-entry-vnd" readOnly style={{ background: '#f5f5f5', color: '#444', fontWeight: 600 }}
                  placeholder="Tự động tính theo tỷ giá"
                  value={docEntry.vnd}
                />
              </div>
            </div>
            <div className="doc-form-footer">
              <button className="btn btn-secondary" onClick={closeDocEntryPopup}>Huỷ</button>
              <button className="btn btn-primary" onClick={saveDocEntry}>💾 Thêm chứng từ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOV ĐVSDNS ── */}
      {isSegmentLovOpen && (
        <div className="lov-overlay" id="popup-segment-lov" onClick={e => { if (e.target === e.currentTarget) setIsSegmentLovOpen(false) }}>
          <div className="seg-lov-box">
            <div className="lov-header">
              <h3>🏛 Chọn Mã ĐVSDNS</h3>
              <button className="lov-close" onClick={() => setIsSegmentLovOpen(false)} title="Esc">✕</button>
            </div>
            <div className="lov-search-bar">
              <input type="text" id="seg-lov-search"
                ref={segSearchRef}
                placeholder="🔍 Tìm theo mã hoặc tên đơn vị..."
                value={segSearch}
                onChange={e => setSegSearch(e.target.value)}
              />
              <span id="seg-lov-count" style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {segVisible.length} / {Object.keys(SEGMENT_MAP).length} đơn vị
              </span>
            </div>
            <div className="seg-lov-table-wrap">
              <table className="seg-lov-table">
                <thead>
                  <tr>
                    <th className="seg-code-hdr">Mã đơn vị</th>
                    <th>Tên đơn vị sử dụng ngân sách</th>
                  </tr>
                </thead>
                <tbody id="seg-lov-tbody">
                  {segVisible.length === 0
                    ? <tr><td colSpan={2} style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>Không tìm thấy đơn vị phù hợp</td></tr>
                    : segVisible.map(([code, name]) => (
                      <tr key={code}
                        className={form.BUDGET_UNIT_CODE === code ? 'seg-selected' : ''}
                        onClick={() => selectSegment(code)}
                      >
                        <td className="seg-code-cell">{code}</td>
                        <td>{name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="seg-lov-footer">
              <span>Click vào dòng để chọn • Esc để đóng</span>
              <button className="btn btn-secondary" onClick={() => setIsSegmentLovOpen(false)}>Đóng (Esc)</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default OpexDossierDetailPage
