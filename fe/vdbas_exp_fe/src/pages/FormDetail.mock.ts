export type DossierStatus =
  | 'DRAFT'
  | 'PENDING_CHECK'
  | 'CHECK_REJECTED'
  | 'CHECK_CANCELLED'
  | 'PENDING_APPROVE'
  | 'APPROVE_REJECTED'
  | 'APPROVE_CANCELLED'
  | 'APPROVED'
  | 'DELETED'

export interface DocumentRecord {
  DOCUMENT_NUMBER: string
  DOCUMENT_DATE: string
  ACCOUNTING_DATE: string
  DOC_NAME: string
  PAYMENT_REQUEST_AMOUNT: number | null
  PAYMENT_REQUEST_AMOUNT_VND: number
  currencyTypeCode?: string
  currency?: string
}

export interface DossierRecord {
  id: string
  DOSSIER_CODE: string
  SEND_DATE: string
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_TYPE: 'Military' | 'Citizen'
  PROJECT_SPECIFIC_CODE: string | null
  PROJECT_SPECIFIC_NAME: string | null
  PROJECT_MANAGEMENT_CODE: string
  PROJECT_MANAGEMENT_NAME: string
  STATE_CODE: DossierStatus
  DATA_SOURCE_CODE: string
  CREATED_BY: string
  CREATED_DATE: string
  LAST_UPDATED_BY: string
  LAST_UPDATED_DATE: string
  TOTAL_VND: number
  DOCUMENT_COUNT: number
  documents: DocumentRecord[]
  CHECKED_BY?: string
  CHECKED_DATE?: string
  APPROVED_BY?: string
  APPROVED_DATE?: string
  CHECK_REJECTION_REASON?: string
  APPROVAL_REJECTION_REASON?: string
}

export interface LovEntry {
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_TYPE: 'Military' | 'Citizen'
  PROJECT_SPECIFIC_CODE: string | null
  PROJECT_SPECIFIC_NAME: string | null
  GL_SEGMENT6_CODE: string
  GL_SEGMENT6_NAME: string
}

export interface MockData {
  records: DossierRecord[]
}

