# A - Bảng đặc tả chức năng

> Chức năng **Thêm mới / Xem / Sửa / Xoá** Hồ sơ **Chi đầu tư** trong hệ thống VDBAS. Hồ sơ là đối tượng cha chứa nhiều Chứng từ chi tiết (thiết kế chức năng riêng). Trạng thái Hồ sơ phản ánh trạng thái tổng hợp các Chứng từ bên trong theo luồng Maker–Checker–Approver.

---

## A1. Thông tin chung

| Trường | Giá trị |
| --- | --- |
| Mã chức năng | `EXP.CAPEX_DOSSIER` |
| Tên chức năng | Quản lý hồ sơ Chi đầu tư — Thêm mới / Xem / Sửa / Xoá |
| Tên tiếng Anh | Dossier Management for CAPEX |
| Người sử dụng | Người lập (Maker) |
| Mô tả | Cho phép Maker tạo mới, tra cứu, sửa, xoá hồ sơ chi đầu tư; đính kèm chứng từ và gửi kiểm soát theo quy trình Maker–Checker–Approver. Hồ sơ bao gồm thông tin dự án/công trình và danh sách chứng từ thanh toán chi tiết. Trạng thái hồ sơ cập nhật tự động theo trạng thái các chứng từ bên trong. |
| Độ ưu tiên | Cao |
| URD reference | *(chưa cung cấp)* |

---

## A2. Tiền điều kiện

| STT | Điều kiện |
| --- | --- |
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền truy cập màn hình theo vai trò (Maker/Checker/Approver/Viewer). Vai trò được phân quyền theo Mã kho bạc (TREASURY_CODE) |
| 3 | Các danh mục Master Data đã được cấu hình: LOV.01 (Dự án/công trình), LOV.03 (Nguồn gốc), LOV.05 (Mã Ban quản lý dự án), LOV.13 (Danh mục mã chủ đầu tư) |
| 4 | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái `DRAFT`/`SAVED` (chưa gửi kiểm soát) |
| 5 | (Trường hợp Sửa/Xoá) NSD là Maker gốc của bản ghi |

---

## A3. Hậu điều kiện

| STT | Điều kiện |
| --- | --- |
| 1 | (Trường hợp Thêm/Sửa) Hồ sơ được lưu với trạng thái **Đang hoàn thiện**; hiển thị trong danh sách |
| 2 | (Trường hợp Xoá) Hồ sơ được soft-delete (`STATE_CODE=CANCELLED`), ẩn khỏi danh sách, vẫn truy được qua audit |
| 3 | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) |
| 4 | (Trường hợp Gửi kiểm soát) Notification đã gửi đến Checker |

---

## A4. Luồng chính

| Bước | Người dùng | Hệ thống |
| --- | --- | --- |
| 1 | Bấm **Thêm mới** trên màn hình danh sách hoặc Menu "Thêm mới" | (1) Mở form trống, (2) Trạng thái hồ sơ = **Đang hoàn thiện**, (3) Tự động điền DATA_SOURCE_CODE = "Thủ công", DOSSIER_DATE = ngày hiện tại |
| 2 | Nhập các trường dữ liệu theo Bảng đặc tả Field (§B1.1) | (1) Kiểm tra dữ liệu khi rời ô nhập (onBlur), (2) Kiểm tra ràng buộc giữa các trường khi gửi lệnh, (3) Kiểm tra theo quy định nghiệp vụ |
| 3 | Đính kèm tài liệu *(Tuỳ chọn)* | Validate ≤ 10MB, định dạng pdf/jpg/png/docx (VAL-09) |
| 4 | Bấm **Lưu** | Validate cơ bản; sinh `DOSSIER_CODE`; lưu **Đang hoàn thiện**; hiển thị MSG-OK-SAVE |
| 5 | Bấm **Thêm mới chứng từ** để gắn chứng từ vào hồ sơ | Mở ra danh sách chứng từ LOV.Chứng từ; chứng từ sau khi lưu hiển thị trên grid §B1.2 |
| 6 | Bấm **Gửi kiểm soát** (Submit) khi đã có đủ chứng từ | Validate đầy đủ (§A6); chuyển trạng thái → **Chờ kiểm soát**; gửi notify Checker; hiển thị MSG-OK-SUBMIT |
| 7 | (Trường hợp Xem) Chọn dòng trong danh sách, bấm **Xem** hoặc click link `DOSSIER_CODE` | Mở form read-only; hiển thị đầy đủ §B1.1, §B1.2 (grid Chứng từ), \[Tab\] Đính kèm, \[Tab\] Lịch sử giao dịch, \[Tab\] Trạng thái phê duyệt |
| 8 | (Trường hợp Sửa) Trên bản ghi **Đang hoàn thiện**, bấm **Sửa** | Mở form editable; load phiên bản F-VER hiện hành; cho phép thay đổi các trường thông tin theo đặc tả Field |
| 9 | (Trường hợp Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); cập nhật F-VER+1; ghi audit oldValue→newValue |
| 10 | (Xoá) Bấm **Xác nhận xoá** | Soft-delete (STATE_CODE=CANCELLED), ghi audit, release hold (nếu có), hiển thị MSG-OK-DELETE |
| 11 | Chọn "Giấy ĐNTT" từ LOV.Chứng từ | Link đến chức năng EXP.CAPEX_DOSSIER.2.3 |

---

## A5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
| --- | --- | --- |
| A1 | NSD bấm **Lưu nháp** thay vì Lưu | Bỏ qua validate đầy đủ, chỉ validate định dạng; lưu **Đang hoàn thiện** |
| A2 | NSD bấm **Huỷ** khi đang nhập | Nếu form đã nhập dữ liệu → hỏi xác nhận MSG-CFM-CANCEL; xác nhận → đóng form, bỏ thay đổi |
| A3 | NSD bấm **Kết xuất** | Xuất Excel/PDF/CSV (sync nếu &lt; 50k bản ghi, async nếu vượt) |
| A4 | NSD bấm **Lập TB KQGQ** trên hồ sơ | Mở đến màn hình Nhập Thông báo kết quả giải quyết TTHC |
| A5 | NSD gửi kiểm soát thành công | Cập nhật trạng thái = \**Chờ kiểm soát*; notify checker |
| A6 | Checker kiểm soát → chuyển Approver | Cập nhật trạng thái **Chờ phê duyệt**; notify Approver |
| A7 | Approver phê duyệt | Cập nhật **Đã phê duyệt**; trigger luồng nghiệp vụ kế tiếp |
| A8 | NSD bấm **In phiếu** trên \[Tab\] Thông tin chung | Sinh PDF theo template, hiển thị preview |
| A9 | Checker từ chối kiểm soát | Cập nhật trạng thái **Từ chối kiểm soát**; notify maker |
| A10 | Approver từ chối phê duyệt | Cập nhật trạng thái **Từ chối phê duyệt**; notify checker |
| A11 | Checker hủy kiểm soát | Cập nhật trạng thái **Hủy kiểm soát**; notify maker |
| A12 | Approver hủy phê duyệt | Cập nhật trạng thái **Hủy phê duyệt**; notify Checker |
| A13 | NSD bấm **VB gia hạn** trên hồ sơ quá hạn | Mở màn hình lập Văn bản xin lỗi và đề nghị gia hạn |

---

## A6. Luồng ngoại lệ

| Mã | Điều kiện | Mã chuẩn `[G_CODE]` | Xử lý |
| --- | --- | --- | --- |
| E1 | Trường bắt buộc bị bỏ trống khi Lưu (VAL-01) | `VDBAS-VAL-0002` | Highlight đỏ + hiển thị `Vui lòng nhập [Tên trường]`; chặn lưu |
| E2 | Giá trị không thuộc danh mục (VAL-03) | `VDBAS-VAL-0005`; module: `VDBAS-EXP-0006`/`0007` | Thông báo `Giá trị không nằm trong danh mục`; clear trường |
| E3 | Cross-field không thoả mãn (VAL-05/07/08) | `VDBAS-VAL-0007` / `VDBAS-EXP-0012` / `VDBAS-VAL-0012` | Hiển thị thông báo cụ thể tại trường lỗi; chặn lưu |
| E4 | File đính kèm vượt giới hạn/sai định dạng (VAL-09) | `VDBAS-VAL-0014` (kích thước) / `VDBAS-VAL-0015` (định dạng) | Thông báo lỗi định dạng/kích thước; không upload |
| E5 | Sửa/Xoá khi trạng thái không cho phép (VAL-13) | `VDBAS-EXP-0003` | Thông báo `Hồ sơ đang ở trạng thái [<state>], không cho phép Sửa/Xoá`; disable nút delete |
| E6 | Sửa/Xoá khi không phải Maker gốc (VAL-14) | `VDBAS-EXP-0004` | Thông báo `Chỉ Người lập gốc mới được phép Sửa/Xoá` |
| E7 | Optimistic lock conflict (VAL-15) | `VDBAS-VAL-0010`; module: `VDBAS-EXP-0005` | Thông báo `Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục` |
| E8 | Confirm xoá không đủ điều kiện (VAL-16) | `VDBAS-VAL-0011` | Disable nút Xác nhận xoá đến khi nhập đủ lý do + tick checkbox |
| E10 | Lỗi hệ thống / API timeout | `VDBAS-SYS-0001` / `VDBAS-SYS-0003` (timeout) | Hiển thị `Lỗi hệ thống, traceId: <…>`; rollback giao dịch |
| E11 | Concurrent edit (record đang bị lock) | `VDBAS-EXP-0005`\* | Thông báo `Hồ sơ đang được [<user>] chỉnh sửa, vui lòng thử lại sau` |
| E12 | Không dành được dự toán khi gửi kiểm soát (VAL-21) | `VDBAS-EXP-0016`\* | Hiển thị thông báo failed reserve (alias MSG-WRN-FAILED_RESERVE); BUDGET_STATUS=FAILED_FUND_CHECK; chặn chuyển trạng thái |
| E13 | File đính kèm trùng lặp (VAL-20) | `VDBAS-VAL-0015`\* | Cảnh báo trùng tên + dung lượng; yêu cầu xác nhận trước khi upload |

---

## A7. Quy tắc nghiệp vụ

| STT | Mã | Quy tắc |
| --- | --- | --- |
| 1 | BIZ-001 | Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò |
| 2 | BIZ-002 | Chỉ Maker gốc được Sửa/Xoá khi hồ sơ ở trạng thái `DRAFT`/`SAVED` (chưa gửi kiểm soát) |
| 3 | BIZ-003 | Xoá là soft-delete; hồ sơ vẫn truy được qua audit/history |
| 4 | BIZ-004 | Tổng tiền chứng từ trong hồ sơ phải khớp với yêu cầu nghiệp vụ; kiểm tra tại thời điểm Submit |
| 5 | BIZ-005 | File đính kèm: tối đa 10MB/file, định dạng pdf/docx/xlsx/jpg/png (P1-4 — thêm xlsx); tối đa N file/hồ sơ |
| 6 | BIZ-006 | Lý do từ chối/huỷ ≥ 10 ký tự và ≤ 500 ký tự; lưu vào audit |
| 7 | BIZ-007 | Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue |
| 8 | BIZ-008 | Transaction History ghi thông tin: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE |
| 9 | BIZ-009 | Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp |
| 11 | BIZ-011 | Approval Audit log ghi đầy đủ: Check_user; Checked/Check_rejection datetime; Approve_user; Approve/Approval_rejection datetime |
| 12 | BIZ-012 | Maker chỉ Submit phê duyệt khi hồ sơ đã tồn tại Chứng từ |

