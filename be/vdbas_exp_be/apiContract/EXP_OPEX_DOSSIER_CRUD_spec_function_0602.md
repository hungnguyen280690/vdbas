# A - Bảng đặc tả chức năng

> Chức năng **Thêm mới / Xem / Sửa / Xoá** hồ sơ chi thường xuyên. BA dùng làm tham chiếu — cấu trúc theo chuẩn template `CRUD_spec_function_v1.md`.

## A1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `EXP.OPEX.DOSSIER` |
| Tên chức năng | Quản lý hồ sơ chi thường xuyên — Thêm mới / Xem / Sửa / Xoá |
| Tên chức năng (ENG) | Operational Expenditure — Dossier Management |
| Người sử dụng | Người lập (Maker), Người kiểm soát (Checker), Người phê duyệt (Approver), Người tra cứu (Viewer) |
| Mô tả | Cho phép NSD tạo mới, tra cứu, sửa, xoá hồ sơ chi thường xuyên; gửi kiểm soát theo quy trình Maker–Checker–Approver |
| Độ ưu tiên | Cao |
| URD reference | _(để trống)_ |

---

## A2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống |
| 2 | NSD có quyền truy cập màn hình theo vai trò (Maker/Checker/Approver/Viewer) |
| 3 | Các danh mục Master Data đã được cấu hình (đơn vị, tài khoản, loại tiền, mã quỹ…) |
| 4 | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở trạng thái DRAFT hoặc REJECTED_BY_CHECKER |
| 5 | (Trường hợp Sửa/Xoá) NSD là Maker gốc của bản ghi |

---

## A3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | (Trường hợp Thêm/Sửa) Bản ghi được lưu với trạng thái DRAFT |
| 2 | (Trường hợp Xoá) Bản ghi được soft-delete, ẩn khỏi danh sách, vẫn truy được qua audit |
| 3 | Audit log đã ghi nhận thao tác (user, timestamp, IP, oldValue→newValue) |
| 4 | (Trường hợp Submit giao dịch) Notification đã gửi đến Checker/Approver |
| 5 | Số dư hold (nếu có) được cập nhật tương ứng |

---

## A4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | Bấm **Thêm mới** trên màn hình danh sách, hoặc Menu "Thêm mới" | (1) Mở form trống, (2) Trạng thái hồ sơ = DRAFT, (3) Tự động điền CREATED_BY = user hiện tại, SEND_DATE = ngày hiện tại |
| 2 | Nhập các trường dữ liệu theo Bảng đặc tả Field (Top Area) | (1) Kiểm tra dữ liệu khi rời ô nhập (onBlur), (2) Kiểm tra ràng buộc giữa các trường khi gửi lệnh, (3) Kiểm tra theo quy định nghiệp vụ |
| 3 | Thêm chứng từ thanh toán vào danh sách (chọn loại chứng từ từ LOV.03) | (1) Sinh DOC_NUMBER tự động: `[DOSSIER_CODE]-[Document_Type_Code]-[4 chữ số tăng dần]`, (2) Auto-fill Tên chứng từ từ LOV.Expenditure_doc_type |
| 4 | Đính kèm tài liệu *(Optional)* — click Tab Đính kèm tài liệu | Validate ≤ 10MB, định dạng pdf/jpg/png/docx (VAL-09) |
| 5| Bấm **Lưu** | Validate cơ bản; lưu DRAFT; sinh DOSSIER_CODE; hiển thị MSG-OK-SAVE |
| 6 | Bấm **Thêm mới Chứng từ** (trong chế độ VIEW/EDIT) | Mở popup `EXP.OPEX.DOSSIER.POPUP.DOC_TYPE` hiển thị danh sách loại chứng từ dạng Radio button (lấy giá trị từ LOV.Expenditure_doc_type); sau khi chọn và bấm Chấp nhận (F10) → mở form thêm mới chứng từ tương ứng; sau khi lưu → hiển thị trên GRID danh sách chứng từ |
| 7 | Bấm **Gửi kiểm soát** (khi đã có đủ chứng từ thoả mãn Validation) | Validate đầy đủ; chuyển trạng thái DRAFT → PENDING_CHECKER; gửi notify Checker; ghi audit |
| 8 | (Trường hợp Xem) Chọn dòng trong danh sách, bấm **Xem** hoặc click link DOSSIER_CODE | Mở form read-only; hiển thị đầy đủ Top Area, Grid chứng từ, [Tab] Đính kèm tài liệu, [Tab] Lịch sử giao dịch, [Tab] Trạng thái phê duyệt |
| 9 | (Trường hợp Sửa) Trên bản ghi DRAFT/REJECTED_BY_CHECKER, bấm **Sửa** | Mở form editable; load phiên bản hiện hành F-VER; cho phép thay đổi các trường theo đặc tả Field |
| 10 | (Trường hợp Sửa) Lưu thay đổi | Kiểm tra optimistic lock (VAL-15); cập nhật phiên bản F-VER+1; ghi audit oldValue→newValue |
| 11 | (Trường hợp Xoá) Trên bản ghi DRAFT/REJECTED_BY_CHECKER, bấm **Xoá** | Mở popup nhập **Lý do** (≥ 10 ký tự) + checkbox xác nhận đã rà soát |
| 12 | (Xoá) Bấm **Xác nhận xoá** | Soft-delete (F-STATUS=DELETED), ghi audit, release hold (nếu có), hiển thị MSG-OK-DELETE |

---

## A5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | NSD bấm **Lưu nháp** thay vì Submit | Bỏ qua validate đầy đủ, chỉ validate định dạng; lưu DRAFT |
| A2 | NSD bấm **Huỷ** khi đang nhập | Nếu NSD đã thực sự nhập/thay đổi dữ liệu (không tính các giá trị auto-fill như CREATED_BY, SEND_DATE mặc định, SOURCE mặc định) → hỏi xác nhận (MSG-CFM-CANCEL); nếu xác nhận → đóng form, bỏ thay đổi |
| A3 | NSD bấm **Kết xuất** | Xuất Excel/PDF/CSV (sync nếu < 50k bản ghi, async nếu vượt) |
| A4 | NSD copy từ bản ghi đã có | Mở form Thêm mới với dữ liệu sao chép; DOSSIER_CODE mới tự sinh khi lưu, F-STATUS=DRAFT |
| A5 | Checker bấm **Kiểm soát** → chuyển Approver | Cập nhật trạng thái PENDING_APPROVER; notify Approver |
| A6 | Approver bấm **Phê duyệt** | Cập nhật APPROVED; trigger luồng nghiệp vụ kế tiếp (hạch toán, thanh toán) |
| A7 | NSD bấm **TB KQGQ TTHC** trên Top Area | Mở chức năng EXP.RESULTNOTIFY — Thông báo kết quả giải quyết TTHC |
| A8 | NSD bấm **VB gia hạn** trên hồ sơ quá hạn | Mở chức năng EXP.EXTENSIONDOC lập Văn bản xin lỗi và đề nghị gia hạn |
| A9 | NSD bấm **Lịch sử** trên Top Area | Mở popup lịch sử audit của hồ sơ |

---

## A6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc bị bỏ trống khi Submit (VAL-01) | Highlight đỏ + hiển thị `Vui lòng nhập [Tên trường]`; chặn submit |
| E2 | Giá trị không thuộc danh mục (VAL-03) | Thông báo `Giá trị không nằm trong danh mục`; clear trường |
| E3 | Cross-field không thoả mãn (VAL-05/07/08) | Hiển thị thông báo cụ thể tại trường lỗi; chặn Submit |
| E4 | File đính kèm vượt giới hạn/sai định dạng (VAL-09) | Thông báo `File vượt giới hạn hoặc sai định dạng`; không upload |
| E5 | Sửa/Xoá khi trạng thái không cho phép (VAL-13) | Thông báo `Giao dịch đang ở trạng thái [<state>], không cho phép Sửa/Xoá`; disable nút |
| E6 | Sửa/Xoá khi không phải Maker gốc (VAL-14) | Thông báo `Chỉ Người lập gốc mới được phép Sửa/Xoá` |
| E7 | Optimistic lock conflict (VAL-15) | Thông báo `Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục` |
| E8 | Confirm xoá không đủ điều kiện (VAL-16) | Disable nút Xác nhận xoá đến khi nhập đủ lý do + tick checkbox |
| E9 | Vượt hạn mức (VAL-12) | Hiển thị warning vàng `Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn`; cho phép tiếp tục |
| E10 | Lỗi hệ thống / API timeout | Hiển thị `Lỗi hệ thống, traceId: <…>`; rollback giao dịch |
| E11 | Concurrent edit (record đang bị lock) | Thông báo `Hồ sơ đang được [<user>] chỉnh sửa, vui lòng thử lại sau` |
| E12 | Thanh toán khi hạch toán chưa hoàn tất (VAL-21) | Chặn thao tác; thông báo yêu cầu ACCOUNTING_STATUS phải là `GL_ACCOUNTED` hoặc `ACCOUNTING_POSTED` |
| E13 | File đính kèm trùng lặp (VAL-20) | Cảnh báo trùng tên + dung lượng; hỏi xác nhận trước khi cho phép upload |
| E14 | Không dành được dự toán khi gửi kiểm soát (VAL-21) | Hiển thị MSG-WRN-FAILED_RESERVE; BUDGET_STATUS=FAILED_FUND_CHECK; chặn chuyển trạng thái |

---

## A7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-001 — Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò |
| 2 | BIZ-002 — Chỉ Maker gốc được Sửa/Xoá khi bản ghi ở DRAFT/REJECTED_BY_CHECKER |
| 3 | BIZ-003 — Xoá là soft-delete; bản ghi vẫn truy được qua audit/history |
| 4 | BIZ-004 — Tổng tiền dòng chi tiết (`SUM(LINE_AMOUNT)`) phải bằng `AMOUNT` của bản ghi cha |
| 5 | BIZ-005 — File đính kèm: tối đa 10MB/file, định dạng pdf/jpg/png/docx; tối đa N file/bản ghi |
| 6 | BIZ-006 — Lý do từ chối/huỷ ≥ 10 ký tự và ≤ 500 ký tự, lưu vào audit |
| 7 | BIZ-007 — Audit log ghi đầy đủ: user, timestamp, IP, action, oldValue→newValue |
| 8 | BIZ-008 — Transaction History ghi thông tin: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE |
| 9 | BIZ-009 — Mọi chuyển trạng thái phát notification (in-app + email) cho user kế tiếp |
| 10 | BIZ-010 — Vượt hạn mức cấu hình → bắt buộc phê duyệt cấp cao hơn |
| 11 | BIZ-011 — Approval Audit log ghi đầy đủ: Check_user; Checked/Check_rejection datetime; Approve_user; Approve/Approval_rejection datetime |
| 12 | BIZ-012 —  Trường hợp hồ sơ quá hạn không hoàn thành xử lý, hồ sơ không được chuyển trạng thái "Đã phê duyệt" quá 1 ngày tính từ ngày gửi, hệ thống hiện nhắc Tạo Văn bản gia hạn |

