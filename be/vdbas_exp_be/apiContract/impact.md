# Impact Analysis: api-contract.yaml ↔ DOSSIER.sql

**Generated:** 2026-06-19
**API Version:** 0.2.0 (EXP **OPEX** Dossier Management API)
**Contract:** `apiContract/api-contract.yaml` · **DDL:** `apiContract/DOSSIER.sql`
**Codebase:** multi-module hexagonal, base package `com.fis.vdbas.exp` (modules `domain` / `application` / `common` / `api`)

> ## ⚠️ KẾT LUẬN BAO TRÙM — "EXISTS_REUSE giả" toàn cục
> Toàn bộ feature **ĐÃ tồn tại trong code, nhưng được viết cho biến thể anh em CAPEX**, không phải OPEX của contract này:
> - Controllers map `/api/v1/exp/**capex**/dossiers/**` — contract yêu cầu `/api/v1/exp/**opex**/dossiers/**` (D1).
> - State machine code gộp **3 bước** (submit → approve[checker] → approve[approver]) — contract tách **7 transition** Maker–Checker–Approver + SoD (D3).
> - Enum `DossierStatus` code có **8 giá trị** (DRAFT/SAVED/VALIDATED/SUBMITTED/APPROVED/REJECTED/COMPLETED/CANCELLED) — contract có **11 giá trị** khác hẳn (PENDING_CHECKER/CHECKED/APPROVAL_PENDING/...); converter `valueOf()` **crash runtime** khi đọc giá trị OPEX (D2).
> - Constant hardcode `CAPEX_WORKFLOW_CODE="CAPEX_STANDARD"`, `CAPEX_DOSSIER_TYPE_CODE="CAPEX"`, `DOSSIER_CODE = "EXP/CAPEX/TEMP/..."` (stub), `assignUser="SYSTEM"`, `nextAssignee()→"SYSTEM"`.
>
> **Theo Nguyên tắc tối thượng (bảo toàn tính năng CAPEX đang chạy): KHÔNG sửa controller/service/enum của CAPEX.** Xây OPEX như **biến thể cô lập (NEW)**: controller/service/DTO mới dưới `/exp/opex`, **tái dùng** entity + repository + LOV (bảng `EXP_DOSSIER` dùng chung CAPEX/OPEX). Riêng enum `DossierStatus` + converter dùng chung trên entity `ExpDossier` → phải mở rộng **cộng thêm** (xem GAP-02), đây là điểm bắt buộc chạm shared-code.

## Tóm tắt

| Hạng mục | Số lượng |
|----------|----------|
| Bảng DB phân tích | 20 |
| YAML Schemas phân tích | 30 |
| Columns đã mapping khớp (entity dùng chung) | ~70 |
| **Endpoint In-Scope** | **30** |
| **Hạng mục Out-of-Scope** | **9** |
| **CRITICAL gaps** | **7** |
| **DECISION_NEEDED gaps** | **5** |
| IMPLEMENTATION_NOTE gaps | 6 |
| Artifact đã có — dùng lại (EXISTS_REUSE) | 14 |
| **Artifact reuse rủi ro (EXISTS_REUSE_RISKY — biến thể CAPEX / stub)** | **11** |
| Artifact đã có — phải sửa (EXISTS_MODIFY) | 4 |
| **Files cần tạo mới (NEW)** | **~22** |
| **Rủi ro regression HIGH / MEDIUM** | **3 / 5** |

## ✅ QUYẾT ĐỊNH ĐÃ CHỐT (2026-06-19)

| # | Quyết định | Chọn |
|---|-----------|------|
| **D1/D3/D4** | Chiến lược OPEX | 🟢 **Cô lập hoàn toàn (NEW)** — controller/service/DTO OPEX mới dưới `/exp/opex`; KHÔNG đụng CAPEX; tái dùng entity/repo/LOV |
| **D2** | Enum `DossierStatus` | 🟢 **Mở rộng union + seed** — thêm 9 hằng OPEX (additive) + case `labelOf()` + seed `COMMON_STATUS` + try-catch converter |
| **MVP** | Phạm vi | 🟢 **Chỉ CRUD + Workflow + LOV** — KHÔNG làm: upload/download file, attachment cấp chứng từ, export (để MVP+1) |
| **D4** | `documentNo` / `DOSSIER_CODE` | 🟢 **Backend sinh** — bỏ `@NotBlank documentNo`, sinh `[code]-[type]-[####]`; DOSSIER_CODE generator OPEX (bỏ stub CAPEX/TEMP) |
| **D7** | Soft-delete OPEX | 🟢 **`softDeleteOpex()` set `DELETED`** — không sửa `softDelete()` CAPEX (giữ CANCELLED) |
| **GAP-09** | `originalAmount` | 🟢 **Bắt buộc (NOT NULL)** — validate ở DTO/service OPEX |
| **GAP-08** | `currencyCode` | 🟢 **Không persist** — `/lov/currencies` trả tĩnh VND/USD |

## Checklist trước khi sinh code

- [x] Đã review Scope / Out-of-Scope
- [x] Đã chạy 7 detector ngữ nghĩa (STEP 1C) — `EXISTS_REUSE_RISKY` được giải quyết bằng hướng cô lập (không reuse, tạo NEW)
- [x] **Đã chốt namespace D1** → tách controller OPEX, KHÔNG đổi CAPEX
- [x] **Đã chốt enum D2** → mở rộng `DossierStatus` thành union + seed
- [x] **Đã chốt state machine D3** → xây `OpexDossierWorkflowService` 7 transition mới
- [x] Tất cả CRITICAL gaps đã có quyết định (GAP-01..07 — xem block trên + Q&A)
- [x] Tất cả DECISION_NEEDED gaps đã có quyết định (GAP-08..12)
- [x] Đã review danh sách EXISTS_REUSE / EXISTS_REUSE_RISKY / EXISTS_MODIFY / NEW (STEP 1B)
- [x] Đã review mục Tác động lên code & chức năng cũ (STEP 7B)
- [x] Có kế hoạch re-test cho mọi rủi ro MEDIUM (smoke test toàn bộ luồng CAPEX sau khi mở rộng enum/DTO)
- [ ] ⚠️ **CÒN LẠI: xác nhận `AuditorAware` trả non-null `createdBy`** (GAP-06) — phải kiểm tra trong module chạy trước POST đầu tiên; tạm fallback `"SYSTEM"` nếu chưa có JWT
- [x] Package gốc đã xác nhận (`com.fis.vdbas.exp`)

---

# Phạm vi triển khai (Scope)

## ✅ In-Scope — Mapping bao trùm (sinh code chạy được với DB sẵn có)

