# Change Plan — Đồng bộ API-mock.yml theo contract BE thật

> Mock: `apiMock/API-mock.yml` (~31 endpoint, UPPER_SNAKE, flat envelope) · Contract BE: `../../be/vdbas_exp_be/apiContract/capex-dossier-api.yaml` (~30 endpoint, camelCase, `{success,data}` envelope) · impact-fe: `apiMock/impact-fe.md`
> **Chưa sửa file nào** — plan để review trước khi apply.

## 0. Tóm tắt

- **Mức độ lệch: RẤT LỚN.** Mock và contract BE được viết theo **2 quy ước hoàn toàn khác nhau** trên cả 7 trục. Đây không phải "chỉnh vài chỗ" mà gần như **viết lại mock bám theo contract BE** + ghi nhận các GAP nơi BE thiếu thứ UI cần.
- Tổng nhóm khác biệt: **~38** (ALIGN-MOCK: ~26 · GAP-BE: 4 · DECISION: 6 · NO-OP: 2)
- **Rủi ro vỡ khi swap mock→real (đổi `VITE_API_BASE_URL` 9090→8085):** gần như **100% call vỡ** nếu giữ mock như hiện tại. Lý do chính:
  1. **Field naming**: mock trả `UPPER_SNAKE` (DOSSIER_CODE, F_STATUS…), BE trả `camelCase` (dossierCode, fStatus…). Mọi field UI đọc đều sai key.
  2. **Envelope**: mock phẳng (`{CONTENT:[...]}` / `DossierDetail` trực tiếp); BE bọc `{success, data:{...}}`. UI đọc `res.CONTENT` vs `res.data.items`.
  3. **Search**: mock `POST /search` + body; BE `GET ?query`. Khác cả method lẫn nơi đặt tham số.
  4. **Path**: `/exp/capex-dossier/{id}` → `/exp/capex/dossiers/{dossierId}`; `/master-data/*` → `/lov/*`.
  5. **Pagination**: mock `PAGE` 0-based; BE `page` **1-based** (`minimum:1, default:1`).
- **Trạng thái code FE:** Pages `CapexDossierListPage.tsx` + `CapexDossierDetailPage.tsx` **đã tồn tại** nhưng đang dùng `MOCK_DATA` tĩnh (`*.mock.ts`), **chưa wire service/hook**. impact-fe.md được sinh hoàn toàn theo mock (UPPER_SNAKE, 31 endpoint, `/master-data`) → sẽ phải sửa lớn.
- **Câu hỏi gốc cần chốt trước mọi thứ:** Contract BE là source-of-truth cuối. Có 2 hướng:
  - **(A) Viết lại mock bám 100% BE** (camelCase, envelope, GET search, /lov…) → swap mock→real an toàn, nhưng UI phải refactor theo convention BE (KHÁC CLAUDE.md "search luôn POST").
  - **(B) Giữ mock UPPER_SNAKE + thêm adapter ở `api.ts`** để map BE→FE khi swap. Nhanh hơn cho UI nhưng nợ kỹ thuật, không phải "đổi baseURL là chạy".
  - **Đề xuất: (A)** — đúng tinh thần skill (mock hội tụ về contract).

---

## 1. Ma trận khác biệt (7 trục)

