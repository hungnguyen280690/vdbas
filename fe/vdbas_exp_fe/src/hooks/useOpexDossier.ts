import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import i18n from '../i18n'
import {
  listOpexDossiers, getOpexDossier, createOpexDossier, saveOpexDraft, updateOpexDossier, deleteOpexDossier,
  copyOpexDossier, submitOpexDossier, checkOpexDossier, rejectByChecker, returnByChecker,
  approveOpexDossier, rejectByApprover, cancelApproval,
  listOpexDocuments, addOpexDocument, getOpexDocument, updateOpexDocument, deleteOpexDocument,
  listDossierAttachments, uploadDossierAttachment, deleteDossierAttachment,
  listDocumentAttachments, uploadDocumentAttachment, deleteDocumentAttachment,
  getOpexApprovalLog, getOpexAuditLog,
} from '../services/opexDossierService'
import type {
  OpexDossierListParams, OpexDossierListResult, OpexDossierDetail,
  OpexDossierCreateRequest, OpexDossierDraftRequest, OpexDossierUpdateRequest, DeleteOpexDossierRequest,
  OpexApproveRequest, OpexRejectRequest,
  OpexDossierCreateResponse, OpexDossierUpdateResponse, OpexWorkflowActionResponse,
  OpexDocumentDetail, OpexDocumentCreateRequest, OpexDocumentUpdateRequest,
  OpexAttachment, OpexApprovalLogEntry, OpexAuditLogEntry,
  MutationHookOptions,
} from '@/types/index'

const KEY = 'opexDossiers'

// ── Mutation variable shapes ───────────────────────────────────────────────────
type CreateVars       = { data: OpexDossierCreateRequest; idemKey?: string }
type DraftVars        = { data: OpexDossierDraftRequest; idemKey?: string }
type UpdateVars       = { id: string; data: OpexDossierUpdateRequest; idemKey?: string }
type DeleteVars       = { id: string; body: DeleteOpexDossierRequest; idemKey?: string }
type CopyVars         = { id: string; idemKey?: string }
type SubmitVars       = { id: string; idemKey?: string }
type CheckVars        = { id: string; body?: OpexApproveRequest; idemKey?: string }
type ApproveVars      = { id: string; body?: OpexApproveRequest; idemKey?: string }
type RejectVars       = { id: string; body: OpexRejectRequest; idemKey?: string }
type AddDocVars       = { id: string; data: OpexDocumentCreateRequest; idemKey?: string }
type UpdDocVars       = { id: string; docId: string; data: OpexDocumentUpdateRequest; idemKey?: string }
type RmDocVars        = { id: string; docId: string; idemKey?: string }
type UploadAttVars    = { id: string; formData: FormData; idemKey?: string }
type RmAttVars        = { id: string; attId: string; idemKey?: string }
type UploadDocAttVars = { id: string; docId: string; formData: FormData; idemKey?: string }
type RmDocAttVars     = { id: string; docId: string; attId: string; idemKey?: string }

const invalidateLD = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: [KEY] })
  qc.invalidateQueries({ queryKey: [KEY, 'detail', id] })
}