| Nhóm chức năng | Endpoint / Entity liên quan | Cơ sở mapping | Mức độ sẵn sàng |
|----------------|------------------------------|----------------|-----------------|
| CRUD hồ sơ OPEX | `GET/POST/PUT/DELETE /exp/opex/dossiers[/{id}]` ↔ `EXP_DOSSIER` | Entity + repo + bảng map đầy đủ (dùng chung CAPEX) | ✅ Sinh được (controller/service OPEX mới) |
| Lưu nháp | `POST /exp/opex/dossiers/drafts` ↔ `EXP_DOSSIER_DRAFT` | Entity + repo có sẵn | ✅ Sinh được (lưu ý serialize JSON, GAP IMPL) |
| Copy hồ sơ | `POST /exp/opex/dossiers/{id}/copy` | Logic copy header có sẵn (CAPEX) | ✅ Sinh được (cần copy cả documents — IMPL) |
| Workflow chuyển trạng thái | `submit/check/check-reject/check-return/approve/approve-reject/approve-cancel` ↔ cột `F_STATUS` + `EXP_APPROVAL_LOG` | Update cột trạng thái + ghi log; bảng đủ | ✅ Sinh được (state machine OPEX mới — GAP-03) |
| CRUD chứng từ | `GET/POST/PUT/DELETE /exp/opex/dossiers/{id}/documents[/{docId}]` ↔ `EXP_DOCUMENT` | Entity + repo + service có sẵn | ✅ Sinh được |
| Approval log | `GET /exp/opex/dossiers/{id}/approval-log` ↔ `EXP_APPROVAL_LOG` | Entity + repo + mapper có sẵn | ✅ Sinh được |
| Audit log (đọc) | `GET /exp/opex/dossiers/{id}/audit-log` ↔ `EXP_AUDIT_LOG` | Entity + repo + service có sẵn | ✅ Sinh được (đọc; ghi log là IMPL) |
| Attachment metadata (list/delete) | `GET/DELETE /exp/opex/dossiers/{id}/attachments[/{attId}]` ↔ `EXP_DOSSIER_ATTACHMENT` | Entity + repo + service có sẵn | ✅ Sinh được (metadata; lưu/đọc file out-of-scope) |
| LOV danh mục | `/lov/organizations,/treasuries,/data-sources,/document-types,/attachment-types,/dossier-types` ↔ bảng danh mục | Entity + repo + service có sẵn (3 endpoint còn thiếu — GAP IMPL) | ✅ Sinh được |
| Lọc/sắp xếp/phân trang list | `GET /exp/opex/dossiers` (filter dossierCode/date/fStatus/source/maker...) | Cột có thật trong `EXP_DOSSIER`; `DossierSearchDto` có sẵn | ✅ Sinh được |

## ⚠️ Out-of-Scope — Ngoài phạm vi mapping (cần bổ sung thủ công)

| Hạng mục | Endpoint / Field liên quan | Vì sao ngoài scope | Hướng xử lý đề xuất |
|----------|----------------------------|--------------------|---------------------|
| Trích xuất claim JWT | Toàn bộ endpoint (scope theo `treasuryCode`, `createdBy`, role MAKER/CHECKER/APPROVER, SoD BIZ-001) | YAML chỉ khai báo `securitySchemes`, không có cách lấy claim; **không có `SecurityConfig` trong repo** | Dựng `SecurityConfig` + `AuditorAware` lấy user từ JWT; hiện code hardcode `"SYSTEM"` |
| Lưu & quét file đính kèm | `POST /...attachments` (upload), `GET /...attachments/{attId}` (download binary) | DB chỉ chứa metadata + `FILE_PATH`; cần lưu vật lý + virus scan + magic-byte (VAL-09/VAL-20) | Hiện thực `FileStorage`; controller hiện đánh dấu TODO out-of-scope |
| Attachment cấp chứng từ | `/exp/opex/dossiers/{id}/documents/{docId}/attachments/**` (4 endpoint) | **Chưa có entity `ExpDocumentAttachment`** dù DDL có bảng `EXP_DOCUMENT_ATTACHMENT`; ExpDocument note "MVP+1 DEC-05" | Tạo entity/repo/controller mới khi vào scope |
| Export Excel/PDF/CSV | `GET /exp/opex/dossiers/export[/{jobId}]` | Cần thư viện + template + job async; không suy ra từ schema | Hiện thực `ExportService` + job store |
| Sinh `DOSSIER_CODE` theo sequence | `POST /dossiers`, `/drafts`, `/copy` | Thuật toán nghiệp vụ; code đang stub `"EXP/CAPEX/TEMP/"+uuid` | Generator riêng theo quy ước OPEX |
| Sinh `DOCUMENT_NO` `[code]-[type]-[####]` | `POST /...documents` | Thuật toán; code nhận từ client (sai contract — GAP-04) | Generator backend |
| `HASH_INFO` khi submit | `POST /...submit` | Hash thuật toán; code TODO | Hiện thực hash JSON tài liệu |
| Ký số | `ApproveRequest.digitalSign` ↔ `EXP_DIGITAL_SIGNED` | Entity chưa hoàn chỉnh (thiếu cột NOT NULL + audit), flow TODO | Out-of-scope MVP |
| Notification/SLA timer | submit/check/approve (notify), `EXP_DOSSIER_SLA` | Tích hợp ngoài + scheduler; entity SLA đang lệch DDL (GAP-05) | Hiện thực riêng |

> **Ghi chú:** Out-of-scope = YAML + SQL không đủ thông tin để generate; dev cần hiện thực hoặc xác nhận đã có sẵn. Phần In-scope đủ điều kiện sinh code biên dịch & chạy với DB hiện có (sau khi resolve CRITICAL gaps).

---

# Q&A Gaps

## CRITICAL

### GAP-01: Namespace lệch — controller CAPEX vs contract OPEX (D1)

**Bảng / Endpoint liên quan:** tất cả `/exp/opex/dossiers/**` / `DossierController`, `DossierDraftController`, `WorkflowController`, `DocumentController`, `AttachmentController`, `AuditController`

**Vấn đề:**
Controller hiện có map `@RequestMapping("/api/v1/exp/capex/dossiers...")`. Contract yêu cầu `/api/v1/exp/opex/dossiers...`. Đây là module **anh em CAPEX**, không phải OPEX.

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> Xây controller OPEX **mới** dưới `/exp/opex` (giữ nguyên CAPEX), hay đổi/tham số hoá controller CAPEX dùng chung?

**Recommendation:**
Tạo **controller OPEX mới** (`OpexDossierController`, `OpexWorkflowController`, ...) dưới `/api/v1/exp/opex/dossiers`. **Không** đổi `@RequestMapping` của CAPEX (sẽ phá API CAPEX đang chạy → HIGH). Reuse service ở tầng dưới chỉ khi nghiệp vụ trùng; với workflow thì tách (GAP-03).

**Decision:** ☑ **CHỐT — Cô lập hoàn toàn (NEW).** Controller/service/DTO OPEX mới dưới `/exp/opex`; KHÔNG đổi CAPEX. Tái dùng entity/repo/LOV.

---

### GAP-02: Enum `DossierStatus` lệch value-set + converter crash runtime (D2)

**Bảng / Endpoint liên quan:** `EXP_DOSSIER.F_STATUS` / `DossierStatus`, `DossierStatusConverter`, `ExpDossier`

