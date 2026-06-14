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

export interface DossierRecord {
  id: string
  DOSSIER_CODE: string
  SEND_DATE: string
  PROJECT_CODE: string
  PROJECT_NAME: string
  PROJECT_TYPE: 'Citizen' | 'Military'
  PROJECT_MANAGEMENT_CODE: string
  PROJECT_MANAGEMENT_NAME: string
  STATE_CODE: DossierStatus
  DATA_SOURCE_CODE: string
  CREATED_BY: string
  CREATED_DATE: string
  LAST_UPDATED_DATE: string
  TOTAL_VND: number
  DOCUMENT_COUNT: number
  CHECKED_BY?: string
  CHECKED_DATE?: string
  APPROVED_BY?: string
  APPROVED_DATE?: string
  CHECK_REJECTION_REASON?: string
  APPROVAL_REJECTION_REASON?: string
  RETURNING_REASON?: string
}

export interface UserLovItem {
  username: string
  fullname: string
  role: 'Maker' | 'Checker' | 'Approver'
  unit: string
}

export interface MockData {
  records: DossierRecord[]
}

export const MOCK_DATA: MockData = {
  records: [
    { id: 'REC-001', DOSSIER_CODE: 'HS-CHI-2026-0001', SEND_DATE: '15/05/2026', PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen', PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai', STATE_CODE: 'DRAFT', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'nguyen.van.a', CREATED_DATE: '15/05/2026 09:12:00', LAST_UPDATED_DATE: '15/05/2026 09:12:00', TOTAL_VND: 1500000000, DOCUMENT_COUNT: 2 },
    { id: 'REC-002', DOSSIER_CODE: 'HS-CHI-2026-0002', SEND_DATE: '10/05/2026', PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military', PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP', STATE_CODE: 'PENDING_CHECK', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'tran.thi.b', CREATED_DATE: '08/05/2026 14:30:00', LAST_UPDATED_DATE: '10/05/2026 11:00:00', CHECKED_BY: 'nguyen.checker', CHECKED_DATE: '10/05/2026 11:00:00', TOTAL_VND: 3200000000, DOCUMENT_COUNT: 1 },
    { id: 'REC-003', DOSSIER_CODE: 'HS-CHI-2026-0003', SEND_DATE: '05/05/2026', PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen', PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai', STATE_CODE: 'PENDING_APPROVE', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'le.van.c', CREATED_DATE: '03/05/2026 10:00:00', LAST_UPDATED_DATE: '05/05/2026 16:00:00', CHECKED_BY: 'nguyen.checker', CHECKED_DATE: '05/05/2026 16:00:00', TOTAL_VND: 950000000, DOCUMENT_COUNT: 1 },
    { id: 'REC-004', DOSSIER_CODE: 'HS-CHI-2026-0004', SEND_DATE: '28/04/2026', PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military', PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP', STATE_CODE: 'APPROVED', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'pham.thi.d', CREATED_DATE: '25/04/2026 08:00:00', LAST_UPDATED_DATE: '28/04/2026 14:30:00', CHECKED_BY: 'nguyen.checker', CHECKED_DATE: '27/04/2026 09:00:00', APPROVED_BY: 'tran.approver', APPROVED_DATE: '28/04/2026 14:30:00', TOTAL_VND: 5600000000, DOCUMENT_COUNT: 3 },
    { id: 'REC-005', DOSSIER_CODE: 'HS-CHI-2026-0005', SEND_DATE: '20/04/2026', PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen', PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai', STATE_CODE: 'CHECK_REJECTED', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'hoang.van.e', CREATED_DATE: '18/04/2026 11:00:00', LAST_UPDATED_DATE: '20/04/2026 15:30:00', CHECKED_BY: 'nguyen.checker', CHECK_REJECTION_REASON: 'Chứng từ chưa đủ hạng mục theo hợp đồng', TOTAL_VND: 420000000, DOCUMENT_COUNT: 1 },
    { id: 'REC-006', DOSSIER_CODE: 'HS-CHI-2026-0006', SEND_DATE: '15/04/2026', PROJECT_CODE: '7004686', PROJECT_NAME: 'Các dự án thuộc dự án bộ quốc phòng', PROJECT_TYPE: 'Military', PROJECT_MANAGEMENT_CODE: '1059227', PROJECT_MANAGEMENT_NAME: 'BQL Cục thông tin BQP', STATE_CODE: 'APPROVE_REJECTED', DATA_SOURCE_CODE: 'DVC', CREATED_BY: 'vu.thi.f', CREATED_DATE: '10/04/2026 09:30:00', LAST_UPDATED_DATE: '15/04/2026 16:00:00', CHECKED_BY: 'nguyen.checker', APPROVED_BY: 'tran.approver', APPROVAL_REJECTION_REASON: 'Vượt hạn mức phân bổ ngân sách quý 2/2026', TOTAL_VND: 8900000000, DOCUMENT_COUNT: 2 },
    { id: 'REC-007', DOSSIER_CODE: 'HS-CHI-2026-0007', SEND_DATE: '28/05/2026', PROJECT_CODE: '7122155', PROJECT_NAME: 'Dự án nâng cấp bệnh viện Bạch Mai', PROJECT_TYPE: 'Citizen', PROJECT_MANAGEMENT_CODE: '3029123', PROJECT_MANAGEMENT_NAME: 'BQLDA bệnh viện Bạch Mai', STATE_CODE: 'DRAFT', DATA_SOURCE_CODE: 'Thủ công', CREATED_BY: 'nguyen.van.a', CREATED_DATE: '28/05/2026 08:00:00', LAST_UPDATED_DATE: '28/05/2026 08:00:00', TOTAL_VND: 0, DOCUMENT_COUNT: 0 },
  ],
}

export const USER_LOV: UserLovItem[] = [
  { username: 'nguyen.van.a',    fullname: 'Nguyễn Văn A',        role: 'Maker',    unit: 'Phòng Kế toán'   },
  { username: 'tran.thi.b',      fullname: 'Trần Thị B',          role: 'Maker',    unit: 'Phòng Kế toán'   },
  { username: 'le.van.c',        fullname: 'Lê Văn C',            role: 'Maker',    unit: 'Phòng Tài chính' },
  { username: 'pham.thi.d',      fullname: 'Phạm Thị D',          role: 'Maker',    unit: 'Phòng Tài chính' },
  { username: 'hoang.van.e',     fullname: 'Hoàng Văn E',         role: 'Maker',    unit: 'Ban Đầu tư'      },
  { username: 'nguyen.checker',  fullname: 'Nguyễn Kiểm Soát',    role: 'Checker',  unit: 'Phòng Kiểm soát' },
  { username: 'tran.approver',   fullname: 'Trần Phê Duyệt',      role: 'Approver', unit: 'Ban Giám đốc'    },
]
