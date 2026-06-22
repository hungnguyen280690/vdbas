/**
 * Dossier — field-name constants for the EXP CAPEX Dossier entity.
 * Values must exactly match the JSON field names in API-contract.yaml (camelCase),
 * NOT the legacy UPPER_SNAKE names used by the prototype UI.
 */
export class Dossier {
  static ID                     = 'id'
  static DOSSIER_CODE           = 'dossierCode'
  static VERSION                = 'version'
  static SEND_DATE              = 'sendDate'
  static DATA_SOURCE_CODE       = 'dataSourceCode'
  static DATA_SOURCE_NAME       = 'dataSourceName'
  static F_STATUS               = 'fStatus'
  static F_STATUS_NAME          = 'fStatusName'
  static PROJECT_CODE           = 'projectCode'
  static PROJECT_NAME           = 'projectName'
  static PROJECT_TYPE           = 'projectType'
  static PROJECT_SPECIFIC_CODE  = 'projectSpecificCode'
  static PROJECT_SPECIFIC_NAME  = 'projectSpecificName'
  static INVESTOR_CODE          = 'investorCode'
  static INVESTOR_NAME          = 'investorName'
  static PROJECT_MANAGEMENT_CODE = 'projectManagementCode'
  static PROJECT_MANAGEMENT_NAME = 'projectManagementName'
  static TREASURY_CODE          = 'treasuryCode'
  static TREASURY_NAME          = 'treasuryName'
  static DOCUMENT_COUNT         = 'documentCount'
  static TOTAL_BASE_AMOUNT      = 'totalBaseAmount'
  static CREATED_BY             = 'createdBy'
  static CREATED_DATE           = 'createdDate'
  static UPDATED_BY             = 'updatedBy'
  static UPDATED_DATE           = 'updatedDate'
  static ASSIGN_USER            = 'assignUser'
}

/** Trạng thái hồ sơ — enum chuẩn §A11.1 */
export class DossierStatusEnum {
  static DRAFT     = 'DRAFT'
  static SAVED     = 'SAVED'
  static VALIDATED = 'VALIDATED'
  static SUBMITTED = 'SUBMITTED'
  static APPROVED  = 'APPROVED'
  static REJECTED  = 'REJECTED'
  static COMPLETED = 'COMPLETED'
  static CANCELLED = 'CANCELLED'
}

/** Nguồn gốc hồ sơ */
export class DataSourceEnum {
  static THU_CONG = 'THU_CONG'
  static DVC      = 'DVC'
}