**Vấn đề:**
- Code enum (common, **dùng chung trên entity `ExpDossier`**): `DRAFT, SAVED, VALIDATED, SUBMITTED, APPROVED, REJECTED, COMPLETED, CANCELLED` (8).
- Contract: `DRAFT, PENDING_CHECKER, CHECKED, APPROVAL_PENDING, APPROVED, APPROVAL_REJECTED, CHECK_REJECTED, CHECK_CANCELLED, APPROVAL_CANCELLED, REJECTED_BY_CHECKER, DELETED` (11).
- Chỉ khớp `DRAFT, APPROVED` (và `SUBMITTED/REJECTED` chỉ trùng tên, khác ngữ nghĩa).
- `DossierStatusConverter.convertToEntityAttribute()` gọi `DossierStatus.valueOf(dbData.trim())` **không try-catch** → đọc 1 dòng OPEX có `F_STATUS='PENDING_CHECKER'` sẽ **ném IllegalArgumentException**. Vì `ExpDossier` dùng chung, lỗi này **vỡ cả luồng CAPEX** nếu DB lẫn giá trị OPEX.
- `F_STATUS` là FK → `COMMON_STATUS(STATUS_CODE)`: mọi giá trị OPEX phải tồn tại trong `COMMON_STATUS` (seed).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> (a) Mở rộng enum `DossierStatus` dùng chung thành **union** CAPEX+OPEX, hay (b) tạo enum `OpexDossierStatus` riêng? (b) bất khả thi nếu OPEX & CAPEX **cùng** ghi cột `F_STATUS` của **cùng** entity `ExpDossier` (1 field chỉ 1 converter).

**Recommendation:**
Vì entity + cột `F_STATUS` dùng chung → chọn **(a) mở rộng enum cộng thêm** 9 giá trị OPEX còn thiếu (additive, tương thích ngược với CAPEX `valueOf`). **Bắt buộc kèm:**
1. Bổ sung `case` cho `DossierStatus.labelOf()` (switch exhaustive — thêm hằng sẽ **lỗi biên dịch** nếu không thêm case → MEDIUM, bắt ở compile).
2. Seed các `STATUS_CODE` OPEX mới vào `COMMON_STATUS` (FK).
3. Không bắt buộc nhưng nên: bọc try-catch trong converter trả null/UNKNOWN để chống crash dữ liệu lạ.
Tránh đổi/xoá giá trị enum cũ (CAPEX phụ thuộc).

**Decision:** ☑ **CHỐT — (a) Mở rộng enum union + seed.** Thêm 9 hằng OPEX (additive), thêm case `labelOf()`, seed `COMMON_STATUS`, bọc try-catch converter. KHÔNG đổi/xoá hằng CAPEX.

---

### GAP-03: State machine gộp 3 bước không phục vụ contract 7 transition (D3)

**Bảng / Endpoint liên quan:** `submit/check/check-reject/check-return/approve/approve-reject/approve-cancel` / `DossierWorkflowService`

**Vấn đề:**
`DossierWorkflowService` (CAPEX) chỉ có: `submit()` (SAVED/VALIDATED→SUBMITTED), `approve()` (switch gộp: SUBMITTED→APPROVED[checker], APPROVED→COMPLETED[approver]), `reject()` (→REJECTED), `copy()`. Endpoint `/reject` generic **không có trong contract**. Thiếu hẳn: `check-return` (→DRAFT), `approve-cancel` (→CHECKED), và `check-reject`/`approve-reject` tách biệt với trạng thái riêng. Không có kiểm SoD (BIZ-001).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> Xây `OpexDossierWorkflowService` mới với 7 transition đúng contract, hay mở rộng service CAPEX?

**Recommendation:**
Tạo **`OpexDossierWorkflowService` mới** (cô lập). Map đúng:
`submit`: DRAFT/REJECTED_BY_CHECKER→PENDING_CHECKER (+HASH_INFO) · `check`: PENDING_CHECKER→CHECKED/APPROVAL_PENDING · `check-reject`: PENDING_CHECKER→CHECK_REJECTED · `check-return`: PENDING_CHECKER→DRAFT · `approve`: CHECKED/APPROVAL_PENDING→APPROVED · `approve-reject`: CHECKED→APPROVAL_REJECTED · `approve-cancel`: APPROVAL_PENDING→CHECKED. **Không** sửa `approve()`/`reject()` CAPEX (HIGH regression). Mỗi transition ghi `EXP_APPROVAL_LOG`.

**Decision:** ☑ **CHỐT — Xây `OpexDossierWorkflowService` mới (7 transition).** KHÔNG sửa `DossierWorkflowService` CAPEX.

---

### GAP-04: Request DTO thiếu field required & lệch quy ước backend-gen (D4)

**Bảng / Endpoint liên quan:** `DossierCreateRequest`, `DossierUpdateRequest`, `AddDocumentRequest`, `ApproveRequest`, `SubmitRequest`

**Vấn đề:**
- `DossierCreateRequest`: **thiếu `treasuryCode`** (contract required). Code có `dossierTypeCode`/`projectCode` (CAPEX); contract OPEX `required: [organizationCode, treasuryCode, sendDate, dataSourceCode]`.
- `DossierUpdateRequest`: **thiếu `organizationCode` & `treasuryCode`** (contract required `[version, organizationCode, treasuryCode, sendDate]`).
- `AddDocumentRequest`: **thiếu `treasuryCode`** (required); có `documentNo` `@NotBlank` nhưng contract nói **backend-gen** (không nhận từ client).
- `ApproveRequest.reason`: code `@NotBlank` (bắt buộc) nhưng contract **optional**.
- `SubmitRequest.version`: code yêu cầu nhưng contract submit **không có request body**.

**Mức độ:** `CRITICAL` (thiếu field required); phần backend-gen là `DECISION_NEEDED`.

**Câu hỏi:**
> Tạo DTO OPEX riêng (`OpexDossierCreateRequest`...) hay thêm field nullable vào DTO dùng chung? `documentNo` nhận từ client hay backend sinh?

**Recommendation:**
Vì DTO đang dùng cho CAPEX (sửa required có thể phá CAPEX) → **tạo DTO OPEX mới** đúng `required` của contract, hoặc nếu dùng chung thì chỉ **thêm field nullable** (additive). `documentNo`/`documentName`: **backend sinh** (bỏ `@NotBlank`, đánh read-only). `ApproveRequest.reason`: với OPEX để optional.

**Decision:** ☑ **CHỐT — Tạo DTO OPEX mới** (`OpexDossierCreateRequest/UpdateRequest/DraftRequest`, `OpexAddDocumentRequest`) đúng `required` contract. `documentNo` & `DOSSIER_CODE` **backend sinh** (bỏ `@NotBlank`). `ApproveRequest` OPEX để `reason` optional.

---

### GAP-05: `ExpDossierSla` map sai cột — thiếu cột NOT NULL, thừa cột không tồn tại (D5/D6)

**Bảng / Endpoint liên quan:** `EXP_DOSSIER_SLA` / `ExpDossierSla`