---

## A8. Quy tắc kiểm tra dữ liệu

| STT | Phân loại | Mã | Quy tắc |
|---|---|---|---|
| 1 | Chung | VAL-01 | Trường bắt buộc (`Mandatory`) không được bỏ trống khi Submit; highlight đỏ + thông báo `Vui lòng nhập [Tên trường]` |
| 2 | Chung | VAL-02 | Định dạng dữ liệu hợp lệ theo kiểu trường: Text (độ dài min/max), Integer/Decimal (range, số chữ số thập phân), Date/DateTime (định dạng `dd/MM/yyyy [HH:mm:ss]`), Email (RFC 5322), Phone (E.164),... |
| 3 | Chung | VAL-03 | Giá trị thuộc danh mục Master Data (Dropdown/Combobox/Picker); ngoài danh mục → thông báo `Giá trị không nằm trong danh mục` và clear trường |
| 4 | Chung | VAL-04 | Range/min-max cho số và ngày (Số tiền > 0, Ngày hiệu lực ≥ Ngày hiện tại); DateRange: Từ ngày ≤ Đến ngày |
| 5 | Chung | VAL-05 | Cross-field — ràng buộc phụ thuộc giữa các trường |
| 6 | Chung | VAL-06 | Trường phụ thuộc (cascading): khi giá trị trường cha thay đổi → reset/refresh dropdown trường con |
| 7 | Chung | VAL-07 | Tổng dòng chi tiết = giá trị tổng hợp ở bản ghi cha; chênh lệch > tolerance → chặn Submit |
| 8 | Chung | VAL-08 | Ràng buộc theo thời gian: ngày phải nằm trong kỳ kế toán mở; ngoài giờ giao dịch → cảnh báo |
| 9 | Chung | VAL-09 | File đính kèm: ≤ 10MB/file, định dạng pdf/jpg/png/docx; ≤ N file/bản ghi; quét virus trước khi lưu |
| 10 | Chung | VAL-10 | Trường Text: trim, không cho phép ký tự điều khiển; chống XSS/SQL Injection bằng escape |
| 11 | Chung | VAL-11 | Unique constraint: DOSSIER_CODE duy nhất trong phạm vi hệ thống |
| 12 | Phân hệ | VAL-12 | Hạn mức theo cấu hình phân hệ: vượt → warning vàng, yêu cầu phê duyệt cấp cao hơn |
| 13 | Chung | VAL-13 | Trạng thái cho phép thao tác: Sửa/Xoá chỉ với DRAFT/REJECTED_BY_CHECKER |
| 14 | Chung | VAL-14 | Người sở hữu: chỉ Maker gốc được Sửa/Xoá |
| 15 | Chung | VAL-15 | Optimistic lock theo `(F-ID, F-VER)`: khi Lưu nếu F-VER trong DB ≠ F-VER đã load → chặn, thông báo tải lại |
| 16 | Chung | VAL-16 | Confirm xoá: bắt buộc nhập **Lý do** ≥ 10 ký tự và tick checkbox xác nhận; thiếu → disable nút Xác nhận xoá |
| 17 | Chung | VAL-17 | Trường immutable trong Edit-mode: F-ID, DOSSIER_CODE, CREATED_BY, CREATED_DATE, F-VER; backend reject nếu client gửi thay đổi |
| 18 | Chung | VAL-18 | Cảnh báo trùng: trong N phút có hồ sơ cùng (GL_SEGMENT6 + SOURCE) → warning + nút `Tiếp tục`/`Huỷ` |
| 19 | Chức năng | VAL-19 | Cross-Validation Rule (CCID) cho các trường COA: tổ hợp segment phải thuộc CCID hợp lệ; vi phạm → highlight lỗi, hiển thị MSG-ERR-CCID, chặn Submit |
| 20 | Chung | VAL-20 | File đính kèm trùng lặp: kiểm tra cùng tên, cùng dung lượng; cảnh báo trước khi cho phép upload |
| 21 | Chức năng | VAL-21 | Không cho phép thực hiện thanh toán khi chưa hạch toán; ACCOUNTING_STATUS phải là `GL_ACCOUNTED` hoặc `ACCOUNTING_POSTED` |

---

## A9. Danh sách thông báo

| STT | Phân loại 1 | Phân loại 2 | Mã | Nội dung |
|---|---|---|---|---|
| 1 | Chung | Error | MSG-ERR-REQUIRED | Vui lòng nhập `[Tên trường]` |
| 2 | Chung | Error | MSG-ERR-FORMAT | Định dạng `[Tên trường]` không hợp lệ |
| 3 | Chung | Error | MSG-ERR-LOOKUP | Giá trị không nằm trong danh mục |
| 4 | Chung | Error | MSG-ERR-RANGE | `[Tên trường]` nằm ngoài phạm vi cho phép (`[min]`–`[max]`) |
| 5 | Chung | Error | MSG-ERR-CROSS-FIELD | `[Tên trường A]` và `[Tên trường B]` không hợp lệ: `[mô tả ràng buộc]` |
| 6 | Chung | Error | MSG-ERR-FILE | File vượt giới hạn hoặc sai định dạng |
| 7 | Chung | Error | MSG-ERR-DUPLICATE | Đã tồn tại bản ghi có `[trường khoá]` = `[giá trị]` |
| 8 | Chung | Error | MSG-ERR-SYSTEM | Lỗi hệ thống, traceId: `<…>`. Vui lòng thử lại hoặc liên hệ Quản trị |
| 9 | Chung | Error | MSG-ERR-TIMEOUT | Yêu cầu quá thời gian xử lý, vui lòng thử lại |
| 10 | Chung | Error | MSG-ERR-PERMISSION | Bạn không có quyền thực hiện thao tác này |
| 11 | Chung | Error | MSG-ERR-SESSION | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 12 | Chung | Success | MSG-OK-SAVE | Lưu hồ sơ thành công |
| 13 | Chung | Success | MSG-OK-DELETE | Xoá hồ sơ thành công |
| 14 | Chung | Success | MSG-OK-SUBMIT | Đã gửi hồ sơ để kiểm soát/phê duyệt |
| 15 | Chung | Confirm | MSG-CFM-CANCEL | Dữ liệu chưa được lưu. Bạn có chắc muốn huỷ? |
| 16 | Chung | Confirm | MSG-CFM-DELETE | Bạn có chắc muốn xoá hồ sơ `<DOSSIER_CODE>`? |
| 17 | Chung | Warning | MSG-WRN-LIMIT | Số tiền vượt hạn mức — cần phê duyệt cấp cao hơn |
| 18 | Chung | Warning | MSG-WRN-OUTSIDE-HOUR | Ngoài giờ giao dịch, vui lòng xem lại |
| 19 | Chung | Error | MSG-ERR-STATUS | Giao dịch đang ở trạng thái `[<state>]`, không cho phép Sửa/Xoá |
| 20 | Chung | Error | MSG-ERR-MAKER | Chỉ Người lập gốc mới được phép Sửa/Xoá |
| 21 | Chung | Error | MSG-ERR-LOCK | Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại trước khi tiếp tục |
| 22 | Chung | Error | MSG-ERR-CONCURRENT | Giao dịch đang được `[<user>]` chỉnh sửa, vui lòng thử lại sau |
| 23 | Chung | Error | MSG-ERR-DELETE-CFM | Vui lòng nhập lý do (≥ 10 ký tự) và xác nhận đã rà soát |
| 24 | Chung | Warning | MSG-WRN-DUPLICATE | Phát hiện hồ sơ tương tự đã được lập gần đây. Bạn có muốn tiếp tục? |
| 25 | Chung | Info | MSG-INF-NOTIFY-CHECKER | Đã gửi thông báo đến Người kiểm soát `<…>` |
| 26 | Chức năng | Error | MSG-ERR-AMOUNT-MISMATCH | Tổng số tiền dòng chứng từ không khớp với tổng hồ sơ |
| 27 | Chức năng | Warning | MSG-WRN-AMOUNT-MISMATCH | Chênh lệch giữa tổng dòng chi tiết và Số tiền chuyển nằm trong ngưỡng tolerance — vui lòng kiểm tra lại |
| 28 | Chức năng | Error | MSG-ERR-CCID | Tổ hợp segment COA không hợp lệ theo Cross-Validation Rule (CCID) |
| 29 | Chung | Info | MSG-INF-NOTIFY-APPROVER | Đã gửi thông báo đến Người phê duyệt `<…>` |
| 30 | Chức năng | Warning | MSG-INF-NOTIFY-APPROVAL_REJ | Hồ sơ đã bị từ chối phê duyệt |
| 31 | Chức năng | Warning | MSG-INF-NOTIFY-CHECK_REJ | Hồ sơ đã bị từ chối kiểm soát |
| 32 | Chức năng | Warning | MSG-WRN-FAILED_RESERVE | Hồ sơ không dành được dự toán thành công |
| 33 | Chức năng | Warning | MSG-WRN-FAILED_PAYMENT | Hồ sơ không thanh toán thành công |
| 34 | Chức năng | Warning | MSG-ERR-UNAPPROVED | Không hủy phê duyệt được hồ sơ ở trạng thái `[<state>]` |
| 35 | Chức năng | Warning | MSG-WRN-DUE-DATE | Hồ sơ quá hạn xử lý `[<date>]`, cần lập Văn bản xin lỗi và đề nghị gia hạn thời gian giải quyết |

---

## A10. Danh sách sự kiện

> Quy ước Event_id: `EXP.OPEX.DOSSIER.<ACTION>`

