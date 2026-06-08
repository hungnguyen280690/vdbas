# Danh sách các bảng tác động - Chức năng Quản lý hồ sơ Chi đầu tư (CAPEX Dossier)

Dựa trên tài liệu đặc tả chức năng `CHI.CAPEX_DOSSIER.CRUD_spec_function.md` và file schema `EXPENDITURE.sql`, dưới đây là danh sách các bảng dữ liệu bị tác động bởi chức năng này.

## 1. Các bảng tác động chính (CRUD)

Các bảng này lưu trữ dữ liệu nghiệp vụ chính và được thay đổi trực tiếp qua các thao tác Thêm mới, Sửa, Xoá, Phê duyệt.

| STT | Tên bảng | Mô tả | Loại tác động |
|---|---|---|---|
| 1 | `EXP_DOSSIER` | Lưu thông tin định danh và trạng thái tổng quát của Hồ sơ chi đầu tư (Header). | C, R, U, D |
| 2 | `EXP_DOCUMENT` | Lưu danh sách các Chứng từ thuộc Hồ sơ. | C, R, U, D |
| 3 | `EXP_DOCUMENT_LINE` | Lưu chi tiết các dòng hạch toán/thanh toán của Chứng từ. | C, R, U, D |
| 4 | `EXP_APPROVAL_LOG` | Lưu lịch sử luồng phê duyệt (Maker–Checker–Approver) và lý do từ chối/hủy. | C, R |
| 5 | `EXP_ARCHIVE` | Lưu thông tin các tài liệu đính kèm (File name, Path, Type). | C, R, D |
| 6 | `EXP_DIGITAL_SIGNED` | Lưu thông tin ký số của hồ sơ khi thực hiện phê duyệt. | C, R |
| 7 | `EXP_DOSSIER_SLA` | Theo dõi thời hạn xử lý (SLA) của hồ sơ theo từng bước. | C, R, U |
| 8 | `AUDIT_LOG` | Ghi nhận chi tiết thay đổi dữ liệu (oldValue → newValue) để phục vụ tra soát. | C, R |

## 2. Các bảng danh mục tham chiếu (Reference/Master Data)

Các bảng này cung cấp dữ liệu cho các trường chọn (LOV), Lookup và dùng để validate dữ liệu đầu vào.

| STT | Tên bảng | Mô tả | Sử dụng tại |
|---|---|---|---|
| 1 | `EXP_PROJECT` | Danh mục Dự án/Công trình. | PROJECT_CODE |
| 2 | `EXP_PROJECT_MANAGEMENT` | Danh mục Ban Quản lý dự án (ĐVQHNS). | PROJECT_MANAGEMENT_CODE |
| 3 | `EXP_PROJECT_SPECIFIC` | Danh mục Dự án đặc thù (dành cho khối Quân sự). | PROJECT_SPECIFIC_CODE |
| 4 | `EXP_PROJECT_TYPE` | Phân loại loại dự án (Military/Citizen). | PROJECT_TYPE_CODE |
| 5 | `EXP_DATA_SOURCE` | Nguồn gốc hồ sơ (Thủ công, DVC). | DATA_SOURCE_CODE |
| 6 | `COMMON_STATE` | Danh mục trạng thái xử lý hồ sơ. | STATE_CODE |
| 7 | `COMMON_TREASURY` | Danh mục Kho bạc Nhà nước. | TREASURY_CODE |
| 8 | `EXP_WORKFLOW` | Cấu hình luồng phê duyệt áp dụng cho hồ sơ. | WORKFLOW_ID |
| 9 | `EXP_PAYMENT_TYPE` | Loại thanh toán (Tạm ứng, Thanh toán). | PAYMENT_TYPE_CODE |
| 10 | `EXP_CAPITAL_PLAN_TYPE` | Loại kế hoạch vốn. | CAPITAL_PLAN_TYPE_CODE |
| 11 | `EXP_CURRENCY_TYPE` | Danh mục loại tiền tệ (VND, USD...). | CURRENCY_TYPE_CODE |
| 12 | `EXP_EXCHANGE_RATE` | Thông tin tỷ giá hạch toán theo ngày. | EXCHANGE_RATE |
| 13 | `EXP_PROJECT_ITEM` | Danh mục hạng mục công trình/dự án. | PROJECT_ITEM_CODE |
| 14 | `EXP_DOCUMENT_TEMPLATE` | Danh mục các mẫu chứng từ theo quy định. | DOCUMENT_TEMPLATE_ID |
| 15 | `EXP_DOCUMENT_TYPE` | Phân loại loại chứng từ (Giấy ĐNTT, Giấy rút vốn...). | DOCUMENT_TYPE_CODE |
| 16 | `EXP_GUARANTEE` | Thông tin bảo lãnh liên quan đến chứng từ. | GUARANTEE_ID |
| 17 | `EXP_INVESTOR` | Danh mục Chủ đầu tư. | INVESTOR_NAME |
| 18 | `EXP_ACCOUNTING_PERIOD` | Kiểm tra kỳ kế toán (đã đóng hay chưa). | Kiểm tra nghiệp vụ |
| 19 | `COMMON_BANK` | Danh mục ngân hàng của đơn vị thụ hưởng. | BENEFICIARY_BANK_CODE |
| 20 | `COMMON_GL_SEGMENT*` | Các phân đoạn mã tài khoản hạch toán (COA). | GL_SEGMENT1...12 |
| 21 | `COMMON_INVESTMENT_SOURCE`| Danh mục nguồn vốn đầu tư. | INVESTMENT_SOURCE_CODE |

## 3. Ghi chú nghiệp vụ về dữ liệu

*   **Soft-delete**: Khi thực hiện Xoá hồ sơ, hệ thống không xoá vật lý mà cập nhật trạng thái `STATE_CODE` về giá trị đại diện cho 'Đã xoá' (ví dụ: `DELETED`) trong bảng `EXP_DOSSIER`.
*   **Version Control**: Bảng `EXP_DOSSIER` sử dụng trường `DOSSIER_VERSION` hoặc `F-VER` (theo spec) để kiểm soát xung đột dữ liệu (Optimistic Locking).
*   **Audit Trail**: Mọi hành động Thêm/Sửa/Xoá phải được ghi nhận vào `AUDIT_LOG`. Riêng luồng phê duyệt được ghi nhận chi tiết tại `EXP_APPROVAL_LOG`.
