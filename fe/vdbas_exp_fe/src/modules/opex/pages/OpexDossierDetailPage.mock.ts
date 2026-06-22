export interface DocumentRecord {
  SEQ: number | string
  DOC_TYPE?: string
  DOC_TYPE_CODE?: string
  SOURCE_TYPE?: string
  DOC_NUMBER: string
  DOC_NAME: string
  DOC_DATE: string
  POSTING_DATE: string
  AMOUNT: number
  CURRENCY_CODE: string
  VND_AMOUNT: number
  DOC_STATUS?: string
  [key: string]: unknown
}

export interface DossierRecord {
  id: string
  DOSSIER_CODE: string
  BUDGET_UNIT_CODE: string
  BUDGET_UNIT_NAME: string
  DOSSIER_DATE: string
  CREATED_BY: string
  CREATED_DATE: string
  DATA_SOURCE_CODE: string
  CHECKED_BY: string | null
  CHECKED_DATE: string | null
  APPROVED_BY: string | null
  APPROVED_DATE: string | null
  CHECK_REJECTED_REASON: string | null
  APPROVAL_REJECTED_REASON: string | null
  CANCEL_REASON?: string
  TREASURY_CODE: string
  TREASURY_NAME: string
  F_VER: number
  documents: DocumentRecord[]
  STATE_CODE: string
  ASSIGN_USER: string
}

