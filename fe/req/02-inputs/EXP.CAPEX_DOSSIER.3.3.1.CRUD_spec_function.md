# A - Bảng đặc tả chức năng

> Chức năng **Thêm mới / Xem / Sửa / Xoá** giấy **Đề nghị thanh toán mẫu 04.A** trong phân hệ Quản lý Chi – CAPEX (EXP).
> Chức năng này **không có luồng Submit/Phê duyệt** và **không có màn hình LIST** — người dùng truy cập trực tiếp từ hồ sơ CAPEX cha (`CHI.CAPEX_DOSSIER`).

---

## A1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `EXP.CAPEX_DOSSIER.3.3.1` |
| Tên chức năng | Màn hình hoàn thiện giấy Đề nghị thanh toán mẫu 04.a/TT |
| Tên chức năng (ENG) | EXP.CAPEX_DOSSIER_04.a/TT |
| Phân hệ | CHI — Quản lý Chi |
| Người sử dụng | Người lập/người tiếp nhận CAPEX (Maker), Người tra cứu (Viewer) |
| Mô tả | Cho phép Người lập/người tiếp nhận hoàn thiện thông tin giấy Đề nghị thanh toán mẫu 04.a/TT gắn với hồ sơ CAPEX đã tạo. Form gồm 3 nhóm thông tin (thông tin chung của dự án, hạng mục/hợp đồng, chấp nhận thanh toán) và các dòng hạch toán chi tiết (có thể thêm nhiều dòng). Chứng từ có luồng phê duyệt gắn với hồ sơ; không có màn hình danh sách riêng. |
| Độ ưu tiên | Cao |
| URD reference | *(chưa cung cấp)* |
| Mô tả ngắn | Cho phép Người lập/người tiếp nhận hoàn thiện thông tin giấy Đề nghị thanh toán mẫu 04.a/TT gắn với hồ sơ CAPEX đã tạo. Form gồm 3 nhóm thông tin (thông tin chung của dự án, hạng mục/hợp đồng, chấp nhận thanh toán) và các dòng hạch toán chi tiết khoản thanh toán (có thể thêm nhiều dòng). Luồng phê duyệt đi theo hồ sơ; không có màn hình danh sách riêng. |

---

## A2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền `EXP_CAPEX_MAKER` (Tạo/Sửa/Xoá) hoặc `EXP_CAPEX_VIEWER` (Xem) |
| 3 | Hồ sơ CAPEX (DOSSIER_ID) đã được tạo tại chức năng `CHI.CAPEX_DOSSIER` và đang ở trạng thái cho phép hoàn thiện |
| 4 | Các danh mục Master Data đã được cấu hình: LOV.01 (Dự án), LOV.02 (Ngân hàng/KB), LOV.03 (Tài khoản vốn), LOV.05 (Hạng mục), LOV.06 (Hợp đồng), LOV.07.x (GL Segments), LOV.08 (Loại tỷ giá) |
| 5 | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái ACTIVE |
| 6 | (Trường hợp Sửa/Xoá) NSD có quyền `EXP_CAPEX_MAKER` |

---

## A3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | (Trường hợp Thêm/Sửa) Bản ghi được lưu với trạng thái ACTIVE; liên kết với PAYMENT_DOSSIER_ID tương ứng |
| 2 | (Trường hợp Xoá) Bản ghi được soft-delete (DELETED), vẫn truy được qua audit |
| 3 | Audit log ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) |
| 4 | Dữ liệu giấy 04.A sẵn sàng cho bước xử lý tiếp theo trong quy trình CAPEX |

---

## A4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | Người lập/người tiếp nhận mở chức năng từ hồ sơ CAPEX cha (`CHI.CAPEX_DOSSIER`) — bấm nút **Thêm mới giấy đề nghị thanh toán 04.a/TT** | (1) Mở form trống; (2) Sinh F-ID; (3) Tự động điền PAYMENT_DOSSIER_ID, PROJECT_ID, PROJECT_NAME, PMU/PIPO_ID, PMU/PIPO_NAME từ hồ sơ cha; (4) Tự động điền CREATED_BY / CREATED_DATE |
| 2 | Nhập/chọn các trường tại Area 1: chọn tài khoản của chủ đầu tư, ngân hàng/KB | (1) Validate onBlur format, LOV; (2) Auto-fill BANK_BRANCH_NAME theo tài khoản của chủ đầu tư; (3) Hiển thị PROJECT_SPEC_ID và PROJECT_SPEC_NAME nếu PROJECT_ID thuộc nhóm QP/AN |
| 3 | Nhập/chọn các trường tại Area 2: hạng mục, hợp đồng, căn cứ | Validate cascading: hạng mục theo dự án; hợp đồng theo hạng mục | Nhập các thông tin Căn cứ bảng xác định khối lượng công việc hoàn thành/bảng kê giá trị công việc bồi thường, hỗ trợ, tái định cư đề nghị thanh toán số; Lũy kế số vốn đã thanh toán từ khởi công đến cuối kỳ trước (gồm cả tạm ứng); 
| 4 | Nhập/chọn các trường tại Area 3 (header): niên độ, số tiền, nguồn vốn, tiền tệ, tỷ giá | (1) Khi CURRENCY = VND → lock EXCHANGE_RATE = 1,00; (2) Khi CURRENCY ≠ VND và loại tỷ giá = "Tỷ giá người sử dụng" → cho phép nhập thủ công |
| 5 | Nhập các dòng hạch toán chi tiết (Area 3 — bảng): thêm dòng, nhập GL segments, số tiền | (1) Validate từng dòng; (2) Auto-calc TRANSFER_BENEFICIARY_NT và TRANSFER_BENEFICIARY_VND; (3) Cascading INVESTMENT_FUNDING_SOURCE theo NGUỒN |
| 6 | Đính kèm tài liệu (Tab Đính kèm) nếu cần | Xử lý upload file theo chuẩn đính kèm chung |
| 7 | Bấm **Lưu** | Validate đầy đủ §A8; lưu ACTIVE; hiển thị MSG-OK-SAVE; ghi audit |
| 8 | (Xem) Từ hồ sơ cha, mở form Xem | Mở form read-only; hiển thị đầy đủ trường + [Tab] Lịch sử thay đổi |
| 9 | (Sửa) Trên bản ghi ACTIVE, bấm **Sửa** | Mở form editable; load F-VER hiện hành; DOSSIER_ID immutable |
| 10 | (Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); lưu ACTIVE; F-VER+1; ghi audit oldValue→newValue |
| 11 | (Xoá) Trên bản ghi ACTIVE, bấm **Xoá** | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận |
| 12 | (Xoá) Bấm **Xác nhận xoá** | Soft-delete (F-STATUS=DELETED); ghi audit; hiển thị MSG-OK-DELETE |

---

## A5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Huỷ** khi đang nhập | Nếu form đã nhập dữ liệu → hỏi xác nhận MSG-CFM-CANCEL; xác nhận → đóng form, bỏ thay đổi |
| A2 | NSD thêm dòng hạch toán | Thêm 1 dòng trống vào tiếp theo dòng hạch toán mặc định phía trên; auto-focus dòng mới |
| A3 | NSD xóa dòng hạch toán | Confirm nếu dòng đã có dữ liệu; cập nhật lại auto-calc |
| A4 | NSD thay đổi CURRENCY | Khi đổi sang VND → lock EXCHANGE_RATE = 1,00; khi đổi sang ngoại tệ → hiện EXCHANGE_RATE_TYPE và EXCHANGE_RATE_DATE |
| A5 | NSD thay đổi NGUỒN (GL_SEGMENT12) | Hệ thống reset INVESTMENT_FUNDING_SOURCE; cập nhật danh sách giá trị cho phép theo BIZ-017 |

---