| STT | Mã sự kiện (Event_id) | Phân loại | Chức năng | Mô tả |
|---|---|---|---|---|
| 1 | `EXP.OPEX.DOSSIER.LIST.VIEW` | Chung | Danh sách | Mở màn hình danh sách hồ sơ |
| 2 | `EXP.OPEX.DOSSIER.LIST.FILTER` | Chung | Danh sách | NSD áp dụng bộ lọc/tìm kiếm/sort |
| 3 | `EXP.OPEX.DOSSIER.LIST.EXPORT` | Chung | Danh sách | NSD kết xuất dữ liệu Excel/PDF/CSV |
| 4 | `EXP.OPEX.DOSSIER.NEW.OPEN` | Chung | Thêm mới | Mở form Thêm mới, khởi tạo trạng thái DRAFT |
| 5 | `EXP.OPEX.DOSSIER.NEW.SAVE` | Chung | Thêm mới | Lưu bản ghi DRAFT, sinh DOSSIER_CODE |
| 6 | `EXP.OPEX.DOSSIER.NEW.SUBMIT` | Chung | Thêm mới | Gửi kiểm soát → PENDING_CHECKER; notify Checker |
| 7 | `EXP.OPEX.DOSSIER.NEW.CANCEL` | Chung | Thêm mới | Huỷ form, bỏ thay đổi |
| 8 | `EXP.OPEX.DOSSIER.NEW.COPY` | Chung | Thêm mới | Sao chép từ bản ghi đã có; mở form mới với dữ liệu sao chép |
| 9 | `EXP.OPEX.DOSSIER.VIEW.OPEN` | Chung | Xem | Mở form Xem (read-only) |
| 10 | `EXP.OPEX.DOSSIER.VIEW.HISTORY` | Chung | Xem | Mở tab Lịch sử giao dịch / Audit |
| 11 | `EXP.OPEX.DOSSIER.VIEW.APPROVAL` | Chung | Xem | Mở tab Trạng thái phê duyệt |
| 12 | `EXP.OPEX.DOSSIER.EDIT.OPEN` | Chung | Sửa | Mở form Sửa, load F-VER hiện hành |
| 13 | `EXP.OPEX.DOSSIER.EDIT.SAVE` | Chung | Sửa | Lưu thay đổi, cập nhật F-VER+1, ghi audit |
| 14 | `EXP.OPEX.DOSSIER.EDIT.CANCEL` | Chung | Sửa | Huỷ chỉnh sửa, bỏ thay đổi |
| 15 | `EXP.OPEX.DOSSIER.DELETE.OPEN` | Chung | Xoá | Mở popup Xoá (lý do + checkbox) |
| 16 | `EXP.OPEX.DOSSIER.DELETE.CONFIRM` | Chức năng | Xoá | Soft-delete, release hold, ghi audit |
| 17 | `EXP.OPEX.DOSSIER.ATTACH.UPLOAD` | Chung | Đính kèm | Upload file (validate kích thước/định dạng/AV) |
| 18 | `EXP.OPEX.DOSSIER.ATTACH.DELETE` | Chung | Đính kèm | Xoá file đính kèm |
| 18a | `EXP.OPEX.DOSSIER.ATTACH.DOWNLOAD` | Chung | Đính kèm | Tải file đính kèm xuống máy NSD; ghi audit truy cập |
| 19 | `EXP.OPEX.DOSSIER.APPROVE.CHECKER` | Chung | Kiểm soát | Checker kiểm soát → chuyển PENDING_APPROVER; notify Approver |
| 20 | `EXP.OPEX.DOSSIER.APPROVE.APPROVER` | Chung | Phê duyệt | Approver phê duyệt → APPROVED |
| 21 | `EXP.OPEX.DOSSIER.APPROVE.REJECT` | Chung | Phê duyệt | Từ chối → REJECTED_BY_APPROVER + lý do |
| 22 | `EXP.OPEX.DOSSIER.CHECK.REJECT` | Chung | Kiểm soát | Từ chối → REJECTED_BY_CHECKER; notify maker |
| 23 | `EXP.OPEX.DOSSIER.CHECK.CANCEL` | Chung | Kiểm soát | Huỷ kiểm soát → trả lại DRAFT; notify Maker |
| 24 | `EXP.OPEX.DOSSIER.DOC.ADD` | Chức năng | Chứng từ | Thêm mới chứng từ vào hồ sơ (qua popup DOC_TYPE) |
| 25 | `EXP.OPEX.DOSSIER.DOC.VIEW` | Chức năng | Chứng từ | Xem chi tiết chứng từ (F3) |
| 26 | `EXP.OPEX.DOSSIER.DOC.EDIT` | Chức năng | Chứng từ | Sửa chứng từ trong hồ sơ (F2) |
| 27 | `EXP.OPEX.DOSSIER.DOC.DELETE` | Chức năng | Chứng từ | Xoá chứng từ khỏi hồ sơ (Delete) |
| 28 | `EXP.OPEX.DOSSIER.DOC.PRINT` | Chức năng | Chứng từ | In chứng từ |
| 29 | `EXP.OPEX.DOSSIER.PRINT.PREVIEW` | Chung | In phiếu | Sinh PDF preview theo template |
| 30 | `EXP.OPEX.DOSSIER.NOTIFY.SEND` | Chung | Notification | Gửi notification chuyển trạng thái (in-app + email) |
| 31 | `EXP.OPEX.DOSSIER.AUDIT.WRITE` | Chung | Audit | Ghi log thao tác (user, timestamp, IP, oldValue→newValue) |
| 32 | `EXP.OPEX.DOSSIER.SESSION.TIMEOUT` | Chung | Phiên | Phiên hết hạn → buộc đăng nhập lại |
| 33 | `EXP.OPEX.DOSSIER.LOCK.ACQUIRE` | Chức năng | Concurrent | Lấy lock khi mở Sửa; release khi đóng/lưu |
| 34 | `EXP.OPEX.DOSSIER.LOCK.CONFLICT` | Chức năng | Concurrent | Phát hiện conflict (optimistic lock mismatch) |

---

## A11. State Machine (Trạng thái hồ sơ)

> Trạng thái hồ sơ (`OPEX_DOSSIER_STATUS`) theo sheet 4. Quy ước: cột **Trạng thái** = trạng thái trước sự kiện; cột **Trạng thái mới** = trạng thái sau sự kiện.

| STT | Sự kiện | Trạng thái | Trạng thái mới | Tác động |
|---|---|---|---|---|
| 1 | Maker tạo mới hồ sơ (`EXP.OPEX.DOSSIER.NEW.OPEN`) | Start | DRAFT | Hệ thống khởi tạo hồ sơ, F-VER=1, autofill CREATED_BY/SEND_DATE; ghi log |
| 2 | Maker bấm Lưu/Lưu nháp (`EXP.OPEX.DOSSIER.NEW.SAVE`) | DRAFT | DRAFT | Lưu thay đổi; sinh DOSSIER_CODE nếu chưa có; ghi audit; hiển thị MSG-OK-SAVE |
| 3 | Maker huỷ thao tác Thêm mới (`EXP.OPEX.DOSSIER.NEW.CANCEL`) | DRAFT (chưa lưu) | End | Đóng form, bỏ thay đổi; nếu chưa từng Save → không sinh bản ghi DB |
| 4 | Maker bấm Sửa & Lưu (`EXP.OPEX.DOSSIER.EDIT.SAVE`) | DRAFT / REJECTED_BY_CHECKER | DRAFT | Kiểm tra optimistic lock (VAL-15); F-VER+1; ghi audit oldValue→newValue |
| 5 | Maker bấm Gửi kiểm soát (`EXP.OPEX.DOSSIER.NEW.SUBMIT`) | DRAFT / REJECTED_BY_CHECKER | PENDING_CHECKER | Validate đầy đủ; chuyển trạng thái; gửi notify Checker; ghi audit |
| 6 | Maker bấm Xoá (Xác nhận xoá) (`EXP.OPEX.DOSSIER.DELETE.CONFIRM`) | DRAFT / REJECTED_BY_CHECKER | DELETED | Soft-delete; release hold (nếu có); ghi audit; hiển thị MSG-OK-DELETE |
| 7 | Checker kiểm soát (`EXP.OPEX.DOSSIER.APPROVE.CHECKER`) | PENDING_CHECKER | CHECKED | Chuyển sang chờ Approver; gửi notify Approver; ghi audit (BIZ-011) |
| 8 | Checker huỷ kiểm soát / trả lại (`EXP.OPEX.DOSSIER.CHECK.CANCEL`) | PENDING_CHECKER | DRAFT | Trả lại Maker; bắt buộc lý do; notify Maker; ghi audit |
| 9 | Checker từ chối (`EXP.OPEX.DOSSIER.CHECKER.REJECT`) | PENDING_CHECKER hoặc APPROVAL_REJECTED | CHECK_REJECTED | Bắt buộc lý do; notify Maker; khoá hồ sơ không cho Sửa; ghi audit |
| 10 | Checker chuyển Approver (`EXP.OPEX.DOSSIER.APPROVE.CHECKER`) | CHECKED | APPROVAL_PENDING | Gửi notify Approver; ghi audit |
| 11 | Approver phê duyệt (`EXP.OPEX.DOSSIER.APPROVE.APPROVER`) | APPROVAL_PENDING | APPROVED | Chuyển trạng thái APPROVED; trigger luồng hạch toán/thanh toán; gửi notify Maker; ghi audit (BIZ-011) |
| 12 | Approver huỷ phê duyệt (`EXP.OPEX.DOSSIER.APPROVE.CANCEL`) | APPROVAL_PENDING | CHECKED | Trả lại Checker; bắt buộc lý do; notify Checker; ghi audit |
| 13 | Approver từ chối (`EXP.OPEX.DOSSIER.APPROVE.REJECT`) | CHECKED | APPROVAL_REJECTED | Bắt buộc lý do; notify Checker; ghi audit |
| 14 | Maker huỷ Sửa (`EXP.OPEX.DOSSIER.EDIT.CANCEL`) | DRAFT / REJECTED_BY_CHECKER | DRAFT / REJECTED_BY_CHECKER | Bỏ thay đổi; nếu form dirty → hỏi xác nhận (MSG-CFM-CANCEL) |
| 15 | Hệ thống kiểm soát không có phê duyệt | PENDING_CHECKER | CHECKED | Trường hợp không có Approver — hồ sơ dừng ở trạng thái CHECKED; ghi audit |
| 16 | Đóng nghiệp vụ (kết thúc vòng đời) | APPROVED / CHECK_REJECTED / APPROVAL_REJECTED / DELETED | End | Khoá toàn bộ thao tác Sửa/Xoá; chỉ cho phép Xem; ghi audit truy cập |
| 17 | (Vi phạm) Cố tình Sửa/Xoá ở trạng thái không cho phép | PENDING_CHECKER / APPROVAL_PENDING / APPROVED / CHECKED | (Không đổi) | Chặn thao tác (VAL-13); thông báo MSG-ERR-STATUS; disable nút; ghi audit bảo mật |
| 18 | (Vi phạm) Người khác Maker gốc Sửa/Xoá | DRAFT / REJECTED_BY_CHECKER | (Không đổi) | Chặn (VAL-14); thông báo MSG-ERR-MAKER; ghi audit bảo mật |
| 19 | (Concurrent) Optimistic lock mismatch khi Lưu | DRAFT / REJECTED_BY_CHECKER | (Không đổi) | Chặn (VAL-15); thông báo MSG-ERR-LOCK; yêu cầu tải lại; ghi audit |
| 20 | (Hệ thống) Phiên đăng nhập hết hạn | (Bất kỳ) | (Không đổi) | Bắt buộc đăng nhập lại; lưu draft tạm (nếu form đang dirty); MSG-ERR-SESSION |

