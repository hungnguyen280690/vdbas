# Impact FE — CapexDossier (từ API-mock.yml)

> Nguồn contract: `apiMock/API-mock.yml` (V0.2 — EXP.CAPEX_DOSSIER)
> Source convention: `src/` (services/hooks/models/types/pages) + `CLAUDE.md`
> **Chưa sinh code** — báo cáo để review trước khi apply.

## 1. Tóm tắt

- Chức năng: `EXP.CAPEX_DOSSIER` | module=`exp` entity=`capex-dossier` | `Entity`=`CapexDossier` | domain queryKey=`capex-dossier`
- Base path: `/api/v1` (mock Prism `:9090`, dev BE `:8085`) — ACL served tại `/api`
- Tổng endpoint: **31** (15 Dossier + workflow, 3 Document, 4 Attachment, 2 History, 7 MasterData)
- Schema: **16** | Mã lỗi VDBAS: **13** (5 VAL, 5 EXP, 1 AUT, 2 SYS) + 4 mã success/info
- **Trạng thái code hiện tại:** Pages `CapexDossierListPage.tsx` + `CapexDossierDetailPage.tsx` **đã tồn tại** nhưng dùng `MOCK_DATA` từ `*.mock.ts`. **Chưa có** service / hook / model / type cho dossier → apply = sinh layer data + thay mock bằng hook.

## 2. Bảng endpoint → kế hoạch code

### 2.1 Dossier CRUD + workflow
| Method | Path | operationId | Hàm service dự kiến | Hook dự kiến | queryKey / invalidate |
| --- | --- | --- | --- | --- | --- |
| POST | /exp/capex-dossier/search | searchDossiers | `listDossiers(params)` | `useList` | `['capex-dossier','list',params]` |
| POST | /exp/capex-dossier | createDossier | `createDossier(data)` | `useCreate` | invalidate `['capex-dossier']` |
| GET | /exp/capex-dossier/{id} | getDossier | `getDossier(id)` | `useDetail` | `['capex-dossier','detail',id]` |
| PUT | /exp/capex-dossier/{id} | updateDossier | `updateDossier(id,data)` | `useUpdate` | invalidate + detail |
| DELETE | /exp/capex-dossier/{id} | deleteDossier | `deleteDossier(id,body)` | `useDelete` | invalidate `['capex-dossier']` |
| POST | /exp/capex-dossier/{id}/save-draft | saveDraft | `saveDraftDossier(id,data)` | `useSaveDraft` | invalidate detail |
| POST | /exp/capex-dossier/{id}/save | saveDossier | `saveDossier(id,data)` | `useSave` | invalidate + detail |
| POST | /exp/capex-dossier/{id}/submit | submitDossier | `submitDossier(id)` | `useSubmit` | invalidate + detail |
| POST | /exp/capex-dossier/{id}/cancel | cancelDossier | `cancelDossier(id,body)` | `useCancel` | invalidate + detail |
| POST | /exp/capex-dossier/{id}/copy | copyDossier | `copyDossier(id)` | `useCopy` | invalidate `['capex-dossier']` |
| POST | /exp/capex-dossier/{id}/check | checkDossier | `checkDossier(id,body?)` | `useCheck` | invalidate + detail |
| POST | /exp/capex-dossier/{id}/approve | approveDossier | `approveDossier(id,body?)` | `useApprove` | invalidate + detail |
| POST | /exp/capex-dossier/{id}/reject | rejectDossier | `rejectDossier(id,body)` | `useReject` | invalidate + detail |
| POST | /exp/capex-dossier/export | exportDossiers | `exportDossiers(params)` | `useExport` (mutation, blob) | — |
| GET | /exp/capex-dossier/{id}/print | printDossier | `printDossier(id)` | `usePrint` (blob/pdf) | — |

### 2.2 Documents (sub-resource)
| Method | Path | operationId | Hàm service | Hook | queryKey / invalidate |
| --- | --- | --- | --- | --- | --- |
| GET | /exp/capex-dossier/{id}/documents | listDocuments | `listDocuments(id)` | `useDocuments` | `['capex-dossier','documents',id]` |
| POST | /exp/capex-dossier/{id}/documents | addDocument | `addDocument(id,data)` | `useAddDocument` | invalidate documents + detail |
| DELETE | /exp/capex-dossier/{id}/documents/{docId} | removeDocument | `removeDocument(id,docId)` | `useRemoveDocument` | invalidate documents + detail |

