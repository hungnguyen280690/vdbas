# A - Bảng đặc tả chức năng

> Chức năng **Thêm mới / Xem / Sửa / Xoá** chứng từ **Giấy rút vốn 05.a/TT thanh toán vốn đầu tư** trong hệ thống VDBAS.
> Chứng từ là đối tượng con (child) của Hồ sơ quản lý chi đầu tư (`CHI.CAPEX_DOSSIER`). Chức năng này **không có luồng phê duyệt riêng** — trạng thái chứng từ được đồng bộ tự động từ trạng thái Hồ sơ cha.
> Màn hình LIST/tìm kiếm riêng biệt **không có** — chứng từ được truy cập từ giao diện của Hồ sơ cha.

---

## A1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `EXP.CAPEX_DOSSIER.3.3.2` |
| Tên chức năng (VN) | Quản lý Giấy rút vốn 05.a/TT thanh toán vốn đầu tư |
| Tên chức năng (ENG) | Fund Withdrawal Voucher No.05a/TT |
| Phân hệ | CHI — Quản lý chi |
| Người sử dụng | Cán bộ nhập liệu CAPEX (`EXP_MAKER`), Người tra cứu (`EXP_VIEWER`) |
| Mô tả | Chức năng nhập liệu và tra cứu, xem Giấy rút vốn 05.a/TT thanh toán vốn đầu tư. Chứng từ là đối tượng con thuộc Hồ sơ CHI.CAPEX_DOSSIER; trạng thái đồng bộ từ Hồ sơ cha. |
| Độ ưu tiên | Cao |
| URD Reference | *(chưa cung cấp)* |

---

## A2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền `EXP_MAKER` (nhập liệu) hoặc `EXP_VIEWER` (xem) theo phạm vi phân hệ CHI |
| 3 | Hồ sơ chi đầu tư (`CHI.CAPEX_DOSSIER`) đã tồn tại và đang ở trạng thái cho phép tạo/sửa chứng từ (DOC_STATUS = "Đang hoàn thiện" hoặc "Đã hoàn thiện") |
| 4 | Đề nghị thanh toán 04.a/TT (`EXP.CAPEX_DOSSIER.3.3.1`) đã được tạo và liên kết với Hồ sơ |
| 5 | Các danh mục Master Data đã được cấu hình: LOV.Currency_type, LOV.ExchangeRateType, LOV.PaymentType, LOV.PaymentMethod, LOV.06.1 - Danh mục ngân hàng, LOV.07.x - Segment codes |
| 6 | (Trường hợp Sửa/Xoá) Bản ghi chứng từ tồn tại và đang ở trạng thái "Đang hoàn thiện" hoặc "Đã hoàn thiện" |
| 7 | (Trường hợp Sửa/Xoá) NSD có quyền `EXP_MAKER` |

---

## A3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | (Trường hợp Thêm/Sửa) Chứng từ được lưu với trạng thái "Đang hoàn thiện"; liên kết với Hồ sơ cha CHI.CAPEX_DOSSIER |
| 2 | (Trường hợp Xoá) Bản ghi được soft-delete (DELETED), ẩn khỏi danh sách chứng từ của Hồ sơ cha, vẫn truy được qua audit |
| 3 | Audit log ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) |
| 4 | DOC_ID được sinh tự động theo quy tắc nghiệp vụ (BIZ-005) và không thể thay đổi sau khi lưu |

---

## A4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | EXP_MAKER mở Hồ sơ CHI.CAPEX_DOSSIER, bấm **Tạo mới** Giấy rút vốn 05.a/TT | (1) Mở form trống; (2) Auto-fill các trường từ Hồ sơ cha và Đề nghị thanh toán 04.a/TT; (3) Sinh DOC_ID theo quy tắc BIZ-005; (4) Đặt DOC_STATUS = "Đang hoàn thiện" |
| 2 | Nhập/kiểm tra dữ liệu theo §B1 (Thông tin chứng từ, Tab Thông tin thanh toán chi, Tab Nộp thuế) | (1) Validate khi rời ô (onBlur): format, danh mục, ràng buộc field; (2) Cascading theo PAYMENT_METHOD, CURRENCY_CODE; (3) Auto-compute EXCHANGE_RATE nếu Loại tỷ giá = "Tỷ giá công ty" |
| 3 | Bấm **Lưu** | Validate đầy đủ §A8; lưu trạng thái "Đang hoàn thiện"; hiển thị MSG-OK-SAVE; ghi audit |
| 4 | (Xem) Từ Hồ sơ cha, chọn chứng từ, bấm **Xem** hoặc click DOC_ID | Mở form read-only; hiển thị đầy đủ trường + [Tab] Lịch sử thay đổi |
| 5 | (Sửa) Trên chứng từ DOC_STATUS = "Đang hoàn thiện"/"Đã hoàn thiện", bấm **Sửa** | Mở form editable; load F-VER hiện hành; DOC_ID disabled |
| 6 | (Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); lưu; F-VER+1; ghi audit oldValue→newValue |
| 7 | (Xoá) Trên chứng từ DOC_STATUS = "Đang hoàn thiện"/"Đã hoàn thiện", bấm **Xoá** | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận |
| 8 | (Xoá) Bấm **Xác nhận xoá** | Soft-delete (F-STATUS=DELETED); ghi audit; hiển thị MSG-OK-DELETE |
| 9 | Bấm **In chứng từ** trên bản ghi đã hoàn thiện | Mở màn hình preview in Giấy rút vốn 05.a/TT |

---

## A5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Huỷ** khi đang nhập | Nếu form đã nhập dữ liệu → hỏi xác nhận MSG-CFM-CANCEL; xác nhận → đóng form, bỏ thay đổi |
| A2 | CURRENCY_CODE ≠ VND | Hiển thị thêm trường EXCHANGE_RATE_TYPE, EXCHANGE_RATE_DATE, EXCHANGE_RATE; bắt buộc nhập theo VAL-20 |
| A3 | PAYMENT_METHOD = "Tiền mặt tại KB/NH" | Bắt buộc nhập RECEIVER_NAME, CITIZEN_ID, CITIZEN_ID_DATE, CITIZEN_ID_PLACE theo BIZ-014 |
| A4 | Niên độ = (Năm hiện tại – 1) và POSTING_DATE = 31/12 | Hiện thêm Area 3rd "Thông tin hạch toán đồng thời" theo kỳ 13 |
| A5 | Hình thức = "Tiền mặt tại KB", Phương thức = LKB/Điện tử | Hiện thêm Area 2nd "Thanh toán liên kho bạc" |
| A6 | NSD bấm **In chứng từ** | Mở màn hình `EXP.CAPEX_DOSSIER.3.3.2.PRINT`; preview và in Giấy rút vốn 05.a/TT |

---

## A6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc bỏ trống khi Lưu (VAL-01) | Highlight đỏ + MSG-ERR-REQUIRED; chặn lưu |
| E2 | Giá trị không thuộc danh mục LOV (VAL-03) | MSG-ERR-LOOKUP; clear trường |
| E3 | Tổng số tiền không khớp — Nợ ≠ Có, hoặc tổng chi tiết ≠ header (VAL-10, BIZ-012) | MSG-ERR-AMOUNT-MISMATCH; chặn lưu |
| E4 | Không có dòng chi tiết thanh toán (BIZ-013) | MSG-ERR-MIN-DETAIL-ROW; chặn lưu |
| E5 | Tiền mặt nhưng thiếu Người nhận tiền (BIZ-014, VAL-22) | MSG-ERR-RECEIVER-REQUIRED; highlight trường; chặn lưu |
| E6 | Nhập đồng thời Nợ và Có trên cùng dòng (BIZ-015) | MSG-ERR-DEBIT-CREDIT-CONFLICT; highlight dòng; chặn lưu |
| E7 | Ngày hạch toán ngoài kỳ kế toán (BIZ-016, VAL-21) | MSG-ERR-POSTING-PERIOD; highlight trường; chặn lưu |
| E8 | CURRENCY_CODE ≠ VND nhưng không nhập tỷ giá (VAL-20) | MSG-ERR-CURRENCY-REQUIRE-RATE; highlight trường; chặn lưu |
| E9 | Tổ hợp COA CCID không hợp lệ (VAL-19) | MSG-ERR-CCID-INVALID; highlight segment lỗi; chặn lưu |
| E10 | Sửa/Xoá khi DOC_STATUS không phải "Đang hoàn thiện"/"Đã hoàn thiện" (VAL-13) | MSG-ERR-STATUS; disable nút |
| E11 | Sửa/Xoá khi không có quyền EXP_MAKER (VAL-14) | MSG-ERR-PERMISSION; ghi audit bảo mật |
| E12 | Optimistic lock conflict (VAL-15) | MSG-ERR-LOCK; yêu cầu tải lại bản ghi |
| E13 | Confirm xoá không đủ điều kiện (VAL-16) | Disable nút Xác nhận xoá đến khi đủ lý do + tick checkbox |
| E14 | DOC_ID đã tồn tại (VAL-11) | MSG-ERR-DUPLICATE; chặn lưu (trường hợp edge-case) |
| E15 | Lỗi hệ thống / API timeout | MSG-ERR-SYSTEM + traceId; rollback thao tác |

---

## A7. Quy tắc nghiệp vụ