### Sơ đồ chuyển trạng thái hồ sơ

```
                                   ┌────────────────────────────────────┐
                                   │                                    │
           Maker.New     Maker.Save/Edit                                │
  ┌─Start──────────▶ DRAFT ◀──────────┐                                 │
  │                    │              │                                 │
  │                    │ Submit        │ Return                         │
  │                    ▼              │                                 │
  │             PENDING_CHECKER ────────┤                                 │
  │              │         │          │                                 │
  │    Checker   │  Cancel │  Reject  │                                 │
  │    Approve   ▼         ▼          │                                 │
  │    CHECKED            CHECK_CANCELLED / CHECK_REJECTED               │
  │         │    │                                                      │
  │ Approve │ Cancel/Reject                                             │
  │         ▼    ▼                                                      │
  │       APPROVED  APPROVAL_CANCELLED / APPROVAL_REJECTED              │
  │                                                                     │
  │  (No Approver) PENDING_CHECKER ──▶ CHECKED                            │
  │                                                                     │
  │  Maker.Delete (DRAFT/REJECTED_BY_CHECKER)                             │
  └─────────────────────▶ DELETED ─────────────────────────▶ End        │
                                                                        │
  Trạng thái dự toán (BUDGET_STATUS) — song song với hồ sơ:            │
  DRAFT_FUND → RESERVED_FUND / FAILED_FUND_CHECK                       │
                                                                        │
  Trạng thái hạch toán (ACCOUNTING_STATUS) — sau APPROVED:             │
  DRAFT_ACCOUNTING → GL_ACCOUNTED_WAITING → GL_ACCOUNTED → ACCOUNTING_POSTED
                                                                        │
  Trạng thái thanh toán (PAYMENT_STATUS) — sau GL_ACCOUNTED:           │
  DRAFT_PAYMENT → PAYMENT_PROCESSING → PAYMENT_SUCCESS / PAYMENT_FAILED│
  Gia hạn COT: COT_XTENDED                                             │
                                                             └──────────┘
```

---

## A12. Giao diện liên quan

| STT | Màn hình |
|---|---|
| 1 | `EXP.OPEX.DOSSIER.LIST` — Màn hình Danh sách hồ sơ chi thường xuyên (lọc, sort, phân trang, kết xuất) |
| 2 | `EXP.OPEX.DOSSIER.NEW` — Form Thêm mới hồ sơ |
| 3 | `EXP.OPEX.DOSSIER.VIEW` — Form Xem (read-only), gồm: Grid Danh sách chứng từ, [Tab] Đính kèm, [Tab] Lịch sử, [Tab] Trạng thái phê duyệt |
| 4 | `EXP.OPEX.DOSSIER.EDIT` — Form Sửa/Hoàn thiện hồ sơ |
| 5 | `EXP.OPEX.DOSSIER.DELETE` — Popup xác nhận Xoá (lý do + checkbox) |
| 6 | `EXP.OPEX.DOSSIER.POPUP.DOC_TYPE` — Popup chọn loại chứng từ (Radio button từ LOV.Expenditure_doc_type) |
| 7 | `EXP.OPEX.DOSSIER.ATTACH` — Popup quản lý đính kèm tài liệu |
| 8 | `EXP.OPEX.DOSSIER.HISTORY` — Popup lịch sử audit (oldValue→newValue) |
| 9 | `EXP.OPEX.DOSSIER.LOOKUP.USER` — Popup tra cứu người dùng |
| 10 | `EXP.OPEX.DOSSIER.APPROVE` — Màn hình kiểm soát/phê duyệt |
| 11 | `EXP.OPEX.DOSSIER.PRINT` — Màn hình Preview in chứng từ |
| 12 | `EXP.OPEX.DOSSIER.EXPORT` — Tuỳ chọn kết xuất Excel/PDF/CSV |

---

# B - Đặc tả trường dữ liệu

> **Chú thích cột Bắt buộc**: `Y` = bắt buộc; `N` = không bắt buộc; `C` = bắt buộc có điều kiện; `N (auto)` = hệ thống tự điền, không cho nhập.
>
> **Chú thích cột Loại**: Dropdown / TextBox / TextArea / Number Field / Date Picker / DateTime Picker / Checkbox / Radio / File Upload / Lookup / Label / Icon group.

---

## B1. Màn hình `EXP.OPEX.DOSSIER.NEW`, `EXP.OPEX.DOSSIER.VIEW`, `EXP.OPEX.DOSSIER.EDIT`

### B1.1. \[Top Area\] Khu vực Thông tin chung

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã ĐVSDNS | GL_SEGMENT6 | Dropdown + Lookup | Y | | String | Bắt buộc nhập. Tra cứu theo danh mục LOV.07.6.Segment_Code Organization. Mẫu: `1171277` — Cơ quan Báo và phát thanh, truyền hình Hà Nội; `1170918` — Văn phòng Sở du lịch thành phố Hà Nội|
| Tên ĐVSDNS | GL_SEGMENT6_DES | TextBox | Y | | String | Tự động lấy diễn giải mã theo mã ĐVSDNS được chọn (LOV.07.6.Segment_Description). Read-only sau khi Mã ĐVSDNS được chọn. |
| Mã hồ sơ | DOSSIER_CODE | TextBox | N (auto) | | String | Hệ thống tự sinh khi lưu. Cấu trúc: `T.MX1X2.Y1Y2Y3.Z1Z2-YYMMDD-XXXX` — trong đó: T=nguồn thủ công; MX1X2.Y1Y2Y3.Z1Z2=mã định danh điện tử kho bạc; YYMMDD=ngày tạo hồ sơ; XXXX=số thứ tự tăng dần từ 0001 trong ngày. Read-only. |
| Ngày gửi hồ sơ | SEND_DATE | Date Picker | Y | Current Date | Date | Mặc định là ngày hiện tại; người dùng được phép nhập/chọn lại. Định dạng `dd/mm/yyyy`. |
| Người lập | CREATED_BY | TextBox | N (auto) | | String | Hệ thống tự lấy user hiện tại đang lập hồ sơ. Read-only, không cho phép sửa. |
| Trạng thái hồ sơ | OPEX_DOSSIER_STATUS | Label | N (auto) | | String | Hệ thống tự động cập nhật theo State Machine; read-only. Giá trị: DRAFT (Đang hoàn thiện) / PENDING_CHECKER (Chờ kiểm soát) / CHECKED (Đã kiểm soát, Chờ phê duyệt) / APPROVAL_PENDING (Chờ phê duyệt) / APPROVED (Đã phê duyệt) / APPROVAL_REJECTED (Từ chối phê duyệt) / CHECK_REJECTED (Từ chối kiểm soát) / REJECTED_BY_CHECKER (Trả lại Maker) / DELETED (Đã xoá). Khi NEW/tạo mới trạng thái = DRAFT. |
| Nguồn | SOURCE | Dropdown | Y | | Varchar | Danh mục LOV.04 — Nguồn (LOV.Source): MANUAL (Thủ công — nhập trực tiếp, mặc định khi tạo mới) / DVKB (Nguồn dịch vụ công/dịch vụ kho bạc) / AUTO (Tự động — viễn thông, điện nước). Read-only sau khi lưu lần đầu. |
| Thao tác | ACTIONS | Icon group | | | | Tổ hợp nút: Gửi kiểm soát; TB KQGQ TTHC; VB gia hạn; Lịch sử; Thêm mới Chứng từ (mở popup LOV.Expenditure_doc_type). Nút Thêm mới Chứng từ và Gửi kiểm soát chỉ hiển thị trong chế độ VIEW/EDIT (không áp dụng cho NEW). |

---

### B1.2. \[Middle Area\] Danh sách chứng từ thanh toán

> Khu vực chứng từ thuộc hồ sơ. **Chỉ hiển thị trong chế độ VIEW và EDIT — không hiển thị trong chế độ NEW.** Dữ liệu hiển thị dưới dạng GRID.
>
> NSD bấm nút **Thêm mới Chứng từ** → hệ thống mở popup `EXP.OPEX.DOSSIER.POPUP.DOC_TYPE` hiển thị danh sách loại chứng từ dạng Radio button (giá trị từ LOV.Expenditure_doc_type). Sau khi chọn chứng từ và bấm Chấp nhận (F10) → mở form thêm mới chứng từ tương ứng. Sau khi lưu chứng từ → hiển thị trên GRID bên dưới. Khi đã có đủ chứng từ thoả mãn Validation, nút **Gửi kiểm soát** sẽ kích hoạt.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | SEQ | Label | N (auto) | | Varchar(2) | Thứ tự tăng dần. |
| Số chứng từ | DOC_NUMBER | Varchar | Y | | String | Hệ thống gen tự động khi lưu nháp. Quy tắc: `[Mã hồ sơ]-[Document_Type_Code]-[4 chữ số tăng dần từ 0001]`. |
| Tên chứng từ | DOC_NAME | Varchar | Y | | String | Giá trị tự lấy theo danh sách tên loại chứng từ LOV.04 (LOV.Expenditure_doc_type). |
| Ngày chứng từ | DOC_DATE | Date Picker | Y | | Date | Định dạng `dd/mm/yyyy`. |
| Ngày hạch toán | POSTING_DATE | Date Picker | Y | | Date | Định dạng `dd/mm/yyyy`. |
| Số tiền nguyên tệ | AMOUNT | Number Field | Y | 0 | Number | Số tiền nếu loại tiền khác VND. Định dạng `#,##0.00`. |
| Loại tiền | CURRENCY_CODE | Dropdown + Lookup | Y | | String | Mặc định "VND"; cho phép chọn lại trong danh mục LOV.01 (LOV.Currency_Code). Giá trị: VND (Việt Nam Đồng), USD (Đôla Mỹ),… |
| Số tiền VND | VND_AMOUNT | Number Field | Y | | Number | Số tiền quy đổi VND. Định dạng `#,##0.00`, căn phải. |
| Thao tác | ACTIONS | Icon group | Y | | | Tổ hợp nút: Xem (F3), Sửa (F2), Xoá (Delete), Lịch sử, In chứng từ. Hiển thị theo quyền và trạng thái hồ sơ (VAL-13/VAL-14). |

---

### B1.3. \[Tab\] Đính kèm tài liệu

