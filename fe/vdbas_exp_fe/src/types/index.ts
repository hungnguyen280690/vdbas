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

// ── CAPEX Dossier ─────────────────────────────────────────────────────────────

export type DossierStatus =
  | 'DRAFT'
  | 'PENDING_CHECK'
  | 'CHECK_REJECTED'
  | 'CHECK_CANCELLED'
  | 'PENDING_APPROVE'
  | 'APPROVE_REJECTED'
  | 'APPROVE_CANCELLED'
  | 'APPROVED'
  | 'DELETED'

export type DataSourceCode = 'Thủ công' | 'DVC' | 'Chuyển đổi'

export type DateType = 'SEND_DATE' | 'CREATED_DATE' | 'CHECKED_DATE' | 'APPROVED_DATE'

export type WorkflowAction = 'CHECK' | 'APPROVE' | 'REJECT' | 'RETURN'

export interface DossierSearchParams {
  dossierCode?: string
  projectCode?: string
  stateCode?: string
  dataSourceCode?: DataSourceCode
  createdBy?: string
  checkedBy?: string
  approvedBy?: string
  dateType?: DateType
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
  sortField?: string
  sortDir?: 'asc' | 'desc'
}

export interface DossierHeader {
  dossierId: string
  dossierCode: string
  sendDate: string
  stateCode: DossierStatus
  projectCode: string
  projectName: string
  projectSpecificCode?: string | null
  projectSpecificName?: string | null
  projectManagementCode: string
  projectManagementName: string
  dataSourceCode: DataSourceCode
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  checkedBy?: string | null
  checkedDate?: string | null
  approvedBy?: string | null
  approvedDate?: string | null
  checkRejectionReason?: string | null
  approvalRejectionReason?: string | null
  returningReason?: string | null
  version: number
}

export interface DossierSummary {
  dossierId: string
  dossierCode: string
  sendDate: string
  stateCode: string
  projectCode: string
  projectName: string
  dataSourceCode: string
  createdBy: string
  createdDate: string
  checkedBy?: string | null
  checkedDate?: string | null
  approvedBy?: string | null
  approvedDate?: string | null
  checkRejectionReason?: string | null
  approvalRejectionReason?: string | null
  returningReason?: string | null
  totalAmountVnd: number
  documentCount: number
}

export interface DossierCreateRequest {
  sendDate: string
  projectCode: string
  projectSpecificCode?: string | null
  projectManagementCode: string
  dataSourceCode?: DataSourceCode
}

export interface DossierUpdateRequest {
  sendDate?: string
  projectCode?: string
  projectSpecificCode?: string
  projectManagementCode?: string
  version: number
}

export interface DossierDeleteRequest {
  deleteReason: string
  confirmReviewed: boolean
}

export interface WorkflowActionRequest {
  action: WorkflowAction
  reason?: string
}

export interface GlSegments {
  segment2?: string
  segment4?: string
  segment5?: string
  segment8?: string
  segment9?: string
  segment10?: string
  segment12?: string
  segment13?: string
}

export interface DocumentLine {
  documentLineId: string
  capitalYear: number
  extended?: 1 | 2 | null
  investmentSourceCode: string
  allocationCriteriaCode: string
  paymentRequestAmount?: number | null
  paymentRequestAmountVnd?: number | null
  approvedAmount?: number | null
  approvedAmountVnd?: number | null
  advanceDeductionAmount?: number | null
  advanceDeductionAmountVnd?: number | null
  warrantyAmount?: number | null
  warrantyAmountVnd?: number | null
  pendingSettlementAmount?: number | null
  pendingSettlementAmountVnd?: number | null
  valueAddedTaxAmount?: number | null
  transferBeneficiaryAmount?: number | null
  transferBeneficiaryAmountVn?: number | null
  beneficiaryName?: string | null
  beneficiaryAccount?: string | null
  beneficiaryBankName?: string | null
  beneficiaryBankCode: string
  glSegments?: GlSegments
}

export interface DocumentDetail {
  documentId: string
  documentNumber: string
  documentDate: string
  accountingDate: string
  documentTemplateId: number
  documentTypeCode: string
  fiscalYear: number
  paymentRequestNo?: string | null
  paymentRequestDate?: string | null
  treasuryCode: string
  payingTreasuryCode?: string | null
  paymentTypeCode: string
  capitalPlanTypeCode: string
  currencyTypeCode: string
  exchangeRateTypeCode: string
  exchangeRateDate?: string | null
  exchangeRate?: number | null
  projectItemCode: string
  projectItemName?: string | null
  domesticAccount?: string | null
  domesticBank?: string | null
  foreignAccount?: string | null
  foreignBank?: string | null
  guaranteeId: number
  guaranteeNo?: string | null
  guaranteeAmount?: number | null
  guaranteeRemainAmount?: number | null
  guaranteeExpiryDate?: string | null
  guaranteeRevokedDate?: string | null
  completedWorkloadNo?: number | null
  completedWorkloadDate?: string | null
  cumulativeWorkloadPayment?: number | null
  cumulativePaidCapital?: number | null
  advancePaymentAmount?: number | null
  lines: DocumentLine[]
}

export interface AttachmentInfo {
  archiveId: string
  fileName: string
  archiveType: string
  description?: string | null
  archiveDate?: string | null
  createdBy: string
  createdDate: string
  updatedBy?: string | null
  updatedDate?: string | null
}

export interface ApprovalLogEntry {
  logId: string
  actionUser: string
  actionDate: string
  actionRole: string
  stateCode: string
  reason: string
}

export interface DossierDetail extends DossierHeader {
  documents: DocumentDetail[]
  attachments: AttachmentInfo[]
  approvalHistory: ApprovalLogEntry[]
}

// ── Master Data ───────────────────────────────────────────────────────────────

export interface ProjectInfo {
  projectCode: string
  projectName: string
  projectTypeCode: 'Military' | 'Citizen'
  projectSpecificCode?: string | null
  projectSpecificName?: string | null
  projectManagementCode: string
  projectManagementName: string
}

export interface UserInfo {
  username: string
  fullname: string
  role: 'Maker' | 'Checker' | 'Approver'
  unit: string
}

export interface ProjectSearchParams {
  code?: string
  name?: string
  projectTypeCode?: 'Military' | 'Citizen'
  projectManagementCode?: string
}

export interface UserSearchParams {
  keyword?: string
  role?: 'Maker' | 'Checker' | 'Approver'
}
