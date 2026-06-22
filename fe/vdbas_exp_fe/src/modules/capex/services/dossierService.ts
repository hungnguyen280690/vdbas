import { get, post, put, del } from '@/services/api'
import type {
  DossierListParams,
  DossierListResult,
  DossierSummary,
  DossierDetail,
  DossierCreateRequest,
  DossierDraftRequest,
  DossierUpdateRequest,
  DeleteDossierRequest,
  SubmitDossierRequest,
  ApproveRequest,
  RejectRequest,
  DossierMutationResult,
  WorkflowActionResult,
  SuccessResponse,
  AddDocumentRequest,
  UpdateDocumentRequest,
  DocumentListResult,
  DocumentDetail,
  AttachmentInfo,
  ApprovalLogResult,
  ApprovalLogEntry,
  AuditLogResult,
  AuditLogEntry,
  DossierStatus,
  ExportDossiersParams,
} from '@/types/index'

const BASE = '/exp/capex/dossiers'

// BE trả body TRẦN cho mọi success (KHÔNG bọc { success, data }). Chỉ lỗi mới có envelope.
// Vì vậy chỉ cần trả thẳng kết quả của get/post/put (đã là body HTTP qua wrapper api.ts).

/** Sinh UUID client-side cho header X-Idempotency-Key (phòng double-submit). */
export const newIdempotencyKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.floor(Math.random() * 0xffffffff).toString(16)}`

/** Config gắn header idempotency cho POST workflow/create. */
const idem = (key?: string) =>
  key ? { headers: { 'X-Idempotency-Key': key } } : undefined

/** Serialize mảng query thành key lặp (?fStatus=DRAFT&fStatus=SAVED). */
const explode = { indexes: null as null }

// ── Dossiers ─────────────────────────────────────────────────────────────────

/** BE list trả PageResponseDto trần: { content, page(0-based), size, totalElements, totalPages }. */
interface PageResponse<T> {
  content?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export const listDossiers = async (params: DossierListParams = {}): Promise<DossierListResult> => {
  const { page = 1, pageSize = 20, sortDir, ...rest } = params
  // Map param FE → BE: page 1-based → 0-based, pageSize → size, sortDir → sortDirection(lowercase).
  const beParams = {
    ...rest, // search, dossierCode, projectCode, createdBy, dateField, fromDate, toDate, fStatus[], dataSourceCode[], sortBy
    page: Math.max(0, page - 1),
    size: pageSize,
    sortDirection: sortDir ? String(sortDir).toLowerCase() : undefined,
  }
  const res = await get<PageResponse<DossierSummary>>(BASE, { params: beParams, paramsSerializer: explode })
  const items = res.content ?? []
  return {
    items,
    pagination: {
      page: (res.page ?? 0) + 1,
      pageSize: res.size ?? pageSize,
      totalRecords: res.totalElements ?? 0,
      totalPages: res.totalPages ?? 1,
    },
    // BE chưa có tổng tiền toàn cục/đếm theo trạng thái → tổng theo trang hiện tại, không có statusCounts.
    totalBaseAmount: items.reduce((s, d) => s + (d.totalBaseAmount || 0), 0),
    statusCounts: [],
  }
}

export const getDossier = (id: string): Promise<DossierDetail> =>
  get<DossierDetail>(`${BASE}/${id}`)

export const createDossier = (data: DossierCreateRequest, idemKey?: string): Promise<DossierMutationResult> =>
  post<DossierMutationResult>(BASE, data, idem(idemKey))

export const saveDossierDraft = (data: DossierDraftRequest, idemKey?: string): Promise<DossierMutationResult> =>
  post<DossierMutationResult>(`${BASE}/drafts`, data, idem(idemKey))

export const updateDossier = (id: string, data: DossierUpdateRequest): Promise<DossierMutationResult> =>
  put<DossierMutationResult>(`${BASE}/${id}`, data)

export const deleteDossier = (id: string, body: DeleteDossierRequest): Promise<SuccessResponse> =>
  del<SuccessResponse>(`${BASE}/${id}`, { data: body })

// ── Workflow ─────────────────────────────────────────────────────────────────

export const submitDossier = (id: string, body: SubmitDossierRequest, idemKey?: string): Promise<WorkflowActionResult> =>
  post<WorkflowActionResult>(`${BASE}/${id}/submit`, body, idem(idemKey))

export const approveDossier = (id: string, body: ApproveRequest, idemKey?: string): Promise<WorkflowActionResult> =>
  post<WorkflowActionResult>(`${BASE}/${id}/approve`, body, idem(idemKey))

export const rejectDossier = (id: string, body: RejectRequest, idemKey?: string): Promise<WorkflowActionResult> =>
  post<WorkflowActionResult>(`${BASE}/${id}/reject`, body, idem(idemKey))

export const copyDossier = (id: string, idemKey?: string): Promise<DossierMutationResult> =>
  post<DossierMutationResult>(`${BASE}/${id}/copy`, undefined, idem(idemKey))

// ── Documents ────────────────────────────────────────────────────────────────

export const listDossierDocuments = (id: string): Promise<DocumentListResult> =>
  get<DocumentListResult>(`${BASE}/${id}/documents`)

export const addDocument = (id: string, data: AddDocumentRequest, idemKey?: string): Promise<DocumentDetail> =>
  post<DocumentDetail>(`${BASE}/${id}/documents`, data, idem(idemKey))

export const getDocument = (id: string, docId: string): Promise<DocumentDetail> =>
  get<DocumentDetail>(`${BASE}/${id}/documents/${docId}`)

export const updateDocument = (id: string, docId: string, data: UpdateDocumentRequest): Promise<DocumentDetail> =>
  put<DocumentDetail>(`${BASE}/${id}/documents/${docId}`, data)

export const removeDocument = (id: string, docId: string): Promise<SuccessResponse> =>
  del<SuccessResponse>(`${BASE}/${id}/documents/${docId}`)

// ── Attachments ──────────────────────────────────────────────────────────────

export const listAttachments = (id: string): Promise<AttachmentInfo[]> =>
  get<AttachmentInfo[]>(`${BASE}/${id}/attachments`)

export const uploadAttachment = (id: string, formData: FormData, idemKey?: string): Promise<AttachmentInfo> =>
  post<AttachmentInfo>(`${BASE}/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(idemKey ? { 'X-Idempotency-Key': idemKey } : {}),
    },
  })