| STT | Mã | Quy tắc |
|---|---|---|
| 1 | BIZ-001 | Chỉ user có quyền `EXP_MAKER` mới được Tạo mới/Sửa/Xoá; `EXP_VIEWER` chỉ được Xem và In chứng từ |
| 2 | BIZ-002 | Xoá là soft-delete; bản ghi vẫn truy được qua audit/history; DOC_ID bị khoá không tái sử dụng |
| 3 | BIZ-003 | `DOC_ID` phải là duy nhất trong toàn hệ thống kể cả bản ghi DELETED |
| 4 | BIZ-004 | Chứng từ phải thuộc đúng Hồ sơ CHI.CAPEX_DOSSIER đang xử lý; kiểm tra tại thời điểm Lưu |
| 5 | BIZ-005 | `DOC_ID` được hệ thống tự sinh theo quy tắc: `{4 ký tự loại chứng từ}-{YY}{MM}{DD}-{Mã KB 4 ký tự}{STT 3 ký tự tăng dần}`. DOC_ID là duy nhất toàn hệ thống; immutable sau khi lưu lần đầu |
| 6 | BIZ-006 | Lý do xoá ≥ 10 ký tự và ≤ 500 ký tự; lưu vào audit log |
| 7 | BIZ-007 | Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue cho mọi thao tác |
| 8 | BIZ-008 | History ghi: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE |
| 9 | BIZ-009 | `CURRENCY_CODE` bắt buộc; nếu khác VND thì bắt buộc nhập EXCHANGE_RATE_TYPE và EXCHANGE_RATE. Nếu CURRENCY_CODE = VND thì EXCHANGE_RATE = 1,00 (mặc định, không sửa) |
| 10 | BIZ-010 | Sau khi lưu, chứng từ được liên kết với Hồ sơ cha CHI.CAPEX_DOSSIER; hiển thị trong danh sách chứng từ của Hồ sơ |
| 11 | BIZ-011 | Sửa/Xoá chỉ cho phép khi DOC_STATUS = "Đang hoàn thiện" hoặc "Đã hoàn thiện"; không cho phép Sửa/Xoá khi Hồ sơ đã ở trạng thái "Chờ kiểm soát" trở lên |
| 12 | BIZ-012 | Tổng số tiền trên chứng từ = Số tiền Nộp thuế + Số tiền Thanh toán cho đơn vị hưởng |
| 13 | BIZ-013 | Chứng từ Giấy rút vốn cần có ít nhất 1 dòng chi tiết thanh toán trong bảng hạch toán của Tab Thông tin thanh toán chi |
| 14 | BIZ-014 | Khi chọn Hình thức thanh toán là "Tiền mặt tại KB" hoặc "Tiền mặt tại NH" thì bắt buộc nhập thông tin Người nhận tiền: RECEIVER_NAME, CITIZEN_ID, CITIZEN_ID_DATE, CITIZEN_ID_PLACE |
| 15 | BIZ-015 | Không cho nhập đồng thời Số tiền Nợ (Nợ NT hoặc Nợ VND) và Số tiền Có (Có NT hoặc Có VND) trên cùng 1 dòng hạch toán chi tiết |
| 16 | BIZ-016 | Ngày hạch toán (POSTING_DATE) phải thuộc kỳ kế toán Quản lý chi đang mở. Nếu Niên độ = Năm hiện tại thì POSTING_DATE = Ngày phê duyệt chứng từ (auto). Nếu Niên độ = (Năm hiện tại – 1) thì POSTING_DATE = 31/12/Niên độ |

---

## A8. Quy tắc kiểm tra dữ liệu

| STT | Phân loại | Mã | Quy tắc |
|---|---|---|---|
| 1 | Chung | VAL-01 | Trường bắt buộc không được bỏ trống khi Lưu; highlight đỏ + MSG-ERR-REQUIRED |
| 2 | Chung | VAL-02 | Định dạng dữ liệu hợp lệ: Date = `dd/MM/yyyy`; Decimal ≥ 0; String pattern theo quy định |
| 3 | Chung | VAL-03 | Giá trị Dropdown/Lookup phải thuộc danh mục LOV tương ứng; ngoài danh mục → MSG-ERR-LOOKUP + clear trường |
| 4 | Chung | VAL-04 | Trường Text: trim trước khi lưu; không cho khoảng trắng đầu/cuối |
| 5 | Chung | VAL-05 | Cross-field: Loại thanh toán (PAYMENT_TYPE) phải nhất quán với Loại giấy rút vốn (DOC_TYPE) theo nghiệp vụ |
| 6 | Chung | VAL-06 | Cascading: thay đổi PAYMENT_METHOD → refresh và reset các trường phụ thuộc (PAYMENT_METHOD_BANK, BANK/TREASURY, BENEFICIARY fields) |
| 7 | Chức năng | VAL-07 | Số tiền Nợ/Có ≥ 0; Tổng Nợ = Tổng Có trên từng bút toán hạch toán |
| 8 | Chung | VAL-08 | Ngày phải đúng định dạng `dd/MM/yyyy`; Ngày hạch toán phải hợp lệ theo niên độ |
| 9 | Chung | VAL-09 | Trường TextBox/TextArea: trim, không cho ký tự điều khiển (`\x00-\x1F`); chống XSS/SQL Injection |
| 10 | Chức năng | VAL-10 | Tổng số tiền chi tiết (sum các dòng hạch toán nợ) phải = Tổng số tiền header (BIZ-012) |
| 11 | Chức năng | VAL-11 | DOC_ID duy nhất toàn hệ thống kể cả bản ghi DELETED (BIZ-003) |
| 12 | Chức năng | VAL-12 | Hình thức thanh toán + Phương thức thanh toán + Tại phải nhất quán theo ma trận nghiệp vụ quy định tại mô tả field PAYMENT_METHOD |
| 13 | Chung | VAL-13 | Trạng thái cho phép Sửa/Xoá: chỉ khi DOC_STATUS = "Đang hoàn thiện" hoặc "Đã hoàn thiện" (BIZ-011) |
| 14 | Chung | VAL-14 | Quyền thao tác: chỉ `EXP_MAKER` được Sửa/Xoá; `EXP_VIEWER` chỉ Xem + In; vi phạm → MSG-ERR-PERMISSION + ghi audit |
| 15 | Chung | VAL-15 | Optimistic lock theo `(F-ID, F-VER)`: khi Lưu nếu F-VER trong DB ≠ F-VER đã load → chặn + MSG-ERR-LOCK |
| 16 | Chung | VAL-16 | Confirm xoá: bắt buộc nhập Lý do ≥ 10 ký tự + tick checkbox; thiếu → disable nút Xác nhận xoá |
| 17 | Chức năng | VAL-17 | DOC_ID là immutable sau khi lưu lần đầu; backend reject thay đổi trong Edit-mode |
| 18 | Chung | VAL-18 | Cảnh báo trùng: trong N phút có chứng từ cùng PROJECT_ITEM_ID trong cùng Hồ sơ → MSG-WRN-DUPLICATE + nút Tiếp tục/Huỷ |
| 19 | Chức năng | VAL-19 | Tổ hợp COA (CCID) — GL_SEGMENT1 đến GL_SEGMENT13 — phải hợp lệ theo quy tắc Cross-Validation của hệ thống GL; vi phạm → MSG-ERR-CCID-INVALID; chặn lưu |
| 20 | Chức năng | VAL-20 | Nếu CURRENCY_CODE ≠ VND thì EXCHANGE_RATE_TYPE và EXCHANGE_RATE_DATE bắt buộc; EXCHANGE_RATE > 0; vi phạm → MSG-ERR-CURRENCY-REQUIRE-RATE |
| 21 | Chức năng | VAL-21 | Ngày hạch toán (POSTING_DATE) phải thuộc kỳ kế toán Quản lý chi đang mở (BIZ-016); vi phạm → MSG-ERR-POSTING-PERIOD |
| 22 | Chức năng | VAL-22 | Khi PAYMENT_METHOD = "Tiền mặt tại KB" hoặc "Tiền mặt tại NH": RECEIVER_NAME, CITIZEN_ID, CITIZEN_ID_DATE, CITIZEN_ID_PLACE bắt buộc (BIZ-014); vi phạm → MSG-ERR-RECEIVER-REQUIRED |

---

## A9. Danh sách thông báo