**Vấn đề:**
DDL `EXP_DOSSIER_SLA` có NOT NULL: `ACTION_ROLE, ACTION_USER, SLA, IS_NOTIFY`. Entity **thiếu** `ACTION_ROLE`, `ACTION_USER`, `IS_NOTIFY` (→ ORA-01400 khi insert), `SLA` nullable; lại **thừa** field `stateCode`(STATE_CODE) và `assignUser`(ASSIGN_USER) **không có** trong bảng này → schema-drift.

**Mức độ:** `CRITICAL` (nếu có insert SLA); hiện chưa dùng nên chưa nổ.

**Câu hỏi:**
> SLA timer có nằm trong scope OPEX MVP không? Nếu có, sửa entity cho khớp DDL.

**Recommendation:**
SLA là Out-of-Scope MVP (xem Scope). Nếu vào scope: sửa `ExpDossierSla` map đúng `ACTION_ROLE/ACTION_USER/IS_NOTIFY/SLA`, bỏ field thừa. Entity này hiện **không** được feature khác dùng → sửa an toàn (LOW/MEDIUM).

**Decision:** ☑ **CHỐT — Out-of-Scope MVP** (MVP chỉ CRUD+Workflow+LOV). Không chạm `ExpDossierSla` lần này; xử lý ở MVP+1 khi làm SLA timer.

---

### GAP-06: Audit `CREATED_BY/UPDATED_BY` NOT NULL không có nguồn ghi (D6)

**Bảng / Endpoint liên quan:** mọi bảng có `CREATED_BY/UPDATED_BY/CREATED_DATE/UPDATED_DATE NOT NULL` / `AbstractAuditing`, `ExpAuditing`

**Vấn đề:**
`AbstractAuditing` dùng `@CreatedBy/@LastModifiedBy` (cần bean `AuditorAware<String>`). **Grep toàn repo không thấy `AuditorAware` / `@EnableJpaAuditing`.** Nếu không cấu hình, `createdBy/updatedBy` = null → vỡ `ORA-01400` cho `CREATED_BY/UPDATED_BY NOT NULL` ở **mọi** POST (đã ghi nhận ở memory exp-audit-column-drift). Ngoài ra `AbstractAuditing` map cột `created_at/updated_at` **không tồn tại** trong DDL OPEX (DDL chỉ có `CREATED_DATE/UPDATED_DATE`, đã được `ExpAuditing` override) → cần xác nhận `created_at/updated_at` được loại trừ.

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> Có `AuditorAware` trả non-null (từ JWT/SecurityContext) ở module chạy không? `created_at/updated_at` có bị Hibernate map vào DDL không có cột?

**Recommendation:**
Xác nhận/khai báo `AuditorAware` trả user hiện tại (tạm `"SYSTEM"` nếu chưa có JWT). Đảm bảo `@EnableJpaAuditing` bật. Kiểm tra mapping `created_at/updated_at` (drift) — nếu Hibernate ddl-validate sẽ fail.

**Decision:** ⚠️ **CẦN XÁC NHẬN trước POST đầu tiên** — khai báo `AuditConfig` + `AuditorAware<String>` (fallback `"SYSTEM"` nếu chưa tích hợp JWT) và `@EnableJpaAuditing`. Đây là item checklist còn lại duy nhất.

---

### GAP-07: Soft-delete set sai trạng thái — `CANCELLED` thay vì `DELETED` (D7)

**Bảng / Endpoint liên quan:** `DELETE /exp/opex/dossiers/{id}` / `ExpDossierRepository.softDelete()`

**Vấn đề:**
`ExpDossierRepository.softDelete()` là `@Modifying @Query("UPDATE ExpDossier d SET d.status=0, d.fStatus=DossierStatus.CANCELLED WHERE d.id=:id")`. Contract OPEX yêu cầu `F_STATUS=DELETED`. Query này **dùng chung** — nếu OPEX gọi sẽ set `CANCELLED` (sai); nếu sửa cứng sang `DELETED` sẽ **phá CAPEX** (đang phụ thuộc CANCELLED).

**Mức độ:** `CRITICAL`

**Câu hỏi:**
> Tạo `softDeleteOpex()` set `DELETED` riêng, hay tham số hoá trạng thái đích?

**Recommendation:**
Thêm **method mới** `softDeleteWithStatus(id, status)` hoặc `softDeleteOpex(id)` set `DELETED` (additive, không đụng `softDelete()` cũ). Cần seed `DELETED` vào `COMMON_STATUS` (GAP-02).

**Decision:** ☑ **CHỐT — Thêm `softDeleteOpex()` set `DELETED`.** Giữ nguyên `softDelete()` CAPEX (CANCELLED). Seed `DELETED` vào `COMMON_STATUS`.

---

## DECISION_NEEDED

### GAP-08: `currencyCode` trong contract không có cột DDL

**Bảng / Endpoint liên quan:** `EXP_DOCUMENT` / `DocumentCreateRequest.currencyCode`, `/lov/currencies`

**Vấn đề:** Contract có `currencyCode` (và endpoint `/lov/currencies`) nhưng `EXP_DOCUMENT` **không có cột `CURRENCY_CODE`** (contract đã tự note "VERIFY: not in DDL").

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:**
> `currencyCode` là computed/không lưu, hay cần ALTER bảng thêm cột?

**Recommendation:** MVP: bỏ qua persist `currencyCode` (chỉ nhận-bỏ hoặc loại khỏi DTO OPEX). `/lov/currencies` trả tĩnh VND/USD. Nếu cần lưu → ALTER `EXP_DOCUMENT ADD CURRENCY_CODE`.

**Decision:** ☑ **CHỐT — Không persist `currencyCode`** (loại khỏi DTO OPEX). `/lov/currencies` trả tĩnh VND/USD. Không ALTER bảng.

---

### GAP-09: `ExpDocument.originalAmount` nullable vs DDL NOT NULL

**Bảng / Endpoint liên quan:** `EXP_DOCUMENT.ORIGINAL_AMOUNT` / `ExpDocument`

**Vấn đề:** Entity `private Long originalAmount;` (nullable, theo note DEC-02 "VND-only") nhưng DDL `ORIGINAL_AMOUNT NUMBER(18) NOT NULL` → insert null vỡ ORA-01400. Contract đánh `originalAmount` **required**.

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:** OPEX có cho `originalAmount` null không? Contract nói required.

**Recommendation:** Với OPEX theo contract → bắt buộc `originalAmount` (NOT NULL). Validate ở DTO OPEX. Không đổi entity (để CAPEX giữ nullable nếu cần), enforce ở tầng service/DTO.

**Decision:** ☑ **CHỐT — `originalAmount` bắt buộc (NOT NULL) cho OPEX.** Enforce `@NotNull` ở `OpexAddDocumentRequest`/service. Không đổi entity dùng chung.

---

### GAP-10: `ExpApprovalLog.actionUserName` — cột chưa có trong DDL

**Bảng / Endpoint liên quan:** `EXP_APPROVAL_LOG` / `ExpApprovalLog.actionUserName` (ACTION_USER_NAME)

