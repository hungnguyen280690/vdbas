# CAPEX Dossier Management - API Contract

This document provides a detailed API contract for the **Dossier Management for CAPEX** module. It serves as the single source of truth for both Frontend (for mocking) and Backend (for implementation).

## 1. Overview
- **Base URL:** `/api/v1`
- **Specification:** [OpenAPI 3.0 (YAML)](./capex-dossier-api.yaml)
- **Primary Entity:** `CapexDossier`
- **Workflow:** Maker (Create/Submit) → Checker (Verify) → Approver (Finalize)

---

## 2. API Endpoints Summary

| Method | Endpoint | Description | Role | Success Code |
|---|---|---|---|---|
| `GET` | `/capex-dossier` | Search/List dossiers with filters | All | 200 |
| `POST` | `/capex-dossier` | Create a new dossier (DRAFT) | Maker | 201 |
| `GET` | `/capex-dossier/{id}` | Get full dossier detail (Header + Docs + Attach) | All | 200 |
| `PUT` | `/capex-dossier/{id}` | Update dossier header (DRAFT only) | Maker | 200 |
| `DELETE` | `/capex-dossier/{id}` | Soft delete dossier (DRAFT only) | Maker | 204 |
| `POST` | `/capex-dossier/{id}/submit` | Submit dossier to Checker | Maker | 200 |
| `POST` | `/capex-dossier/{id}/workflow` | Workflow actions: CHECK, APPROVE, REJECT, RETURN | Checker/Approver | 200 |
| `GET` | `/capex-dossier/{id}/documents` | List all documents in dossier | All | 200 |
| `GET` | `/master-data/projects` | Lookup Projects (LOV.01) | Maker | 200 |

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