| STT | Phân loại 1 | Phân loại 2 | Mã | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên trường]` |
| 2 | Chung | Error | MSG-ERR-FORMAT | Định dạng `[Tên trường]` không hợp lệ |
| 3 | Chung | Error | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | MSG-ERR-CROSS-FIELD | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]` |
| 5 | Chung | Error | MSG-ERR-DUPLICATE | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]` |
| 6 | Chung | Error | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 7 | Chung | Error | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 8 | Chung | Error | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 9 | Chung | Error | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 10 | Chung | Success | MSG-OK-SAVE | Lưu bản ghi thành công |
| 11 | Chung | Success | MSG-OK-DELETE | Xoá bản ghi thành công |
| 12 | Chung | Confirm | MSG-CFM-CANCEL | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 13 | Chung | Confirm | MSG-CFM-DELETE | Bạn có chắc muốn xoá chứng từ `<DOC_ID>`? |
| 14 | Chung | Warning | MSG-WRN-DUPLICATE | Phát hiện bản ghi tương tự đã được tạo gần đây. Bạn có muốn tiếp tục? |
| 15 | Chung | Error | MSG-ERR-STATUS | Bản ghi đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá |
| 16 | Chung | Error | MSG-ERR-LOCK | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 17 | Chung | Error | MSG-ERR-CONCURRENT | Bản ghi đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau |
| 18 | Chung | Error | MSG-ERR-DELETE-CFM | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát |
| 19 | Chức năng | Error | MSG-ERR-AMOUNT-MISMATCH | Tổng số tiền không khớp: Tổng tiền chi tiết ≠ (Nộp thuế + Thanh toán cho đơn vị hưởng). Vui lòng kiểm tra lại |
| 20 | Chức năng | Error | MSG-ERR-MIN-DETAIL-ROW | Chứng từ cần có ít nhất 1 dòng chi tiết thanh toán |
| 21 | Chức năng | Error | MSG-ERR-RECEIVER-REQUIRED | Vui lòng nhập đầy đủ thông tin Người nhận tiền khi hình thức thanh toán là Tiền mặt |
| 22 | Chức năng | Error | MSG-ERR-DEBIT-CREDIT-CONFLICT | Không được nhập đồng thời Số tiền Nợ và Số tiền Có trên cùng dòng hạch toán |
| 23 | Chức năng | Error | MSG-ERR-POSTING-PERIOD | Ngày hạch toán không thuộc kỳ kế toán Quản lý chi đang mở. Vui lòng kiểm tra lại |
| 24 | Chức năng | Error | MSG-ERR-CURRENCY-REQUIRE-RATE | Loại tiền khác VND cần nhập Loại tỷ giá và Ngày tỷ giá |
| 25 | Chức năng | Error | MSG-ERR-CCID-INVALID | Tổ hợp mã COA (CCID) không hợp lệ theo quy tắc Cross-Validation |

---

## A10. Danh sách sự kiện

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `EXP.CAPEX_DOSSIER.3.3.2.NEW.OPEN` | Chung | Thêm mới | Mở form Tạo mới chứng từ; auto-fill từ Hồ sơ cha; sinh DOC_ID |
| 2 | `EXP.CAPEX_DOSSIER.3.3.2.NEW.SAVE` | Chung | Thêm mới | Validate đầy đủ §A8; lưu trạng thái "Đang hoàn thiện"; ghi audit |
| 3 | `EXP.CAPEX_DOSSIER.3.3.2.NEW.CANCEL` | Chung | Thêm mới | Huỷ form; hỏi xác nhận nếu form dirty; bỏ thay đổi |
| 4 | `EXP.CAPEX_DOSSIER.3.3.2.VIEW.OPEN` | Chung | Xem | Mở form Xem (read-only) |
| 5 | `EXP.CAPEX_DOSSIER.3.3.2.VIEW.HISTORY` | Chung | Xem | Mở tab Lịch sử thay đổi |
| 6 | `EXP.CAPEX_DOSSIER.3.3.2.VIEW.PRINT` | Chức năng | Xem | Mở màn hình preview và in Giấy rút vốn 05.a/TT |
| 7 | `EXP.CAPEX_DOSSIER.3.3.2.EDIT.OPEN` | Chung | Sửa | Mở form Sửa; load F-VER hiện hành; DOC_ID disabled |
| 8 | `EXP.CAPEX_DOSSIER.3.3.2.EDIT.SAVE` | Chung | Sửa | Validate; lưu; F-VER+1; ghi audit oldValue→newValue |
| 9 | `EXP.CAPEX_DOSSIER.3.3.2.EDIT.CANCEL` | Chung | Sửa | Huỷ chỉnh sửa; hỏi xác nhận nếu dirty; bỏ thay đổi |
| 10 | `EXP.CAPEX_DOSSIER.3.3.2.DELETE.OPEN` | Chung | Xoá | Mở popup Xoá (nhập lý do + checkbox xác nhận) |
| 11 | `EXP.CAPEX_DOSSIER.3.3.2.DELETE.CONFIRM` | Chung | Xoá | Soft-delete F-STATUS=DELETED; ghi audit |
| 12 | `EXP.CAPEX_DOSSIER.3.3.2.PRINT.OPEN` | Chức năng | In | Mở màn hình in Giấy rút vốn 05.a/TT; preview trước khi in |
| 13 | `EXP.CAPEX_DOSSIER.3.3.2.AUDIT.WRITE` | Chung | Audit | Ghi log: user, timestamp, IP, action, oldValue→newValue |
| 14 | `EXP.CAPEX_DOSSIER.3.3.2.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 15 | `EXP.CAPEX_DOSSIER.3.3.2.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 16 | `EXP.CAPEX_DOSSIER.3.3.2.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện optimistic lock mismatch; thông báo MSG-ERR-LOCK |
| 17 | `EXP.CAPEX_DOSSIER.3.3.2.GL.SEND` | Chức năng | GL | Hệ thống gửi bút toán hạch toán sang GL sau khi phê duyệt (async) |
| 18 | `EXP.CAPEX_DOSSIER.3.3.2.PAY.SEND` | Chức năng | Thanh toán | Hệ thống gửi lệnh thanh toán sang NH sau khi phê duyệt (async) |

---

## A11. State Machine (Trạng thái bản ghi)

> Chứng từ `EXP.CAPEX_DOSSIER.3.3.2` **không có luồng phê duyệt riêng**. Trạng thái chứng từ (DOC_STATUS) được đồng bộ tự động từ trạng thái Hồ sơ cha (`CHI.CAPEX_DOSSIER`).
>
> Trong phạm vi chức năng này, `EXP_MAKER` chỉ có thể Tạo mới/Sửa/Xoá khi Hồ sơ cha đang ở trạng thái "Đang hoàn thiện" hoặc "Đã hoàn thiện".
>
> Từ trạng thái "Chờ kiểm soát" trở đi: chứng từ chuyển sang read-only — mọi thay đổi trạng thái tiếp theo do luồng kiểm soát/phê duyệt của Hồ sơ cha điều khiển.

| STT | Sự kiện | Trạng thái (DOC_STATUS) | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | EXP_MAKER tạo mới và lưu (`NEW.SAVE`) | Start | Đang hoàn thiện | Sinh F-ID, DOC_ID, F-VER=1; autofill CREATED_BY/CREATED_DATE; ghi audit |
| 2 | EXP_MAKER huỷ form chưa lưu (`NEW.CANCEL`) | Start (chưa lưu) | End | Đóng form; không sinh bản ghi DB |
| 3 | EXP_MAKER Sửa & Lưu (`EDIT.SAVE`) | Đang hoàn thiện / Đã hoàn thiện | Đang hoàn thiện | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 4 | EXP_MAKER Xoá — Xác nhận (`DELETE.CONFIRM`) | Đang hoàn thiện / Đã hoàn thiện | DELETED | Soft-delete; ẩn khỏi Hồ sơ cha; ghi audit; MSG-OK-DELETE |
| 5 | Hồ sơ cha gửi kiểm soát (từ CHI.CAPEX_DOSSIER) | Đang hoàn thiện / Đã hoàn thiện | Chờ kiểm soát | DOC_STATUS cập nhật tự động; chứng từ chuyển sang read-only |
| 6 | Kiểm soát từ chối / Huỷ kiểm soát (từ Hồ sơ cha) | Chờ kiểm soát | Từ chối kiểm soát / Đang hoàn thiện | DOC_STATUS đồng bộ từ Hồ sơ cha; EXP_MAKER có thể sửa lại |
| 7 | Hồ sơ cha gửi phê duyệt (từ CHI.CAPEX_DOSSIER) | Chờ kiểm soát | Chờ phê duyệt | DOC_STATUS cập nhật tự động; read-only |
| 8 | Phê duyệt từ chối / Huỷ phê duyệt (từ Hồ sơ cha) | Chờ phê duyệt | Từ chối phê duyệt / Đang hoàn thiện | DOC_STATUS đồng bộ; EXP_MAKER có thể sửa lại |
| 9 | Hồ sơ cha được phê duyệt hoàn tất (từ CHI.CAPEX_DOSSIER) | Chờ phê duyệt | Hoàn thành xử lý | DOC_STATUS = Hoàn thành xử lý; GL_SEND_STATUS và PAY_SEND_STATUS cập nhật qua sự kiện async |
| 10 | (Vi phạm) Sửa/Xoá khi DOC_STATUS không hợp lệ | Chờ kiểm soát trở lên | (Không đổi) | Chặn (VAL-13); MSG-ERR-STATUS; ghi audit bảo mật |
| 11 | (Vi phạm) Không có quyền EXP_MAKER | (Bất kỳ) | (Không đổi) | Chặn (VAL-14); MSG-ERR-PERMISSION; ghi audit bảo mật |
| 12 | (Hệ thống) Phiên hết hạn | (Bất kỳ) | (Không đổi) | Buộc đăng nhập lại; MSG-ERR-SESSION |

```
                        EXP_MAKER.Save
   Start ─────────────────────────────────▶ Đang hoàn thiện ◀──────────────────────┐
         (NEW)                                     │   │  EXP_MAKER.Edit.Save       │
         EXP_MAKER.Cancel ──▶ End                  │   └────────────────────────────┘
                                                   │
                              EXP_MAKER.Delete      │
                                                   ▼
                                                DELETED
                                      ─────────────────────────────
                              [Từ Hồ sơ cha CHI.CAPEX_DOSSIER]
                                                   │
                              Gửi kiểm soát        ▼
                                          Chờ kiểm soát
                                           ↕ Từ chối / Huỷ → Đang hoàn thiện
                                                   │
                              Gửi phê duyệt        ▼
                                          Chờ phê duyệt
                                           ↕ Từ chối / Huỷ → Đang hoàn thiện
                                                   │
                              Phê duyệt hoàn tất   ▼
                                          Hoàn thành xử lý
```

---