export const downloadAttachment = (id: string, attId: string): Promise<Blob> =>
  get<Blob>(`${BASE}/${id}/attachments/${attId}`, { responseType: 'blob' })

export const deleteAttachment = (id: string, attId: string): Promise<SuccessResponse> =>
  del<SuccessResponse>(`${BASE}/${id}/attachments/${attId}`)

// ── Audit ────────────────────────────────────────────────────────────────────

// BE trả mảng trần List<ApprovalLogEntry>; FE bọc lại thành { dossierId, currentStatus, workflow }.
export const getApprovalLog = async (id: string): Promise<ApprovalLogResult> => {
  const workflow = (await get<ApprovalLogEntry[]>(`${BASE}/${id}/approval-log`)) ?? []
  return {
    dossierId: id,
    currentStatus: (workflow.length ? workflow[workflow.length - 1].stateCode : 'DRAFT') as DossierStatus,
    workflow,
  }
}

// BE trả PageResponseDto trần (content/...); FE map sang AuditLogResult { items, pagination }. page 0-based.
export const getAuditLog = async (id: string, params: { page?: number; pageSize?: number } = {}): Promise<AuditLogResult> => {
  const { page = 1, pageSize = 20 } = params
  const res = await get<PageResponse<AuditLogEntry>>(`${BASE}/${id}/audit-log`, {
    params: { page: Math.max(0, page - 1), size: pageSize },
  })
  const items = res.content ?? []
  return {
    items,
    pagination: {
      page: (res.page ?? 0) + 1,
      pageSize: res.size ?? pageSize,
      totalRecords: res.totalElements ?? 0,
      totalPages: res.totalPages ?? 1,
    },
  }
}

// ── Export (blob khi sync < 50k; có thể trả 202 + jobId — page tự xử lý raw) ────

export const exportDossiers = (params: ExportDossiersParams): Promise<Blob> =>
  get<Blob>(`${BASE}/export`, { params, paramsSerializer: explode, responseType: 'blob' })