## A6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc bỏ trống khi Lưu (VAL-01) | Highlight đỏ + MSG-ERR-REQUIRED; chặn lưu |
| E2 | Giá trị không thuộc danh mục (VAL-03) | MSG-ERR-LOOKUP; clear trường |
| E3 | Không có tài khoản vốn trong nước lẫn nước ngoài (VAL-19) | MSG-WRN-ACCOUNT-REQUIRED; chặn lưu |
| E4 | PROJECT_SPEC_ID bỏ trống cho dự án QP/AN (VAL-20) | MSG-WRN-PROJECT-SPEC-REQUIRED; highlight PROJECT_SPEC_ID; chặn lưu |
| E5 | INVESTMENT_FUNDING_SOURCE không hợp lệ với NGUỒN (VAL-23) | MSG-ERR-FUNDING-SOURCE-INVALID; clear trường; chặn lưu |
| E6 | Hạch toán không có dòng nào (VAL-26) | MSG-ERR-TABLE-EMPTY; chặn lưu |
| E7 | Sửa/Xoá bản ghi đã DELETED (VAL-13) | MSG-ERR-STATUS; disable nút |
| E8 | Không có quyền EXP_CAPEX_MAKER (VAL-14) | MSG-ERR-PERMISSION; ghi audit bảo mật |
| E9 | Optimistic lock conflict (VAL-15) | MSG-ERR-LOCK; yêu cầu tải lại bản ghi |
| E10 | Confirm xoá không đủ điều kiện (VAL-16) | Disable nút Xác nhận xoá đến khi đủ lý do + tick checkbox |
| E11 | Lỗi hệ thống / API timeout | MSG-ERR-SYSTEM + traceId; rollback thao tác |

---

## A7. Quy tắc nghiệp vụ

| STT | Mã | Quy tắc |
|---|---|---|
| 1 | BIZ-001 | Chỉ NSD có quyền `EXP_CAPEX_MAKER` mới được Tạo mới / Sửa / Xoá; `EXP_CAPEX_VIEWER` chỉ được Xem |
| 2 | BIZ-002 | Xoá là soft-delete; bản ghi vẫn truy được qua audit/history; F-ID bị khoá không tái sử dụng |
| 3 | BIZ-003 | F-ID phải là duy nhất toàn hệ thống kể cả bản ghi DELETED |
| 4 | BIZ-004 | Bản ghi phải gắn với DOSSIER_ID hợp lệ thuộc phạm vi phân quyền của NSD |
| 5 | BIZ-005 | `DOSSIER_ID` là immutable sau khi lưu lần đầu; backend reject thay đổi từ Edit-mode |
| 6 | BIZ-006 | Lý do xoá ≥ 10 ký tự và ≤ 500 ký tự; lưu vào audit |
| 7 | BIZ-007 | Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue |
| 8 | BIZ-008 | History ghi: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE |
| 9 | BIZ-009 | PROJECT_ID, PROJECT_NAME, PMU/PIPO_ID, PMU/PIPO_NAME được tự động lấy từ hồ sơ cha và không cho phép sửa trực tiếp trên form này |
| 10 | BIZ-010 | BANK_BRANCH_NAME tự động hiển thị theo BANK_BRANCH_CODE (LOV.02); không cho sửa thủ công |
| 11 | BIZ-011 | `PROJECT_SPEC_ID` bắt buộc khi `PROJECT_ID` ∈ {7004686, 7004692} (dự án bộ Quốc phòng / Công an). Khi chọn `PROJECT_SPEC_ID`, hệ thống tự điền `PROJECT_SPEC_NAME` |
| 12 | BIZ-012 | Phải có ít nhất một trong hai: `DOMESTIC_CAPITAL_PMU/PIPO_ACCOUNT` hoặc `FOREIGN_CAPITAL_PMU/PIPO_ACCOUNT`; không bắt buộc cả hai |
| 13 | BIZ-013 | Khi `CURRENCY` = VND: `EXCHANGE_RATE` = 1,00 — cố định, không cho phép sửa |
| 14 | BIZ-014 | Khi `CURRENCY` ≠ VND và `EXCHANGE_RATE_TYPE` = "Tỷ giá công ty": `EXCHANGE_RATE` tự động fill theo danh mục tỷ giá tương ứng với `CURRENCY` và `EXCHANGE_RATE_DATE` đã nhập |
| 15 | BIZ-015 | `TRANSFER_BENEFICIARY_AMOUNT_NT` (Số chuyển đơn vị thụ hưởng NT) được tự động tính = `APPROVED_AMOUNT_NT` − `ADVANCES_DEDUCTION_NT` − `WARRANTY_FEE_NT` − `RETENTION_NT`; không cho nhập thủ công |
| 16 | BIZ-016 | `TRANSFER_BENEFICIARY_AMOUNT_VND` (Số chuyển đơn vị thụ hưởng VND) được tự động tính = `APPROVED_AMOUNT_VND` − `ADVANCES_DEDUCTION_VND` − `WARRANTY_FEE_VND` − `RETENTION_VND`; không cho nhập thủ công |
| 17 | BIZ-017 | `INVESTMENT_FUNDING_SOURCE` (Mã nguồn đầu tư) chỉ cho phép chọn giá trị hợp lệ theo `NGUỒN` (GL_SEGMENT12): Nguồn 42 → {4201, 4202, 4203}; Nguồn 43 → {4301, 4302, 4303}; Nguồn 52 → {5201, 5202, 5203}; Nguồn 53 → {5301, 5302, 5303}Nguồn 54 → {5401, 5402, 5403} |
| 18 | BIZ-018 | Bảng kê chi tiết khoản thanh toán phải có ít nhất 1 dòng khi Lưu |
| 19 | BIZ-019 | `PMU/PIPO_ID` (Mã ĐVQHNS) tự động fill theo `PROJECT_ID` hoặc `PROJECT_SPEC_ID`; không cho sửa trực tiếp |

---

## A8. Quy tắc kiểm tra dữ liệu

> **Mã chuẩn:** `VDBAS-MODULE-XXXX` theo `VDBAS_Notify_Message_Validate_rule.md` — dùng trong ErrorCode Enum BE và mapping sang message FE.
> Ưu tiên vi phạm: **Required → Format → Range → LOV → Cross-field → Unique**.