export const MOCK_DATA: { records: DossierRecord[] } = {
  records: [
    {
      id: 'REC-001', DOSSIER_CODE: 'T.MX1X2.001.01-260601-0001',
      BUDGET_UNIT_CODE: '1171277', BUDGET_UNIT_NAME: 'Cơ quan Báo và phát thanh, truyền hình Hà Nội',
      DOSSIER_DATE: '01/06/2026', CREATED_BY: 'nguyen.van.an', CREATED_DATE: '01/06/2026 08:30:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null, APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 1,
      documents: [], STATE_CODE: 'DRAFT', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-002', DOSSIER_CODE: 'T.MX2X3.002.01-260530-0002',
      BUDGET_UNIT_CODE: '1170918', BUDGET_UNIT_NAME: 'Văn phòng Sở Du lịch thành phố Hà Nội',
      DOSSIER_DATE: '30/05/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '30/05/2026 09:15:22',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null, APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0003', TREASURY_NAME: 'KBNN — Ban Giao dịch', F_VER: 2,
      documents: [
        {
          SEQ: '1', DOC_TYPE: 'C202a',
          DOC_NUMBER: 'T.MX2X3.002.01-260530-0002-C202a-002',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)',
          DOC_DATE: '30/05/2026', POSTING_DATE: '30/05/2026',
          AMOUNT: 25000000, CURRENCY_CODE: 'VND', VND_AMOUNT: 25000000,
          DOC_STATUS: 'Đã hoàn thiện',
        },
      ],
      STATE_CODE: 'DRAFT', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-005', DOSSIER_CODE: 'T.MX1X2.001.01-260510-0005',
      BUDGET_UNIT_CODE: '1056333', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      DOSSIER_DATE: '10/05/2026', CREATED_BY: 'vu.thi.lan', CREATED_DATE: '10/05/2026 08:00:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null, APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 5,
      documents: [
        {
          SEQ: '5', DOC_TYPE: 'C202b',
          DOC_NUMBER: 'T.MX1X2.001.01-260510-0005-C202b-005',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02b/NS)',
          DOC_DATE: '10/05/2026', POSTING_DATE: '10/05/2026',
          AMOUNT: 175000000, CURRENCY_CODE: 'VND', VND_AMOUNT: 175000000,
          DOC_STATUS: 'Đã phê duyệt',
        },
      ],
      STATE_CODE: 'SUBMITTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-007', DOSSIER_CODE: 'T.MX3X4.003.01-260428-0007',
      BUDGET_UNIT_CODE: '1122899', BUDGET_UNIT_NAME: 'Đài Phát thanh và Truyền hình tỉnh Hà Giang',
      DOSSIER_DATE: '28/04/2026', CREATED_BY: 'nguyen.van.an', CREATED_DATE: '28/04/2026 13:45:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '30/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 7,
      documents: [
        {
          SEQ: '7', DOC_TYPE: 'C202a',
          DOC_NUMBER: 'T.MX3X4.003.01-260428-0007-C202a-007',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)',
          DOC_DATE: '28/04/2026', POSTING_DATE: '28/04/2026',
          AMOUNT: 85500000, CURRENCY_CODE: 'VND', VND_AMOUNT: 85500000,
          DOC_STATUS: 'Từ chối phê duyệt',
        },
      ],
      STATE_CODE: 'APPROVED', ASSIGN_USER: 'Approver',
    },
    {
      id: 'REC-009', DOSSIER_CODE: 'T.MX1X2.001.01-260420-0009',
      BUDGET_UNIT_CODE: '1121333', BUDGET_UNIT_NAME: 'Trường Tiểu học Long Hưng',
      DOSSIER_DATE: '20/04/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '20/04/2026 10:30:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'tran.xuan.thinh', CHECKED_DATE: '20/04/2026 10:30:00',
      APPROVED_BY: 'le.quoc.viet', APPROVED_DATE: '20/04/2026 14:00:00',
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 9,
      documents: [
        {
          SEQ: '9', DOC_TYPE: 'C202a',
          DOC_NUMBER: 'T.MX1X2.001.01-260420-0009-C202a-009',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)',
          DOC_DATE: '20/04/2026', POSTING_DATE: '20/04/2026',
          AMOUNT: 150000000, CURRENCY_CODE: 'VND', VND_AMOUNT: 150000000,
          DOC_STATUS: 'Đang hoàn thiện',
        },
      ],
      STATE_CODE: 'APPROVED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-011', DOSSIER_CODE: 'T.MX3X4.003.01-260410-0011',
      BUDGET_UNIT_CODE: '1121624', BUDGET_UNIT_NAME: 'Trường Mầm non xã Hương Nhượng, Hòa Bình',
      DOSSIER_DATE: '10/04/2026', CREATED_BY: 'vu.thi.lan', CREATED_DATE: '10/04/2026 14:00:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'nguyen.ba.long', CHECKED_DATE: '12/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: 'Checker từ chối: thiếu chứng từ/sai thông tin, đề nghị bổ sung và gửi lại.',
      APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 11,
      documents: [
        {
          SEQ: '11', DOC_TYPE: 'C202a',
          DOC_NUMBER: 'T.MX3X4.003.01-260410-0011-C202a-011',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)',
          DOC_DATE: '10/04/2026', POSTING_DATE: '10/04/2026',
          AMOUNT: 15000000, CURRENCY_CODE: 'VND', VND_AMOUNT: 15000000,
          DOC_STATUS: 'Chờ kiểm soát',
        },
      ],
      STATE_CODE: 'REJECTED', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-015', DOSSIER_CODE: 'T.MX3X4.003.01-260325-0015',
      BUDGET_UNIT_CODE: '1122896', BUDGET_UNIT_NAME: 'Ban quản lý Bến xe khách huyện Ngọc Hồi',
      DOSSIER_DATE: '25/03/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '25/03/2026 10:00:00',
      DATA_SOURCE_CODE: 'AUTO', CHECKED_BY: 'tran.xuan.thinh', CHECKED_DATE: '27/03/2026 10:30:00',
      APPROVED_BY: 'nguyen.thi.hoa', APPROVED_DATE: '29/03/2026 09:15:00',
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 15,
      documents: [], STATE_CODE: 'COMPLETED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-017', DOSSIER_CODE: 'T.MX1X2.001.01-260318-0017',
      BUDGET_UNIT_CODE: '1058252', BUDGET_UNIT_NAME: 'Sở Du lịch Hà Nội',
      DOSSIER_DATE: '18/03/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '18/03/2026 09:00:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null, APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      CANCEL_REASON: 'Người lập thu hồi hồ sơ ở bước kiểm soát để điều chỉnh chứng từ.',
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 17,
      documents: [
        {
          SEQ: 1, DOC_TYPE: 'C202a',
          DOC_NUMBER: 'T.MX1X2.001.01-260318-0017-C202a-0001',
          DOC_NAME: 'Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)',
          DOC_DATE: '18/03/2026', POSTING_DATE: '18/03/2026',
          AMOUNT: 18500000, CURRENCY_CODE: 'VND', VND_AMOUNT: 18500000,
        },
      ],
      STATE_CODE: 'CANCELLED', ASSIGN_USER: '',
    },
  ],
}
