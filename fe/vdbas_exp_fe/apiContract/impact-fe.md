# Impact FE — OPEX Dossier (EXP.OPEX.DOSSIER)

> Nguồn contract: `apiContract/API-contract.yaml` (EXP OPEX Dossier Management API v0.2.0) · Convention: `src/` + CLAUDE.md
> **Chưa sinh code** — báo cáo để review trước khi chạy `gen-fe-code`.

## 1. Tóm tắt
- Chức năng: **EXP.OPEX.DOSSIER** | module=`exp`, group=`opex`, entity=`dossiers` → `{Entity}=Dossier` | path param `{id}` (UUID), `{docId}`, `{attId}` | domain queryKey đề xuất=`opexDossiers`
- **Page đích (chọn bằng FUNC_CODE):**
  - List: `src/pages/OpexDossierListPage.tsx` — bằng chứng `data-event-id="EXP.OPEX_DOSSIER.LIST.SEARCH | .NEW.OPEN | .LIST.EXPORT"`
  - Detail: `src/pages/OpexDossierDetailPage.tsx` — bằng chứng `data-event-id="EXP.OPEX_DOSSIER.NEW.SAVE | .NEW.SAVE_DRAFT | .VIEW.SUBMIT | .APPROVER.APPROVE | .VIEW.COPY | .VIEW.DELETE_CONFIRM"`
  - FUNC_CODE contract `EXP.OPEX.DOSSIER.*` khớp event-id page `EXP.OPEX_DOSSIER.*` (chấp nhận `.`↔`_`).
  - **Biến thể anh em ngoài phạm vi:** `CapexDossierListPage.tsx` / `CapexDossierDetailPage.tsx` (event-id `EXP.CAPEX_DOSSIER.*`) — loại vì FUNC_CODE khác (CAPEX ≠ OPEX). Hai page này đang chạy trên lớp data dùng chung `dossierService.ts`/`useDossier.ts` (xem §12).
- Base path: `/api/v1` (từ `servers`) | Auth: `bearerAuth` JWT (claims: userId, role MAKER/CHECKER/APPROVER/VIEWER, treasuryCode scope)
- Tổng endpoint: **39** — Dossiers(6) · Workflow(8) · Documents(5) · Attachments(8) · Audit(2) · Export(2) · LOV(8) | schemas: 24 | mã lỗi: 6 nhóm response | **trạng thái (11)**: `DRAFT, PENDING_CHECKER, CHECKED, APPROVAL_PENDING, APPROVED, APPROVAL_REJECTED, CHECK_REJECTED, CHECK_CANCELLED, APPROVAL_CANCELLED, REJECTED_BY_CHECKER, DELETED`
- Kiểu list phát hiện: **GET `/exp/opex/dossiers` + query params** (KHÔNG phải POST/search) · **page base = 0** · `size` enum [20,50,100,200] default 20 · `sort` là **chuỗi** `createdDate,desc` (1 param, không tách sortBy/sortDir)
- Envelope list: `DossierListResponse { items[], pagination{page,size,totalElements,totalPages}, statusCounts{} }` → **KHÁC** `PagedResponse<T>` (content/totalElements) của FE → **cần adapter ở service**. Success khác đều body trần; chỉ lỗi có `ErrorResponse{code,message,field,traceId}`.
- Idempotency: header **`Idempotency-Key`** (UUID) optional trên MỌI POST/PUT/DELETE mutating.
- Optimistic lock: `DossierUpdateRequest.version` **required** (VAL-15); response trả `version` mới (+1).
- **Trạng thái code hiện tại:** lớp data Dossier ĐÃ CÓ nhưng là của **CAPEX** (`dossierService.ts` BASE=`/exp/capex/dossiers`, `useDossier.ts`=`DossierHooks`, `DossierStatus` 8-state) — **dùng riêng cho Capex pages, KHÔNG khớp OPEX**. Opex pages hiện **100% MOCK** (`OpexDossierListPage.mock.ts`, `OpexDossierDetailPage.mock.ts`), chưa wire hook nào. LOV service có một phần (thiếu dossier-types/currencies/users; envelope flat-array khác contract).