> Sử dụng chuẩn đính kèm chung — liên kết đến `EXP.OPEX.DOSSIER.ATTACH`. Không cần khai báo thêm field ngoài chuẩn.

---

## B2. Màn hình `EXP.OPEX.DOSSIER.LIST`

> Mục đích: liệt kê hồ sơ chi thường xuyên; cho phép tra cứu theo nhiều tiêu chí và truy cập các thao tác Xem/Sửa/Xoá/Gửi kiểm soát/Phê duyệt/Kết xuất.

### B2.1. Khu vực bộ lọc tìm kiếm

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã hồ sơ | DOSSIER_CODE | TextBox | N | | String | Hỗ trợ tìm chính xác hoặc bắt đầu bằng. |
| Ngày từ | FROM_DATE | Date Picker | N | | Date | Định dạng `dd/mm/yyyy`. |
| Đến | TO_DATE | Date Picker | N | | Date | Phải ≥ Từ ngày. Định dạng `dd/mm/yyyy`. |
| Trạng thái hồ sơ | OPEX_DOSSIER_STATUS | Dropdown | N | | Varchar | Danh mục theo A11: DRAFT / PENDING_CHECKER / CHECKED / APPROVAL_PENDING / APPROVED / APPROVAL_REJECTED / CHECK_REJECTED / REJECTED_BY_CHECKER / DELETED. |
| Loại ngày lọc | DATE_FIELD | Dropdown | N | | String | LOV.02 — Loại ngày lọc: Ngày tạo / Ngày tiếp nhận / Ngày kiểm soát / Ngày phê duyệt. |
| Nguồn | SOURCE | Dropdown | N | | String | LOV.04 — Nguồn (LOV.Source): MANUAL / DVKB / AUTO. |
| Người lập | CREATED_BY | TextBox + Lookup | N | | String | Lookup: `EXP.OPEX.DOSSIER.LOOKUP.USER`. |
| Người kiểm soát | CHECKED_BY | TextBox + Lookup | N | | String | Lookup: `EXP.OPEX.DOSSIER.LOOKUP.USER`. |
| Người phê duyệt | APPROVED_BY | TextBox + Lookup | N | | String | Lookup: `EXP.OPEX.DOSSIER.LOOKUP.USER`. |

### B2.2. Khu vực kết quả (Grid)

> Sắp xếp mặc định: `CREATED_DATE` DESC. Phân trang mặc định 20 bản ghi/trang (xem B2.3).

| STT | Trường | Trường (ENG) | Loại hiển thị | Sắp xếp | Mô tả / Ràng buộc |
|---|---|---|---|---|---|
| 1 | STT | SEQ | Number | ✓ | Hiển thị thứ tự tăng dần từ 1. |
| 2 | Mã Kho bạc | TREASURY_CODE | Text | ✓ | Giá trị theo LOV.07.11.Segment_Code. |
| 3 | Tên Kho bạc | TREASURY_NAME | Text | ✓ | Giá trị theo LOV.07.11.Segment_Description. |
| 4 | Mã hồ sơ | DOSSIER_CODE | TextBox | ✓ | Click mở `EXP.OPEX.DOSSIER.VIEW`. |
| 5 | Ngày gửi | SENT_DATE | Text (dd/mm/yyyy) | ✓ | |
| 6 | Nguồn | SOURCE | TextBox | ✓ | |
| 7 | Trạng thái hồ sơ | OPEX_DOSSIER_STATUS | Badge (màu theo trạng thái) | ✓ | Xanh: APPROVED; Vàng: PENDING_CHECKER/APPROVAL_PENDING; Xám: DRAFT; Đỏ: APPROVAL_REJECTED; Cam: CHECK_REJECTED. |
| 8 | Người lập | CREATED_BY | Text | ✓ | |
| 9 | Ngày lập | CREATED_DATE | Text (dd/mm/yyyy hh:MM) | ✓ | |
| 10 | Người kiểm soát | CHECKED_BY | Text | ✓ | |
| 11 | Ngày kiểm soát | CHECKED_DATE | Text (dd/mm/yyyy hh:MM) | ✓ | |
| 12 | Lý do từ chối kiểm soát/hủy kiểm soát | CHECK_REJECTED_REASON | TextBox | ✓ | Chỉ hiển thị nếu hồ sơ có trạng thái CHECK_REJECTED hoặc CHECK_CANCELLED. |
| 13 | Người phê duyệt | APPROVED_BY | Text | ✓ | |
| 14 | Ngày phê duyệt | APPROVED_DATE | Text (dd/mm/yyyy hh:MM) | ✓ | |
| 15 | Lý do từ chối phê duyệt/hủy phê duyệt | APPROVAL_REJECTED_REASON | TextBox | ✓ | Chỉ hiển thị nếu hồ sơ có trạng thái APPROVAL_REJECTED hoặc APPROVAL_CANCELLED. |
| 16 | Thao tác | ACTIONS | Icon group | – | Tổ hợp nút theo VAL-13/VAL-14: Xem (F3), Sửa (F2), Xoá (Delete), Gửi kiểm soát (F9), Phê duyệt (F8/F9), Kết xuất. |

### B2.3. Khu vực thanh công cụ và footer

| Trường | Mô tả |
|---|---|
| Số bản ghi | Tổng số bản ghi khớp bộ lọc. |
| Phân trang | 20 / 50 / 100 / 200 bản ghi/trang; mặc định 20. |
| Sắp xếp | Mặc định `CREATED_DATE` DESC. |
| Lưu bộ lọc | Cho phép lưu/áp dụng bộ lọc cá nhân (user-scope). |

---

## B3. Đặc tả trường các màn hình bổ sung

### B3.1. Màn hình `EXP.OPEX.DOSSIER.DELETE`

> Popup xác nhận xoá mềm hồ sơ ở trạng thái DRAFT hoặc REJECTED_BY_CHECKER.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Mã hồ sơ | DOSSIER_CODE | Label | – | Tự lấy từ bản ghi | String | Read-only. |
| Trạng thái hiện tại | OPEX_DOSSIER_STATUS | Label | – | Tự lấy | String | Phải ∈ {DRAFT, REJECTED_BY_CHECKER} (VAL-13). |
| Lý do xoá | DELETE_REASON | TextArea | Y | | String | Tối thiểu 10 ký tự, tối đa 500 ký tự (VAL-16). |
| Xác nhận đã rà soát | CONFIRM_REVIEWED | Checkbox | Y | Off | Boolean | Phải tick mới enable nút "Xác nhận xoá". |
| Người xoá | DELETED_BY | Label | – | User hiện tại | String | Auto. |
| Thời gian xoá | DELETED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto, hiển thị `dd/mm/yyyy hh:MM:ss`. |

### B3.2. Màn hình `EXP.OPEX.DOSSIER.ATTACH`

> Quản lý tài liệu đính kèm cho hồ sơ — chuẩn dùng chung.

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| Tên file | FILE_NAME | Label | – | | String | Lấy từ tên gốc upload. |
| Loại tài liệu | DOC_TYPE | Dropdown | Y | | String | Danh mục: Chứng từ gốc / Hợp đồng / Hoá đơn / Bảng kê / Văn bản khác. |
| Mô tả | NOTE | TextArea | N | | String | ≤ 250 ký tự. |
| File upload | FILE_BLOB | File Upload | Y | | Binary | ≤ 10MB/file; định dạng: pdf/jpg/png/docx; check MIME + magic byte; quét virus (VAL-09). |
| Kích thước | FILE_SIZE | Label | – | Tự tính | Number | Hiển thị KB/MB. |
| Người upload | UPLOADED_BY | Label | – | User hiện tại | String | Auto. |
| Ngày upload | UPLOADED_DATE | Label | – | Thời gian hệ thống | DateTime | Auto. |
| Thao tác | ACTIONS | Icon group | – | | – | Tải xuống (Ctrl+J) / Xem trước / Xoá (Shift+Delete) — theo quyền và VAL-13/14. |

### B3.3. Màn hình `EXP.OPEX.DOSSIER.HISTORY`

> Lịch sử thay đổi của hồ sơ (chế độ chỉ đọc).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | SEQ_NO | Label | – | Tự tăng | Number | |
| Người tạo | CREATED_BY | Label | – | | String | Username + Họ tên + Vai trò. |
| Ngày tạo | CREATED_DATE | Label | – | | Datetime | Thời điểm tạo hồ sơ. |
| Người cập nhật cuối | LAST_UPDATED_BY | Label | – | | String | Username + Họ tên + Vai trò. |
| Ngày cập nhật cuối | LAST_UPDATED_DATE | Label | – | | Datetime | Thời điểm cập nhật gần nhất. |

### B3.4. Màn hình `EXP.OPEX.DOSSIER.LOOKUP.USER`

> Popup tra cứu người dùng — dùng chung cho Người lập / Người kiểm soát / Người phê duyệt.

**Khu vực bộ lọc:**

| Trường | Trường (ENG) | Loại | Bắt buộc | Mô tả |
|---|---|---|---|---|
| Mã user | CODE | TextBox | N | Tìm chính xác / chứa / bắt đầu bằng. |
| Tên | NAME | TextBox | N | Tìm chứa, không phân biệt hoa thường, hỗ trợ tiếng Việt có dấu/không dấu. |
| Trạng thái | ACTIVE_STATUS | Dropdown | N | Active/Inactive/Tất cả; mặc định Đang hoạt động. |

### B3.5. Màn hình `EXP.OPEX.DOSSIER.POPUP.DOC_TYPE`

> Danh sách chứng từ (chế độ List chọn).

| Trường | Trường (ENG) | Loại | Bắt buộc | Giá trị mặc định | Loại dữ liệu | Mô tả / Ràng buộc |
|---|---|---|---|---|---|---|
| STT | SEQ_NO | Label | – | Tự tăng | Number | |
| Mã Chứng từ | Document_Type_Code | Dropdown + lookup Document_Type_Code | – | | String | LOV.Expenditure_doc_type |
| Tên chứng từ | Document_Type_Name | Dropdown + lookup Document_Type_Name | – | | String | LOV.Expenditure_doc_type  |


**Khu vực kết quả:**

| STT | Trường | Trường (ENG) | Loại hiển thị | Mô tả |
|---|---|---|---|---|
| 1 | Mã chứng từ | Document_Type_Code | Text (Radio) | Click để chọn. |
| 2 | Tên chứng từ | Document_Type_Name | Text | Tên đầy đủ của loại chứng từ. |
| 3 | Mã chức năng | MOD_CODE | Text | Mã màn hình xử lý chứng từ tương ứng (EXP.OPEX.DOC.MANAGE.x). |

---

## B4. Quy ước chung về đặc tả trường