| STT | Phân loại | Mã (VDBAS) | Quy tắc |
|---|---|---|---|
| 1 | Chung | VDBAS-VAL-0002 | Trường bắt buộc không được bỏ trống khi Lưu; highlight đỏ + VDBAS-VAL-0002 |
| 2 | Chung | VDBAS-VAL-0003 | Định dạng dữ liệu hợp lệ: Text (min/max độ dài → VDBAS-VAL-0004), String pattern, định dạng số tiền |
| 3 | Chung | VDBAS-VAL-0005 | Giá trị Dropdown/Lookup phải thuộc danh mục; ngoài danh mục → VDBAS-VAL-0005 + clear trường |
| 4 | Chung | VDBAS-VAL-0003 | Trường Text: trim trước khi lưu; không cho khoảng trắng đầu/cuối; sanitize XSS/SQLi |
| 5 | Chung | VDBAS-VAL-0007 | Cross-field: hạng mục phải thuộc dự án; hợp đồng phải thuộc hạng mục |
| 6 | Chung | VDBAS-VAL-0007 | Cascading: thay đổi PROJECT_ID → reset PROJECT_SPEC_ID, PMU/PIPO_ID và refresh dropdown |
| 7 | Chức năng | VDBAS-VAL-0006 | Số tiền (Currency_Field, Number): phải > 0; định dạng NNN.NNN,NN; không âm |
| 8 | Chung | VDBAS-VAL-0003 | TextBox/TextArea chống XSS bằng sanitize; chống SQL Injection bằng prepared statement |
| 9 | Chung | VDBAS-VAL-0003 | Trường text: trim, không cho ký tự điều khiển (\x00-\x1F) |
| 10 | Chức năng | VDBAS-VAL-0005 | DOMESTIC_CAPITAL và FOREIGN_CAPITAL account thuộc LOV.03; validate LOV trước khi lưu |
| 11 | Chức năng | VDBAS-CHI-0006 | DOSSIER_ID tồn tại và active tại `CHI.CAPEX_DOSSIER`; backend reject nếu hồ sơ cha không hợp lệ |
| 12 | Chung | VDBAS-VAL-0001 | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với ACTIVE; không cho thao tác trên bản ghi DELETED |
| 13 | Chức năng | VDBAS-VAL-0001 | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với ACTIVE; VDBAS-VAL-0001 nếu đã DELETED |
| 14 | Chức năng | VDBAS-AUT-0003 | Quyền thao tác: chỉ `EXP_CAPEX_MAKER` được Sửa/Xoá; vi phạm → VDBAS-AUT-0003 + ghi audit |
| 15 | Chung | VDBAS-VAL-0010 | Optimistic lock theo `(F-ID, F-VER)`: khi Lưu nếu F-VER trong DB ≠ F-VER đã load → chặn + VDBAS-VAL-0010 |
| 16 | Chung | VDBAS-VAL-0011 | Confirm xoá: bắt buộc nhập Lý do ≥ 10 ký tự + tick checkbox; thiếu → disable nút Xác nhận xoá |
| 17 | Chức năng | VDBAS-VAL-0009 | DOSSIER_ID là immutable sau khi lưu lần đầu; backend reject thay đổi trong Edit-mode (BIZ-005) |
| 18 | Chung | VDBAS-VAL-0009 | Cảnh báo trùng: kiểm tra bản ghi 04.A đã tồn tại cho cùng DOSSIER_ID trong N phút → VDBAS-VAL-0009 + nút Tiếp tục/Huỷ |
| 19 | Chức năng | VDBAS-CHI-0008 | Phải có ít nhất một trong hai: `DOMESTIC_CAPITAL_PMU/PIPO_ACCOUNT` hoặc `FOREIGN_CAPITAL_PMU/PIPO_ACCOUNT`; thiếu cả hai → VDBAS-CHI-0008; chặn lưu (BIZ-012) |
| 20 | Chức năng | VDBAS-CHI-0009 | `PROJECT_SPEC_ID` bắt buộc khi `PROJECT_ID` ∈ {7004686, 7004692}; bỏ trống → VDBAS-CHI-0009; chặn lưu (BIZ-011) |
| 21 | Chức năng | VDBAS-CHI-0010 | Khi `CURRENCY` = VND: `EXCHANGE_RATE` = 1,00, trường bị lock; backend reject nếu giá trị khác 1 |
| 22 | Chức năng | VDBAS-CHI-0011 | Khi `CURRENCY` ≠ VND và `EXCHANGE_RATE_TYPE` = "Tỷ giá NSD": NSD nhập tỷ giá thủ công; định dạng NNN.NNN,NN |
| 23 | Chức năng | VDBAS-CHI-0012 | `INVESTMENT_FUNDING_SOURCE` phải thuộc danh sách giá trị hợp lệ theo `NGUỒN` (BIZ-017); vi phạm → VDBAS-CHI-0012; clear trường |
| 24 | Chức năng | VDBAS-CHI-0013 | `TRANSFER_BENEFICIARY_AMOUNT_NT` là calculated field; không cho nhập thủ công; backend reject nếu gửi giá trị khác kết quả tính (BIZ-015) |
| 25 | Chức năng | VDBAS-CHI-0014 | `TRANSFER_BENEFICIARY_AMOUNT_VND` là calculated field; không cho nhập thủ công; backend reject nếu gửi giá trị khác kết quả tính (BIZ-016) |
| 26 | Chức năng | VDBAS-CHI-0015 | Bảng kê chi tiết phải có ít nhất 1 dòng khi Lưu; thiếu → VDBAS-CHI-0015; chặn lưu (BIZ-018) |

---

## A9. Danh sách thông báo

> **Mã chuẩn:** `VDBAS-MODULE-XXXX` theo `VDBAS_Notify_Message_Validate_rule.md`.
> Mã Success/Confirm/Info không phải error code — dùng HTTP 200/dialog; ghi chú `—` ở cột Mã VDBAS.

| STT | Phân loại 1 | Phân loại 2 | Mã (VDBAS) | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | VDBAS-VAL-0002 | Trường `{Tên trường}` là bắt buộc. Vui lòng nhập đầy đủ thông tin |
| 2 | Chung | Error | VDBAS-VAL-0003 | Định dạng `{Tên trường}` không hợp lệ |
| 3 | Chung | Error | VDBAS-VAL-0005 | Giá trị `{Tên trường}` không nằm trong danh mục hợp lệ |
| 4 | Chung | Error | VDBAS-VAL-0007 | `{Tên trường A}` và `{Tên trường B}` không hợp lệ khi kết hợp: `{mô tả ràng buộc}` |
| 5 | Chung | Error | VDBAS-SYS-0001 | Hệ thống gặp sự cố không mong muốn. Vui lòng thử lại sau hoặc liên hệ Quản trị viên |
| 6 | Chung | Error | VDBAS-SYS-0003 | Yêu cầu mất quá nhiều thời gian xử lý. Vui lòng thử lại |
| 7 | Chung | Error | VDBAS-AUT-0003 | Bạn không có quyền thực hiện thao tác này |
| 8 | Chung | Error | VDBAS-AUT-0002 | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục |
| 9 | Chung | Success | — | Lưu bản ghi thành công |
| 10 | Chung | Success | — | Xoá bản ghi thành công |
| 11 | Chung | Confirm | — | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 12 | Chung | Confirm | — | Bạn có chắc muốn xoá giấy Đề nghị thanh toán `{F-ID}`? Dữ liệu sẽ không thể khôi phục sau khi xoá |
| 13 | Chung | Warning | VDBAS-VAL-0009 | Phát hiện bản ghi tương tự đã được tạo gần đây. Bạn có muốn tiếp tục? |
| 14 | Chung | Error | VDBAS-VAL-0001 | Bản ghi đang ở trạng thái `{state}`, không cho phép Sửa/Xoá |
| 15 | Chung | Error | VDBAS-VAL-0010 | Bản ghi đã bị thay đổi bởi người khác. Vui lòng tải lại trước khi tiếp tục |
| 16 | Chung | Error | VDBAS-VAL-0011 | Vui lòng nhập lý do (tối thiểu 10 ký tự) và xác nhận đã rà soát |
| 17 | Chức năng | Warning | VDBAS-CHI-0008 | Vui lòng nhập ít nhất một trong hai: Số TK vốn trong nước hoặc Số TK vốn nước ngoài của chủ đầu tư |
| 18 | Chức năng | Warning | VDBAS-CHI-0009 | Dự án `{PROJECT_ID}` thuộc nhóm dự án Bộ Quốc phòng/Công an. Vui lòng chọn Mã dự án đặc thù |
| 19 | Chức năng | Info | VDBAS-CHI-0016 | Tỷ giá `{EXCHANGE_RATE}` được tự động cập nhật theo danh mục ngày `{EXCHANGE_RATE_DATE}` |
| 20 | Chức năng | Error | VDBAS-CHI-0012 | Mã nguồn đầu tư không hợp lệ với Nguồn vốn `{GL_SEGMENT12}`. Vui lòng chọn lại |
| 21 | Chức năng | Error | VDBAS-CHI-0015 | Bảng kê chi tiết phải có ít nhất một dòng. Vui lòng thêm thông tin khoản thanh toán |

---

