import { get, post, put, del } from '@/services/api'
import type {
  OpexDossierListParams,
  OpexDossierListResult,
  OpexDossierListResponse,
  OpexDossierDetail,
  OpexDossierCreateRequest,
  OpexDossierDraftRequest,
  OpexDossierUpdateRequest,
  DeleteOpexDossierRequest,
  OpexApproveRequest,
  OpexRejectRequest,
  OpexDossierCreateResponse,
  OpexDossierUpdateResponse,
  OpexWorkflowActionResponse,
  OpexDocumentDetail,
  OpexDocumentCreateRequest,
  OpexDocumentUpdateRequest,
  OpexAttachment,
  OpexApprovalLogEntry,
  OpexAuditLogEntry,
  ExportOpexParams,
  ExportJob,
} from '@/types/index'

const BASE = '/exp/opex/dossiers'

// BE OPEX trả body TRẦN cho mọi success (KHÔNG bọc { success, data }); chỉ lỗi mới có ErrorResponse.
// List là ngoại lệ envelope: { items, pagination, statusCounts } — KHÁC PagedResponse<T> → adapter dưới.

/** Sinh UUID client-side cho header Idempotency-Key (phòng double-submit). */
export const newIdempotencyKey = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.floor(Math.random() * 0xffffffff).toString(16)}`

/** Config gắn header idempotency cho POST/PUT/DELETE mutating (tên header theo contract). */
const idem = (key?: string) =>
  key ? { headers: { 'Idempotency-Key': key } } : undefined

/** Serialize mảng query thành key lặp (?fStatus=DRAFT&fStatus=CHECKED). */
const explode = { indexes: null as null }

// ── Dossiers (CRUD) ────────────────────────────────────────────────────────

/**
 * List OPEX dossiers — GET + query (KHÔNG POST/search), page 0-based, sort là chuỗi.
 * Adapter: trả thẳng envelope contract { items, pagination(0-based), statusCounts }.
 */
export const listOpexDossiers = async (
  params: OpexDossierListParams = {},
): Promise<OpexDossierListResult> => {
  const res = await get<OpexDossierListResponse>(BASE, { params, paramsSerializer: explode })
  return {
    items: res.items ?? [],
    pagination: res.pagination ?? { page: params.page ?? 0, size: params.size ?? 20, totalElements: 0, totalPages: 0 },
    statusCounts: res.statusCounts ?? {},
  }
}

export const getOpexDossier = (id: string): Promise<OpexDossierDetail> =>
  get<OpexDossierDetail>(`${BASE}/${id}`)

export const createOpexDossier = (data: OpexDossierCreateRequest, idemKey?: string): Promise<OpexDossierCreateResponse> =>
  post<OpexDossierCreateResponse>(BASE, data, idem(idemKey))

export const saveOpexDraft = (data: OpexDossierDraftRequest, idemKey?: string): Promise<OpexDossierCreateResponse> =>
  post<OpexDossierCreateResponse>(`${BASE}/drafts`, data, idem(idemKey))

export const updateOpexDossier = (id: string, data: OpexDossierUpdateRequest, idemKey?: string): Promise<OpexDossierUpdateResponse> =>
  put<OpexDossierUpdateResponse>(`${BASE}/${id}`, data, idem(idemKey))

export const deleteOpexDossier = (id: string, body: DeleteOpexDossierRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  del<OpexWorkflowActionResponse>(`${BASE}/${id}`, { data: body, ...(idemKey ? { headers: { 'Idempotency-Key': idemKey } } : {}) })

export const copyOpexDossier = (id: string, idemKey?: string): Promise<OpexDossierCreateResponse> =>
  post<OpexDossierCreateResponse>(`${BASE}/${id}/copy`, undefined, idem(idemKey))

// ── Workflow transitions ─────────────────────────────────────────────────────

export const submitOpexDossier = (id: string, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/submit`, undefined, idem(idemKey))

export const checkOpexDossier = (id: string, body?: OpexApproveRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/check`, body, idem(idemKey))

export const rejectByChecker = (id: string, body: OpexRejectRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/check-reject`, body, idem(idemKey))

export const returnByChecker = (id: string, body: OpexRejectRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/check-return`, body, idem(idemKey))

export const approveOpexDossier = (id: string, body?: OpexApproveRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/approve`, body, idem(idemKey))

