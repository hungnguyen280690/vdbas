import { get, post, put, del } from './api'
import type {
  DossierSearchParams,
  DossierSummary,
  DossierHeader,
  DossierDetail,
  DossierCreateRequest,
  DossierUpdateRequest,
  DossierDeleteRequest,
  DocumentDetail,
  AttachmentInfo,
  WorkflowActionRequest,
  ProjectInfo,
  ProjectSearchParams,
  UserInfo,
  UserSearchParams,
  PagedResponse,
} from '../types'

const BASE = '/capex-dossier'

export const searchDossiers = (params: DossierSearchParams = {}) =>
  get<PagedResponse<DossierSummary>>(BASE, { params })

export const getDossier = (id: string) =>
  get<DossierDetail>(`${BASE}/${id}`)

export const createDossier = (data: DossierCreateRequest) =>
  post<DossierHeader>(BASE, data)

export const updateDossier = (id: string, data: DossierUpdateRequest) =>
  put<DossierHeader>(`${BASE}/${id}`, data)

export const deleteDossier = (id: string, data: DossierDeleteRequest) =>
  del<void>(`${BASE}/${id}`, { data })

export const submitDossier = (id: string) =>
  post<void>(`${BASE}/${id}/submit`)

export const workflowAction = (id: string, data: WorkflowActionRequest) =>
  post<void>(`${BASE}/${id}/workflow`, data)

export const getDossierDocuments = (id: string) =>
  get<DocumentDetail[]>(`${BASE}/${id}/documents`)

export const getDossierAttachments = (id: string) =>
  get<AttachmentInfo[]>(`${BASE}/${id}/attachments`)

export const uploadAttachment = (id: string, formData: FormData) =>
  post<AttachmentInfo>(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteAttachment = (id: string, attachmentId: string) =>
  del<void>(`${BASE}/${id}/attachments/${attachmentId}`)

export const exportDossiers = (
  params: DossierSearchParams & { format: 'xlsx' | 'pdf' | 'csv' },
) => get<Blob>(`${BASE}/export`, { params, responseType: 'blob' })

export const searchProjects = (params: ProjectSearchParams = {}) =>
  get<ProjectInfo[]>('/master-data/projects', { params })

export const searchUsers = (params: UserSearchParams = {}) =>
  get<UserInfo[]>('/master-data/users', { params })