---

## A8. Quy tắc kiểm tra dữ liệu

> **\[Đồng bộ G_CODE\]** Cột **Mã chuẩn** `[G_CODE]` ánh xạ mã nội bộ `VAL-XX` sang catalog chuẩn `VDBAS_Notify_Message_Validate_rule.md` (`VDBAS-VAL-*` lỗi chung; `VDBAS-EXP-*` lỗi nghiệp vụ Chi). `*` = đề xuất/chưa có mã riêng trong catalog → SA cần đăng ký. `—` = hành vi/biện pháp kỹ thuật, không phát sinh mã lỗi hiển thị.

| STT | Phân loại | Mã (nội bộ) | Mã chuẩn `[G_CODE]` | Quy tắc |
| --- | --- | --- | --- | --- |
| 1 | Chung | VAL-01 | `VDBAS-VAL-0002` | Trường bắt buộc (`Mandatory`) không được bỏ trống khi Lưu/Submit; highlight đỏ + thông báo `Vui lòng nhập [Tên trường]` |
| 2 | Chung | VAL-02 | `VDBAS-VAL-0003` (định dạng) / `VDBAS-VAL-0004` (độ dài) | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Date/DateTime (`dd/MM/yyyy [HH:mm:ss]`), Number (range, số thập phân) |
| 3 | Chung | VAL-03 | `VDBAS-VAL-0005`; module: `VDBAS-EXP-0006`/`0007` | Giá trị thuộc danh mục Master Data (Dropdown/Lookup); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường |
| 4 | Chung | VAL-04 | `VDBAS-VAL-0006` | Range/min-max cho số và ngày (vd Ngày gửi ≥ Ngày hiện tại − 30); DateRange: Từ ngày ≤ Đến ngày |
| 5 | Chung | VAL-05 | `VDBAS-VAL-0007` | Cross-field — ràng buộc phụ thuộc giữa các trường |
| 6 | Chung | VAL-06 | — *(hành vi cascading)* | Trường phụ thuộc (cascading): khi PROJECT_CODE thay đổi → reset/refresh PROJECT_NAME, PROJECT_SPECIFIC_CODE, PROJECT_SPECIFIC_NAME; khi PROJECT_MANAGEMENT_CODE thay đổi → refresh PROJECT_MANAGEMENT_NAME |
| 7 | Chung | VAL-07 | `VDBAS-EXP-0012` | Tổng dòng chi tiết chứng từ = giá trị tổng hợp; chênh lệch &gt; tolerance → chặn Submit |
| 8 | Chung | VAL-08 | `VDBAS-VAL-0012`; ngoài kỳ KT: `VDBAS-EXP-0008` | Ràng buộc theo thời gian: ngày phải nằm trong kỳ kế toán mở; ngoài giờ giao dịch → cảnh báo |
| 9 | Chung | VAL-09 | `VDBAS-VAL-0013` (bắt buộc) / `VDBAS-VAL-0014` (kích thước) / `VDBAS-VAL-0015` (định dạng) | File đính kèm: ≤ 10MB/file, định dạng pdf/docx/xlsx/jpg/png (P1-4); ≤ N file/hồ sơ; quét virus trước khi lưu |
| 10 | Chung | VAL-10 | — *(biện pháp kỹ thuật)*; generic: `VDBAS-VAL-0001` | Trường Text: trim, không cho phép ký tự điều khiển (`\x00-\x1F`); chống XSS/SQL Injection bằng escape |
| 11 | Chung | VAL-11 | `VDBAS-VAL-0009`; module: `VDBAS-EXP-0002` | Unique constraint: `DOSSIER_CODE` duy nhất trong hệ thống |
| 12 | Phân hệ | VAL-12 | `VDBAS-EXP-0015`\* *(tham chiếu PAY:* `VDBAS-PAY-0009`*)* | Hạn mức theo cấu hình phân hệ (user/đơn vị): vượt → warning vàng, yêu cầu phê duyệt cấp cao hơn |
| 13 | Chung | VAL-13 | `VDBAS-EXP-0003` | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với trạng thái `DRAFT`/`SAVED`; không cho thao tác trên hồ sơ `SUBMITTED`/`APPROVED`/`COMPLETED`/`CANCELLED` |
| 14 | Chung | VAL-14 | `VDBAS-EXP-0004` | Người sở hữu: chỉ Maker gốc được Sửa/Xoá; phá vỡ → chặn + log audit bảo mật |
| 15 | Chung | VAL-15 | `VDBAS-VAL-0010`; module: `VDBAS-EXP-0005` | Optimistic lock theo `(DOSSIER_CODE, F-VER)`: khi Lưu nếu `F-VER` trong DB ≠ `F-VER` đã load → chặn, thông báo tải lại |
| 16 | Chung | VAL-16 | `VDBAS-VAL-0011` | Confirm xoá: bắt buộc nhập **Lý do** ≥ 10 ký tự và tick checkbox xác nhận; thiếu → disable nút Xác nhận xoá |
| 17 | Chung | VAL-17 | — *(backend reject)*; có thể dùng `VDBAS-EXP-0003` | Trường immutable trong Edit-mode: `DOSSIER_CODE`, CREATED_BY, CREATED_DATE, F-VER; backend reject nếu client gửi thay đổi |
| 18 | Chung | VAL-18 | `VDBAS-EXP-0011` | Cảnh báo trùng: trong N phút có hồ sơ cùng (PROJECT_CODE + PROJECT_MANAGEMENT_CODE) → warning + nút `Tiếp tục`/`Huỷ` |
| 19 | Chức năng | VAL-19 | `VDBAS-VAL-0008`; module: `VDBAS-EXP-0010` | Cross-Validation Rule (CCID) cho các trường COA (GL_SEGMENT1..12) trong Chứng từ: tổ hợp segment phải thuộc CCID hợp lệ; vi phạm → highlight lỗi + `VDBAS-EXP-0010` + chặn Submit |
| 20 | Chức năng | VAL-20 | `VDBAS-VAL-0015`\* *(chưa có mã riêng cho trùng file)* | File đính kèm trùng lặp: kiểm tra cùng tên + cùng dung lượng → cảnh báo trước khi upload |
| 21 | Chức năng | VAL-21 | `VDBAS-EXP-0019`\* *(đề xuất mã mới)* | Không cho phép thực hiện thanh toán khi chưa hạch toán; ACCOUNTING_STATUS phải là `ACCOUNTED` hoặc `ACCOUNTING_POSTED` |

---

## A9. Danh sách thông báo

> **\[P0-3\]** Cột **Mã chuẩn** `[G_CODE]` là mã chính thức theo `VDBAS_Notify_Message_Validate_rule.md` (`VDBAS-EXP-*` cho lỗi nghiệp vụ Chi, `VDBAS-VAL-*`/`VDBAS-SYS-*`/`VDBAS-AUT-*` cho lỗi chung). Cột **Mã (alias cũ)** giữ lại `MSG-*` để truy vết tham chiếu trong §A4–A8, §C, §D. ⚠️ Mã `VDBAS-EXP-SUCxx (chờ cấp)` là **dải success chưa có trong catalog** — BA Lead cần cấp/đăng ký trước khi DEV dùng (mockup tạm dùng `VDBAS-CHI-0000/0001/0002`, cần đổi prefix `CHI`→`EXP`). `*` = mã đề xuất/minh hoạ, cần đối chiếu chính xác catalog.

| STT | Phân loại 1 | Phân loại 2 | Mã chuẩn `[G_CODE]` | Mã (alias cũ) | Nội dung |
| --- | --- | --- | --- | --- | --- |
| 1 | Chung | Error | `VDBAS-VAL-0001` | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên trường]` |
| 2 | Chung | Error | `VDBAS-VAL-0002` | MSG-ERR-FORMAT | Định dạng `[Tên trường]` không hợp lệ |
| 3 | Chung | Error | `VDBAS-EXP-0006`/`0007` | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | `VDBAS-VAL-0004`\* | MSG-ERR-RANGE | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`) |
| 5 | Chung | Error | `VDBAS-VAL-0005`\* | MSG-ERR-CROSS-FIELD | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]` |
| 6 | Chung | Error | `VDBAS-VAL-0015` | MSG-ERR-FILE | Định dạng tệp không được hỗ trợ. Cho phép: `{formats}` |
| 7 | Chung | Error | `VDBAS-EXP-0002` | MSG-ERR-DUPLICATE | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]` |
| 8 | Chung | Error | `VDBAS-SYS-0001`\* | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 9 | Chung | Error | `VDBAS-SYS-0002`\* | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 10 | Chung | Error | `VDBAS-AUT-0001`\* | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 11 | Chung | Error | `VDBAS-AUT-0002`\* | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 12 | Chung | Success | `VDBAS-EXP-SUC01 (chờ cấp)` | MSG-OK-SAVE | Lưu hồ sơ thành công |
| 13 | Chung | Success | `VDBAS-EXP-SUC03 (chờ cấp)` | MSG-OK-DELETE | Xoá hồ sơ thành công |
| 14 | Chung | Success | `VDBAS-EXP-SUC02 (chờ cấp)` | MSG-OK-SUBMIT | Đã gửi hồ sơ để kiểm soát/phê duyệt |
| 15 | Chung | Confirm | `VDBAS-VAL-CFM01`\* | MSG-CFM-CANCEL | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 16 | Chung | Confirm | `VDBAS-VAL-CFM02`\* | MSG-CFM-DELETE | Bạn có chắc muốn xoá hồ sơ `<DOSSIER_CODE>`? |
| 17 | Chung | Warning | `VDBAS-EXP-0015`\* | MSG-WRN-LIMIT | Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn |
| 18 | Chung | Warning | `VDBAS-EXP-0008` | MSG-WRN-OUTSIDE-HOUR | Ngoài giờ giao dịch / ngoài kỳ kế toán, vui lòng xem lại |
| 19 | Chung | Error | `VDBAS-EXP-0003` | MSG-ERR-STATUS | Hồ sơ đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá |
| 20 | Chung | Error | `VDBAS-EXP-0004` | MSG-ERR-MAKER | Chỉ Người lập gốc mới được phép Sửa/Xoá |
| 21 | Chung | Error | `VDBAS-EXP-0005` | MSG-ERR-LOCK | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 22 | Chung | Error | `VDBAS-EXP-0005`\* | MSG-ERR-CONCURRENT | Hồ sơ đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau |
| 23 | Chung | Error | `VDBAS-VAL-CFM03`\* | MSG-ERR-DELETE-CFM | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát |
| 24 | Chung | Warning | `VDBAS-EXP-0011` | MSG-WRN-DUPLICATE | Phát hiện hồ sơ tương tự đã được lập gần đây. Bạn có muốn tiếp tục? |
| 25 | Chung | Info | `VDBAS-EXP-INF01`\* | MSG-INF-NOTIFY-CHECKER | Đã gửi thông báo đến Người kiểm soát `<…>` |
| 26 | Chức năng | Error | `VDBAS-EXP-0012` | MSG-ERR-AMOUNT-MISMATCH | Tổng số tiền chứng từ không khớp với yêu cầu nghiệp vụ |
| 27 | Chức năng | Warning | `VDBAS-EXP-0012`\* | MSG-WRN-AMOUNT-MISMATCH | Chênh lệch giữa tổng chứng từ nằm trong ngưỡng tolerance — vui lòng kiểm tra lại |
| 28 | Chức năng | Error | `VDBAS-EXP-0010` | MSG-ERR-CCID | Tổ hợp segment COA không hợp lệ theo Cross-Validation Rule (CCID) |
| 29 | Chung | Info | `VDBAS-EXP-INF02`\* | MSG-INF-NOTIFY-APPROVER | Đã gửi thông báo đến Người phê duyệt `<…>` |
| 30 | Chức năng | Warning | `VDBAS-EXP-INF03`\* | MSG-INF-NOTIFY-APPROVAL_REJ | Hồ sơ đã bị từ chối phê duyệt |
| 31 | Chức năng | Warning | `VDBAS-EXP-INF04`\* | MSG-INF-NOTIFY-CHECK_REJ | Hồ sơ đã bị từ chối kiểm soát |
| 32 | Chức năng | Warning | `VDBAS-EXP-0016`\* | MSG-WRN-FAILED_RESERVE | Hồ sơ không dành được dự toán thành công |
| 33 | Chức năng | Warning | `VDBAS-EXP-0015`\* | MSG-WRN-FAILED_PAYMENT | Hồ sơ không thanh toán thành công |
| 34 | Chức năng | Warning | `VDBAS-EXP-0003`\* | MSG-ERR-UNAPPROVED | Không hủy phê duyệt được hồ sơ ở trạng thái thanh toán là PAYMENT_SUCCESS, hoặc trạng thái hạch toán là GL_ACCOUNTED |
| 35 | Chức năng | Warning | `VDBAS-EXP-0017`\* | MSG-WRN-DUE-DATE | Hồ sơ quá hạn xử lý `[<date>]`, cần lập Văn bản xin lỗi và đề nghị gia hạn thời gian giải quyết |