### 2.3 Attachments (sub-resource — có multipart + blob)
| Method | Path | operationId | Hàm service | Hook | queryKey / invalidate |
| --- | --- | --- | --- | --- | --- |
| GET | /exp/capex-dossier/{id}/attachments | listAttachments | `listAttachments(id)` | `useAttachments` | `['capex-dossier','attachments',id]` |
| POST | /exp/capex-dossier/{id}/attachments | uploadAttachment | `uploadAttachment(id,formData)` | `useUploadAttachment` | invalidate attachments |
| DELETE | /exp/capex-dossier/{id}/attachments/{attachId} | deleteAttachment | `deleteAttachment(id,attachId)` | `useDeleteAttachment` | invalidate attachments |
| GET | /exp/capex-dossier/{id}/attachments/{attachId}/download | downloadAttachment | `downloadAttachment(id,attachId)` | `useDownloadAttachment` (blob) | — |

### 2.4 History
| Method | Path | operationId | Hàm service | Hook | queryKey |
| --- | --- | --- | --- | --- | --- |
| GET | /exp/capex-dossier/{id}/history | getDossierHistory | `getDossierHistory(id)` | `useHistory` | `['capex-dossier','history',id]` |
| GET | /exp/capex-dossier/{id}/approval-history | getApprovalHistory | `getApprovalHistory(id)` | `useApprovalHistory` | `['capex-dossier','approval-history',id]` |

### 2.5 Master Data (LOV — service riêng `masterDataService.ts`)
| Method | Path | operationId | Hàm service | Hook | queryKey |
| --- | --- | --- | --- | --- | --- |
| POST | /master-data/projects/search | searchProjects | `searchProjects(params)` | `useProjectSearch` | `['master-data','projects',params]` |
| GET | /master-data/projects/{projectCode} | getProject | `getProject(code)` | `useProject` | `['master-data','project',code]` |
| GET | /master-data/project-managements | listProjectManagements | `listProjectManagements(q)` | `useProjectManagements` | `['master-data','project-managements']` |
| GET | /master-data/data-sources | listDataSources | `listDataSources()` | `useDataSources` | `['master-data','data-sources']` |
| GET | /master-data/document-types | listDocumentTypes | `listDocumentTypes()` | `useDocumentTypes` | `['master-data','document-types']` |
| GET | /master-data/attachment-types | listAttachmentTypes | `listAttachmentTypes()` | `useAttachmentTypes` | `['master-data','attachment-types']` |
| GET | /master-data/treasuries | listTreasuries | `listTreasuries()` | `useTreasuries` | `['master-data','treasuries']` |

## 3. File ảnh hưởng

| File | Hành động | Lý do |
| --- | --- | --- |
| `src/types/index.ts` | **EDIT** | thêm 16 type Dossier/Document/Attachment/History/MasterData; tái dùng `PagedResponse<T>`, `MutationHookOptions`, `PaginationState` đã có (dòng 83/90/125) |
| `src/models/CapexDossier.ts` | **CREATE** | hằng tên field UPPER_SNAKE từ schema (DOSSIER_CODE, F_STATUS, SEND_DATE…) + enum F_STATUS / DATE_FIELD |
| `src/services/capexDossierService.ts` | **CREATE** | 1 hàm/endpoint cho nhóm Dossier + Document + Attachment + History (24 hàm) |
| `src/services/masterDataService.ts` | **CREATE** | 7 hàm LOV (projects, project-managements, data-sources, document-types, attachment-types, treasuries) |
| `src/hooks/useCapexDossier.ts` | **CREATE** | object `CapexDossierHooks` (list/detail/create/update/delete + workflow + sub-resource) |
| `src/hooks/useMasterData.ts` | **CREATE** | object `MasterDataHooks` cho LOV (staleTime cao vì danh mục ít đổi) |
| `src/services/aclService.ts` | **SKIP** | `/me/menus`, `/me/apis` đã có sẵn — không đổi |
| `src/locales/vi.json`, `en.json` | **EDIT** | thêm nhánh `error.*` cho 13 mã VDBAS + message success workflow (hiện chỉ có `api_error.{status}` generic) |
| `src/pages/CapexDossierListPage.tsx` | **EDIT** | thay `MOCK_DATA` → `CapexDossierHooks.useList` + filter 2 lớp + pagination 0-based |
| `src/pages/CapexDossierDetailPage.tsx` | **EDIT** | thay mock → `useDetail` + các mutation workflow (submit/check/approve/reject/save) |
| `src/pages/CapexDossierListPage.mock.ts`, `CapexDossierDetailPage.mock.ts` | **SKIP→DELETE (sau khi wire)** | giữ tạm để đối chiếu, xoá khi page đã chạy hook thật |

## 4. Types cần thêm (phác field từ schema)

> ⚠️ Field naming là **UPPER_SNAKE_CASE** (spec §B4 rule 7) — KHÁC convention camelCase mặc định. Xem cảnh báo §7.

