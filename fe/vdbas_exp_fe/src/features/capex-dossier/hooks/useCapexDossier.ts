import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  searchCapexDossiers,
  getCapexDossier,
  createCapexDossier,
  updateCapexDossier,
  deleteCapexDossier,
  submitCapexDossier,
  workflowAction,
  searchProjects,
} from '../services/capexDossierApi'

const QK = 'capex-dossiers'

export const useCapexDossier = {
  useList: (params = {}) =>
    useQuery({
      queryKey:  [QK, 'list', params],
      queryFn:   () => searchCapexDossiers(params),
      staleTime: 30 * 1000,
    }),

  useDetail: (dossierId: string) =>
    useQuery({
      queryKey:  [QK, 'detail', dossierId],
      queryFn:   () => getCapexDossier(dossierId),
      enabled:   !!dossierId,
      staleTime: 30 * 1000,
    }),

  useProjects: (params: Record<string, any> = {}) =>
    useQuery({
      queryKey:  [QK, 'projects', params],
      queryFn:   () => searchProjects(params),
      staleTime: 5 * 60 * 1000,
    }),

  useCreate: (options: any = {}) => {
    const qc = useQueryClient()
    return useMutation({
      ...options,
      mutationFn: (data: any) => createCapexDossier(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: [QK] })
        if (!options.skipNotification) message.success('Tạo hồ sơ thành công')
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
    })
  },

  useUpdate: (options: any = {}) => {
    const qc = useQueryClient()
    return useMutation({
      ...options,
      mutationFn: (variables: any) => updateCapexDossier(variables.dossierId, variables),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: [QK] })
        if (!options.skipNotification) message.success('Cập nhật hồ sơ thành công')
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
    })
  },

  useDelete: (options: any = {}) => {
    const qc = useQueryClient()
    return useMutation({
      ...options,
      mutationFn: ({
        dossierId,
        deleteReason,
        confirmReviewed,
      }: {
        dossierId: string
        deleteReason: string
        confirmReviewed: boolean
      }) => deleteCapexDossier(dossierId, { deleteReason, confirmReviewed }),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: [QK] })
        if (!options.skipNotification) message.success('Xóa hồ sơ thành công')
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
    })
  },

  useSubmit: (options: any = {}) => {
    const qc = useQueryClient()
    return useMutation({
      ...options,
      mutationFn: (dossierId: string) => submitCapexDossier(dossierId),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: [QK] })
        if (!options.skipNotification) message.success('Đã gửi hồ sơ để kiểm soát')
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
    })
  },

  useWorkflowAction: (options: any = {}) => {
    const qc = useQueryClient()
    return useMutation({
      ...options,
      mutationFn: ({
        dossierId,
        action,
        reason,
      }: {
        dossierId: string
        action: 'CHECK' | 'APPROVE' | 'REJECT' | 'RETURN'
        reason?: string
      }) => workflowAction(dossierId, action, reason),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: [QK] })
        if (options.onSuccess) options.onSuccess(data, variables, context)
      },
    })
  },
}