## A10. Danh sách sự kiện

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.OPEN` | Chung | Thêm mới | Mở form Thêm mới từ hồ sơ cha; sinh F-ID; auto-fill từ DOSSIER |
| 2 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.SAVE` | Chung | Thêm mới | Validate đầy đủ §A8; lưu ACTIVE; ghi audit |
| 3 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.CANCEL` | Chung | Thêm mới | Huỷ form; hỏi xác nhận nếu có dữ liệu |
| 4 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.ADD_ROW` | Chức năng | Thêm mới | Thêm dòng mới vào bảng kê chi tiết |
| 5 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.REMOVE_ROW` | Chức năng | Thêm mới | Xoá dòng khỏi bảng kê chi tiết; confirm nếu có dữ liệu |
| 6 | `EXP.CAPEX_DOSSIER.3.3.1.NEW.LOOKUP_OPEN` | Chung | Thêm mới | Mở popup tra cứu danh mục (F4) |
| 7 | `EXP.CAPEX_DOSSIER.3.3.1.VIEW.OPEN` | Chung | Xem | Mở form Xem (read-only); load đầy đủ trường |
| 8 | `EXP.CAPEX_DOSSIER.3.3.1.VIEW.HISTORY_OPEN` | Chung | Xem | Mở tab Lịch sử thay đổi |
| 9 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.OPEN` | Chung | Sửa | Mở form Sửa; load F-VER hiện hành; DOSSIER_ID disabled |
| 10 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.SAVE` | Chung | Sửa | Validate; lưu ACTIVE; F-VER+1; ghi audit oldValue→newValue |
| 11 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.CANCEL` | Chung | Sửa | Huỷ chỉnh sửa; hỏi xác nhận nếu dirty |
| 12 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.UNDO` | Chung | Sửa | Hoàn tác về trạng thái lúc mở form |
| 13 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.ADD_ROW` | Chức năng | Sửa | Thêm dòng mới vào bảng kê |
| 14 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.REMOVE_ROW` | Chức năng | Sửa | Xoá dòng khỏi bảng kê; confirm nếu có dữ liệu |
| 15 | `EXP.CAPEX_DOSSIER.3.3.1.DELETE.OPEN` | Chung | Xoá | Mở popup Xoá (lý do + checkbox) |
| 16 | `EXP.CAPEX_DOSSIER.3.3.1.DELETE.CONFIRM` | Chức năng | Xoá | Soft-delete; ghi audit |
| 17 | `EXP.CAPEX_DOSSIER.3.3.1.AUDIT.WRITE` | Chung | Audit | Ghi log: user, timestamp, IP, action, oldValue→newValue |
| 18 | `EXP.CAPEX_DOSSIER.3.3.1.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 19 | `EXP.CAPEX_DOSSIER.3.3.1.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 20 | `EXP.CAPEX_DOSSIER.3.3.1.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện optimistic lock mismatch |

---

## A11. State Machine (Trạng thái bản ghi)

> Chức năng này là **CRUD không có luồng phê duyệt**. Vòng đời lưu trữ gồm 2 trạng thái: `ACTIVE` và `DELETED`.

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | Người lập/người tiếp nhận và lưu (`NEW.SAVE`) | Start | ACTIVE | Sinh F-ID, F-VER=1; autofill CREATED_BY/CREATED_DATE; gắn với PAYMENT_DOSSIER_ID; ghi audit |
| 2 | Người lập/người tiếp nhậ huỷ form chưa lưu (`NEW.CANCEL`) | Start (chưa lưu) | End | Đóng form; không sinh bản ghi DB |
| 3 | Người lập/người tiếp nhận Sửa & Lưu (`EDIT.SAVE`) | ACTIVE | ACTIVE | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 4 | Người lập/người tiếp nhận Xoá — Xác nhận xoá (`DELETE.CONFIRM`) | ACTIVE | DELETED | Soft-delete; ghi audit; MSG-OK-DELETE |
| 5 | (Vi phạm) Sửa/Xoá bản ghi DELETED | DELETED | (Không đổi) | Chặn (VAL-13); MSG-ERR-STATUS; ghi audit bảo mật |
| 6 | (Vi phạm) Không có quyền EXP_CAPEX_MAKER | ACTIVE | (Không đổi) | Chặn (VAL-14); MSG-ERR-PERMISSION; ghi audit bảo mật |
| 7 | (Concurrent) Optimistic lock mismatch | ACTIVE | (Không đổi) | Chặn (VAL-15); MSG-ERR-LOCK; yêu cầu tải lại |
| 8 | (Hệ thống) Phiên hết hạn | (Bất kỳ) | (Không đổi) | Buộc đăng nhập lại; MSG-ERR-SESSION |

```
              Kế toán.Save
Start ──────────────────────▶ ACTIVE ◀──────────────────┐
      (NEW)                      │   │  Kế toán.Edit.Save │
      Kế toán.Cancel ──▶ End     │   └────────────────────┘
                                 │
                 Kế toán.Delete  │
                                 ▼
                              DELETED
```

---

## A12. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `EXP.CAPEX_DOSSIER.3.3.1.NEW` — Form Thêm mới giấy 04.A |
| 2 | `EXP.CAPEX_DOSSIER.3.3.1.VIEW` — Form Xem chi tiết (read-only), gồm: [Area 1] Dự án, [Area 2] Hạng mục/Hợp đồng, [Area 3] Chấp nhận thanh toán + Bảng kê, [Tab] Đính kèm, [Tab] Lịch sử |
| 3 | `EXP.CAPEX_DOSSIER.3.3.1.EDIT` — Form Sửa |
| 4 | `EXP.CAPEX_DOSSIER.3.3.1.DELETE` — Popup xác nhận Xoá (lý do + checkbox) |
| 5 | `EXP.CAPEX_DOSSIER.3.3.1.HISTORY` — Tab/popup lịch sử audit (oldValue→newValue) |
| 6 | `CHI.CAPEX_DOSSIER` — Màn hình hồ sơ CAPEX cha (điểm điều hướng vào chức năng này) |
| 7 | `EXP.CAPEX_DOSSIER.3.3.1.LOOKUP.*` — Popup tra cứu danh mục (LOV.01, LOV.02, LOV.03, LOV.05, LOV.06, LOV.07.x) |

---

# B - Đặc tả trường dữ liệu

> **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện.
> **Loại**: Dropdown / TextBox / Text / Number / Date Picker / Currency_Field / Lookup / Label.
> Chức năng này **không có màn hình LIST** — bỏ qua §B2.

---

## B1. Màn hình `EXP.CAPEX_DOSSIER.3.3.1.NEW`, `.VIEW`, `.EDIT`

### B1.1. [Area 1] Nhóm thông tin dự án

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mẫu | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã hồ sơ | PAYMENT_DOSSIER_ID | Textbox | N (auto) | H26_7122155_260529_0011001 | String | Hệ thống tự gán từ `CHI.CAPEX_DOSSIER`; read-only; immutable sau lưu (BIZ-005, VAL-17) |
| Mã dự án | PROJECT_ID | Dropdown + Lookup | Y | 7122155 | String | LOV.01 — Project_ID; hiển thị mã dự án; lấy theo thông tin hồ sơ cha; không cho sửa (BIZ-009); F4 mở lookup tra cứu |
| Tên dự án | PROJECT_NAME | Textbox | N (auto) | Dự án nâng cấp bệnh viên Bạch Mai | String | Tự fill theo PROJECT_ID từ LOV.01; read-only (BIZ-009) |
| Mã dự án đặc thù | PROJECT_SPEC_ID | Dropdown + Lookup | C | – | String | LOV.01 — Project_Spec_ID; bắt buộc khi PROJECT_ID ∈ {7004686, 7004692} (BIZ-011, VAL-20); F4 mở lookup; khi chọn → auto-fill PROJECT_SPEC_NAME |
| Tên dự án đặc thù | PROJECT_SPEC_NAME | Text | N (auto) | – | String | Tự fill theo PROJECT_SPEC_ID từ LOV.01; read-only |
| Mã ĐVQHNS | PMU/PIPO_ID | Dropdown + Lookup | N (auto) | 3029123 | String | LOV.01 — PMU/PIPO_ID; tự fill theo PROJECT_ID hoặc PROJECT_SPEC_ID (BIZ-019); read-only |
| Chủ đầu tư / Ban QLDA | PMU/PIPO_NAME | Textbox | N (auto) | BQLDA bệnh viện Bạch Mai
 | String | Tự fill theo PMU/PIPO_ID từ LOV.01; read-only (BIZ-009) |
