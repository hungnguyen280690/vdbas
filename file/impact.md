# Impact Analysis: apiContract/api-contract.yaml ↔ file/DOSSIER.sql

**Generated:** 2026-06-19
**API Version:** 0.2.0 (EXP OPEX Dossier Management API)
**Project:** `vdbas_exp_be` — multi-module hexagonal, base package `com.fis.vdbas.exp`, modules `domain` / `application` / `common` / `api`.

> ⚠️ **Bối cảnh quan trọng:** Code BE **đã tồn tại** một bộ tính năng Dossier gần như đầy đủ, nhưng được xây cho **CAPEX** (`/api/v1/exp/capex/...`) với **state machine khác** (DRAFT/SAVED/VALIDATED/SUBMITTED/APPROVED/REJECTED/COMPLETED/CANCELLED) và **workflow gộp** (submit/approve/reject/copy). Contract này là **OPEX** với state machine Maker–Checker–Approver 11 trạng thái và 7 bước workflow tách biệt. Vì vậy phần lớn artifact là **EXISTS_REUSE / EXISTS_MODIFY**, không phải NEW — và rủi ro regression lên CAPEX là điểm nóng nhất.

---

## Tóm tắt

| Hạng mục | Số lượng |
|----------|----------|
| Bảng DB phân tích | 20 |
| YAML Schemas phân tích | 31 |
| Columns đã mapping khớp (entity hiện có) | ~95% các bảng nghiệp vụ chính |
| **Endpoint In-Scope** | **~24 / 39** |
| **Hạng mục Out-of-Scope** | **9** |
| **CRITICAL gaps** | **5** |
| **DECISION_NEEDED gaps** | **6** |
| IMPLEMENTATION_NOTE gaps | 7 |
| Artifact đã có — dùng lại (EXISTS_REUSE) | ~14 |
| Artifact đã có — phải sửa (EXISTS_MODIFY) | ~16 |
| **Files cần tạo mới (NEW)** | **~10** |
| **Rủi ro regression HIGH / MEDIUM** | **3 / 5** |

## Checklist trước khi sinh code

- [ ] Đã review Scope / Out-of-Scope
- [ ] **Chốt GAP-1 (OPEX vs CAPEX namespace) — quyết định kiến trúc lớn nhất**
- [ ] **Chốt GAP-2 (DossierStatus state machine) — block toàn bộ workflow**
- [ ] Tất cả CRITICAL gaps đã có quyết định
- [ ] Tất cả DECISION_NEEDED gaps đã có quyết định
- [ ] Đã review danh sách EXISTS_REUSE / EXISTS_MODIFY / NEW (STEP 1B)
- [ ] Đã review mục Tác động lên code & chức năng cũ (STEP 7B)
- [ ] Có kế hoạch re-test cho mọi rủi ro HIGH / MEDIUM (đặc biệt CAPEX flow)
- [ ] Package gốc đã xác nhận (`com.fis.vdbas.exp`)
- [ ] Cấu trúc folder đã review

---

# Phạm vi triển khai (Scope)

## ✅ In-Scope — Mapping bao trùm (sinh/sửa code chạy được với DB sẵn có)

| Nhóm chức năng | Endpoint / Entity liên quan | Cơ sở mapping | Mức độ sẵn sàng |
|----------------|------------------------------|----------------|-----------------|
| CRUD hồ sơ | `GET/POST/PUT/DELETE /exp/opex/dossiers[/{id}]` ↔ `EXP_DOSSIER` | Entity `ExpDossier` + repo + service + mapper đã có | 🔧 Sửa lại (namespace + status + request fields) |
| Lưu nháp | `POST /exp/opex/dossiers/drafts` ↔ `EXP_DOSSIER_DRAFT` | `ExpDossierDraft` + `DossierDraftService` đã có | 🔧 Sửa (bỏ ràng buộc dossierId — xem GAP-7) |
| Copy hồ sơ | `POST /exp/opex/dossiers/{id}/copy` | `DossierWorkflowService.copy()` đã có | 🔧 Sửa (copy documents còn TODO) |
| Liệt kê + phân trang + lọc + sort | `GET /exp/opex/dossiers` | `DossierService.search()` Specification đã có (filter code/status/date-range) | 🔧 Sửa (thêm filter checkedBy/approvedBy/dataSourceCode multi) |
| CRUD chứng từ | `.../documents[/{docId}]` ↔ `EXP_DOCUMENT` | `ExpDocument` + `DocumentService` đầy đủ | 🔧 Sửa (sinh DOCUMENT_NO — xem GAP-9) |
| Workflow chuyển trạng thái | submit/check/check-reject/check-return/approve/approve-reject/approve-cancel | `DossierWorkflowService` có submit/approve/reject | 🔧 Mở rộng mạnh (xem GAP-3) |
| Liệt kê đính kèm (metadata) | `GET .../attachments` ↔ `EXP_DOSSIER_ATTACHMENT` | `AttachmentService.list()` + mapper đã có | ✅ Dùng lại (dossier-level); 🆕 thêm document-level |
| Xoá đính kèm (metadata) | `DELETE .../attachments/{attId}` | `AttachmentService.delete()` đã có | ✅ Dùng lại |
| Approval log | `GET .../approval-log` ↔ `EXP_APPROVAL_LOG` | `ExpApprovalLog` + repo + `getApprovalLog()` đã có | ✅ Dùng lại |
| Audit log (đọc) | `GET .../audit-log` ↔ `EXP_AUDIT_LOG` | `AuditLogService.getDossierAuditLog()` đã có | ✅ Dùng lại (ghi log = out-of-scope) |
| LOV organizations/treasuries/data-sources/document-types/attachment-types | `/lov/*` | `LovService` + repos đã có | ✅ Dùng lại |

## ⚠️ Out-of-Scope — Ngoài phạm vi mapping (cần bổ sung thủ công / xác nhận có sẵn)

