// ── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtUser {
  sub?: string
  name?: string
  email?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: { roles: string[] }
  resource_access?: Record<string, { roles: string[] }>
  [key: string]: unknown
}

export interface AuthContextValue {
  authenticated: boolean
  loading: boolean
  user: JwtUser | null
  token: string | null
  login: () => void
  logout: () => void
  getToken: () => string | null
  hasRole: (role: string) => boolean
  isTokenValid: () => boolean
}

// ── Permissions ───────────────────────────────────────────────────────────────

export interface MenuItem {
  code?: string
  name: string
  path?: string
  children?: MenuItem[]
  [key: string]: unknown
}

export interface ApiPermission {
  path?: string
  method?: string
  [key: string]: unknown
}

export interface PermissionContextValue {
  menus: MenuItem[]
  apiPermissions: ApiPermission[]
  menusLoading: boolean
  apisLoading: boolean
  menusError: unknown
  apisError: unknown
  hasApiPermission: (path: string, method: string) => boolean
  hasMenuPermission: (path: string) => boolean
  isLoading: boolean
}

// ── CategoryGroup Entity ──────────────────────────────────────────────────────

export interface CategoryGroupRecord {
  groupCode: string
  groupName: string
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
  extAttributes?: Record<string, unknown> | string | null
  deleted?: boolean
  system?: boolean
  active?: boolean
  [key: string]: unknown
}

export interface CategoryGroupPayload {
  groupCode?: string
  groupName?: string
  system?: boolean
  active?: boolean
  deleted?: boolean
  extAttributes?: string | null
  [key: string]: unknown
}

// ── API / Pagination ──────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  content?: T[]
  data?: T[]
  totalElements?: number
  total?: number
}

export interface PaginationState {
  current: number
  pageSize: number
  total: number
}

// ── Extended Attributes & Metadata ───────────────────────────────────────────

export type ExtAttributes = Record<string, unknown>

export interface AttributeMetadataOption {
  label: string
  value: string
}

export interface AttributeMetadata {
  key: string
  label: string
  type: 'input' | 'area' | 'select' | 'listbox' | 'radio' | 'checkbox' | 'date' | string
  options?: AttributeMetadataOption[]
  multiple?: boolean
}

// ── Tree ──────────────────────────────────────────────────────────────────────

export interface TreeNode {
  id?: string | number
  parentId?: string | number | null
  path?: string
  children?: TreeNode[]
  [key: string]: unknown
}

// ── Mutation Hook Options ─────────────────────────────────────────────────────

export interface MutationHookOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void
  skipNotification?: boolean
}

// ── EXP CAPEX Dossier — Enums ──────────────────────────────────────────────────
// Giá trị enum khớp đúng contract (camelCase field / UPPER_SNAKE value).

export type DossierStatus =
  | 'DRAFT' | 'SAVED' | 'VALIDATED' | 'SUBMITTED'
  | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export type ActionRole = 'MAKER' | 'CHECKER' | 'APPROVER'
export type DataSourceCode = 'THU_CONG' | 'DVC'
export type ProjectType = 'MILITARY' | 'CITIZEN'
export type AttachmentTypeCode =
  | 'CHUNG_TU_GOC' | 'HOP_DONG' | 'HOA_DON' | 'BANG_KE' | 'VAN_BAN_KHAC'
export type DossierDateField = 'SEND_DATE' | 'CREATED_DATE' | 'CHECKED_DATE' | 'APPROVED_DATE'
export type DossierSortBy = 'DOSSIER_CODE' | 'PROJECT_CODE' | 'SEND_DATE' | 'CREATED_DATE' | 'F_STATUS'
export type SortDir = 'ASC' | 'DESC'
export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV'
export type AuditActionType = 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT'

// ── EXP CAPEX Dossier — Request types ──────────────────────────────────────────
// Read-only BE-managed (dossierCode, createdBy…) KHÔNG đưa vào Request.

export interface DossierCreateRequest {
  sendDate: string
  dataSourceCode: DataSourceCode
  dossierTypeCode: string // BE @NotBlank — luồng hiện tại luôn 'CAPEX'
  organizationCode: string // BE gộp Chủ đầu tư + Ban QLDA thành "tổ chức"
  projectCode: string
  projectSpecificCode?: string | null
}

export interface DossierDraftRequest {
  dossierId?: string // BE yêu cầu khi autosave nháp gắn vào hồ sơ đã tạo
  sendDate?: string
  dataSourceCode?: DataSourceCode
  dossierTypeCode?: string
  organizationCode?: string
  projectCode?: string
  projectSpecificCode?: string | null
}

export interface DossierUpdateRequest {
  version: number // optimistic lock — bắt buộc
  sendDate?: string
  projectCode?: string
  projectSpecificCode?: string | null
}