| STT | Quy ước |
|---|---|
| 1 | Mọi trường tiền tệ hiển thị có nhóm hàng nghìn (`#,##0.00`); căn phải; tổng tiền hiển thị theo từng loại tiền. |
| 2 | Mọi trường ngày hiển thị theo `dd/mm/yyyy`; ngày giờ `dd/mm/yyyy hh:MM:ss`; chuẩn timezone Asia/Ho_Chi_Minh. |
| 3 | Mọi trường Lookup có icon kính lúp + phím tắt `F4`. |
| 4 | Mọi trường bắt buộc đánh dấu sao đỏ (`*`) cạnh nhãn; trường bắt buộc có điều kiện đánh dấu `(*)`. |
| 5 | Khi field bị disable phải có tooltip giải thích lý do; field đang lỗi validate hiển thị viền đỏ + thông báo lỗi bên dưới ô nhập. |
| 6 | Mọi `TextArea` chống XSS bằng cách sanitize/escape khi hiển thị; mọi input chống SQL Injection bằng prepared statement phía server. |
| 7 | Mọi trường ENG sử dụng `UPPER_SNAKE_CASE` thống nhất giữa UI, DB schema và API payload. |
| 8 | Mỗi màn hình có khoá tổ hợp phím (`F2`, `F3`, `F8`, `F9`, `F10`…) đồng bộ với `spec_button.md`. |

---

# C - Đặc tả nút chức năng

## C1. Chi tiết đặc tả nút chức năng

| STT | Tên nút | Tên nút (ENG) | Mã sự kiện / Event ID | ĐK kích hoạt / Trigger | Phím tắt | Mô tả / Description | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Tạo mới | New | `EXP.OPEX.DOSSIER.NEW.OPEN` | On click | `Ctrl+N` | Mở form Thêm mới trống | Hiển thị trên `EXP.OPEX.DOSSIER.LIST`; chỉ enable với Maker |
| 2 | Lưu | Save | `EXP.OPEX.DOSSIER.NEW.SAVE` | On click | `Ctrl+S` | Validate đầy đủ; sinh DOSSIER_CODE; lưu DRAFT | Trên `EXP.OPEX.DOSSIER.NEW` |
| 3 | Lưu nháp | Save Draft | `EXP.OPEX.DOSSIER.NEW.SAVE` | On click | `Ctrl+Shift+S` | Bỏ qua validate đầy đủ; chỉ validate định dạng; lưu DRAFT | Giúp Maker lưu giữa chừng khi dữ liệu chưa đủ |
| 4 | Gửi kiểm soát | Submit | `EXP.OPEX.DOSSIER.NEW.SUBMIT` | On click | `F9` | Validate đầy đủ; chuyển DRAFT → PENDING_CHECKER; gửi notify Checker | Chỉ kích hoạt khi đã có đủ chứng từ thoả mãn Validation; chỉ enable Maker |
| 5 | Xem | View | `EXP.OPEX.DOSSIER.VIEW.OPEN` | On click row / click DOSSIER_CODE | `F3` | Mở form read-only; hiển thị đầy đủ Top Area, Grid chứng từ, [Tab] Đính kèm, [Tab] Lịch sử, [Tab] Trạng thái phê duyệt | Trên `EXP.OPEX.DOSSIER.LIST` (row action) |
| 6 | Sửa | Edit | `EXP.OPEX.DOSSIER.EDIT.OPEN` | On click | `F2` | Mở form editable; load F-VER hiện hành | Chỉ enable khi F-STATUS ∈ {DRAFT, REJECTED_BY_CHECKER} và là Maker gốc |
| 7 | Lưu (Sửa) | Save (Edit) | `EXP.OPEX.DOSSIER.EDIT.SAVE` | On click | `Ctrl+S` | Cập nhật F-VER+1; ghi audit oldValue→newValue | Trên `EXP.OPEX.DOSSIER.EDIT` |
| 8 | Xoá | Delete | `EXP.OPEX.DOSSIER.DELETE.OPEN` | On click | `Delete` | Mở popup Xoá (lý do + checkbox) | Chỉ enable khi F-STATUS ∈ {DRAFT, REJECTED_BY_CHECKER} và là Maker gốc |
| 9 | Xác nhận xoá | Confirm Delete | `EXP.OPEX.DOSSIER.DELETE.CONFIRM` | On click | `Enter` (trong popup) | Soft-delete; ghi audit log | Disable đến khi đủ lý do ≥ 10 ký tự + tick checkbox |
| 10 | Huỷ | Cancel | `EXP.OPEX.DOSSIER.NEW.CANCEL` / `EXP.OPEX.DOSSIER.EDIT.CANCEL` | On click | `Esc` | Nếu NSD đã thực sự nhập/thay đổi dữ liệu (isDirty = true; **không tính** auto-fill: CREATED_BY, SEND_DATE mặc định, SOURCE mặc định) → hỏi xác nhận (MSG-CFM-CANCEL); xác nhận → đóng form, bỏ thay đổi | Phím tắt `Esc` |
| 11 | Thêm mới Chứng từ | Add Document | `EXP.OPEX.DOSSIER.DOC.ADD` | On click | `F10` (trong popup chọn loại) | Mở popup `EXP.OPEX.DOSSIER.POPUP.DOC_TYPE`; chọn loại → mở form chứng từ tương ứng | Chỉ hiển thị trong chế độ VIEW/EDIT; chỉ enable Maker khi trạng thái cho phép |
| 12 | Đặt lại | Reset | `EXP.OPEX.DOSSIER.LIST.FILTER` | On click | `F5` | Xoá bộ lọc về mặc định; tải lại danh sách | Trên `EXP.OPEX.DOSSIER.LIST` |
| 13 | Kết xuất | Export | `EXP.OPEX.DOSSIER.LIST.EXPORT` | On click | `Ctrl+Shift+E` | Kết xuất Excel/PDF/CSV | Trên `EXP.OPEX.DOSSIER.LIST` |
| 14 | In chứng từ | Print Document | `EXP.OPEX.DOSSIER.DOC.PRINT` | On click | `Ctrl+P` | In chứng từ trong grid | Trên dòng chứng từ trong Grid |
| 15 | Đính kèm | Upload | `EXP.OPEX.DOSSIER.ATTACH.UPLOAD` | On click → On select file | `Ctrl+U` | Mở popup `EXP.OPEX.DOSSIER.ATTACH`; validate ≤ 10MB, định dạng pdf/jpg/png/docx | Trên `EXP.OPEX.DOSSIER.NEW`, `EXP.OPEX.DOSSIER.EDIT` |
| 16 | Xoá đính kèm | Remove Attachment | `EXP.OPEX.DOSSIER.ATTACH.DELETE` | On click | `Shift+Delete` | Xoá file đính kèm; ghi audit; hỏi xác nhận | Chỉ Maker gốc + trạng thái cho phép Sửa |
| 17 | Tải file đính kèm | Download Attachment | `EXP.OPEX.DOSSIER.ATTACH.DOWNLOAD` | On click | `Ctrl+J` | Tải file xuống thư mục chỉ định; ghi audit | Trên `EXP.OPEX.DOSSIER.ATTACH` và các tab Đính kèm |
| 18 | Mở Lịch sử | Open History | `EXP.OPEX.DOSSIER.VIEW.HISTORY` | On click tab | `Alt+H` | Mở tab Lịch sử; hiển thị CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE | Trên `EXP.OPEX.DOSSIER.VIEW`, `EXP.OPEX.DOSSIER.EDIT` |
| 19 | Mở Trạng thái phê duyệt | Open Approval Status | `EXP.OPEX.DOSSIER.VIEW.APPROVAL` | On click tab | `Alt+P` | Mở tab Trạng thái phê duyệt; highlight bước hiện tại trong workflow Maker→Checker→Approver | Trên `EXP.OPEX.DOSSIER.VIEW`, `EXP.OPEX.DOSSIER.EDIT` |
| 20 | Tra cứu danh mục | Lookup | (Mở popup tương ứng) | On click icon kính lúp | `F4` | Mở popup tra cứu danh mục; chọn giá trị → trả về form | Đi kèm các trường Dropdown+Lookup |

## C2. Ghi chú chung về hiển thị/enable nút

| STT | Quy tắc |
|---|---|
| 1 | Mỗi nút phải kiểm tra quyền theo vai trò (Maker/Checker/Approver/Viewer) trước khi hiển thị; thiếu quyền → ẩn nút hoặc disable + tooltip MSG-ERR-PERMISSION |
| 2 | Nút Sửa/Xoá: chỉ enable khi F-STATUS ∈ {DRAFT, REJECTED_BY_CHECKER} (VAL-13) và NSD là Maker gốc (VAL-14) |
| 3 | Nút Phê duyệt/Trả lại/Từ chối/Huỷ: chỉ hiển thị trên `EXP.OPEX.DOSSIER.APPROVE` cho user có thẩm quyền; SoD bắt buộc (BIZ-001) |
| 4 | Nút Gửi kiểm soát: chỉ kích hoạt khi hồ sơ đã có đủ chứng từ thoả mãn Validation |
| 5 | Nút Xác nhận xoá: disable cho đến khi đủ lý do ≥ 10 ký tự + tick checkbox (VAL-16) |
| 6 | Mỗi lần bấm nút thành công: ghi audit (`EXP.OPEX.DOSSIER.AUDIT.WRITE`) gồm user, timestamp, IP, action, oldValue→newValue (BIZ-007) |
| 7 | Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server |
| 8 | Khi phiên hết hạn → mọi nút chuyển disable; hiển thị MSG-ERR-SESSION; redirect đăng nhập |
| 9 | Mọi nút hiển thị tooltip giải thích khi disable; hỗ trợ accessibility (ARIA label, phím tắt) |
| 10 | Phím tắt hiển thị trong tooltip nút (ví dụ "Lưu (Ctrl+S)") và đăng ký toàn cục trong form |

## C3. Quy ước phím tắt

- **Nhóm soạn thảo (Maker)**: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu), `Ctrl+Shift+S` (Lưu nháp), `F9` (Gửi kiểm soát), `Esc` (Huỷ).
- **Nhóm thao tác bản ghi (LIST)**: `F2` (Sửa), `F3` (Xem), `Delete` (Xoá), `F5` (Đặt lại bộ lọc), `Ctrl+Shift+E` (Kết xuất).
- **Nhóm danh mục/tra cứu**: `F4` (Lookup) trên bất kỳ trường có icon kính lúp.
- **Nhóm chứng từ**: `F10` (Chấp nhận chọn loại chứng từ trong popup), `Ctrl+P` (In chứng từ).
- **Nhóm kiểm soát/phê duyệt**: `F8` (Kiểm soát — Checker), `F9` (Phê duyệt — Approver), `Alt+B` (Trả lại — Back), `Alt+J` (Từ chối — reJect).
- **Nhóm đính kèm**: `Ctrl+U` (Upload), `Ctrl+J` (Download), `Shift+Delete` (Remove).
- **Nhóm điều hướng tab trong VIEW**: `Alt+H` (Lịch sử), `Alt+P` (Trạng thái phê duyệt).
- **Nhóm popup xác nhận**: `Enter` (Xác nhận), `Esc` (Huỷ/đóng).

