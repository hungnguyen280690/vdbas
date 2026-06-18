# Impact FE — Dossier (Hồ sơ Chi đầu tư CAPEX)

> Nguồn contract: `apiContract/API-contract.yaml` (EXP CAPEX Dossier API v0.2.0) · Convention: `src/` (cấu trúc phẳng) + CLAUDE.md
> **Chưa sinh code** — báo cáo để review trước khi chạy `gen-fe-code`.

## 1. Tóm tắt

- **Chức năng**: EXP.CAPEX_DOSSIER · module=`exp`, group=`capex`, entity=`dossiers` · `{Entity}=Dossier` · path param `{dossierId}` (uuid) · domain queryKey=`dossiers`
- **Base path**: `/api/v1` (server) → wrapper `api.ts` đang dùng `VITE_API_BASE_URL` (mặc định `http://localhost:8080/api`). ⚠️ **Lệch base**: contract `/api/v1`, wrapper mặc định `/api` → cần set `VITE_API_BASE_URL=.../api/v1` hoặc prefix `/v1` trong path service. **Auth**: bearer JWT (`kc_token`) — đã có sẵn interceptor.
- **Tổng endpoint**: 30 — Dossiers 7 · Workflow 3 · Documents 5 · Attachments 4 · Audit 2 · Export 1 · LOV 8
- **Schema**: ~40 · **Trạng thái (DossierStatus)**: DRAFT, SAVED, VALIDATED, SUBMITTED, APPROVED, REJECTED, COMPLETED, CANCELLED · **Role (ActionRole)**: MAKER, CHECKER, APPROVER
- **Kiểu list phát hiện**: `GET /exp/capex/dossiers` + **query params** (KHÔNG phải POST /search như CLAUDE.md mô tả cho category-groups)
- **page base**: ⚠️ **1-based** (`minimum:1, default:1`) — KHÁC convention 0-based trong CLAUDE.md → cảnh báo off-by-one (xem §11). `pageSize` enum cố định `[20,50,100,200]`, `sortBy`+`sortDir` (không phải `sort`)
- **Envelope**: ⚠️ **bọc** `{ success, data:{ items, pagination:{ page,pageSize,totalRecords,totalPages } } }` — KHÁC `PagedResponse<T>` (content/totalElements) → **cần adapter ở service** unwrap (xem §10/§11)
- **Optimistic lock**: ✅ có — `version` bắt buộc trong `DossierUpdateRequest`, `UpdateDocumentRequest` và body `submit`
- **Idempotency**: ✅ có — header `X-Idempotency-Key` (UUID client sinh) trên create/draft/submit/approve/reject/copy/add-document/upload
- **Trạng thái code hiện tại**:
  - ❌ Chưa có `dossierService.ts`, `useDossier.ts`, `Dossier.ts` (model), type Dossier trong `types/index.ts`
  - ⚠️ Page **đã tồn tại** & chạy bằng **MOCK tĩnh**: `CapexDossierListPage.tsx` (import `MOCK_DATA` từ `.mock.ts`, lọc/phân trang client-side), `CapexDossierDetailPage.tsx` (đọc `MOCK_DATA`, mọi action = `alert/confirm/navigate`)
  - ⚠️ LOV hiện **hardcode** trong detail page (`LOV01`, `LK_DATA`) — chưa có service lookup
  - ⚠️ Field UI dùng **UPPER_SNAKE** (DOSSIER_CODE, F_STATUS, TOTAL_LOCAL_AMOUNT…) khác **camelCase** contract (dossierCode, fStatus, totalBaseAmount…) → cần map (xem §6)

## 2. Bảng endpoint → kế hoạch code

> Envelope mọi response đều bọc `{success, data}` → cột "Kiểu trả" ghi shape sau khi unwrap `.data`.

