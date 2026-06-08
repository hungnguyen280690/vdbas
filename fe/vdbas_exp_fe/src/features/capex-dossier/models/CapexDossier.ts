export const CapexDossier = {
  DOSSIER_ID:                  'dossierId',
  DOSSIER_CODE:                'dossierCode',
  SEND_DATE:                   'sendDate',
  STATE_CODE:                  'stateCode',
  VERSION:                     'version',
  PROJECT_CODE:                'projectCode',
  PROJECT_NAME:                'projectName',
  PROJECT_TYPE:                'projectType',
  PROJECT_SPECIFIC_CODE:       'projectSpecificCode',
  PROJECT_SPECIFIC_NAME:       'projectSpecificName',
  PROJECT_MANAGEMENT_CODE:     'projectManagementCode',
  PROJECT_MANAGEMENT_NAME:     'projectManagementName',
  DATA_SOURCE_CODE:            'dataSourceCode',
  CREATED_BY:                  'createdBy',
  CREATED_DATE:                'createdDate',
  LAST_UPDATED_BY:             'updatedBy',
  LAST_UPDATED_DATE:           'updatedDate',
  CHECKED_BY:                  'checkedBy',
  CHECKED_DATE:                'checkedDate',
  CHECK_REJECTION_REASON:      'checkRejectionReason',
  APPROVED_BY:                 'approvedBy',
  APPROVED_DATE:               'approvedDate',
  APPROVAL_REJECTION_REASON:   'approvalRejectionReason',
  RETURNING_REASON:            'returningReason',
  TOTAL_VND:                   'totalAmountVnd',
  DOCUMENT_COUNT:              'documentCount',
  DOCUMENTS:                   'documents',
  ATTACHMENTS:                 'attachments',
  APPROVAL_HISTORY:            'approvalHistory',
} as const

export type StateCode =
  | 'DRAFT'
  | 'PENDING_CHECK'
  | 'CHECK_REJECTED'
  | 'CHECK_CANCELLED'
  | 'PENDING_APPROVE'
  | 'APPROVE_REJECTED'
  | 'APPROVE_CANCELLED'
  | 'APPROVED'
  | 'DELETED'

export const STATE_LABELS: Record<StateCode, string> = {
  DRAFT:             'Đang hoàn thiện',
  PENDING_CHECK:     'Chờ kiểm soát',
  CHECK_REJECTED:    'Từ chối kiểm soát',
  CHECK_CANCELLED:   'Hủy kiểm soát',
  PENDING_APPROVE:   'Chờ phê duyệt',
  APPROVE_REJECTED:  'Từ chối phê duyệt',
  APPROVE_CANCELLED: 'Hủy phê duyệt',
  APPROVED:          'Đã phê duyệt',
  DELETED:           'Đã xóa',
}

export const STATE_TAG_COLOR: Record<StateCode, string> = {
  DRAFT:             'default',
  PENDING_CHECK:     'blue',
  CHECK_REJECTED:    'red',
  CHECK_CANCELLED:   'orange',
  PENDING_APPROVE:   'cyan',
  APPROVE_REJECTED:  'red',
  APPROVE_CANCELLED: 'orange',
  APPROVED:          'green',
  DELETED:           'volcano',
}