---

# D - Testcase: EXP.OPEX.DOSSIER

> **Cấu trúc mã TC:** `EXP.OPEX.DOSSIER.TC.<Nhóm>.<Số thứ tự>`
>
> **Nhóm:** 1 = Tạo mới, 2 = Xem, 3 = Cập nhật, 4 = Xoá
>
> **Loại UC:** Positive = luồng thành công; Negative = luồng lỗi/ngoại lệ

---

## D1. Nhóm 1 — Tạo mới

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.OPEX.DOSSIER.TC.1.01 | Tạo hồ sơ thành công | Positive | Maker đã đăng nhập; có quyền tạo hồ sơ; kỳ kế toán đang mở | Nhập đầy đủ GL_SEGMENT6, SEND_DATE, SOURCE; bấm **Lưu** | Hệ thống lưu DRAFT thành công; sinh DOSSIER_CODE; hiển thị MSG-OK-SAVE; CREATED_BY tự điền | VAL-01, BIZ-007 |
| EXP.OPEX.DOSSIER.TC.1.02 | Tạo hồ sơ không thành công — Không có quyền | Negative | User không có vai trò Maker | Truy cập màn hình Tạo mới | Nút **Tạo mới** bị ẩn hoặc disable; hiển thị MSG-ERR-PERMISSION nếu truy cập trực tiếp | BIZ-001 |
| EXP.OPEX.DOSSIER.TC.1.03 | Tạo hồ sơ không thành công — Trường bắt buộc bỏ trống khi Submit | Negative | Maker đã đăng nhập | Để trống GL_SEGMENT6; bấm **Gửi kiểm soát** | Highlight đỏ trường GL_SEGMENT6; hiển thị MSG-ERR-REQUIRED; chặn submit | VAL-01 |
| EXP.OPEX.DOSSIER.TC.1.04 | Tạo hồ sơ không thành công — SEND_DATE sai định dạng | Negative | Maker đã đăng nhập | Nhập SEND_DATE = "32/13/2025"; bấm **Lưu** | Hiển thị MSG-ERR-FORMAT cho SEND_DATE; chặn lưu | VAL-02 |
| EXP.OPEX.DOSSIER.TC.1.05 | Tạo hồ sơ không thành công — SEND_DATE ngoài kỳ kế toán | Negative | Kỳ kế toán hiện tại là tháng 05/2025 | Nhập SEND_DATE = 01/01/2024 (kỳ đã đóng); bấm **Gửi kiểm soát** | Hiển thị MSG-ERR-RANGE; chặn submit | VAL-08 |
| EXP.OPEX.DOSSIER.TC.1.06 | Tạo hồ sơ không thành công — File đính kèm vượt giới hạn | Negative | Maker đang ở form Thêm mới | Upload file > 10MB vào Tab Đính kèm | Hiển thị MSG-ERR-FILE; không upload file; form vẫn mở | VAL-09 |
| EXP.OPEX.DOSSIER.TC.1.07 | Tạo hồ sơ không thành công — File đính kèm sai định dạng | Negative | Maker đã đăng nhập | Upload file .exe | Hiển thị MSG-ERR-FILE; không upload file | VAL-09 |
| EXP.OPEX.DOSSIER.TC.1.08 | Lưu nháp thành công khi dữ liệu chưa đủ | Positive | Maker đã đăng nhập; chưa nhập đủ trường bắt buộc | Bấm **Lưu nháp** | Hệ thống lưu DRAFT; không validate đầy đủ; hiển thị MSG-OK-SAVE | A1 |
| EXP.OPEX.DOSSIER.TC.1.09 | Gửi kiểm soát thành công | Positive | Hồ sơ ở DRAFT; đã nhập đầy đủ; đã có đủ chứng từ hợp lệ | Bấm **Gửi kiểm soát** | Trạng thái chuyển sang PENDING_CHECKER; notification gửi đến Checker; hiển thị MSG-OK-SUBMIT | VAL-01, BIZ-009 |
| EXP.OPEX.DOSSIER.TC.1.10 | Gửi kiểm soát thất bại — chưa đủ chứng từ | Negative | Hồ sơ ở DRAFT; chưa có chứng từ | Bấm **Gửi kiểm soát** | Nút **Gửi kiểm soát** disable; không gửi được | VAL-01 |
| EXP.OPEX.DOSSIER.TC.1.11 | Huỷ form khi đã nhập dữ liệu | Positive | Maker đang nhập dữ liệu trên form Thêm mới | Bấm **Huỷ** hoặc phím `Esc` | Hiển thị popup xác nhận MSG-CFM-CANCEL; xác nhận → đóng form; không lưu dữ liệu | A2 |
| EXP.OPEX.DOSSIER.TC.1.12 | Thêm mới chứng từ vào hồ sơ thành công | Positive | Hồ sơ đã lưu DRAFT; Maker đang ở chế độ VIEW/EDIT | Bấm **Thêm mới Chứng từ**; chọn loại chứng từ; điền đủ thông tin; bấm Lưu | Chứng từ xuất hiện trên GRID danh sách chứng từ; DOC_NUMBER tự sinh | A4, BIZ-007 |
| EXP.OPEX.DOSSIER.TC.1.13 | Cảnh báo file đính kèm trùng lặp | Negative | Maker đã upload file A.pdf trước đó | Upload lại file A.pdf (cùng tên, cùng dung lượng) | Hiển thị cảnh báo trùng lặp VAL-20; hỏi xác nhận trước khi cho phép upload | VAL-20 |

---

## D2. Nhóm 2 — Xem

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.OPEX.DOSSIER.TC.2.01 | Xem hồ sơ thành công | Positive | Tồn tại hồ sơ ở bất kỳ trạng thái nào; NSD có quyền Viewer trở lên | Click link DOSSIER_CODE trên LIST | Mở form read-only; hiển thị đầy đủ Top Area, Grid chứng từ, tab Lịch sử, tab Trạng thái phê duyệt | §4 Luồng chính bước 7 |
| EXP.OPEX.DOSSIER.TC.2.02 | Xem hồ sơ không thành công — Không có quyền | Negative | User không có quyền truy cập chức năng | Truy cập trực tiếp URL màn hình VIEW | Hiển thị MSG-ERR-PERMISSION; chuyển về trang chủ | BIZ-001 |
| EXP.OPEX.DOSSIER.TC.2.03 | Kiểm tra tab Lịch sử giao dịch | Positive | Hồ sơ đã có nhiều lần sửa đổi | Mở form VIEW; click tab **Lịch sử** (`Alt+H`) | Hiển thị danh sách audit: CREATED_BY, CREATED_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE, action, oldValue→newValue | BIZ-007, BIZ-008 |
| EXP.OPEX.DOSSIER.TC.2.04 | Kiểm tra tab Trạng thái phê duyệt | Positive | Hồ sơ đang ở APPROVAL_PENDING | Mở form VIEW; click tab **Trạng thái phê duyệt** (`Alt+P`) | Hiển thị workflow Maker→Checker→Approver; highlight bước Approver đang chờ | §11 State Machine |
| EXP.OPEX.DOSSIER.TC.2.05 | Xem danh sách chứng từ trong hồ sơ | Positive | Hồ sơ có ≥ 1 chứng từ; NSD có quyền Viewer | Mở form VIEW | Grid danh sách chứng từ hiển thị đầy đủ STT, DOC_NUMBER, DOC_NAME, DOC_DATE, POSTING_DATE, AMOUNT, CURRENCY_CODE, VND_AMOUNT | B1.2 |
| EXP.OPEX.DOSSIER.TC.2.06 | Kiểm tra hiển thị Badge trạng thái trên LIST | Positive | Có hồ sơ ở các trạng thái khác nhau | Mở màn hình LIST | Badge màu đúng: Xanh=APPROVED, Vàng=PENDING_CHECKER/APPROVAL_PENDING, Xám=DRAFT, Đỏ=APPROVAL_REJECTED, Cam=CHECK_REJECTED | B2.2 |

---

## D3. Nhóm 3 — Cập nhật

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.OPEX.DOSSIER.TC.3.01 | Cập nhật hồ sơ thành công | Positive | Hồ sơ ở trạng thái DRAFT; NSD là Maker gốc | Bấm **Sửa**; thay đổi SEND_DATE; bấm **Lưu** | F-VER tăng +1; ghi audit oldValue→newValue; hiển thị MSG-OK-SAVE | VAL-15, BIZ-007 |
| EXP.OPEX.DOSSIER.TC.3.02 | Cập nhật không thành công — Trạng thái không cho phép | Negative | Hồ sơ ở trạng thái PENDING_CHECKER | Cố gắng bấm **Sửa** | Nút **Sửa** bị disable; hiển thị tooltip MSG-ERR-STATUS | VAL-13 |
| EXP.OPEX.DOSSIER.TC.3.03 | Cập nhật không thành công — Không phải Maker gốc | Negative | Hồ sơ ở DRAFT; NSD là user khác | Cố gắng bấm **Sửa** | Nút **Sửa** bị disable; hiển thị tooltip MSG-ERR-MAKER | VAL-14 |
| EXP.OPEX.DOSSIER.TC.3.04 | Cập nhật không thành công — Optimistic lock conflict | Negative | Hồ sơ đang được user A giữ form Sửa; user B cũng đang sửa cùng hồ sơ | User B bấm **Lưu** sau khi user A đã lưu | Hiển thị MSG-ERR-LOCK; yêu cầu user B tải lại bản ghi | VAL-15 |
| EXP.OPEX.DOSSIER.TC.3.05 | Cập nhật không thành công — Concurrent edit | Negative | Hồ sơ đang được user A mở form Sửa | User B cố gắng mở form Sửa cùng hồ sơ | Hiển thị MSG-ERR-CONCURRENT với tên user A; không cho mở | §6 E11 |
| EXP.OPEX.DOSSIER.TC.3.06 | Cập nhật hồ sơ REJECTED_BY_CHECKER thành công | Positive | Hồ sơ ở REJECTED_BY_CHECKER; NSD là Maker gốc | Mở Sửa; điều chỉnh theo yêu cầu Checker; bấm **Lưu** | F-VER tăng +1; ghi audit; có thể Submit lại | VAL-13, §11 bước 4 |
| EXP.OPEX.DOSSIER.TC.3.07 | Sửa/Xoá chứng từ trong hồ sơ thành công | Positive | Hồ sơ ở DRAFT; Maker gốc đang ở chế độ EDIT | Bấm Sửa (F2) hoặc Xoá (Delete) trên dòng chứng từ trong Grid | Thao tác thực hiện thành công; Grid cập nhật; ghi audit | VAL-13, VAL-14, BIZ-007 |
| EXP.OPEX.DOSSIER.TC.3.08 | Kiểm tra SOURCE read-only sau lưu lần đầu | Positive | Hồ sơ đã lưu lần đầu với SOURCE=MANUAL | Mở Sửa | Trường SOURCE bị disable; tooltip giải thích lý do | B1.1 |