---

## A10. Danh sách sự kiện

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
| --- | --- | --- | --- | --- |
| 1 | `EXP.CAPEX_DOSSIER.LIST.VIEW` | Chung | Danh sách | Mở màn hình danh sách hồ sơ |
| 2 | `EXP.CAPEX_DOSSIER.LIST.SEARCH` | Chung | Danh sách | NSD bấm Tìm kiếm áp dụng bộ lọc (P1-16) |
| 2a | `EXP.CAPEX_DOSSIER.LIST.RESET` | Chung | Danh sách | NSD bấm Đặt lại bộ lọc về mặc định (P1-16) |
| 2b | `EXP.CAPEX_DOSSIER.LIST.FILTER` | Chung | Danh sách | Áp dụng filter/sort/phân trang (giữ tương thích) |
| 3 | `EXP.CAPEX_DOSSIER.LIST.EXPORT` | Chung | Danh sách | NSD xuất dữ liệu Excel/PDF/CSV |
| 4 | `EXP.CAPEX_DOSSIER.NEW.OPEN` | Chung | Thêm mới | Mở form Thêm mới, sinh DOSSIER_CODE preview; trạng thái `DRAFT` |
| 5 | `EXP.CAPEX_DOSSIER.NEW.SAVE` | Chung | Thêm mới | Lưu hồ sơ → trạng thái `SAVED`; sinh DOSSIER_CODE |
| 5a | `EXP.CAPEX_DOSSIER.NEW.SAVE_DRAFT` | Chung | Thêm mới | Lưu nháp → trạng thái `DRAFT` (validate tối thiểu) (P1-9) |
| 5b | `EXP.CAPEX_DOSSIER.NEW.ADD_DOC` | Chức năng | Thêm mới | Mở LOV.Chứng từ để thêm chứng từ vào hồ sơ (P1-11) |
| 5c | `EXP.CAPEX_DOSSIER.NEW.COPY` | Chung | Thêm mới | Sao chép hồ sơ thành bản nháp mới (P1-5) |
| 6 | `EXP.CAPEX_DOSSIER.NEW.SUBMIT` | Chung | Thêm mới | Submit → `SUBMITTED`; notify Checker |
| 7 | `EXP.CAPEX_DOSSIER.NEW.CANCEL` | Chung | Thêm mới | Huỷ form, bỏ thay đổi |
| 7a | `EXP.CAPEX_DOSSIER.CANCEL` | Chức năng | Xem | Hủy bỏ hồ sơ đã lưu (record-level) (P1-6) |
| 8 | `EXP.CAPEX_DOSSIER.VIEW.OPEN` | Chung | Xem | Mở form Xem (read-only) |
| 9 | `EXP.CAPEX_DOSSIER.VIEW.GENERAL` | Chung | Xem | Mở tab Thông tin hồ sơ (chứa grid chứng từ) (P2-7) |
| 9a | `EXP.CAPEX_DOSSIER.VIEW.ATTACHMENTS` | Chung | Xem | Mở tab Đính kèm tài liệu (P2-7) |
| 10 | `EXP.CAPEX_DOSSIER.VIEW.HISTORY` | Chung | Xem | Mở tab Lịch sử giao dịch / Audit |
| 11 | `EXP.CAPEX_DOSSIER.VIEW.APPROVAL` | Chung | Xem | Mở tab Trạng thái phê duyệt |
| 11a | `EXP.CAPEX_DOSSIER.VIEW.BACK` | Chung | Xem | Quay lại màn hình danh sách (P1-7) |
| 12 | `EXP.CAPEX_DOSSIER.EDIT.OPEN` | Chung | Sửa | Mở form Sửa, load F-VER hiện hành |
| 13 | `EXP.CAPEX_DOSSIER.EDIT.SAVE` | Chung | Sửa | Lưu thay đổi, cập nhật F-VER+1, ghi audit |
| 14 | `EXP.CAPEX_DOSSIER.EDIT.CANCEL` | Chung | Sửa | Huỷ chỉnh sửa, bỏ thay đổi |
| 15 | `EXP.CAPEX_DOSSIER.DELETE.OPEN` | Chung | Xoá | Mở popup Xoá (lý do + checkbox) |
| 16 | `EXP.CAPEX_DOSSIER.DELETE.CONFIRM` | Chức năng | Xoá | Soft-delete, ghi audit |
| 17 | `EXP.CAPEX_DOSSIER.ATTACH.UPLOAD` | Chung | Đính kèm | Upload file (validate kích thước/định dạng/AV) |
| 18 | `EXP.CAPEX_DOSSIER.ATTACH.DELETE` | Chung | Đính kèm | Xoá file đính kèm |
| 18a | `EXP.CAPEX_DOSSIER.ATTACH.DOWNLOAD` | Chung | Đính kèm | Tải file đính kèm xuống máy NSD; ghi audit truy cập |
| 19 | `EXP.CAPEX_DOSSIER.APPROVE.APPROVE` | Chung | Kiểm soát/Phê duyệt | Checker kiểm soát (→ Approver) hoặc Approver phê duyệt; `SUBMITTED`/`APPROVED` → `APPROVED` (P2-6, theo chuẩn) |
| 20 | `EXP.CAPEX_DOSSIER.APPROVE.REJECT` | Chung | Kiểm soát/Phê duyệt | Từ chối → `REJECTED` + lý do (≥10 ký tự) |
| 23 | `EXP.CAPEX_DOSSIER.VIEW.PRINT` | Chung | In phiếu | Sinh PDF preview theo template (P1-10, đổi từ `PRINT.PREVIEW`) |
| 24 | `EXP.CAPEX_DOSSIER.NOTIFY.SEND` | Chung | Notification | Gửi notification chuyển trạng thái (in-app + email) |
| 25 | `EXP.CAPEX_DOSSIER.AUDIT.WRITE` | Chung | Audit | Ghi log thao tác (user, timestamp, IP, oldValue→newValue) |
| 26 | `EXP.CAPEX_DOSSIER.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 27 | `EXP.CAPEX_DOSSIER.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 28 | `EXP.CAPEX_DOSSIER.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện conflict (optimistic lock mismatch) |

---

## A11. State Machine (Trạng thái hồ sơ)

> Trạng thái hồ sơ tuân theo bộ mã chuẩn `[G_CODE]` (`VDBAS_Event_Button_Status_Rule.md`) và luồng Maker–Checker–Approver. Nhãn hiển thị có thể khác theo `ASSIGN_USER`. \*\***Ánh xạ nhãn legacy (V0.1) → enum chuẩn (V0.2):** các phần §A2–A8, §C2, §D còn dùng nhãn tiếng Việt cũ, quy đổi như sau: "Đang hoàn thiện" → `DRAFT`/`SAVED` (chưa gửi kiểm soát); "Chờ kiểm soát" → `SUBMITTED`; "Chờ phê duyệt" → `APPROVED` (đã kiểm soát, chờ Approver); "Đã phê duyệt" → `APPROVED` (Approver); "Từ chối/Huỷ kiểm soát/phê duyệt" → `REJECTED`; "DELETED" → `CANCELLED`.

### A11.1. Bộ trạng thái chuẩn (enum)

| CODE | NAME | Nhãn hiển thị (theo ngữ cảnh) | Badge (UIUX) | ASSIGN_USER kế tiếp |
| --- | --- | --- | --- | --- |
| `DRAFT` | Lưu tạm | Lưu nháp | `bd` (xám) | Maker |
| `SAVED` | Đã lưu | Đã lưu | `bd` (xám) | Maker |
| `VALIDATED` | Đã kiểm tra | Đã kiểm tra | `bs` (xanh dương) | Maker (Inbound auto) |
| `SUBMITTED` | Đã gửi phê duyệt | Đã gửi kiểm soát | `bs` (xanh dương) | Checker |
| `APPROVED` | Đã phê duyệt | Checker→"Đã kiểm soát"; Approver→"Đã phê duyệt" | `bg` (xanh lá) | Approver / Done |
| `REJECTED` | Đã từ chối | Đã từ chối | `br` (đỏ) | Maker (checker rej) / Checker (approver rej) |
| `COMPLETED` | Đã hoàn thành | Hoàn thành | `bg` (xanh lá) | Done |
| `CANCELLED` | Đã hủy | Đã huỷ | `bo` (cam) | – |

### A11.2. Bảng chuyển trạng thái

> Quy ước: cột **CODE trước** = trạng thái trước sự kiện; **CODE mới** = trạng thái sau sự kiện.

| STT | Người thực hiện | Sự kiện | CODE trước | CODE mới | Tác động |
| --- | --- | --- | --- | --- | --- |
| 1 | Maker | Tạo mới (`EXP.CAPEX_DOSSIER.NEW.OPEN`) | Start | `DRAFT` | Sinh DOSSIER_CODE, F-VER=1, autofill DOSSIER_DATE/DATA_SOURCE_CODE/CREATED_BY/CREATED_DATE; ghi log |
| 2 | Maker | Lưu nháp (`EXP.CAPEX_DOSSIER.NEW.SAVE_DRAFT`) | `DRAFT` | `DRAFT` | Validate tối thiểu; ghi audit; F-VER không đổi |
| 3 | Maker | Lưu (`EXP.CAPEX_DOSSIER.NEW.SAVE`) | `DRAFT` | `SAVED` | Validate cơ bản; sinh/giữ DOSSIER_CODE; ghi audit |
| 4 | System (Inbound) | Auto-Receive | `DRAFT` | `VALIDATED` | SOURCE = "Tự động/AUTO"; assign Maker |
| 5 | Maker | Sửa & Lưu (`EXP.CAPEX_DOSSIER.EDIT.SAVE`) | `DRAFT`/`SAVED` | (không đổi) | Optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 6 | Maker | Submit/Gửi kiểm soát (`EXP.CAPEX_DOSSIER.NEW.SUBMIT`) | `SAVED`/`VALIDATED` | `SUBMITTED` | Validate đầy đủ; assign Checker; notify Checker; ghi audit |
| 7 | Maker | Xoá (`EXP.CAPEX_DOSSIER.DELETE.CONFIRM`) | `DRAFT`/`SAVED` | `CANCELLED` | Soft-delete; ghi audit |
| 8 | Checker | Kiểm soát thành công (`EXP.CAPEX_DOSSIER.APPROVE.APPROVE`) | `SUBMITTED` | `APPROVED` (hiển thị "Đã kiểm soát") | Khi "Ký số thành công"; assign Approver; notify Approver; ghi audit |
| 9 | Checker | Từ chối kiểm soát (`EXP.CAPEX_DOSSIER.APPROVE.REJECT`) | `SUBMITTED` | `REJECTED` | Bắt buộc lý do ≥ 10 ký tự; assign Maker; notify Maker; ghi audit |
| 10 | Approver | Phê duyệt (`EXP.CAPEX_DOSSIER.APPROVE.APPROVE`) | `APPROVED` (đã kiểm soát) | `APPROVED` (hiển thị "Đã phê duyệt") | Trigger luồng nghiệp vụ kế tiếp; assign Done; notify Maker; ghi audit |
| 11 | Approver | Từ chối phê duyệt (`EXP.CAPEX_DOSSIER.APPROVE.REJECT`) | `APPROVED` (đã kiểm soát) | `REJECTED` | Bắt buộc lý do; assign Checker; notify Checker; ghi audit |
| 12 | System | Hoàn tất xử lý | `APPROVED` | `COMPLETED` | Khoá thao tác Sửa/Xoá; chỉ cho phép Xem; ghi audit |
| 13 | (Vi phạm) | Cố tình Sửa/Xoá ở trạng thái không cho phép | `SUBMITTED`/`APPROVED`/`COMPLETED`/`CANCELLED` | (Không đổi) | Chặn (VAL-13); VDBAS-EXP-0003; disable nút; ghi audit bảo mật |
| 14 | (Vi phạm) | Người khác Maker gốc Sửa/Xoá | `DRAFT`/`SAVED` | (Không đổi) | Chặn (VAL-14); VDBAS-EXP-0004; ghi audit bảo mật |
| 15 | (Concurrent) | Optimistic lock mismatch khi Lưu | `DRAFT`/`SAVED` | (Không đổi) | Chặn (VAL-15); VDBAS-EXP-0005; yêu cầu tải lại; ghi audit |
| 16 | (Hệ thống) | Phiên đăng nhập hết hạn | (Bất kỳ) | (Không đổi) | Buộc đăng nhập lại; lưu draft tạm (nếu dirty); VDBAS-SYS-\* |

```
   Maker.New
   Start ───▶ DRAFT ──Maker.Save──▶ SAVED ──Maker.Submit──▶ SUBMITTED
               │  ▲  (Inbound auto ▶ VALIDATED)                 │
               │  └──────── Maker.Edit ◀───────────────────────┘ Checker.Reject ▶ REJECTED
               │                                                 │ Checker.Approve
               │                                                 ▼
               │                                  APPROVED ("Đã kiểm soát")
               │                                       │  Approver.Reject ▶ REJECTED
               │                                       │  Approver.Approve
               │                                       ▼
               │                                  APPROVED ("Đã phê duyệt") ──System──▶ COMPLETED ─▶ End
               │
               └── Maker.Delete (DRAFT/SAVED) ─────────────────▶ CANCELLED ─▶ End
