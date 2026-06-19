import { get } from './api'
import type {
  ProjectLovParams,
  ProjectLovItem,
  ProjectSpecificLovItem,
  TreasuryLovItem,
  InvestorLovItem,
  OrganizationLovItem,
  ProjectManagementLovItem,
  ProjectManagementLovParams,
  DataSourceItem,
  DocumentTypeItem,
  AttachmentTypeItem,
  LovItem,
  LovListResponse,
  LovUsersParams,
} from '@/types/index'

// BE trả body TRẦN cho mọi success (không bọc { success, data }). Lỗi mới có envelope.

// LOV.01 — Dự án/Công trình (F4 lookup). BE trả mảng trần ProjectLovItem[].
export const lovProjects = async (params: ProjectLovParams = {}): Promise<ProjectLovItem[]> =>
  get<ProjectLovItem[]>('/lov/projects', { params })

// LOV — Dự án đặc thù theo dự án cha (Military only)
export const lovProjectSpecific = async (projectCode: string): Promise<ProjectSpecificLovItem[]> =>
  get<ProjectSpecificLovItem[]>(`/lov/projects/${projectCode}/specific`)

// LOV.04 — Kho bạc
export const lovTreasuries = async (search?: string): Promise<TreasuryLovItem[]> =>
  get<TreasuryLovItem[]>('/lov/treasuries', { params: { search } })

// LOV — Đơn vị/Tổ chức (gộp Chủ đầu tư + Ban QLDA → organizationCode)
export const lovOrganizations = async (search?: string): Promise<OrganizationLovItem[]> =>
  get<OrganizationLovItem[]>('/lov/organizations', { params: { search } })

// LOV.09 / LOV.13 — Chủ đầu tư (legacy, giữ cho tương thích)
export const lovInvestors = async (search?: string): Promise<InvestorLovItem[]> =>
  get<InvestorLovItem[]>('/lov/investors', { params: { search } })

// LOV.05 — Ban QLDA (ĐVQHNS) (legacy, giữ cho tương thích)
export const lovProjectManagement = async (params: ProjectManagementLovParams = {}): Promise<ProjectManagementLovItem[]> =>
  get<ProjectManagementLovItem[]>('/lov/project-management', { params })

// LOV.03 — Nguồn gốc hồ sơ
export const lovDataSources = async (): Promise<DataSourceItem[]> =>
  get<DataSourceItem[]>('/lov/data-sources')

// LOV — Loại chứng từ
export const lovDocumentTypes = async (): Promise<DocumentTypeItem[]> =>
  get<DocumentTypeItem[]>('/lov/document-types')

// LOV — Loại đính kèm
export const lovAttachmentTypes = async (): Promise<AttachmentTypeItem[]> =>
  get<AttachmentTypeItem[]>('/lov/attachment-types')

// ── OPEX LOV (envelope contract {items,pagination} → unwrap .items → LovItem[]) ──
// Contract OPEX trả LovListResponse; chấp nhận cả 2 shape (mảng trần / {items}) cho an toàn.
const unwrapLov = (res: LovListResponse | LovItem[] | null | undefined): LovItem[] =>
  Array.isArray(res) ? res : (res?.items ?? [])

// LOV — Loại hồ sơ (CAPEX/OPEX) — MỚI cho OPEX
export const lovDossierTypes = async (search?: string): Promise<LovItem[]> =>
  unwrapLov(await get<LovListResponse>('/lov/dossier-types', { params: { search } }))

// LOV.01 — Loại tiền (VND/USD) — MỚI cho OPEX
export const lovCurrencies = async (search?: string): Promise<LovItem[]> =>
  unwrapLov(await get<LovListResponse>('/lov/currencies', { params: { search } }))

// LOV — Người dùng (Maker/Checker/Approver) — MỚI cho OPEX
export const lovUsers = async (params: LovUsersParams = {}): Promise<LovItem[]> =>
  unwrapLov(await get<LovListResponse>('/lov/users', { params }))