## A12. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `EXP.CAPEX_DOSSIER.3.3.2.NEW` — Form Tạo mới Giấy rút vốn 05.a/TT |
| 2 | `EXP.CAPEX_DOSSIER.3.3.2.VIEW` — Form Xem (read-only), gồm: [Tab] Thông tin thanh toán chi, [Tab] Thông tin nộp thuế, [Tab] Đính kèm tài liệu, [Tab] Lịch sử thay đổi |
| 3 | `EXP.CAPEX_DOSSIER.3.3.2.EDIT` — Form Sửa |
| 4 | `EXP.CAPEX_DOSSIER.3.3.2.DELETE` — Popup xác nhận Xoá (lý do + checkbox) |
| 5 | `EXP.CAPEX_DOSSIER.3.3.2.PRINT` — Màn hình preview và in Giấy rút vốn 05.a/TT |
| 6 | `EXP.CAPEX_DOSSIER.3.3.2.HISTORY` — Tab lịch sử audit (oldValue→newValue) |
| 7 | `CHI.CAPEX_DOSSIER` — Hồ sơ quản lý chi đầu tư (Hồ sơ cha — điểm khởi đầu) |
| 8 | `EXP.CAPEX_DOSSIER.3.3.1` — Đề nghị thanh toán 04.a/TT (nguồn auto-fill dữ liệu) |

---

# B - Đặc tả trường dữ liệu

> **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện; `N (auto)` = tự động, không nhập.
> **7 cột chuẩn**: Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc

---

## B1. Màn hình `EXP.CAPEX_DOSSIER.3.3.2.NEW`, `EXP.CAPEX_DOSSIER.3.3.2.VIEW`, `EXP.CAPEX_DOSSIER.3.3.2.EDIT`

### B1.1. Khu vực Thông tin chung (Header — read-only, auto-fill từ CHI.CAPEX_DOSSIER và EXP.CAPEX_DOSSIER.3.3.1)

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã hồ sơ | PAYMENT_DOSSIER_CODE | TextBox | N (auto) | Từ Hồ sơ cha | Varchar(20) | Read-only; hiển thị theo thông tin Mã hồ sơ từ CHI.CAPEX_DOSSIER |
| Ngày gửi hồ sơ | PAYMENT_DOSSIER_SENT_DATE | Label | N (auto) | Từ Hồ sơ cha | Date | Read-only; định dạng `dd/MM/yyyy` |
| Mã dự án | PROJECT_ID | Label | N (auto) | Từ Hồ sơ cha | Varchar(20) | Read-only |
| Tên dự án | PROJECT_NAME | TextBox | N (auto) | Từ Hồ sơ cha | Varchar(255) | Read-only |
| Mã dự án đặc thù | SPEC_PROJECT_ID | Label | N (auto) | Từ Hồ sơ cha | Varchar | Read-only; hiển thị nếu có |
| Tên dự án đặc thù | SPEC_PROJECT_NAME | TextBox | N (auto) | Từ Hồ sơ cha | Varchar(255) | Read-only; hiển thị nếu có |
| Mã ĐVQHNS | PIPO_ID | Label | N (auto) | Từ Hồ sơ cha | String | Read-only; tham chiếu LOV.01 — PIPO_ID |
| Chủ đầu tư | PIPO_NAME | TextBox | N (auto) | Từ Hồ sơ cha | Varchar(255) | Read-only; tham chiếu LOV.01 — PIPO_Name |
| Địa chỉ | ADDRESS | TextArea | N (auto) | Từ Hồ sơ cha | Text | Read-only |
| Tài khoản | ACCOUNT_NO | TextBox | N | – | String | Read-only; hiển thị theo thông tin từ CHI.CAPEX_DOSSIER |
| Tại cơ quan thanh toán | PAYMENT_AGENCY | TextBox | Y | Từ Hồ sơ cha | String | Tên cơ quan kho bạc thanh toán |
| Căn cứ số giấy đề nghị thanh toán | PAYMENT_REQUEST_NO | TextBox | N | Từ 04.a/TT | String | Số giấy đề nghị thanh toán vốn đầu tư |
| Ngày giấy đề nghị | REQUEST_PAYMENT_DATE | Date | Y | Từ 04.a/TT | Date | `dd/MM/yyyy`; Hiển thị theo mã hạng mục ở EXP.CAPEX_DOSSIER.3.3.1; cho phép sửa |
| Mã hạng mục | PROJECT_ITEM_ID | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.05 — Project_Item_ID; F4 mở tra cứu |
| Tên hạng mục | PROJECT_ITEM_NAME | Label | Y | Từ 04.a/TT | String | Read-only; tự động theo PROJECT_ITEM_ID |
| Mã hợp đồng/dự toán | CONTRACT_ID | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.06 — Contract_ID; F4 mở tra cứu |

### B1.2. Khu vực Thông tin chứng từ (Header — input/edit)

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Số chứng từ | DOC_ID | TextBox | N (auto) | Sinh tự động | String | Hệ thống tự sinh theo BIZ-005: `{4 ký tự loại CT}-{YY}{MM}{DD}-{Mã KB 4 ký tự}{STT 3 ký tự}`; immutable sau khi lưu (VAL-17); disabled trong Edit-mode |
| Ngày chứng từ | DOC_SEND_DATE | Date Picker | Y | – | Date | `dd/MM/yyyy` |
| Số yêu cầu thanh toán | REQUEST_PAYMENT_ID | N (auto) | Sinh tự dộng | String | Hệ thống tự sinh theo BIZ-005; `{4 ký tự đầu của số chứng từ}-{YY}{MM}{DD}-{Mã KB 4 ký tự}{STT 3 ký tự}`; immutable sau khi lưu (VAL-17); disabled trong Edit-mode |
| Loại giấy rút vốn | DOC_TYPE | Label | Y | – | String | Cho phép chọn 1 trong: "Chuyển tiền bảo hành công trình" / "Tạm giữ chờ quyết toán" / "Thanh toán cho đơn vị hưởng" |
| Loại thanh toán | PAYMENT_TYPE | Checkbox | C | Từ 04.a/TT | Enum | LOV.PaymentType; Giá trị: Tạm ứng / Thực chi / Ứng trước chưa đủ ĐK / Ứng trước đủ ĐK; Xác định theo Loại thanh toán và Loại KHV trên ĐNTT 04.a/TT (VAL-05) |
| Hình thức thanh toán | PAYMENT_METHOD | Checkbox | C | Từ 04.a/TT | Enum | LOV.PaymentMethod; Cho phép chọn: "Chuyển khoản" / "Tiền mặt tại KB" / "Tiền mặt tại NH"; Cascading các trường phụ thuộc (VAL-06) |
| Trạng thái chứng từ | DOC_STATUS | Label | N (auto) | Đang hoàn thiện | Enum | Read-only; đồng bộ từ Hồ sơ cha (BIZ-011); Giá trị: Đang hoàn thiện / Đã hoàn thiện / Chờ kiểm soát / Từ chối kiểm soát / Huỷ kiểm soát / Chờ phê duyệt / Từ chối phê duyệt / Huỷ phê duyệt / Hoàn thành xử lý |
| Loại tiền | CURRENCY_CODE | Combobox | Y | VND | String | LOV.Currency_type; Giá trị: VND, USD; Cascading EXCHANGE_RATE fields (VAL-20) |
| Loại tỷ giá | EXCHANGE_RATE_TYPE | Combobox | C | – | String | LOV.ExchangeRateType; Bắt buộc khi CURRENCY_CODE ≠ VND; Giá trị: "Tỷ giá công ty" / "Tỷ giá NSD" |
| Ngày tỷ giá | EXCHANGE_RATE_DATE | Date Picker | C | – | Date | `dd/MM/yyyy`; Bắt buộc khi CURRENCY_CODE ≠ VND VÀ Loại tỷ giá = "Tỷ giá công ty" |
| Tỷ giá | EXCHANGE_RATE | Decimal | C | 1,00 | Decimal | Nếu CURRENCY_CODE = VND: mặc định 1,00, không sửa; Nếu Loại tỷ giá = "Tỷ giá công ty": tự động theo danh mục; Nếu Loại tỷ giá = "Tỷ giá NSD": cho phép nhập (BIZ-009) |
| Trạng thái chứng từ | DOCUMENT_STATUS | Label | N (auto) | Đang hoàn thiện | String | Read-only; cập nhật theo luồng kiểm soát và phê duyệt Hồ sơ cha |
| Thao tác | ACTIONS | Icon group | Y | – | – | Tổ hợp nút: Xem (F3), Sửa (F2), Xoá (Delete), Lịch sử (Alt+H), In chứng từ |

### B1.3. \[Tab\] Thông tin thanh toán chi