export const rejectByApprover = (id: string, body: OpexRejectRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/approve-reject`, body, idem(idemKey))

export const cancelApproval = (id: string, body: OpexRejectRequest, idemKey?: string): Promise<OpexWorkflowActionResponse> =>
  post<OpexWorkflowActionResponse>(`${BASE}/${id}/approve-cancel`, body, idem(idemKey))

// ── Documents (chứng từ) ─────────────────────────────────────────────────────

export const listOpexDocuments = (id: string): Promise<OpexDocumentDetail[]> =>
  get<OpexDocumentDetail[]>(`${BASE}/${id}/documents`)

export const addOpexDocument = (id: string, data: OpexDocumentCreateRequest, idemKey?: string): Promise<OpexDocumentDetail> =>
  post<OpexDocumentDetail>(`${BASE}/${id}/documents`, data, idem(idemKey))

export const getOpexDocument = (id: string, docId: string): Promise<OpexDocumentDetail> =>
  get<OpexDocumentDetail>(`${BASE}/${id}/documents/${docId}`)

export const updateOpexDocument = (id: string, docId: string, data: OpexDocumentUpdateRequest, idemKey?: string): Promise<OpexDocumentDetail> =>
  put<OpexDocumentDetail>(`${BASE}/${id}/documents/${docId}`, data, idem(idemKey))

export const deleteOpexDocument = (id: string, docId: string, idemKey?: string): Promise<void> =>
  del<void>(`${BASE}/${id}/documents/${docId}`, idem(idemKey))

// ── Attachments — dossier level ──────────────────────────────────────────────

export const listDossierAttachments = (id: string): Promise<OpexAttachment[]> =>
  get<OpexAttachment[]>(`${BASE}/${id}/attachments`)

export const uploadDossierAttachment = (id: string, formData: FormData, idemKey?: string): Promise<OpexAttachment> =>
  post<OpexAttachment>(`${BASE}/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
    },
  })

export const downloadDossierAttachment = (id: string, attId: string): Promise<Blob> =>
  get<Blob>(`${BASE}/${id}/attachments/${attId}`, { responseType: 'blob' })

export const deleteDossierAttachment = (id: string, attId: string, idemKey?: string): Promise<void> =>
  del<void>(`${BASE}/${id}/attachments/${attId}`, idem(idemKey))

// ── Attachments — document level ─────────────────────────────────────────────

export const listDocumentAttachments = (id: string, docId: string): Promise<OpexAttachment[]> =>
  get<OpexAttachment[]>(`${BASE}/${id}/documents/${docId}/attachments`)

export const uploadDocumentAttachment = (id: string, docId: string, formData: FormData, idemKey?: string): Promise<OpexAttachment> =>
  post<OpexAttachment>(`${BASE}/${id}/documents/${docId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
    },
  })

export const downloadDocumentAttachment = (id: string, docId: string, attId: string): Promise<Blob> =>
  get<Blob>(`${BASE}/${id}/documents/${docId}/attachments/${attId}`, { responseType: 'blob' })

export const deleteDocumentAttachment = (id: string, docId: string, attId: string, idemKey?: string): Promise<void> =>
  del<void>(`${BASE}/${id}/documents/${docId}/attachments/${attId}`, idem(idemKey))

// ── Audit ────────────────────────────────────────────────────────────────────

export const getOpexApprovalLog = (id: string): Promise<OpexApprovalLogEntry[]> =>
  get<OpexApprovalLogEntry[]>(`${BASE}/${id}/approval-log`)

export const getOpexAuditLog = (id: string): Promise<OpexAuditLogEntry[]> =>
  get<OpexAuditLogEntry[]>(`${BASE}/${id}/audit-log`)

// ── Export (200 Blob khi < 50k; 202 + ExportJob khi ≥ 50k) ───────────────────

/**
 * Export list. Trả raw AxiosResponse-like qua wrapper KHÔNG khả dụng → service đọc cả 2 nhánh:
 * 200 → Blob (tải trực tiếp); 202 → ExportJob (poll getOpexExportJob).
 * Vì wrapper api.ts chỉ trả body, gọi blob mặc định; nếu cần phân biệt 202, page dùng exportOpexDossiersJob.
 */
export const exportOpexDossiers = (params: ExportOpexParams): Promise<Blob> =>
  get<Blob>(`${BASE}/export`, { params, paramsSerializer: explode, responseType: 'blob' })

export const getOpexExportJob = (jobId: string): Promise<ExportJob> =>
  get<ExportJob>(`${BASE}/export/${jobId}`)
