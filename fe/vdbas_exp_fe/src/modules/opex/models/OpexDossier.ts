/**
 * OpexDossier — field-name constants for the EXP OPEX Dossier entity.
 * Values MUST match the JSON field names in API-contract.yaml (camelCase),
 * NOT the legacy UPPER_SNAKE names used by the prototype UI (BUDGET_UNIT_*, F_STATUS…).
 * Song song với models/Dossier.ts (CAPEX) — KHÔNG đụng file đó.
 */
export class OpexDossier {
  static ID                  = 'id'
  static DOSSIER_CODE        = 'dossierCode'
  static DOSSIER_TYPE_CODE   = 'dossierTypeCode'
  static VERSION             = 'version'
  static ORGANIZATION_CODE   = 'organizationCode'
  static ORGANIZATION_NAME   = 'organizationName'
  static TREASURY_CODE       = 'treasuryCode'
  static TREASURY_NAME       = 'treasuryName'
  static SEND_DATE           = 'sendDate'
  static DATA_SOURCE_CODE    = 'dataSourceCode'
  static F_STATUS            = 'fStatus'
  static F_STATUS_NAME       = 'fStatusName'
  static STATUS              = 'status'
  static WORKFLOW_CODE       = 'workflowCode'
  static ASSIGN_USER         = 'assignUser'
  static SLA                 = 'sla'
  static HASH_INFO           = 'hashInfo'
  static COMPLETED_DATE      = 'completedDate'
  static CREATED_BY          = 'createdBy'
  static CREATED_DATE        = 'createdDate'
  static UPDATED_BY          = 'updatedBy'
  static UPDATED_DATE        = 'updatedDate'
  static CHECKED_BY          = 'checkedBy'
  static APPROVED_BY         = 'approvedBy'
}

/** Document (chứng từ) field-name constants. */
export class OpexDocument {
  static ID                = 'id'
  static DOSSIER_ID        = 'dossierId'
  static TREASURY_CODE     = 'treasuryCode'
  static TREASURY_NAME     = 'treasuryName'
  static DOCUMENT_TYPE_CODE = 'documentTypeCode'
  static DOCUMENT_NAME     = 'documentName'
  static DOCUMENT_NO       = 'documentNo'
  static DOCUMENT_DATE     = 'documentDate'
  static ACCOUNTING_DATE   = 'accountingDate'
  static ORIGINAL_AMOUNT   = 'originalAmount'
  static BASE_AMOUNT       = 'baseAmount'
  static CURRENCY_CODE     = 'currencyCode'
}

/** Trạng thái hồ sơ OPEX — enum 11 trạng thái (A11). */
export class OpexDossierStatusEnum {
  static DRAFT               = 'DRAFT'
  static PENDING_CHECKER     = 'PENDING_CHECKER'
  static CHECKED             = 'CHECKED'
  static APPROVAL_PENDING    = 'APPROVAL_PENDING'
  static APPROVED            = 'APPROVED'
  static APPROVAL_REJECTED   = 'APPROVAL_REJECTED'
  static CHECK_REJECTED      = 'CHECK_REJECTED'
  static CHECK_CANCELLED     = 'CHECK_CANCELLED'
  static APPROVAL_CANCELLED  = 'APPROVAL_CANCELLED'
  static REJECTED_BY_CHECKER = 'REJECTED_BY_CHECKER'
  static DELETED             = 'DELETED'
}

/** Vai trò hành động (claim JWT). */
export class OpexActionRoleEnum {
  static MAKER    = 'MAKER'
  static CHECKER  = 'CHECKER'
  static APPROVER = 'APPROVER'
}