| Method | Path | operationId | Hàm service | Hook | queryKey / invalidate | Kiểu trả (sau adapter) |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/exp/capex/dossiers` | listDossiers | `listDossiers(params)` | `useList` | `['dossiers','list',params]` | `{items:DossierSummary[], pagination, totalBaseAmount, statusCounts}` |
| POST | `/exp/capex/dossiers` | createDossier | `createDossier(data, idemKey)` | `useCreate` | inv `['dossiers']` | `{id,dossierCode,fStatus,version}` |
| POST | `/exp/capex/dossiers/drafts` | saveDossierDraft | `saveDossierDraft(data, idemKey)` | `useSaveDraft` | inv `['dossiers']` | `{id,dossierCode,fStatus,version}` |
| GET | `/exp/capex/dossiers/{dossierId}` | getDossier | `getDossier(id)` | `useDetail` | `['dossiers','detail',id]` | `DossierDetail` |
| PUT | `/exp/capex/dossiers/{dossierId}` | updateDossier | `updateDossier(id,data)` | `useUpdate` | inv `['dossiers']`+`['dossiers','detail',id]` | `{id,dossierCode,fStatus,version}` |
| DELETE | `/exp/capex/dossiers/{dossierId}` | deleteDossier | `deleteDossier(id,body)` | `useDelete` | inv `['dossiers']` | `SuccessResponse` |
| POST | `/exp/capex/dossiers/{dossierId}/submit` | submitDossier | `submitDossier(id,{version},idemKey)` | `useSubmit` | inv `['dossiers']`+detail | `{dossierId,fStatus,assignUser}` |
| POST | `/exp/capex/dossiers/{dossierId}/approve` | approveDossier | `approveDossier(id,body,idemKey)` | `useApprove` | inv `['dossiers']`+detail | `{dossierId,fStatus,assignUser}` |
| POST | `/exp/capex/dossiers/{dossierId}/reject` | rejectDossier | `rejectDossier(id,{reason},idemKey)` | `useReject` | inv `['dossiers']`+detail | `{dossierId,fStatus,assignUser}` |
| POST | `/exp/capex/dossiers/{dossierId}/copy` | copyDossier | `copyDossier(id,idemKey)` | `useCopy` | inv `['dossiers']` | `{id,dossierCode,fStatus,version}` |
| GET | `.../{dossierId}/documents` | listDossierDocuments | `listDossierDocuments(id)` | `useDocuments` | `['dossiers','documents',id]` | `{items:DocumentSummary[], totalBaseAmount, totalOriginalAmount}` |
| POST | `.../{dossierId}/documents` | addDocumentToDossier | `addDocument(id,data,idemKey)` | `useAddDocument` | inv documents+detail | `DocumentDetail` |
| GET | `.../documents/{documentId}` | getDossierDocument | `getDocument(id,docId)` | `useDocumentDetail` | `['dossiers','document',id,docId]` | `DocumentDetail` |
| PUT | `.../documents/{documentId}` | updateDossierDocument | `updateDocument(id,docId,data)` | `useUpdateDocument` | inv documents+detail | `DocumentDetail` |
| DELETE | `.../documents/{documentId}` | removeDossierDocument | `removeDocument(id,docId)` | `useRemoveDocument` | inv documents+detail | `SuccessResponse` |
| GET | `.../{dossierId}/attachments` | listDossierAttachments | `listAttachments(id)` | `useAttachments` | `['dossiers','attachments',id]` | `AttachmentInfo[]` |
| POST | `.../{dossierId}/attachments` | uploadDossierAttachment | `uploadAttachment(id,formData,idemKey)` | `useUploadAttachment` | inv attachments | `AttachmentInfo` (multipart) |
| GET | `.../attachments/{attachmentId}` | downloadDossierAttachment | `downloadAttachment(id,attId)` | (gọi trực tiếp, blob) | — | `binary` (responseType blob) |
| DELETE | `.../attachments/{attachmentId}` | deleteDossierAttachment | `deleteAttachment(id,attId)` | `useDeleteAttachment` | inv attachments | `SuccessResponse` |
| GET | `.../{dossierId}/approval-log` | getDossierApprovalLog | `getApprovalLog(id)` | `useApprovalLog` | `['dossiers','approval-log',id]` | `{dossierId,currentStatus,workflow:ApprovalLogEntry[]}` |
| GET | `.../{dossierId}/audit-log` | getDossierAuditLog | `getAuditLog(id,params)` | `useAuditLog` | `['dossiers','audit-log',id,params]` | `{items:AuditLogEntry[], pagination}` |
| GET | `/exp/capex/dossiers/export` | exportDossiers | `exportDossiers(params)` | (gọi trực tiếp, blob/202) | — | `binary` HOẶC `{jobId,...}` (202 async) |
| GET | `/lov/projects` | lovProjects | `lovProjects(params)` | `useLovProjects` | `['lov','projects',params]` | `{items:ProjectLovItem[], pagination}` |
| GET | `/lov/projects/{projectCode}/specific` | lovProjectSpecific | `lovProjectSpecific(code)` | `useLovProjectSpecific` | `['lov','project-specific',code]` | `ProjectSpecificLovItem[]` |
| GET | `/lov/treasuries` | lovTreasuries | `lovTreasuries(search)` | `useLovTreasuries` | `['lov','treasuries',search]` | `{treasuryCode,treasuryName}[]` |
| GET | `/lov/investors` | lovInvestors | `lovInvestors(search)` | `useLovInvestors` | `['lov','investors',search]` | `{investorCode,investorName}[]` |
| GET | `/lov/project-management` | lovProjectManagement | `lovProjectManagement(params)` | `useLovProjectManagement` | `['lov','project-management',params]` | `{projectManagementCode,projectManagementName}[]` |
| GET | `/lov/data-sources` | lovDataSources | `lovDataSources()` | `useLovDataSources` | `['lov','data-sources']` | `DataSourceItem[]` |
| GET | `/lov/document-types` | lovDocumentTypes | `lovDocumentTypes()` | `useLovDocumentTypes` | `['lov','document-types']` | `DocumentTypeItem[]` |
| GET | `/lov/attachment-types` | lovAttachmentTypes | `lovAttachmentTypes()` | `useLovAttachmentTypes` | `['lov','attachment-types']` | `AttachmentTypeItem[]` |

## 3. File ảnh hưởng (đường dẫn chính xác + symbol)

| File | Hành động | Symbol thêm/sửa | Lý do |
| --- | --- | --- | --- |
| `src/types/index.ts` | EDIT | `DossierStatus`, `ActionRole`, `DossierSummary`, `DossierDetail`, `DossierCreateRequest`, `DossierDraftRequest`, `DossierUpdateRequest`, `DeleteDossierRequest`, `ApproveRequest`, `RejectRequest`, `DocumentSummary`, `DocumentDetail`, `AddDocumentRequest`, `UpdateDocumentRequest`, `AttachmentInfo`, `ApprovalLogEntry`, `AuditLogEntry`, `Pagination`, `StatusCount`, `DossierListResult`, `*LovItem`, `DataSourceItem`, `DocumentTypeItem`, `AttachmentTypeItem`, các `*Response` envelope | tái dùng `PaginationState`, `MutationHookOptions`; `PagedResponse<T>` **không khớp** (envelope dùng `items`/`pagination.totalRecords`) → khai báo `DossierListResult` riêng |
| `src/models/Dossier.ts` | CREATE | `class Dossier { static DOSSIER_CODE='dossierCode'; static F_STATUS='fStatus'; static SEND_DATE='sendDate'; static PROJECT_CODE='projectCode'; static PROJECT_NAME='projectName'; static DATA_SOURCE_CODE='dataSourceCode'; static INVESTOR_CODE='investorCode'; static PROJECT_MANAGEMENT_CODE='projectManagementCode'; static TOTAL_BASE_AMOUNT='totalBaseAmount'; static DOCUMENT_COUNT='documentCount'; static CREATED_BY='createdBy'; static CREATED_DATE='createdDate'; static VERSION='version'; … }` | hằng tên field **camelCase** đúng contract (thay UPPER_SNAKE hiện trong page) |
| `src/services/dossierService.ts` | CREATE | 30 hàm theo §2 + **adapter unwrap** `.data` + truyền header `X-Idempotency-Key` qua `config.headers` cho POST + `responseType:'blob'` cho download/export | dùng wrapper `get/post/put/del`; danh mục LOV gom chung file này hoặc tách `lovService.ts` |
| `src/services/lovService.ts` | CREATE (khuyến nghị tách) | `lovProjects`, `lovProjectSpecific`, `lovTreasuries`, `lovInvestors`, `lovProjectManagement`, `lovDataSources`, `lovDocumentTypes`, `lovAttachmentTypes` | đổ dropdown/F4 lookup; staleTime dài |
| `src/hooks/useDossier.ts` | CREATE | object `DossierHooks { useList, useDetail, useCreate, useSaveDraft, useUpdate, useDelete, useSubmit, useApprove, useReject, useCopy, useDocuments, useAddDocument, useUpdateDocument, useRemoveDocument, useAttachments, useUploadAttachment, useDeleteAttachment, useApprovalLog, useAuditLog }` | React Query gom theo domain |
| `src/hooks/useLov.ts` | CREATE | object `LovHooks { useProjects, useProjectSpecific, useTreasuries, useInvestors, useProjectManagement, useDataSources, useDocumentTypes, useAttachmentTypes }` | lookup hooks |
| `src/pages/CapexDossierListPage.tsx` | EDIT | thay `MOCK_DATA`→`DossierHooks.useList`, query server-side, cắm handler→hook (xem §4a) | wire call-site |
| `src/pages/CapexDossierDetailPage.tsx` | EDIT | thay `MOCK_DATA`→`useDetail`, cắm `onSave/onSaveDraft/onSubmit/onApprove/onReject/onConfirmDelete/onCopy/add-doc/upload`→hook, thay `LOV01`/`LK_DATA`→`LovHooks` (xem §4b) | wire call-site |
| `src/pages/CapexDossierListPage.mock.ts` | SKIP | — | MOCK tĩnh, gỡ import sau khi wire |
| `src/pages/CapexDossierDetailPage.mock.ts` | SKIP | — | MOCK tĩnh, gỡ import sau khi wire |
| `src/locales/vi.json`, `en.json` | EDIT | thêm nhóm `error.*` cho mã VDBAS (xem §9) + key `common` cho thông báo success | interceptor map `error.{errorCode.toLowerCase()}` |

## 4. Call-site map — nơi CALL API trong page

### 4a. CapexDossierListPage.tsx

| Action UI / handler | Hiện làm gì | Thay bằng hook | Endpoint |
| --- | --- | --- | --- |
| nguồn data grid (`allRecords` từ `MOCK_DATA.records`) | `useState(MOCK_DATA.records)` + `computeFiltered` client-side | `DossierHooks.useList(queryParams)` → `data.items` | listDossiers |
| `handleSearch` | `computeFiltered` local + `setFilteredRecords` | commit `inputFilters`+`multiSelect`→ filters → re-query `useList` (page=1) | listDossiers |
| phân trang `goPage` / `PAGE_SIZE=10` | slice mảng client | `page`/`pageSize` vào queryParams (⚠️ **page 1-based**, pageSize ∈ [20,50,100,200]) | listDossiers |
| sort `handleSort` (`sortField`,`sortDir`) | sort client | `sortBy` (enum) + `sortDir` (ASC/DESC) vào queryParams | listDossiers |
| filter Nguồn (`multiSelect.source` = `'Thủ công'`/`'DVC'`) | lọc client | param `dataSourceCode` (multi, explode) ⚠️ **giá trị contract = `THU_CONG`/`DVC`** không phải `'Thủ công'` | listDossiers |
| filter Trạng thái (`multiSelect.status`) | lọc client | param `fStatus` (multi, explode, enum DossierStatus) | listDossiers |
| filter docId/projectId/search/createdBy/date | lọc client | param `dossierCode`/`projectCode`/`search`/`createdBy`/`dateField`+`fromDate`+`toDate` | listDossiers |
| stats bar (đếm theo status, tổng tiền) | tính từ `filteredRecords` | dùng `data.statusCounts` + `data.totalBaseAmount` từ response | listDossiers |
| `handleConfirmSubmit` (nút 📤 Gửi PD) | `window.confirm`+`setState`+`alert` | `DossierHooks.useSubmit().mutateAsync({id, version})` | submitDossier |
| `handleCopyRecord` (nút 📋 Copy) | `navigate(...copy)` | (giữ navigate, hoặc) `useCopy().mutateAsync(id)` rồi điều hướng | copyDossier |
| nút 🗑 Xoá (row) | `navigate detail` | mở dialog delete → `useDelete` (xem detail) | deleteDossier |
| `handleExport` (📥 Xuất) | `window.alert('[Prototype]')` | `exportDossiers(params)` (blob hoặc 202 jobId) | exportDossiers |
| nút ✅ Duyệt / ✖ Từ chối (row) | `navigate view` | điều hướng sang detail (action thực hiện ở detail) | approve/reject |

### 4b. CapexDossierDetailPage.tsx

| Action UI / handler | Hiện làm gì | Thay bằng hook | Endpoint |
| --- | --- | --- | --- |
| load record (`MOCK_DATA.records.find`) | đọc mock theo `id` | `DossierHooks.useDetail(recordId)` (enabled khi có id & mode≠new) | getDossier |
| `onSave` (✔ Lưu) | validate + `alert` | mode `new` → `useCreate(body, idemKey)`; mode `edit` → `useUpdate(id, {...body, version})` | createDossier / updateDossier |
| `onSaveDraft` (💾 Lưu nháp) | `alert` | `useSaveDraft(body, idemKey)` | saveDossierDraft |
| `onSubmit` (📤 Gửi phê duyệt) | `confirm`+`alert`+`navigateBack` | `useSubmit({id, version}, idemKey)` | submitDossier |
| `onApprove` (✅ Phê duyệt) | `confirm`+`alert` | `useApprove(id, {reason?, digitalSign?}, idemKey)` | approveDossier |
| `onReject` (✖ Từ chối) | `window.prompt`+`alert` | `useReject(id, {reason}, idemKey)` — reason ≥10 ký tự | rejectDossier |
| `onConfirmDelete` (dialog Xoá) | `alert`+`navigateBack` | `useDelete(id, {deleteReason, confirmReviewed})` — reason ≥10 & confirmReviewed=true | deleteDossier |
| `onCancelRecord` (⊘ Hủy bỏ) | `confirm`+`alert` | ⚠️ **không có endpoint riêng** — soft-delete `deleteDossier` chuyển → CANCELLED (xem §11 GAP) | deleteDossier |
| `pickLookup`/`openLookup` PROJECT (F4) | `LK_DATA.PROJECT` hardcode | `LovHooks.useProjects(search)` ; chọn → auto-fill `projectName`, `investorCode`, `projectManagementCode` | lovProjects |
| lookup SPEC (dự án đặc thù, Military) | `LK_DATA.SPEC` hardcode | `LovHooks.useProjectSpecific(projectCode)` | lovProjectSpecific |
| lookup BOARD (ĐVQHNS) | `LK_DATA.BOARD` hardcode | `LovHooks.useProjectManagement({projectCode})` | lovProjectManagement |
| select DATA_SOURCE_CODE | `<option>` hardcode 'Thủ công'/'DVC' | `LovHooks.useDataSources()` (value=`THU_CONG`/`DVC`) | lovDataSources |
| grid chứng từ (tab General, `docs` từ `record.documents`) | đọc mock | `DossierHooks.useDocuments(id)` (hoặc dùng `detail.documents`) | listDossierDocuments |
| nút "+ Thêm mới chứng từ" | `window.alert('[Prototype]')` | `useAddDocument(id, body, idemKey)` — body cần `documentTypeCode` (dùng `useDocumentTypes`) | addDocumentToDossier |
| sửa/xoá chứng từ (✏️/🗑️ trong grid) | `window.alert('[Prototype]')` / `confirm`+`setDocs` | `useUpdateDocument(id,docId,{...,version})` / `useRemoveDocument(id,docId)` | update/removeDossierDocument |
| tab Đính kèm — "Chọn file"/kéo thả | nút tĩnh, chưa xử lý | `useUploadAttachment(id, formData, idemKey)` (multipart: file+attachmentTypeCode); list = `useAttachments(id)` | upload/listDossierAttachments |
| tab Lịch sử (history-table) | "Chưa có lịch sử" tĩnh | `useAuditLog(id, {page,pageSize})` | getDossierAuditLog |
| tab Trạng thái phê duyệt (`approvalSteps`) | dựng từ `record` mock | `useApprovalLog(id)` → `workflow[]` | getDossierApprovalLog |
| nút 🖨️ In phiếu (PRINT) | nút tĩnh | ⚠️ **không có endpoint** → client-side print / GAP (xem §11) | — |

## 5. Hook & React Query state

| Hook | queryKey / invalidate | State page liên quan (MOCK→hook) |
| --- | --- | --- |
| `useList` | `['dossiers','list',params]` | grid: `MOCK_DATA.records`→`data.items`; `isLoading`; pagination ⚠️ **page 1-based**; total=`data.pagination.totalRecords`; stats=`data.statusCounts`/`data.totalBaseAmount`; 2 lớp filter (input→committed) |
| `useDetail` | `['dossiers','detail',id]` | form: `MOCK_DATA.find`→`data`; phải lưu `data.version` để gửi khi update/submit |
| `useCreate`/`useSaveDraft` | inv `['dossiers']` | `isPending`→disable nút Lưu; sinh `X-Idempotency-Key` (uuid) 1 lần/submit; onSuccess: skipNotification + callerOnSuccess (điều hướng / set DOSSIER_CODE) |
| `useUpdate` | inv `['dossiers']`+`['dossiers','detail',id]` | gửi kèm `version`; 409 VDBAS-EXP-0005 → reload |
| `useDelete` | inv `['dossiers']` | body `{deleteReason,confirmReviewed}`; nút Xác nhận disable tới khi reason≥10 & checkbox |
| `useSubmit`/`useApprove`/`useReject`/`useCopy` | inv `['dossiers']`+detail | `isPending`→disable; submit cần `version`; reject cần `reason`≥10; idempotency header |
| `useDocuments`/`useAddDocument`/`useUpdateDocument`/`useRemoveDocument` | `['dossiers','documents',id]`; mutation inv documents+detail | grid chứng từ + footer `totalBaseAmount` |
| `useAttachments`/`useUploadAttachment`/`useDeleteAttachment` | `['dossiers','attachments',id]` | tab đính kèm; upload multipart |
| `useApprovalLog`/`useAuditLog` | `['dossiers','approval-log',id]` / `['dossiers','audit-log',id,params]` | tab phê duyệt / tab lịch sử |
| `LovHooks.*` | `['lov',<name>,...]` | đổ dropdown/F4; `staleTime` dài (5–10 phút) |

## 6. Field-map — schema (camelCase) → UI (UPPER_SNAKE hiện tại) → types → model

| Field contract | UI hiện dùng | Dùng trong UI | Type | Hằng model | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `id` (uuid) | `id` | key row, path param | DossierSummary/Detail | `Dossier.ID` | |
| `dossierCode` | `DOSSIER_CODE` | cột grid, label form | Summary/Detail | `Dossier.DOSSIER_CODE` | read-only (auto-gen, immutable VAL-17) — KHÔNG gửi trong Request |
| `version` | — (chưa có) | ẩn, gửi khi update/submit | Detail/UpdateRequest | `Dossier.VERSION` | ⚠️ **optimistic lock bắt buộc** — page hiện chưa lưu |
| `sendDate` (yyyy-MM-dd) | `SEND_DATE` (dd/mm/yyyy) | field form, cột, filter | Summary/Detail/Request | `Dossier.SEND_DATE` | ⚠️ **lệch format ngày** — cần convert dd/mm/yyyy ↔ yyyy-MM-dd |
| `dataSourceCode` (THU_CONG/DVC) | `DATA_SOURCE_CODE` ('Thủ công'/'DVC') | select, filter, chip | Summary/Detail/Request | `Dossier.DATA_SOURCE_CODE` | ⚠️ **lệch giá trị enum** — UI dùng nhãn TV, contract dùng code |
| `dataSourceName` | (chip hiển thị) | label | Summary/Detail | — | read-only |
| `fStatus` (enum) | `F_STATUS` | badge, filter | Summary/Detail | `Dossier.F_STATUS` | enum DossierStatus |
| `fStatusName` | (nhãn badge) | badge label | Summary/Detail | — | read-only |
| `projectCode` | `PROJECT_CODE` | field+F4, cột, filter | Summary/Detail/Request | `Dossier.PROJECT_CODE` | required |
| `projectName` | `PROJECT_NAME` | field readonly, cột | Summary/Detail | — | auto-fill từ project |
| `projectType` (MILITARY/CITIZEN) | `PROJECT_TYPE` (Military/Citizen) | điều kiện show field đặc thù | Detail | `Dossier.PROJECT_TYPE` | ⚠️ lệch hoa/thường |
| `projectSpecificCode/Name` | `PROJECT_SPECIFIC_*` | field (Military) | Detail/Request | `Dossier.PROJECT_SPECIFIC_CODE` | nullable; chỉ MILITARY |
| `investorCode` | — (**thiếu trong form**) | field (auto-fill) | Detail/Request | `Dossier.INVESTOR_CODE` | ⚠️ **GAP UI**: `DossierCreateRequest.investorCode` **required** nhưng form detail chưa có field này |
| `investorName` | — | label | Detail | — | read-only |
| `projectManagementCode/Name` | `PROJECT_MANAGEMENT_*` | field+F4 | Detail/Request | `Dossier.PROJECT_MANAGEMENT_CODE` | required code |
| `treasuryCode/Name` | — | (từ JWT scope) | Detail | — | read-only BE |
| `documentCount` | `DOCUMENT_COUNT` | cột grid | Summary | `Dossier.DOCUMENT_COUNT` | read-only |
| `totalBaseAmount` | `TOTAL_LOCAL_AMOUNT` | cột "Tổng tiền VND", footer | Summary/Detail | `Dossier.TOTAL_BASE_AMOUNT` | ⚠️ lệch tên |
| `createdBy`/`createdDate` | `CREATED_BY`/`CREATED_DATE` | cột, tab lịch sử | Summary/Detail | `Dossier.CREATED_BY` | read-only |
| `assignUser`,`sla`,`completedDate`,`updatedBy`,`updatedDate` | `ASSIGN_USER`,… | workflow/audit | Detail | — | read-only BE-managed (§B5 out of scope input) |
| `checkedBy/checkedDate/checkRejectionReason`, `approvedBy/approvedDate/approvalRejectionReason`, `returningReason` | `CHECKED_*`,`APPROVED_*`,`*_REJECTION_REASON` | cột hideable, tab phê duyệt | Summary | — | read-only; cột mặc định ẩn |

> Field UI **không có trong contract** (chỉ ở mock): `PROJECT_ITEM_CODE/NAME`, `CONTRACT_CODE/NAME`, `ACCOUNTING_STATUS` → bỏ khi wire hoặc xác nhận BE bổ sung (§11).
> Field **DocumentSummary**: `seqNo, documentTypeCode, documentName, documentNo, documentDate, accountingDate, originalAmount, baseAmount` — grid mock đang dùng `DOC_ID/DOC_DATE/POSTING_DATE/DOC_NAME/PAYMENT_AMOUNT/VND_PAYMENT_AMOUNT` → cần map lại.

## 7. State machine → BTN_MATRIX

> Enum & role THẬT từ contract. BTN_MATRIX hiện đã có trong cả 2 page, đối chiếu với luồng contract:

| Trạng thái | Action show | Role thực hiện | Hook tương ứng |
| --- | --- | --- | --- |
| DRAFT | EDIT, DELETE, SUBMIT, COPY (PRINT disable) | MAKER | useUpdate/useDelete/useSubmit/useCopy |
| SAVED | EDIT, DELETE, SUBMIT, COPY, PRINT | MAKER | useUpdate/useDelete/useSubmit/useCopy |
| VALIDATED | EDIT, DELETE, SUBMIT, COPY, PRINT | MAKER | (nhận tự động) useSubmit |
| SUBMITTED | APPROVE, REJECT | CHECKER | useApprove/useReject |
| APPROVED (đã kiểm soát, assign=Approver) | APPROVE, REJECT | APPROVER | useApprove/useReject |
| APPROVED (đã phê duyệt, assign=Done) | COPY, PRINT | — | useCopy |
| REJECTED | EDIT, DELETE, SUBMIT, COPY | MAKER (về maker) / CHECKER | useUpdate/useSubmit |
| COMPLETED | COPY, PRINT | — | useCopy |
| CANCELLED | COPY (DELETE disable) | — | useCopy |

> Luồng: DRAFT/SAVED →(submit, Maker)→ SUBMITTED →(approve, Checker)→ APPROVED(kiểm soát) →(approve, Approver)→ APPROVED(phê duyệt)→ COMPLETED. Reject ở mỗi cấp → REJECTED. Delete (Maker, chỉ DRAFT/SAVED) → CANCELLED. SoD: mỗi cấp khác user & khác role (BIZ-001).

## 8. Types cần thêm (phác field)

- **Enum**: `DossierStatus` = DRAFT|SAVED|VALIDATED|SUBMITTED|APPROVED|REJECTED|COMPLETED|CANCELLED ; `ActionRole` = MAKER|CHECKER|APPROVER ; `DataSourceCode` = THU_CONG|DVC ; `ProjectType` = MILITARY|CITIZEN ; `AttachmentTypeCode` = CHUNG_TU_GOC|HOP_DONG|HOA_DON|BANG_KE|VAN_BAN_KHAC
- **Request**: `DossierCreateRequest` (sendDate, dataSourceCode, projectCode, projectSpecificCode?, investorCode, projectManagementCode), `DossierDraftRequest` (tất cả optional), `DossierUpdateRequest` (version*, sendDate?, projectCode?, projectSpecificCode?, investorCode?, projectManagementCode?), `DeleteDossierRequest` (deleteReason*, confirmReviewed*), `ApproveRequest` (reason?, digitalSign?), `RejectRequest` (reason*), `AddDocumentRequest`, `UpdateDocumentRequest` (allOf + version*)
- **Response/Data**: `DossierSummary`, `DossierDetail`, `DocumentSummary`, `DocumentDetail`, `AttachmentInfo`, `ApprovalLogEntry`, `AuditLogEntry`, `Pagination`, `StatusCount`, `DigitalSignInfo`
- **Envelope**: `SuccessResponse`, `ErrorResponse`, `ValidationErrorResponse` (fieldErrors[]), `DossierListResult` (items/pagination/totalBaseAmount/statusCounts), `WorkflowActionResponse.data`, `DossierCreate/UpdateResponse.data`
- **LOV**: `ProjectLovItem`, `ProjectSpecificLovItem`, `DataSourceItem`, `DocumentTypeItem`, `AttachmentTypeItem`, treasury/investor/project-management item shapes

## 9. Mã lỗi / thông báo → i18n

> Interceptor `api.ts` map key `error.{errorCode.toLowerCase()}` → cần thêm vào `error` group (hiện chỉ có `internal_server_error`).

| Mã | Loại | key i18n đề xuất | Có sẵn? |
| --- | --- | --- | --- |
| VDBAS-EXP-SUC01 | success (lưu) | `common.create_success` / `error.vdbas-exp-suc01` | một phần (common.create_success) |
| VDBAS-EXP-SUC02 | success (gửi PD) | `error.vdbas-exp-suc02` | ❌ |
| VDBAS-EXP-SUC03 | success (xoá) | `error.vdbas-exp-suc03` / `common.delete_success` | một phần |
| VDBAS-EXP-0002 | conflict (trùng DOSSIER_CODE) | `error.vdbas-exp-0002` | ❌ |
| VDBAS-EXP-0003 | trạng thái không cho Sửa/Xoá | `error.vdbas-exp-0003` | ❌ |
| VDBAS-EXP-0005 | optimistic lock conflict | `error.vdbas-exp-0005` | ❌ |
| VDBAS-EXP-0016 | không dành được dự toán | `error.vdbas-exp-0016` | ❌ |
| VDBAS-VAL-0002 | validate input | `error.vdbas-val-0002` | ❌ |
| VDBAS-VAL-0014 | file > 10MB | `error.vdbas-val-0014` | ❌ |
| VDBAS-VAL-0015 | định dạng file không hỗ trợ | `error.vdbas-val-0015` | ❌ |
| VDBAS-AUT-0001 | không có quyền (403) | `error.vdbas-aut-0001` | ❌ (403 đã có fallback api_error.403) |
| VDBAS-AUT-0002 | hết phiên (401) | `error.vdbas-aut-0002` | ❌ |

## 10. Convention bắt buộc khi apply

- **List = GET + query params** (KHÔNG POST /search). `page` **1-based**, `pageSize` ∈ [20,50,100,200], `sortBy`(enum)+`sortDir`(ASC/DESC). Multi-select (`fStatus`, `dataSourceCode`) gửi `style:form, explode:true` → axios `paramsSerializer` lặp key (`?fStatus=DRAFT&fStatus=SAVED`).
- **Adapter ở service unwrap envelope** (BẮT BUỘC — shape khác `PagedResponse<T>`): `listDossiers` trả `res.data` ({items, pagination,…}); `getDossier`/create/update trả `res.data`. Page đọc `items`/`pagination.totalRecords` chứ không `content`/`totalElements`.
- **Gửi `version`** khi update/submit/update-document (optimistic lock). **Header `X-Idempotency-Key`** (uuid client sinh) trên mọi POST create/draft/submit/approve/reject/copy/add-doc/upload — truyền qua `config.headers` của wrapper.
- `queryKey` bắt đầu bằng `'dossiers'` / `'lov'`; invalidate sau mutation; `skipNotification` + `callerOnSuccess`.
- Lỗi: interceptor đã xử lý (đọc `errorCode`/`message`, toast nếu có key `error.<code>`). Page chỉ `if (_handled) return` rồi fallback toast.
- Mọi interface trong `src/types/index.ts`; hằng field camelCase trong `src/models/Dossier.ts`.
- **Convert ngày** dd/mm/yyyy (UI hiện tại) ↔ yyyy-MM-dd (contract); **convert dataSourceCode** nhãn TV ↔ THU_CONG/DVC.

## 11. Cảnh báo / cần làm rõ

1. **Envelope ≠ PagedResponse<T>** → BẮT BUỘC adapter unwrap `.data` + đọc `items`/`pagination.totalRecords`/`totalBaseAmount`/`statusCounts`. Không adapter → grid vỡ.
2. **page 1-based** (contract) vs **0-based** (CLAUDE.md) → off-by-one. Page hiện phân trang client-side `PAGE_SIZE=10`; khi chuyển server phải dùng pageSize hợp lệ ∈ [20,50,100,200] và page bắt đầu từ 1.
3. **Base path lệch**: contract `/api/v1`, wrapper mặc định `/api` → chỉnh `VITE_API_BASE_URL` hoặc prefix path.
4. **GAP UI — investorCode**: `DossierCreateRequest.investorCode` **required** nhưng form `CapexDossierDetailPage` chưa có field Chủ đầu tư → cần thêm field (auto-fill từ `lovProjects.investorCode`) trước khi wire create.
5. **GAP action "Hủy bỏ" (CANCEL)**: detail page có nút ⊘ Hủy bỏ riêng nhưng contract không có endpoint cancel — chỉ `DELETE` (soft-delete → CANCELLED, yêu cầu deleteReason+confirmReviewed). Cần chốt: gộp Hủy bỏ vào luồng delete hay yêu cầu BE thêm endpoint.
6. **GAP "In phiếu" (PRINT)**: không có endpoint export-single trong contract → xử lý client-side hoặc yêu cầu BE.
7. **Field mock thừa**: `PROJECT_ITEM_*`, `CONTRACT_*`, `ACCOUNTING_STATUS` (+ lookup ITEM/CONTRACT/GUARANTEE) có trong page/mock nhưng KHÔNG có trong contract → bỏ khi wire hoặc xác nhận thuộc chức năng chứng từ (DNTT) khác.
8. **Lệch tên/format field**: `TOTAL_LOCAL_AMOUNT`→`totalBaseAmount`, UPPER_SNAKE→camelCase, ngày dd/mm/yyyy→yyyy-MM-dd, dataSourceCode nhãn TV→THU_CONG/DVC, projectType Military→MILITARY → cần lớp map/convert nhất quán.
9. **Export async (202)**: ≥50k bản ghi trả `jobId` + `statusUrl`; contract **chưa có** endpoint `/exp/capex/export-jobs/{jobId}` để polling → cần BE bổ sung nếu làm async.
10. **Sub-resource cần hook+queryKey riêng theo `{dossierId}`/`{documentId}`/`{attachmentId}`**: documents, attachments, approval-log, audit-log.
11. **Mã lỗi/thông báo VDBAS chưa có i18n** (§9) → bổ sung nhóm `error.*` để interceptor tự toast.
12. **digitalSign (ký số)** trong `ApproveRequest` — UI hiện chưa có luồng ký số; để optional, chốt sau.