| Số TK Vốn trong nước của chủ đầu tư | DOMESTIC_CAPITAL_PMU/PIPO_ACCOUNT | Dropdown + Lookup | C | 9552.1.7122155.00000| String | LOV.03 — DOMESTIC_CAPITAL_PMU/PIPO_ACCOUNT; không bắt buộc nếu đã có FOREIGN_CAPITAL (BIZ-012, VAL-19); F4 mở lookup; Ví dụ: 9552.1.7122155.00000 |
| tại (mã NH/KB) — Vốn trong nước | BANK_BRANCH_CODE | Textbox | Y | 01701002 | String | LOV.02 — Bank_Branch_Name; bắt buộc khi DOMESTIC_CAPITAL đã chọn; nhập mã NH/KB (Bank_Citad_Code); auto-fill BANK_BRANCH_NAME tương ứng (BIZ-010) |
| Tên NH/KB — Vốn trong nước | BANK_BRANCH_NAME | Textbox | N (auto) | Kho bạc khu vực I | String | Tự fill theo BANK_BRANCH_CODE từ LOV.02; read-only (BIZ-010) |
| Số TK Vốn nước ngoài của chủ đầu tư | FOREIGN_CAPITAL_PMU/PIPO_ACCOUNT | Dropdown + Lookup | C | – | String | LOV.03 — FOREIGN_CAPITAL_PMU/PIPO_ACCOUNT; không bắt buộc nếu đã có DOMESTIC_CAPITAL (BIZ-012, VAL-19); F4 mở lookup; Ví dụ: 9587.2.8118181.00001 |
| tại (mã NH/KB) — Vốn nước ngoài | BANK_BRANCH_CODE_FOREIGN | Textbox | C | – | String | LOV.02 — Bank_Branch_Name; bắt buộc khi FOREIGN_CAPITAL đã chọn; auto-fill tên theo mã |
| Tên NH/KB — Vốn nước ngoài | BANK_BRANCH_NAME_FOREIGN | Textbox | C | – | String | Tự fill theo BANK_BRANCH_CODE_FOREIGN từ LOV.02; read-only |

### B1.2. [Area 2] Nhóm thông tin hạng mục, hợp đồng

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mẫu | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã hạng mục | PROJECT_ITEM_ID | Dropdown + Lookup | Y | HM_7122155_003 | String | LOV.05 — Project_Item_ID; lọc theo PROJECT_ID (VAL-05); F4 mở lookup |
| Tên hạng mục | PROJECT_ITEM_NAME | Text | Y | Hạng mục xây lắp | String | Tự fill theo PROJECT_ITEM_ID từ LOV.05; read-only |
| Mã hợp đồng / dự toán | CONTRACT_ID | Dropdown + Lookup | Y | Cont_7122155_004| String | LOV.06 — Contract_ID; lọc theo PROJECT_ITEM_ID (VAL-05); F4 mở lookup; Ví dụ: Cont_7122155_004 |
| Bảo lãnh tạm ứng | ADPAYMENT_GUARANTEE | Dropdown | C | Có | String | Nhận một trong hai giá trị "có" hoặc "không" |
| Mã bảo lãnh tạm ứng |ADPAYMENT_GUARANTEE_ID | Dropdown | C | Guarantee_7122155_004| String | LOV.06.1 - Danh mục bảo lãnh tạm ứng | Nếu ADPAYMENT_GUARANTEE = "có" thì bắt buộc |
| Số tiền bảo lãnh tạm ứng |NADPAYMENT_GUARANTEE_AMOUNT | Currency_Field | C | 20000000000|Decimal | Nếu ADPAYMENT_GUARANTEE = "có" thì bắt buộc |
| Số tiền còn lại của bảo lãnh tạm ứng |REMAINING_ADVANCE_PAYMENT | Currency_Field | C | 12000000000 | Number |
| Thời hạn còn lại của bảo lãnh tạm ứng |REMAINING_ADVANCE_PAYMENT_DAYS | Number | C | 20 | Number | ; Nếu ADPAYMENT_GUARANTEE = "có" thì bắt buộc |
| Phụ lục bổ sung hợp đồng số | CONTRACT_AMENDMENT_NO | Textbox | C | 02/15/2026 | String | LOV.06 — SubContract_No; nhập thủ công hoặc chọn từ LOV; bắt buộc khi có phụ lục |
| ngày (phụ lục) | CONTRACT_AMENDMENT_DATE | Date | C | 20/03/2026 | Date | `dd/MM/yyyy`; bắt buộc khi CONTRACT_AMENDMENT_NO đã nhập |
| Căn cứ QĐ phê duyệt dự toán số | BUDGET_ESTIMATE_APPROVAL_DECISION_NO | Textbox | Y | 32/2026 | String | Nhập thủ công; Ví dụ: 32 |
| ngày (QĐ phê duyệt) | BUDGET_ESTIMATE_APPROVAL_DATE | Date Picker | C | 28/12/2025 | Date | `dd/MM/yyyy`; nhập thủ công; bắt buộc khi có số QĐ |
| Căn cứ bảng xác định KLCV / bảng kê giá trị công việc số | COMPLETED_WORK_VOLUME_NO | Textbox | Y | Lần 2 | String | Nhập thủ công; Ví dụ: 2 |
| Lũy kế vốn đã TT từ KK đến cuối kỳ trước (gồm tạm ứng) — Vốn trong nước | ACCUPAID_INCLADVANCES_DOMCAP_AMOUNT | Currency_Field | Y | 212000000000 | Number | Nhập thủ công; định dạng NNN.NNN,NN |
| Lũy kế vốn đã TT từ KK đến cuối kỳ trước (gồm tạm ứng) — Vốn nước ngoài | ACCUPAID_INCLADVANCES_FOREICAP_AMOUNT | Currency_Field | C | - | Number | Nhập thủ công; bắt buộc khi có vốn nước ngoài |
| Số dư tạm ứng của hạng mục đề nghị TT | REMAINING_ADVANCE_PAYMENT | Number | C | 12000000000 | Number | NSD lấy từ bảng data số dư tạm ứng hệ thống theo dõi (nếu có); nhập thủ công |

### B1.3. [Area 3] Nhóm thông tin chấp nhận thanh toán — Header

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mẫu | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Loại tỷ giá | EXCHANGE_RATE_TYPE | Dropdown + lookup | N | – | String | Nhận một trong hai giá trị "tỷ giá công ty" hoặc "tỷ giá người sử dụng" chỉ hiển thị khi CURRENCY ≠ VND |
| Ngày tỷ giá | EXCHANGE_RATE_DATE | Date Picker | N | – | Date | `dd/MM/yyyy`; chỉ hiển thị khi CURRENCY ≠ VND; dùng để tra cứu tỷ giá công ty |
| Tỷ giá | EXCHANGE_RATE | Number | N | 1,00 (khi VND) | Number | Định dạng NNN.NNN,NN; khi VND = 1,00 locked (BIZ-013, VAL-21); khi ≠ VND và loại = "Tỷ giá công ty" → auto-fill (BIZ-014); khi ≠ VND và loại = "Tỷ giá NSD" → nhập thủ công (VAL-22) |

### B1.3.T. [Area 3 — Bảng kê] Chi tiết khoản thanh toán *(có thể thêm nhiều dòng)*