**Vấn đề:** Entity có `@Column(name="ACTION_USER_NAME")` (note DEC-07 "chờ DDL ALTER") nhưng DDL **không có** cột này → schema-drift, vỡ nếu ddl-validate.

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:** ALTER `EXP_APPROVAL_LOG ADD ACTION_USER_NAME`, hay bỏ field (đổi sang `@Transient`/JOIN lookup)?

**Recommendation:** MVP: đánh `@Transient` (suy ra qua LOV user) để khỏi drift; hoặc ALTER bảng nếu cần persist tên hiển thị.

**Decision:** ☑ **CHỐT — đánh `@Transient`** (suy ra runtime), tránh schema-drift. Không ALTER bảng ở MVP.

---

### GAP-11: LOV `/dossier-types`, `/currencies`, `/users` chưa có endpoint

**Bảng / Endpoint liên quan:** `/lov/dossier-types` ↔ `EXP_DOSSIER_TYPE`, `/lov/currencies`, `/lov/users`

**Vấn đề:** `LovController` thiếu 3 method này (có sẵn organizations/treasuries/data-sources/document-types/attachment-types + extra projects). `users` backed by identity provider (không bảng), `currencies` không bảng.

**Mức độ:** `DECISION_NEEDED`

**Câu hỏi:** `/lov/users` lấy từ đâu (IDP)? `/lov/currencies` tĩnh?

**Recommendation:** Thêm `lovDossierTypes` (đọc `EXP_DOSSIER_TYPE` — có entity `ExpDossierType`? nếu chưa, tạo). `currencies` trả tĩnh. `users` Out-of-Scope (IDP) — stub/đợi tích hợp.

**Decision:** ☑ **CHỐT — Thêm `lovDossierTypes` (đọc `EXP_DOSSIER_TYPE`) + `lovCurrencies` (tĩnh VND/USD)** vào `LovController`/`LovService` (additive). `lovUsers` Out-of-Scope (đợi IDP).

---

### GAP-12: `SLA`/`actionDate` kiểu `LocalDateTime` vs DDL `DATE`

**Bảng / Endpoint liên quan:** `EXP_DOSSIER.SLA`, `EXP_APPROVAL_LOG.ACTION_DATE`, `ExpDossier`, `ExpApprovalLog`

**Vấn đề:** DDL `DATE` (Oracle DATE có cả giờ, OK) map `LocalDateTime`. Hoạt động được nhưng lệch precision với các cột date-only (`SEND_DATE`/`COMPLETED_DATE` đã đúng `LocalDate`).

**Mức độ:** `DECISION_NEEDED` (không block).

**Recommendation:** Giữ `LocalDateTime` cho SLA/actionDate (cần giờ). Không đổi.

**Decision:** ☑ **CHỐT — Giữ nguyên `LocalDateTime`.** Không đổi (Oracle DATE chứa cả giờ).

---

## IMPLEMENTATION_NOTE

- **GAP-13 — `DOSSIER_CODE` generator:** code stub `"EXP/CAPEX/TEMP/"+uuid` (`DossierService:177`, `DossierWorkflowService:137`). OPEX cần generator theo sequence/quy ước OPEX, không hardcode CAPEX.
- **GAP-14 — `DOCUMENT_NO` generator:** contract `[dossierCode]-[documentTypeCode]-[#### từ 0001]`; code chưa sinh (nhận client). Cần generator + auto-fill `DOCUMENT_NAME` từ LOV.03 (`DocumentService:63` đang tạm dùng `documentNo`).
- **GAP-15 — Ghi `EXP_AUDIT_LOG`:** insert/update/delete đều TODO (`DossierService:151/194/203`). Cần ghi oldValue→newValue (BIZ-007) — `AuditLogService` đã có để đọc.
- **GAP-16 — Draft serialize JSON:** `DossierDraftService:37` dùng `String.valueOf(request)` thay vì JSON (Jackson). Cần serialize chuẩn để khôi phục nháp.
- **GAP-17 — Copy kèm documents:** `DossierWorkflowService:139` copy mới chỉ header, chưa copy `EXP_DOCUMENT` con.
- **GAP-18 — `seqNo`/`statusCounts`/`totalBaseAmount`:** computed runtime (`@Transient seqNo` qua ROW_NUMBER; `statusCounts` group-by; tổng tiền qua `sumBaseAmountByDossierId`) — ghi chú khi implement list/detail.

---

# Column → Entity Mapping

## EXP_DOSSIER → ExpDossier  *(EXISTS_REUSE — bảng dùng chung CAPEX/OPEX)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="id", updatable=false)` | PK |
| TREASURY_CODE | VARCHAR2(100) | NOT NULL | treasuryCode | String | `@Column(length=100)` | FK COMMON_TREASURY |
| TREASURY_NAME | NVARCHAR2(500) | NOT NULL | treasuryName | String | `@Column(length=500)` | auto-fill từ LOV |
| DOSSIER_TYPE_CODE | VARCHAR2(100) | NOT NULL | dossierTypeCode | String | `@Column(length=100)` | OPEX cố định "OPEX"; immutable VAL-17 |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column(updatable=false)` | backend-gen (GAP-13) |
| VERSION | NUMBER(3) | NOT NULL | version | Integer | `@Version @Column` | optimistic lock VAL-15 |
| SEND_DATE | DATE | NOT NULL | sendDate | LocalDate | `@Column` | |
| PROJECT_CODE | VARCHAR2(100) | NULL | projectCode | String | `@Column(length=100)` | CAPEX-only; null cho OPEX (CHK_DOSSIER_PROJECT) |
| PROJECT_NAME | NVARCHAR2(500) | NULL | projectName | String | `@Column` | |
| PROJECT_SPECIFIC_CODE | VARCHAR2(100) | NULL | projectSpecificCode | String | `@Column` | CAPEX-only |
| PROJECT_SPECIFIC_NAME | NVARCHAR2(500) | NULL | projectSpecificName | String | `@Column` | |
| ORGANIZATION_CODE | VARCHAR2(100) | NOT NULL | organizationCode | String | `@Column(length=100)` | FK COMMON_ORGANIZATION |
| ORGANIZATION_NAME | NVARCHAR2(500) | NOT NULL | organizationName | String | `@Column` | auto-fill |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column` | hiệu lực 0/1 (soft-delete flag) |
| F_STATUS | VARCHAR2(100) | NOT NULL | fStatus | DossierStatus | `@Convert(DossierStatusConverter) @Column` | ⚠️ enum lệch — GAP-02; FK COMMON_STATUS |
| WORKFLOW_CODE | VARCHAR2(100) | NOT NULL | workflowCode | String | `@Column` | FK EXP_WORKFLOW; CAPEX hardcode "CAPEX_STANDARD" |
| DATA_SOURCE_CODE | VARCHAR2(100) | NOT NULL | dataSourceCode | String | `@Column` | FK EXP_DATA_SOURCE; immutable VAL-17 |
| ASSIGN_USER | VARCHAR2(100) | NOT NULL | assignUser | String | `@Column` | backend; code stub "SYSTEM" |
| SLA | DATE | NOT NULL | sla | LocalDateTime | `@Column` | GAP-12 |
| HASH_INFO | VARCHAR2(2000) | NULL | hashInfo | String | `@Column(length=2000)` | set khi submit (GAP TODO) |
| COMPLETED_DATE | DATE | NULL | completedDate | LocalDate | `@Column` | |
| CREATED_BY | VARCHAR2(100) | NOT NULL | createdBy | String | `@CreatedBy` (AbstractAuditing) | ⚠️ GAP-06 nguồn ghi |
| CREATED_DATE | DATE | NOT NULL | createdDate | LocalDateTime | `@CreatedDate @Column(name="CREATED_DATE")` (ExpAuditing) | override legacy col |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | updatedBy | String | `@LastModifiedBy` | ⚠️ GAP-06 |
| UPDATED_DATE | DATE | NOT NULL | updatedDate | LocalDateTime | `@LastModifiedDate @Column(name="UPDATED_DATE")` | |