| Hạng mục | Endpoint / Field liên quan | Vì sao ngoài scope | Hướng xử lý đề xuất |
|----------|----------------------------|--------------------|---------------------|
| Trích xuất claim JWT | Tất cả endpoint (`createdBy`, role MAKER/CHECKER/APPROVER, scope `treasuryCode`, SoD BIZ-001) | YAML chỉ khai báo `bearerAuth`; code đang hardcode `"SYSTEM"` | Dựng `SecurityConfig` + resolver; thay mọi chỗ "SYSTEM" |
| Lưu & quét file | `POST .../attachments` (lưu file, virus scan, MIME, ≤10MB VAL-09), `GET .../{attId}` (tải binary) | DB chỉ chứa metadata + `FILE_PATH`; chưa có `FileStorageService` | Hiện thực `FileStorageService` + endpoint upload/download (413/415) |
| Đính kèm cấp chứng từ | `.../documents/{docId}/attachments/**` ↔ `EXP_DOCUMENT_ATTACHMENT` | Bảng + entity **chưa có** `ExpDocumentAttachment` | 🆕 Tạo entity/repo/service/controller |
| Export sync/async | `GET /exp/opex/dossiers/export`, `/export/{jobId}` | Cần thư viện Excel/PDF/CSV + job store; không suy ra từ schema | 🆕 `ExportService` + job tracking; chưa có bảng job |
| Ký số | `ApproveRequest.digitalSign` ↔ `EXP_DIGITAL_SIGNED` | Cần tích hợp dịch vụ ký; entity có nhưng thiếu cột & không có repo/ghi | Xác nhận dịch vụ ký dùng chung; bổ sung entity |
| Ghi EXP_AUDIT_LOG | Mọi mutation (BIZ-007 oldValue→newValue) | Chỉ có đọc; chưa có writer/listener | 🆕 `AuditLogWriter` (AOP/EntityListener) |
| Sinh mã `DOSSIER_CODE`/`DOCUMENT_NO`, `HASH_INFO`, SLA | create/submit/addDocument | Thuật toán sequence/hash/scheduler không nằm trong schema | Hiện thực generator + scheduler |
| LOV currencies | `GET /lov/currencies`, field `currencyCode` | **Không có cột trong DDL** (EXP_DOCUMENT không có CURRENCY_CODE) | Trả hằng số (VND/USD) hoặc bỏ; xem GAP-10 |
| LOV users | `GET /lov/users` | Lấy từ Identity Provider, không có bảng | Tích hợp IdP / xác nhận API dùng chung |
| LOV dossier-types | `GET /lov/dossier-types` ↔ `EXP_DOSSIER_TYPE` | Bảng có nhưng `LovController` **chưa có endpoint** này | 🆕 Thêm endpoint (entity bảng đã có) |

> **Ghi chú:** Out-of-scope = YAML + SQL không đủ thông tin để generate; dev cần hiện thực hoặc xác nhận đã có sẵn. Phần In-scope đủ điều kiện sinh/sửa code biên dịch & chạy với DB hiện có.

---

# Q&A Gaps

## 🔴 CRITICAL

### GAP-1: Namespace OPEX vs code CAPEX hiện có

**Bảng / Endpoint liên quan:** toàn bộ `/api/v1/exp/opex/**` (contract) vs `/api/v1/exp/capex/**` (code hiện tại)

**Vấn đề:**
Toàn bộ controller hiện có (`DossierController`, `WorkflowController`, `DocumentController`, ...) đang map path `/api/v1/exp/capex/dossiers`. Contract yêu cầu `/api/v1/exp/opex/dossiers`. Cùng một bảng `EXP_DOSSIER` phân biệt OPEX/CAPEX qua cột `DOSSIER_TYPE_CODE` (+ CHECK constraint: OPEX ⇒ PROJECT_CODE NULL, CAPEX ⇒ PROJECT_CODE NOT NULL).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> OPEX dùng **chung** controller/service với CAPEX (chỉ khác `dossierTypeCode` + base path), hay tách **module/controller riêng**? State machine OPEX khác hẳn CAPEX (GAP-2) — nếu dùng chung sẽ phải nhánh hoá logic theo loại hồ sơ.

**Recommendation:**
Tách **controller OPEX riêng** (`api/dossier/opex/...`) nhưng **tái dùng entity + repository**. Service nên tách `OpexDossierWorkflowService` vì state machine + SoD khác hoàn toàn CAPEX; phần CRUD/search có thể chia sẻ qua service chung tham số hoá theo `dossierTypeCode`. Tránh sửa trực tiếp controller CAPEX để không phá flow CAPEX đang chạy.

**Decision:** ☐ Chưa quyết định

---

### GAP-2: DossierStatus enum lệch hoàn toàn state machine OPEX

**Bảng / Endpoint liên quan:** `EXP_DOSSIER.F_STATUS` (FK → `COMMON_STATUS`) / `#/schemas/DossierStatus`

**Vấn đề:**
- Enum code hiện có (`common/enums/DossierStatus`): `DRAFT, SAVED, VALIDATED, SUBMITTED, APPROVED, REJECTED, COMPLETED, CANCELLED` (8 giá trị).
- Contract OPEX yêu cầu: `DRAFT, PENDING_CHECKER, CHECKED, APPROVAL_PENDING, APPROVED, APPROVAL_REJECTED, CHECK_REJECTED, CHECK_CANCELLED, APPROVAL_CANCELLED, REJECTED_BY_CHECKER, DELETED` (11 giá trị).
- Hai tập **gần như không giao nhau** (chỉ chung `DRAFT`, `APPROVED`). `DossierStatusConverter.convertToEntityAttribute` gọi `DossierStatus.valueOf(dbData)` → **ném IllegalArgumentException** nếu DB chứa giá trị OPEX không có trong enum (và ngược lại CAPEX nếu thêm bừa).
- `ExpDossierRepository.softDelete` hard-code set `fStatus = DossierStatus.CANCELLED`; contract OPEX dùng `DELETED`.
- `F_STATUS` là FK tới `COMMON_STATUS.STATUS_CODE` → mọi giá trị enum phải tồn tại trong `COMMON_STATUS` (seed).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> OPEX và CAPEX **chia sẻ một enum `DossierStatus`** (hợp nhất ~15 giá trị) hay mỗi loại một enum/converter riêng? Bảng `COMMON_STATUS` đã seed đủ 11 mã trạng thái OPEX chưa?

**Recommendation:**
Tạo enum riêng **`OpexDossierStatus`** + converter riêng để **không đụng** enum CAPEX đang chạy (tránh phá `valueOf`/switch CAPEX). `softDelete` cho OPEX phải set `DELETED` (không tái dùng query CAPEX set `CANCELLED`). Seed `COMMON_STATUS` đủ 11 mã + `STATUS_NAME` để `fStatusName` hiển thị. Verify converter không vỡ khi đọc bản ghi loại còn lại.

**Decision:** ☐ Chưa quyết định

---

### GAP-3: Workflow 7 bước Maker–Checker–Approver vs code 3 bước

**Bảng / Endpoint liên quan:** `.../submit | check | check-reject | check-return | approve | approve-reject | approve-cancel` / `DossierWorkflowService`