```

---

## A12. Giao diện liên quan

| STT | Màn hình |
| --- | --- |
| 1 | `EXP.CAPEX_DOSSIER.LIST` — Màn hình Danh sách hồ sơ (lọc, sort, phân trang, export) |
| 2 | `EXP.CAPEX_DOSSIER.NEW` — Form Thêm mới hồ sơ |
| 3 | `EXP.CAPEX_DOSSIER.VIEW` — Form Xem (read-only). **\[P2-7\]** 4 tab theo mockup: \[Tab\] **Thông tin hồ sơ** (chứa cả grid Danh sách chứng từ §B1.2 — không phải tab riêng), \[Tab\] Đính kèm tài liệu, \[Tab\] Lịch sử, \[Tab\] Trạng thái phê duyệt |
| 4 | `EXP.CAPEX_DOSSIER.EDIT` — Form Sửa hồ sơ |
| 5 | `EXP.CAPEX_DOSSIER.DELETE` — Popup xác nhận Xoá (lý do + checkbox) |
| 6 | `EXP.CAPEX_DOSSIER.ATTACH` — Popup quản lý đính kèm |
| 7 | `EXP.CAPEX_DOSSIER.HISTORY` — Popup lịch sử audit (oldValue→newValue) |
| 8 | `EXP.CAPEX_DOSSIER.LOOKUP.PROJECT` — Popup tra cứu Dự án/Công trình (LOV.01) |
| 9 | `EXP.CAPEX_DOSSIER.LOOKUP.USER` — Popup tra cứu User (Người lập/Kiểm soát/Phê duyệt) |
| 10 | `EXP.CAPEX_DOSSIER.APPROVE` — Màn hình kiểm soát/phê duyệt |
| 11 | `EXP.CAPEX_DOSSIER.PRINT` — Màn hình Preview in phiếu/báo cáo |
| 12 | `EXP.CAPEX_DOSSIER.EXPORT` — Tuỳ chọn xuất Excel/PDF/CSV |

---

# B - Đặc tả trường dữ liệu

> **Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện (ghi rõ điều kiện trong "Mô tả / Ràng buộc"). \*\***Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / Label / Lookup.

---

## B1. Màn hình `EXP.CAPEX_DOSSIER.NEW`, `EXP.CAPEX_DOSSIER.VIEW`, `EXP.CAPEX_DOSSIER.EDIT`

> Phân quyền: Màn hình phân quyền theo TREASURY_CODE

### B1.1. Khu vực Thông tin chung của hồ sơ (Top Area)

> **\[P1-2\]** Thứ tự trường theo mockup `form_detail`. Placeholder ghi đúng UI thực tế (P2-2).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| Mã hồ sơ | DOSSIER_CODE | TextBox | Y | N/A (auto-gen) | String | Read-only; sinh tự động sau khi Lưu; immutable (VAL-17); placeholder "(Tự động sinh sau khi Lưu)" |
| Ngày gửi hồ sơ | SEND_DATE | Date Picker | Y | Ngày hiện tại | Date | Mặc định ngày hiện tại; cho phép nhập/chọn lại; định dạng `dd/MM/yyyy` |
| Nguồn | DATA_SOURCE_CODE | Dropdown | Y | Thủ công | Varchar | Danh mục LOV.03: `Thủ công` (mặc định khi tạo mới) / `DVC`. Read-only sau khi lưu lần đầu |
| Trạng thái hồ sơ | F_STATUS | Label | Y | `DRAFT` (Lưu nháp) | String | Tự động cập nhật theo State Machine (§A11); read-only. Giá trị (enum chuẩn): `DRAFT`/`SAVED`/`VALIDATED`/`SUBMITTED`/`APPROVED`/`REJECTED`/`COMPLETED`/`CANCELLED` — hiển thị nhãn theo §A11.1 |
| Mã dự án/công trình | PROJECT_CODE | TextBox + Lookup | Y | – | String | Chọn trong LOV.01; F4 mở `EXP.CAPEX_DOSSIER.LOOKUP.PROJECT`; placeholder "Nhập hoặc F4 để tra cứu". Mẫu: `7004686`; `7122155` |
| Tên dự án/công trình | PROJECT_NAME | TextBox | C (\*) | – | String | Tự động fill theo PROJECT_CODE (LOV.01); read-only. Bắt buộc khi PROJECT_CODE đã chọn |
| Mã dự án đặc thù | PROJECT_SPECIFIC_CODE | TextBox + Lookup | N | – | String | Chỉ hiển thị/cho phép chọn khi `Project_Type = Military`; phụ thuộc PROJECT_CODE (LOV.01); placeholder "F4 — Tra cứu mã đặc thù". Mẫu: `001200037`; `001200038` |
| Tên dự án đặc thù | PROJECT_SPECIFIC_NAME | TextBox | C (\*) | – | String | Tự động fill theo PROJECT_SPECIFIC_CODE (LOV.01); read-only. Bắt buộc khi đã chọn và `Project_Type = Military` |
| Mã ĐVQHNS | PROJECT_MANAGEMENT_CODE | TextBox + Lookup | Y | – | String | Hiển thị theo BQL dự án/chủ đầu tư gắn với mã dự án trong LOV.01; F4 mở `EXP.CAPEX_DOSSIER.LOOKUP.PROJECT`/`BOARD`. Mẫu: `1059227`; `3029123` |
| Tên ĐVQHNS | PROJECT_MANAGEMENT_NAME | TextBox | C (\*) | – | String | Tự động fill theo PROJECT_MANAGEMENT_CODE (LOV.05); read-only. Bắt buộc khi PROJECT_MANAGEMENT_CODE đã chọn |

### B1.2. Khu vực Danh sách chứng từ thuộc hồ sơ (Middle Area — Grid)

> Khu vực này **không hiển thị khi tạo mới (NEW)**. NSD bấm nút **"Thêm mới chứng từ"** để chọn thêm chứng từ trong LOV.Chứng từ rồi thực hiện theo chức năng Chứng từ Chi đầu tư (tham chiếu chức năng riêng). Chứng từ sau khi lưu sẽ hiển thị trên GRID này. Khi đã có đủ chứng từ thoả mãn Validation, nút **"Gửi kiểm soát"** sẽ kích hoạt.

> **\[P1-3\]** Thêm cột "Tên chứng từ" (vị trí 2) theo mockup. Footer grid có dòng "Tổng cộng" = tổng cột Số tiền VND (P2-4).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| STT | No. | Label | N (auto) | Auto | Number | Hệ thống gen tự động từ trên xuống, bắt đầu từ 1; read-only (mockup: header "Số TT") |
| Tên chứng từ | DOCUMENT_NAME | Label | N (auto) | – | String | **THÊM MỚI (P1-3)** — tên/loại chứng từ; read-only; hiển thị theo loại chứng từ đã chọn từ LOV.Chứng từ |
| Số chứng từ | DOCUMENT_NO | TextBox | Y | – | Number | Hệ thống gen tự động theo quy tắc `EXP/CAPEX/YYYY/XXXXX` khi mở chức năng thêm mới chứng từ; tham chiếu chức năng EXP.CAPEX_DOSSIER.3.3.1 |
| Ngày chứng từ | DOCUMENT_DATE | Date Picker | Y | – | Date | Định dạng `dd/MM/yyyy` |
| Ngày hạch toán | ACCOUNTING_DATE | Date Picker | Y | – | Date | Định dạng `dd/MM/yyyy` |
| Số tiền nguyên tệ | ORIGINAL_AMOUNT | Number Field | Y | – | Number | Bắt buộc khi đề nghị rút vốn/ghi thu ghi chi bằng ngoại tệ (≠ VND); hiển thị "-" nếu VND; sum từ bảng `EXP_DOCUMENT_LINE` |
| Số tiền VND | BASE_AMOUNT | Number Field | Y | – | Number | Số tiền quy đổi VND; căn phải; `#,##0`; sum từ bảng `EXP_DOCUMENT_LINE`; **footer "Tổng cộng" = tổng cột này** |
| Thao tác | ACTIONS | Icon group | – | – | – | Xem / Sửa (mode new,edit) / Xoá chứng từ |