| # | Trục | MOCK | REAL (BE) | Phân loại | Hành động |
| --- | --- | --- | --- | --- | --- |
| 1 | **Server/base** | `/api/v1`; 2 server (9090 mock, 8085 dev); không security; không idempotency | `/api/v1`; `security: bearerAuth`; mutation cần header `X-Idempotency-Key` | ALIGN-MOCK + DECISION | Thêm `bearerAuth` + param `X-Idempotency-Key` (optional) vào mock; chốt FE có gửi idempotency key không |
| 2 | **Tên tài nguyên (dossier)** | `/exp/capex-dossier` (số ít, gạch nối) | `/exp/capex/dossiers` (số nhiều, `capex/dossiers`) | ALIGN-MOCK | Đổi toàn bộ path dossier |
| 3 | **Tên tài nguyên (LOV)** | `/master-data/*` | `/lov/*` | ALIGN-MOCK | Đổi base LOV; đổi cả tên endpoint (xem #28-31) |
| 4 | **Path param** | `{id}`, `{docId}`, `{attachId}` | `{dossierId}`, `{documentId}`, `{attachmentId}` | ALIGN-MOCK | Đổi tên param hàng loạt |
| 5 | **List/Search — method** | `POST /exp/capex-dossier/search` + body JSON | `GET /exp/capex/dossiers?query` | ALIGN-MOCK + DECISION | Đổi POST→GET, body→query params. **Trái CLAUDE.md** ("search luôn POST") → cần chốt |
| 6 | **List — tên & shape param** | UPPER_SNAKE trong body: `F_STATUS[]`, `DATA_SOURCE_CODE[]`, `DATE_FIELD`, `SORT_BY/DIR` | camelCase query: `fStatus` (repeat), `dataSourceCode` (repeat), `dateField`, `sortBy/Dir`; multi-value `style:form explode:true` | ALIGN-MOCK | Map từng param sang query camelCase |
| 7 | **Pagination index** | `PAGE` **0-based** (Spring) | `page` **1-based** (`minimum:1, default:1`) | ALIGN-MOCK + DECISION | Mock đang 0-based, impact-fe ghi `page = current-1`. BE 1-based → **mâu thuẫn cốt lõi**, phải chốt |
| 8 | **Pagination field** | `SIZE` | `pageSize` | ALIGN-MOCK | Đổi tên |
| 9 | **List response envelope** | `DossierPageResponse{CONTENT[], TOTAL_ELEMENTS, TOTAL_PAGES, PAGE, SIZE, STATUS_COUNTS(object map), TOTAL_BASE_AMOUNT}` phẳng | `DossierListResponse{success, data:{items[], pagination{page,pageSize,totalRecords,totalPages}, totalBaseAmount, statusCounts[]}}` | ALIGN-MOCK | Bọc `{success,data}`; `CONTENT`→`data.items`; pagination lồng; `STATUS_COUNTS` map→**array** `[{status,statusName,count}]` |
| 10 | **Create — semantics** | `POST /exp/capex-dossier` → tạo **DRAFT**, trả `DossierDetail` | `POST /exp/capex/dossiers` → tạo **SAVED** (gộp create+save), trả `DossierCreateResponse{success,data:{id,dossierCode,fStatus,version}}` | ALIGN-MOCK + DECISION | Đổi response; **chốt trạng thái khởi tạo** (DRAFT vs SAVED) |
| 11 | **Save (DRAFT→SAVED)** | `POST /{id}/save` riêng | **Không có** — create POST đã = SAVED | NO-OP / DECISION | BE gộp create+save. Bỏ `/save` hoặc giữ cho luồng "edit→save lại"? |
| 12 | **Save-draft** | `POST /{id}/save-draft` (id-level, update bản đã có) | `POST /exp/capex/dossiers/drafts` (collection-level, **tạo mới** draft) | ALIGN-MOCK + DECISION | Khác cả path lẫn ngữ nghĩa (tạo vs cập nhật nháp) |
| 13 | **Cancel (record-level)** | `POST /{id}/cancel` + `{CANCEL_REASON}` | **Không có** — huỷ = `DELETE /{id}` → CANCELLED | GAP-BE / DECISION | UI có nút **Huỷ** (BTN_MATRIX.CANCEL) tách khỏi Xoá. BE chỉ có DELETE→CANCELLED. Chốt: map Cancel→DELETE hay BE bổ sung `/cancel`? |
| 14 | **Delete — response** | `DELETE /{id}` → **204** No Content | `DELETE /{dossierId}` → **200** `SuccessResponse` | ALIGN-MOCK | Đổi 204→200 + body SuccessResponse |
| 15 | **Check (Checker)** | `POST /{id}/check` riêng | **Không có** — gộp vào `POST /{id}/approve` (Checker+Approver chung) | ALIGN-MOCK / DECISION | Bỏ `/check`; route action Checker sang `/approve`. UI BTN_MATRIX dùng **1 nút APPROVE** cho cả 2 cấp → đã hợp BE |
| 16 | **Approve** | `POST /{id}/approve` (chỉ Approver), body `{NOTE?}` | `POST /{dossierId}/approve` (cả 2 cấp), body `ApproveRequest{reason?, digitalSign?}` | ALIGN-MOCK | Đổi `NOTE`→`reason`; thêm `digitalSign?` (ký số) |
| 17 | **Reject** | body `WorkflowRejectRequest{REASON}` | body `RejectRequest{reason}` (≥10) | ALIGN-MOCK | Đổi tên field |
| 18 | **Submit** | `POST /{id}/submit` không bắt body | `POST /{dossierId}/submit` body `{version}` **required** | ALIGN-MOCK | Thêm `version` vào body submit |
| 19 | **Copy — response** | trả `DossierDetail` | trả `DossierCreateResponse{success,data}` | ALIGN-MOCK | Đổi response shape |
| 20 | **Export** | `POST /exp/capex-dossier/export` + body, 200 file / 200 `{TASK_ID,STATUS}` | `GET /exp/capex/dossiers/export?query`, 200 file / **202** `{jobId,estimatedSeconds,statusUrl}` | ALIGN-MOCK | POST→GET; async 202 + jobId; polling `/export-jobs/{jobId}` |
| 21 | **Print** | `GET /{id}/print` → PDF | **Không có** | GAP-BE | UI có nút **In** (BTN_MATRIX.PRINT). BE thiếu → BE bổ sung `/print` hoặc FE render client-side |
| 22 | **Documents — CRUD** | GET list, POST add, DELETE `{docId}` (3 op) | thêm **GET detail** + **PUT update** `{documentId}` (5 op) | ALIGN-MOCK | Thêm GET/PUT document vào mock |
| 23 | **Add document — semantics** | chỉ `{DOCUMENT_TYPE_CODE, DOCUMENT_ID?}` (link chứng từ đã có) | `AddDocumentRequest{documentTypeCode, documentNo, documentDate, accountingDate, baseAmount,…}` **required** (tạo mới inline) | DECISION | Link-existing vs create-inline — khác bản chất. Chốt luồng thêm chứng từ |
| 24 | **Doc/Attach delete — response** | **204** No Content | **200** `SuccessResponse` | ALIGN-MOCK | Đổi 204→200 |
| 25 | **Attachment download — path** | `GET /{id}/attachments/{attachId}/download` | `GET /{dossierId}/attachments/{attachmentId}` (GET trên chính resource = download) | ALIGN-MOCK | Bỏ hậu tố `/download` |
| 26 | **Upload — error code** | 400 + `VDBAS-VAL-0014/0015` | HTTP **413** (quá lớn) + **415** (sai định dạng) | ALIGN-MOCK | Đổi sang 413/415 (vẫn giữ body ErrorResponse mã VDBAS) |
| 27 | **History/Audit — tên** | `/{id}/history` (audit) + `/{id}/approval-history` | `/{dossierId}/audit-log` + `/{dossierId}/approval-log` | ALIGN-MOCK | Đổi tên endpoint; `audit-log` có **phân trang** (page/pageSize); envelope `{success,data:{items,pagination}}` |
| 28 | **LOV projects** | `POST /master-data/projects/search` + body; `GET /master-data/projects/{projectCode}` (kèm `PROJECT_SPECIFICS[]`) | `GET /lov/projects?query`; **tách** `GET /lov/projects/{projectCode}/specific` cho dự án đặc thù | ALIGN-MOCK | POST→GET; tách endpoint specific |
| 29 | **LOV project-management** | `GET /master-data/project-managements?code&name` (số nhiều) | `GET /lov/project-management?search&projectCode` (**số ít**) | ALIGN-MOCK | Đổi tên + param |
| 30 | **LOV investors** | **Không có** | `GET /lov/investors` (LOV.09 Chủ đầu tư) | GAP-mock + DECISION | BE có Chủ đầu tư; `investorCode` **required** khi create (xem #33). Mock/UI hiện chưa có trường Chủ đầu tư |
| 31 | **LOV còn lại** | `/master-data/{data-sources,document-types,attachment-types,treasuries}` trả array phẳng / `{CONTENT}` | `/lov/{data-sources,document-types,attachment-types,treasuries}` trả `{success,data:[...]}` | ALIGN-MOCK | Đổi base + bọc envelope |
| 32 | **Enum values** | `DATA_SOURCE_CODE: "Thủ công"/"DVC"`; `ATTACHMENT_TYPE_CODE: "Chứng từ gốc"…`; `PROJECT_TYPE: Military/Citizen` | `THU_CONG/DVC`; `CHUNG_TU_GOC/HOP_DONG/HOA_DON/BANG_KE/VAN_BAN_KHAC`; `MILITARY/CITIZEN` (kèm `*Name` hiển thị) | ALIGN-MOCK | Đổi enum sang code + thêm field `*Name` cho nhãn hiển thị |
| 33 | **Create request — required** | `[PROJECT_CODE, PROJECT_MANAGEMENT_CODE, SEND_DATE]` | `[sendDate, dataSourceCode, projectCode, investorCode, projectManagementCode]` | ALIGN-MOCK + DECISION | Thêm `investorCode` (required) + `dataSourceCode` required. UI form chưa có Chủ đầu tư |
| 34 | **Field naming (TOÀN BỘ)** | `UPPER_SNAKE_CASE` mọi field | `camelCase` mọi field | ALIGN-MOCK (lớn nhất) + DECISION | Đổi toàn bộ schema sang camelCase, HOẶC chọn hướng (B) adapter. Đây là quyết định gốc §0 |
| 35 | **Detail envelope/fields** | `DossierDetail` phẳng; có `TREASURY_*`, `ASSIGN_USER`, `DOCUMENT_COUNT`, `TOTAL_LOCAL_AMOUNT`, `ACCOUNTING_STATUS` | `{success,data:DossierDetail}`; có thêm `investorCode/Name`, `dataSourceName`, `fStatusName`, `projectType`, `sla`, `completedDate`; **không có** `documentCount/accountingStatus` | ALIGN-MOCK | Bọc envelope; thêm `investor*/fStatusName/sla`; rà field thừa/thiếu |
| 36 | **Workflow response** | `DossierStatusResponse{ID,F_STATUS,APPROVAL_STEP,VERSION,MESSAGE_CODE,MESSAGE,CHECKED_*,APPROVED_*}` | `WorkflowActionResponse{success,errorCode,message,data:{dossierId,fStatus,fStatusName,assignUser}}` | ALIGN-MOCK | Bọc envelope; thay `APPROVAL_STEP/MESSAGE_CODE` bằng `fStatusName/assignUser`; chốt cách phân biệt "Đã kiểm soát" vs "Đã phê duyệt" |
| 37 | **Error schema** | `ApiError{ERROR_CODE,MESSAGE,TRACE_ID,FIELD_ERRORS[{FIELD,MESSAGE,CODE}]}` | `ErrorResponse{success,errorCode,message,traceId}` + `ValidationErrorResponse{…fieldErrors[{field,errorCode,message}]}` | ALIGN-MOCK | Đổi key sang camelCase + thêm `success:false` |
| 38 | **Error/status codes** | 403 dùng `VDBAS-AUT-0001`; NotFound `VDBAS-SYS-0404`; duplicate **warning** `VDBAS-EXP-0011`; không có 401 | thêm **401** `VDBAS-AUT-0002` (hết phiên); duplicate **conflict** `VDBAS-EXP-0002`; 422 UnprocessableEntity dùng chung | ALIGN-MOCK + DECISION | Thêm 401; phân biệt duplicate-warning (0011) vs duplicate-conflict (0002) |

---

## 2. Sửa đổi trên API-mock.yml

> Giả định chọn **hướng (A)** — mock bám 100% contract BE. Nếu chọn (B), thay phần này bằng "viết adapter ở `api.ts`" (xem §6).

### 2.1 Đổi path & param hàng loạt
| Vị trí | Hiện tại | Sửa thành | Ghi chú |
| --- | --- | --- | --- |
| Tất cả dossier path | `/exp/capex-dossier...` | `/exp/capex/dossiers...` | #2 |
| Path param dossier | `{id}` | `{dossierId}` | #4 |
| Path param document | `{docId}` | `{documentId}` | #4 |
| Path param attachment | `{attachId}` | `{attachmentId}` | #4 |
| Tất cả LOV | `/master-data/*` | `/lov/*` | #3 |

### 2.2 Đổi endpoint search / export (method + vị trí param)
| Vị trí | Hiện tại | Sửa thành | Ghi chú |
| --- | --- | --- | --- |
| List | `POST /exp/capex-dossier/search` + body | `GET /exp/capex/dossiers` + query params (camelCase, `fStatus`/`dataSourceCode` repeat) | #5,#6 — TRÁI CLAUDE.md, cần chốt |
| Export | `POST /exp/capex-dossier/export` + body | `GET /exp/capex/dossiers/export` + query; thêm 202 `{jobId,estimatedSeconds,statusUrl}` | #20 |
| Projects LOV | `POST /master-data/projects/search` | `GET /lov/projects` + query | #28 |

### 2.3 Bỏ / gộp endpoint (DECISION cần chốt — xem §6)
| Endpoint mock | Đề xuất | Lý do |
| --- | --- | --- |
| `POST /{id}/save` | **Bỏ** (gộp create) | BE create POST = SAVED ngay (#11) |
| `POST /{id}/check` | **Bỏ**, route sang `/approve` | BE gộp Checker+Approver (#15) |
| `POST /{id}/cancel` | **Bỏ** hoặc giữ chờ BE (GAP) | BE huỷ = DELETE (#13) |
| `GET /{id}/print` | **Giữ + đánh dấu GAP** | BE chưa có (#21) |
| `POST /{id}/save-draft` | Đổi → `POST /exp/capex/dossiers/drafts` | BE draft là collection-level (#12) |

### 2.4 Thêm endpoint còn thiếu trong mock
| Endpoint | Lý do |
| --- | --- |
| `GET /exp/capex/dossiers/{dossierId}/documents/{documentId}` | BE có GET detail chứng từ (#22) |
| `PUT /exp/capex/dossiers/{dossierId}/documents/{documentId}` | BE có update chứng từ (#22) |
| `GET /lov/projects/{projectCode}/specific` | BE tách dự án đặc thù (#28) |
| `GET /lov/investors` | BE có Chủ đầu tư LOV.09 (#30) — kéo theo `investorCode` ở create |

### 2.5 Sửa envelope & shape response (toàn bộ)
| Schema mock | Sửa thành (theo BE) | Ghi chú |
| --- | --- | --- |
| `DossierPageResponse{CONTENT,TOTAL_ELEMENTS…}` | `{success,data:{items[],pagination{page,pageSize,totalRecords,totalPages},totalBaseAmount,statusCounts[]}}` | #9 — `statusCounts` thành **array** `[{status,statusName,count}]` |
| `DossierDetail` (phẳng) | `{success,data:DossierDetail}`; field camelCase; thêm `investorCode/Name,dataSourceName,fStatusName,projectType,sla,completedDate` | #35 |
| `DossierDetail` 201 create | `DossierCreateResponse{success,errorCode,message,data:{id,dossierCode,fStatus,version}}` | #10 |
| `DossierStatusResponse` | `WorkflowActionResponse{success,errorCode,message,data:{dossierId,fStatus,fStatusName,assignUser}}` | #36 |
| `DocumentSummary/AttachmentInfo/AuditLogEntry/ApprovalLogEntry` | camelCase + bọc `{success,data:{items,…}}` cho list | #22,#27,#34 |
| `ApiError` | `ErrorResponse{success:false,errorCode,message,traceId}` + `ValidationErrorResponse.fieldErrors{field,errorCode,message}` | #37 |
| Tất cả LOV response | `{success,data:[...]}` / `{success,data:{items,pagination}}` | #31 |

### 2.6 Đổi enum + field naming
| Vị trí | Hiện tại | Sửa thành |
| --- | --- | --- |
| `DATA_SOURCE_CODE` | `"Thủ công"/"DVC"` | `THU_CONG/DVC` (+ `dataSourceName` hiển thị) |
| `ATTACHMENT_TYPE_CODE` | `"Chứng từ gốc"…` | `CHUNG_TU_GOC/HOP_DONG/HOA_DON/BANG_KE/VAN_BAN_KHAC` |
| `PROJECT_TYPE` | `Military/Citizen` | `MILITARY/CITIZEN` |
| **Mọi field** | `UPPER_SNAKE` | `camelCase` (#34 — quyết định gốc) |

### 2.7 Header / security / mã lỗi
- Thêm `security: [{bearerAuth: []}]` + `securitySchemes.bearerAuth` (#1).
- Thêm param header `X-Idempotency-Key` (optional) cho create/save-draft/submit/approve/reject/copy/add-document (#1).
- Thêm response **401** `Unauthorized` (`VDBAS-AUT-0002`) cho các endpoint cần auth (#38).
- Đổi upload error 400→**413/415** (#26).
- Phân biệt duplicate: warning `VDBAS-EXP-0011` (create/save) vs conflict `VDBAS-EXP-0002` (#38).

---

## 3. Sửa đổi trên impact-fe.md

> impact-fe.md hiện được sinh **theo mock** (UPPER_SNAKE, `/master-data`, POST search, page 0-based, 31 endpoint). Sau khi mock hội tụ về BE, impact-fe phải sửa lớn — đề xuất **chạy lại `gen-impact-fe`** trên mock đã sửa thay vì vá tay. Các điểm chính:

| Mục impact-fe | Hiện tại | Sửa thành | Lý do |
| --- | --- | --- | --- |
| §2.1 search | `POST /exp/capex-dossier/search` → `listDossiers(params)` POST body | `GET /exp/capex/dossiers` → `listDossiers(params)` dùng `get()` + query | #5,#6 |
| §2.1 save | có `saveDossier()` `useSave` cho `/save` | **Xoá hàng** (BE gộp create) | #11 |
| §2.1 check | có `checkDossier()` `useCheck` cho `/check` | **Xoá hàng**, dùng chung `approveDossier()` | #15 |
| §2.1 cancel | `cancelDossier()` `useCancel` cho `/cancel` | **Xoá hoặc gắn GAP** → nếu map Cancel→DELETE thì dùng `deleteDossier()` | #13 |
| §2.1 print | `printDossier()` `usePrint` | **Đánh dấu GAP-BE** (chưa có endpoint) | #21 |
| §2.1 submit | `submitDossier(id)` | `submitDossier(id, {version})` | #18 |
| §2.1 export | `useExport` POST blob | GET + xử lý 202 async (poll jobId) | #20 |
| §2.2 documents | 3 hàm | thêm `getDocument()` + `updateDocument()` (GET/PUT) | #22 |
| §2.3 download | `/{id}/attachments/{attachId}/download` | `/{dossierId}/attachments/{attachmentId}` (bỏ `/download`) | #25 |
| §2.4 history | `getDossierHistory` `/history`, `getApprovalHistory` `/approval-history` | `getAuditLog` `/audit-log` (paginated), `getApprovalLog` `/approval-log` | #27 |
| §2.5 MasterData | service `masterDataService.ts`, base `/master-data` | service `lovService.ts`, base `/lov`; thêm `lovInvestors`, `lovProjectSpecific`; `project-management` số ít | #3,#28,#29,#30 |
| §4 Types | UPPER_SNAKE (`DOSSIER_CODE…`), `DossierPageResponse{CONTENT}` | camelCase (`dossierCode…`); response bọc `{success,data}`; thêm `investorCode/Name`, `fStatusName`, `statusCounts[]` | #9,#34,#35 |
| §4 generic | tự định nnghĩa `DossierPageResponse` | có thể tái dùng `PagedResponse` **nếu** đổi sang `{items,pagination}` shape BE | #9 |
| §5 i18n | map theo `ERROR_CODE` (UPPER) | map theo `errorCode` (camelCase) trong body; thêm `VDBAS-AUT-0002` (401), `VDBAS-EXP-0002` (duplicate conflict) | #37,#38 |
| §6 convention | "search = POST /search + body", "page 0-based" | "list = GET ?query", **page 1-based** (`page: current` không `-1`) | #5,#7 |
| §1 tổng endpoint | 31 (7 MasterData, có /save //check //cancel //print) | ~30 (8 LOV, bỏ save/check, cancel/print tuỳ chốt) | toàn bộ |

---

## 4. Call-site & UI bị ảnh hưởng

> Pages đã tồn tại, đọc field **UPPER_SNAKE** từ `MOCK_DATA` (`r.F_STATUS`, `r.DOSSIER_CODE`, `r.ASSIGN_USER`…). Khi wire hook thật theo BE (camelCase) → mọi chỗ đọc field phải đổi.

| Action UI (BTN_MATRIX/handler) | Endpoint real | Hook dự kiến | Trạng thái |
| --- | --- | --- | --- |
| `EDIT` → `navigate(mode:'edit')` → `updateDossier` | `PUT /exp/capex/dossiers/{dossierId}` | `useUpdate` | OK (đổi path/param/field) |
| `DELETE` (`handleDelete`) | `DELETE /{dossierId}` → 200 | `useDelete` | OK |
| `SUBMIT` | `POST /{dossierId}/submit` body `{version}` | `useSubmit` | Cần thêm `version` |
| `APPROVE` (dùng cho **cả** Checker SUBMITTED & Approver APPROVED) | `POST /{dossierId}/approve` | `useApprove` | **Hợp BE** (BE gộp). Bỏ `useCheck` |
| `REJECT` | `POST /{dossierId}/reject` body `{reason}` | `useReject` | OK (đổi `REASON`→`reason`) |
| `CANCEL` (BTN_MATRIX.CANCEL, riêng nút) | **(GAP)** BE không có `/cancel` | — | ⚠️ map sang DELETE hay chờ BE (#13) |
| `COPY` (`handleCopyRecord`) | `POST /{dossierId}/copy` → DossierCreateResponse | `useCopy` | OK (đổi response đọc `data.id`) |
| `PRINT` (BTN_MATRIX.PRINT) | **(GAP)** BE không có `/print` | — | ⚠️ chờ BE hoặc render client (#21) |
| `EXPORT` (`handleExport`) | `GET /exp/capex/dossiers/export` | `useExport` | Đổi POST→GET + xử lý 202 async (#20) |
| Phân biệt "Đã kiểm soát" | hiện FE suy từ `r.ASSIGN_USER === 'Approver'` | BE trả `fStatusName`/`assignUser` | ⚠️ đổi logic `statusUiLabel()` đọc `fStatusName` thay vì đoán qua ASSIGN_USER (#36) |
| Form Create | required `PROJECT_CODE, PROJECT_MANAGEMENT_CODE, SEND_DATE` | BE thêm `investorCode` **required** + `dataSourceCode` | ⚠️ Form chưa có field **Chủ đầu tư** (#30,#33) |

**Endpoint real chưa có nút UI cắm vào:** `GET/PUT documents/{documentId}` (xem/sửa chứng từ inline — #22,#23); `GET /lov/investors` (#30).

---

## 5. GAP cần BE xử lý

1. **`GET /{id}/print`** — UI có nút **In** (BTN_MATRIX.PRINT cho SAVED/VALIDATED/APPROVED/COMPLETED/REJECTED/CANCELLED). BE contract **không có**. → Đề xuất: **BE bổ sung** endpoint print PDF, hoặc FE render PDF client-side (template tĩnh).
2. **`POST /{id}/cancel` (huỷ record-level)** — UI tách nút **Huỷ** khỏi **Xoá**. BE chỉ có `DELETE → CANCELLED`. → Đề xuất: nếu nghiệp vụ Huỷ == Xoá-mềm thì FE map Cancel→DELETE (không cần BE); nếu khác (huỷ hồ sơ đã SAVED có lý do riêng) → **BE bổ sung** `/cancel`.
3. **Khởi tạo DRAFT thuần** — mock cho tạo hồ sơ trạng thái DRAFT trước khi save. BE create POST = thẳng SAVED; muốn DRAFT phải dùng `/drafts`. → Xác nhận luồng FE "mở form mới" có cần tạo record DRAFT ở server ngay không, hay chỉ tạo khi bấm Lưu nháp/Lưu.
4. **Trường Chủ đầu tư (investor)** — BE `investorCode` **required** khi create + có `/lov/investors`. UI form/mock hiện **không có** field này. → BA xác nhận UI cần thêm field Chủ đầu tư, hoặc BE bỏ required/auto-fill từ project.

---

## 6. DECISION cần chốt

| # | Quyết định | Đề xuất |
| --- | --- | --- |
| D1 | **Hướng đồng bộ: (A) viết lại mock theo BE (camelCase, envelope, GET search) vs (B) giữ mock UPPER_SNAKE + adapter ở `api.ts`** | **(A)** — đúng tinh thần "mock hội tụ contract", swap baseURL an toàn |
| D2 | **Search: GET ?query (theo BE) vs giữ POST /search (theo CLAUDE.md)** | Theo BE = **GET ?query**; cập nhật CLAUDE.md ngoại lệ cho feature này, HOẶC đề nghị BE thêm `POST /search` |
| D3 | **Pagination 1-based (BE) vs 0-based (mock/impact-fe)** | Theo BE = **1-based**; sửa impact-fe `page: current` (bỏ `-1`) |
| D4 | **Cancel → map DELETE hay BE bổ sung `/cancel`** | Nếu Huỷ==Xoá-mềm → map DELETE; nếu khác → BE bổ sung (xem GAP #2) |
| D5 | **Bỏ `/save` & `/check`** (BE đã gộp) | **Bỏ** — create=SAVED, approve=Checker+Approver |
| D6 | **Add-document: link-existing (mock) vs create-inline (BE)** | Theo BE = **create-inline** (`AddDocumentRequest` đủ field), trừ khi BA xác nhận luồng chọn-từ-LOV |

---

## 7. Thứ tự apply đề xuất

1. **Chốt §5 (GAP) + §6 (DECISION)** với BE/BA — đặc biệt D1 (hướng A/B), D2 (search), D3 (paging), GAP print/cancel/investor.
2. Sửa `API-mock.yml` theo §2 (path/param → envelope → enum → field naming → security/error) → **validate Prism** (`npx @stoplight/prism-cli mock API-mock.yml -p 9090`).
3. **Chạy lại `gen-impact-fe`** trên mock đã sửa (thay vì vá tay §3) để impact-fe khớp convention BE.
4. (Sau) chạy `gen-fe-code` theo impact-fe đã chốt: sinh `types` (camelCase), `lovService.ts` (thay `masterDataService`), `capexDossierService.ts`, hooks, i18n; rồi wire 2 page bỏ `MOCK_DATA` — chú ý đổi mọi chỗ đọc field UPPER_SNAKE → camelCase trong `CapexDossierListPage.tsx`/`DetailPage.tsx`.

---

> **Tóm tắt rủi ro:** Mock hiện tại **không thể** swap thẳng sang BE (`9090`→`8085`) — khác convention trên cả 7 trục, gần như mọi call sẽ vỡ. Bắt buộc đồng bộ mock theo contract (hướng A) trước khi wire page. 4 GAP (print, cancel, DRAFT thuần, investor) cần BE/BA chốt vì ảnh hưởng trực tiếp nút UI đang có.