**Vấn đề:**
Code hiện có: `submit()`, `approve()` (gộp Checker+Approver bằng switch theo state), `reject()`, `copy()`. Contract OPEX cần **7 transition tách biệt** với pre-condition + SoD (BIZ-001) + thông báo (BIZ-009):
- submit: `DRAFT/REJECTED_BY_CHECKER → PENDING_CHECKER` (tính HASH_INFO, cần ≥1 chứng từ hợp lệ)
- check: `PENDING_CHECKER → CHECKED` (→ `APPROVAL_PENDING` nếu có Approver)
- check-reject: `PENDING_CHECKER → CHECK_REJECTED`
- check-return: `PENDING_CHECKER → DRAFT`
- approve: `CHECKED/APPROVAL_PENDING → APPROVED`
- approve-reject: `CHECKED → APPROVAL_REJECTED`
- approve-cancel: `APPROVAL_PENDING → CHECKED`

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> Có chấp nhận viết `OpexDossierWorkflowService` mới với đủ 7 transition + bảng chuyển trạng thái (state guard) + SoD không? SoD lấy user/role từ JWT (out-of-scope hiện tại đang "SYSTEM").

**Recommendation:**
Viết service workflow OPEX riêng, mỗi transition 1 method, dùng một `Map<OpexDossierStatus, Set<OpexDossierStatus>>` làm guard, ghi `EXP_APPROVAL_LOG` mỗi bước (đã có `writeApprovalLog`). SoD cần claim JWT → phụ thuộc GAP out-of-scope security; tạm chặn merge nếu chưa có context user thật.

**Decision:** ☐ Chưa quyết định

---

### GAP-4: Đính kèm cấp chứng từ chưa có entity & upload/download chưa hiện thực

**Bảng / Endpoint liên quan:** `EXP_DOCUMENT_ATTACHMENT`, `EXP_DOSSIER_ATTACHMENT` / `POST|GET .../attachments`, `.../documents/{docId}/attachments/**`

**Vấn đề:**
- Bảng `EXP_DOCUMENT_ATTACHMENT` **không có entity** tương ứng (chỉ có `ExpDossierAttachment`).
- `AttachmentController` hiện chỉ có `list` + `delete` metadata; **không có** `POST upload` (multipart) và `GET download` (binary). Không có `FileStorageService`. Contract yêu cầu VAL-09 (≤10MB, pdf/jpg/png/docx, virus scan), 413/415.

**Mức độ:** `CRITICAL` (cho phần upload/download); metadata list/delete là In-scope.

**Câu hỏi:**
> Lưu file ở đâu (filesystem/MinIO/S3)? Có service quét virus dùng chung không? `EXP_DOCUMENT_ATTACHMENT` cần entity mới — xác nhận tạo.

**Recommendation:**
🆕 Tạo `ExpDocumentAttachment` (mirror `ExpDossierAttachment`, FK `DOCUMENT_ID`). Hiện thực `FileStorageService` (out-of-scope nghiệp vụ) + endpoint upload/download. Metadata mapping (FILE_NAME/TYPE/SIZE/PATH) thì In-scope; lưu/scan file là Out-of-scope.

**Decision:** ☐ Chưa quyết định

---

### GAP-5: Cột legacy NOT NULL không default (audit columns) — vỡ insert qua app

**Bảng / Endpoint liên quan:** Mọi bảng EXP có `CREATED_DATE/UPDATED_DATE/CREATED_BY/UPDATED_BY DATE/VARCHAR2 NOT NULL` / mọi POST

**Vấn đề:**
DDL: `CREATED_DATE DATE NOT NULL`, `UPDATED_DATE DATE NOT NULL`, `CREATED_BY VARCHAR2(100) NOT NULL`, `UPDATED_BY ... NOT NULL` ở **tất cả** bảng. Base `ExpAuditing` map `CREATED_DATE/UPDATED_DATE` qua `@CreatedDate/@LastModifiedDate`, còn `CREATED_BY/UPDATED_BY` đến từ `AbstractAuditing` — nếu auditor (JWT) chưa cấu hình sẽ null → **ORA-01400** khi insert (đã ghi nhận trong memory dự án).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> `AuditorAware` đã được cấu hình trả về user thật chưa? Khi chưa có JWT, fallback nào cho `CREATED_BY/UPDATED_BY` để không vỡ insert OPEX?

**Recommendation:**
Bảo đảm `AuditorAware<String>` trả về non-null (tạm `"SYSTEM"`) trước khi test create OPEX. Xác nhận `@EnableJpaAuditing` active. Đây là điều kiện tiên quyết để mọi POST OPEX không vỡ.

**Decision:** ☐ Chưa quyết định

---

## 🟡 DECISION_NEEDED

### GAP-6: DossierCreateRequest lệch field giữa contract và code

**Bảng / Endpoint liên quan:** `EXP_DOSSIER` / `POST /exp/opex/dossiers`

**Vấn đề:**
- Contract `DossierCreateRequest.required = [organizationCode, treasuryCode, sendDate, dataSourceCode]`, có `dossierTypeCode`; **không có** projectCode (OPEX ⇒ PROJECT_CODE NULL theo CHECK constraint).
- Code `DossierCreateRequest`: `sendDate, dataSourceCode, dossierTypeCode, organizationCode, projectCode, projectSpecificCode` — **không nhận `treasuryCode`** (service tự lấy treasury đầu tiên từ LOV làm placeholder) và **có projectCode** (CAPEX).

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> OPEX có nhận `treasuryCode` từ client (contract) không, hay suy ra từ JWT scope? OPEX có bỏ hẳn projectCode/projectSpecificCode trong request không?

**Recommendation:**
Tạo `OpexDossierCreateRequest` đúng contract (`treasuryCode` required, bỏ project*). Service set `DOSSIER_TYPE_CODE='OPEX'`, `PROJECT_CODE=NULL` để thỏa CHECK constraint.

**Decision:** ☐ Chưa quyết định

---

### GAP-7: DossierDraftRequest — ràng buộc dossierId (FK) lệch contract

**Bảng / Endpoint liên quan:** `EXP_DOSSIER_DRAFT.DOSSIER_ID` (NOT NULL, FK) / `POST /exp/opex/dossiers/drafts`

**Vấn đề:**
- Contract `DossierDraftRequest`: tất cả field nghiệp vụ optional, **không có** `dossierId` (lưu nháp lần đầu chưa có hồ sơ).
- Code `DossierDraftRequest` **bắt buộc `dossierId`** và `EXP_DOSSIER_DRAFT.DOSSIER_ID` là NOT NULL + FK → tạo nháp mới sẽ **409/ORA-01400** (đã ghi nhận memory dự án).

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> Lưu nháp lần đầu (chưa có `EXP_DOSSIER`) thì `DOSSIER_ID` lấy đâu? Cho phép NULL, hay tạo `EXP_DOSSIER` skeleton trước rồi mới ghi draft?

**Recommendation:**
Theo contract: tạo `EXP_DOSSIER` ở trạng thái `DRAFT` (sinh ID + DOSSIER_CODE) trước, rồi ghi `EXP_DOSSIER_DRAFT.CONTENT` (JSON) trỏ về dossierId đó — giữ FK hợp lệ mà vẫn đúng UX "lưu nháp". Không nới NULL cho cột FK.