### B1.3. \[Tab\] Đính kèm tài liệu

> Sử dụng chuẩn đính kèm chung — liên kết đến `EXP.CAPEX_DOSSIER.ATTACH`. Đặc tả chi tiết tại §B3.3. **\[P1-4\]** Định dạng cho phép: `pdf / docx / xlsx / jpg / png` (thêm `xlsx` theo mockup); ≤ 10MB/file. Event upload: `EXP.CAPEX_DOSSIER.ATTACH.UPLOAD` (mockup hiện dùng `NEW.ATTACH_FILE` — cần đồng bộ, P2-5).

---

## B2. Màn hình `EXP.CAPEX_DOSSIER.LIST`

> Liệt kê các hồ sơ chi đầu tư; cho phép tra cứu theo nhiều tiêu chí và truy cập các thao tác Xem/Sửa/Xoá/Sao chép/Gửi kiểm soát/Phê duyệt/Xuất.

> Phân quyền: Màn hình phân quyền theo TREASURY_CODE

### B2.1. Khu vực bộ lọc tìm kiếm

> **\[P1-12,13; P2-9,10\]** Thêm "Tìm nhanh"; Trạng thái & Nguồn chuyển sang Multi-select; nhãn ngày theo mockup.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| Tìm nhanh | SEARCH | TextBox | N | – | String | **THÊM (P1-12)** — tìm theo Người lập / Tên dự án |
| Mã hồ sơ | DOSSIER_CODE | TextBox | N | – | String | placeholder "Nhập mã hồ sơ..."; tìm chính xác hoặc bắt đầu bằng |
| Mã dự án/CT | PROJECT_CODE | TextBox | N | – | String | placeholder "Nhập mã dự án..."; lọc theo dự án |
| Loại ngày lọc | DATE_FIELD | Dropdown | N | Ngày gửi | String | Options: `SEND_DATE`(Ngày gửi) / `CREATED_DATE`(Ngày lập) / `CHECKED_DATE`(Ngày kiểm soát) / `APPROVED_DATE`(Ngày phê duyệt) |
| Từ ngày | FROM_DATE | Date Picker | N | – | Date | Theo loại ngày tại DATE_FIELD; `dd/MM/yyyy` |
| Đến ngày | TO_DATE | Date Picker | N | – | Date | Phải ≥ FROM_DATE; `dd/MM/yyyy` |
| Trạng thái | F_STATUS | **Multi-select** | N | – | String | **Đổi từ Dropdown (P1-13)**; danh mục enum chuẩn §A11.1: DRAFT/SAVED/VALIDATED/SUBMITTED/APPROVED/REJECTED/COMPLETED/CANCELLED |
| Nguồn | DATA_SOURCE_CODE | **Multi-select** | N | – | String | **Đổi từ Dropdown (P1-13)**; LOV.03: Thủ công / DVC |
| Người lập | CREATED_BY | TextBox | N | – | String | placeholder "Username người lập..." |
| ~~Người kiểm soát~~ | CHECKED_BY | TextBox + Lookup | N | – | String | **Pending (P2-10)** — chưa có trong mockup; giữ trong SRS, chưa implement |
| ~~Người phê duyệt~~ | APPROVED_BY | TextBox + Lookup | N | – | String | **Pending (P2-10)** — chưa có trong mockup; giữ trong SRS, chưa implement |

### B2.2. Khu vực kết quả (grid)

> **\[P1-14\]** Cột mặc định theo mockup `COLS`. Các cột reason/checker/approver giữ làm **cột tuỳ chọn (hideable, mặc định ẩn)** — không xoá.

**Cột mặc định hiển thị:**

| STT | Trường | Trường (ENG) | Loại hiển thị | Sắp xếp | Hideable | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | STT | STT | Text | – | Không | Số thứ tự dòng |
| 2 | Mã hồ sơ | DOSSIER_CODE | Link (mở `EXP.CAPEX_DOSSIER.VIEW`) | ✓ | Không | Click mở chi tiết hồ sơ |
| 3 | Mã dự án | PROJECT_CODE | Text | ✓ | Có | – |
| 4 | Nguồn gốc | DATA_SOURCE_CODE | Text | ✓ | Có | Thủ công / DVC |
| 5 | Ngày gửi | SEND_DATE | Text (`dd/mm/yyyy`) | ✓ | Có | – |
| 6 | Trạng thái | F_STATUS | Badge | ✓ | Có | Badge theo enum chuẩn §A11.1 (lớp `bd/bs/bg/br/bo`) |
| 7 | Người lập | CREATED_BY | Text | ✓ | Có | – |
| 8 | Ngày lập | CREATED_DATE | Text (`dd/mm/yyyy hh:MM`) | ✓ | Có | Mặc định sort DESC |
| 9 | Dự án/Công trình | PROJECT_NAME | Text | ✓ | Có | – |
| 10 | Số CT | DOCUMENT_COUNT | Number | ✓ | Có | Số lượng chứng từ trong hồ sơ |
| 11 | Tổng tiền VND | TOTAL_BASE_AMOUNT | Number (`#,##0`) | ✓ | Có | Tổng `BASE_AMOUNT` của hồ sơ |
| – | Thao tác | ACTIONS | Icon group | – | Frozen | Tổ hợp nút theo trạng thái (BTN_MATRIX) + VAL-13/VAL-14: Xem (F3), Sửa (F2), Xoá (Delete), Gửi kiểm soát (F9) |

**Cột tuỳ chọn (hideable, mặc định ẩn) — giữ từ V0.1:**

| Trường | Trường (ENG) | Mô tả / Ràng buộc |
| --- | --- | --- |
| Lý do từ chối tiếp nhận | RETURNING_REASON | Từ `EXP_APPROVAL_LOG` qua `PARENT_ID`; hiển thị nếu có ≥01 chứng từ bị từ chối tiếp nhận |
| Người kiểm soát | CHECKED_BY | Hiển thị nếu có ≥01 chứng từ ở trạng thái đã kiểm soát/Chờ phê duyệt/Đã phê duyệt |
| Ngày kiểm soát | CHECKED_DATE | Như trên |
| Lý do từ chối/hủy kiểm soát | CHECK_REJECTION_REASON | Từ `EXP_APPROVAL_LOG`; hiển thị nếu có chứng từ bị từ chối/huỷ kiểm soát |
| Người phê duyệt | APPROVED_BY | Hiển thị nếu có ≥01 chứng từ đã phê duyệt |
| Ngày phê duyệt | APPROVED_DATE | Như trên |
| Lý do từ chối/hủy phê duyệt | APPROVAL_REJECTION_REASON | Từ `EXP_APPROVAL_LOG`; hiển thị nếu có chứng từ bị từ chối/huỷ phê duyệt |

### B2.3. Khu vực thanh công cụ và footer

| Trường | Mô tả |
| --- | --- |
| Số bản ghi | Tổng số hồ sơ khớp bộ lọc |
| Thống kê trạng thái | **\[P2-11\]** Dải đếm số bản ghi theo từng trạng thái (badge + count) |
| Tổng số tiền VND | Tổng `BASE_AMOUNT` của các chứng từ trong hồ sơ khớp bộ lọc (trạng thái ≠ CANCELLED) |
| Phân trang | 20 / 50 / 100 / 200 bản ghi/trang; mặc định 20 |
| Sắp xếp | Mặc định `CREATED_DATE` DESC |
| Tuỳ chỉnh cột | **\[P1-15\]** "⚙ Tùy chỉnh cột" / "💾 Lưu cấu hình" (user-scope) / "↺ Mặc định" |
| Nút tìm kiếm | **\[P1-16\]** "🔍 Tìm kiếm" = `EXP.CAPEX_DOSSIER.LIST.SEARCH`; "↺ Đặt lại" = `EXP.CAPEX_DOSSIER.LIST.RESET` |
| Lưu bộ lọc | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope) |

---

## B3. Đặc tả trường cho các màn hình bổ sung

### B3.1. Màn hình `EXP.CAPEX_DOSSIER.DELETE`

> Popup xác nhận xoá mềm hồ sơ ở trạng thái `DRAFT`/`SAVED` → chuyển `CANCELLED`.

> Phân quyền: Màn hình phân quyền theo TREASURY_CODE

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| Mã hồ sơ | DOSSIER_CODE | Label | – | Tự lấy từ bản ghi | String | Read-only |
| Trạng thái hiện tại | F_STATUS | Label | – | Tự lấy | String | Phải ∈ {`DRAFT`,`SAVED`} (VAL-13) |
| Lý do xoá | DELETE_REASON | TextArea | Y | – | String | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16) |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y | Off | Boolean | Phải tick mới enable nút "Xác nhận xoá" |
| Người xoá | DELETED_BY | Label | – | User hiện tại | String | Auto |
| Thời gian xoá | DELETED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto, hiển thị `dd/mm/yyyy hh:MM:ss` |

### B3.2. Màn hình `EXP.CAPEX_DOSSIER.HISTORY`

> Lịch sử thay đổi của hồ sơ (chế độ chỉ đọc).

> Phân quyền: Màn hình phân quyền theo TREASURY_CODE

