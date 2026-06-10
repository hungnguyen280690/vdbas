# CAPEX Dossier Management - API Contract

This document provides a detailed API contract for the **Dossier Management for CAPEX** module. It serves as the single source of truth for both Frontend (for mocking) and Backend (for implementation).

## 1. Overview
- **Base URL:** `/api/v1`
- **Specification:** [OpenAPI 3.0 (YAML)](./capex-dossier-api.yaml)
- **Primary Entity:** `CapexDossier`
- **Workflow:** Maker (Create/Submit) → Checker (Verify) → Approver (Finalize)

---

## 2. API Endpoints Summary

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/capex-dossier` | Search/List dossiers with filters | All |
| `POST` | `/capex-dossier` | Create a new dossier (DRAFT) | Maker |
| `GET` | `/capex-dossier/{id}` | Get full dossier detail (Header + Docs + Attach) | All |
| `PUT` | `/capex-dossier/{id}` | Update dossier header (DRAFT only) | Maker |
| `DELETE` | `/capex-dossier/{id}` | Soft delete dossier (DRAFT only) | Maker |
| `POST` | `/capex-dossier/{id}/submit` | Submit dossier to Checker | Maker |
| `POST` | `/capex-dossier/{id}/workflow` | Workflow actions: CHECK, APPROVE, REJECT, RETURN | Checker/Approver |
| `GET` | `/master-data/projects` | Lookup Projects (LOV.01) | Maker |

---

## 3. Data Models Detail

### 3.1. Dossier Header (Header)
Mapped to `EXP_DOSSIER` table.

| Field | Type | Required | Description |
|---|---|---|---|
| `dossierId` | UUID | Y | System generated unique ID |
| `dossierCode` | String | Y | Human-readable code (e.g., EXP/CAPEX/2026/00001) |
| `stateCode` | String | Y | Enum: `DRAFT`, `PENDING_CHECK`, `CHECK_REJECTED`, `APPROVED`, etc. |
| `projectCode` | String | Y | Project ID from Master Data |
| `version` | Integer | Y | Optimistic lock version (`F-VER`) |

### 3.2. Response Examples

#### Success: Create Dossier
**Request:** `POST /api/capex-dossier`
```json
{
  "sendDate": "2026-06-05",
  "projectCode": "7004686",
  "projectManagementCode": "1059227",
  "dataSourceCode": "MANUAL"
}
```

**Response (201 Created):**
```json
{
  "dossierId": "550e8400-e29b-41d4-a716-446655440000",
  "dossierCode": "EXP/CAPEX/2026/00001",
  "stateCode": "DRAFT",
  "version": 1,
  "createdBy": "maker_user",
  "createdDate": "2026-06-05T09:00:00Z"
}
```

#### Error: Validation Failure
**Response (400 Bad Request):**
```json
{
  "errorCode": "MSG-ERR-REQUIRED",
  "message": "Validation failed",
  "errors": [
    {
      "field": "projectCode",
      "message": "Vui lòng nhập Mã dự án/công trình"
    }
  ]
}
```

---

## 4. Frontend Mocking Instructions

Frontend developers can use the provided [capex-dossier-api.yaml](./capex-dossier-api.yaml) with tools like:
1. **Stoplight Prism:** `prism proxy capex-dossier-api.yaml` to run a local mock server.
2. **Swagger Editor:** Paste the YAML into [editor.swagger.io](https://editor.swagger.io) to generate a client or UI.
3. **Mock Service Worker (MSW):** Define handlers based on the schema in `DossierDetail` and `DossierSummary`.

---

## 5. Backend Implementation Guide

### 5.1. Database Mapping
- **Headers:** Store in `EXP_DOSSIER`.
- **Documents:** Store in `EXP_DOCUMENT`, linked by `DOSSIER_ID`.
- **Audit:** Every change must log to `AUDIT_LOG` and `EXP_APPROVAL_LOG`.

### 5.2. Business Rules (Validation)
- **VAL-13:** Only allow Update/Delete if `stateCode == 'DRAFT'`.
- **VAL-15:** Verify `version` matches DB before updating (Optimistic Locking).
- **VAL-16:** `deleteReason` must be >= 10 characters.
- **BIZ-001:** Ensure current user role matches the required workflow step.

### 5.3. Error Codes
Always return structured errors using the following codes from `spec_function.md`:
- `MSG-ERR-REQUIRED`: Missing mandatory fields.
- `MSG-ERR-LOCK`: Version mismatch (409 Conflict).
- `MSG-ERR-STATUS`: Invalid state for operation.