**Decision:** ☐ Chưa quyết định

---

### GAP-8: Filter list thiếu checkedBy/approvedBy/dataSourceCode(multi)/dateField đủ giá trị

**Bảng / Endpoint liên quan:** `GET /exp/opex/dossiers` / `DossierService.search` + `DossierSearchDto`

**Vấn đề:**
Contract cho phép lọc `checkedBy`, `approvedBy`, `dataSourceCode`, `dateField ∈ {CREATED_DATE, RECEIVED_DATE, CHECKED_DATE, APPROVED_DATE}`, `fStatus[]`. `DossierSearchDto` hiện có `createdBy`, `dossierCode`, `projectCode`, `dateField (SEND_DATE|CREATED_DATE|CHECKED_DATE|APPROVED_DATE)`, `fStatus[]`, `dataSourceCode[]`. `checkedBy/approvedBy` **chưa có**; CHECKED_DATE/APPROVED_DATE không phải cột vật lý trên `EXP_DOSSIER` (suy từ `EXP_APPROVAL_LOG`).

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> `checkedBy/approvedBy` và `RECEIVED_DATE/CHECKED_DATE/APPROVED_DATE` lấy từ `EXP_APPROVAL_LOG` (subquery theo ACTION_ROLE) hay cột phi vật lý? Code đã có subquery cho date — mở rộng tương tự cho user?

**Recommendation:**
Mở rộng Specification: `checkedBy/approvedBy` join/subquery `EXP_APPROVAL_LOG` theo `ACTION_ROLE`. `RECEIVED_DATE` cần xác định nguồn (SEND_DATE?). Bổ sung field vào `DossierSearchDto`.

**Decision:** ☐ Chưa quyết định

---

### GAP-9: DOCUMENT_NO — contract backend-generate, code yêu cầu client gửi

**Bảng / Endpoint liên quan:** `EXP_DOCUMENT.DOCUMENT_NO` / `POST .../documents`

**Vấn đề:**
Contract: `DOCUMENT_NO` sinh backend `[dossierCode]-[documentTypeCode]-[#### từ 0001]`, `DOCUMENT_NAME` auto từ LOV.03; `DocumentCreateRequest` **không** có documentNo/documentName. Code `AddDocumentRequest` **bắt buộc `documentNo`** (NN, ≤200) và nhận `documentName`.

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> Chuyển `DOCUMENT_NO` sang sinh backend (bỏ khỏi request) đúng contract? Quy tắc đánh số `####` theo phạm vi mỗi hồ sơ?

**Recommendation:**
Theo contract: bỏ `documentNo`/`documentName` khỏi request OPEX, sinh backend; `documentName` lấy từ `EXP_DOCUMENT_TYPE.DOCUMENT_TYPE_NAME`. Số thứ tự đếm theo `countByDossierId` (đã có) +1.

**Decision:** ☐ Chưa quyết định

---

### GAP-10: currencyCode có trong contract nhưng không có cột DB

**Bảng / Endpoint liên quan:** `EXP_DOCUMENT` (thiếu CURRENCY_CODE) / `DocumentCreateRequest.currencyCode`, `GET /lov/currencies`

**Vấn đề:**
Contract khai báo `currencyCode` (và LOV currencies) nhưng **DDL `EXP_DOCUMENT` không có cột `CURRENCY_CODE`** — chính contract cũng ghi "VERIFY: not persisted in current DDL". Entity `ExpDocument` không có field này.

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> OPEX có cần lưu loại tiền không? Nếu có → bổ sung cột DDL `CURRENCY_CODE`; nếu không → bỏ field khỏi request và endpoint `/lov/currencies`.

**Recommendation:**
Vì OPEX (VND) — bỏ `currencyCode` khỏi request OPEX và không persist. Nếu nghiệp vụ cần đa tệ, raise change-request thêm cột (ngoài phạm vi gen code hiện tại).

**Decision:** ☐ Chưa quyết định

---

### GAP-11: LOV thiếu endpoint dossier-types / currencies / users

**Bảng / Endpoint liên quan:** `/lov/dossier-types` (`EXP_DOSSIER_TYPE`), `/lov/currencies`, `/lov/users`

**Vấn đề:**
`LovController` hiện có organizations/treasuries/data-sources/document-types/attachment-types/projects. **Thiếu** `dossier-types` (bảng `EXP_DOSSIER_TYPE` đã có, chưa có entity LOV), `currencies` (không có bảng), `users` (IdP).

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> `/lov/dossier-types` đọc từ `EXP_DOSSIER_TYPE` (tạo entity LOV mới)? `/lov/users` đấu nối IdP nào?

**Recommendation:**
🆕 `ExpDossierType` entity + repo + endpoint (In-scope, bảng có sẵn). `/lov/currencies` trả hằng số. `/lov/users` Out-of-scope (IdP).

**Decision:** ☐ Chưa quyết định

---

## 🟢 IMPLEMENTATION_NOTE

### GAP-12: Ghi EXP_AUDIT_LOG chưa hiện thực (chỉ đọc)
**Mức độ:** `IMPLEMENTATION_NOTE` — `AuditLogService` chỉ có đọc; mọi mutation còn TODO ghi log. Cần `AuditLogWriter` (EntityListener/AOP) để `GET .../audit-log` có dữ liệu. BIZ-007 oldValue→newValue.

### GAP-13: HASH_INFO khi submit chưa tính
**Mức độ:** `IMPLEMENTATION_NOTE` — field `hashInfo` tồn tại, `submit()` chưa sinh hash (JSON `{documentHash, algorithm:SHA256}`). Out-of-scope thuật toán.

### GAP-14: SLA do scheduler — hiện set `now()`
**Mức độ:** `IMPLEMENTATION_NOTE` — `applyCreateDefaults` set `sla=now()` tạm. `EXP_DOSSIER_SLA` entity (`ExpDossierSla`) lệch DDL: thiếu `IS_NOTIFY`, có `STATE_CODE/ASSIGN_USER` không khớp cột DDL (`ACTION_ROLE/ACTION_USER`). Cần rà nếu dùng SLA thật.

### GAP-15: assignUser/actionUser hard-code "SYSTEM"
**Mức độ:** `IMPLEMENTATION_NOTE` — `writeApprovalLog`/`nextAssignee` trả "SYSTEM"; phụ thuộc JWT (out-of-scope). `EXP_APPROVAL_LOG` đã có thêm cột entity `ACTION_USER_NAME` (length 500) không có trong DDL — verify schema-drift.