- **DossierSearchRequest**: `{ DOSSIER_CODE?, PROJECT_CODE?, SEARCH?, DATE_FIELD?: 'SEND_DATE'|'CREATED_DATE'|'CHECKED_DATE'|'APPROVED_DATE', FROM_DATE?, TO_DATE?, F_STATUS?: FStatus[], DATA_SOURCE_CODE?: string[], CREATED_BY?, PAGE?, SIZE?, SORT_BY?, SORT_DIR?: 'ASC'|'DESC' }`
- **DossierPageResponse**: `{ CONTENT: DossierSummary[], TOTAL_ELEMENTS, TOTAL_PAGES, PAGE, SIZE, STATUS_COUNTS: Record<FStatus,number>, TOTAL_BASE_AMOUNT }`
- **DossierSummary** (grid row): `ID, DOSSIER_CODE, PROJECT_CODE, PROJECT_NAME, DATA_SOURCE_CODE, SEND_DATE, F_STATUS, CREATED_BY, CREATED_DATE, DOCUMENT_COUNT, TOTAL_LOCAL_AMOUNT` + cột optional `CHECKED_BY/DATE, APPROVED_BY/DATE, CHECK_REJECTION_REASON, APPROVAL_REJECTION_REASON, RETURNING_REASON`
- **DossierCreateRequest** (required `PROJECT_CODE, PROJECT_MANAGEMENT_CODE, SEND_DATE`): `+ PROJECT_SPECIFIC_CODE?, DATA_SOURCE_CODE?`
- **DossierUpdateRequest** (required `VERSION`): `SEND_DATE?, PROJECT_CODE?, PROJECT_SPECIFIC_CODE?, PROJECT_MANAGEMENT_CODE?, VERSION`
- **DossierDeleteRequest** (required `DELETE_REASON≥10, CONFIRM_REVIEWED=true`)
- **DossierDetail**: full header + `DOCUMENTS: DocumentSummary[]` + `ATTACHMENTS: AttachmentInfo[]` + audit fields + `VERSION` (optimistic lock)
- **DossierStatusResponse** (sau workflow): `ID, DOSSIER_CODE, F_STATUS, APPROVAL_STEP?: 'CHECKED'|'APPROVED', VERSION, MESSAGE_CODE, MESSAGE, CHECKED_*, APPROVED_*`
- **DocumentSummary**: `SEQ_NO, DOCUMENT_ID, DOCUMENT_NAME, DOCUMENT_NO, DOCUMENT_DATE, ACCOUNTING_DATE, ORIGINAL_AMOUNT?, BASE_AMOUNT, F_STATUS`
- **AttachmentInfo**: `ATTACHMENT_ID, FILE_NAME, ATTACHMENT_TYPE_CODE, FILE_TYPE, FILE_SIZE, DESCRIPTION?, CREATED_BY, CREATED_DATE`
- **AuditLogEntry**: `SEQ_NO, ACTION_TYPE, USER_ID, ACTION_TIMESTAMP, IP_ADDRESS, OLD_VALUE?, NEW_VALUE`
- **ApprovalLogEntry**: `LOG_ID, ACTION_USER, ACTION_ROLE: 'Maker'|'Checker'|'Approver'|'System', ACTION_DATE, STATE_CODE, REASON?`
- **WorkflowRejectRequest** (required `REASON≥10`)
- **ProjectInfo / ProjectManagementInfo**: master-data records (cascading fill)
- **ApiError**: `ERROR_CODE, MESSAGE, TRACE_ID, FIELD_ERRORS?: {FIELD,MESSAGE,CODE}[]`
- **FStatus** (type alias): `'DRAFT'|'SAVED'|'VALIDATED'|'SUBMITTED'|'APPROVED'|'REJECTED'|'COMPLETED'|'CANCELLED'`

## 5. Mã lỗi → i18n

| VDBAS code | Ngữ cảnh | key i18n đề xuất | có sẵn? |
| --- | --- | --- | --- |
| VDBAS-VAL-0002 | Thiếu trường bắt buộc (PROJECT_CODE) | `error.VDBAS-VAL-0002` | ❌ |
| VDBAS-VAL-0003 | Sai định dạng (SEND_DATE) | `error.VDBAS-VAL-0003` | ❌ |
| VDBAS-VAL-0011 | Lý do xoá < 10 ký tự | `error.VDBAS-VAL-0011` | ❌ |
| VDBAS-VAL-0014 | File > 10MB | `error.VDBAS-VAL-0014` | ❌ |
| VDBAS-VAL-0015 | Định dạng file không hỗ trợ | `error.VDBAS-VAL-0015` | ❌ |
| VDBAS-EXP-0003 | Trạng thái không cho Sửa/Xoá | `error.VDBAS-EXP-0003` | ❌ |
| VDBAS-EXP-0004 | Không phải Maker gốc | `error.VDBAS-EXP-0004` | ❌ |
| VDBAS-EXP-0005 | Optimistic lock conflict | `error.VDBAS-EXP-0005` | ❌ |
| VDBAS-EXP-0011 | Cảnh báo trùng hồ sơ (warning) | `error.VDBAS-EXP-0011` | ❌ |
| VDBAS-EXP-0016 | Submit khi chưa có chứng từ | `error.VDBAS-EXP-0016` | ❌ |
| VDBAS-AUT-0001 | Không có quyền | `error.VDBAS-AUT-0001` | ❌ |
| VDBAS-SYS-0404 | Không tìm thấy hồ sơ | `error.VDBAS-SYS-0404` | ❌ |
| VDBAS-SYS-0001 | Lỗi hệ thống | `error.VDBAS-SYS-0001` | ❌ |
| (success) VDBAS-EXP-SUC02/04/05, INF04 | Submit/Check/Approve/Reject OK | `success.*` | ❌ |