## 1b. Hiện trạng tồn tại — ĐÃ CÓ / CHƯA CÓ / MỘT PHẦN
| Layer | Trạng thái | Bằng chứng (file:symbol) | Còn thiếu so với contract |
| --- | --- | --- | --- |
| Service OPEX `opexDossierService.ts` | ❌ CHƯA CÓ | không tìm thấy (chỉ có `dossierService.ts`→CAPEX) | toàn bộ 39 endpoint OPEX |
| Service CAPEX `dossierService.ts` | ⛔ NGOÀI PHẠM VI (frozen) | `src/services/dossierService.ts:30` `BASE='/exp/capex/dossiers'` | — không sửa (Capex dùng) |
| Service lookup LOV `lovService.ts` | 🔶 MỘT PHẦN | `lovService.ts:27-52` organizations/treasuries/data-sources/document-types/attachment-types | thiếu **dossier-types, currencies, users**; envelope contract `{items,pagination}` vs hiện trả **flat array** |
| Hook OPEX `useOpexDossier.ts` | ❌ CHƯA CÓ | không tìm thấy (chỉ `useDossier.ts`→DossierHooks/CAPEX) | toàn bộ hook OPEX |
| Hook LOV `useLov.ts` | 🔶 MỘT PHẦN | `useLov.ts:32-75` useTreasuries/useOrganizations/useDataSources/useDocumentTypes/useAttachmentTypes | thiếu useDossierTypes/useCurrencies/useUsers |
| Types `src/types/index.ts` | 🔶 MỘT PHẦN | `types/index.ts:133` `DossierStatus`(8-state CAPEX), `DossierListParams`(sortBy/sortDir), `DossierSummary`/`DossierDetail` | OPEX khác hẳn: 11-state, list params mới, envelope `{items,pagination,statusCounts}`, workflow mới, `version` lock → cần **type Opex* song song** |
| Model `OpexDossier.ts` | ❌ CHƯA CÓ | có `models/Dossier.ts` (CAPEX), không có Opex | hằng tên field OPEX |
| Page List `OpexDossierListPage.tsx` | 🔶 MỘT PHẦN | `OpexDossierListPage.tsx:3` `import {MOCK_DATA}`; `:305` filter trên MOCK | còn MOCK; chưa wire useList/lookup/export |
| Page Detail `OpexDossierDetailPage.tsx` | 🔶 MỘT PHẦN | `OpexDossierDetailPage.tsx:3` `import {MOCK_DATA}`; `:395-459` handler alert/navigate | còn MOCK; chưa wire detail/CRUD/workflow/doc/attachment |
| i18n key (mã lỗi/thông báo) | 🔶 MỘT PHẦN (cần verify) | `src/locales/vi.json`, `en.json` | key cho `MSG-*` của OPEX (xem §9) |
> Tổng kết: ĐÃ CÓ = 0 (khớp OPEX) · CHƯA CÓ = 4 · MỘT PHẦN = 5 · NGOÀI PHẠM VI = 1 (capex service).

## 2. Bảng endpoint → kế hoạch code
> Tất cả service mới gom vào `opexDossierService.ts` (BASE=`/exp/opex/dossiers`). LOV gom theo `lovService.ts` (thêm hàm). Kiểu trả ghi rõ chỗ cần unwrap.