### GAP-16: ExpDigitalSigned entity thiếu cột so với DDL
**Mức độ:** `IMPLEMENTATION_NOTE` — entity có `signedContent/signature/cert/signedDate`; DDL còn `SIGNATURE_STATUS, SIGNED_USER, SIGNED_ROLE, CREATED_BY/DATE, UPDATED_BY/DATE NOT NULL`. Không có repository. Ký số Out-of-scope.

### GAP-17: Export sync/async chưa có
**Mức độ:** `IMPLEMENTATION_NOTE` (thực chất Out-of-scope) — không có `ExportController`/service, không có bảng job. Cần thư viện + job store.

### GAP-18: VERSION NUMBER(3) vs optimistic lock
**Mức độ:** `IMPLEMENTATION_NOTE` — `@Version Integer version` map `VERSION NUMBER(3) NOT NULL`. OK; lưu ý UK `(DOSSIER_CODE, VERSION)` và partial-unique `UK_DOSSIER_ACTIVE` khi copy/version.

---

# Column → Entity Mapping

## EXP_DOSSIER → ExpDossier *(EXISTS — `domain/dossier/ExpDossier.java`, extends `ExpAuditing<UUID>`)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @GeneratedValue @Column(name="id", updatable=false)` | PK ✅ |
| TREASURY_CODE | VARCHAR2(100) | NOT NULL | treasuryCode | String | `@Column(name="TREASURY_CODE", length=100)` | ✅ |
| TREASURY_NAME | NVARCHAR2(500) | NOT NULL | treasuryName | String | `@Column(name="TREASURY_NAME", length=500)` | denorm; NVARCHAR2 thin-mode lưu ý |
| DOSSIER_TYPE_CODE | VARCHAR2(100) | NOT NULL | dossierTypeCode | String | `@Column(name="DOSSIER_TYPE_CODE", length=100)` | OPEX cố định; immutable VAL-17 |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column(name="DOSSIER_CODE", length=100, updatable=false)` | sinh backend (GAP) |
| VERSION | NUMBER(3) | NOT NULL | version | Integer | `@Version @Column(name="VERSION")` | optimistic lock ✅ |
| SEND_DATE | DATE | NOT NULL | sendDate | LocalDate | `@Column(name="SEND_DATE")` | ✅ |
| PROJECT_CODE | VARCHAR2(100) | NULL | projectCode | String | `@Column(name="PROJECT_CODE", length=100)` | OPEX = NULL (CHECK constraint) |
| PROJECT_NAME | NVARCHAR2(500) | NULL | projectName | String | `@Column(name="PROJECT_NAME", length=500)` | denorm |
| PROJECT_SPECIFIC_CODE | VARCHAR2(100) | NULL | projectSpecificCode | String | `@Column(...)` | OPEX = NULL |
| PROJECT_SPECIFIC_NAME | NVARCHAR2(500) | NULL | projectSpecificName | String | `@Column(...)` | denorm |
| ORGANIZATION_CODE | VARCHAR2(100) | NOT NULL | organizationCode | String | `@Column(name="ORGANIZATION_CODE", length=100)` | ✅ |
| ORGANIZATION_NAME | NVARCHAR2(500) | NOT NULL | organizationName | String | `@Column(name="ORGANIZATION_NAME", length=500)` | denorm |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column(name="STATUS")` | hiệu lực 0/1 (soft-delete) |
| F_STATUS | VARCHAR2(100) | NOT NULL | fStatus | DossierStatus | `@Convert(DossierStatusConverter) @Column(name="F_STATUS", length=100)` | ⚠️ enum lệch — GAP-2 |
| WORKFLOW_CODE | VARCHAR2(100) | NOT NULL | workflowCode | String | `@Column(name="WORKFLOW_CODE", length=100)` | FK EXP_WORKFLOW |
| DATA_SOURCE_CODE | VARCHAR2(100) | NOT NULL | dataSourceCode | String | `@Column(name="DATA_SOURCE_CODE", length=100)` | FK; immutable VAL-17 |
| ASSIGN_USER | VARCHAR2(100) | NOT NULL | assignUser | String | `@Column(name="ASSIGN_USER", length=100)` | "SYSTEM" tạm |
| SLA | DATE | NOT NULL | sla | LocalDateTime | `@Column(name="SLA")` | ⚠️ DATE↔LocalDateTime; scheduler |
| HASH_INFO | VARCHAR2(2000) | NULL | hashInfo | String | `@Column(name="HASH_INFO", length=2000)` | set on submit (GAP-13) |
| COMPLETED_DATE | DATE | NULL | completedDate | LocalDate | `@Column(name="COMPLETED_DATE")` | ✅ |
| CREATED_BY | VARCHAR2(100) | NOT NULL | (createdBy) | String | từ `AbstractAuditing` | ⚠️ GAP-5 ORA-01400 nếu null |
| CREATED_DATE | DATE | NOT NULL | (createdDate) | LocalDateTime | `@CreatedDate @Column(name="CREATED_DATE", updatable=false)` (ExpAuditing) | ✅ |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | (updatedBy) | String | từ `AbstractAuditing` | ⚠️ GAP-5 |
| UPDATED_DATE | DATE | NOT NULL | (updatedDate) | LocalDateTime | `@LastModifiedDate @Column(name="UPDATED_DATE")` (ExpAuditing) | ✅ |

### Chú ý implement:
- `fStatus`: **không tái dùng** enum CAPEX; cần `OpexDossierStatus`/converter riêng (GAP-2).
- `SLA DATE` map `LocalDateTime` — Oracle DATE có giờ, OK; nhưng `completedDate`/`sendDate` là `LocalDate`.
- `AbstractAuditing` phải có `AuditorAware` non-null (GAP-5).