| Trường | Trường (ENG) | Loại | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- |
| STT | SEQ_NO | Label | Number | Tự tăng; sort DESC (mới nhất lên đầu) |
| Người tạo | CREATED_BY | Label | String | Username + Họ tên + Vai trò |
| Ngày tạo | CREATED_DATE | Label | DateTime | Thời điểm tạo hồ sơ |
| Người cập nhật cuối | UPDATED_BY | Label | String | Username + Họ tên + Vai trò |
| Ngày cập nhật cuối | UPDATED_DATE | Label | DateTime | Thời điểm cập nhật gần nhất |

### B3.3. Màn hình `EXP.CAPEX_DOSSIER.ATTACH`

> Quản lý tài liệu đính kèm — chuẩn đính kèm chung.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- | --- |
| Tên file | FILE_NAME | Label | – | – | String | Lấy từ tên gốc upload |
| Loại tài liệu | ATTACHMENT_TYPE_CODE | Dropdown | Y | – | String | Danh mục: Chứng từ gốc / Hợp đồng / Hoá đơn / Bảng kê / Văn bản khác |
| Mô tả | DESCRIPTION | TextArea | N | – | String | ≤ 250 ký tự |
| File upload | FILE_BLOB | File Upload | Y | – | Binary | ≤ 10MB/file; định dạng: pdf/docx/xlsx/jpg/png (P1-4); check MIME + magic byte |
| Kích thước | FILE_SIZE | Label | – | Tự tính | Number | Hiển thị KB/MB |
| Người upload | CREATED_BY | Label | – | User hiện tại | String | Auto |
| Ngày upload | CREATED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto |
| Thao tác | ACTIONS | Icon group | – | – | – | Tải xuống (Ctrl+J) / Xem trước / Xoá (Shift+Delete) |

### B3.4. Màn hình `EXP.CAPEX_DOSSIER.LOOKUP.PROJECT`

> Popup tra cứu Dự án/Công trình (LOV.01).

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Loại dữ liệu | Mô tả / Ràng buộc |
| --- | --- | --- | --- | --- | --- |
| Mã dự án | PROJECT_CODE | TextBox | N | String | Tìm chính xác / chứa |
| Tên dự án | PROJECT_NAME | TextBox | N | String | Tìm chứa; không phân biệt hoa thường |
| Loại dự án | PROJECT_TYPE | Dropdown | N | String | Military / Citizen / Tất cả |
| Mã ĐVQHNS | GL_SEGMENT6_CODE | TextBox | N | String | Lọc theo ban quản lý dự án |

**Khu vực kết quả:**

| STT | Trường | Trường (ENG) | Loại hiển thị | Mô tả |
| --- | --- | --- | --- | --- |
| 1 | Mã dự án | PROJECT_CODE | Text | Click để chọn |
| 2 | Tên dự án | PROJECT_NAME | Text | – |
| 3 | Loại dự án | PROJECT_TYPE | Badge | Military / Citizen |
| 4 | Mã ĐVQHNS | GL_SEGMENT6_CODE | Text | – |
| 5 | Tên ĐVQHNS | GL_SEGMENT6_NAME | Text | – |

---

## B4. Quy ước chung về đặc tả trường

| STT | Quy ước |
| --- | --- |
| 1 | Mọi trường tiền tệ hiển thị có nhóm hàng nghìn (`#,##0`); căn phải; tổng tiền hiển thị theo từng loại tiền |
| 2 | Mọi trường ngày hiển thị theo `dd/mm/yyyy`; ngày giờ `dd/mm/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh |
| 3 | Mọi trường Lookup có icon kính lúp + phím tắt `F4` |
| 4 | Mọi trường bắt buộc đánh dấu sao đỏ (`*`) cạnh nhãn; trường bắt buộc có điều kiện đánh dấu `(*)` và mô tả điều kiện trong tooltip |
| 5 | Khi field bị disable phải có tooltip giải thích lý do; field đang lỗi validate hiển thị viền đỏ + thông báo lỗi dưới ô nhập |
| 6 | Mọi `TextArea` chống XSS bằng sanitize/escape khi hiển thị; mọi input chống SQL Injection bằng prepared statement phía server |
| 7 | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload |
| 8 | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F8`, `F9`, …) đồng bộ với spec_button.md |

---

## B5. Out of Scope — DB columns quản lý bởi backend (không expose UI)

> Các cột dưới đây tồn tại trong database nhưng **không hiển thị và không nhập trực tiếp từ UI**. Giá trị được sinh/cập nhật hoàn toàn tự động bởi backend theo business logic. UI không gửi, không validate, không hiển thị các cột này.

| Bảng | Column | Mô tả | Cơ chế sinh |
| --- | --- | --- | --- |
| `EXP_DOSSIER` | `VERSION` | Phiên bản optimistic lock (F-VER) | Tăng +1 mỗi lần Sửa & Lưu thành công (VAL-15); client chỉ đọc để kiểm tra conflict |
| `EXP_DOSSIER` | `WORKFLOW_CODE` | Mã luồng phê duyệt áp dụng cho hồ sơ | Backend gán theo quy tắc nghiệp vụ khi Submit |
| `EXP_DOSSIER` | `ASSIGN_USER` | User đang giữ xử lý hồ sơ hiện tại | Backend cập nhật tự động theo chuyển trạng thái (§A11.2) |
| `EXP_DOSSIER` | `SLA` | Thời hạn xử lý tổng hồ sơ | Backend tính từ `WORKFLOW_CODE` + ngày Submit; chi tiết theo `EXP_DOSSIER_SLA` |
| `EXP_DOSSIER` | `HASH_INFO` | Hash toàn bộ dữ liệu hồ sơ | Backend sinh khi Submit để phục vụ ký số |
| `EXP_DOSSIER` | `COMPLETED_DATE` | Ngày hoàn thành hồ sơ | Backend set khi chuyển trạng thái → `COMPLETED` |
| `EXP_DOSSIER` | `STATUS` | Cờ hiệu lực DB-level (`0`/`1`) | Backend quản lý; `1` = active, `0` = đã huỷ/xoá; **khác với** `F_STATUS` (trạng thái luồng) |

---

# C - Đặc tả nút chức năng

## C1 - Chi tiết đặc tả nút chức năng

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt / Trigger | Phím tắt | Mô tả | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Tạo mới | New | `EXP.CAPEX_DOSSIER.NEW.OPEN` | On click | `Ctrl+N` | Mở form Thêm mới trống | Chỉ enable với user có vai trò Maker; trên `EXP.CAPEX_DOSSIER.LIST` |
| 2 | Lưu | Save | `EXP.CAPEX_DOSSIER.NEW.SAVE` | On click | `Ctrl+S` | Validate cơ bản; lưu → `SAVED`; sinh DOSSIER_CODE | Type **Primary**; trên `.NEW` và `.EDIT` |
| 3 | Lưu nháp | Save Draft | `EXP.CAPEX_DOSSIER.NEW.SAVE_DRAFT` | On click | `Ctrl+Shift+S` | Validate tối thiểu; lưu → `DRAFT` | **\[P1-9\]** Type **Default** (không Primary); event riêng |
| 4 | Gửi kiểm soát | Submit | `EXP.CAPEX_DOSSIER.NEW.SUBMIT` | On click | `F9` | Validate đầy đủ; `SAVED`/`VALIDATED` → `SUBMITTED`; gửi notify Checker | **\[P1-8\]** Nhãn = "Gửi kiểm soát" (mockup ghi "Gửi phê duyệt" — lỗi nhãn, cần UI sửa); enable khi có ≥1 chứng từ hợp lệ; Maker only |
| 5 | Xem | View | `EXP.CAPEX_DOSSIER.VIEW.OPEN` | On click row / link | `F3` | Mở form read-only; đầy đủ §B1.1, §B1.2 + các tab | Trên `EXP.CAPEX_DOSSIER.LIST` |
| 6 | Sửa | Edit | `EXP.CAPEX_DOSSIER.EDIT.OPEN` | On click | `F2` | Mở form editable; load F-VER | Enable khi STATE_CODE ∈ {`DRAFT`,`SAVED`} + Maker gốc |
| 7 | Lưu (Sửa) | Save (Edit) | `EXP.CAPEX_DOSSIER.EDIT.SAVE` | On click | `Ctrl+S` | F-VER+1; ghi audit oldValue→newValue | Trên `EXP.CAPEX_DOSSIER.EDIT` |
| 8 | Xoá | Delete | `EXP.CAPEX_DOSSIER.DELETE.OPEN` | On click | `Delete` | Mở popup Xoá (lý do + checkbox); xoá → `CANCELLED` | Enable khi STATE_CODE ∈ {`DRAFT`,`SAVED`} + Maker gốc |
| 9 | Xác nhận xoá | Confirm Delete | `EXP.CAPEX_DOSSIER.DELETE.CONFIRM` | On click | `Enter` (popup) | Soft-delete; ghi audit | Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox |
| 10 | Huỷ | Cancel | `EXP.CAPEX_DOSSIER.NEW.CANCEL` / `EXP.CAPEX_DOSSIER.EDIT.CANCEL` | On click | `Esc` | Hỏi xác nhận nếu dirty; đóng form (thao tác nhập) | Type Default; trên `.NEW`,`.EDIT` |
| 10a | Hủy bỏ hồ sơ | Cancel Record | `EXP.CAPEX_DOSSIER.CANCEL` | On click | – | Hủy bỏ hồ sơ đã lưu (record-level) | **\[P1-6\]** Type Warning; trên `.VIEW` |
| 10b | Quay lại danh sách | Back | `EXP.CAPEX_DOSSIER.VIEW.BACK` | On click | – | Điều hướng về `EXP.CAPEX_DOSSIER.LIST` | **\[P1-7\]** Type Default; trên `.VIEW` |
| 11 | Sao chép | Copy | `EXP.CAPEX_DOSSIER.NEW.COPY` | On click | `Ctrl+Shift+C` | Sao chép hồ sơ thành bản nháp mới (`DRAFT`) | **\[P1-5\]** Type Default; trên `.VIEW` |
| 12 | Thêm mới chứng từ | Add Document | `EXP.CAPEX_DOSSIER.NEW.ADD_DOC` | On click | `Ctrl+Shift+N` | Mở LOV.Chứng từ; chọn chứng từ → link đến chức năng tạo chứng từ; sau khi lưu hiển thị trên grid §B1.2 | **\[P1-11\]** Type Success; chỉ enable khi hồ sơ đã có DOSSIER_CODE; 2 vị trí (toolbar + trong grid) |
| 13 | Đặt lại bộ lọc | Reset Filter | `EXP.CAPEX_DOSSIER.LIST.RESET` | On click | `F5` / `Ctrl+R` | Xoá bộ lọc về mặc định; tải lại danh sách | **\[P1-16\]** Đổi từ `LIST.FILTER`; trên `.LIST` |
| 13a | Tìm kiếm | Search | `EXP.CAPEX_DOSSIER.LIST.SEARCH` | On click | `Enter` | Áp dụng bộ lọc và tìm kiếm | **\[P1-16\]** Type Primary; trên `.LIST` |
| 14 | Xuất | Export | `EXP.CAPEX_DOSSIER.LIST.EXPORT` | On click | `Ctrl+Shift+E` | Xuất Excel/PDF/CSV | Trên `EXP.CAPEX_DOSSIER.LIST` |
| 15 | In phiếu | Print | `EXP.CAPEX_DOSSIER.VIEW.PRINT` | On click | `Ctrl+P` | Sinh PDF preview theo template | **\[P1-10\]** Đổi từ `PRINT.PREVIEW`; trên `.VIEW` |
| 16 | Đính kèm | Upload | `EXP.CAPEX_DOSSIER.ATTACH.UPLOAD` | On click | `Ctrl+U` | Mở popup `EXP.CAPEX_DOSSIER.ATTACH`; upload file | Trên `EXP.CAPEX_DOSSIER.NEW`, `.EDIT` |
| 17 | Tải file đính kèm | Download | `EXP.CAPEX_DOSSIER.ATTACH.DOWNLOAD` | On click | `Ctrl+J` | Tải file đính kèm đã chọn | Trên tab Đính kèm |
| 18 | Mở Lịch sử | History | `EXP.CAPEX_DOSSIER.VIEW.HISTORY` | On click tab | `Alt+H` | Mở tab Lịch sử giao dịch | Trên `.NEW`, `.EDIT`, `.VIEW` |
| 19 | Mở Trạng thái phê duyệt | Approval Status | `EXP.CAPEX_DOSSIER.VIEW.APPROVAL` | On click tab | `Alt+P` | Hiển thị workflow Maker→Checker→Approver | Trên `.NEW`, `.EDIT`, `.VIEW` |
| 20 | Tra cứu danh mục | Lookup | (Mở popup `EXP.CAPEX_DOSSIER.LOOKUP.*`) | On click kính lúp | `F4` | Mở popup tra cứu; chọn giá trị → trả về form | Trên trường Dropdown + Lookup |