See [DossierCreateRequest](#43-dossiercreaterequestput-dossiérupdaterequest) schema.

```json
{
  "sendDate": "2026-06-05",
  "projectCode": "7004686",
  "projectSpecificCode": null,
  "projectManagementCode": "1059227",
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

See [DossierUpdateRequest](#43-dossiercreaterequestput-dossiérupdaterequest) schema.

```json
{
  "sendDate": "2026-06-10",
  "projectCode": "7004686",
  "projectSpecificCode": null,
  "projectManagementCode": "1059227",
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

### 3.9. `GET /master-data/projects` — Lookup Projects (LOV.01)

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `code` | string | N | Filter by project code |
| `name` | string | N | Filter by project name |

#### Response `200 OK`

Returns array of [ProjectInfo](#48-projectinfo).

---

## 4. Data Models

### 4.1. DossierHeader

Mapped to `EXP_DOSSIER` table. Returned by POST (201), PUT (200), GET/{id} (200).

| API Field | SQL Column | Type | Required | Description |
|---|---|---|---|---|
| `dossierId` | `DOSSIER_ID` | UUID | Y | System generated unique ID |
| `dossierCode` | `DOSSIER_CODE` | String | Y | Human-readable code (e.g., EXP/CAPEX/2026/00001) |
| `sendDate` | `SEND_DATE` | String (date) | Y | Ngày gửi hồ sơ |
| `stateCode` | `STATE_CODE` | String | Y | Enum: `DRAFT`, `PENDING_CHECK`, `CHECK_REJECTED`, `CHECK_CANCELLED`, `PENDING_APPROVE`, `APPROVE_REJECTED`, `APPROVE_CANCELLED`, `APPROVED`, `DELETED` |
| `projectCode` | `PROJECT_CODE` | String | Y | FK → `EXP_PROJECT` |
| `projectName` | `PROJECT_NAME` | String | N | Denormalized tên dự án |
| `projectSpecificCode` | `PROJECT_SPECIFIC_CODE` | String (nullable) | N | FK → `EXP_PROJECT_SPECIFIC` |
| `projectSpecificName` | `PROJECT_SPECIFIC_NAME` | String (nullable) | N | Denormalized |
| `projectManagementCode` | _(derived)_ | String | N | Derived via JOIN `EXP_PROJECT` → `EXP_PROJECT_MANAGEMENT`. Không lưu trực tiếp trong `EXP_DOSSIER` |
| `projectManagementName` | `PROJECT_MANAGEMENT_NAME` | String | N | Denormalized tên ban QLDA |
| `dataSourceCode` | `DATA_SOURCE_CODE` | String | Y | Enum: `MANUAL`, `DVC`. FK → `EXP_DATA_SOURCE` |
| `createdBy` | `CREATED_BY` | String | Y | Người tạo |
| `createdDate` | `CREATED_DATE` | String (date-time) | Y | Thời gian tạo |
| `updatedBy` | `UPDATED_BY` | String | N | Người cập nhật gần nhất |
| `updatedDate` | `UPDATED_DATE` | String (date-time) | N | Thời gian cập nhật gần nhất |
| `version` | `DOSSIER_VERSION` | Integer | Y | Optimistic lock version (`F-VER`) |

---

### 4.2. DossierSummary

Returned in the `content` array of `GET /capex-dossier`.

| API Field | Type | Description |
|---|---|---|
| `dossierId` | UUID | System ID |
| `dossierCode` | String | Human-readable code |
| `sendDate` | String (date) | Ngày gửi hồ sơ |
| `stateCode` | String | Trạng thái hồ sơ |
| `projectName` | String | Tên dự án |
| `createdBy` | String | Người tạo |
| `createdDate` | String (date-time) | Thời gian tạo |
| `totalAmountVnd` | Number | SUM(`PAYMENT_REQUEST_AMOUNT_VND`) của tất cả lines trong dossier |
| `documentCount` | Integer | COUNT(`DOCUMENT_ID`) GROUP BY `DOSSIER_ID` |

---

### 4.3. DossierCreateRequest / DossierUpdateRequest

#### DossierCreateRequest (POST body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `sendDate` | String (date) | Y | — | Ngày gửi hồ sơ |
| `projectCode` | String | Y | — | Mã dự án/công trình |
| `projectSpecificCode` | String | N | — | Mã dự án con (nếu có) |
| `projectManagementCode` | String | Y | — | Mã ban QLDA |
| `dataSourceCode` | String | N | `MANUAL` | Enum: `MANUAL`, `DVC` |

#### DossierUpdateRequest (PUT body)

| Field | Type | Required | Description |
|---|---|---|---|
| `sendDate` | String (date) | N | Ngày gửi hồ sơ mới |
| `projectCode` | String | N | Mã dự án/công trình mới |
| `projectSpecificCode` | String | N | Mã dự án con mới |
| `projectManagementCode` | String | N | Mã ban QLDA mới |
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

Mapped to `EXP_DOCUMENT` table. **Lưu ý:** `paymentRequestAmount` và các amount fields nằm ở `EXP_DOCUMENT_LINE`, không phải `EXP_DOCUMENT`.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `documentId` | `DOCUMENT_ID` | UUID | N | |
| `documentNumber` | `DOCUMENT_NUMBER` | String | N | |
| `documentDate` | `DOCUMENT_DATE` | String (date) | N | |
| `accountingDate` | `ACCOUNTING_DATE` | String (date) | N | |
| `documentTemplateId` | `DOCUMENT_TEMPLATE_ID` | Integer (int64) | N | |
| `documentTypeCode` | `DOCUMENT_TYPE_CODE` | String | N | |
| `fiscalYear` | `FISCAL_YEAR` | Integer | N | Niên độ |
| `paymentRequestNo` | `PAYMENT_REQUEST_NO` | String | Y | |
| `paymentRequestDate` | `PAYMENT_REQUEST_DATE` | String (date) | Y | |
| `treasuryCode` | `TREASURY_CODE` | String | N | |
| `payingTreasuryCode` | `PAYING_TREASURY_CODE` | String | Y | |
| `paymentTypeCode` | `PAYMENT_TYPE_CODE` | String | N | Tạm ứng/Thanh toán |
| `capitalPlanTypeCode` | `CAPITAL_PLAN_TYPE_CODE` | String | N | |
| `currencyTypeCode` | `CURRENCY_TYPE_CODE` | String | N | |
| `exchangeRateTypeCode` | `EXCHANGE_RATE_TYPE_CODE` | String | N | |
| `exchangeRateDate` | `EXCHANGE_RATE_DATE` | String (date) | Y | |
| `exchangeRate` | `EXCHANGE_RATE` | Number | Y | |
| `projectItemCode` | `PROJECT_ITEM_CODE` | String | N | |
| `projectItemName` | `PROJECT_ITEM_NAME` | String | Y | |
| `domesticAccount` | `DOMESTIC_ACCOUNT` | String | Y | |
| `domesticBank` | `DOMESTIC_BANK` | String | Y | |
| `foreignAccount` | `FOREIGN_ACCOUNT` | String | Y | |
| `foreignBank` | `FOREIGN_BANK` | String | Y | |
| `guaranteeId` | `GUARANTEE_ID` | Integer (int64) | N | |
| `guaranteeNo` | `GUARANTEE_NO` | String | Y | |
| `guaranteeAmount` | `GUARANTEE_AMOUNT` | Number | Y | |
| `guaranteeRemainAmount` | `GUARANTEE_REMAIN_AMOUNT` | Number | Y | |
| `guaranteeExpiryDate` | `GUARANTEE_EXPIRY_DATE` | String (date) | Y | |
| `guaranteeRevokedDate` | `GUARANTEE_REVOKED_DATE` | String (date) | Y | |
| `completedWorkloadNo` | `COMPLETED_WORKLOAD_NO` | Integer | Y | |
| `completedWorkloadDate` | `COMPLETED_WORKLOAD_DATE` | String (date) | Y | |
| `cumulativeWorkloadPayment` | `CUMULATIVE_WORKLOAD_PAYMENT` | Number | Y | |
| `cumulativePaidCapital` | `CUMULATIVE_PAID_CAPITAL` | Number | Y | |
| `advancePaymentAmount` | `ADVANCE_PAYMENT_AMOUNT` | Number | Y | Số dư tạm ứng |
| `lines` | — | Array\<[DocumentLine](#document-line-fields)\> | N | Danh sách dòng chứng từ |

---

### Document Line Fields

Mapped to `EXP_DOCUMENT_LINE` table.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `documentLineId` | `DOCUMENT_LINE_ID` | UUID | N | |
| `capitalYear` | `CAPITAL_YEAR` | Integer | N | Năm kế hoạch |
| `extended` | `EXTENDED` | Integer (enum: 1, 2) | Y | 1-Kéo dài, 2-Không kéo dài |
| `investmentSourceCode` | `INVESTMENT_SOURCE_CODE` | String | N | |
| `allocationCriteriaCode` | `ALLOCATION_CRITERIA_CODE` | String | N | |
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
| `transferBeneficiaryAmountVn` | `TRANSFER_BENEFICIARY_AMOUNT_VN` | Number | Y | Chuyển đơn vị thụ hưởng VND |
| `beneficiaryName` | `BENEFICIARY_NAME` | String | Y | |
| `beneficiaryAccount` | `BENEFICIARY_ACCOUNT` | String | Y | |
| `beneficiaryBankName` | `BENEFICIARY_BANK_NAME` | String | Y | |
| `beneficiaryBankCode` | `BENEFICIARY_BANK_CODE` | String | N | |
| `glSegments` | — | Object | N | GL Segments — xem bảng bên dưới |

**GL Segments** — chỉ các cột thực sự tồn tại trong `EXP_DOCUMENT_LINE`:

| API Field | SQL Column | Description |
|---|---|---|
| `glSegments.segment2` | `GL_SEGMENT2` | TKTN |
| `glSegments.segment4` | `GL_SEGMENT4` | NDKT |
| `glSegments.segment5` | `GL_SEGMENT5` | Cấp NS |
| `glSegments.segment8` | `GL_SEGMENT8` | Chương |
| `glSegments.segment9` | `GL_SEGMENT9` | Ngành |
| `glSegments.segment10` | `GL_SEGMENT10` | CTMT |
| `glSegments.segment12` | `GL_SEGMENT12` | Nguồn |
| `glSegments.segment13` | `GL_SEGMENT13` | DP |

---

### 4.7. AttachmentInfo

Mapped to `EXP_ARCHIVE` table.

| API Field | SQL Column | Type | Nullable | Description |
|---|---|---|---|---|
| `archiveId` | `ARCHIVE_ID` | UUID | N | |
| `fileName` | `FILE_NAME` | String | N | |
| `archiveType` | `ARCHIVE_TYPE` | String | N | Loại lưu trữ |
| `description` | `DESCRIPTION` | String | Y | Mô tả |
| `archiveDate` | `ARCHIVE_DATE` | String (date) | Y | |
| `createdBy` | `CREATED_BY` | String | N | |
| `createdDate` | `CREATED_DATE` | String (date-time) | N | |
| `updatedBy` | `UPDATED_BY` | String | Y | |
| `updatedDate` | `UPDATED_DATE` | String (date-time) | Y | |

---

### 4.8. ProjectInfo

Mapped to `EXP_PROJECT` joined with `EXP_PROJECT_MANAGEMENT`. Returned by `GET /master-data/projects`.

| API Field | SQL Column | Type | Description |
|---|---|---|---|
| `projectCode` | `EXP_PROJECT.PROJECT_CODE` | String | Mã dự án |
| `projectName` | `EXP_PROJECT.PROJECT_NAME` | String | Tên dự án |
| `projectTypeCode` | `EXP_PROJECT.PROJECT_TYPE_CODE` | String | Loại dự án |
| `projectManagementCode` | `EXP_PROJECT.PROJECT_MANAGEMENT_CODE` | String | Mã ban QLDA |
| `projectManagementName` | `EXP_PROJECT_MANAGEMENT.PROJECT_MANAGEMENT_NAME` | String | Tên ban QLDA (via JOIN) |

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
      "field": "projectCode",
      "message": "Vui lòng nhập Mã dự án/công trình"
    }
  ]
}
```

---

### 4.10. ApprovalLogEntry

Returned in `DossierDetail.approvalHistory`.

| API Field | Type | Description |
|---|---|---|
| `logId` | UUID | ID bản ghi log |
| `actionUser` | String | Người thực hiện |
| `actionDate` | String (date-time) | Thời gian thực hiện |
| `actionRole` | String | Vai trò (Maker/Checker/Approver) |
| `stateCode` | String | Trạng thái sau khi thực hiện |
| `reason` | String | Lý do (với REJECT/RETURN) |

---

## 5. Frontend Mocking Instructions

Frontend developers can use the provided [capex-dossier-api.yaml](./capex-dossier-api.yaml) with tools like:
1. **Stoplight Prism:** `prism proxy capex-dossier-api.yaml` to run a local mock server.
2. **Swagger Editor:** Paste the YAML into [editor.swagger.io](https://editor.swagger.io) to generate a client or UI.
3. **Mock Service Worker (MSW):** Define handlers based on the schema in `DossierDetail` and `DossierSummary`.

---

## 6. Backend Implementation Guide

### 6.1. Database Mapping
- **Headers:** Store in `EXP_DOSSIER`.
- **Documents:** Store in `EXP_DOCUMENT`, linked by `DOSSIER_ID`.
- **Document Lines:** Store in `EXP_DOCUMENT_LINE`, linked by `DOCUMENT_ID`.
- **Attachments:** Store in `EXP_ARCHIVE`, linked by `DOSSIER_ID`.
- **Audit:** Every change must log to `AUDIT_LOG` and `EXP_APPROVAL_LOG`.

### 6.2. Business Rules (Validation)
- **VAL-13:** Only allow Update/Delete if `stateCode == 'DRAFT'`.
- **VAL-15:** Verify `version` matches DB before updating (Optimistic Locking).
- **VAL-16:** `deleteReason` must be >= 10 characters.
- **BIZ-001:** Ensure current user role matches the required workflow step.

### 6.3. Error Codes
Always return structured errors using `ApiError`:
- `MSG-ERR-REQUIRED`: Missing mandatory fields.
- `MSG-ERR-LOCK`: Version mismatch (409 Conflict).
- `MSG-ERR-STATUS`: Invalid state for operation.