| Method | Path | operationId | Hàm service | Hook | queryKey / invalidate | Kiểu trả |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /exp/opex/dossiers | listDossiers | `listOpexDossiers(params)` | useList | `['opexDossiers','list',params]` | **adapter**: `{items,pagination,statusCounts}`→`OpexDossierListResult` (page 0→giữ hoặc +1 tuỳ UI) |
| POST | /exp/opex/dossiers | createDossier | `createOpexDossier(data,idem)` | useCreate | invalidate `['opexDossiers']` | `DossierCreateResponse` trần |
| POST | /exp/opex/dossiers/drafts | saveDossierDraft | `saveOpexDraft(data,idem)` | useSaveDraft | invalidate `['opexDossiers']` | `DossierCreateResponse` trần |
| GET | /exp/opex/dossiers/{id} | getDossier | `getOpexDossier(id)` | useDetail | `['opexDossiers','detail',id]` | `DossierDetail` trần |
| PUT | /exp/opex/dossiers/{id} | updateDossier | `updateOpexDossier(id,data,idem)` | useUpdate | invalidate list+detail | `DossierUpdateResponse` (version mới) |
| DELETE | /exp/opex/dossiers/{id} | deleteDossier | `deleteOpexDossier(id,body,idem)` | useDelete | invalidate list+detail | `WorkflowActionResponse` (body `DeleteDossierRequest`) |
| POST | /exp/opex/dossiers/{id}/copy | copyDossier | `copyOpexDossier(id,idem)` | useCopy | invalidate `['opexDossiers']` | `DossierCreateResponse` |
| POST | /exp/opex/dossiers/{id}/submit | submitDossier | `submitOpexDossier(id,idem)` | useSubmit | invalidate list+detail | `WorkflowActionResponse` (no body) |
| POST | /exp/opex/dossiers/{id}/check | checkDossier | `checkOpexDossier(id,body?,idem)` | useCheck | invalidate list+detail | `WorkflowActionResponse` (body `ApproveRequest` optional) |
| POST | /exp/opex/dossiers/{id}/check-reject | rejectByChecker | `rejectByChecker(id,body,idem)` | useRejectByChecker | invalidate list+detail | body `RejectRequest` (reason ≥10) |
| POST | /exp/opex/dossiers/{id}/check-return | returnByChecker | `returnByChecker(id,body,idem)` | useReturnByChecker | invalidate list+detail | body `RejectRequest` |
| POST | /exp/opex/dossiers/{id}/approve | approveDossier | `approveOpexDossier(id,body?,idem)` | useApprove | invalidate list+detail | body `ApproveRequest` optional |
| POST | /exp/opex/dossiers/{id}/approve-reject | rejectByApprover | `rejectByApprover(id,body,idem)` | useRejectByApprover | invalidate list+detail | body `RejectRequest` |
| POST | /exp/opex/dossiers/{id}/approve-cancel | cancelApproval | `cancelApproval(id,body,idem)` | useCancelApproval | invalidate list+detail | body `RejectRequest` |
| GET | /exp/opex/dossiers/{id}/documents | listDocuments | `listOpexDocuments(id)` | useDocuments | `['opexDossiers',id,'documents']` | `DocumentDetail[]` trần (mảng) |
| POST | /exp/opex/dossiers/{id}/documents | addDocument | `addOpexDocument(id,data,idem)` | useAddDocument | invalidate documents+detail | `DocumentDetail`; documentNo/Name BE-gen |
| GET | /exp/opex/dossiers/{id}/documents/{docId} | getDocument | `getOpexDocument(id,docId)` | useDocument | `['opexDossiers',id,'documents',docId]` | `DocumentDetail` |
| PUT | …/documents/{docId} | updateDocument | `updateOpexDocument(id,docId,data,idem)` | useUpdateDocument | invalidate documents+detail | `DocumentDetail` |
| DELETE | …/documents/{docId} | deleteDocument | `deleteOpexDocument(id,docId,idem)` | useDeleteDocument | invalidate documents+detail | 204 (void) |
| GET | /exp/opex/dossiers/{id}/attachments | listDossierAttachments | `listDossierAttachments(id)` | useDossierAttachments | `['opexDossiers',id,'attachments']` | `Attachment[]` |
| POST | …/attachments | uploadDossierAttachment | `uploadDossierAttachment(id,formData,idem)` | useUploadDossierAttachment | invalidate attachments | multipart; `Attachment`; 413/415 lỗi file |
| GET | …/attachments/{attId} | downloadDossierAttachment | `downloadDossierAttachment(id,attId)` | (gọi trực tiếp) | — | Blob (octet-stream) |
| DELETE | …/attachments/{attId} | deleteDossierAttachment | `deleteDossierAttachment(id,attId,idem)` | useDeleteDossierAttachment | invalidate attachments | 204 |
| GET | …/documents/{docId}/attachments | listDocumentAttachments | `listDocumentAttachments(id,docId)` | useDocumentAttachments | `['opexDossiers',id,'documents',docId,'attachments']` | `Attachment[]` |
| POST | …/documents/{docId}/attachments | uploadDocumentAttachment | `uploadDocumentAttachment(id,docId,formData,idem)` | useUploadDocumentAttachment | invalidate doc attachments | `Attachment` |
| GET | …/documents/{docId}/attachments/{attId} | downloadDocumentAttachment | `downloadDocumentAttachment(id,docId,attId)` | (gọi trực tiếp) | — | Blob |
| DELETE | …/documents/{docId}/attachments/{attId} | deleteDocumentAttachment | `deleteDocumentAttachment(id,docId,attId,idem)` | useDeleteDocumentAttachment | invalidate doc attachments | 204 |
| GET | /exp/opex/dossiers/{id}/approval-log | getApprovalLog | `getOpexApprovalLog(id)` | useApprovalLog | `['opexDossiers',id,'approval-log']` | `ApprovalLogEntry[]` |
| GET | /exp/opex/dossiers/{id}/audit-log | getAuditLog | `getOpexAuditLog(id)` | useAuditLog | `['opexDossiers',id,'audit-log']` | `AuditLogEntry[]` |
| GET | /exp/opex/dossiers/export | exportDossiers | `exportOpexDossiers(params)` | useExport (hoặc gọi trực tiếp) | — | 200 Blob (<50k) **HOẶC** 202 `ExportJob` (≥50k) → service phải đọc status code |
| GET | /exp/opex/dossiers/export/{jobId} | getExportJob | `getOpexExportJob(jobId)` | useExportJob (poll) | `['opexExport',jobId]` | `ExportJob` |
| GET | /lov/organizations | lovOrganizations | `lovOpexOrganizations(search,page,size)` | useOrganizations | `['lov','organizations',...]` | unwrap `LovListResponse.items` |
| GET | /lov/treasuries | lovTreasuries | `lovOpexTreasuries(...)` | useTreasuries | `['lov','treasuries',...]` | unwrap `.items` |
| GET | /lov/data-sources | lovDataSources | `lovOpexDataSources(search)` | useDataSources | `['lov','data-sources']` | unwrap `.items` |
| GET | /lov/dossier-types | lovDossierTypes | `lovDossierTypes(search)` | useDossierTypes | `['lov','dossier-types']` | unwrap `.items` (**mới**) |
| GET | /lov/document-types | lovDocumentTypes | `lovDocumentTypes(...)` | useDocumentTypes | `['lov','document-types']` | unwrap `.items` |
| GET | /lov/attachment-types | lovAttachmentTypes | `lovAttachmentTypes(search)` | useAttachmentTypes | `['lov','attachment-types']` | unwrap `.items` |
| GET | /lov/currencies | lovCurrencies | `lovCurrencies(search)` | useCurrencies | `['lov','currencies']` | unwrap `.items` (**mới**) |
| GET | /lov/users | lovUsers | `lovUsers(search,activeStatus)` | useUsers | `['lov','users',...]` | unwrap `.items` (**mới**); cho filter Maker/Checker/Approver |