## EXP_DOCUMENT → ExpDocument *(EXISTS)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @GeneratedValue` | PK |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column(name="DOSSIER_ID")` | FK |
| TREASURY_CODE | VARCHAR2(100) | NOT NULL | treasuryCode | String | `@Column(length=100)` | |
| TREASURY_NAME | NVARCHAR2(500) | NOT NULL | treasuryName | String | `@Column(length=500)` | denorm |
| DOCUMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | documentTypeCode | String | `@Column(length=100)` | FK LOV.03 |
| DOCUMENT_NAME | NVARCHAR2(500) | NOT NULL | documentName | String | `@Column(length=500)` | auto từ LOV (GAP-9) |
| DOCUMENT_NO | VARCHAR2(200) | NOT NULL | documentNo | String | `@Column(length=200)` | sinh backend (GAP-9) |
| DOCUMENT_DATE | DATE | NOT NULL | documentDate | LocalDate | `@Column` | |
| ACCOUNTING_DATE | DATE | NOT NULL | accountingDate | LocalDate | `@Column` | POSTING_DATE |
| ORIGINAL_AMOUNT | NUMBER(18) | NOT NULL | originalAmount | Long | `@Column` (entity nullable) | ⚠️ DB NOT NULL, entity nullable → default = baseAmount |
| BASE_AMOUNT | NUMBER(18) | NOT NULL | baseAmount | Long | `@Column(name="BASE_AMOUNT")` | VND |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column` | soft-delete |
| *(none)* | — | — | seqNo | Integer | `@Transient` | tính runtime |
| *(none, contract)* | — | — | currencyCode | — | **KHÔNG map** | GAP-10 không có cột |
| CREATED_BY/DATE, UPDATED_BY/DATE | | NOT NULL | (audit) | | ExpAuditing/AbstractAuditing | GAP-5 |

### Chú ý implement:
- `ORIGINAL_AMOUNT` DB NOT NULL nhưng entity coi nullable → service phải default (hiện default = baseAmount). Đảm bảo không insert null.

## EXP_DOSSIER_ATTACHMENT → ExpDossierAttachment *(EXISTS)* / EXP_DOCUMENT_ATTACHMENT → 🆕 ExpDocumentAttachment (NEW)

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @GeneratedValue` | PK |
| DOSSIER_ID / DOCUMENT_ID | RAW(16) | NOT NULL | dossierId / documentId | UUID | `@Column` | FK |
| ATTACHMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | attachmentTypeCode | String | `@Column(length=100)` | FK |
| FILE_NAME | VARCHAR2(200) | NOT NULL | fileName | String | `@Column(length=200)` | |
| FILE_TYPE | VARCHAR2(100) | NOT NULL | fileType | String | `@Column(length=100)` | |
| FILE_SIZE | DECIMAL(18) | NOT NULL | fileSize | Long | `@Column` | DECIMAL(18)→Long |
| FILE_PATH | VARCHAR2(2000) | NOT NULL | filePath | String | `@Column(length=2000)` | **không expose API** |
| DESCRIPTION | NVARCHAR2(2000) | NULL | description | String | `@Column(length=2000)` | |
| CREATED_DATE/BY, UPDATED_DATE/BY | | NOT NULL | (audit) | | ExpAuditing | |

> `ExpDocumentAttachment` chưa tồn tại → tạo mirror `ExpDossierAttachment` đổi FK `DOCUMENT_ID`.

## EXP_APPROVAL_LOG → ExpApprovalLog *(EXISTS)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @GeneratedValue` | |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column` | FK |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column(length=100)` | |
| ACTION_USER | VARCHAR2(100) | NOT NULL | actionUser | String | `@Column(length=100)` | "SYSTEM" tạm |
| *(none in DDL)* | — | — | actionUserName | String | `@Column(name="ACTION_USER_NAME", length=500)` | ⚠️ schema-drift: cột không có trong DDL |
| ACTION_ROLE | VARCHAR2(100) | NOT NULL | actionRole | ActionRole | `@Convert(ActionRoleConverter)` | ✅ enum khớp |
| ACTION_DATE | DATE | NOT NULL | actionDate | LocalDateTime | `@Column` | |
| REASON | NVARCHAR2(2000) | NOT NULL | reason | String | `@Column(length=2000)` | |
| STATE_CODE | VARCHAR2(100) | NOT NULL | stateCode | String | `@Column(length=100)` | |
| PARENT_ID | RAW(16) | NULL | parentId | UUID | `@Column` | self-ref |
| CREATED_DATE/BY, UPDATED_DATE/BY | | NOT NULL | (audit) | | ExpAuditing | |

## EXP_AUDIT_LOG → ExpAuditLog *(EXISTS, append-only)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @GeneratedValue` | |
| TABLE_NAME | VARCHAR2(100) | NOT NULL | tableName | String | `@Column(length=100)` | |
| RECORD_ID | VARCHAR2(100) | NOT NULL | recordId | String | `@Column(length=100)` | |
| ACTION_TYPE | VARCHAR2(100) | NOT NULL | actionType | String | `@Column(length=100)` | INSERT/UPDATE/DELETE/APPROVE/REJECT |
| OLD_VALUE | CLOB | NULL | oldValue | String | `@Lob` | |
| NEW_VALUE | CLOB | NOT NULL | newValue | String | `@Lob` | |
| USER_ID | VARCHAR2(100) | NOT NULL | userId | String | `@Column(length=100)` | |
| ACTION_TIMESTAMP | TIMESTAMP | NOT NULL | actionTimestamp | LocalDateTime | `@Column` + `@PrePersist` | |
| IP_ADDRESS | VARCHAR2(100) | NOT NULL | ipAddress | String | `@Column(length=100)` | |

### Chú ý: chưa có cơ chế **ghi** (GAP-12).

> LOV entities (`CommonOrganization`, `CommonTreasury`, `ExpDataSource`, `ExpDocumentType`, `ExpAttachmentType`, `ExpProject`, `ExpProjectSpecific`, `ExpWorkflow`) đã map đầy đủ PK + name; `EXP_DOSSIER_TYPE` **chưa có entity** (GAP-11). `EXP_DIGITAL_SIGNED` entity thiếu cột (GAP-16). `EXP_DOSSIER_SLA` entity lệch cột (GAP-14).

---

# Tác động lên code & chức năng cũ (regression)