#### B1.3.1. Area 1st — Thông tin thanh toán

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Niên độ | FISCAL_YEAR | Date Picker | Y | Từ 04.a/TT | String | Năm niên độ; cho phép sửa |
| Ngày hạch toán | POSTING_DATE | Date | Y | – | Date | Nếu Niên độ = Năm hiện tại: = Ngày phê duyệt chứng từ (auto). Nếu Niên độ = (Năm hiện tại – 1): = 31/12/Niên độ; Phải thuộc kỳ kế toán đang mở (VAL-21, BIZ-016) |
| Phương thức thanh toán | PAYMENT_METHOD | Dropdown | C | – | String | Hiển thị theo Hình thức thanh toán: (1) Tiền mặt tại KB → Séc / LKB; (2) Tiền mặt tại NH → Điện tử (fixed); (3) Chuyển khoản → Điện tử / LKB |
| Phương thức thanh toán với ngân hàng | PAYMENT_METHOD_BANK | Dropdown | C | – | String | Phụ thuộc Hình thức + Phương thức (xem BIZ chi tiết field): "01-Thanh toán song phương" / "03-Thanh toán liên ngân hàng"; để trống khi Hình thức = Tiền mặt tại KB và PT = Séc |
| Tại | BANK_TREASURY | Dropdown | Y | – | String | Giá trị: "Ngân hàng" / "Kho bạc"; phụ thuộc Hình thức thanh toán (VAL-12) |
| Mã KBNN/Ngân hàng | BANK_BRANCH_CODE | Dropdown + Lookup | Y | – | String | LOV.06.1 — Danh mục ngân hàng (Bank_Citad_Code hoặc Treasury_No); F4 mở tra cứu |
| Đơn vị nhận tiền | BENEFICIARY_NAME | TextBox | C | – | Varchar | Bắt buộc khi Hình thức = "Chuyển khoản"; để trống khi Hình thức = Tiền mặt tại KB/NH |
| Tài khoản (đơn vị nhận) | BENEFICIARY_ACCOUNT | TextBox | C | – | String | Bắt buộc khi Hình thức = "Chuyển khoản" và Tại = "Ngân hàng" |
| Người nhận tiền | RECEIVER_NAME | TextBox | C | – | Varchar | Bắt buộc khi Hình thức = Tiền mặt tại KB/NH (BIZ-014, VAL-22) |
| CCCD/Căn cước số | CITIZEN_ID | TextBox | C | – | String | Bắt buộc khi Hình thức = Tiền mặt tại KB/NH (BIZ-014, VAL-22) |
| Ngày cấp | CITIZEN_ID_DATE | Date Picker | C | – | Date | `dd/MM/yyyy`; Bắt buộc khi Hình thức = Tiền mặt tại KB/NH |
| Nơi cấp | CITIZEN_ID_PLACE | TextBox | C | – | Varchar | Bắt buộc khi Hình thức = Tiền mặt tại KB/NH |
| Nội dung | CONTENT | TextBox | Y | – | Text | Nội dung thanh toán; không được để trống |
| Trạng thái gửi GL | GL_SEND_STATUS | Label | C | – | String | Read-only; "Chưa gửi GL" / "Gửi GL thành công" |
| Trạng thái hạch toán GL | GL_POSTING_STATUS | Label | C | – | String | Read-only; xem các giá trị tại B1.3 |
| Trạng thái gửi quản lý thu | REV_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Gửi quản lý thu thành công" / "Gửi quản lý thu không thành công" / "Chưa gửi quản lý thu"; để trống khi chưa phê duyệt |
| Trạng thái chuyển liên kho bạc | INTER_TREASURY_TRANSFER | Labe | C| - | String | Read-only |; Giá trị: "chuyển LKB thành công" / "chuyển LKB không thành công"; chỉ có giá trị khi phương thức thanh toán là "liên kho bạc" (LKB) |


**Bảng chi tiết hạch toán — Dòng Nợ** *(dạng grid, có thể thêm dòng; ít nhất 1 dòng — BIZ-013)*

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Năm KHV | CAPITAL_YEAR | Dropdown + Lookup | Y | Từ 04.a/TT | String | Danh mục các năm từ 2010–Năm hiện tại; cho phép sửa |
| Kéo dài | EXTENDED_YEAR | Label | Y | Từ 04.a/TT | Number | Hiển thị theo mã hạng mục 04.a/TT; cho phép sửa |
| Mã quỹ | GL_SEGMENT1 | Dropdown + Lookup | Y | Từ 04.a/TT | Number | LOV.07.1 — Segment_Code; cho phép sửa |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | Từ 04.a/TT | String | Viết tắt của tài khoản tự nhiên; LOV.07.2 — Segment_Code; cho phép sửa |
| Mã năm ngân sách | GL_SEGMENT3 | Label | Y | Từ 04.a/TT | String | LOV.07.3; cho phép sửa |
| Cấp ngân sách | GL_SEGMENT5 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.5 — Segment_Code; cho phép sửa |
| Mã địa bàn hành chính | GL_SEGMENT7 | Label | Y | Từ 04.a/TT | String | LOV.07.7; cho phép sửa |
| Mã NDKT | GL_SEGMENT5 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.4 — Segment_Code; cho phép sửa |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.8 — Segment_Code; cho phép sửa |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.9 — Segment_Code; cho phép sửa |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.12 — Segment_Code; cho phép sửa |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.10 — Segment_Code; cho phép sửa |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | Từ 04.a/TT | String | LOV.07.13 — Segment_Code; mặc định "000"; cho phép sửa |
| Thanh toán cho ĐV hưởng | BENEFICIARY_AMOUNT | Currency Field | N | – | Decimal | Số tiền thanh toán cho đơn vị hưởng; mặc định 0,00; cho phép sửa |
| Trạng thái gửi GL | GL_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Chưa gửi GL" / "Gửi GL thành công"; chỉ hiển thị khi DOC_STATUS = "Hoàn thành xử lý" |
| Trạng thái hạch toán GL | GL_POSTING_STATUS | Label | C | – | String | Read-only; Giá trị: "Chưa hạch toán GL" / "Đã hạch toán GL chưa kết sổ" / "Đã hạch toán GL đã kết sổ" / "Lỗi hạch toán GL" |
| Trạng thái gửi quản lý thanh toán | PAY_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Gửi NH thành công" / "Gửi NH thất bại" / Lỗi khác; để trống khi chưa phê duyệt |

**Bảng chi tiết hạch toán — Dòng Có** *(dạng grid hàng ngang theo từng phân đoạn mã)*

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quỹ | GL_SEGMENT1 | Label | Y | 01 | String | Mặc định "01"; không cho sửa |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code; mặc định "0" |
 | Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | 0000 | String | LOV.07.4 — Segment_Code; mặc định "0000" |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | 000 | String | LOV.07.8 — Segment_Code; mặc định "000" |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | 000 | String | LOV.07.9 — Segment_Code; mặc định "000" |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | 00 | String | LOV.07.12 — Segment_Code; mặc định "00" |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | 00000 | String | LOV.07.10— Segment_Code; mặc định "00000" |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.13 — Segment_Code; mặc định "000" |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Có (BIZ-015) |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá; không nhập đồng thời với Có |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Nợ (BIZ-015) |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá; không nhập đồng thời với Nợ |

#### B1.3.2. Area 2nd — Thanh toán liên kho bạc *(Chỉ hiển thị khi Hình thức = "Tiền mặt tại KB" VÀ Phương thức = Điện tử/LKB)*

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| SHKB đến | TREASURY_BRANCH_NO | Number | C | – | String | LOV.06.1 — Treasury_No; Số hiệu kho bạc đến |
| Tên SHKB đến | TREASURY_BRANCH_NAME | Label | C | – | String | LOV.06.1 — BANK_Branch_Name; tự động theo SHKB |
| Tài khoản GHI CÓ | COA_CREDIT | Number | C | – | Number | Hiển thị dạng grid 13 phân đoạn COA: {Mã quỹ}.{TKTN}.{Mã năm NS}.{Mã NDKT}.{Cấp NS}.{DVQHNS}.{Địa bàn HC}.{Mã chương}.{Mã ngành KT}.{Mã CTMT,DA}.{Mã KBNN}.{Mã nguồn NSNN}.{Mã dự phòng} — các giá trị mặc định và quy tắc nhập theo đặc tả nghiệp vụ |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có (BIZ-015) |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá |

#### B1.3.3. Area 3rd — Thông tin hạch toán đồng thời *(Chỉ hiển thị ở kỳ hạch toán 13 của năm ngân sách; khi Niên độ = Năm hiện tại – 1 VÀ Ngày hạch toán = 31/12/Niên độ)*
| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Ngày hạch toán | BUDGET_EXP_POSTING_DATE | Date | C | Ngày phê duyệt CT | Date | `dd/MM/yyyy`; = Ngày phê duyệt chứng từ (auto) |
| Niên độ | FISCAL_YEAR_BUDGET | Label | C | Năm hiện tại | String | Mặc định = Năm hiện tại; cho phép sửa |
| Trạng thái gửi GL | GL_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Chưa gửi GL" / "Gửi GL thành công"; chỉ hiển thị khi DOC_STATUS = "Hoàn thành xử lý" |
| Trạng thái hạch toán GL | GL_POSTING_STATUS | Label | C | – | String | Read-only; Giá trị: "Chưa hạch toán GL" / "Đã hạch toán GL chưa kết sổ" / "Đã hạch toán GL đã kết sổ" / "Lỗi hạch toán GL" |
| Trạng thái gửi quản lý thanh toán | PAY_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Gửi NH thành công" / "Gửi NH thất bại" / Lỗi khác; để trống khi chưa phê duyệt |

**Bảng chi tiết hạch toán — Dòng Nợ** *(dạng grid hàng ngang theo từng phân đoạn mã)*

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quỹ | GL_SEGMENT1 | Label | Y | 01 | String | Mặc định "01"; không cho sửa |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code; mặc định "0" |
 | Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | 0000 | String | LOV.07.4 — Segment_Code; mặc định "0000" |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | 000 | String | LOV.07.8 — Segment_Code; mặc định "000" |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | 000 | String | LOV.07.9 — Segment_Code; mặc định "000" |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | 00 | String | LOV.07.12 — Segment_Code; mặc định "00" |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | 00000 | String | LOV.07.10— Segment_Code; mặc định "00000" |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.13 — Segment_Code; mặc định "000" |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Có (BIZ-015) |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá; không nhập đồng thời với Có |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Nợ (BIZ-015) |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá; không nhập đồng thời với Nợ |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá |

**Bảng chi tiết hạch toán — Dòng Có** *(dạng grid hàng ngang theo từng phân đoạn mã)*

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã quỹ | GL_SEGMENT1 | Label | Y | 01 | String | Mặc định "01"; không cho sửa |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code; mặc định "0" |
 | Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | 0000 | String | LOV.07.4 — Segment_Code; mặc định "0000" |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | 000 | String | LOV.07.8 — Segment_Code; mặc định "000" |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | 000 | String | LOV.07.9 — Segment_Code; mặc định "000" |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | 00 | String | LOV.07.12 — Segment_Code; mặc định "00" |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | 00000 | String | LOV.07.10— Segment_Code; mặc định "00000" |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.13 — Segment_Code; mặc định "000" |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Có (BIZ-015) |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá; không nhập đồng thời với Có |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời với Nợ (BIZ-015) |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá; không nhập đồng thời với Nợ |