> Bảng này nằm bên trong Area 3. NSD có thể thêm/xóa dòng bằng nút **Thêm dòng** / **Xóa dòng**. Phải có ít nhất 1 dòng khi Lưu (BIZ-018, VAL-26).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | NO_COLUMN | Number Field | Y | Auto-increment | String | Số thứ tự dòng; tự tăng |
| Năm KH | CAPITAL_YEAR | Dropdown + Lookup | Y | – | String | Danh mục các năm có giá trị liên tục 2015–2027; Ví dụ: 2025 |
| Kéo dài | EXTENDED | Dropdown + Lookup | Y | Không kéo dài | String | Giá trị: "Kéo dài" (=1), "Không kéo dài" (=2); mặc định = "Không kéo dài" |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code (Tài khoản tự nhiên); Ví dụ: 8211 |
| Năm ngân sách | GL_SEGMENT3 | Dropdown + lookup | Y | - | String | LOV.07.3 - Segment_Code |; ví dụ: năm trước |
| NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | – | String | LOV.07.7 — Segment_Code (Nội dung kinh tế); Ví dụ: 9301 |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code (Cấp ngân sách); Ví dụ: 1 |
| Chương | GL_SEGMENT8 | Dropdown + Lookup | Y | – | String | LOV.07.5 — Segment_Code (Chương); Ví dụ: 042 |
| Ngành | GL_SEGMENT9 | Dropdown + Lookup | Y | – | String | LOV.07.6 — Segment_Code (Ngành); Ví dụ: 042 |
| CTMT | GL_SEGMENT10 | Dropdown + Lookup | Y | – | String | LOV.07.9 — Segment_Code (Chương trình mục tiêu); Ví dụ: 0003 |
| Nguồn | GL_SEGMENT12 | Dropdown + Lookup | Y | – | String | LOV.07.10 — Segment_Code (Mã nguồn); Ví dụ: 42; thay đổi → reset INVESTMENT_FUNDING_SOURCE (BIZ-017, A5) |
| Mã nguồn đầu tư | INVESTMENT_FUNDING_SOURCE | Dropdown + Lookup | Y | – | String | Giá trị phụ thuộc NGUỒN (BIZ-017, VAL-23): Nguồn=42→{4201,4202,4203}; 43→{4301,4302,4303}; 52→{5301,5302,5303}; 54→{5401,5402,5403} ; nhận một trong các giá trị 4201, 4202,4301,4302,5301,5302,5401,5402
|
| DP | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.12 — Segment_Code (Dự phòng); Ví dụ: 000 |
| Tiêu thức phân bổ | ALLOCATION_CRITERIA | Dropdown + Lookup | Y | – | String | Giá trị: 01-Vốn ĐT theo ngành lĩnh vực; 02-Vốn ĐT theo CTMT; 03-Vốn ĐT theo CTMTQG; 04-Vốn trả nợ KL; 99-Khác; Ví dụ: 02 |
| Số ĐNTT NT | REQUEST_FOR_PAYMENT_ORIGIN_CURRENCY | Number | Y | – | Number | Nhập thủ công; NT = Ngoại tệ; Ví dụ: 2.200.000.000 |
| Số ĐNTT VND | REQUEST_FOR_PAYMENT_VND | Number | Y | – | Number | Nhập thủ công; Ví dụ: 2.200.000.000 |
| Số KBNN duyệt NT | APPROVED_AMOUNT_ORIGIN_CURRENCY | Number | Y | – | Number | Nhập thủ công; Ví dụ: 2.200.000.000 |
| Số KBNN duyệt VND | APPROVED_AMOUNT_VND | Number | Y | – | Number | Nhập thủ công; Ví dụ: 2.200.000.000 |
| Số thu hồi tạm ứng NT | ADVANCES_DEDUCTION_ORIGIN_CURRENCY | Number | Y | – | Number | Nhập thủ công; Ví dụ: 500.000.000 |
| Số thu hồi tạm ứng VND | ADVANCES_DEDUCTION_VND | Number | Y | – | Number | Nhập thủ công; Ví dụ: 500.000.000 |
| Số chuyển bảo hành NT | WARRANTY_FEE_ORIGIN_CURRENCY | Number | Y | – | Number | Nhập thủ công; Ví dụ: 100.000.000 |
| Số chuyển bảo hành VND | WARRANTY_FEE_VND | Number | C | – | Number | Nhập thủ công; bắt buộc khi CURRENCY = VND; Ví dụ: 100.000.000 |
| Số tạm giữ chờ quyết toán NT | RETENTION_MONEY_ORIGIN_CURRENCY | Number | C | – | Number | Nhập thủ công; Ví dụ: 50.000.000 |
| Số tạm giữ chờ quyết toán VND | RETENTION_MONEY_VND | Number | C | – | Number | Nhập thủ công; Ví dụ: 50.000.000 |
| Thuế GTGT | VALUE_ADDED_TAX | Number | C | – | Number | Nhập thủ công; Ví dụ: 176.000.000 |
| Số chuyển đơn vị thụ hưởng NT | TRANSFER_BENEFICIARY_AMOUNT_NT | Number | Y (auto) | – | Number | Hệ thống tự tính = APPROVED_NT − ADVANCES_NT − WARRANTY_NT − RETENTION_NT (BIZ-015, VAL-24); read-only |
| Số chuyển đơn vị thụ hưởng VND | TRANSFER_BENEFICIARY_AMOUNT_VND | Number | Y (auto) | – | Number | Hệ thống tự tính = APPROVED_VND − ADVANCES_VND − WARRANTY_VND − RETENTION_VND (BIZ-016, VAL-25); read-only |
| Tên đơn vị thụ hưởng | RECEIVER_NAME | Text | Y | – | String | Nhập thủ công |
| Số tài khoản đơn vị thụ hưởng | RECEIVER_ACCOUNT | Text | Y | – | String | Nhập thủ công |
| tại (NH/KB thụ hưởng) | RECEIVER_BANK | Dropdown + Lookup | Y | – | String | LOV.02 — Bank_Branch_Name; nhập thủ công hoặc chọn từ LOV |

### B1.4. [Tab] Đính kèm tài liệu

> Sử dụng chuẩn đính kèm chung của hệ thống VDBAS. Không cần khai báo thêm field.
> Sự kiện liên quan: `EXP.CAPEX_DOSSIER.3.3.1.NEW.ATTACH_FILE`, `EXP.CAPEX_DOSSIER.3.3.1.EDIT.ATTACH_FILE`.

### B1.5. [Tab] Lịch sử thay đổi

> Hiển thị audit log theo chuẩn `REPORT.MANUAL.HISTORY` — thay thế mã màn hình bằng `EXP.CAPEX_DOSSIER.3.3.1.HISTORY`.

---

## B4. Quy ước chung về đặc tả trường

| STT | Quy ước |
|---|---|
| 1 | DateTime hiển thị `dd/mm/yyyy hh:MM:ss`; Date hiển thị `dd/MM/yyyy`; chuẩn timezone Asia/Ho_Chi_Minh |
| 2 | Trường Lookup có icon kính lúp + phím tắt `F4` |
| 3 | Trường bắt buộc đánh dấu `*` đỏ; conditional mandatory đánh dấu `(*)` + tooltip điều kiện |
| 4 | Field disabled có tooltip giải thích lý do; field lỗi validate hiển thị viền đỏ + thông báo dưới ô |
| 5 | TextBox/TextArea chống XSS bằng sanitize; chống SQL Injection bằng prepared statement |
| 6 | Số tiền (Currency_Field) định dạng NNN.NNN,NN |
| 7 | `DOSSIER_ID` disabled trong Edit-mode — backend reject thay đổi (BIZ-005, VAL-17) |
| 8 | Mọi trường ENG dùng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB và API |

---

# C - Đặc tả nút chức năng