| Artifact (file) | Thay đổi cần làm | Chức năng cũ liên quan | Rủi ro phá vỡ | Mức độ | Cách kiểm chứng (regression) |
|-----------------|------------------|------------------------|---------------|--------|------------------------------|
| `common/enums/DossierStatus.java` + `DossierStatusConverter` | KHÔNG sửa trực tiếp — tạo `OpexDossierStatus` riêng. Nếu hợp nhất enum → thêm 9 giá trị OPEX | Toàn bộ CAPEX flow: `softDelete`(CANCELLED), `approve()` switch theo state, `labelOf()` | Nếu thêm value: switch/`valueOf` CAPEX có thể vỡ; nếu sửa converter dùng chung → đọc bản ghi sai | 🔴 HIGH | Chạy lại toàn bộ CAPEX: create→submit→approve→reject→delete; verify `valueOf` không ném; grep mọi `switch`/`labelOf` trên enum |
| `ExpDossierRepository.softDelete` (`@Modifying` set CANCELLED) | OPEX cần set `DELETED`; tách query riêng | Soft-delete CAPEX (DELETE /capex/dossiers) | Nếu đổi query chung → CAPEX xoá sai trạng thái | 🔴 HIGH | DELETE 1 dossier CAPEX, verify F_STATUS=CANCELLED giữ nguyên |
| `DossierWorkflowService` | Thêm 7 transition OPEX (hoặc service mới). Nếu sửa `approve()` switch hiện tại để nhận thêm OPEX states → đụng CAPEX | submit/approve/reject/copy CAPEX | Sửa switch state chung → CAPEX chuyển trạng thái sai | 🔴 HIGH | Test đủ vòng đời workflow CAPEX trước/sau; so log `EXP_APPROVAL_LOG` |
| `DossierService.create/search/update` | Thêm nhánh OPEX (treasuryCode từ request, projectCode=NULL, dossierType=OPEX); thêm filter checkedBy/approvedBy | List/Create/Update CAPEX | Sửa Specification chung có thể đổi kết quả filter CAPEX | ⚠️ MEDIUM | Re-test GET /capex/dossiers với mọi filter cũ; so tổng số dòng |
| `DossierDraftService` + `EXP_DOSSIER_DRAFT` FK | Cho phép tạo nháp khi chưa có dossier (tạo skeleton) | Lưu nháp CAPEX | Nếu nới logic dossierId → nháp CAPEX ghi sai FK | ⚠️ MEDIUM | Lưu nháp CAPEX, verify DOSSIER_ID hợp lệ, không ORA-01400 |
| `LovController` / `LovService` | Thêm `dossier-types`, `currencies`, `users` (+`ExpDossierType` entity) | LOV CAPEX hiện dùng | Chỉ thêm endpoint mới → thấp | 🟢 LOW | Smoke 1 LOV cũ trả như cũ |
| `AddDocumentRequest`/`DocumentService` | OPEX: bỏ documentNo khỏi request, sinh backend | Add document CAPEX (đang gửi documentNo) | Nếu đổi request dùng chung → client CAPEX gửi documentNo bị bỏ qua | ⚠️ MEDIUM | Add document CAPEX, verify DOCUMENT_NO như cũ |
| `AuditorAware` / JPA Auditing config | Đảm bảo non-null CREATED_BY/UPDATED_BY | Mọi insert (CAPEX + common) | Nếu cấu hình sai → vỡ toàn bộ insert | ⚠️ MEDIUM | Create 1 bản ghi bất kỳ, verify không ORA-01400 |
| `AttachmentController`/`AttachmentService` | Thêm upload/download + `ExpDocumentAttachment` | list/delete metadata hiện có | Thêm method/endpoint mới | 🟢 LOW | list/delete attachment cũ vẫn chạy |

### Tóm tắt regression
- File phải sửa (EXISTS_MODIFY): ~16
- Artifact dùng chung bị chạm: 4 (DossierStatus enum/converter, ExpDossierRepository.softDelete, DossierWorkflowService, DossierService.search)
- Rủi ro HIGH: 3 · MEDIUM: 5 · LOW: 2
- Khu vực cần re-test trước khi merge: **toàn bộ vòng đời hồ sơ CAPEX** (create/draft/update/delete/submit/approve/reject/copy), LOV cũ, add-document CAPEX, soft-delete CAPEX.

> **Khuyến nghị kiến trúc:** Cô lập OPEX bằng enum/converter/service/controller **riêng**, tái dùng entity + repository chung. Đây là cách giảm rủi ro HIGH xuống MEDIUM — tránh sửa trực tiếp các artifact dùng chung mà CAPEX đang phụ thuộc.

---

# File → Folder Mapping

**Base package:** `com.fis.vdbas.exp`
**Modules:** `domain` (entity + repository), `application` (service + mapper + dto), `common` (enum + converter + constants), `api` (controller)
**Nhãn:** ✅ EXISTS_REUSE · 🔧 EXISTS_MODIFY · 🆕 NEW

### Entity Layer (`domain/.../domain/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `ExpDossier.java` | `domain/dossier/` | ✅ EXISTS_REUSE | Map EXP_DOSSIER đầy đủ; dùng cho cả OPEX |
| `ExpDocument.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpDossierAttachment.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpApprovalLog.java` | `domain/dossier/` | ✅ EXISTS_REUSE | (lưu ý cột ACTION_USER_NAME drift) |
| `ExpDossierDraft.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpAuditLog.java` | `domain/audit/` | ✅ EXISTS_REUSE | |
| `ExpDigitalSigned.java` | `domain/dossier/` | 🔧 EXISTS_MODIFY | Thiếu cột SIGNATURE_STATUS/SIGNED_USER/ROLE/audit (GAP-16) |
| `ExpDossierSla.java` | `domain/dossier/` | 🔧 EXISTS_MODIFY | Lệch cột vs DDL (GAP-14) — nếu dùng SLA |
| `ExpDocumentAttachment.java` | `domain/dossier/` | 🆕 NEW | Map EXP_DOCUMENT_ATTACHMENT (GAP-4) |
| `ExpDossierType.java` | `domain/lov/` | 🆕 NEW | Map EXP_DOSSIER_TYPE cho /lov/dossier-types (GAP-11) |
| LOV entities (Organization/Treasury/DataSource/DocumentType/AttachmentType/Project/...) | `domain/lov/` | ✅ EXISTS_REUSE | |

### Repository Layer (`domain/.../domain/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `ExpDossierRepository.java` | `domain/dossier/` | 🔧 EXISTS_MODIFY | Thêm `softDelete`→DELETED cho OPEX; query checkedBy/approvedBy |
| `ExpDocumentRepository.java` | `domain/dossier/` | ✅ EXISTS_REUSE | countByDossierId dùng cho sinh DOCUMENT_NO |
| `ExpDossierAttachmentRepository.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpApprovalLogRepository.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpDossierDraftRepository.java` | `domain/dossier/` | ✅ EXISTS_REUSE | |
| `ExpAuditLogRepository.java` | `domain/audit/` | ✅ EXISTS_REUSE | |
| `ExpDocumentAttachmentRepository.java` | `domain/dossier/` | 🆕 NEW | |
| `ExpDossierTypeRepository.java` | `domain/lov/` | 🆕 NEW | |
| `ExpDigitalSignedRepository.java` | `domain/dossier/` | 🆕 NEW | Nếu làm ký số |

### Enum & Converter (`common/.../common/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierStatus.java` | `common/enums/` | 🆕 NEW | 11 trạng thái OPEX (GAP-2) — tách khỏi enum CAPEX |
| `OpexDossierStatusConverter.java` | `common/converter/` | 🆕 NEW | |
| `DossierStatus.java` / `DossierStatusConverter.java` | `common/enums|converter/` | 🔧 EXISTS_MODIFY (nếu hợp nhất) | ⚠️ HIGH regression — ưu tiên KHÔNG sửa |
| `ActionRole.java` / `ActionRoleConverter.java` | `common/enums|converter/` | ✅ EXISTS_REUSE | MAKER/CHECKER/APPROVER khớp |