| Số tiền Nợ NT | DEBIT_ORIGIN_CURRENCY_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | = Nợ NT × Tỷ giá |
| Số tiền Có NT | CREDIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | = Có NT × Tỷ giá |
### B1.4. \[Tab\] Thông tin nộp thuế *(Hiển thị khi có số tiền thuế giá trị gia tăng từ Đề nghị thanh toán 04.a/TT)*
| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Số yêu cầu thanh toán | REQUEST_PAYMENT_ID | N (auto) | Sinh tự dộng | String | Hệ thống tự sinh theo BIZ-005; `{4 ký tự đầu của số chứng từ}-{YY}{MM}{DD}-{Mã KB 4 ký tự}{STT 3 ký tự}`; immutable sau khi lưu (VAL-17); disabled trong Edit-mode |
| Tên đơn vị nộp thuế | TAX_PAYER_NAME | TextBox | C | Auto nếu từ DVC | Varchar | Bắt buộc khi có thuế GTGT từ 04.a/TT; Auto Fill nếu nhận từ DVC |
| Mã số thuế | TAX_CODE | TextBox | C | Auto nếu từ DVC | String | Bắt buộc khi có thuế GTGT |
| Số tờ khai/Số quyết định/Số thông báo | DECLARATION_NO | TextBox | C | Auto nếu từ DVC | String | Bắt buộc khi có thuế GTGT |
| Mã định danh khoản thuế | TAX_ID | TextBox | C | Auto nếu từ DVC | String | Bắt buộc khi có thuế GTGT |
| Cơ quan quản lý thu | TAX_MANAGEMENT_AGENCY | TextBox | C | Auto nếu từ DVC | Varchar | Bắt buộc khi có thuế GTGT |
| Mã cơ quan thu | BUDGET_REV_AGENCY_CODE | Label | C | Auto nếu từ DVC | String | Bắt buộc khi có thuế GTGT |
| Kỳ thuế | TAX_PERIOD | Label | C | Auto nếu từ DVC | String | Format MM-YY; bắt buộc khi có thuế GTGT |
| Loại thuế | TAX_TYPE | Label | C | – | String | Nhận 1 trong 3 giá trị: "01", "02", "03"; bắt buộc khi có thuế GTGT |
| Trạng thái gửi GL | GL_SEND_STATUS | Label | C | – | String | Read-only; "Chưa gửi GL" / "Gửi GL thành công" |
| Trạng thái hạch toán GL | GL_POSTING_STATUS | Label | C | – | String | Read-only; xem các giá trị tại B1.3 |
| Trạng thái gửi quản lý thu | REV_SEND_STATUS | Label | C | – | String | Read-only; Giá trị: "Gửi quản lý thu thành công" / "Gửi quản lý thu không thành công" / "Chưa gửi quản lý thu"; để trống khi chưa phê duyệt |

**Bảng chi tiết hạch toán nộp thuế — Dòng Nợ**

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Năm KHV | CAPITAL_YEAR | Dropdown + Lookup | Y | – | Number | Danh mục các năm từ 2010–Năm hiện tại |
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code |
| Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | – | String | LOV.07.7 — Segment_Code |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | – | String | LOV.07.5 — Segment_Code |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | – | String | LOV.07.6 — Segment_Code |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | – | String | LOV.07.10 — Segment_Code |
| Kéo dài | EXTENDED | Label | Y | – | Number | |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | – | String | LOV.07.9 — Segment_Code |
| Nộp thuế | TAX_AMOUNT | Currency Field | N | – | Decimal | Số tiền nộp thuế |
| Số tiền Nợ VND | DEBIT_VND_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có |

**Bảng chi tiết hạch toán nộp thuế — Dòng Nợ**

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code; ví dụ: TK 7111 |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | 0 | String | LOV.07.5 — Segment_Code |
| Mã cơ quan thu | BUDGET_REV_AGENCY_CODE | Label | N | – | String | Auto từ thông tin nộp thuế phía trên |
| Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | – | String | LOV.07.8 — Segment_Code |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | – | String | LOV.07.9 — Segment_Code |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | 00 | String | LOV.07.12 — Segment_Code |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | 000 | String | LOV.07.10 — Segment_Code |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.13 — Segment_Code |
| Số tiền Nợ VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có (BIZ-015) |
**Bảng chi tiết hạch toán nộp thuế — Dòng Có**

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| TKTN | GL_SEGMENT2 | Dropdown + Lookup | Y | – | String | LOV.07.2 — Segment_Code; ví dụ: TK 7111 |
| Mã năm ngân sách | GL_SEGMENT3 | Dropdown | Y | Năm nay | String | Mặc định năm nay |
| Cấp NS | GL_SEGMENT5 | Dropdown + Lookup | Y | 0 | String | LOV.07.5 — Segment_Code |
| Mã cơ quan thu | BUDGET_REV_AGENCY_CODE | Label | N | – | String | Auto từ thông tin nộp thuế phía trên |
| Mã NDKT | GL_SEGMENT4 | Dropdown + Lookup | Y | – | String | LOV.07.4 — Segment_Code |
| Mã chương | GL_SEGMENT8 | Dropdown + Lookup | Y | – | String | LOV.07.8 — Segment_Code |
| Mã ngành KT | GL_SEGMENT9 | Dropdown + Lookup | Y | – | String | LOV.07.9 — Segment_Code |
| Mã nguồn NSNN | GL_SEGMENT12 | Dropdown + Lookup | Y | 00 | String | LOV.07.12 — Segment_Code |
| Mã CTMT, DA | GL_SEGMENT10 | Dropdown + Lookup | Y | 000 | String | LOV.07.10 — Segment_Code |
| Mã dự phòng | GL_SEGMENT13 | Dropdown + Lookup | Y | 000 | String | LOV.07.13 — Segment_Code |
| Số tiền Có VNĐ | CREDIT_ORIGIN_AMOUNT | Currency Field | C | 0,00 | Decimal | Không nhập đồng thời Nợ và Có (BIZ-015) |
### B1.5. \[Tab\] Đính kèm tài liệu

> Sử dụng chuẩn đính kèm chung của hệ thống VDBAS — không cần khai báo thêm field. Tham chiếu đặc tả đính kèm chuẩn tại tài liệu riêng.

---

## B2. Màn hình `EXP.CAPEX_DOSSIER.3.3.2.DELETE` — Popup xác nhận Xoá

| Trường (VN) | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Số chứng từ | DOC_ID | Label | – | Tự lấy | String | Read-only |
| Ngày chứng từ | DOC_SEND_DATE | Label | – | Tự lấy | Date | Read-only |
| Trạng thái hiện tại | DOC_STATUS | Label | – | Tự lấy | String | Phải = "Đang hoàn thiện" / "Đã hoàn thiện" (VAL-13) |
| Lý do xoá | DELETE_REASON | TextArea | Y | – | String | ≥ 10 ký tự, ≤ 500 ký tự (VAL-16, BIZ-006) |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y | Off | Boolean | Phải tick mới enable nút "Xác nhận xoá" |
| Người xoá | DELETED_BY | Label | – | User hiện tại | String | Auto từ session |
| Thời gian xoá | DELETED_DATE | Label | – | Thời gian hệ thống | DateTime | `dd/MM/yyyy hh:MM:ss`; Auto |

## B3. Màn hình `EXP.CAPEX_DOSSIER.3.3.2.HISTORY` — Tab lịch sử thay đổi

| Trường (VN) | Trường (ENG) | Loại | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|
| STT | SEQ_NO | Label | Number | Tự tăng; sort DESC (mới nhất lên đầu) |
| Hành động | ACTION | Badge | String | CREATE / UPDATE / DELETE |
| Thời điểm | EVENT_AT | Label | DateTime | `dd/MM/yyyy hh:MM:ss` |
| Người thực hiện | ACTOR | Label | String | Username + Họ tên + Vai trò |
| Trường thay đổi | CHANGED_FIELD | Label | String | Tên field bị thay đổi |
| Giá trị cũ | OLD_VALUE | Text (expandable) | String | Giá trị trước khi thay đổi |
| Giá trị mới | NEW_VALUE | Text (expandable) | String | Giá trị sau khi thay đổi |
| IP | CLIENT_IP | Label | String | IP máy trạm thực hiện |

## B4. Quy ước chung về đặc tả trường

| STT | Quy ước |
|---|---|
| 1 | DateTime hiển thị `dd/MM/yyyy hh:MM:ss`; Date hiển thị `dd/MM/yyyy`; chuẩn timezone Asia/Ho_Chi_Minh |
| 2 | Trường Lookup có icon kính lúp + phím tắt `F4` |
| 3 | Trường bắt buộc đánh dấu `*` đỏ; conditional mandatory đánh dấu `(*)` + tooltip điều kiện |
| 4 | Field disabled có tooltip giải thích lý do; field lỗi validate hiển thị viền đỏ + thông báo dưới ô |
| 5 | TextBox/TextArea chống XSS bằng sanitize; chống SQL Injection bằng prepared statement |
| 6 | Currency Field định dạng số phân cách nghìn, 2 chữ số thập phân; ví dụ: `1,374,000,000.00` |
| 7 | `DOC_ID` disabled trong Edit-mode — backend reject thay đổi (VAL-17, BIZ-005) |
| 8 | Mọi trường ENG dùng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB và API |
| 9 | Trạng thái GL/PAY (GL_SEND_STATUS, GL_POSTING_STATUS, PAY_SEND_STATUS, REV_SEND_STATUS) chỉ hiển thị khi DOC_STATUS = "Hoàn thành xử lý"; để trống ở các trạng thái khác |

