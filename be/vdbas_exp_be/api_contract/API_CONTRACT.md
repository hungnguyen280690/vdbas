# CAPEX Dossier Management - API Contract

This document provides a detailed API contract for the **Dossier Management for CAPEX** module. It serves as the single source of truth for both Frontend (for mocking) and Backend (for implementation).

## 1. Overview
- **Base URL:** `/api/v1`
- **Specification:** [OpenAPI 3.0 (YAML)](./capex-dossier-api.yaml)
- **Primary Entity:** `CapexDossier`
- **Workflow:** Maker (Create/Submit) → Checker (Verify) → Approver (Finalize)

---

## 2. API Endpoints Summary

### Dossier

| Method | Endpoint | Description | Role | Success Code |
|---|---|---|---|---|
| `GET` | `/capex-dossier` | Search/List dossiers with filters | All | 200 |
| `POST` | `/capex-dossier` | Create a new dossier (DRAFT) | Maker | 201 |
| `GET` | `/capex-dossier/{id}` | Get full dossier detail (Header + Docs + Attach + History) | All | 200 |
| `PUT` | `/capex-dossier/{id}` | Update dossier header (DRAFT only) | Maker | 200 |
| `DELETE` | `/capex-dossier/{id}` | Soft delete dossier (DRAFT only) | Maker | 204 |
| `POST` | `/capex-dossier/{id}/submit` | Submit dossier to Checker | Maker | 200 |
| `POST` | `/capex-dossier/{id}/workflow` | Workflow actions: CHECK, APPROVE, REJECT, RETURN | Checker/Approver | 200 |
| `GET` | `/capex-dossier/{id}/documents` | List all documents in dossier | All | 200 |
| `POST` | `/capex-dossier/{id}/attachments` | Upload file đính kèm | Maker | 201 |
| `DELETE` | `/capex-dossier/{id}/attachments/{archiveId}` | Xóa file đính kèm (DRAFT only) | Maker | 204 |
| `GET` | `/capex-dossier/{id}/attachments/{archiveId}/download` | Download file đính kèm | All | 200 |

### Master Data (LOV)

| Method | Endpoint | Description | Role | Success Code |
|---|---|---|---|---|
| `GET` | `/master-data/projects` | LOV.01 — Dự án/Công trình | Maker | 200 |
| `GET` | `/master-data/treasury` | LOV.02 — Kho bạc nhà nước | All | 200 |
| `GET` | `/master-data/payment-types` | LOV.03 — Loại thanh toán (Tạm ứng/Thanh toán) | All | 200 |
| `GET` | `/master-data/capital-plan-types` | LOV.04 — Loại kế hoạch vốn | All | 200 |
| `GET` | `/master-data/currency-types` | LOV.05 — Loại tiền | All | 200 |
| `GET` | `/master-data/exchange-rate-types` | LOV.06 — Loại tỷ giá | All | 200 |
| `GET` | `/master-data/document-types` | LOV.07 — Loại chứng từ | All | 200 |
| `GET` | `/master-data/investment-sources` | LOV.08 — Nguồn đầu tư | All | 200 |
| `GET` | `/master-data/allocation-criteria` | LOV.09 — Tiêu thức phân bổ | All | 200 |
| `GET` | `/master-data/project-items` | LOV.10 — Hạng mục dự án | All | 200 |
| `GET` | `/master-data/gl-segments/{segmentNo}` | LOV.11 — GL Segment theo số (2/4/5/8/9/10/12/13) | All | 200 |
| `GET` | `/master-data/guarantees` | LOV.12 — Bảo lãnh | Maker | 200 |
| `GET` | `/master-data/states` | LOV.13 — Trạng thái hồ sơ | All | 200 |

---

## 3. Endpoint Details

### 3.1. `GET /capex-dossier` — Search/List Dossiers

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `dossierCode` | string | N | — | Filter by dossier code |
| `projectCode` | string | N | — | Filter by project code |
| `stateCode` | string | N | — | Filter by status (DRAFT, PENDING_CHECK, etc.) |
| `fromDate` | string (date) | N | — | Filter send date from |
| `toDate` | string (date) | N | — | Filter send date to |
| `page` | integer | N | 0 | Page number (0-based) |
| `size` | integer | N | 20 | Page size |

#### Response `200 OK`

```json
{
  "content": [ /* array of DossierSummary */ ],
  "totalElements": 100,
  "totalPages": 5
}
```