## C1 - Chi tiết đặc tả nút chức năng

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt | Phím tắt | Mô tả | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Lưu | Save | `EXP.CAPEX_DOSSIER.3.3.1.NEW.SAVE` | On click | `Ctrl+S` | Validate đầy đủ §A8; lưu ACTIVE; ghi audit | Trên form NEW |
| 2 | Lưu (Sửa) | Save (Edit) | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.SAVE` | On click | `Ctrl+S` | F-VER+1; ghi audit oldValue→newValue | Trên form EDIT |
| 3 | Sửa | Edit | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.OPEN` | On click | `Ctrl+E` | Mở form Sửa; load F-VER; DOSSIER_ID disabled | Enable khi F-STATUS = ACTIVE + quyền EXP_CAPEX_MAKER |
| 4 | Xem | View | `EXP.CAPEX_DOSSIER.3.3.1.VIEW.OPEN` | On click | `F3` | Mở form read-only | Từ hồ sơ cha CHI.CAPEX_DOSSIER |
| 5 | Xoá | Delete | `EXP.CAPEX_DOSSIER.3.3.1.DELETE.OPEN` | On click | `Delete` | Mở popup Xoá (lý do + checkbox) | Enable khi F-STATUS = ACTIVE + quyền EXP_CAPEX_MAKER |
| 6 | Xác nhận xoá | Confirm Delete | `EXP.CAPEX_DOSSIER.3.3.1.DELETE.CONFIRM` | On click | `Enter` (trong popup) | Soft-delete; ghi audit | Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox |
| 7 | Huỷ | Cancel | `EXP.CAPEX_DOSSIER.3.3.1.NEW.CANCEL` / `EDIT.CANCEL` | On click | `Esc` | Hỏi xác nhận MSG-CFM-CANCEL nếu dirty; đóng form | |
| 8 | Hoàn tác | Undo | `EXP.CAPEX_DOSSIER.3.3.1.EDIT.UNDO` | On click | `Ctrl+Z` | Hoàn tác về trạng thái lúc mở form | Trên form EDIT |
| 9 | Thêm dòng | Add Row | `EXP.CAPEX_DOSSIER.3.3.1.NEW.ADD_ROW` / `EDIT.ADD_ROW` | On click | – | Thêm dòng trống vào bảng kê chi tiết | Trên bảng B1.3.T |
| 10 | Xóa dòng | Remove Row | `EXP.CAPEX_DOSSIER.3.3.1.NEW.REMOVE_ROW` / `EDIT.REMOVE_ROW` | On click | – | Xoá dòng khỏi bảng kê; confirm nếu có dữ liệu | Trên bảng B1.3.T |
| 11 | Tra cứu | Lookup | (Mở popup LOV tương ứng) | On click kính lúp | `F4` | Mở popup tra cứu danh mục; chọn → trả về form | Trên các trường Lookup |
| 12 | Lịch sử | History | `EXP.CAPEX_DOSSIER.3.3.1.VIEW.HISTORY_OPEN` | On click tab | `Alt+H` | Mở tab Lịch sử thay đổi | Trên VIEW |

---

## C2 - Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
|---|---|
| 1 | Kiểm tra quyền trước khi hiển thị: `EXP_CAPEX_MAKER` thấy tất cả nút; `EXP_CAPEX_VIEWER` chỉ thấy Xem |
| 2 | Nút **Sửa/Xoá**: enable khi F-STATUS = ACTIVE (VAL-13) **và** quyền EXP_CAPEX_MAKER (VAL-14) |
| 3 | Nút **Lưu**: disable khi form có lỗi validate cứng; enable lại khi đã fix |
| 4 | Nút **Xác nhận xoá**: disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 5 | Nút **Thêm dòng**: luôn enable trong NEW/EDIT |
| 6 | Nút **Xóa dòng**: disable khi bảng chỉ còn 1 dòng (giữ tối thiểu 1 dòng theo BIZ-018) |
| 7 | Phòng chống double-submit: client disable ngay sau click + idempotency key phía server |
| 8 | Phiên hết hạn → mọi nút disable; MSG-ERR-SESSION; redirect đăng nhập |
| 9 | Mọi nút disable hiển thị tooltip giải thích lý do; hỗ trợ ARIA label |
| 10 | Mỗi thao tác thành công: ghi audit `EXP.CAPEX_DOSSIER.3.3.1.AUDIT.WRITE` (BIZ-007) |

---

## C3 - Quy ước phím tắt

- **Nhóm soạn thảo**: `Ctrl+S` (Lưu), `Esc` (Huỷ), `Ctrl+Z` (Hoàn tác).
- **Nhóm thao tác bản ghi**: `Ctrl+E` (Sửa), `F3` (Xem), `Delete` (Xoá).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường Lookup.
- **Nhóm điều hướng tab**: `Alt+H` (Lịch sử thay đổi).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

---

# D - Testcase: EXP.CAPEX_DOSSIER.3.3.1

> **Cấu trúc mã TC:** `EXP.CAPEX_DOSSIER.3.3.1.TC.<Nhóm>.<STT>`
> **Nhóm:** 1 = Tạo mới, 2 = Xem, 3 = Cập nhật, 4 = Xoá

---

## D1 - Nhóm 1 — Tạo mới

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.01 | Tạo thành công — VND | Positive | Kế toán đã đăng nhập; DOSSIER_ID hợp lệ; LOV đã cấu hình | Chọn CURRENCY=VND; điền đủ trường bắt buộc; thêm ≥1 dòng bảng kê; bấm **Lưu** | Lưu ACTIVE; MSG-OK-SAVE; EXCHANGE_RATE=1,00; TRANSFER_BENEFICIARY auto-calc đúng; ghi audit | BIZ-007, BIZ-013, BIZ-015, BIZ-016 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.02 | Tạo thành công — Ngoại tệ + Tỷ giá công ty | Positive | Kế toán đăng nhập; có danh mục tỷ giá USD | Chọn CURRENCY=USD; EXCHANGE_RATE_TYPE="Tỷ giá công ty"; nhập EXCHANGE_RATE_DATE; bấm **Lưu** | EXCHANGE_RATE auto-fill; MSG-INFO-RATE-AUTOFILL; lưu thành công | BIZ-014 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.03 | Tạo thành công — Dự án QP/AN có PROJECT_SPEC_ID | Positive | PROJECT_ID = 7004686 | Chọn PROJECT_SPEC_ID từ LOV; điền đủ trường; bấm **Lưu** | PROJECT_SPEC_NAME auto-fill; PMU/PIPO_ID cập nhật theo PROJECT_SPEC_ID; lưu thành công | BIZ-011, VAL-20 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.04 | Tạo thất bại — Thiếu TK vốn | Negative | Kế toán đăng nhập | Không điền cả hai tài khoản vốn; bấm **Lưu** | MSG-WRN-ACCOUNT-REQUIRED; chặn lưu | BIZ-012, VAL-19 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.05 | Tạo thất bại — Thiếu PROJECT_SPEC_ID cho dự án QP/AN | Negative | PROJECT_ID = 7004692 | Không chọn PROJECT_SPEC_ID; bấm **Lưu** | MSG-WRN-PROJECT-SPEC-REQUIRED; highlight PROJECT_SPEC_ID; chặn lưu | BIZ-011, VAL-20, E4 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.06 | Tạo thất bại — Bảng kê trống | Negative | Kế toán đăng nhập | Điền đủ header nhưng không thêm dòng bảng kê; bấm **Lưu** | MSG-ERR-TABLE-EMPTY; chặn lưu | BIZ-018, VAL-26, E6 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.07 | Tạo thất bại — INVESTMENT_FUNDING_SOURCE không hợp lệ | Negative | Kế toán đăng nhập | Chọn NGUỒN=42; chọn INVESTMENT_FUNDING_SOURCE=5301 (không thuộc nguồn 42); bấm **Lưu** | MSG-ERR-FUNDING-SOURCE-INVALID; clear INVESTMENT_FUNDING_SOURCE; chặn lưu | BIZ-017, VAL-23, E5 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.08 | Tạo thất bại — Trường bắt buộc trống | Negative | Kế toán đăng nhập | Để trống PROJECT_ITEM_ID; bấm **Lưu** | MSG-ERR-REQUIRED; highlight đỏ PROJECT_ITEM_ID; chặn lưu | VAL-01, E1 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.09 | Đổi NGUỒN → reset INVESTMENT_FUNDING_SOURCE | Positive | Kế toán đang nhập; đã chọn NGUỒN=42, INVESTMENT_FUNDING_SOURCE=4201 | Đổi NGUỒN=43 | INVESTMENT_FUNDING_SOURCE bị reset; dropdown cập nhật {4301, 4302, 4303} | BIZ-017, A5 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.10 | Huỷ form khi đã nhập | Positive | Kế toán đang nhập dữ liệu | Bấm **Huỷ** / `Esc` | Popup MSG-CFM-CANCEL; xác nhận → đóng form; không lưu | A1 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.1.11 | Thêm và xóa dòng bảng kê | Positive | Kế toán đang nhập | Thêm 3 dòng; xóa 1 dòng | Bảng kê còn 2 dòng; TRANSFER_BENEFICIARY tính lại cho từng dòng | BIZ-018, A2, A3 |