---

# C - Đặc tả nút chức năng

## C1 - Chi tiết đặc tả nút chức năng

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt | Phím tắt | Loại nút | Mô tả | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| 1 | Tạo mới | New | `EXP.CAPEX_DOSSIER.3.3.2.NEW.OPEN` | On click | `Ctrl+N` | Primary | Mở form Tạo mới chứng từ; auto-fill từ Hồ sơ cha | Chỉ `EXP_MAKER`; hiển thị trên Hồ sơ cha CHI.CAPEX_DOSSIER khi DOC_STATUS cho phép |
| 2 | Lưu | Save | `EXP.CAPEX_DOSSIER.3.3.2.NEW.SAVE` | On click | `Ctrl+S` | Primary | Validate đầy đủ §A8; lưu "Đang hoàn thiện"; ghi audit | Trên NEW và EDIT |
| 3 | Xem | View | `EXP.CAPEX_DOSSIER.3.3.2.VIEW.OPEN` | On click row / link | `F3` | Ghost | Mở form read-only | Trên danh sách chứng từ của Hồ sơ cha |
| 4 | Sửa | Edit | `EXP.CAPEX_DOSSIER.3.3.2.EDIT.OPEN` | On click | `F2` | Ghost | Mở form editable; load F-VER; DOC_ID disabled | Enable khi DOC_STATUS = "Đang hoàn thiện"/"Đã hoàn thiện" + quyền EXP_MAKER |
| 5 | Lưu (Sửa) | Save (Edit) | `EXP.CAPEX_DOSSIER.3.3.2.EDIT.SAVE` | On click | `Ctrl+S` | Primary | F-VER+1; ghi audit oldValue→newValue | Trên EDIT form |
| 6 | Xoá | Delete | `EXP.CAPEX_DOSSIER.3.3.2.DELETE.OPEN` | On click | `Delete` | Danger | Mở popup Xoá (lý do + checkbox) | Enable khi DOC_STATUS = "Đang hoàn thiện"/"Đã hoàn thiện" + quyền EXP_MAKER |
| 7 | Xác nhận xoá | Confirm Delete | `EXP.CAPEX_DOSSIER.3.3.2.DELETE.CONFIRM` | On click | `Enter` (trong popup) | Danger | Soft-delete; ghi audit | Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 8 | Huỷ | Cancel | `EXP.CAPEX_DOSSIER.3.3.2.NEW.CANCEL` / `EXP.CAPEX_DOSSIER.3.3.2.EDIT.CANCEL` | On click | `Esc` | Default | Hỏi xác nhận MSG-CFM-CANCEL nếu dirty; đóng form | |
| 9 | Lịch sử | History | `EXP.CAPEX_DOSSIER.3.3.2.VIEW.HISTORY` | On click tab | `Alt+H` | Default | Mở tab Lịch sử thay đổi | Trên NEW/EDIT/VIEW |
| 10 | In chứng từ | Print | `EXP.CAPEX_DOSSIER.3.3.2.PRINT.OPEN` | On click | `Ctrl+P` | Default | Mở màn hình preview in Giấy rút vốn 05.a/TT | Trên VIEW (sau khi chứng từ hoàn thiện) |
| 11 | Tra cứu | Lookup | (Mở popup tra cứu LOV tương ứng) | On click kính lúp | `F4` | Ghost | Mở popup tra cứu danh mục; chọn → trả về field | Trên các trường Dropdown+Lookup |

---

## C2 - Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
|---|---|
| 1 | Kiểm tra quyền trước khi hiển thị: `EXP_MAKER` thấy tất cả nút; `EXP_VIEWER` chỉ thấy Xem + In chứng từ |
| 2 | Nút **Sửa/Xoá**: enable khi DOC_STATUS = "Đang hoàn thiện" hoặc "Đã hoàn thiện" (VAL-13) **và** quyền EXP_MAKER (VAL-14) |
| 3 | Nút **Lưu**: disable khi form có lỗi validate cứng; enable lại khi đã fix |
| 4 | Nút **Xác nhận xoá**: disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 5 | Mỗi màn hình chỉ có **1 nút Primary** (nút Lưu); nút Tạo mới = Primary trên màn hình Hồ sơ cha (override) |
| 6 | Phòng chống double-submit: client disable ngay sau click + idempotency key phía server |
| 7 | Phiên hết hạn → mọi nút disable; MSG-ERR-SESSION; redirect đăng nhập |
| 8 | Mỗi thao tác thành công: ghi audit `EXP.CAPEX_DOSSIER.3.3.2.AUDIT.WRITE` (BIZ-007) |
| 9 | Mọi nút disable hiển thị tooltip giải thích lý do; hỗ trợ ARIA label |

---

## C3 - Quy ước phím tắt