### Chú ý implement:
- `created_at/updated_at` (từ AbstractAuditing) **không có** cột trong DDL → xác nhận loại trừ (GAP-06).
- OPEX: `dossierTypeCode='OPEX'`, `projectCode=null` (ràng buộc CHECK), `workflowCode` không dùng "CAPEX_STANDARD".

## EXP_DOCUMENT → ExpDocument  *(EXISTS_REUSE)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id` | |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column` | FK EXP_DOSSIER |
| TREASURY_CODE | VARCHAR2(100) | NOT NULL | treasuryCode | String | `@Column` | từ DTO (GAP-04 thiếu) |
| TREASURY_NAME | NVARCHAR2(500) | NOT NULL | treasuryName | String | `@Column` | auto-fill |
| DOCUMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | documentTypeCode | String | `@Column` | FK EXP_DOCUMENT_TYPE |
| DOCUMENT_NAME | NVARCHAR2(500) | NOT NULL | documentName | String | `@Column` | auto-fill LOV.03 (GAP-14) |
| DOCUMENT_NO | VARCHAR2(200) | NOT NULL | documentNo | String | `@Column` | backend-gen (GAP-04/14) |
| DOCUMENT_DATE | DATE | NOT NULL | documentDate | LocalDate | `@Column` | |
| ACCOUNTING_DATE | DATE | NOT NULL | accountingDate | LocalDate | `@Column` | POSTING_DATE |
| ORIGINAL_AMOUNT | NUMBER(18) | NOT NULL | originalAmount | Long | `@Column` | ⚠️ entity nullable — GAP-09 |
| BASE_AMOUNT | NUMBER(18) | NOT NULL | baseAmount | Long | `@Column` | VND |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column` | soft-delete flag |
| (—) | — | — | seqNo | Integer | `@Transient` | ROW_NUMBER runtime |
| CREATED_BY/DATE, UPDATED_BY/DATE | | NOT NULL | (audit) | | AbstractAuditing/ExpAuditing | GAP-06 |

## EXP_DOSSIER_ATTACHMENT → ExpDossierAttachment  *(EXISTS_REUSE)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id` | |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column` | FK |
| ATTACHMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | attachmentTypeCode | String | `@Column` | FK |
| FILE_NAME | VARCHAR2(200) | NOT NULL | fileName | String | `@Column` | |
| FILE_TYPE | VARCHAR2(100) | NOT NULL | fileType | String | `@Column` | |
| FILE_SIZE | DECIMAL(18) | NOT NULL | fileSize | Long | `@Column` | |
| FILE_PATH | VARCHAR2(2000) | NOT NULL | filePath | String | `@Column` | **không expose API** |
| DESCRIPTION | NVARCHAR2(2000) | NULL | description | String | `@Column` | |
| (audit) | | NOT NULL | | | ExpAuditing | |

## EXP_APPROVAL_LOG → ExpApprovalLog  *(EXISTS_REUSE)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id` | |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column` | FK |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column` | |
| ACTION_USER | VARCHAR2(100) | NOT NULL | actionUser | String | `@Column` | stub "SYSTEM" |
| (—) | — | — | actionUserName | String | `@Column(name="ACTION_USER_NAME")` | ⚠️ drift — GAP-10 |
| ACTION_ROLE | VARCHAR2(100) | NOT NULL | actionRole | ActionRole | `@Convert(ActionRoleConverter)` | enum khớp ✓ |
| ACTION_DATE | DATE | NOT NULL | actionDate | LocalDateTime | `@Column` | GAP-12 |
| REASON | NVARCHAR2(2000) | NOT NULL | reason | String | `@Column` | |
| STATE_CODE | VARCHAR2(100) | NOT NULL | stateCode | String | `@Column` | |
| PARENT_ID | RAW(16) | NULL | parentId | UUID | `@Column` | |
| (audit) | | NOT NULL | | | ExpAuditing | |