export const OpexDossierHooks = {
  // ── Queries ──────────────────────────────────────────────────────────────────
  useList: (params: OpexDossierListParams = {}, enabled = true) =>
    useQuery<OpexDossierListResult>({
      queryKey: [KEY, 'list', params],
      queryFn:  () => listOpexDossiers(params),
      enabled,
      staleTime: 30 * 1000,
    }),

  useDetail: (id: string | undefined) =>
    useQuery<OpexDossierDetail>({
      queryKey: [KEY, 'detail', id],
      queryFn:  () => getOpexDossier(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  // ── CRUD mutations ─────────────────────────────────────────────────────────────
  useCreate: (options: MutationHookOptions<OpexDossierCreateResponse, CreateVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDossierCreateResponse, Error, CreateVars>({
      mutationFn: ({ data, idemKey }) => createOpexDossier(data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useSaveDraft: (options: MutationHookOptions<OpexDossierCreateResponse, DraftVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDossierCreateResponse, Error, DraftVars>({
      mutationFn: ({ data, idemKey }) => saveOpexDraft(data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useUpdate: (options: MutationHookOptions<OpexDossierUpdateResponse, UpdateVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDossierUpdateResponse, Error, UpdateVars>({
      mutationFn: ({ id, data, idemKey }) => updateOpexDossier(id, data, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useDelete: (options: MutationHookOptions<OpexWorkflowActionResponse, DeleteVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, DeleteVars>({
      mutationFn: ({ id, body, idemKey }) => deleteOpexDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.delete'))
        cb?.(d, v, c)
      },
    })
  },

  useCopy: (options: MutationHookOptions<OpexDossierCreateResponse, CopyVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDossierCreateResponse, Error, CopyVars>({
      mutationFn: ({ id, idemKey }) => copyOpexDossier(id, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Workflow mutations ───────────────────────────────────────────────────────
  useSubmit: (options: MutationHookOptions<OpexWorkflowActionResponse, SubmitVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, SubmitVars>({
      mutationFn: ({ id, idemKey }) => submitOpexDossier(id, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.submit'))
        cb?.(d, v, c)
      },
    })
  },

  useCheck: (options: MutationHookOptions<OpexWorkflowActionResponse, CheckVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, CheckVars>({
      mutationFn: ({ id, body, idemKey }) => checkOpexDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.check'))
        cb?.(d, v, c)
      },
    })
  },

  useRejectByChecker: (options: MutationHookOptions<OpexWorkflowActionResponse, RejectVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, RejectVars>({
      mutationFn: ({ id, body, idemKey }) => rejectByChecker(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.info.checkReject'))
        cb?.(d, v, c)
      },
    })
  },

  useReturnByChecker: (options: MutationHookOptions<OpexWorkflowActionResponse, RejectVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, RejectVars>({
      mutationFn: ({ id, body, idemKey }) => returnByChecker(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.return'))
        cb?.(d, v, c)
      },
    })
  },

  useApprove: (options: MutationHookOptions<OpexWorkflowActionResponse, ApproveVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, ApproveVars>({
      mutationFn: ({ id, body, idemKey }) => approveOpexDossier(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.approve'))
        cb?.(d, v, c)
      },
    })
  },

  useRejectByApprover: (options: MutationHookOptions<OpexWorkflowActionResponse, RejectVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, RejectVars>({
      mutationFn: ({ id, body, idemKey }) => rejectByApprover(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.info.approvalReject'))
        cb?.(d, v, c)
      },
    })
  },

  useCancelApproval: (options: MutationHookOptions<OpexWorkflowActionResponse, RejectVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexWorkflowActionResponse, Error, RejectVars>({
      mutationFn: ({ id, body, idemKey }) => cancelApproval(id, body, idemKey),
      onSuccess: (d, v, c) => {
        invalidateLD(qc, v.id)
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.cancel'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Documents ──────────────────────────────────────────────────────────────────
  useDocuments: (id: string | undefined) =>
    useQuery<OpexDocumentDetail[]>({
      queryKey: [KEY, id, 'documents'],
      queryFn:  () => listOpexDocuments(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useDocument: (id: string | undefined, docId: string | undefined) =>
    useQuery<OpexDocumentDetail>({
      queryKey: [KEY, id, 'documents', docId],
      queryFn:  () => getOpexDocument(id!, docId!),
      enabled:  !!id && !!docId,
      staleTime: 30 * 1000,
    }),

  useAddDocument: (options: MutationHookOptions<OpexDocumentDetail, AddDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDocumentDetail, Error, AddDocVars>({
      mutationFn: ({ id, data, idemKey }) => addOpexDocument(id, data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'documents'] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useUpdateDocument: (options: MutationHookOptions<OpexDocumentDetail, UpdDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexDocumentDetail, Error, UpdDocVars>({
      mutationFn: ({ id, docId, data, idemKey }) => updateOpexDocument(id, docId, data, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'documents'] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useDeleteDocument: (options: MutationHookOptions<void, RmDocVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<void, Error, RmDocVars>({
      mutationFn: ({ id, docId, idemKey }) => deleteOpexDocument(id, docId, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'documents'] })
        qc.invalidateQueries({ queryKey: [KEY, 'detail', v.id] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.delete'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Attachments — dossier level ──────────────────────────────────────────────
  useDossierAttachments: (id: string | undefined) =>
    useQuery<OpexAttachment[]>({
      queryKey: [KEY, id, 'attachments'],
      queryFn:  () => listDossierAttachments(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useUploadDossierAttachment: (options: MutationHookOptions<OpexAttachment, UploadAttVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexAttachment, Error, UploadAttVars>({
      mutationFn: ({ id, formData, idemKey }) => uploadDossierAttachment(id, formData, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'attachments'] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useDeleteDossierAttachment: (options: MutationHookOptions<void, RmAttVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<void, Error, RmAttVars>({
      mutationFn: ({ id, attId, idemKey }) => deleteDossierAttachment(id, attId, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'attachments'] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.delete'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Attachments — document level ─────────────────────────────────────────────
  useDocumentAttachments: (id: string | undefined, docId: string | undefined) =>
    useQuery<OpexAttachment[]>({
      queryKey: [KEY, id, 'documents', docId, 'attachments'],
      queryFn:  () => listDocumentAttachments(id!, docId!),
      enabled:  !!id && !!docId,
      staleTime: 30 * 1000,
    }),

  useUploadDocumentAttachment: (options: MutationHookOptions<OpexAttachment, UploadDocAttVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<OpexAttachment, Error, UploadDocAttVars>({
      mutationFn: ({ id, docId, formData, idemKey }) => uploadDocumentAttachment(id, docId, formData, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'documents', v.docId, 'attachments'] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.save'))
        cb?.(d, v, c)
      },
    })
  },

  useDeleteDocumentAttachment: (options: MutationHookOptions<void, RmDocAttVars> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: cb } = options
    return useMutation<void, Error, RmDocAttVars>({
      mutationFn: ({ id, docId, attId, idemKey }) => deleteDocumentAttachment(id, docId, attId, idemKey),
      onSuccess: (d, v, c) => {
        qc.invalidateQueries({ queryKey: [KEY, v.id, 'documents', v.docId, 'attachments'] })
        if (!skipNotification) message.success(i18n.t('opexDossier.ok.delete'))
        cb?.(d, v, c)
      },
    })
  },

  // ── Audit ────────────────────────────────────────────────────────────────────
  useApprovalLog: (id: string | undefined) =>
    useQuery<OpexApprovalLogEntry[]>({
      queryKey: [KEY, id, 'approval-log'],
      queryFn:  () => getOpexApprovalLog(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),

  useAuditLog: (id: string | undefined) =>
    useQuery<OpexAuditLogEntry[]>({
      queryKey: [KEY, id, 'audit-log'],
      queryFn:  () => getOpexAuditLog(id!),
      enabled:  !!id,
      staleTime: 30 * 1000,
    }),
}