### DTO Layer (`application/.../application/dossier/dto/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierCreateRequest.java` | `dossier/dto/` | 🆕 NEW | treasuryCode required, bỏ project* (GAP-6) |
| `DossierDraftRequest.java` | `dossier/dto/` | 🔧 EXISTS_MODIFY | Bỏ ràng buộc dossierId (GAP-7) |
| `DossierUpdateRequest.java` | `dossier/dto/` | 🔧 EXISTS_MODIFY | Khớp contract (version, org, treasury, sendDate) |
| `DeleteDossierRequest.java`, `ApproveRequest.java`, `RejectRequest.java` | `dossier/dto/` | ✅ EXISTS_REUSE | Khớp contract |
| `DocumentCreateRequest`/`UpdateDocumentRequest` | `dossier/dto/` | 🔧 EXISTS_MODIFY | Bỏ documentNo (GAP-9); currencyCode bỏ (GAP-10) |
| `DossierDetailDto`/`SummaryDto`/`DocumentDetailDto`/`AttachmentInfoDto`/`ApprovalLogEntryDto`/`WorkflowActionResult` | `dossier/dto/` | ✅ EXISTS_REUSE / 🔧 nhẹ | Đối chiếu field contract (statusCounts, fStatusName) |
| `DossierSearchDto.java` | `dossier/dto/` | 🔧 EXISTS_MODIFY | Thêm checkedBy/approvedBy (GAP-8) |
| `ExportJob.java` | `dossier/dto/` | 🆕 NEW | Export (out-of-scope) |

### Service Layer (`application/.../application/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `DossierService.java` | `dossier/service/` | 🔧 EXISTS_MODIFY | Nhánh OPEX (GAP-6/8); ⚠️ MEDIUM regression |
| `DossierDraftService.java` | `dossier/service/` | 🔧 EXISTS_MODIFY | Tạo skeleton khi lưu nháp (GAP-7) |
| `OpexDossierWorkflowService.java` | `dossier/service/` | 🆕 NEW | 7 transition + SoD (GAP-3) |
| `DocumentService.java` | `dossier/service/` | 🔧 EXISTS_MODIFY | Sinh DOCUMENT_NO (GAP-9) |
| `AttachmentService.java` | `dossier/service/` | 🔧 EXISTS_MODIFY | upload/download + document-level (GAP-4) |
| `AuditLogService.java` | `audit/service/` | ✅ EXISTS_REUSE (đọc) | |
| `AuditLogWriter.java` | `audit/service/` | 🆕 NEW | Ghi log mutation (GAP-12) |
| `LovService.java` | `lov/service/` | 🔧 EXISTS_MODIFY | dossier-types/currencies/users (GAP-11) |
| `FileStorageService.java` | `dossier/service/` (hoặc common) | 🆕 NEW | Out-of-scope lưu/scan file |
| `ExportService.java` | `dossier/service/` | 🆕 NEW | Out-of-scope export |

### Mapper Layer (`application/.../application/dossier/mapper/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `DossierMapper`, `DocumentMapper`, `AttachmentMapper`, `ApprovalLogMapper` | `dossier/mapper/` | 🔧 EXISTS_MODIFY nhẹ | Bổ sung field contract (fStatusName, statusCounts) |
| `LovMapper`, `AuditLogMapper` | `lov|audit/mapper/` | ✅ EXISTS_REUSE | |

### Controller Layer (`api/.../api/`)
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierController.java` | `dossier/opex/` | 🆕 NEW | `/exp/opex/dossiers**` (GAP-1) — không sửa CAPEX controller |
| `OpexWorkflowController.java` | `dossier/opex/` | 🆕 NEW | 7 endpoint workflow |
| `OpexDocumentController.java` | `dossier/opex/` | 🆕 NEW (hoặc tái dùng path) | documents CRUD |
| `OpexAttachmentController.java` | `dossier/opex/` | 🆕 NEW | dossier + document attachments, upload/download |
| `AuditController.java` | `audit/` | 🔧 EXISTS_MODIFY | thêm approval-log/audit-log path OPEX nếu cần |
| `LovController.java` | `lov/` | 🔧 EXISTS_MODIFY | thêm dossier-types/currencies/users |
| `ExportController.java` | `dossier/opex/` | 🆕 NEW | Out-of-scope |
| Controller CAPEX hiện có | `dossier/` | ✅ EXISTS_REUSE (không đụng) | giữ nguyên để bảo toàn CAPEX |

### Config / Out-of-Scope
| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `SecurityConfig` / JWT resolver | `api` hoặc `common/config/` | 🆕 NEW (Out-of-scope) | claim userId/role/treasuryCode, SoD (GAP-3,5,15) |
| `AuditorAware` config | `common/config/` | 🔧 EXISTS_MODIFY / xác nhận | non-null để tránh ORA-01400 (GAP-5) |
| `FileStorageConfig` | `common/config/` | 🆕 NEW (Out-of-scope) | path, max size |

---

## ✅ Impact Analysis Generated: file/impact.md

### Stats
- ~24 endpoint In-Scope → đủ điều kiện sinh/sửa code (CRUD, draft, workflow, list, document, log, LOV cốt lõi)
- 9 hạng mục Out-of-Scope → JWT/SoD, lưu/scan file, document-attachment table, export, ký số, ghi audit-log, sinh mã/hash/SLA, currencies, users
- 5 CRITICAL gaps → namespace OPEX/CAPEX, state machine, workflow 7 bước, attachment upload + document-attachment entity, audit columns NOT NULL
- 6 DECISION_NEEDED gaps → create request, draft FK, filter list, DOCUMENT_NO, currencyCode, LOV thiếu
- 7 IMPLEMENTATION_NOTE → audit write, HASH_INFO, SLA, assignUser, digital-signed drift, export, version
- ~14 artifact EXISTS_REUSE → entity/repo LOV, approval-log, audit đọc, ActionRole
- ~16 artifact EXISTS_MODIFY → ⚠️ regression CAPEX (3 HIGH)
- ~10 files NEW → OPEX status/workflow/controller, document-attachment, dossier-type LOV, audit writer, file storage, export
- 3 rủi ro HIGH / 5 MEDIUM → re-test toàn bộ CAPEX trước merge

### Bước tiếp theo
1. **Chốt GAP-1 + GAP-2 trước tiên** (namespace + state machine) — quyết định toàn bộ kiến trúc OPEX
2. Review danh sách EXISTS_REUSE / EXISTS_MODIFY / NEW — xác nhận chiến lược "cô lập OPEX, tái dùng entity"
3. Review mục Tác động — chốt kế hoạch re-test CAPEX cho 3 HIGH / 5 MEDIUM
4. Điền "Decision" cho từng gap
5. Xác nhận `AuditorAware` non-null (GAP-5) trước khi test create OPEX
6. Dùng phần In-Scope làm input cho `/gen-be-code`