## EXP_DOSSIER_DRAFT → ExpDossierDraft  *(EXISTS_REUSE_RISKY — nullable thiếu)*

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id` | |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column` | ⚠️ entity thiếu `nullable=false` — drift draft (memory) |
| CONTENT | CLOB | NOT NULL | content | String | `@Lob @Column` | serialize JSON (GAP-16) |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column` | default 1 |
| (audit) | | NOT NULL | | | ExpAuditing | |

## EXP_AUDIT_LOG → ExpAuditLog  *(EXISTS_REUSE)* — append-only, `@PrePersist` set timestamp. Khớp DDL.

## Bảng chỉ map LOV/danh mục (EXISTS_REUSE): COMMON_ORGANIZATION/TREASURY/STATUS, EXP_DATA_SOURCE, EXP_DOCUMENT_TYPE, EXP_ATTACHMENT_TYPE, EXP_PROJECT[_SPECIFIC/_TYPE], EXP_WORKFLOW → entity + repo đã có. **EXP_DOSSIER_TYPE** (GAP-11) và **EXP_DOCUMENT_ATTACHMENT** (chưa có entity — NEW khi vào scope).

---

# Tác động lên code & chức năng cũ (regression)

> Feature OPEX chủ yếu **NEW (cô lập)** → tác động code CAPEX tối thiểu. Chỉ 4 artifact dùng chung bị chạm; tất cả đều phải theo hướng **additive**.

| Artifact (file) | Thay đổi cần làm | Chức năng cũ liên quan | Rủi ro phá vỡ | Mức độ | Cách kiểm chứng (regression) |
|-----------------|------------------|------------------------|---------------|--------|------------------------------|
| `common/enums/DossierStatus.java` | **Thêm** 9 hằng OPEX (PENDING_CHECKER, CHECKED, APPROVAL_PENDING, APPROVAL_REJECTED, CHECK_REJECTED, CHECK_CANCELLED, APPROVAL_CANCELLED, REJECTED_BY_CHECKER, DELETED). **Phương án cô lập** bất khả thi (1 field `F_STATUS` dùng chung 1 converter) → buộc mở rộng | Toàn bộ workflow CAPEX (switch `approve()`, `EDITABLE_STATES`, `labelOf()`) | Thêm hằng = additive cho `valueOf`; nhưng `labelOf()` switch exhaustive **lỗi biên dịch** nếu thiếu case | ⚠️ MEDIUM | Build (compile bắt thiếu case); chạy lại luồng CAPEX submit/approve/reject; đọc 1 dossier CAPEX mỗi trạng thái |
| `common/converter/DossierStatusConverter.java` | (Khuyến nghị) bọc try-catch `valueOf` trả null/UNKNOWN | Mọi đọc `ExpDossier` (CAPEX + OPEX) | Chỉ thêm phòng vệ — tương thích ngược | 🟢 LOW | Đọc dossier có F_STATUS hợp lệ vẫn ra đúng enum |
| `domain/dossier/ExpDossierRepository.java` | **Thêm** method `softDeleteOpex(id)`/`softDeleteWithStatus` set `DELETED` (KHÔNG sửa `softDelete()` cũ) | Xoá CAPEX (đang set CANCELLED) | Method mới, không đụng cũ | 🟢 LOW | Xoá 1 dossier CAPEX vẫn ra CANCELLED |
| `COMMON_STATUS` (seed dữ liệu) | Seed 9 `STATUS_CODE` OPEX mới (FK `F_STATUS`) | FK của cả CAPEX/OPEX | Chỉ thêm dòng danh mục | 🟢 LOW | CAPEX vẫn insert/đọc bình thường |
| `api/lov/LovController.java` | **Thêm** `lovDossierTypes/currencies/users` (GAP-11) | LOV hiện có | Chỉ thêm @GetMapping mới | 🟢 LOW | Gọi lại các LOV cũ trả như trước |
| `application/.../DossierMapper`, DTO dùng chung | Nếu chọn dùng chung: chỉ **thêm field nullable** (treasuryCode...) | Create/Update CAPEX | Thêm nullable = an toàn; **đổi required = HIGH** | ⚠️ MEDIUM | Nếu thêm field: test create/update CAPEX. **Khuyến nghị DTO OPEX riêng → LOW** |

### Nếu chọn sai hướng (đối chiếu Nguyên tắc tối thượng) — các thao tác **CẤM** (sẽ thành 🔴 HIGH):
- 🔴 Đổi `@RequestMapping` CAPEX `/exp/capex`→`/exp/opex` (phá API CAPEX). → **Thay bằng:** controller OPEX mới.
- 🔴 Sửa `DossierWorkflowService.approve()` switch để thêm nhánh OPEX (phá state machine CAPEX). → **Thay bằng:** `OpexDossierWorkflowService` mới.
- 🔴 Đổi `softDelete()` set `DELETED` (phá xoá CAPEX). → **Thay bằng:** method mới.
- 🔴 Đổi required/đổi field của DTO CAPEX dùng chung. → **Thay bằng:** DTO OPEX mới.

### Tóm tắt regression
- File phải sửa (EXISTS_MODIFY, additive): **4** (`DossierStatus`, `DossierStatusConverter`, `ExpDossierRepository`, `LovController`) + seed `COMMON_STATUS`.
- Artifact dùng chung bị chạm: 5 (4 trên + entity `ExpDossier` dùng chung nhưng không sửa).
- Rủi ro HIGH: **0** (nếu tuân hướng cô lập) · MEDIUM: **2** (enum, DTO-nếu-dùng-chung) · LOW: **4**.
- Khu vực cần re-test trước khi merge: **toàn bộ luồng CAPEX** (create/draft/submit/approve/reject/copy/delete/list/detail), các LOV cũ, đọc dossier CAPEX mọi trạng thái.

---

# File → Folder Mapping

**Base package:** `com.fis.vdbas.exp`
**Modules:** `domain/` · `application/` · `common/` · `api/` (mỗi module `src/main/java/com/fis/vdbas/exp/...`)
**Nhãn:** ✅ EXISTS_REUSE · ⚠️ EXISTS_REUSE_RISKY · 🔧 EXISTS_MODIFY · 🆕 NEW

### Entity Layer — `domain/.../domain/dossier|audit|lov`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `ExpDossier.java` | domain/dossier | ✅ EXISTS_REUSE | bảng dùng chung; OPEX set type=OPEX, project=null |
| `ExpDocument.java` | domain/dossier | ✅ EXISTS_REUSE | GAP-09 originalAmount |
| `ExpDossierAttachment.java` | domain/dossier | ✅ EXISTS_REUSE | |
| `ExpApprovalLog.java` | domain/dossier | ⚠️ EXISTS_REUSE_RISKY | GAP-10 actionUserName drift |
| `ExpDossierDraft.java` | domain/dossier | ⚠️ EXISTS_REUSE_RISKY | nullable thiếu (drift draft) |
| `ExpAuditLog.java` | domain/audit | ✅ EXISTS_REUSE | |
| `ExpDossierSla.java` | domain/dossier | ⚠️ EXISTS_REUSE_RISKY | GAP-05 map sai — sửa nếu vào scope |
| `ExpDigitalSigned.java` | domain/dossier | ⚠️ EXISTS_REUSE_RISKY | thiếu cột NOT NULL + audit; out-of-scope |
| `ExpDocumentAttachment.java` | domain/dossier | 🆕 NEW | ⏭️ **MVP+1** (ngoài scope lần này) — DDL có `EXP_DOCUMENT_ATTACHMENT`, chưa có entity |
| `ExpDossierType.java` (nếu chưa có) | domain/lov | 🆕 NEW | cho `/lov/dossier-types` |
| LOV entities (Organization/Treasury/DataSource/DocumentType/AttachmentType/Project*) | domain/lov | ✅ EXISTS_REUSE | |

### Repository Layer — `domain/.../dossier|audit|lov`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `ExpDossierRepository.java` | domain/dossier | 🔧 EXISTS_MODIFY | **thêm** `softDeleteOpex`/`softDeleteWithStatus` (GAP-07); query filter OPEX |
| `ExpDocumentRepository`, `ExpDossierAttachmentRepository`, `ExpApprovalLogRepository`, `ExpDossierDraftRepository`, `ExpAuditLogRepository` | domain/dossier·audit | ✅ EXISTS_REUSE | |

### DTO Layer — `application/.../application/dossier/dto`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierCreateRequest.java` | dossier/dto | 🆕 NEW | required `[organizationCode, treasuryCode, sendDate, dataSourceCode]` (GAP-04) |
| `OpexDossierUpdateRequest.java` | dossier/dto | 🆕 NEW | required `[version, organizationCode, treasuryCode, sendDate]` |
| `OpexDossierDraftRequest.java` | dossier/dto | 🆕 NEW | all optional |
| `OpexAddDocumentRequest.java` | dossier/dto | 🆕 NEW | thêm `treasuryCode`; bỏ documentNo client |
| `DeleteDossierRequest.java` | dossier/dto | ✅ EXISTS_REUSE | khớp contract |
| `RejectRequest.java` | dossier/dto | ✅ EXISTS_REUSE | khớp (reason min10/max500) |
| `ApproveRequest.java` | dossier/dto | ⚠️ EXISTS_REUSE_RISKY | reason `@NotBlank` vs contract optional (GAP-04) — DTO OPEX bỏ NotBlank |
| `DossierDetailDto/SummaryDto/DocumentDetailDto/AttachmentInfoDto/ApprovalLogEntryDto/WorkflowActionResult/DossierMutationResult/DossierSearchDto` | dossier/dto | ✅ EXISTS_REUSE | response dùng lại (kiểm field read-only) |