export interface DeleteDossierRequest {
  deleteReason: string // ≥ 10 ký tự
  confirmReviewed: boolean // bắt buộc = true
}

export interface SubmitDossierRequest {
  version: number
}

export interface DigitalSignInfo {
  signedContent?: string
  signature?: string
  cert?: string
  signedDate?: string
}

export interface ApproveRequest {
  reason?: string
  digitalSign?: DigitalSignInfo
}

export interface RejectRequest {
  reason: string // ≥ 10 ký tự
}

export interface AddDocumentRequest {
  documentTypeCode: string
  documentName?: string
  documentNo: string
  documentDate: string
  accountingDate: string
  originalAmount?: number | null
  baseAmount: number
}

export interface UpdateDocumentRequest extends AddDocumentRequest {
  version: number
}

export interface DossierListParams {
  search?: string
  dossierCode?: string
  projectCode?: string
  dateField?: DossierDateField
  fromDate?: string
  toDate?: string
  fStatus?: DossierStatus[]
  dataSourceCode?: DataSourceCode[]
  createdBy?: string
  page?: number // 1-based
  pageSize?: number // ∈ [20,50,100,200]
  sortBy?: DossierSortBy
  sortDir?: SortDir
  [key: string]: unknown
}

export interface ExportDossiersParams {
  format: ExportFormat
  dossierCode?: string
  projectCode?: string
  fromDate?: string
  toDate?: string
  fStatus?: DossierStatus[]
  dataSourceCode?: string[]
  [key: string]: unknown
}

// ── EXP CAPEX Dossier — Response data shapes (sau khi unwrap envelope .data) ─────

