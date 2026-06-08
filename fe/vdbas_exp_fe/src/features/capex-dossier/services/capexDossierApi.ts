import { get, post, put, del } from '@/shared/api/api'

export const searchCapexDossiers = (params: Record<string, any> = {}) =>
  get('/capex-dossier', { params })

export const getCapexDossier = (dossierId: string) =>
  get(`/capex-dossier/${dossierId}`)

export const createCapexDossier = (data: any) =>
  post('/capex-dossier', data)

export const updateCapexDossier = (dossierId: string, data: any) =>
  put(`/capex-dossier/${dossierId}`, data)

export const deleteCapexDossier = (
  dossierId: string,
  payload: { deleteReason: string; confirmReviewed: boolean },
) => del(`/capex-dossier/${dossierId}`, { data: payload })

export const submitCapexDossier = (dossierId: string) =>
  post(`/capex-dossier/${dossierId}/submit`, {})

export const workflowAction = (
  dossierId: string,
  action: 'CHECK' | 'APPROVE' | 'REJECT' | 'RETURN',
  reason?: string,
) => post(`/capex-dossier/${dossierId}/workflow`, { action, reason })

export const searchProjects = (params: Record<string, any> = {}) =>
  get('/master-data/projects', { params })
