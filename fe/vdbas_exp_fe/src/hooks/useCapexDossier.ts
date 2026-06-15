import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import i18n from '../i18n'
import * as svc from '../services/capexDossierService'
import type {
  MutationHookOptions,
  PagedResponse,
  DossierSearchParams,
  DossierSummary,
  DossierHeader,
  DossierDetail,
  DossierCreateRequest,
  DossierUpdateRequest,
  DossierDeleteRequest,
  WorkflowActionRequest,
  AttachmentInfo,
  ProjectInfo,
  ProjectSearchParams,
  UserInfo,
  UserSearchParams,
} from '../types'

export const CapexDossierHooks = {
  useList: (params: DossierSearchParams = {}) =>
    useQuery<PagedResponse<DossierSummary>>({
      queryKey: ['capex-dossier', 'list', params],
      queryFn: () => svc.searchDossiers(params),
      staleTime: 30_000,
    }),

  useDetail: (id: string) =>
    useQuery<DossierDetail>({
      queryKey: ['capex-dossier', 'detail', id],
      queryFn: () => svc.getDossier(id),
      enabled: !!id,
      staleTime: 30_000,
    }),

  useCreate: (options: MutationHookOptions<DossierHeader, DossierCreateRequest> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<DossierHeader, Error, DossierCreateRequest>({
      mutationFn: (data) => svc.createDossier(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier'] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useUpdate: (id: string, options: MutationHookOptions<DossierHeader, DossierUpdateRequest> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<DossierHeader, Error, DossierUpdateRequest>({
      mutationFn: (data) => svc.updateDossier(id, data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier'] })
        if (!skipNotification) message.success(i18n.t('common.update_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useDelete: (options: MutationHookOptions<void, { id: string; data: DossierDeleteRequest }> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<void, Error, { id: string; data: DossierDeleteRequest }>({
      mutationFn: ({ id, data }) => svc.deleteDossier(id, data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier'] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useSubmit: (options: MutationHookOptions<void, string> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<void, Error, string>({
      mutationFn: (id) => svc.submitDossier(id),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier'] })
        if (!skipNotification) message.success(i18n.t('common.submit_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useWorkflowAction: (
    id: string,
    options: MutationHookOptions<void, WorkflowActionRequest> = {},
  ) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<void, Error, WorkflowActionRequest>({
      mutationFn: (data) => svc.workflowAction(id, data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier'] })
        if (!skipNotification) message.success(i18n.t('common.action_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useAttachments: (id: string) =>
    useQuery<AttachmentInfo[]>({
      queryKey: ['capex-dossier', 'attachments', id],
      queryFn: () => svc.getDossierAttachments(id),
      enabled: !!id,
      staleTime: 30_000,
    }),

  useUploadAttachment: (
    id: string,
    options: MutationHookOptions<AttachmentInfo, FormData> = {},
  ) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<AttachmentInfo, Error, FormData>({
      mutationFn: (formData) => svc.uploadAttachment(id, formData),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier', 'attachments', id] })
        if (!skipNotification) message.success(i18n.t('common.upload_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useDeleteAttachment: (id: string, options: MutationHookOptions<void, string> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<void, Error, string>({
      mutationFn: (attachmentId) => svc.deleteAttachment(id, attachmentId),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['capex-dossier', 'attachments', id] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },
}

export const MasterDataHooks = {
  useProjects: (params: ProjectSearchParams = {}) =>
    useQuery<ProjectInfo[]>({
      queryKey: ['master-data', 'projects', params],
      queryFn: () => svc.searchProjects(params),
      staleTime: 5 * 60_000,
    }),

  useUsers: (params: UserSearchParams = {}) =>
    useQuery<UserInfo[]>({
      queryKey: ['master-data', 'users', params],
      queryFn: () => svc.searchUsers(params),
      staleTime: 5 * 60_000,
    }),
}