- **Nhóm soạn thảo**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Esc` (Huỷ).
- **Nhóm thao tác bản ghi**: `F2` (Sửa), `F3` (Xem), `Delete` (Xoá), `Ctrl+P` (In chứng từ).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường Dropdown+Lookup.
- **Nhóm điều hướng tab**: `Alt+H` (Lịch sử thay đổi).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

---

# D - Testcase: EXP.CAPEX_DOSSIER.3.3.2

> **Cấu trúc mã TC:** `EXP.CAPEX_DOSSIER.3.3.2.TC.<Nhóm>.<STT>`
> **Nhóm:** 1 = Tạo mới, 2 = Xem, 3 = Cập nhật, 4 = Xoá, 5 = Nghiệp vụ đặc thù

---

## D1 - Nhóm 1 — Tạo mới

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.01 | Tạo chứng từ thành công — Chuyển khoản VND | Positive | EXP_MAKER đăng nhập; Hồ sơ cha ở trạng thái "Đang hoàn thiện"; 04.a/TT đã có | Bấm Tạo mới; kiểm tra auto-fill từ Hồ sơ cha; nhập Ngày CT, Hình thức = Chuyển khoản, Loại tiền = VND, thêm ≥1 dòng hạch toán; bấm Lưu | Lưu thành công; DOC_ID sinh đúng format BIZ-005; DOC_STATUS = "Đang hoàn thiện"; MSG-OK-SAVE; ghi audit | BIZ-005, BIZ-007, BIZ-010, VAL-01 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.02 | Tạo thất bại — Thiếu dòng hạch toán | Negative | EXP_MAKER đăng nhập | Không thêm dòng chi tiết; bấm Lưu | MSG-ERR-MIN-DETAIL-ROW; chặn lưu | BIZ-013 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.03 | Tạo thất bại — Tiền mặt thiếu Người nhận tiền | Negative | EXP_MAKER đăng nhập | Chọn Hình thức = "Tiền mặt tại KB"; không nhập RECEIVER_NAME; bấm Lưu | MSG-ERR-RECEIVER-REQUIRED; highlight các trường bắt buộc; chặn lưu | BIZ-014, VAL-22 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.04 | Tạo thất bại — Nợ Có không cân | Negative | EXP_MAKER đăng nhập | Nhập dòng hạch toán có Tổng Nợ ≠ Tổng Có; bấm Lưu | MSG-ERR-AMOUNT-MISMATCH; chặn lưu | BIZ-012, VAL-10 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.05 | Tạo thất bại — Nợ Có đồng thời trên 1 dòng | Negative | EXP_MAKER đăng nhập | Nhập cùng lúc DEBIT_VND_AMOUNT và CREDIT_VND_AMOUNT > 0 trên cùng dòng | MSG-ERR-DEBIT-CREDIT-CONFLICT; highlight dòng; chặn lưu | BIZ-015 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.06 | Tạo thất bại — Ngày hạch toán ngoài kỳ | Negative | Kỳ kế toán mở: tháng 5/2026 | Nhập POSTING_DATE = 01/01/2026 (ngoài kỳ); bấm Lưu | MSG-ERR-POSTING-PERIOD; highlight trường; chặn lưu | BIZ-016, VAL-21 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.07 | Tạo thành công — Loại tiền USD | Positive | EXP_MAKER đăng nhập | Chọn CURRENCY_CODE = USD; nhập EXCHANGE_RATE_TYPE, EXCHANGE_RATE_DATE, EXCHANGE_RATE; điền đủ; bấm Lưu | Lưu thành công; EXCHANGE_RATE × số tiền NT = số tiền VND đúng | BIZ-009, VAL-20 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.08 | Tạo thất bại — USD không nhập tỷ giá | Negative | EXP_MAKER đăng nhập | Chọn CURRENCY_CODE = USD; không nhập EXCHANGE_RATE_TYPE; bấm Lưu | MSG-ERR-CURRENCY-REQUIRE-RATE; chặn lưu | VAL-20, BIZ-009 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.09 | Tạo thất bại — Không có quyền | Negative | User vai trò EXP_VIEWER | Truy cập nút Tạo mới | Nút ẩn/disable; MSG-ERR-PERMISSION nếu truy cập trực tiếp | BIZ-001, VAL-14 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.10 | Tạo thất bại — CCID không hợp lệ | Negative | EXP_MAKER đăng nhập | Nhập tổ hợp GL_SEGMENT không hợp lệ theo Cross-Validation; bấm Lưu | MSG-ERR-CCID-INVALID; chặn lưu | VAL-19 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.1.11 | Huỷ form khi đã nhập | Positive | EXP_MAKER đang nhập dữ liệu | Bấm Huỷ / Esc | Popup MSG-CFM-CANCEL; xác nhận → đóng form; không lưu | A1 |

---

## D2 - Nhóm 2 — Xem

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.2.TC.2.01 | Xem chứng từ thành công | Positive | Chứng từ đã tạo; NSD có quyền EXP_VIEWER+ | Click link DOC_ID trên danh sách của Hồ sơ cha | Form read-only; hiển thị đầy đủ B1.1 → B1.5 + tab Lịch sử | §A4 bước 4 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.2.02 | Tab Lịch sử thay đổi | Positive | Chứng từ đã sửa nhiều lần | Mở VIEW; click tab Lịch sử (Alt+H) | Hiển thị CREATED_BY, CREATED_DATE, oldValue→newValue, IP, action | BIZ-007, BIZ-008 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.2.03 | Xem thất bại — Không có quyền | Negative | User không có quyền | Truy cập trực tiếp URL VIEW | MSG-ERR-PERMISSION | BIZ-001, VAL-14 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.2.04 | Trạng thái GL hiển thị đúng | Positive | Chứng từ đã phê duyệt (HOàn thành xử lý) | Mở VIEW | GL_SEND_STATUS, GL_POSTING_STATUS, PAY_SEND_STATUS hiển thị; các trạng thái khác để trống | B4 quy ước 9 |

---

## D3 - Nhóm 3 — Cập nhật

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.2.TC.3.01 | Sửa thành công | Positive | Chứng từ "Đang hoàn thiện"; EXP_MAKER đăng nhập | Bấm Sửa; thay đổi CONTENT; bấm Lưu | F-VER+1; audit oldValue→newValue; MSG-OK-SAVE | VAL-15, BIZ-007 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.3.02 | Sửa thất bại — Đang kiểm soát | Negative | Chứng từ DOC_STATUS = "Chờ kiểm soát" | Bấm Sửa | Nút Sửa disable; MSG-ERR-STATUS | BIZ-011, VAL-13 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.3.03 | Sửa thất bại — Optimistic lock | Negative | 2 người dùng cùng mở EDIT | User A lưu trước; User B cố lưu | MSG-ERR-LOCK; yêu cầu tải lại | VAL-15 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.3.04 | DOC_ID immutable khi Sửa | Negative | Chứng từ "Đang hoàn thiện" | Mở EDIT; trường DOC_ID | DOC_ID disabled; backend reject nếu gửi thay đổi | VAL-17, BIZ-005 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.3.05 | Sửa thất bại — Không có quyền | Negative | Chứng từ "Đang hoàn thiện"; User = EXP_VIEWER | Bấm Sửa | MSG-ERR-PERMISSION; ghi audit | VAL-14, BIZ-001 |

---

## D4 - Nhóm 4 — Xoá

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.2.TC.4.01 | Xoá thành công | Positive | Chứng từ "Đang hoàn thiện"; EXP_MAKER | Bấm Xoá; nhập lý do ≥ 10 ký tự; tick checkbox; Xác nhận | DOC_STATUS=DELETED; ẩn khỏi danh sách Hồ sơ cha; MSG-OK-DELETE; ghi audit | VAL-16, BIZ-002 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.4.02 | Xoá thất bại — Đang kiểm soát | Negative | Chứng từ "Chờ kiểm soát" | Bấm Xoá | Nút disable; MSG-ERR-STATUS | VAL-13, BIZ-011 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.4.03 | Xoá thất bại — Lý do quá ngắn | Negative | Chứng từ "Đang hoàn thiện"; EXP_MAKER | Popup Xoá; nhập lý do < 10 ký tự | Nút Xác nhận disable; MSG-ERR-DELETE-CFM | VAL-16 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.4.04 | Xoá thất bại — Chưa tick checkbox | Negative | Chứng từ "Đang hoàn thiện"; EXP_MAKER | Popup Xoá; nhập đủ lý do; không tick checkbox | Nút Xác nhận vẫn disable | VAL-16 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.4.05 | DOC_ID không tái sử dụng sau xoá | Negative | DOC_ID="05.a_260528_0011003" đã DELETED | Tạo mới chứng từ sinh trùng DOC_ID | MSG-ERR-DUPLICATE; chặn lưu | BIZ-003, VAL-11 |

---

## D5 - Nhóm 5 — Nghiệp vụ đặc thù

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.01 | Trạng thái đồng bộ khi Hồ sơ gửi kiểm soát | Positive | Chứng từ "Đang hoàn thiện" | Hồ sơ cha gửi kiểm soát thành công | DOC_STATUS chứng từ → "Chờ kiểm soát"; Sửa/Xoá bị disable | BIZ-011, A11 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.02 | Trạng thái đồng bộ khi Hồ sơ bị từ chối kiểm soát | Positive | Chứng từ "Chờ kiểm soát" | Kiểm soát viên từ chối Hồ sơ cha | DOC_STATUS → "Đang hoàn thiện"; Sửa/Xoá được enable lại | A11 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.03 | Kỳ hạch toán 13 — hiển thị Area 3rd | Positive | EXP_MAKER đăng nhập | Chọn Niên độ = (Năm hiện tại - 1); POSTING_DATE = 31/12/Niên độ | Area 3rd "Thông tin hạch toán đồng thời" xuất hiện tự động | A5.A4 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.04 | Thanh toán liên kho bạc — hiển thị Area 2nd | Positive | EXP_MAKER đăng nhập | Chọn Hình thức = "Tiền mặt tại KB"; Phương thức = Điện tử | Area 2nd "Thanh toán liên kho bạc" xuất hiện | A5.A5 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.05 | Tab Nộp thuế bắt buộc khi có thuế GTGT | Positive | 04.a/TT có số tiền thuế GTGT > 0 | Mở form tạo mới | Tab Thông tin nộp thuế hiển thị; các trường TAX_PAYER_NAME, TAX_CODE, v.v. bắt buộc | B1.4 |
| EXP.CAPEX_DOSSIER.3.3.2.TC.5.06 | Tổng tiền cân đối sau thêm dòng hạch toán | Positive | EXP_MAKER đang nhập | Thêm dòng hạch toán mới; cập nhật số tiền | Hệ thống tự tính lại tổng; hiển thị chênh lệch nếu có | BIZ-012, VAL-10 |

---

## Đánh giá

### A. Nhất quán với dự án VDBAS

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Cấu trúc section A→D | ✅ | A1–A12, B1–B4, C1–C3, D1–D5 — đúng theo REPORT.MANUAL.CRUD_spec_function.md |
| Quy ước đặt tên Mã TC | ✅ | Format `EXP.CAPEX_DOSSIER.3.3.2.TC.<Nhóm>.<STT>` nhất quán |
| Định dạng bảng field (7 cột) | ✅ | Tất cả bảng B1.x có đủ 7 cột: VN \| ENG \| Loại \| Bắt buộc \| Giá trị mặc định \| Loại dữ liệu \| Mô tả/Ràng buộc |
| Quy ước mã Event_id | ✅ | Format `EXP.CAPEX_DOSSIER.3.3.2.<SCREEN>.<ACTION>` theo quy tắc `<MOD>.<SCREEN>.<ACTION>` |
| Cách viết LOV trong mô tả field | ✅ | LOV được ghi rõ tên trong cột "Mô tả / Ràng buộc" (LOV.07.2, LOV.PaymentType...) |
| Các mã BIZ/VAL/MSG nhất quán | ✅ | BIZ-001→BIZ-016; VAL-01→VAL-22; MSG-ERR/MSG-OK/MSG-CFM/MSG-WRN theo chuẩn |

> Tham chiếu từ: `REPORT.MANUAL.CRUD_spec_function.md` (file trong dự án)

### B. Phù hợp với best practice đặc tả CRUD (không Approval)

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Mỗi field có đủ 7 cột (không bỏ trống tùy tiện) | ✅ | Tất cả bảng field đủ 7 cột; N/A được ghi rõ điều kiện |
| Luồng chính/thay thế/ngoại lệ đầy đủ | ✅ | A4 (9 bước), A5 (6 luồng thay thế), A6 (15 luồng ngoại lệ) |
| State Machine có đủ trạng thái CRUD cơ bản | ✅ | 12 dòng state machine; mô tả rõ trạng thái đồng bộ từ Hồ sơ cha |
| Testcase bao phủ happy path + edge case | ✅ | D1: 11 TC; D2: 4 TC; D3: 5 TC; D4: 5 TC; D5: 6 TC — tổng 31 TC |
| Không có placeholder còn sót lại | ✅ | Tất cả `<…>` đã được thay thế bằng giá trị thực |
| Không có section Approval (đúng loại template) | ✅ | Không có section Approval/Maker-Checker; State machine ghi rõ trạng thái phê duyệt là do Hồ sơ cha |
| Mô tả field đủ rõ để dev implement không cần hỏi thêm | ⚠️ | COA_CONCURRENT (B1.3.3) và COA_CREDIT (B1.3.2) cần bổ sung chi tiết từng phân đoạn COA đầy đủ theo nghiệp vụ kỳ 13 — hiện ghi "theo nghiệp vụ" cần expand |

### C. Tổng kết

**Mức độ sẵn sàng:** Cần chỉnh nhỏ

**Các điểm cần xử lý trước khi sử dụng:**
1. `COA_CREDIT` (B1.3.2) và `COA_CONCURRENT` (B1.3.3): Cần bổ sung bảng chi tiết giá trị mặc định cho từng phân đoạn (Mã quỹ, TKTN, Mã năm NS, Mã NDKT, Cấp NS, DVQHNS, Địa bàn HC, Mã chương, Mã ngành KT, Mã CTMT/DA, Mã KBNN, Mã nguồn NSNN, Mã dự phòng) theo đúng quy tắc nghiệp vụ — hiện tại mô tả còn tham chiếu chung.