---

## C2 - Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
| --- | --- |
| 1 | Kiểm tra quyền theo vai trò (Maker/Checker/Approver/Viewer) trước khi hiển thị; thiếu quyền → ẩn nút (hoặc disable + tooltip MSG-ERR-PERMISSION) |
| 2 | Nút Sửa/Xoá: chỉ enable khi STATE_CODE ∈ {`DRAFT`,`SAVED`} (VAL-13) **và** NSD là Maker gốc (VAL-14); vi phạm → VDBAS-EXP-0003 / VDBAS-EXP-0004 |
| 3 | Nút Gửi kiểm soát: chỉ enable khi hồ sơ có ít nhất 1 chứng từ hợp lệ và STATE_CODE ∈ {`SAVED`,`VALIDATED`} |
| 4 | Nút Phê duyệt/Trả lại/Từ chối: chỉ hiển thị trên `EXP.CAPEX_DOSSIER.APPROVE` cho user có thẩm quyền; SoD bắt buộc (BIZ-001) |
| 5 | Nút Lưu/Submit: disable khi form có lỗi validate cứng; enable lại khi tất cả lỗi đã fix |
| 6 | Nút Xác nhận xoá: disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 7 | Phòng chống double-submit: client disable ngay sau click + idempotency key phía server |
| 8 | Khi phiên hết hạn → mọi nút disable; MSG-ERR-SESSION; redirect đăng nhập |
| 9 | Mọi nút disable hiển thị tooltip giải thích lý do; hỗ trợ ARIA label + phím tắt trong tooltip |
| 10 | Mỗi thao tác thành công ghi audit `EXP.CAPEX_DOSSIER.AUDIT.WRITE` (BIZ-007) |

---

## C3 - Quy ước phím tắt