export interface Pagination {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export interface StatusCount {
  status: DossierStatus
  statusName: string
  count: number
}

export interface DossierSummary {
  id: string
  dossierCode: string
  projectCode: string
  projectName: string
  dataSourceCode: DataSourceCode
  dataSourceName: string
  sendDate: string
  fStatus: DossierStatus
  fStatusName: string
  createdBy: string
  createdDate: string
  documentCount: number
  totalBaseAmount: number
  // Cột tuỳ chọn (mặc định ẩn)
  returningReason?: string | null
  checkedBy?: string | null
  checkedDate?: string | null
  checkRejectionReason?: string | null
  approvedBy?: string | null
  approvedDate?: string | null
  approvalRejectionReason?: string | null
}

export interface DocumentSummary {
  id: string
  seqNo: number
  documentTypeCode: string
  documentName: string
  documentNo: string
  documentDate: string
  accountingDate: string
  originalAmount?: number | null
  baseAmount: number
}

export interface DocumentDetail extends DocumentSummary {
  dossierId: string
  status: 0 | 1
  version: number
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
}

export interface DossierDetail {
  id: string
  dossierCode: string
  version: number
  treasuryCode: string
  treasuryName: string
  sendDate: string
  dataSourceCode: DataSourceCode
  dataSourceName: string
  fStatus: DossierStatus
  fStatusName: string
  dossierTypeCode: string
  dossierTypeName: string
  organizationCode: string
  organizationName: string
  projectCode: string
  projectName: string
  projectSpecificCode?: string | null
  projectSpecificName?: string | null
  assignUser?: string
  sla?: string
  completedDate?: string | null
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  documents: DocumentSummary[]
  totalBaseAmount: number
}

export interface AttachmentInfo {
  id: string
  attachmentTypeCode: AttachmentTypeCode
  attachmentTypeName: string
  fileName: string
  fileType: string
  fileSize: number
  fileSizeDisplay: string
  description?: string | null
  createdBy: string
  createdDate: string
}

export interface ApprovalLogEntry {
  id: string
  actionUser: string
  actionUserName: string
  actionRole: ActionRole
  actionDate: string
  reason?: string
  stateCode: DossierStatus
  stateLabel: string
  parentId?: string | null
  digitalSigned: boolean
}

export interface AuditLogEntry {
  id: string
  actionType: AuditActionType
  actionTimestamp: string
  userId: string
  userDisplayName: string
  ipAddress: string
  tableName: string
  recordId: string
  oldValue?: Record<string, unknown> | null
  newValue: Record<string, unknown>
}

// ── EXP CAPEX Dossier — Envelope & composite results ────────────────────────────

export interface SuccessResponse {
  success: boolean
  errorCode?: string
  message?: string
}

export interface ErrorResponse {
  success: boolean
  errorCode?: string
  message?: string
  traceId?: string
}

export interface FieldError {
  field: string
  errorCode: string
  message: string
}

export interface ValidationErrorResponse extends ErrorResponse {
  fieldErrors?: FieldError[]
}

export interface DossierListResult {
  items: DossierSummary[]
  pagination: Pagination
  totalBaseAmount: number
  statusCounts: StatusCount[]
}

export interface DossierMutationResult {
  id: string
  dossierCode: string
  fStatus: DossierStatus
  version: number
}

export interface WorkflowActionResult {
  dossierId: string
  fStatus: DossierStatus
  fStatusName?: string
  assignUser: string
}

export interface DocumentListResult {
  items: DocumentSummary[]
  totalBaseAmount: number
  totalOriginalAmount?: number | null
}

export interface ApprovalLogResult {
  dossierId: string
  currentStatus: DossierStatus
  workflow: ApprovalLogEntry[]
}

export interface AuditLogResult {
  items: AuditLogEntry[]
  pagination: Pagination
}

export interface ExportJobResult {
  jobId: string
  estimatedSeconds: number
  statusUrl: string
}

// ── EXP CAPEX Dossier — LOV item types ──────────────────────────────────────────

export interface ProjectLovItem {
  projectCode: string
  projectName: string
  projectTypeCode: ProjectType
  organizationCode: string
  hasSpecific: boolean
}

// LOV — Đơn vị/Tổ chức (gộp Chủ đầu tư + Ban QLDA). BE trả mảng trần.
export interface OrganizationLovItem {
  organizationCode: string
  organizationName: string
}

export interface ProjectLovParams {
  projectCode?: string
  projectName?: string
  projectType?: ProjectType
  projectManagementCode?: string
  page?: number
  pageSize?: number
  [key: string]: unknown
}

export interface ProjectLovResult {
  items: ProjectLovItem[]
  pagination: Pagination
}

export interface ProjectSpecificLovItem {
  projectSpecificCode: string
  projectSpecificName: string
  projectCode: string
}

export interface TreasuryLovItem {
  treasuryCode: string
  treasuryName: string
}

export interface InvestorLovItem {
  investorCode: string
  investorName: string
}

export interface ProjectManagementLovItem {
  projectManagementCode: string
  projectManagementName: string
}

export interface ProjectManagementLovParams {
  search?: string
  projectCode?: string
  [key: string]: unknown
}

export interface DataSourceItem {
  code: DataSourceCode
  name: string
  isDefault: boolean
}

export interface DocumentTypeItem {
  documentTypeCode: string
  documentTypeName: string
}

export interface AttachmentTypeItem {
  attachmentTypeCode: AttachmentTypeCode
  attachmentTypeName: string
}

// ════════════════════════════════════════════════════════════════════════════
// EXP OPEX Dossier (EXP.OPEX.DOSSIER) — types song song với CAPEX.
// Envelope/enum/field khớp ĐÚNG API-contract.yaml (OPEX). KHÔNG đụng type CAPEX ở trên.
// ════════════════════════════════════════════════════════════════════════════

// ── OPEX — Enums ────────────────────────────────────────────────────────────
export type OpexDossierStatus =
  | 'DRAFT' | 'PENDING_CHECKER' | 'CHECKED' | 'APPROVAL_PENDING'
  | 'APPROVED' | 'APPROVAL_REJECTED' | 'CHECK_REJECTED' | 'CHECK_CANCELLED'
  | 'APPROVAL_CANCELLED' | 'REJECTED_BY_CHECKER' | 'DELETED'

export type OpexActionRole = 'MAKER' | 'CHECKER' | 'APPROVER'
export type OpexDossierType = 'OPEX' | 'CAPEX'
export type OpexDateField = 'CREATED_DATE' | 'RECEIVED_DATE' | 'CHECKED_DATE' | 'APPROVED_DATE'
export type OpexSize = 20 | 50 | 100 | 200

// ── OPEX — Request types (read-only BE-managed KHÔNG đưa vào Request) ─────────
export interface OpexDossierCreateRequest {
  organizationCode: string
  treasuryCode: string
  sendDate: string
  dataSourceCode: string
  dossierTypeCode?: OpexDossierType // cố định OPEX; immutable sau create (VAL-17)
}

export interface OpexDossierDraftRequest {
  organizationCode?: string
  treasuryCode?: string
  dossierTypeCode?: OpexDossierType
  dataSourceCode?: string
  sendDate?: string
}

export interface OpexDossierUpdateRequest {
  version: number // optimistic lock (VAL-15) — bắt buộc
  organizationCode: string
  treasuryCode: string
  sendDate: string
}

export interface DeleteOpexDossierRequest {
  deleteReason: string // ≥ 10 ký tự (VAL-16)
  confirmReviewed: boolean // bắt buộc = true
}

export interface OpexApproveRequest {
  reason?: string
  digitalSign?: DigitalSignInfo
}

export interface OpexRejectRequest {
  reason: string // ≥ 10, ≤ 500
}

export interface OpexDocumentCreateRequest {
  documentTypeCode: string
  treasuryCode: string
  documentDate: string
  accountingDate: string
  originalAmount: number
  baseAmount: number
  currencyCode?: string // VERIFY: chưa có cột trong DDL — có thể không persist
}

export type OpexDocumentUpdateRequest = OpexDocumentCreateRequest

export interface OpexAttachmentUploadRequest {
  attachmentTypeCode: string
  description?: string | null
}

// ── OPEX — Params ────────────────────────────────────────────────────────────
export interface OpexDossierListParams {
  dossierCode?: string
  fromDate?: string
  toDate?: string
  dateField?: OpexDateField
  fStatus?: OpexDossierStatus[]
  dataSourceCode?: string
  createdBy?: string
  checkedBy?: string
  approvedBy?: string
  page?: number // 0-based (contract)
  size?: OpexSize
  sort?: string // 'createdDate,desc'
  [key: string]: unknown
}

export interface ExportOpexParams {
  format: ExportFormat
  dossierCode?: string
  fromDate?: string
  toDate?: string
  fStatus?: OpexDossierStatus[]
  [key: string]: unknown
}

// ── OPEX — Envelope & response data ─────────────────────────────────────────
export interface OpexPagination {
  page: number // 0-based
  size: number
  totalElements: number
  totalPages: number
}

export interface OpexDossierSummary {
  id: string
  treasuryCode: string
  treasuryName: string
  dossierCode: string
  sendDate: string
  dataSourceCode: string
  fStatus: OpexDossierStatus
  createdBy: string
  createdDate: string
  updatedBy?: string
  updatedDate?: string
}

export interface OpexDocumentDetail {
  id: string
  dossierId: string
  treasuryCode: string
  treasuryName: string
  documentTypeCode: string
  documentName: string
  documentNo: string
  documentDate: string
  accountingDate: string
  originalAmount: number
  baseAmount: number
  currencyCode?: string
  status: 0 | 1
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
}

export interface OpexAttachment {
  id: string
  attachmentTypeCode: string
  fileName: string
  fileType: string
  fileSize: number
  description?: string | null
  createdBy: string
  createdDate: string
}

export interface OpexDossierDetail {
  id: string
  treasuryCode: string
  treasuryName: string
  dossierTypeCode: OpexDossierType
  dossierCode: string
  version: number
  sendDate: string
  projectCode?: string | null
  projectName?: string | null
  projectSpecificCode?: string | null
  projectSpecificName?: string | null
  organizationCode: string
  organizationName: string
  status: 0 | 1
  fStatus: OpexDossierStatus
  workflowCode?: string
  dataSourceCode: string
  assignUser?: string
  sla?: string
  hashInfo?: string | null
  completedDate?: string | null
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  documents: OpexDocumentDetail[]
  attachments: OpexAttachment[]
}

export interface OpexDossierListResponse {
  items: OpexDossierSummary[]
  pagination: OpexPagination
  statusCounts: Record<string, number>
}

// Sau adapter service — giữ envelope contract (không ép vào PagedResponse<T>).
export interface OpexDossierListResult {
  items: OpexDossierSummary[]
  pagination: OpexPagination
  statusCounts: Record<string, number>
}

export interface OpexDossierCreateResponse {
  id: string
  dossierCode: string
  fStatus: OpexDossierStatus
  version: number
}

export interface OpexDossierUpdateResponse {
  id: string
  dossierCode: string
  fStatus: OpexDossierStatus
  version: number
}

export interface OpexWorkflowActionResponse {
  id: string
  fStatus: OpexDossierStatus
  fStatusName?: string
  assignUser?: string
}

export interface OpexApprovalLogEntry {
  id: string
  dossierId: string
  dossierCode: string
  actionUser: string
  actionRole: OpexActionRole
  actionDate: string
  reason?: string
  stateCode: string
  parentId?: string | null
  createdBy: string
  createdDate: string
}

export interface OpexAuditLogEntry {
  id: string
  tableName: string
  recordId: string
  actionType: AuditActionType
  oldValue?: string | null
  newValue: string
  userId: string
  actionTimestamp: string
  ipAddress: string
}

export interface ExportJob {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  format: ExportFormat
  downloadUrl?: string | null
  pollUrl: string
}

// ── OPEX — LOV (envelope {items,pagination} — KHÁC flat-array của CAPEX) ──────
export interface LovItem {
  code: string
  name: string
  description?: string | null
}

export interface LovListResponse {
  items: LovItem[]
  pagination?: OpexPagination
}

export interface LovUsersParams {
  search?: string
  activeStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL'
}