export const LOV01_DATA: LovEntry[] = [
  { PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military', PROJECT_SPECIFIC_CODE: '001200037', PROJECT_SPECIFIC_NAME: 'Dự án TM02', GL_SEGMENT6_CODE: '1059227', GL_SEGMENT6_NAME: 'BQL Cục thông tin BQP' },
  { PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military', PROJECT_SPECIFIC_CODE: '001200038', PROJECT_SPECIFIC_NAME: 'Dự án TM03', GL_SEGMENT6_CODE: '1059227', GL_SEGMENT6_NAME: 'BQL Cục thông tin BQP' },
  { PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen', PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null, GL_SEGMENT6_CODE: '3029123', GL_SEGMENT6_NAME: 'BQLDA bệnh viện Bạch Mai' },
]

export const MOCK_DATA: MockData = {
  records: [
    {
      id: 'REC-001', DOSSIER_CODE: 'HS-CHI-2026-0001', SEND_DATE: '15/05/2026',
      PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen',
      PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null,
      PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai',
      STATE_CODE: 'DRAFT', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'nguyen.van.a', CREATED_DATE: '15/05/2026 09:12:00',
      LAST_UPDATED_BY: 'nguyen.van.a', LAST_UPDATED_DATE: '15/05/2026 09:12:00',
      TOTAL_VND: 1500000000, DOCUMENT_COUNT: 2,
      documents: [
        { DOCUMENT_NUMBER: 'CT-2026-001', DOCUMENT_DATE: '10/05/2026', ACCOUNTING_DATE: '15/05/2026', DOC_NAME: 'Chứng từ thanh toán công trình hạng mục A', PAYMENT_REQUEST_AMOUNT: null, PAYMENT_REQUEST_AMOUNT_VND: 800000000 },
        { DOCUMENT_NUMBER: 'CT-2026-002', DOCUMENT_DATE: '12/05/2026', ACCOUNTING_DATE: '15/05/2026', DOC_NAME: 'Chứng từ thanh toán thiết bị y tế', PAYMENT_REQUEST_AMOUNT: null, PAYMENT_REQUEST_AMOUNT_VND: 700000000 },
      ],
    },
    {
      id: 'REC-002', DOSSIER_CODE: 'HS-CHI-2026-0002', SEND_DATE: '10/05/2026',
      PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military',
      PROJECT_SPECIFIC_CODE: '001200037', PROJECT_SPECIFIC_NAME: 'Dự án TM02',
      PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP',
      STATE_CODE: 'PENDING_CHECK', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'tran.thi.b', CREATED_DATE: '08/05/2026 14:30:00',
      LAST_UPDATED_BY: 'tran.thi.b', LAST_UPDATED_DATE: '10/05/2026 11:00:00',
      TOTAL_VND: 3200000000, DOCUMENT_COUNT: 1,
      documents: [
        { DOCUMENT_NUMBER: 'CT-2026-003', DOCUMENT_DATE: '08/05/2026', ACCOUNTING_DATE: '10/05/2026', DOC_NAME: 'Giấy đề nghị thanh toán dự án TM02 giai đoạn 1', PAYMENT_REQUEST_AMOUNT: null, PAYMENT_REQUEST_AMOUNT_VND: 3200000000 },
      ],
    },
    {
      id: 'REC-003', DOSSIER_CODE: 'HS-CHI-2026-0003', SEND_DATE: '05/05/2026',
      PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen',
      PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null,
      PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai',
      STATE_CODE: 'PENDING_APPROVE', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'le.van.c', CREATED_DATE: '03/05/2026 10:00:00',
      LAST_UPDATED_BY: 'nguyen.checker', LAST_UPDATED_DATE: '05/05/2026 16:00:00',
      CHECKED_BY: 'nguyen.checker', CHECKED_DATE: '05/05/2026 16:00:00',
      TOTAL_VND: 950000000, DOCUMENT_COUNT: 1,
      documents: [
        { DOCUMENT_NUMBER: 'CT-2026-004', DOCUMENT_DATE: '03/05/2026', ACCOUNTING_DATE: '05/05/2026', DOC_NAME: 'Thanh toán khối lượng xây dựng hạng mục phòng mổ', PAYMENT_REQUEST_AMOUNT: null, PAYMENT_REQUEST_AMOUNT_VND: 950000000 },
      ],
    },
    {
      id: 'REC-004', DOSSIER_CODE: 'HS-CHI-2026-0004', SEND_DATE: '28/04/2026',
      PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military',
      PROJECT_SPECIFIC_CODE: '001200038', PROJECT_SPECIFIC_NAME: 'Dự án TM03',
      PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP',
      STATE_CODE: 'APPROVED', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'pham.thi.d', CREATED_DATE: '25/04/2026 08:00:00',
      LAST_UPDATED_BY: 'tran.approver', LAST_UPDATED_DATE: '28/04/2026 14:30:00',
      CHECKED_BY: 'nguyen.checker', CHECKED_DATE: '27/04/2026 09:00:00',
      APPROVED_BY: 'tran.approver', APPROVED_DATE: '28/04/2026 14:30:00',
      TOTAL_VND: 5600000000, DOCUMENT_COUNT: 3, documents: [],
    },
    {
      id: 'REC-005', DOSSIER_CODE: 'HS-CHI-2026-0005', SEND_DATE: '20/04/2026',
      PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen',
      PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null,
      PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai',
      STATE_CODE: 'CHECK_REJECTED', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'hoang.van.e', CREATED_DATE: '18/04/2026 11:00:00',
      LAST_UPDATED_BY: 'nguyen.checker', LAST_UPDATED_DATE: '20/04/2026 15:30:00',
      CHECKED_BY: 'nguyen.checker', CHECK_REJECTION_REASON: 'Chứng từ chưa đủ hạng mục theo hợp đồng',
      TOTAL_VND: 420000000, DOCUMENT_COUNT: 1, documents: [],
    },
    {
      id: 'REC-006', DOSSIER_CODE: 'HS-CHI-2026-0006', SEND_DATE: '15/04/2026',
      PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military',
      PROJECT_SPECIFIC_CODE: '001200037', PROJECT_SPECIFIC_NAME: 'Dự án TM02',
      PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP',
      STATE_CODE: 'APPROVE_REJECTED', DATA_SOURCE_CODE: 'DVC',
      CREATED_BY: 'vu.thi.f', CREATED_DATE: '10/04/2026 09:30:00',
      LAST_UPDATED_BY: 'tran.approver', LAST_UPDATED_DATE: '15/04/2026 16:00:00',
      CHECKED_BY: 'nguyen.checker', APPROVED_BY: 'tran.approver',
      APPROVAL_REJECTION_REASON: 'Vượt hạn mức phân bổ ngân sách quý 2/2026',
      TOTAL_VND: 8900000000, DOCUMENT_COUNT: 2, documents: [],
    },
    {
      id: 'REC-007', DOSSIER_CODE: 'HS-CHI-2026-0007', SEND_DATE: '28/05/2026',
      PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen',
      PROJECT_SPECIFIC_CODE: null, PROJECT_SPECIFIC_NAME: null,
      PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai',
      STATE_CODE: 'DRAFT', DATA_SOURCE_CODE: 'Thủ công',
      CREATED_BY: 'nguyen.van.a', CREATED_DATE: '28/05/2026 08:00:00',
      LAST_UPDATED_BY: 'nguyen.van.a', LAST_UPDATED_DATE: '28/05/2026 08:00:00',
      TOTAL_VND: 0, DOCUMENT_COUNT: 0, documents: [],
    },
  ],
}
