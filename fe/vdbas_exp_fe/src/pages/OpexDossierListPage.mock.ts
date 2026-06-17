export interface OpexDossierRecord {
  id: string
  DOSSIER_CODE: string
  BUDGET_UNIT_CODE: string
  BUDGET_UNIT_NAME: string
  SEND_DATE: string
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
  F_STATUS: string
  ASSIGN_USER: string
}

export interface OpexMockData {
  meta: { functionCode: string }
  records: OpexDossierRecord[]
}

export const MOCK_DATA: OpexMockData = {
  meta: { functionCode: 'EXP.OPEX.DOSSIER' },
  records: [
    {
      id: 'REC-001', DOSSIER_CODE: 'T.MX1X2.001.01-260601-0001',
      BUDGET_UNIT_CODE: '1171277', BUDGET_UNIT_NAME: 'Cơ quan Báo và phát thanh, truyền hình Hà Nội',
      SEND_DATE: '01/06/2026', CREATED_BY: 'nguyen.van.an', CREATED_DATE: '01/06/2026 08:30:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 1, F_STATUS: 'DRAFT', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-002', DOSSIER_CODE: 'T.MX2X3.002.01-260530-0002',
      BUDGET_UNIT_CODE: '1170918', BUDGET_UNIT_NAME: 'Văn phòng Sở Du lịch thành phố Hà Nội',
      SEND_DATE: '30/05/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '30/05/2026 09:15:22',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0003', TREASURY_NAME: 'KBNN — Ban Giao dịch', F_VER: 2, F_STATUS: 'DRAFT', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-003', DOSSIER_CODE: 'T.MX3X4.003.01-260520-0003',
      BUDGET_UNIT_CODE: '1059441', BUDGET_UNIT_NAME: 'Trường Trung học Công nghiệp Hà Nội',
      SEND_DATE: '20/05/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '20/05/2026 10:00:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 3, F_STATUS: 'SAVED', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-004', DOSSIER_CODE: 'T.MX4X5.004.01-260515-0004',
      BUDGET_UNIT_CODE: '1058252', BUDGET_UNIT_NAME: 'Sở Du lịch Hà Nội',
      SEND_DATE: '15/05/2026', CREATED_BY: 'pham.quoc.hung', CREATED_DATE: '15/05/2026 14:00:00',
      DATA_SOURCE_CODE: 'AUTO', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0015', TREASURY_NAME: 'KBNN Đống Đa — Hà Nội', F_VER: 4, F_STATUS: 'VALIDATED', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-005', DOSSIER_CODE: 'T.MX1X2.001.01-260510-0005',
      BUDGET_UNIT_CODE: '1056333', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      SEND_DATE: '10/05/2026', CREATED_BY: 'vu.thi.lan', CREATED_DATE: '10/05/2026 08:00:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 5, F_STATUS: 'SUBMITTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-006', DOSSIER_CODE: 'T.MX2X3.002.01-260505-0006',
      BUDGET_UNIT_CODE: '1122826', BUDGET_UNIT_NAME: "Trung tâm Y tế huyện Ia H'Drai, Kon Tum",
      SEND_DATE: '05/05/2026', CREATED_BY: 'hoang.minh.duc', CREATED_DATE: '05/05/2026 11:30:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0003', TREASURY_NAME: 'KBNN — Ban Giao dịch', F_VER: 6, F_STATUS: 'SUBMITTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-007', DOSSIER_CODE: 'T.MX3X4.003.01-260428-0007',
      BUDGET_UNIT_CODE: '1122899', BUDGET_UNIT_NAME: 'Đài Phát thanh và Truyền hình tỉnh Hà Giang',
      SEND_DATE: '28/04/2026', CREATED_BY: 'nguyen.van.an', CREATED_DATE: '28/04/2026 13:45:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '30/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 7, F_STATUS: 'APPROVED', ASSIGN_USER: 'Approver',
    },
    {
      id: 'REC-008', DOSSIER_CODE: 'T.MX4X5.004.01-260425-0008',
      BUDGET_UNIT_CODE: '1122910', BUDGET_UNIT_NAME: 'BQL Dự án Xử lý chất thải bệnh viện AG',
      SEND_DATE: '25/04/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '25/04/2026 09:00:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'nguyen.ba.long', CHECKED_DATE: '25/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0015', TREASURY_NAME: 'KBNN Đống Đa — Hà Nội', F_VER: 8, F_STATUS: 'APPROVED', ASSIGN_USER: 'Approver',
    },
    {
      id: 'REC-009', DOSSIER_CODE: 'T.MX1X2.001.01-260420-0009',
      BUDGET_UNIT_CODE: '1121333', BUDGET_UNIT_NAME: 'Trường Tiểu học Long Hưng',
      SEND_DATE: '20/04/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '20/04/2026 10:30:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'tran.xuan.thinh', CHECKED_DATE: '20/04/2026 10:30:00',
      APPROVED_BY: 'le.quoc.viet', APPROVED_DATE: '20/04/2026 14:00:00', CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 9, F_STATUS: 'APPROVED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-010', DOSSIER_CODE: 'T.MX2X3.002.01-260415-0010',
      BUDGET_UNIT_CODE: '7499089', BUDGET_UNIT_NAME: 'Đường An Phú 4 — Hòa Bình 3',
      SEND_DATE: '15/04/2026', CREATED_BY: 'pham.quoc.hung', CREATED_DATE: '15/04/2026 08:15:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '15/04/2026 10:30:00',
      APPROVED_BY: 'nguyen.thi.hoa', APPROVED_DATE: '15/04/2026 14:00:00', CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0003', TREASURY_NAME: 'KBNN — Ban Giao dịch', F_VER: 10, F_STATUS: 'APPROVED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-011', DOSSIER_CODE: 'T.MX3X4.003.01-260410-0011',
      BUDGET_UNIT_CODE: '1121624', BUDGET_UNIT_NAME: 'Trường Mầm non xã Hương Nhượng, Hòa Bình',
      SEND_DATE: '10/04/2026', CREATED_BY: 'vu.thi.lan', CREATED_DATE: '10/04/2026 14:00:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'nguyen.ba.long', CHECKED_DATE: '12/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: 'Checker từ chối: thiếu chứng từ/sai thông tin, đề nghị bổ sung và gửi lại.',
      APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 11, F_STATUS: 'REJECTED', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-012', DOSSIER_CODE: 'T.MX4X5.004.01-260405-0012',
      BUDGET_UNIT_CODE: '1122831', BUDGET_UNIT_NAME: 'Trường TH&THCS xã Tân Mai, Mai Châu, Hòa Bình',
      SEND_DATE: '05/04/2026', CREATED_BY: 'hoang.minh.duc', CREATED_DATE: '05/04/2026 09:30:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'tran.xuan.thinh', CHECKED_DATE: '07/04/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null,
      CHECK_REJECTED_REASON: 'Checker từ chối: thiếu chứng từ/sai thông tin, đề nghị bổ sung và gửi lại.',
      APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0015', TREASURY_NAME: 'KBNN Đống Đa — Hà Nội', F_VER: 12, F_STATUS: 'REJECTED', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-013', DOSSIER_CODE: 'T.MX1X2.001.01-260401-0013',
      BUDGET_UNIT_CODE: '1121625', BUDGET_UNIT_NAME: 'Câu lạc bộ Truyền thống kháng chiến Cần Giờ',
      SEND_DATE: '01/04/2026', CREATED_BY: 'nguyen.van.an', CREATED_DATE: '01/04/2026 07:45:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '03/04/2026 10:30:00',
      APPROVED_BY: 'hoang.van.duc', APPROVED_DATE: '05/04/2026 09:15:00',
      CHECK_REJECTED_REASON: null,
      APPROVAL_REJECTED_REASON: 'Approver từ chối: vượt hạn mức/dự toán, trả lại Checker xử lý.',
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 13, F_STATUS: 'REJECTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-014', DOSSIER_CODE: 'T.MX2X3.002.01-260328-0014',
      BUDGET_UNIT_CODE: '1122834', BUDGET_UNIT_NAME: 'Quỹ Hỗ trợ phụ nữ phát triển tỉnh Quảng Bình',
      SEND_DATE: '28/03/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '28/03/2026 13:00:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: 'nguyen.ba.long', CHECKED_DATE: '30/03/2026 10:30:00',
      APPROVED_BY: 'le.quoc.viet', APPROVED_DATE: '01/04/2026 09:15:00',
      CHECK_REJECTED_REASON: null,
      APPROVAL_REJECTED_REASON: 'Approver từ chối: vượt hạn mức/dự toán, trả lại Checker xử lý.',
      TREASURY_CODE: '0003', TREASURY_NAME: 'KBNN — Ban Giao dịch', F_VER: 14, F_STATUS: 'REJECTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-015', DOSSIER_CODE: 'T.MX3X4.003.01-260325-0015',
      BUDGET_UNIT_CODE: '1122896', BUDGET_UNIT_NAME: 'Ban quản lý Bến xe khách huyện Ngọc Hồi',
      SEND_DATE: '25/03/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '25/03/2026 10:00:00',
      DATA_SOURCE_CODE: 'AUTO', CHECKED_BY: 'tran.xuan.thinh', CHECKED_DATE: '27/03/2026 10:30:00',
      APPROVED_BY: 'nguyen.thi.hoa', APPROVED_DATE: '29/03/2026 09:15:00', CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 15, F_STATUS: 'COMPLETED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-016', DOSSIER_CODE: 'T.MX4X5.004.01-260320-0016',
      BUDGET_UNIT_CODE: '7506106', BUDGET_UNIT_NAME: 'Xây dựng tường rào UBND xã Giang Ly, Khánh Vĩnh',
      SEND_DATE: '20/03/2026', CREATED_BY: 'pham.quoc.hung', CREATED_DATE: '20/03/2026 08:30:00',
      DATA_SOURCE_CODE: 'AUTO', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '20/03/2026 10:30:00',
      APPROVED_BY: 'nguyen.thi.hoa', APPROVED_DATE: '20/03/2026 14:00:00', CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0015', TREASURY_NAME: 'KBNN Đống Đa — Hà Nội', F_VER: 16, F_STATUS: 'COMPLETED', ASSIGN_USER: 'Done',
    },
    {
      id: 'REC-017', DOSSIER_CODE: 'T.MX1X2.001.01-260318-0017',
      BUDGET_UNIT_CODE: '1058252', BUDGET_UNIT_NAME: 'Sở Du lịch Hà Nội',
      SEND_DATE: '18/03/2026', CREATED_BY: 'tran.thi.bich', CREATED_DATE: '18/03/2026 09:00:00',
      DATA_SOURCE_CODE: 'MANUAL', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      CANCEL_REASON: 'Người lập thu hồi hồ sơ ở bước kiểm soát để điều chỉnh chứng từ.',
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Khu vực I (Hà Nội)', F_VER: 17, F_STATUS: 'CANCELLED', ASSIGN_USER: '',
    },
    {
      id: 'REC-018', DOSSIER_CODE: 'T.MX2X3.002.01-260315-0018',
      BUDGET_UNIT_CODE: '1056333', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      SEND_DATE: '15/03/2026', CREATED_BY: 'le.hong.phuc', CREATED_DATE: '15/03/2026 08:30:00',
      DATA_SOURCE_CODE: 'DVKB', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      CANCEL_REASON: 'Hồ sơ được thu hồi ở bước phê duyệt theo đề nghị của đơn vị.',
      TREASURY_CODE: '0001', TREASURY_NAME: 'Kho bạc Nhà nước (KBNN TW)', F_VER: 18, F_STATUS: 'CANCELLED', ASSIGN_USER: '',
    },
    {
      id: 'REC-T01', DOSSIER_CODE: 'T.MX2X3.002.01-260601-T001',
      BUDGET_UNIT_CODE: '01701001', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      SEND_DATE: '01/06/2026', CREATED_BY: 'he.thong.kbnn', CREATED_DATE: '01/06/2026 08:30:00',
      DATA_SOURCE_CODE: 'TREASURY_SERVICE', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Trung ương', F_VER: 1, F_STATUS: 'DRAFT', ASSIGN_USER: 'Maker',
    },
    {
      id: 'REC-T02', DOSSIER_CODE: 'T.MX3X4.003.01-260528-T002',
      BUDGET_UNIT_CODE: '01701001', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      SEND_DATE: '28/05/2026', CREATED_BY: 'he.thong.kbnn', CREATED_DATE: '28/05/2026 14:00:00',
      DATA_SOURCE_CODE: 'TREASURY_SERVICE', CHECKED_BY: null, CHECKED_DATE: null,
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Trung ương', F_VER: 2, F_STATUS: 'SUBMITTED', ASSIGN_USER: 'Checker',
    },
    {
      id: 'REC-T03', DOSSIER_CODE: 'T.MX1X2.001.01-260520-T003',
      BUDGET_UNIT_CODE: '01701001', BUDGET_UNIT_NAME: 'Văn phòng Kho bạc Nhà nước',
      SEND_DATE: '20/05/2026', CREATED_BY: 'he.thong.kbnn', CREATED_DATE: '20/05/2026 09:45:00',
      DATA_SOURCE_CODE: 'TREASURY_SERVICE', CHECKED_BY: 'vu.thi.mai', CHECKED_DATE: '20/05/2026 10:30:00',
      APPROVED_BY: null, APPROVED_DATE: null, CHECK_REJECTED_REASON: null, APPROVAL_REJECTED_REASON: null,
      TREASURY_CODE: '0011', TREASURY_NAME: 'KBNN Trung ương', F_VER: 1, F_STATUS: 'APPROVED', ASSIGN_USER: 'Approver',
    },
  ],
}
