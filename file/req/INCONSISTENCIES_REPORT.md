# Báo cáo Trạng thái Đồng nhất giữa SQL Schema và Đặc tả Chức năng
**Chức năng:** Quản lý hồ sơ Chi đầu tư (EXP.CAPEX_DOSSIER)

## Trạng thái: ĐÃ ĐỒNG NHẤT (100% CONSISTENT)
**Ngày cập nhật:** 05/06/2026
**Người thực hiện:** Gemini CLI

Sau quá trình rà soát và điều chỉnh, tài liệu Đặc tả chức năng (`CHI.CAPEX_DOSSIER.CRUD_spec_function.md`) hiện đã hoàn toàn khớp với Database Schema (`EXPENDITURE.sql`).

---

## 1. Các vấn đề đã giải quyết (Resolutions)

### A. Chuẩn hóa tên trường (Naming Alignment)
Tất cả tên trường (ENG) trong Spec đã được cập nhật để khớp chính xác với các cột trong SQL:
- `PROJECT_MANAGEMENT_BOARD_ID` đã đổi thành `PROJECT_MANAGEMENT_CODE` (khớp với bảng `EXP_PROJECT_MANAGEMENT`).
- Các trường Mã hồ sơ, Trạng thái, Dự án, Nguồn gốc... đã được thống nhất (`DOSSIER_CODE`, `STATE_CODE`, `PROJECT_CODE`, `DATA_SOURCE_CODE`).

### B. Xử lý các trường không có trong DB
- Trường `DOC_NAME` (Tên/diễn giải chứng từ) đã được xóa khỏi đặc tả Lưới chứng từ do cấu trúc DB thực tế không lưu trữ cột này tại bảng `EXP_DOCUMENT`.

### C. Làm rõ Logic truy xuất dữ liệu (Data Retrieval Logic)
Để giải quyết sự khác biệt về cấu trúc mà không cần sửa SQL, tài liệu Spec đã bổ sung các quy tắc truy vấn:
- **Số tiền hồ sơ/chứng từ:** Được quy định là giá trị tính toán bằng cách `SUM` từ bảng chi tiết `EXP_DOCUMENT_LINE`.
- **Lý do (Reasons):** Các lý do từ chối/hủy (`RETURNING_REASON`, `CHECK_REJECTION_REASON`, `APPROVAL_REJECTION_REASON`) được quy định lấy từ bảng `EXP_APPROVAL_LOG` thông qua các phép Join.

### D. Bổ sung các thiếu sót nghiệp vụ
- Bổ sung trường **Mã dự án (PROJECT_CODE)** vào bộ lọc tìm kiếm trên màn hình Danh sách.
- Định nghĩa quy tắc sinh **Số chứng từ (DOCUMENT_NUMBER)** theo format `EXP/CAPEX/YYYY/XXXXX`.
- Đồng nhất các trạng thái trong State Machine và các bảng thuộc tính.

---

## 2. Kết luận
Tài liệu Đặc tả chức năng hiện đã sẵn sàng để chuyển giao cho đội ngũ Phát triển (Dev) và Kiểm thử (Tester). Không cần thực hiện bất kỳ thay đổi nào đối với file SQL hiện tại.