See [DossierSummary](#42-dossiersummary) schema.

---

### 3.2. `POST /capex-dossier` — Create Dossier

#### Request Body (`DossierCreateRequest`)

See [DossierCreateRequest](#43-dossiercreaterequestdossierupdaterequest) schema.

```json
{
  "sendDate": "2026-06-05",
  "projectCode": "7004686",
  "projectSpecificCode": null,
  "projectManagementCode": "1059227",
  "treasuryCode": "0600",
  "dataSourceCode": "MANUAL"
}
```

#### Response `201 Created`

Returns full [DossierHeader](#41-dossierheader).

```json
{
  "dossierId": "550e8400-e29b-41d4-a716-446655440000",
  "dossierCode": "EXP/CAPEX/2026/00001",
  "sendDate": "2026-06-05",
  "stateCode": "DRAFT",
  "projectCode": "7004686",
  "projectName": "Dự án đầu tư A",
  "projectSpecificCode": null,
  "projectSpecificName": null,
  "projectManagementCode": "1059227",
  "projectManagementName": "Ban QLDA 1",
  "investorName": "Chủ đầu tư ABC",
  "treasuryCode": "0600",
  "dataSourceCode": "MANUAL",
  "createdBy": "maker_user",
  "createdDate": "2026-06-05T09:00:00Z",
  "updatedBy": null,
  "updatedDate": null,
  "version": 1
}
```

#### Error Responses

| Status | When |
|---|---|
| 400 | Validation failed (missing required fields) |

---

### 3.3. `GET /capex-dossier/{id}` — Get Dossier Detail

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Response

| Status | Schema | When |
|---|---|---|
| 200 | [DossierDetail](#45-dossierdetail) | Found |
| 404 | [ApiError](#49-apierror) | Not found |

---

### 3.4. `PUT /capex-dossier/{id}` — Update Dossier

Only allowed when `stateCode == 'DRAFT'` (VAL-13).

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Request Body (`DossierUpdateRequest`)

See [DossierUpdateRequest](#43-dossiercreaterequestdossierupdaterequest) schema.

```json
{
  "sendDate": "2026-06-10",
  "projectCode": "7004686",
  "projectSpecificCode": null,
  "projectManagementCode": "1059227",
  "treasuryCode": "0600",
  "version": 1
}
```

#### Response

| Status | Schema | When |
|---|---|---|
| 200 | [DossierHeader](#41-dossierheader) | Updated |
| 400 | [ApiError](#49-apierror) | Validation failed |
| 409 | [ApiError](#49-apierror) | Optimistic lock conflict (version mismatch — MSG-ERR-LOCK) |

---

### 3.5. `DELETE /capex-dossier/{id}` — Soft Delete Dossier

Only allowed when `stateCode == 'DRAFT'` (VAL-13).

Soft delete: BE set `STATE_CODE = 'DELETED'` và `STATUS = 0` trong `EXP_DOSSIER`.

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Request Body

| Field | Type | Required | Constraint |
|---|---|---|---|
| `deleteReason` | string | Y | minLength: 10, maxLength: 500 (VAL-16) |
| `confirmReviewed` | boolean | Y | Must be `true` to confirm deletion |

```json
{
  "deleteReason": "Hồ sơ nhập sai thông tin dự án cần xóa và tạo lại",
  "confirmReviewed": true
}
```

#### Response

| Status | When |
|---|---|
| 204 | Deleted successfully (no body) |
| 400 | Validation failed |

---

### 3.6. `POST /capex-dossier/{id}/submit` — Submit for Check

Transitions dossier from `DRAFT` → `PENDING_CHECK`.

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Request Body

None.

#### Response

| Status | When |
|---|---|
| 200 | Submitted successfully |
| 400 | Invalid state or validation failed (MSG-ERR-STATUS) |

---

### 3.7. `POST /capex-dossier/{id}/workflow` — Workflow Action

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Request Body (`WorkflowActionRequest`)

| Field | Type | Required | Constraint |
|---|---|---|---|
| `action` | string | Y | Enum: `CHECK`, `APPROVE`, `REJECT`, `RETURN` |
| `reason` | string | Conditional | Required for `REJECT` and `RETURN`, minLength: 10 |

```json
{
  "action": "REJECT",
  "reason": "Hồ sơ thiếu tài liệu chứng minh khối lượng hoàn thành"
}
```

#### Workflow State Transitions

| Action | From State | To State | Role |
|---|---|---|---|
| `CHECK` | `PENDING_CHECK` | `PENDING_APPROVE` | Checker |
| `APPROVE` | `PENDING_APPROVE` | `APPROVED` | Approver |
| `REJECT` | `PENDING_CHECK` | `CHECK_REJECTED` | Checker |
| `REJECT` | `PENDING_APPROVE` | `APPROVE_REJECTED` | Approver |
| `RETURN` | `PENDING_CHECK` | `DRAFT` | Checker |
| `RETURN` | `PENDING_APPROVE` | `PENDING_CHECK` | Approver |

#### Response

| Status | When |
|---|---|
| 200 | Action applied |
| 400 | Invalid action or state (MSG-ERR-STATUS) |

---

### 3.8. `GET /capex-dossier/{id}/documents` — List Documents in Dossier

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Response `200 OK`

Returns array of [DocumentDetail](#46-documentdetail).

```json
[ /* array of DocumentDetail */ ]
```

---

### 3.9. `POST /capex-dossier/{id}/attachments` — Upload Attachment

Content-Type: `multipart/form-data`

#### Path Parameter

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |

#### Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | binary | Y | File cần upload |
| `archiveType` | string | Y | Loại lưu trữ (xem LOV.archive_type) |
| `description` | string | N | Mô tả file |
| `archiveDate` | string (date) | N | Ngày lưu trữ |

#### Response `201 Created`

Returns [AttachmentInfo](#47-attachmentinfo).

---

### 3.10. `DELETE /capex-dossier/{id}/attachments/{archiveId}` — Delete Attachment

Only allowed when `stateCode == 'DRAFT'`.

#### Path Parameters

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |
| `archiveId` | UUID | Y |

#### Response

| Status | When |
|---|---|
| 204 | Deleted successfully |
| 404 | Attachment not found |

---

### 3.11. `GET /capex-dossier/{id}/attachments/{archiveId}/download` — Download Attachment

#### Path Parameters

| Parameter | Type | Required |
|---|---|---|
| `id` | UUID | Y |
| `archiveId` | UUID | Y |

#### Response `200 OK`

Binary file stream. Header: `Content-Disposition: attachment; filename="<fileName>"`.

---

### 3.12. `GET /master-data/projects` — LOV.01 Lookup Projects

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `code` | string | N | Filter by project code |
| `name` | string | N | Filter by project name |

#### Response `200 OK`

Returns array of [ProjectInfo](#48-projectinfo).

---

### 3.13. `GET /master-data/treasury` — LOV.02 Kho bạc nhà nước

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `code` | string | N | Filter by treasury code |
| `name` | string | N | Filter by treasury name |

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `COMMON_TREASURY` (chỉ trả `STATUS = 1`).

---

### 3.14. `GET /master-data/payment-types` — LOV.03 Loại thanh toán

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_PAYMENT_TYPE` (chỉ trả `STATUS = 1`).

---

### 3.15. `GET /master-data/capital-plan-types` — LOV.04 Loại kế hoạch vốn

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_CAPITAL_PLAN_TYPE` (chỉ trả `STATUS = 1`).

---

### 3.16. `GET /master-data/currency-types` — LOV.05 Loại tiền

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_CURRENCY_TYPE` (chỉ trả `STATUS = 1`).

---

### 3.17. `GET /master-data/exchange-rate-types` — LOV.06 Loại tỷ giá

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_EXCHANGE_RATE_TYPE` (chỉ trả `STATUS = 1`).

---

### 3.18. `GET /master-data/document-types` — LOV.07 Loại chứng từ

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_DOCUMENT_TYPE` (chỉ trả `STATUS = 1`).

---

### 3.19. `GET /master-data/investment-sources` — LOV.08 Nguồn đầu tư

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `segmentCode` | string | N | Filter theo GL_SEGMENT12 (xem VAL-COMPOSITE-FK) |

#### Response `200 OK`

Returns array of [InvestmentSourceItem](#412-investmentsourceitem). Mapped to `COMMON_INVESTMENT_SOURCE`.

> **VAL-COMPOSITE-FK:** `INVESTMENT_SOURCE_CODE` và `GL_SEGMENT12` có ràng buộc composite FK trong DB. Khi FE chọn `investmentSourceCode`, phải dùng `segmentCode` từ record trả về để set `glSegments.segment12`.

---

### 3.20. `GET /master-data/allocation-criteria` — LOV.09 Tiêu thức phân bổ

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `COMMON_ALLOCATION_CRITERIA`.

---

### 3.21. `GET /master-data/project-items` — LOV.10 Hạng mục dự án

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectCode` | string | N | Filter theo dự án |

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `EXP_PROJECT_ITEM` (chỉ trả `STATUS = 1`).

---

### 3.22. `GET /master-data/gl-segments/{segmentNo}` — LOV.11 GL Segments

#### Path Parameter

| Parameter | Type | Required | Valid Values |
|---|---|---|---|
| `segmentNo` | integer | Y | `2`, `4`, `5`, `8`, `9`, `10`, `12`, `13` |

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `COMMON_GL_SEGMENT{segmentNo}`.

---

### 3.23. `GET /master-data/guarantees` — LOV.12 Bảo lãnh

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `guaranteeNo` | string | N | Filter theo số bảo lãnh |

#### Response `200 OK`

Returns array of [GuaranteeItem](#413-guaranteeitem). Mapped to `EXP_GUARANTEE`.

---

### 3.24. `GET /master-data/states` — LOV.13 Trạng thái hồ sơ

#### Response `200 OK`

Returns array of [CodeNameItem](#411-codenameitem). Mapped to `COMMON_STATE` (filter `SUB_SYSTEM = 'CAPEX'`, `STATUS = 1`).

---

## 4. Data Models

### 4.1. DossierHeader

Mapped to `EXP_DOSSIER` table. Returned by POST (201), PUT (200), GET/{id} (200).

| API Field | SQL Column | Type | Required | Description |
|---|---|---|---|---|
| `dossierId` | `DOSSIER_ID` | UUID | Y | System generated unique ID |
| `dossierCode` | `DOSSIER_CODE` | String | Y | Human-readable code (e.g., EXP/CAPEX/2026/00001) |
| `sendDate` | `SEND_DATE` | String (date) | Y | Ngày gửi hồ sơ |
| `receiveDate` | `RECEIVE_DATE` | String (date) | N | Ngày KBNN nhận hồ sơ (set khi Checker nhận) |
| `stateCode` | `STATE_CODE` | String | Y | Enum: xem bảng State Codes bên dưới |
| `projectCode` | `PROJECT_CODE` | String | Y | FK → `EXP_PROJECT` |
| `projectName` | `PROJECT_NAME` | String | N | Denormalized tên dự án |
| `projectSpecificCode` | `PROJECT_SPECIFIC_CODE` | String (nullable) | N | FK → `EXP_PROJECT_SPECIFIC` |
| `projectSpecificName` | `PROJECT_SPECIFIC_NAME` | String (nullable) | N | Denormalized |
| `projectManagementCode` | _(derived)_ | String | N | Derived qua JOIN `EXP_PROJECT.PROJECT_MANAGEMENT_CODE`. Không lưu trong `EXP_DOSSIER` |
| `projectManagementName` | `PROJECT_MANAGEMENT_NAME` | String | N | Denormalized tên ban QLDA |
| `investorName` | `INVESTOR_NAME` | String | N | Denormalized tên chủ đầu tư |
| `treasuryCode` | `TREASURY_CODE` | String | Y | Mã kho bạc. FK → `COMMON_TREASURY` |
| `dataSourceCode` | `DATA_SOURCE_CODE` | String | Y | Enum: `MANUAL`, `DVC`. FK → `EXP_DATA_SOURCE` |
| `assignUser` | `ASSIGN_USER` | String | N | Người đang xử lý hồ sơ (do BE set khi workflow) |
| `createdBy` | `CREATED_BY` | String | Y | Người tạo |
| `createdDate` | `CREATED_DATE` | String (date-time) | Y | Thời gian tạo |
| `updatedBy` | `UPDATED_BY` | String | N | Người cập nhật gần nhất |
| `updatedDate` | `UPDATED_DATE` | String (date-time) | N | Thời gian cập nhật gần nhất |
| `version` | `DOSSIER_VERSION` | Integer | Y | Optimistic lock version (`F-VER`) |

> **Lưu ý BE:** `WORKFLOW_ID` (NOT NULL trong DB) được BE tự resolve khi tạo hồ sơ dựa trên loại nghiệp vụ CAPEX — FE không cần truyền field này.

**State Codes:**

| Code | Mô tả |
|---|---|
| `DRAFT` | Chưa kiểm soát |
| `PENDING_CHECK` | Chờ kiểm soát |
| `CHECK_REJECTED` | Từ chối kiểm soát |
| `CHECK_CANCELLED` | Đã hủy kiểm soát |
| `PENDING_APPROVE` | Chờ phê duyệt |
| `APPROVE_REJECTED` | Từ chối phê duyệt |
| `APPROVE_CANCELLED` | Đã hủy phê duyệt |
| `APPROVED` | Đã phê duyệt |
| `DELETED` | Đã xóa (soft delete) |

---

### 4.2. DossierSummary

Returned in the `content` array of `GET /capex-dossier`.

| API Field | Type | Source | Description |
|---|---|---|---|
| `dossierId` | UUID | `EXP_DOSSIER.DOSSIER_ID` | System ID |
| `dossierCode` | String | `EXP_DOSSIER.DOSSIER_CODE` | Human-readable code |
| `sendDate` | String (date) | `EXP_DOSSIER.SEND_DATE` | Ngày gửi hồ sơ |
| `stateCode` | String | `EXP_DOSSIER.STATE_CODE` | Trạng thái hồ sơ |
| `projectName` | String | `EXP_DOSSIER.PROJECT_NAME` | Tên dự án (denormalized) |
| `treasuryCode` | String | `EXP_DOSSIER.TREASURY_CODE` | Mã kho bạc |
| `createdBy` | String | `EXP_DOSSIER.CREATED_BY` | Người tạo |
| `createdDate` | String (date-time) | `EXP_DOSSIER.CREATED_DATE` | Thời gian tạo |
| `totalAmountVnd` | Number | Computed | `SUM(EXP_DOCUMENT_LINE.PAYMENT_REQUEST_AMOUNT_VND)` GROUP BY `DOSSIER_ID` qua join |
| `documentCount` | Integer | Computed | `COUNT(EXP_DOCUMENT.DOCUMENT_ID)` WHERE `DOSSIER_ID` |

---

### 4.3. DossierCreateRequest/DossierUpdateRequest

#### DossierCreateRequest (POST body)

| Field | Type | Required | Description |
|---|---|---|---|
| `sendDate` | String (date) | Y | Ngày gửi hồ sơ |
| `projectCode` | String | Y | Mã dự án/công trình. FK → `EXP_PROJECT` |
| `projectSpecificCode` | String | N | Mã dự án con (nếu có). FK → `EXP_PROJECT_SPECIFIC` |
| `projectManagementCode` | String | Y | Mã ban QLDA. BE dùng để validate và lookup `PROJECT_MANAGEMENT_NAME` để denormalize vào `EXP_DOSSIER`. Không lưu trực tiếp thành column riêng |
| `treasuryCode` | String | Y | Mã kho bạc. FK → `COMMON_TREASURY` |
| `dataSourceCode` | String | N | Default: `MANUAL`. Enum: `MANUAL`, `DVC` |

#### DossierUpdateRequest (PUT body)

| Field | Type | Required | Description |
|---|---|---|---|
| `sendDate` | String (date) | N | Ngày gửi hồ sơ mới |
| `projectCode` | String | N | Mã dự án/công trình mới |
| `projectSpecificCode` | String | N | Mã dự án con mới |
| `projectManagementCode` | String | N | Mã ban QLDA mới |
| `treasuryCode` | String | N | Mã kho bạc mới |
| `version` | Integer | **Y** | Optimistic locking — phải khớp với version hiện tại trong DB (VAL-15) |

---

### 4.4. WorkflowActionRequest

| Field | Type | Required | Constraint |
|---|---|---|---|
| `action` | String | Y | Enum: `CHECK`, `APPROVE`, `REJECT`, `RETURN` |
| `reason` | String | Conditional | Required for `REJECT` and `RETURN`, minLength: 10 |

---

### 4.5. DossierDetail

Extends [DossierHeader](#41-dossierheader) with the following additional fields:

| API Field | Type | Description |
|---|---|---|
| _(all DossierHeader fields)_ | — | See [DossierHeader](#41-dossierheader) |
| `documents` | Array\<[DocumentDetail](#46-documentdetail)\> | Danh sách chứng từ |
| `attachments` | Array\<[AttachmentInfo](#47-attachmentinfo)\> | Danh sách file đính kèm |
| `approvalHistory` | Array\<[ApprovalLogEntry](#410-approvallogentry)\> | Lịch sử phê duyệt |

---

### 4.6. DocumentDetail

Mapped to `EXP_DOCUMENT` table.

> **Lưu ý:** Amount fields (`paymentRequestAmount`, v.v.) nằm ở `EXP_DOCUMENT_LINE`, không phải `EXP_DOCUMENT`.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `documentId` | `DOCUMENT_ID` | UUID | N | |
| `documentNumber` | `DOCUMENT_NUMBER` | String | N | Số chứng từ |
| `documentDate` | `DOCUMENT_DATE` | String (date) | N | Ngày chứng từ |
| `accountingDate` | `ACCOUNTING_DATE` | String (date) | N | Ngày hạch toán |
| `documentTemplateId` | `DOCUMENT_TEMPLATE_ID` | Integer (int64) | N | FK → `EXP_DOCUMENT_TEMPLATE` |
| `documentTypeCode` | `DOCUMENT_TYPE_CODE` | String | N | FK → `EXP_DOCUMENT_TYPE` |
| `fiscalYear` | `FISCAL_YEAR` | Integer | N | Niên độ |
| `paymentRequestNo` | `PAYMENT_REQUEST_NO` | String | Y | Số giấy đề nghị thanh toán |
| `paymentRequestDate` | `PAYMENT_REQUEST_DATE` | String (date) | Y | Ngày đề nghị thanh toán |
| `treasuryCode` | `TREASURY_CODE` | String | N | Mã kho bạc. FK → `COMMON_TREASURY` |
| `payingTreasuryCode` | `PAYING_TREASURY_CODE` | String | Y | Mã kho bạc thanh toán |
| `paymentTypeCode` | `PAYMENT_TYPE_CODE` | String | N | Tạm ứng/Thanh toán. FK → `EXP_PAYMENT_TYPE` |
| `capitalPlanTypeCode` | `CAPITAL_PLAN_TYPE_CODE` | String | N | FK → `EXP_CAPITAL_PLAN_TYPE` |
| `currencyTypeCode` | `CURRENCY_TYPE_CODE` | String | N | FK → `EXP_CURRENCY_TYPE` |
| `exchangeRateTypeCode` | `EXCHANGE_RATE_TYPE_CODE` | String | N | FK → `EXP_EXCHANGE_RATE_TYPE` |
| `exchangeRateDate` | `EXCHANGE_RATE_DATE` | String (date) | Y | |
| `exchangeRate` | `EXCHANGE_RATE` | Number | Y | |
| `projectItemCode` | `PROJECT_ITEM_CODE` | String | N | Mã hạng mục. FK → `EXP_PROJECT_ITEM` |
| `projectItemName` | `PROJECT_ITEM_NAME` | String | Y | Tên hạng mục (denormalized) |
| `domesticAccount` | `DOMESTIC_ACCOUNT` | String | Y | TK vốn trong nước của chủ đầu tư |
| `domesticBank` | `DOMESTIC_BANK` | String | Y | Ngân hàng vốn trong nước |
| `foreignAccount` | `FOREIGN_ACCOUNT` | String | Y | TK vốn ngoài nước |
| `foreignBank` | `FOREIGN_BANK` | String | Y | Ngân hàng vốn ngoài nước |
| `guaranteeId` | `GUARANTEE_ID` | Integer (int64) | N | FK → `EXP_GUARANTEE` |
| `guaranteeNo` | `GUARANTEE_NO` | String | Y | Số bảo lãnh |
| `guaranteeAmount` | `GUARANTEE_AMOUNT` | Number | Y | Số tiền bảo lãnh |
| `guaranteeRemainAmount` | `GUARANTEE_REMAIN_AMOUNT` | Number | Y | Số tiền bảo lãnh còn lại |
| `guaranteeExpiryDate` | `GUARANTEE_EXPIRY_DATE` | String (date) | Y | Ngày hết hạn bảo lãnh |
| `guaranteeRevokedDate` | `GUARANTEE_REVOKED_DATE` | String (date) | Y | Ngày thu hồi bảo lãnh |
| `completedWorkloadNo` | `COMPLETED_WORKLOAD_NO` | Integer | Y | Số bảng kê KLHT |
| `completedWorkloadDate` | `COMPLETED_WORKLOAD_DATE` | String (date) | Y | Ngày bảng kê KLHT |
| `cumulativeWorkloadPayment` | `CUMULATIVE_WORKLOAD_PAYMENT` | Number | Y | Lũy kế giá trị KL ĐNTT |
| `cumulativePaidCapital` | `CUMULATIVE_PAID_CAPITAL` | Number | Y | Lũy kế vốn đã TT từ khởi công |
| `advancePaymentAmount` | `ADVANCE_PAYMENT_AMOUNT` | Number | Y | Số dư tạm ứng |
| `lines` | — | Array\<[DocumentLine](#document-line-fields)\> | N | Danh sách dòng chứng từ |

---

### Document Line Fields

Mapped to `EXP_DOCUMENT_LINE` table.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `documentLineId` | `DOCUMENT_LINE_ID` | UUID | N | |
| `capitalYear` | `CAPITAL_YEAR` | Integer | N | Năm kế hoạch. FK → `EXP_CAPITAL_YEAR` |
| `extended` | `EXTENDED` | Integer (enum: 1, 2) | Y | 1-Kéo dài, 2-Không kéo dài |
| `investmentSourceCode` | `INVESTMENT_SOURCE_CODE` | String | N | Mã nguồn đầu tư. **Xem VAL-COMPOSITE-FK** |
| `allocationCriteriaCode` | `ALLOCATION_CRITERIA_CODE` | String | N | FK → `COMMON_ALLOCATION_CRITERIA` |
| `paymentRequestAmount` | `PAYMENT_REQUEST_AMOUNT` | Number | Y | Số ĐNTT NT |
| `paymentRequestAmountVnd` | `PAYMENT_REQUEST_AMOUNT_VND` | Number | Y | Số ĐNTT VND |
| `approvedAmount` | `APPROVED_AMOUNT` | Number | Y | Số KBNN duyệt NT |
| `approvedAmountVnd` | `APPROVED_AMOUNT_VND` | Number | Y | Số KBNN duyệt VND |
| `advanceDeductionAmount` | `ADVANCE_DEDUCTION_AMOUNT` | Number | Y | Thu hồi tạm ứng NT |
| `advanceDeductionAmountVnd` | `ADVANCE_DEDUCTION_AMOUNT_VND` | Number | Y | Thu hồi tạm ứng VND |
| `warrantyAmount` | `WARRANTY_AMOUNT` | Number | Y | Chuyển bảo hành NT |
| `warrantyAmountVnd` | `WARRANTY_AMOUNT_VND` | Number | Y | Chuyển bảo hành VND |
| `pendingSettlementAmount` | `PENDING_SETTLEMENT_AMOUNT` | Number | Y | Tạm giữ chờ quyết toán NT |
| `pendingSettlementAmountVnd` | `PENDING_SETTLEMENT_AMOUNT_VND` | Number | Y | Tạm giữ chờ quyết toán VND |
| `valueAddedTaxAmount` | `VALUE_ADDED_TAX_AMOUNT` | Number | Y | Thuế GTGT |
| `transferBeneficiaryAmount` | `TRANSFER_BENEFICIARY_AMOUNT` | Number | Y | Chuyển đơn vị thụ hưởng NT |
| `transferBeneficiaryAmountVnd` | `TRANSFER_BENEFICIARY_AMOUNT_VN` | Number | Y | Chuyển đơn vị thụ hưởng VND |
| `beneficiaryName` | `BENEFICIARY_NAME` | String | Y | Tên đơn vị thụ hưởng |
| `beneficiaryAccount` | `BENEFICIARY_ACCOUNT` | String | Y | Số TK đơn vị thụ hưởng |
| `beneficiaryBankName` | `BENEFICIARY_BANK_NAME` | String | Y | Tên ngân hàng thụ hưởng |
| `beneficiaryBankCode` | `BENEFICIARY_BANK_CODE` | String | N | Mã ngân hàng thụ hưởng. FK → `COMMON_BANK` |
| `glSegments` | — | Object | N | GL Segments |

**GL Segments:**

| API Field | SQL Column | Description | FK Table |
|---|---|---|---|
| `glSegments.segment2` | `GL_SEGMENT2` | TKTN | `COMMON_GL_SEGMENT2` |
| `glSegments.segment4` | `GL_SEGMENT4` | NDKT | `COMMON_GL_SEGMENT4` |
| `glSegments.segment5` | `GL_SEGMENT5` | Cấp NS | `COMMON_GL_SEGMENT5` |
| `glSegments.segment8` | `GL_SEGMENT8` | Chương | `COMMON_GL_SEGMENT8` |
| `glSegments.segment9` | `GL_SEGMENT9` | Ngành | `COMMON_GL_SEGMENT9` |
| `glSegments.segment10` | `GL_SEGMENT10` | CTMT | `COMMON_GL_SEGMENT10` |
| `glSegments.segment12` | `GL_SEGMENT12` | Nguồn | `COMMON_GL_SEGMENT12` |
| `glSegments.segment13` | `GL_SEGMENT13` | DP | `COMMON_GL_SEGMENT13` |

> **VAL-COMPOSITE-FK:** DB có composite FK `(INVESTMENT_SOURCE_CODE, GL_SEGMENT12) → COMMON_INVESTMENT_SOURCE(INVESTMENT_SOURCE_CODE, SEGMENT_CODE)`. Khi FE chọn `investmentSourceCode` từ LOV.08, record LOV trả về sẽ chứa `segmentCode` — FE phải auto-set `glSegments.segment12` = `segmentCode` đó. BE validate composite FK khi save.

---

### 4.7. AttachmentInfo

Mapped to `EXP_ARCHIVE` table.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `archiveId` | `ARCHIVE_ID` | UUID | N | |
| `fileName` | `FILE_NAME` | String | N | Tên file gốc |
| `archiveType` | `ARCHIVE_TYPE` | String | N | Loại lưu trữ |
| `description` | `DESCRIPTION` | String | Y | Mô tả |
| `archiveDate` | `ARCHIVE_DATE` | String (date) | Y | Ngày lưu trữ |
| `downloadUrl` | _(derived)_ | String | N | URL download: `/api/v1/capex-dossier/{id}/attachments/{archiveId}/download` |
| `createdBy` | `CREATED_BY` | String | N | |
| `createdDate` | `CREATED_DATE` | String (date-time) | N | |
| `updatedBy` | `UPDATED_BY` | String | Y | |
| `updatedDate` | `UPDATED_DATE` | String (date-time) | Y | |

> `FILE_PATH` (physical path trên server) không expose ra API. BE dùng nội bộ khi serve download.

---

### 4.8. ProjectInfo

Mapped to `EXP_PROJECT` JOIN `EXP_PROJECT_MANAGEMENT`. Returned by `GET /master-data/projects`.

| API Field | SQL Column | Type | Description |
|---|---|---|---|
| `projectCode` | `EXP_PROJECT.PROJECT_CODE` | String | Mã dự án |
| `projectName` | `EXP_PROJECT.PROJECT_NAME` | String | Tên dự án |
| `projectTypeCode` | `EXP_PROJECT.PROJECT_TYPE_CODE` | String | Loại dự án |
| `projectManagementCode` | `EXP_PROJECT.PROJECT_MANAGEMENT_CODE` | String | Mã ban QLDA |
| `projectManagementName` | `EXP_PROJECT_MANAGEMENT.PROJECT_MANAGEMENT_NAME` | String | Tên ban QLDA (via JOIN) |
| `investorCode` | `EXP_PROJECT.INVESTOR_CODE` | String | Mã chủ đầu tư |

---

### 4.9. ApiError

Returned for all 4xx/5xx responses.

| API Field | Type | Description |
|---|---|---|
| `errorCode` | String | Mã lỗi (xem [Error Codes](#53-error-codes)) |
| `message` | String | Thông báo lỗi chung |
| `traceId` | String | Request trace ID (for debugging) |
| `errors` | Array | Chi tiết lỗi từng field |
| `errors[].field` | String | Tên field bị lỗi |
| `errors[].message` | String | Thông báo lỗi cho field đó |

```json
{
  "errorCode": "MSG-ERR-REQUIRED",
  "message": "Validation failed",
  "traceId": "abc123-def456",
  "errors": [
    {
      "field": "treasuryCode",
      "message": "Vui lòng chọn Kho bạc"
    }
  ]
}
```

---

### 4.10. ApprovalLogEntry

Returned in `DossierDetail.approvalHistory`. Mapped to `EXP_APPROVAL_LOG`.

| API Field | SQL Column | Type | Description |
|---|---|---|---|
| `logId` | `APPROVAL_LOG_ID` | UUID | ID bản ghi log |
| `actionUser` | `ACTION_USER` | String | Người thực hiện |
| `actionDate` | `ACTION_DATE` | String (date-time) | Thời gian thực hiện |
| `actionRole` | `ACTION_ROLE` | String | Vai trò: `Maker`, `Checker`, `Approver` |
| `stateCode` | `STATE_CODE` | String | Trạng thái sau khi thực hiện |
| `reason` | `REASON` | String | Lý do (với REJECT/RETURN) |

---

### 4.11. CodeNameItem

Generic model dùng cho tất cả LOV đơn giản (LOV.02 – LOV.10, LOV.13).

| API Field | Type | Description |
|---|---|---|
| `code` | String | Mã (PK của bảng nguồn) |
| `name` | String | Tên hiển thị |

```json
{ "code": "0600", "name": "KBNN Hà Nội" }
```

---

### 4.12. InvestmentSourceItem

Dùng cho LOV.08 — mang thêm `segmentCode` để auto-fill GL_SEGMENT12.

| API Field | SQL Column | Type | Description |
|---|---|---|---|
| `code` | `INVESTMENT_SOURCE_CODE` | String | Mã nguồn đầu tư |
| `name` | `INVESTMENT_SOURCE_NAME` | String | Tên nguồn đầu tư |
| `segmentCode` | `SEGMENT_CODE` | String | GL_SEGMENT12 tương ứng (dùng cho VAL-COMPOSITE-FK) |

---

### 4.13. GuaranteeItem

Dùng cho LOV.12. Mapped to `EXP_GUARANTEE`.

| API Field | SQL Column | Type | Description |
|---|---|---|---|
| `guaranteeId` | `GUARANTEE_ID` | Integer (int64) | ID bảo lãnh |
| `guaranteeNo` | `GUARANTEE_NO` | String | Số bảo lãnh |
| `guaranteeAmount` | `GUARANTEE_AMOUNT` | Number | Số tiền bảo lãnh |
| `guaranteeRemainingAmount` | `GUARANTEE_REMAINING_AMOUNT` | Number | Số tiền còn lại |
| `guaranteeExpiryDate` | `GUARANTEE_EXPIRY_DATE` | String (date) | Ngày hết hạn |

---

## 5. Frontend Mocking Instructions

Frontend developers can use the provided [capex-dossier-api.yaml](./capex-dossier-api.yaml) with tools like:
1. **Stoplight Prism:** `prism proxy capex-dossier-api.yaml` to run a local mock server.
2. **Swagger Editor:** Paste the YAML into editor.swagger.io to generate a client or UI.
3. **Mock Service Worker (MSW):** Define handlers based on the schemas above.

---

## 6. Backend Implementation Guide

### 6.1. Database Mapping

| Layer | Table(s) |
|---|---|
| Dossier Header | `EXP_DOSSIER` |
| Documents | `EXP_DOCUMENT`, linked by `DOSSIER_ID` |
| Document Lines | `EXP_DOCUMENT_LINE`, linked by `DOCUMENT_ID` |
| Attachments | `EXP_ARCHIVE`, linked by `DOSSIER_ID` |
| Approval History | `EXP_APPROVAL_LOG`, linked by `DOSSIER_ID` |
| Audit | `AUDIT_LOG` (mỗi thao tác ghi 1 bản ghi — schema cần bổ sung thêm các cột chi tiết) |

### 6.2. Internal Fields (không từ FE)

Khi tạo dossier, BE tự resolve các field sau — FE không truyền:

| Column | Cách resolve |
|---|---|
| `WORKFLOW_ID` | Lookup `EXP_WORKFLOW` theo loại nghiệp vụ CAPEX |
| `DOSSIER_CODE` | Sinh theo pattern `EXP/CAPEX/{year}/{seq}` |
| `STATUS` | Mặc định `1` (đang hiệu lực) khi tạo mới |
| `INVESTOR_NAME` | Lookup qua `EXP_PROJECT` → `EXP_INVESTOR.INVESTOR_NAME` rồi denormalize |
| `PROJECT_MANAGEMENT_NAME` | Lookup qua `EXP_PROJECT.PROJECT_MANAGEMENT_CODE` → `EXP_PROJECT_MANAGEMENT` |
| `ASSIGN_USER` | Set bởi BE khi workflow chuyển bước |
| `RECEIVE_DATE` | Set bởi BE khi Checker nhận hồ sơ |

### 6.3. Business Rules (Validation)

| Rule | Mô tả |
|---|---|
| `VAL-13` | Chỉ cho phép Update/Delete khi `stateCode == 'DRAFT'` |
| `VAL-15` | Verify `version` khớp DB trước khi update (Optimistic Locking) |
| `VAL-16` | `deleteReason` phải >= 10 ký tự |
| `VAL-COMPOSITE-FK` | Khi save `EXP_DOCUMENT_LINE`: validate `(INVESTMENT_SOURCE_CODE, GL_SEGMENT12)` tồn tại trong `COMMON_INVESTMENT_SOURCE` |
| `BIZ-001` | Kiểm tra role người dùng phù hợp với bước workflow hiện tại |
| `BIZ-002` | Soft delete: set `STATE_CODE = 'DELETED'` VÀ `STATUS = 0` |

### 6.4. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `MSG-ERR-REQUIRED` | 400 | Missing mandatory fields |
| `MSG-ERR-LOCK` | 409 | Version mismatch (optimistic lock) |
| `MSG-ERR-STATUS` | 400 | Invalid state for operation |
| `MSG-ERR-NOT-FOUND` | 404 | Resource not found |
| `MSG-ERR-COMPOSITE-FK` | 400 | InvestmentSourceCode + GL_SEGMENT12 không khớp |
