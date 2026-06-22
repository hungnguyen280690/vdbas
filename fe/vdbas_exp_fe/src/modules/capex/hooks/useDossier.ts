import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import i18n from '@/i18n'
import {
  listDossiers, getDossier, createDossier, saveDossierDraft, updateDossier, deleteDossier,
  submitDossier, approveDossier, rejectDossier, copyDossier,
  listDossierDocuments, addDocument, updateDocument, removeDocument,
  listAttachments, uploadAttachment, deleteAttachment,
  getApprovalLog, getAuditLog,
} from '../services/dossierService'
import type {
  DossierListParams, DossierListResult, DossierDetail,
  DossierCreateRequest, DossierDraftRequest, DossierUpdateRequest, DeleteDossierRequest,
  SubmitDossierRequest, ApproveRequest, RejectRequest,
  DossierMutationResult, WorkflowActionResult, SuccessResponse,
  AddDocumentRequest, UpdateDocumentRequest, DocumentListResult, DocumentDetail,
  AttachmentInfo, ApprovalLogResult, AuditLogResult,
  MutationHookOptions,
} from '@/types/index'

const KEY = 'dossiers'

// ── Mutation variable shapes ───────────────────────────────────────────────────
type CreateVars  = { data: DossierCreateRequest; idemKey?: string }
type DraftVars   = { data: DossierDraftRequest; idemKey?: string }
type UpdateVars  = { id: string; data: DossierUpdateRequest }
type DeleteVars  = { id: string; body: DeleteDossierRequest }
type SubmitVars  = { id: string; body: SubmitDossierRequest; idemKey?: string }
type ApproveVars = { id: string; body: ApproveRequest; idemKey?: string }
type RejectVars  = { id: string; body: RejectRequest; idemKey?: string }
type CopyVars    = { id: string; idemKey?: string }
type AddDocVars  = { id: string; data: AddDocumentRequest; idemKey?: string }
type UpdDocVars  = { id: string; docId: string; data: UpdateDocumentRequest }
type RmDocVars   = { id: string; docId: string }
type UploadVars  = { id: string; formData: FormData; idemKey?: string }
type RmAttVars   = { id: string; attId: string }

export const DossierHooks = {
  useList: (params: DossierListParams = {}, enabled = true) =>
    useQuery<DossierListResult>({
      queryKey: [KEY, 'list', params],
      queryFn:  () => listDossiers(params),
      enabled,
      staleTime: 30 * 1000,
    }),

  useDetail: (id: string | undefined) =>
    useQuery<DossierDetail>({
      queryKey: [KEY, 'detail', id],
      queryFn:  () => getDossier(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useCreate: (options: MutationHookOptions<DossierMutationResult, CreateVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DossierMutationResult, Error, CreateVars>({
      mutationFn: ({ data, idemKey }) => createDossier(data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        cb?.(d, v, c)
      },
    })
  },

  useSaveDraft: (options: MutationHookOptions<DossierMutationResult, DraftVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DossierMutationResult, Error, DraftVars>({
      mutationFn: ({ data, idemKey }) => saveDossierDraft(data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('dossier.save_draft_success'))
        cb?.(d, v, c)
      },
    })
  },

  useUpdate: (options: MutationHookOptions<DossierMutationResult, UpdateVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DossierMutationResult, Error, UpdateVars>({
      mutationFn: ({ id, data }) => updateDossier(id, data),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('common.update_success'))
        cb?.(d, v, c)
      },
    })
  },

  useDelete: (options: MutationHookOptions<SuccessResponse, DeleteVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<SuccessResponse, Error, DeleteVars>({
      mutationFn: ({ id, body }) => deleteDossier(id, body),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        cb?.(d, v, c)
      },
    })
  },

  useSubmit: (options: MutationHookOptions<WorkflowActionResult, SubmitVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<WorkflowActionResult, Error, SubmitVars>({
      mutationFn: ({ id, body, idemKey }) => submitDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('dossier.submit_success'))
        cb?.(d, v, c)
      },
    })
  },

  useApprove: (options: MutationHookOptions<WorkflowActionResult, ApproveVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<WorkflowActionResult, Error, ApproveVars>({
      mutationFn: ({ id, body, idemKey }) => approveDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('dossier.approve_success'))
        cb?.(d, v, c)
      },
    })
  },

  useReject: (options: MutationHookOptions<WorkflowActionResult, RejectVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<WorkflowActionResult, Error, RejectVars>({
      mutationFn: ({ id, body, idemKey }) => rejectDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('dossier.reject_success'))
        cb?.(d, v, c)
      },
    })
  },

  useCopy: (options: MutationHookOptions<DossierMutationResult, CopyVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DossierMutationResult, Error, CopyVars>({
      mutationFn: ({ id, idemKey }) => copyDossier(id, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Documents ────────────────────────────────────────────────────────────────
  useDocuments: (id: string | undefined) =>
    useQuery<DocumentListResult>({
      queryKey: [KEY, 'documents', id],
      queryFn:  () => listDossierDocuments(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useAddDocument: (options: MutationHookOptions<DocumentDetail, AddDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DocumentDetail, Error, AddDocVars>({
      mutationFn: ({ id, data, idemKey }) => addDocument(id, data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, 'documents', v.id] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        cb?.(d, v, c)
      },
    })
  },

  useUpdateDocument: (options: MutationHookOptions<DocumentDetail, UpdDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<DocumentDetail, Error, UpdDocVars>({
      mutationFn: ({ id, docId, data }) => updateDocument(id, docId, data),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, 'documents', v.id] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('common.update_success'))
        cb?.(d, v, c)
      },
    })
  },

  useRemoveDocument: (options: MutationHookOptions<SuccessResponse, RmDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<SuccessResponse, Error, RmDocVars>({
      mutationFn: ({ id, docId }) => removeDocument(id, docId),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, 'documents', v.id] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Attachments ──────────────────────────────────────────────────────────────
  useAttachments: (id: string | undefined) =>
    useQuery<AttachmentInfo[]>({
      queryKey: [KEY, 'attachments', id],
      queryFn:  () => listAttachments(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useUploadAttachment: (options: MutationHookOptions<AttachmentInfo, UploadVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<AttachmentInfo, Error, UploadVars>({
      mutationFn: ({ id, formData, idemKey }) => uploadAttachment(id, formData, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, 'attachments', v.id] })
        if (!skipNotification) message.success(i18n.t('dossier.upload_success'))
        cb?.(d, v, c)
      },
    })
  },

  useDeleteAttachment: (options: MutationHookOptions<SuccessResponse, RmAttVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<SuccessResponse, Error, RmAttVars>({
      mutationFn: ({ id, attId }) => deleteAttachment(id, attId),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, 'attachments', v.id] })
        if (!skipNotification) message.success(i18n.t('common.delete_success'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Audit ────────────────────────────────────────────────────────────────────
  useApprovalLog: (id: string | undefined) =>
    useQuery<ApprovalLogResult>({
      queryKey: [KEY, 'approval-log', id],
      queryFn:  () => getApprovalLog(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useAuditLog: (id: string | undefined, params: { page?: number; pageSize?: number } = {}) =>
    useQuery<AuditLogResult>({
      queryKey: [KEY, 'audit-log', id, params],
      queryFn:  () => getAuditLog(id!, params),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),
}