- **Nhóm soạn thảo (Maker)**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Ctrl+Shift+S` (Lưu nháp), `F9` (Gửi kiểm soát), `Esc` (Huỷ), `Ctrl+Shift+C` (Sao chép).
- **Nhóm thao tác bản ghi (LIST)**: `F2` (Sửa), `F3` (Xem), `Delete` (Xoá), `F5`/`Ctrl+R` (Đặt lại bộ lọc), `Ctrl+Shift+E` (Xuất), `Ctrl+P` (In).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường có icon kính lúp.
- **Nhóm kiểm soát/phê duyệt**: `F8` (Kiểm soát – Checker), `F9` (Phê duyệt – Approver), `Alt+B` (Trả lại – Back), `Alt+J` (Từ chối – reJect).
- **Nhóm đính kèm**: `Ctrl+U` (Upload), `Ctrl+J` (Download), `Shift+Delete` (Remove).
- **Nhóm điều hướng tab trong VIEW**: `Alt+H` (Lịch sử), `Alt+P` (Trạng thái phê duyệt).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).
- **Thêm mới chứng từ**: `Ctrl+Shift+N`.

---

# D - Testcase: EXP.CAPEX_DOSSIER

> **Cấu trúc mã TC:** `EXP.CAPEX_DOSSIER.TC.<Nhóm>.<Số thứ tự>`\*\***Nhóm:** 1 = Tạo mới, 2 = Xem, 3 = Cập nhật, 4 = Xoá \*\***Loại UC:** Positive = luồng thành công; Negative = luồng lỗi/ngoại lệ

---

## D1 - Nhóm 1 — Tạo mới

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
| --- | --- | --- | --- | --- | --- | --- |
| EXP.CAPEX_DOSSIER.TC.1.01 | Tạo hồ sơ thành công | Positive | Maker đã đăng nhập; LOV.01 và LOV.03 đã cấu hình | Nhập đủ: PROJECT_CODE, PROJECT_MANAGEMENT_CODE, DOSSIER_DATE, DATA_SOURCE_CODE; bấm **Lưu** | Lưu thành công; DOSSIER_CODE tự sinh; trạng thái = **Đang hoàn thiện**; MSG-OK-SAVE; CREATED_BY/CREATED_DATE tự điền | VAL-01, BIZ-007 |
| EXP.CAPEX_DOSSIER.TC.1.02 | Tạo hồ sơ không thành công — Không có quyền | Negative | User không có vai trò Maker | Truy cập nút Tạo mới | Nút **Tạo mới** bị ẩn hoặc disable; MSG-ERR-PERMISSION nếu truy cập trực tiếp | BIZ-001, VAL-14 |
| EXP.CAPEX_DOSSIER.TC.1.03 | Tạo hồ sơ không thành công — Trường bắt buộc bỏ trống | Negative | Maker đã đăng nhập | Để trống PROJECT_CODE; bấm **Lưu** | Highlight đỏ trường PROJECT_CODE; MSG-ERR-REQUIRED; chặn lưu | VAL-01 |
| EXP.CAPEX_DOSSIER.TC.1.04 | Tạo hồ sơ không thành công — DOSSIER_DATE sai định dạng | Negative | Maker đã đăng nhập | Nhập DOSSIER_DATE = "32/13/2025"; bấm **Lưu** | MSG-ERR-FORMAT cho DOSSIER_DATE; chặn lưu | VAL-02 |
| EXP.CAPEX_DOSSIER.TC.1.05 | Tạo hồ sơ không thành công — PROJECT_CODE ngoài danh mục | Negative | Maker đã đăng nhập | Nhập PROJECT_CODE không thuộc LOV.01; bấm **Lưu** | MSG-ERR-LOOKUP; clear trường PROJECT_CODE | VAL-03 |
| EXP.CAPEX_DOSSIER.TC.1.06 | Cascading fill PROJECT_NAME sau khi chọn PROJECT_CODE | Positive | Maker đang nhập | Chọn PROJECT_CODE = "7122155" | PROJECT_NAME tự điền = "Dự án nâng cấp bệnh viện Bạch Mai"; read-only | VAL-06 |
| EXP.CAPEX_DOSSIER.TC.1.07 | PROJECT_SPECIFIC_CODE chỉ hiển thị khi Military | Positive | Maker đang nhập; chọn PROJECT_CODE có Project_Type = Military | Xem form | Trường PROJECT_SPECIFIC_CODE hiển thị và cho phép chọn | VAL-06, §B1.1 |
| EXP.CAPEX_DOSSIER.TC.1.08 | PROJECT_SPECIFIC_CODE ẩn khi không phải Military | Positive | Maker đang nhập; chọn PROJECT_CODE có Project_Type = Citizen | Xem form | Trường PROJECT_SPECIFIC_CODE không hiển thị | VAL-06, §B1.1 |
| EXP.CAPEX_DOSSIER.TC.1.09 | Gửi kiểm soát thành công | Positive | Hồ sơ **Đang hoàn thiện**; đã có chứng từ hợp lệ | Bấm **Gửi kiểm soát** | Trạng thái → **Chờ kiểm soát**; notify Checker; MSG-OK-SUBMIT | VAL-01, BIZ-009 |
| EXP.CAPEX_DOSSIER.TC.1.10 | Gửi kiểm soát thất bại — Chưa có chứng từ | Negative | Hồ sơ **Đang hoàn thiện**; chưa thêm chứng từ nào | Bấm **Gửi kiểm soát** | Nút **Gửi kiểm soát** disable; tooltip giải thích lý do | §C2 quy tắc 3 |
| EXP.CAPEX_DOSSIER.TC.1.11 | Lưu nháp khi dữ liệu chưa đủ | Positive | Maker đang nhập; chưa nhập đủ trường bắt buộc | Bấm **Lưu nháp** | Lưu **Đang hoàn thiện**; không validate đầy đủ; MSG-OK-SAVE | A1 |
| EXP.CAPEX_DOSSIER.TC.1.12 | Huỷ form khi đã nhập dữ liệu | Positive | Maker đang nhập dữ liệu | Bấm **Huỷ** hoặc `Esc` | Popup MSG-CFM-CANCEL; xác nhận → đóng form; không lưu | A2 |
| EXP.CAPEX_DOSSIER.TC.1.13 | Cảnh báo hồ sơ trùng | Positive | Đã có hồ sơ cùng PROJECT_CODE + PROJECT_MANAGEMENT_CODE trong N phút | Tạo hồ sơ mới cùng giá trị | MSG-WRN-DUPLICATE; nút Tiếp tục/Huỷ | VAL-18 |
| EXP.CAPEX_DOSSIER.TC.1.14 | DATA_SOURCE_CODE mặc định Thủ công khi tạo mới | Positive | Maker tạo mới | Mở form NEW | DATA_SOURCE_CODE = "Thủ công"; read-only sau khi lưu | §B1.1 |

---

## D2 - Nhóm 2 — Xem

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
| --- | --- | --- | --- | --- | --- | --- |
| EXP.CAPEX_DOSSIER.TC.2.01 | Xem hồ sơ thành công | Positive | Hồ sơ tồn tại ở bất kỳ trạng thái; NSD có quyền Viewer trở lên | Click link DOSSIER_CODE trên LIST | Mở form read-only; hiển thị §B1.1, §B1.2 (grid Chứng từ) + tab Đính kèm + tab Lịch sử + tab Trạng thái phê duyệt | §A4 bước 7 |
| EXP.CAPEX_DOSSIER.TC.2.02 | Xem không thành công — Không có quyền | Negative | User không có quyền truy cập | Truy cập trực tiếp URL màn hình VIEW | MSG-ERR-PERMISSION | BIZ-001 |
| EXP.CAPEX_DOSSIER.TC.2.03 | Tab Lịch sử giao dịch | Positive | Hồ sơ đã có nhiều lần sửa đổi | Mở VIEW; click tab **Lịch sử** (`Alt+H`) | Hiển thị danh sách audit: CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, action, oldValue→newValue | BIZ-007, BIZ-008 |
| EXP.CAPEX_DOSSIER.TC.2.04 | Tab Trạng thái phê duyệt | Positive | Hồ sơ ở **Chờ phê duyệt** | Mở VIEW; click tab **Trạng thái phê duyệt** (`Alt+P`) | Hiển thị workflow Maker→Checker→Approver; highlight bước Approver đang chờ | §A11 |
| EXP.CAPEX_DOSSIER.TC.2.05 | Grid Chứng từ hiển thị đúng | Positive | Hồ sơ có 3 chứng từ | Mở VIEW; xem §B1.2 | Hiển thị đủ 3 chứng từ với các cột: STT, DOCUMENT_NO, DOCUMENT_DATE, ACCOUNTING_DATE, ORIGINAL_AMOUNT, BASE_AMOUNT | §B1.2 |

---

## D3 - Nhóm 3 — Cập nhật

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
| --- | --- | --- | --- | --- | --- | --- |
| EXP.CAPEX_DOSSIER.TC.3.01 | Cập nhật hồ sơ thành công | Positive | Hồ sơ ở **Đang hoàn thiện**; NSD là Maker gốc | Bấm **Sửa**; đổi DOSSIER_DATE; bấm **Lưu** | F-VER+1; ghi audit oldValue→newValue; MSG-OK-SAVE | VAL-15, BIZ-007 |
| EXP.CAPEX_DOSSIER.TC.3.02 | Cập nhật thất bại — Trạng thái không cho phép | Negative | Hồ sơ ở **Chờ kiểm soát** | Cố gắng bấm **Sửa** | Nút **Sửa** disable; tooltip MSG-ERR-STATUS | VAL-13 |
| EXP.CAPEX_DOSSIER.TC.3.03 | Cập nhật thất bại — Không phải Maker gốc | Negative | Hồ sơ **Đang hoàn thiện**; NSD không phải người tạo | Cố gắng bấm **Sửa** | Nút **Sửa** disable; tooltip MSG-ERR-MAKER | VAL-14 |
| EXP.CAPEX_DOSSIER.TC.3.04 | Cập nhật thất bại — Optimistic lock conflict | Negative | Hồ sơ đang được user A giữ form Sửa | User B bấm **Lưu** sau khi user A đã lưu | MSG-ERR-LOCK; yêu cầu user B tải lại | VAL-15 |
| EXP.CAPEX_DOSSIER.TC.3.05 | DOSSIER_CODE immutable khi Sửa | Negative | Hồ sơ **Đang hoàn thiện** | Mở Sửa; kiểm tra trường DOSSIER_CODE | Trường DOSSIER_CODE disabled; backend reject nếu gửi thay đổi | VAL-17 |
| EXP.CAPEX_DOSSIER.TC.3.07 | Cập nhật thất bại — Concurrent edit | Negative | User A đang mở form Sửa | User B cố mở Sửa cùng hồ sơ | MSG-ERR-CONCURRENT với tên user A; không cho mở | §A6 E11 |

---

## D4 - Nhóm 4 — Xoá

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
| --- | --- | --- | --- | --- | --- | --- |
| EXP.CAPEX_DOSSIER.TC.4.01 | Xoá hồ sơ thành công | Positive | Hồ sơ ở **Đang hoàn thiện**; NSD là Maker gốc | Bấm **Xoá**; nhập Lý do ≥ 10 ký tự; tick checkbox; **Xác nhận xoá** | Soft-delete; ẩn khỏi LIST; ghi audit; MSG-OK-DELETE | VAL-16, BIZ-003, BIZ-007 |
| EXP.CAPEX_DOSSIER.TC.4.02 | Xoá thất bại — Trạng thái không cho phép | Negative | Hồ sơ ở **Chờ kiểm soát** | Cố gắng bấm **Xoá** | Nút **Xoá** disable; tooltip MSG-ERR-STATUS | VAL-13 |
| EXP.CAPEX_DOSSIER.TC.4.03 | Xoá thất bại — Không phải Maker gốc | Negative | Hồ sơ **Đang hoàn thiện**; NSD không phải người tạo | Cố gắng bấm **Xoá** | Nút **Xoá** disable; tooltip MSG-ERR-MAKER | VAL-14 |
| EXP.CAPEX_DOSSIER.TC.4.04 | Xoá thất bại — Lý do không đủ ký tự | Negative | Popup Xoá đang mở | Nhập Lý do &lt; 10 ký tự; bấm **Xác nhận xoá** | Nút **Xác nhận xoá** vẫn disable; MSG-ERR-DELETE-CFM | VAL-16 |
| EXP.CAPEX_DOSSIER.TC.4.05 | Xoá thất bại — Chưa tick checkbox xác nhận | Negative | Popup Xoá đang mở; đã nhập Lý do ≥ 10 ký tự | Chưa tick checkbox | Nút **Xác nhận xoá** vẫn disable | VAL-16 |
| EXP.CAPEX_DOSSIER.TC.4.06 | Hồ sơ đã xoá vẫn truy được qua audit | Positive | Hồ sơ đã bị xoá (`CANCELLED`) | Admin truy vấn audit log | Hồ sơ xuất hiện trong audit với action=DELETE; oldValue→newValue đầy đủ | BIZ-003, BIZ-007 |

---

# Phụ lục — Danh mục LOV

## LOV.01 — Bảng thông Dự án/Công trình

| Project_Type | PROJECT_CODE | Project_Name | PROJECT_SPECIFIC_CODE | PROJECT_SPECIFIC_NAME | GL_SEGMENT6_CODE | GL_SEGMENT6_NAME |
| --- | --- | --- | --- | --- | --- | --- |
| Military | 7004686 | Các dự án thuộc dự án bộ quốc phòng | 001200037 | Dự án TM02 | 1059227 | BQL Cục thông tin BQP |
| Military | 7004686 | Các dự án thuộc dự án bộ quốc phòng | 001200038 | Dự án TM03 | 1059227 | BQL Cục thông tin BQP |
| Citizen | 7122155 | Dự án nâng cấp bệnh viện Bạch Mai | *(N/A)* | *(N/A)* | 3029123 | BQLDA bệnh viện Bạch Mai |

## LOV.03 — Nguồn

| DATA_SOURCE_CODE | Diễn giải |
| --- | --- |
| Thủ công | Nhập thủ công — mặc định khi tạo mới NEW |
| DVC | Dịch vụ công — khi nhận dữ liệu từ hệ thống khác |

## LOV.04 — Kho bạc / Treasury Code

| Type | Treasury_Code | Treasury_Name |
| --- | --- | --- |
| KBNN | 0012 | Kho bạc nhà nước khu vực I - PGD số 12 |
| KBNN | 0011 | Kho bạc nhà nước khu vực I |
| KBNN | 0003 | Kho bạc nhà nước - Ban giao dịch |

## LOV.05 — Mã Ban quản lý dự án

| PROJECT_MANAGEMENT_CODE | PROJECT_MANAGEMENT_NAME |
| --- | --- |
| 9050303 | Ban quản lý dự án các công trình giao thông đường bộ |
| 3025567 | Ban quản lý các dự án đầu tư bộ văn hóa |

## LOV.06 — Loại chi phí / Expense Type

| Expense_Code | Expense_Name |
| --- | --- |
| EXP01 | Phí chuyển tiền đi |
| EXP02 | Điện phí |
| EXP03 | Phí chuyển đổi ngoại tệ |
| EXP04 | Phí ngân hàng đại lý/trung gian |
| EXP05 | Các loại phí khác |

## LOV.07 — Loại thanh toán / Payment Type

| Payment_Type_Code | Payment_Type_Name |
| --- | --- |
| LTT01 | Lệnh chuyển Nợ giá trị thấp |
| LTT02 | Lệnh chuyển Nợ giá trị cao |
| LTT03 | Lệnh chuyển Có giá trị thấp |
| LTT04 | Lệnh chuyển Có giá trị cao |

## LOV.08 — Danh mục Segment COA (GL_SEGMENT1–12)

| LOV | Segment | Mã | Diễn giải | Ghi chú |
| --- | --- | --- | --- | --- |
| LOV.08.1 | Segment1 (Mã quỹ) | 01 | *(xem hệ thống)* | 2 ký tự |
| LOV.08.2 | Segment2 (TK tự nhiên) | 0001 | *(xem hệ thống)* | 4 ký tự |
| LOV.08.3 | Segment3 (DVQHNS) | 0000001 | *(xem hệ thống)* | 7 ký tự |
| LOV.08.4 | Segment4 (Cấp NS) | 1 | *(xem hệ thống)* | – |
| LOV.08.5 | Segment5 (Chương) | 001 | *(xem hệ thống)* | 3 ký tự; mặc định `000` |
| LOV.08.6 | Segment6 (Ngành KT) | 001 | *(xem hệ thống)* | 3 ký tự; mặc định `000` |
| LOV.08.7 | Segment7 (NDKT) | 0001 | *(xem hệ thống)* | 4 ký tự; mặc định `0000` |
| LOV.08.8/LOV.08.8 | Segment8 (ĐB) | 00001 | *(xem hệ thống)* | 5 ký tự; mặc định `00000` |
| LOV.08.9 | Segment9 (CTMT) | 00001 | *(xem hệ thống)* | 5 ký tự; mặc định `00000` |
| LOV.08.10 | Segment10 (MN) | 01 | *(xem hệ thống)* | 2 ký tự; mặc định `00` |
| LOV.08.11 | Segment11 (Kho bạc) | 0001 | *(xem hệ thống)* | 4 ký tự; mặc định `0000` |
| LOV.08.12 | Segment12 (DP) | 001 | *(xem hệ thống)* | 3 ký tự; mặc định `00` |

## LOV.09 — Danh mục chủ đầu tư

| PROJECT_OWNER_CODE | PROJECT_OWNER_NAME |
| --- | --- |
| 1059227 | Thông tấn xã Việt Nam |
| 1059393 | Cục thủy hải sản bộ công thương |

## LOV.Loại chứng từ — Document Type

| Document_type | Document_type_Name |
| --- | --- |
| Giấy ĐNTT | Giấy đề nghị thanh toán vốn mẫu số 04.a.nn/TT |
| Giấy ĐN thu hồi | Giấy đề nghị thu hồi vốn mẫu số 04.b/TT |
| Giấy ĐNTT vốn | Giấy đề nghị thanh toán vốn mẫu số 04.b.nn/TT |
| Giấy ĐN thu hồi UT | Giấy đề nghị thu hồi ứng trước vốn đầu tư mẫu số 04.c/TT |
| Giấy rút DT | Giấy rút dự toán Ngân sách Nhà nước mẫu số 04.d/TT |
| Giấy rút vốn | Giấy rút vốn mẫu số 05.a/TT |

---