## 3. File ảnh hưởng (đường dẫn chính xác + symbol)
> Phân loại theo trục: **CẬP NHẬT/tái dùng** (lớp data) vs **THÊM MỚI** (wire page / endpoint chưa có).

| File | Đã có? | Hành động | Phân loại | Symbol thêm/sửa | Lý do |
| --- | --- | --- | --- | --- | --- |
| src/types/index.ts | ✅ | EDIT (thuần cộng thêm) | THÊM MỚI | `OpexDossierStatus`(11), `OpexDossierListParams`, `OpexDossierSummary`, `OpexDossierDetail`, `OpexDossierListResult`, `OpexPagination`, `*CreateResponse/UpdateResponse`, `OpexDocumentDetail`, `OpexAttachment`, `WorkflowActionResult`(OPEX), `LovItem`/`LovListResponse`, `ExportJob` | KHÔNG sửa `DossierStatus`/`DossierListParams`/`DossierSummary` cũ (Capex dùng) → thêm type Opex* song song |
| src/models/OpexDossier.ts | ❌ | CREATE | THÊM MỚI | `class OpexDossier { static readonly ORGANIZATION_CODE… }`, `class OpexDossierStatusEnum`, `class OpexActionRole` | hằng tên field đúng camelCase contract + enum 11-state |
| src/services/opexDossierService.ts | ❌ | CREATE | THÊM MỚI | 31 hàm (CRUD+workflow+documents+attachments+audit+export) + adapter unwrap list + `newIdempotencyKey()` + header `Idempotency-Key` | BASE riêng `/exp/opex/dossiers`; KHÔNG đụng `dossierService.ts` (Capex) |
| src/services/lovService.ts | ✅ | EDIT (thuần cộng thêm) | CẬP NHẬT + THÊM MỚI | thêm `lovDossierTypes`, `lovCurrencies`, `lovUsers` (+ biến thể OPEX unwrap `.items` nếu cần) | bổ sung LOV thiếu; xem rủi ro envelope §11/§12 |
| src/hooks/useOpexDossier.ts | ❌ | CREATE | THÊM MỚI | `export const OpexDossierHooks = { useList, useDetail, useCreate, useSaveDraft, useUpdate, useDelete, useCopy, useSubmit, useCheck, useRejectByChecker, useReturnByChecker, useApprove, useRejectByApprover, useCancelApproval, useDocuments, useAddDocument, … }` | React Query, queryKey `['opexDossiers',…]` |
| src/hooks/useLov.ts | ✅ | EDIT (thuần cộng thêm) | THÊM MỚI | `useDossierTypes`, `useCurrencies`, `useUsers` | đổ dropdown OPEX còn thiếu |
| src/pages/OpexDossierListPage.tsx | ✅ | EDIT | THÊM MỚI (wire) | MOCK_DATA→`OpexDossierHooks.useList`; filter→queryParams; export→`useExport`; dropdown→useLov | xem §4a |
| src/pages/OpexDossierDetailPage.tsx | ✅ | EDIT | THÊM MỚI (wire) | MOCK_DATA→`useDetail`; handleSave/Draft/Submit/Approve/Reject/Copy/Delete/doc→hook | xem §4b |
| src/pages/OpexDossierListPage.mock.ts | ✅ | SKIP | — | — | MOCK tĩnh; bỏ import sau khi wire |
| src/pages/OpexDossierDetailPage.mock.ts | ✅ | SKIP | — | — | MOCK tĩnh |
| src/locales/vi.json, en.json | ✅ | EDIT (thuần cộng thêm) | THÊM MỚI | key cho `MSG-*` OPEX (§9) | mỗi mã 1 key, namespace riêng |
| src/services/dossierService.ts | ✅ | **SKIP (frozen)** | — | — | CAPEX — KHÔNG đụng |
| src/hooks/useDossier.ts | ✅ | **SKIP (frozen)** | — | — | CAPEX `DossierHooks` |

## 4. Call-site map — nơi CALL API trong page