### Service Layer — `application/.../application/dossier/service`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierService.java` | dossier/service | 🆕 NEW | CRUD OPEX (type=OPEX, gen DOSSIER_CODE OPEX); có thể tách hoặc reuse `DossierService` nếu không đụng CAPEX logic |
| `OpexDossierWorkflowService.java` | dossier/service | 🆕 NEW | 7 transition (GAP-03) |
| `DossierService.java` (CAPEX) | dossier/service | ⚠️ EXISTS_REUSE_RISKY | **KHÔNG** sửa — chứa logic/constant CAPEX |
| `DossierWorkflowService.java` (CAPEX) | dossier/service | ⚠️ EXISTS_REUSE_RISKY | **KHÔNG** sửa — switch 3 bước CAPEX |
| `DocumentService.java` | dossier/service | ✅ EXISTS_REUSE | thêm gen DOCUMENT_NO (GAP-14) — additive |
| `AttachmentService.java` | dossier/service | ✅ EXISTS_REUSE | metadata list/delete |
| `DossierDraftService.java` | dossier/service | ⚠️ EXISTS_REUSE_RISKY | serialize JSON (GAP-16) |
| `AuditLogService.java` | audit/service | ✅ EXISTS_REUSE | đọc audit |
| `LovService.java` | lov/service | 🔧 EXISTS_MODIFY | **thêm** dossierTypes/currencies/users (GAP-11) |

### Controller Layer — `api/.../api/dossier|audit|lov`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `OpexDossierController.java` | api/dossier | 🆕 NEW | `/api/v1/exp/opex/dossiers` CRUD + draft + copy + delete (GAP-01) |
| `OpexWorkflowController.java` | api/dossier | 🆕 NEW | submit/check/check-reject/check-return/approve/approve-reject/approve-cancel |
| `OpexDocumentController.java` | api/dossier | 🆕 NEW | `/exp/opex/dossiers/{id}/documents/**` |
| `OpexAttachmentController.java` | api/dossier | 🆕 NEW | **MVP: chỉ list/delete metadata dossier**. Upload/download + doc-attachment ⏭️ MVP+1 |
| `OpexAuditController.java` | api/audit | 🆕 NEW | approval-log + audit-log dưới `/exp/opex` |
| `OpexExportController.java` | api/dossier | 🆕 NEW | ⏭️ **MVP+1** (export ngoài scope lần này) |
| `*Controller` (CAPEX) | api/dossier·audit | ⚠️ EXISTS_REUSE_RISKY | **KHÔNG** đổi path CAPEX |
| `LovController.java` | api/lov | 🔧 EXISTS_MODIFY | thêm 3 LOV endpoint |

### Mapper Layer — `application/.../dossier/mapper`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `DossierMapper.java` | dossier/mapper | ⚠️ EXISTS_REUSE_RISKY | nếu dùng chung DTO OPEX → thêm mapping nullable; khuyến nghị `OpexDossierMapper` riêng |
| `DocumentMapper/AttachmentMapper/ApprovalLogMapper` | dossier/mapper | ✅ EXISTS_REUSE | |

### Enums & Converters — `common/.../common/enums|converter`

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `DossierStatus.java` | common/enums | 🔧 EXISTS_MODIFY | thêm 9 hằng OPEX (GAP-02) + case `labelOf()` |
| `DossierStatusConverter.java` | common/converter | 🔧 EXISTS_MODIFY | bọc try-catch (khuyến nghị) |
| `ActionRole.java` / `ActionRoleConverter.java` | common/enums·converter | ✅ EXISTS_REUSE | khớp contract |
| `DossierType.java` | common/enums | 🆕 NEW (tuỳ chọn) | enum OPEX/CAPEX (hiện là String) — validate type |

### Exception / Config / Resources (đa số Out-of-Scope — xem Scope)

| File | Folder | Nhãn | Ghi chú |
|------|--------|------|---------|
| `GlobalExceptionHandler.java` | api/.../exception | 🆕 NEW | **chưa có** `@RestControllerAdvice`; cần map `ErrorResponse{code,message,field,traceId}` |
| `ErrorCode/MessageCode` | common | 🔧/🆕 | MSG-ERR-*, VAL-* (Constants có sẵn 1 phần) |
| `SecurityConfig.java` | api/.../config | 🆕 NEW | ⚠️ Out-of-scope: JWT/role/SoD |
| `AuditorAware`/`AuditConfig.java` | config | 🆕 NEW | ⚠️ GAP-06 — bắt buộc cho insert NOT NULL audit |
| `FileStorageConfig.java` | config | 🆕 NEW | ⚠️ Out-of-scope: upload/scan |
| seed `COMMON_STATUS` (OPEX statuses) | resources/seed | 🆕 NEW | FK cho F_STATUS OPEX |

---

## ✅ Impact Analysis Generated: apiContract/impact.md

### Stats
- **30** endpoint In-Scope → đủ điều kiện sinh code (controller/service OPEX mới, tái dùng entity/repo)
- **9** hạng mục Out-of-Scope → JWT/SoD, lưu/đọc file, doc-attachment, export, các generator, ký số, notification/SLA
- **7** CRITICAL gaps → namespace (D1), enum+converter (D2), state machine (D3), DTO required (D4), SLA-entity (D5), auditor (D6), soft-delete status (D7)
- **5** DECISION_NEEDED gaps → currencyCode, originalAmount, actionUserName, LOV thiếu, kiểu date
- **6** IMPLEMENTATION_NOTE → generator code/document-no, audit-log ghi, draft JSON, copy documents, computed fields
- **14** artifact EXISTS_REUSE · **11** EXISTS_REUSE_RISKY (chủ yếu là biến thể CAPEX/stub) · **4** EXISTS_MODIFY (additive) · **~22** files NEW
- **0 HIGH / 2 MEDIUM** regression nếu tuân hướng cô lập (KHÔNG sửa CAPEX)

### Bước tiếp theo
1. Review Scope / Out-of-Scope — xác nhận ranh giới generate cho OPEX.
2. **Chốt 3 detector lớn:** D1 (controller OPEX mới), D2 (mở rộng enum dùng chung), D3 (workflow service OPEX mới) — đây là 3 quyết định kiến trúc khoá.
3. Review danh sách EXISTS_REUSE / RISKY / MODIFY / NEW — xác nhận tái dùng entity/repo, tạo mới controller/service/DTO.
4. Review mục Tác động — chốt kế hoạch re-test **toàn bộ CAPEX** (rủi ro MEDIUM ở enum/DTO).
5. Điền "Decision" cho từng gap.
6. Xác nhận `AuditorAware` (GAP-06) trước khi chạy bất kỳ POST nào.
7. Dùng impact.md (phần In-Scope) làm input cho `/gen-be-code`.