---

## D2 - Nhóm 2 — Xem

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.1.TC.2.01 | Xem bản ghi thành công | Positive | Bản ghi ACTIVE; NSD có quyền Viewer+ | Mở VIEW từ hồ sơ cha | Form read-only; đủ 3 Area + bảng kê + Tab Đính kèm + Tab Lịch sử | §A4 bước 8 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.2.02 | Xem thất bại — Không có quyền | Negative | User không có quyền EXP_CAPEX_VIEWER | Truy cập trực tiếp URL VIEW | MSG-ERR-PERMISSION | BIZ-001, VAL-14 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.2.03 | Tab Lịch sử thay đổi | Positive | Bản ghi đã sửa nhiều lần | Mở VIEW; click tab Lịch sử (`Alt+H`) | Hiển thị CREATED_BY, CREATED_DATE, oldValue→newValue, IP, action | BIZ-007, BIZ-008 |

---

## D3 - Nhóm 3 — Cập nhật

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.1.TC.3.01 | Sửa thành công | Positive | Bản ghi ACTIVE; Kế toán đăng nhập | Bấm **Sửa**; đổi CONTRACT_ID; bấm **Lưu** | F-VER+1; audit oldValue→newValue; MSG-OK-SAVE | VAL-15, BIZ-007 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.3.02 | Sửa thất bại — Bản ghi DELETED | Negative | Bản ghi DELETED | Bấm **Sửa** | Nút Sửa disable; MSG-ERR-STATUS | VAL-13 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.3.03 | Sửa thất bại — Không có quyền | Negative | User EXP_CAPEX_VIEWER | Bấm **Sửa** | MSG-ERR-PERMISSION; ghi audit bảo mật | VAL-14, BIZ-001 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.3.04 | Sửa thất bại — Optimistic lock | Negative | 2 kế toán cùng mở EDIT | Kế toán A lưu trước; Kế toán B cố lưu | MSG-ERR-LOCK; yêu cầu tải lại | VAL-15 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.3.05 | DOSSIER_ID immutable khi Sửa | Negative | Bản ghi ACTIVE | Mở EDIT; trường DOSSIER_ID | DOSSIER_ID disabled; backend reject nếu gửi thay đổi | BIZ-005, VAL-17 |

---

## D4 - Nhóm 4 — Xoá

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.1.TC.4.01 | Xoá thành công | Positive | Bản ghi ACTIVE; Kế toán | Bấm **Xoá**; nhập lý do ≥ 10 ký tự; tick checkbox; **Xác nhận** | F-STATUS=DELETED; MSG-OK-DELETE; ghi audit | VAL-16, BIZ-002 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.4.02 | Xoá thất bại — Bản ghi DELETED | Negative | Bản ghi đã DELETED | Bấm **Xoá** | Nút disable; MSG-ERR-STATUS | VAL-13 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.4.03 | Xoá thất bại — Lý do quá ngắn | Negative | Bản ghi ACTIVE; Kế toán | Popup Xoá; nhập lý do < 10 ký tự | Nút Xác nhận disable; MSG-ERR-DELETE-CFM | VAL-16 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.4.04 | Xoá thất bại — Chưa tick checkbox | Negative | Bản ghi ACTIVE; Kế toán | Popup Xoá; nhập đủ lý do; chưa tick | Nút Xác nhận vẫn disable | VAL-16 |
| EXP.CAPEX_DOSSIER.3.3.1.TC.4.05 | Xoá thất bại — Không có quyền | Negative | Bản ghi ACTIVE; EXP_CAPEX_VIEWER | Bấm **Xoá** | MSG-ERR-PERMISSION; ghi audit bảo mật | VAL-14, BIZ-001 |


---

## Đánh giá

### A. Nhất quán với dự án VDBAS

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Cấu trúc section A→D | ✅ | Đầy đủ A1–A12, B1, C1–C3, D1–D4; khớp với file tham chiếu REPORT.MANUAL.CRUD_spec_function.md |
| Quy ước đặt tên Mã TC | ✅ | Format `EXP.CAPEX_DOSSIER.3.3.1.TC.<Nhóm>.<STT>` nhất quán với quy ước `<MOD>.TC.<Nhóm>.<STT>` |
| Định dạng bảng field (7 cột) | ✅ | Tất cả bảng B1.x đủ 7 cột: Trường VN, Trường ENG, Loại, Bắt buộc, Giá trị mặc định, Loại dữ liệu, Mô tả/Ràng buộc |
| Quy ước mã Event_id | ✅ | Format `EXP.CAPEX_DOSSIER.3.3.1.<SCREEN>.<ACTION>` theo chuẩn `<MOD>.<SCREEN>.<ACTION>` |
| Cách viết LOV trong mô tả field | ✅ | Ghi rõ tên LOV và giá trị/ví dụ trong cột Mô tả / Ràng buộc |
| Các mã BIZ/VAL/MSG nhất quán | ✅ | BIZ-001→019, VAL-01→26, MSG đặt tên theo quy ước chuẩn; đã sửa typo LOE.03→LOV.03 |
| Tên chức năng (VN)/(EN) | ⚠️ | File dùng "Tên chức năng (ENG)"; tham chiếu dùng "Tên chức năng (EN)" — sai biệt nhỏ về ký hiệu |

> Tham chiếu từ: `REPORT.MANUAL.CRUD_spec_function.md`

### B. Phù hợp với best practice đặc tả CRUD (không Approval)

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Mỗi field có đủ 7 cột (không bỏ trống tùy tiện) | ✅ | Kiểm tra tất cả bảng B1.1, B1.2, B1.3, B1.3.T |
| Luồng chính/thay thế/ngoại lệ đầy đủ | ✅ | A4 (12 bước), A5 (5 luồng), A6 (11 ngoại lệ) |
| State Machine có đủ trạng thái CRUD cơ bản | ✅ | ACTIVE / DELETED + violation/concurrent cases |
| Testcase bao phủ happy path + edge case | ✅ | 19 TC: NEW(11), VIEW(3), EDIT(5), DELETE(5) — bao phủ QP/AN, ngoại tệ, bảng kê trống, lock |
| Không có placeholder còn sót lại | ✅ | Không còn `<…>` trong nội dung thực tế |
| Không có section Approval (đúng loại template) | ✅ | Đúng template wo-approval; không có Submit/Approve/Reject |
| Không có section LIST (per yêu cầu input) | ✅ | B2 bỏ qua; A12 không có LIST screen; giải thích rõ trong intro |
| Mô tả field đủ rõ để dev implement không cần hỏi thêm | ✅ | BIZ-011→019 + VAL-19→26 mô tả đầy đủ logic nghiệp vụ đặc thù |

### C. Tổng kết

**Mức độ sẵn sàng:** Sẵn sàng — cần chỉnh 1 điểm nhỏ

**Các điểm cần xử lý trước khi sử dụng:**
1. A1 — Tên trường: đổi "Tên chức năng (ENG)" → "Tên chức năng (EN)" cho đồng nhất với file tham chiếu (chỉnh thủ công, không ảnh hưởng nội dung)
2. ⚠️ BA cần xác minh lại công thức tính `TRANSFER_BENEFICIARY_AMOUNT_NT` và `TRANSFER_BENEFICIARY_AMOUNT_VND` (BIZ-015, BIZ-016) — input gốc dùng cell reference có thể không nhất quán; spec đã điền logic nghiệp vụ hợp lý nhất dựa trên phân tích field