### 4a. OpexDossierListPage.tsx
| Action UI / handler | Hiện làm gì | Thay bằng hook | Endpoint |
| --- | --- | --- | --- |
| nguồn data grid | `MOCK_DATA.records.filter()` (`:305`) | `OpexDossierHooks.useList(queryParams)` | GET /exp/opex/dossiers |
| handleSearch (`EXP.OPEX_DOSSIER.LIST.SEARCH`) | filter local trên MOCK | commit filter→queryParams (page **0-based**, `sort='createdDate,desc'`, `size` enum) | GET /exp/opex/dossiers |
| reset (`LIST.RESET`) | reset state local | reset filter → refetch | GET list |
| dropdown trạng thái/nguồn/đơn vị/kho bạc | hardcode/MOCK | `useDataSources`/`useOrganizations`/`useTreasuries`; filter `fStatus[]` từ enum 11-state | /lov/* |
| dropdown người dùng (Maker/Checker/Approver) | — | `useUsers(search)` | /lov/users |
| Export (`LIST.EXPORT`) | — | `exportOpexDossiers(params)`; xử lý 200 Blob vs 202 jobId→poll | GET /exp/opex/dossiers/export |
| New (`NEW.OPEN`) | `navigate('/opex-dossiers/detail',{mode:'new'})` (`:532,579`) | giữ navigate (điều hướng, không call API) | — |
| row → view/edit (`:453,490`) | navigate mode view/edit | giữ navigate | — (detail load ở page Detail) |
| row → delete (`:510`) | navigate action=delete | giữ navigate (dialog ở Detail) | — |

### 4b. OpexDossierDetailPage.tsx
| Action UI / handler | Hiện làm gì | Thay bằng hook | Endpoint |
| --- | --- | --- | --- |
| load detail | `MOCK_DATA.records.find()` (`:132`) | `useDetail(id)` (giữ `version` cho update) | GET /exp/opex/dossiers/{id} |
| handleSave (`NEW.SAVE`/`EDIT.SAVE`, `:395`) | setState + navigate | new→`useCreate`; edit→`useUpdate(id,{version,…})` | POST / PUT /exp/opex/dossiers[/{id}] |
| handleSaveDraft (`NEW.SAVE_DRAFT`, `:411`) | setState | `useSaveDraft` | POST /exp/opex/dossiers/drafts |
| handleSubmit (`VIEW.SUBMIT`/`NEW.SUBMIT`, `:416`) | navigate | `useSubmit(id)` | POST …/{id}/submit |
| handleApprove (`APPROVER.APPROVE`, `:426`) | navigate | `useApprove(id, {reason?,digitalSign?})` | POST …/{id}/approve |
| handleReject (`APPROVER.REJECT`, `:431`) | navigate | Approver→`useRejectByApprover(id,{reason})`; Checker→`useRejectByChecker` | POST …/approve-reject \| …/check-reject |
| handleCancelBiz (`:439`) | navigate | Checker→`useReturnByChecker`; Approver→`useCancelApproval` | POST …/check-return \| …/approve-cancel |
| **(GAP)** Checker duyệt | — chưa có nút `check` rõ ràng | `useCheck(id)` | POST …/{id}/check |
| handleCopy (`VIEW.COPY`, `:445`) | `alert('[VDBAS-EXP-XXXX]…')` | `useCopy(id)` → navigate sang draft mới | POST …/{id}/copy |
| handleConfirmDelete (`VIEW.DELETE_CONFIRM`, `:456`) | navigate | `useDelete(id,{deleteReason≥10,confirmReviewed:true})` | DELETE /exp/opex/dossiers/{id} |
| handlePrint (`VIEW.PRINT`) | `window.print()` | giữ nguyên (client-side) | — |
| Add document (`NEW.ADD_DOC`, `saveDocEntry :608`) | setState MOCK doc | `useAddDocument(id,{documentTypeCode,treasuryCode,documentDate,accountingDate,originalAmount,baseAmount,currencyCode?})` | POST …/{id}/documents |
| view document (`openDocAlert :527`) | alert | `useDocument(id,docId)` | GET …/documents/{docId} |
| delete document (`handleDeleteDoc :645`) | setState | `useDeleteDocument(id,docId)` | DELETE …/documents/{docId} |
| upload attachment (`:924` upload-zone) | `alert('Upload file…')` | `useUploadDossierAttachment(id,formData)`; LOV `useAttachmentTypes` | POST …/{id}/attachments |
| tab lịch sử duyệt / lịch sử thay đổi | MOCK/—  | `useApprovalLog(id)` / `useAuditLog(id)` | GET …/approval-log · …/audit-log |

> **GAP:** nút "check" (Checker duyệt) chưa có UI rõ ràng trên Detail — cần xác nhận với BA xem nằm ở action nào (có thể gộp vào Approve theo role). Endpoint `check` tồn tại nhưng chưa map nút.
> Endpoint mồ côi (chưa nút cắm): `downloadDossierAttachment`, `download/list documentAttachments`, `getExportJob` (poll) — cân nhắc bổ sung UI hoặc để dành.

## 5. Hook & React Query state
| Hook | queryKey / invalidate | State page liên quan (MOCK→hook) |
| --- | --- | --- |
| useList | `['opexDossiers','list',params]` | grid: MOCK→`result.items`; `isLoading`; pagination từ `pagination{page(0-based),size,totalElements,totalPages}`; `statusCounts` cho badge đếm; 2 lớp filter (input+committed) |
| useDetail | `['opexDossiers','detail',id]` | form record: MOCK→data; giữ `version` để gửi khi update |
| useCreate/useSaveDraft/useUpdate | invalidate `['opexDossiers']` (+detail) | `isPending`→disable nút Lưu; gửi header `Idempotency-Key`; update gửi `version`; onSuccess: skipNotification + callerOnSuccess |
| useDelete | invalidate list+detail | dialog xoá: `deleteReason`(≥10), `confirmReviewed` |
| useSubmit/useCheck/useApprove/useReject*/useReturn*/useCancel* | invalidate list+detail | nút workflow theo BTN_MATRIX (§7); body reason cho các action reject/return/cancel |
| useDocuments/useAddDocument/useUpdateDocument/useDeleteDocument | `['opexDossiers',id,'documents']` invalidate +detail | grid chứng từ |
| useDossierAttachments/useUpload*/useDelete*Attachment | `['opexDossiers',id,'attachments']` | vùng đính kèm |
| useApprovalLog/useAuditLog | `['opexDossiers',id,'approval-log'|'audit-log']` | tab lịch sử |
| useLov.* | `['lov',<name>,…]` staleTime dài | dropdown filter/form |