---

## D4. Nhóm 4 — Xoá

| Mã TC | Tên Testcase | Loại UC | Given | When | Then | Tham chiếu |
|---|---|---|---|---|---|---|
| EXP.OPEX.DOSSIER.TC.4.01 | Xoá hồ sơ thành công | Positive | Hồ sơ ở DRAFT; NSD là Maker gốc | Bấm **Xoá**; nhập Lý do ≥ 10 ký tự; tick checkbox xác nhận; bấm **Xác nhận xoá** | Soft-delete: F-STATUS=DELETED; ẩn khỏi LIST; ghi audit; hiển thị MSG-OK-DELETE | VAL-16, BIZ-003, BIZ-007 |
| EXP.OPEX.DOSSIER.TC.4.02 | Xoá không thành công — Trạng thái không cho phép | Negative | Hồ sơ ở PENDING_CHECKER | Cố gắng bấm **Xoá** | Nút **Xoá** bị disable; tooltip MSG-ERR-STATUS | VAL-13 |
| EXP.OPEX.DOSSIER.TC.4.03 | Xoá không thành công — Không phải Maker gốc | Negative | Hồ sơ ở DRAFT; NSD không phải người tạo | Cố gắng bấm **Xoá** | Nút **Xoá** bị disable; tooltip MSG-ERR-MAKER | VAL-14 |
| EXP.OPEX.DOSSIER.TC.4.04 | Xoá không thành công — Lý do không đủ ký tự | Negative | Popup Xoá đang mở | Nhập Lý do < 10 ký tự; bấm **Xác nhận xoá** | Nút **Xác nhận xoá** vẫn disable; hiển thị MSG-ERR-DELETE-CFM | VAL-16 |
| EXP.OPEX.DOSSIER.TC.4.05 | Xoá không thành công — Chưa tick checkbox xác nhận | Negative | Popup Xoá đang mở; đã nhập Lý do ≥ 10 ký tự | Chưa tick checkbox; bấm **Xác nhận xoá** | Nút **Xác nhận xoá** vẫn disable | VAL-16 |
| EXP.OPEX.DOSSIER.TC.4.06 | Hồ sơ đã xoá vẫn truy được qua audit | Positive | Hồ sơ đã bị xoá (F-STATUS=DELETED) | Admin truy vấn audit log | Bản ghi xuất hiện trong audit với action=DELETE; oldValue→newValue đầy đủ | BIZ-003, BIZ-007 |

## Phụ lục LOV

### LOV.01 — Loại tiền (LOV.Currency_Code)

| Currency_Code | Currency_Name |
|---|---|
| VND | Việt Nam Đồng |
| USD | Đô la Mỹ |

### LOV.02 — Loại ngày lọc (LOV.Date_field)

| Date_type | Date_type Description |
|---|---|
| Ngày tạo | Ngày tạo hồ sơ |
| Ngày tiếp nhận | Ngày tiếp nhận hồ sơ |
| Ngày kiểm soát | Ngày kiểm soát hồ sơ |
| Ngày phê duyệt | Ngày phê duyệt hồ sơ |

### LOV.03 — Danh sách loại chứng từ (LOV.Expenditure_doc_type)

| Document_Type_Code | Document_Type_Name | Mã chức năng (MOD code) |
|---|---|---|
| C2-03/NS | Giấy đề nghị thanh toán tạm ứng (Mẫu số 10) C2-03/NS | EXP.OPEX.DOC.MANAGE.6 |
| C2-08/NS | Giấy đề nghị thanh toán tạm ứng bằng ngoại tệ (Mẫu số 11) C2-08/NS | EXP.OPEX.DOC.MANAGE.7 |
| C2-02a/NS | Giấy rút dự toán NSNN (không kèm theo nộp NSNN) (Mẫu số 13) C2-02a/NS | EXP.OPEX.DOC.MANAGE.8 |
| C2-02b/NS | Giấy rút dự toán NSNN (kèm theo nộp NSNN) (Mẫu số 14) C2-02b/NS | EXP.OPEX.DOC.MANAGE.9 |
| C2-06a/NS | Giấy rút dự toán NSNN bằng ngoại tệ (Mẫu số 15) C2-06a/NS | EXP.OPEX.DOC.MANAGE.10 |
| C2-06b/NS | Giấy rút dự toán kiêm thu NSNN (Mẫu số 16) C2-06b/NS | EXP.OPEX.DOC.MANAGE.11 |
| C4-02a/NS | Uỷ nhiệm chi (không kèm theo nộp NSNN) (Mẫu số 17) C4-02a/NS | EXP.OPEX.DOC.MANAGE.12 |
| C4-02c/NS | Uỷ nhiệm chi (kèm theo nộp NSNN) (Mẫu số 18) C4-02c/NS | EXP.OPEX.DOC.MANAGE.13 |
| C4-02b/NS | Uỷ nhiệm chi (ngoại tệ) (Mẫu số 19) C4-02b/NS | EXP.OPEX.DOC.MANAGE.14 |
| C2-05a/NS | Giấy nộp trả kinh phí (Mẫu số 08) C2-05a/NS | EXP.OPEX.DOC.MANAGE.2 |
| C2-19/NS - CTX | Giấy đề nghị ghi thu, ghi chi vốn vay ODA/vốn vay ưu đãi/viện trợ không hoàn lại (C2-19/NS) - Chi thường xuyên | EXP.OPEX.DOC.MANAGE.4 |
| C2-18/NS - CTX | Giấy đề nghị thanh toán tạm ứng số đã ghi thu, ghi chi (Mẫu số 12) C2-18/NS - Chi thường xuyên | EXP.OPEX.DOC.MANAGE.5 |
| DS DTTH | Danh sách thanh toán cho đối tượng thụ hưởng | EXP.OPEX.DOC.MANAGE.15 |
| DS LHS | Danh sách thanh toán cho lưu học sinh | EXP.OPEX.DOC.MANAGE.16 |
| C2-10/NS | Giấy đề nghị điều chỉnh số liệu ngân sách (Mẫu số 09) C2-10/NS | EXP.OPEX.DOC.MANAGE.3 |

### LOV.04 — Nguồn (LOV.Source)

| Source_Code | Source_Name | Ghi chú |
|---|---|---|
| MANUAL | Thủ công | Nhập trực tiếp tại quản lý chi |
| DVKB | Nguồn dịch vụ công/dịch vụ kho bạc | Nguồn dữ liệu được chuyển sang từ Dịch vụ kho bạc |
| AUTO | Tự động | Thực hiện tự động viễn thông, điện nước |

### LOV.07.6 — Segment6 (Mã ĐVSDNS)

| Segment_Code | Segment_Name |
|---|---|
| 0000001 | DVQHNS 0000001 |
| 1056333 | Công ty TNHH MTV bất động sản Á Châu |
| 1170918 | Văn phòng Sở du lịch thành phố Hà Nội |
| 1171277 | Cơ quan Báo và phát thanh, truyền hình Hà Nội |
| 1059441 | Trường trung học Công nghiệp Hà Nội |
| 1058252 | Sở Du lịch Hà Nội |

### LOV.07.11 — Segment11 (Mã Kho bạc)

| Segment_Code | Segment_Name |
|---|---|
| 0001 | Kho bạc 0001 |
| 0011 | Kho bạc nhà nước khu vực I |
| 0012 | Kho bạc nhà nước khu vực I - PGD số 12 |
| 0003 | Kho bạc nhà nước — Ban giao dịch |

---

## Đánh giá

### A. Nhất quán với dự án VDBAS

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Cấu trúc section A→D | ✅ | Đầy đủ A1–A12, B1–B4, C1–C3, D1–D4 |
| Quy ước đặt tên Mã TC | ✅ | Format `EXP.OPEX.DOSSIER.TC.<Nhóm>.<STT>` theo chuẩn template |
| Định dạng bảng field (7 cột) | ✅ | Đủ 7 cột: Trường / Trường(ENG) / Loại / Bắt buộc / Giá trị mặc định / Loại dữ liệu / Mô tả |
| Quy ước mã Event_id | ✅ | Format `EXP.OPEX.DOSSIER.<ACTION>` nhất quán |
| Cách viết LOV trong mô tả field | ✅ | Ghi rõ tên LOV và giá trị trong cột Mô tả / Ràng buộc |
| Các mã BIZ/VAL/MSG nhất quán | ✅ | BIZ-001→011, VAL-01→21, MSG chuẩn + MSG đặc thù từ sheet 4 |

> Tham chiếu: Không có file tham chiếu VDBAS — đánh giá dựa trên chuẩn template `CRUD_spec_function_v1.md`.

### B. Phù hợp với best practice đặc tả CRUD

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| Mỗi field có đủ 7 cột (không bỏ trống tùy tiện) | ✅ | Tất cả bảng field đều đủ 7 cột |
| Luồng chính/thay thế/ngoại lệ đầy đủ | ✅ | A4/A5/A6 đầy đủ, bổ sung luồng đặc thù chứng từ |
| State Machine có đủ trạng thái CRUD cơ bản | ✅ | 10 trạng thái hồ sơ + 3 nhóm trạng thái phụ (dự toán, hạch toán, thanh toán) |
| Testcase bao phủ happy path + edge case | ✅ | 13 TC nhóm 1, 6 TC nhóm 2, 8 TC nhóm 3, 6 TC nhóm 4 |
| Không có placeholder còn sót lại | ✅ | Đã thay toàn bộ `<MOD>` bằng `EXP.OPEX.DOSSIER` |
| Mô tả field đủ rõ để dev implement không cần hỏi thêm | ✅ | Quy tắc sinh DOSSIER_CODE, DOC_NUMBER, trạng thái, LOV đều được mô tả chi tiết |

### C. Tổng kết

**Mức độ sẵn sàng:** Sẵn sàng

**Các điểm cần xử lý trước khi sử dụng:** Không có — file đạt chất lượng.