→ Tất cả mã VDBAS đều **chưa có** key. Hiện locale chỉ có `api_error.{httpStatus}` generic. Cần thêm nhánh `error.<code>` để map theo `ERROR_CODE` từ response.

## 6. Convention bắt buộc khi apply

- Search = `POST /search` + body | page **0-based** (`PAGE`) | response shape `CONTENT[] + TOTAL_ELEMENTS` (UPPER_SNAKE — không phải `content/totalElements`)
- queryKey bắt đầu bằng domain `['capex-dossier', ...]`; invalidate sau mọi mutation; `skipNotification` + `callerOnSuccess` cho caller tự xử lý toast
- Lỗi do interceptor `api.ts` xử lý → trong page chỉ `if (_handled) return` rồi fallback `message.error`
- Mọi interface đặt trong `src/types/index.ts` (không rải rác)
- Hằng tên field qua class `CapexDossier` (static readonly) — dùng trong column `dataIndex`/`key`
- Permission guard `hasApiPermission('/api/v1/exp/capex-dossier', 'POST'|'PUT'|'DELETE')` — path khớp `@RequestMapping` BE
- Service multipart (upload): override header `Content-Type: multipart/form-data`; blob (export/print/download): `responseType: 'blob'`

## 7. Cảnh báo / cần làm rõ

1. **Field naming UPPER_SNAKE_CASE** — contract trả `CONTENT/TOTAL_ELEMENTS`, `DossierSummary` field UPPER_SNAKE. Generic `PagedResponse<T>` trong `types/index.ts` đang dùng `content?/totalElements?` (lowercase). → **Quyết định:** (a) tạo `DossierPageResponse` riêng UPPER_SNAKE (đề xuất, sát contract), hay (b) thêm adapter map UPPER→camel ở service. KHÔNG ép vào `PagedResponse<T>` cũ.
2. **Pages đã tồn tại + dùng mock** — apply là *refactor* (thay `MOCK_DATA` bằng hook), không phải tạo page mới. Cần đọc kỹ `CapexDossierListPage.tsx`/`DetailPage.tsx` để giữ nguyên UI/logic cột, chỉ đổi nguồn data.
3. **Response code field = `ERROR_CODE`** (UPPER_SNAKE) — interceptor `api.ts` hiện map theo HTTP status (`api_error.{status}`). Cần kiểm tra interceptor có đọc `ERROR_CODE` trong body để map `error.<code>` không; nếu chưa → bổ sung.
4. **DELETE có request body** (`DossierDeleteRequest`) — `del()` wrapper phải truyền body qua `config.data`. Tương tự `cancel` (body), `reject` (body required).
5. **Endpoint không CRUD chuẩn** cần hook đặc thù: `export`/`print`/`download` (blob, không cache), `copy` (tạo record mới → navigate), `save-draft`/`save`/`submit`/`cancel`/`check`/`approve`/`reject` (workflow → trả `DossierStatusResponse`, invalidate detail + list).
6. **Sub-resource** documents/attachments/history có queryKey con — invalidate đúng nhánh (`['capex-dossier','documents',id]`) sau add/remove/upload.
7. **MasterData** dùng base `/master-data/*` (không thuộc `/exp`) — tách `masterDataService.ts` + `useMasterData.ts` riêng; LOV nên `staleTime` lớn (5–10 phút).
8. **DuplicateWarning 409** (VDBAS-EXP-0011) là *warning không chặn* — khi create/save trả 409 này, UI phải hỏi xác nhận "tiếp tục?" thay vì báo lỗi cứng.

---

## Bước tiếp theo

1. Review `impact-fe.md` này (đặc biệt §7.1 quyết định UPPER_SNAKE vs adapter).
2. Chốt: tách `DossierPageResponse` riêng hay adapter map.
3. Chạy bước apply để sinh `types` + `models/CapexDossier.ts` + `capexDossierService.ts` + `masterDataService.ts` + `useCapexDossier.ts` + `useMasterData.ts` + i18n keys, rồi wire 2 page bỏ mock.