## 6. Field-map — schema → UI → types → model
> "Key page hiện tại" = field MOCK đang dùng (UPPER_SNAKE). Cần đổi sang field contract (camelCase) khi wire.

| Field (contract camelCase) | Key page hiện tại → contract | Dùng trong UI | Khai báo type | Hằng model | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| id | `id` | row key, navigate | OpexDossierSummary/Detail | OpexDossier.ID | uuid |
| dossierCode | `DOSSIER_CODE` | cột grid, header form | Summary/Detail | DOSSIER_CODE | read-only (BE-gen, VAL-17) |
| organizationCode | `BUDGET_UNIT_CODE → organizationCode` | filter, form | Create/Update/Detail | ORGANIZATION_CODE | required; LOV /lov/organizations |
| organizationName | `BUDGET_UNIT_NAME → organizationName` | hiển thị | Detail | ORGANIZATION_NAME | read-only (auto từ code) |
| treasuryCode | `TREASURY_CODE` | filter, form | Create/Update/Summary/Detail | TREASURY_CODE | required; LOV /lov/treasuries |
| treasuryName | `TREASURY_NAME` | grid, form | Summary/Detail | TREASURY_NAME | read-only |
| sendDate | `SEND_DATE`/`DOSSIER_DATE → sendDate` | grid, form | Create/Update/Summary/Detail | SEND_DATE | required (create/update) |
| dataSourceCode | `DATA_SOURCE_CODE` | filter, form | Create/Summary/Detail | DATA_SOURCE_CODE | required khi create; read-only sau first save (VAL-17); **KHÔNG** trong UpdateRequest |
| dossierTypeCode | — (cố định OPEX) | hidden/badge | Create/Detail | DOSSIER_TYPE_CODE | immutable (VAL-17); enum OPEX/CAPEX, default OPEX |
| fStatus | `F_STATUS`/`STATE_CODE → fStatus` | badge, filter | Summary/Detail | (StatusEnum) | **11-state**; mock đang dùng SAVED/VALIDATED (cũ) → phải map sang enum mới |
| version | `F_VER → version` | gửi khi update | Detail/UpdateRequest | VERSION | optimistic lock; required UpdateRequest |
| createdBy/createdDate | `CREATED_BY`/`CREATED_DATE` | grid, filter (createdBy LOV user) | Summary/Detail | CREATED_BY/DATE | read-only |
| checkedBy/approvedBy | `CHECKED_BY`/`APPROVED_BY` | filter (LOV user) | Detail | CHECKED_BY/APPROVED_BY | read-only; filter param |
| assignUser | `ASSIGN_USER` | hiển thị | Detail/WorkflowActionResult | ASSIGN_USER | read-only (BE) |
| status | — | (ẩn) | Detail | STATUS | int 0/1 hiệu lực; read-only |
| workflowCode/sla/hashInfo/completedDate | — | (ẩn/hiển thị) | Detail | … | read-only BE-managed |
| projectCode/projectName/projectSpecific* | — | null cho OPEX | Detail | — | CAPEX-only; OPEX null |
| **Document** documentTypeCode | `DOC_TYPE → documentTypeCode` | grid chứng từ, form | DocumentCreate/Detail | DOC.DOCUMENT_TYPE_CODE | required; LOV /lov/document-types |
| documentName | `DOC_NAME → documentName` | grid | DocumentDetail | DOC.DOCUMENT_NAME | read-only (auto LOV.03) |
| documentNo | `DOC_NUMBER → documentNo` | grid | DocumentDetail | DOC.DOCUMENT_NO | read-only (BE-gen) |
| documentDate | `DOC_DATE → documentDate` | form | DocumentCreate/Detail | DOC.DOCUMENT_DATE | required |
| accountingDate | `POSTING_DATE → accountingDate` | form | DocumentCreate/Detail | DOC.ACCOUNTING_DATE | required |
| originalAmount | `AMOUNT → originalAmount` | grid (#,##0) | DocumentCreate/Detail | DOC.ORIGINAL_AMOUNT | required; integer |
| baseAmount | `VND_AMOUNT → baseAmount` | grid (#,##0) | DocumentCreate/Detail | DOC.BASE_AMOUNT | required; integer; VAL tổng khớp |
| currencyCode | `CURRENCY_CODE → currencyCode` | form | DocumentCreate/Detail | DOC.CURRENCY_CODE | ⚠ contract ghi **VERIFY: chưa có cột trong DDL** — có thể không persist |

## 7. State machine → BTN_MATRIX
> Enum 11-state OPEX. Role MAKER/CHECKER/APPROVER (claim JWT).

| Trạng thái | Action show | Role | Hook |
| --- | --- | --- | --- |
| DRAFT | Sửa, Xoá, Lưu/Lưu nháp, Gửi kiểm soát, Sao chép | MAKER (gốc) | useUpdate/useDelete/useSaveDraft/useSubmit/useCopy |
| REJECTED_BY_CHECKER / CHECK_REJECTED | Sửa, Xoá, Gửi lại | MAKER (gốc) | useUpdate/useDelete/useSubmit |
| PENDING_CHECKER | Duyệt kiểm soát, Từ chối, Trả lại Maker | CHECKER (≠Maker, SoD BIZ-001) | useCheck/useRejectByChecker/useReturnByChecker |
| CHECKED / APPROVAL_PENDING | Phê duyệt, Từ chối duyệt, Huỷ về Checker | APPROVER (SoD) | useApprove/useRejectByApprover/useCancelApproval |
| APPROVED | (chỉ xem), In | — | — |
| APPROVAL_REJECTED / CHECK_CANCELLED / APPROVAL_CANCELLED | xem; tuỳ flow quay lại | — | — |
| DELETED | (ẩn khỏi list; chỉ audit) | — | — |
> ⚠ Mock hiện dùng F_STATUS cũ (`SAVED`,`VALIDATED`,`SUBMITTED`) — khi wire phải ánh xạ BTN_MATRIX sang 11-state contract.

## 8. Types cần thêm (src/types/index.ts — Opex* song song)
- `OpexDossierStatus` = 11 literal (DRAFT…DELETED)
- `OpexActionRole` = MAKER|CHECKER|APPROVER ; `OpexDossierType` = OPEX|CAPEX
- Requests: `OpexDossierCreateRequest`, `OpexDossierDraftRequest`, `OpexDossierUpdateRequest`(version required), `DeleteOpexDossierRequest`, `OpexApproveRequest`(reason?, digitalSign?), `OpexRejectRequest`(reason required), `OpexDocumentCreateRequest`, `OpexDocumentUpdateRequest`, `AttachmentUploadRequest`
- Responses: `OpexDossierSummary`, `OpexDossierDetail`, `OpexDossierCreateResponse`, `OpexDossierUpdateResponse`, `OpexWorkflowActionResponse`, `OpexDocumentDetail`, `OpexAttachment`, `OpexApprovalLogEntry`, `OpexAuditLogEntry`, `ExportJob`
- Envelope: `OpexPagination{page,size,totalElements,totalPages}`, `OpexDossierListResponse{items,pagination,statusCounts}`, `OpexDossierListResult` (sau adapter), `LovItem{code,name,description}`, `LovListResponse{items,pagination}`
- Params: `OpexDossierListParams{dossierCode,fromDate,toDate,dateField,fStatus[],dataSourceCode,createdBy,checkedBy,approvedBy,page(0),size,sort}`, `ExportOpexParams{format,…}`
> Tái dùng generic `MutationHookOptions`, `PaginationState` (UI). KHÔNG tái dùng `PagedResponse<T>` cho list (envelope khác).

## 9. Mã lỗi / thông báo → i18n
| Mã | loại | key i18n đề xuất | có sẵn? |
| --- | --- | --- | --- |
| MSG-ERR-REQUIRED / FORMAT / LOOKUP | 400 | `opexDossier.error.required/format/lookup` | cần verify |
| MSG-ERR-SESSION | 401 | `common.error.session` | thường có |
| MSG-ERR-PERMISSION / MSG-ERR-MAKER | 403 | `opexDossier.error.permission/maker` | cần verify |
| MSG-ERR-LOCK / MSG-ERR-STATUS | 409 | `opexDossier.error.lock/status` | cần verify |
| MSG-ERR-AMOUNT-MISMATCH | 422 | `opexDossier.error.amountMismatch` | cần verify |
| MSG-ERR-FILE (413/415) | upload | `opexDossier.error.file` | cần verify |
| MSG-OK-SAVE / SUBMIT / DELETE | success | `opexDossier.ok.save/submit/delete` | cần verify |
| MSG-INF-NOTIFY-CHECK_REJ / APPROVAL_REJ | info | `opexDossier.info.checkReject/approvalReject` | cần verify |
> Interceptor `api.ts` map theo `ErrorResponse.code` — bổ sung key thiếu, không sửa key chung sẵn có.

## 10. Convention bắt buộc khi apply
- **BẤT BIẾN Capex**: KHÔNG sửa `dossierService.ts`/`useDossier.ts`/`DossierStatus`/`DossierListParams`/`models/Dossier.ts`. OPEX = file/symbol song song (`opexDossierService.ts`, `useOpexDossier.ts`, `OpexDossier.ts`, type `Opex*`).
- List = **GET + query**, `page` **0-based**, `size`∈[20,50,100,200], `sort='createdDate,desc'` (chuỗi).
- **Adapter ở service** unwrap `DossierListResponse{items,pagination,statusCounts}` (envelope khác `PagedResponse<T>`).
- Header **`Idempotency-Key`** trên mọi mutation; `version` trong UpdateRequest (optimistic lock).
- queryKey bắt đầu `['opexDossiers',…]`; invalidate sau mutation; `skipNotification` + `callerOnSuccess`.
- Lỗi do interceptor: page chỉ `if (_handled) return` rồi fallback toast.
- Mọi interface trong `src/types/index.ts`; hằng field trong `src/models/OpexDossier.ts`.
- Export: service đọc status (200 Blob vs 202 ExportJob → poll `getExportJob`).

## 11. Cảnh báo / cần làm rõ
- **Envelope list ≠ `PagedResponse<T>`** → BẮT BUỘC adapter unwrap `.items`/`.pagination`, nếu không grid vỡ.
- **page 0-based**: contract dùng 0-based; nếu UI dùng 1-based phải +1 ở adapter (lưu ý off-by-one). (Capex service hiện convert 1-based→0; OPEX có thể giữ 0-based gốc — chọn 1 quy ước nhất quán trong page.)
- **GAP nút `check`** (Checker duyệt) chưa có UI rõ — hỏi BA.
- **LOV envelope khác**: contract LOV trả `{items,pagination}`; `lovService.ts` hiện trả **flat array** cho cùng path `/lov/*` — nếu BE đổi sang envelope sẽ ảnh hưởng Capex. Cần adapter unwrap riêng cho OPEX hoặc xác nhận BE (xem §12).
- **currencyCode** document: contract ghi *VERIFY: chưa có cột trong DDL* → có thể không persist; xác nhận trước khi bind bắt buộc.
- **Mock dùng status cũ** (SAVED/VALIDATED) ≠ 11-state OPEX → map lại BTN_MATRIX khi wire.
- Endpoint mồ côi (download attachment, document attachments, poll export) chưa có UI — bổ sung hoặc để dành.
- i18n nhiều key `MSG-*` chưa verify — bổ sung trước khi apply.

## 12. Ảnh hưởng tới chức năng HIỆN TẠI (regression surface)
| File EDIT | Symbol/chức năng cùng file | Rủi ro | Cách an toàn |
| --- | --- | --- | --- |
| src/types/index.ts | `DossierStatus`/`DossierListParams`/`DossierSummary`/`DossierDetail` (Capex), generic `PagedResponse`,`MutationHookOptions`,`PaginationState` | đổi type cũ → vỡ Capex + module khác | **chỉ THÊM** type `Opex*` mới; KHÔNG sửa type/generic đang dùng |
| src/services/lovService.ts | `lovOrganizations/lovTreasuries/lovDataSources/lovDocumentTypes/lovAttachmentTypes` — **Capex pages đang dùng** | nếu sửa các hàm này (đổi envelope/return) → Capex LOV vỡ | chỉ THÊM hàm mới (`lovDossierTypes/lovCurrencies/lovUsers`); nếu OPEX cần unwrap `.items` → tạo biến thể OPEX riêng, KHÔNG đổi hàm cũ |
| src/hooks/useLov.ts | hook LOV Capex dùng | tương tự | chỉ THÊM `useDossierTypes/useCurrencies/useUsers` |
| src/locales/vi.json, en.json | key i18n module khác | trùng/ghi đè key → vỡ chữ màn khác | thêm key namespace `opexDossier.*`, không sửa key cũ |
| src/pages/OpexDossierListPage.tsx · OpexDossierDetailPage.tsx | handler/BTN_MATRIX/filter/MOCK đang chạy (prototype OPEX) | thay MOCK→hook đổi luồng UI | giữ cấu trúc + data-event-id, chỉ thay nguồn data + handler |
> **Lưu ý chính:** lớp data `dossierService.ts`/`useDossier.ts`/`Dossier.ts`/`DossierStatus` **KHÔNG đụng** (Capex frozen) → tạo song song cho OPEX. Regression thực tế còn lại chỉ ở **`lovService.ts`/`useLov.ts`** (dùng chung) — khử bằng cách **chỉ cộng thêm hàm/biến thể OPEX**, không sửa hàm Capex đang dùng. Nếu giữ được nguyên tắc này, §12 còn rủi ro = 0 ngoài 2 file LOV.
