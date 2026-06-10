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
