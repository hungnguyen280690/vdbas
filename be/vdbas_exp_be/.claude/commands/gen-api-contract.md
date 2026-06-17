# gen-api-contract

Generate an OpenAPI 3.0.3 API contract YAML from a database SQL schema file and a functional spec (SRS) markdown file.

## Usage

```
/gen-api-contract <sql_file> <srs_file> [output_file]
```

**Arguments** (space-separated): `$ARGUMENTS`

- `sql_file` — path to the SQL DDL file (Oracle or standard SQL)
- `srs_file` — path to the functional spec markdown (SRS / CRUD spec)
- `output_file` — (optional) output YAML path; defaults to `api-contract.yaml` in same directory as SQL file

---

## Instructions

Parse the arguments from: $ARGUMENTS

Follow these steps **exactly in order**. Do NOT skip or merge steps.

---

### STEP 1 — Read both input files

Read the SQL file and the SRS file fully before doing anything else.

---

### STEP 2 — Classify every column in every table

This is the most critical step. Mapping mistakes here cause wrong request/response schemas.

For **each table** in the SQL, produce a classification table in this exact format:

```
## Column Classification: <TABLE_NAME>

| Column | DB Type | Nullable | API Field Name | Category | OpenAPI Type | In Request? | In Response? | Notes |
|--------|---------|----------|----------------|----------|--------------|-------------|--------------|-------|
| ID | RAW(16) | NOT NULL | id | AUTO_FILL | string/uuid | No | Yes | PK, backend generates UUID |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
```

**Category definitions — assign exactly one to each column:**

| Category | When to use | In Request Body? | In Response? |
|----------|-------------|-----------------|--------------|
| `USER_INPUT` | User types/selects this value; it is the primary data | **Yes** (create + update) | Yes |
| `USER_INPUT_CREATE_ONLY` | User provides at creation only; immutable after (VAL-17 equivalent) | **Yes** (create only) | Yes |
| `LOV_CODE` | FK reference code — user selects from a Lookup/Dropdown | **Yes** (create + update) | Yes |
| `LOV_DENORM` | Denormalized label stored alongside a LOV_CODE — auto-filled by backend from the selected code | **No** | Yes (read-only) |
| `AUTO_FILL` | Backend generates automatically: UUID PKs, document codes, CREATED_BY, CREATED_DATE, IP, timestamps | **No** | Yes (read-only) |
| `OPTIMISTIC_LOCK` | Version counter for conflict detection | **Yes** (update only) | Yes |
| `BACKEND_MANAGED` | Backend computes/updates: F_STATUS, WORKFLOW_CODE, ASSIGN_USER, SLA, HASH_INFO, COMPLETED_DATE, STATUS (0/1 flag), UPDATED_BY, UPDATED_DATE | **No** | Yes (read-only) |
| `RESPONSE_ONLY` | Computed/aggregated at query time — does not map to a single DB column: DOCUMENT_COUNT, TOTAL_BASE_AMOUNT | **No** | Yes |
| `INTERNAL_ONLY` | Purely internal DB mechanism, never expose: soft-delete STATUS (0/1) when F_STATUS already conveys state | **No** | **No** |

**Rules for assigning categories (apply in this priority order):**

1. Column is a UUID primary key → `AUTO_FILL`
2. Column name matches `CREATED_BY`, `CREATED_DATE` → `AUTO_FILL`
3. Column name matches `UPDATED_BY`, `UPDATED_DATE` → `BACKEND_MANAGED`
4. Column name matches `STATUS` with values 0/1 (active flag, NOT the business state) → `BACKEND_MANAGED` (if a separate F_STATUS / state column exists) or `INTERNAL_ONLY`
5. Column name matches `VERSION` (or equivalent optimistic lock field) → `OPTIMISTIC_LOCK`
6. Column is listed in SRS §B5 "Out of Scope / backend-managed" section → `BACKEND_MANAGED`
7. Column name ends in `_CODE` AND there is a corresponding `_NAME` column AND the `_CODE` is a FK to a master table → `LOV_CODE`; the paired `_NAME` column → `LOV_DENORM`
8. Column name ends in `_NAME` AND paired with a `_CODE` column (rule above) → `LOV_DENORM`
9. Column stores a business state/status flow (e.g., F_STATUS, STATE_CODE) → `BACKEND_MANAGED` (state machine is driven by backend, not directly by user input)
10. Column stores computed aggregates (totals, counts) not present in the table itself → `RESPONSE_ONLY`
11. Column is explicitly marked as user-editable in the SRS field spec table (§B1) with Mandatory Y/N/C → `USER_INPUT`
12. Column is marked as immutable after creation in SRS (VAL-17 equivalent) → `USER_INPUT_CREATE_ONLY`
13. Everything else → `USER_INPUT` (default, but flag as "VERIFY" in Notes column)

**After the table, add a summary block:**

```
### Classification Summary: <TABLE_NAME>
- USER_INPUT fields (go in CreateRequest + UpdateRequest): [list]
- USER_INPUT_CREATE_ONLY fields (CreateRequest only): [list]
- LOV_CODE fields (go in requests + LOV endpoints needed): [list → LOV name]
- LOV_DENORM fields (responses only, auto-fill source): [list → filled from which LOV_CODE]
- OPTIMISTIC_LOCK fields (UpdateRequest only): [list]
- AUTO_FILL fields (responses only): [list]
- BACKEND_MANAGED fields (responses only): [list]
- RESPONSE_ONLY computed fields: [list]
- INTERNAL_ONLY (excluded from API entirely): [list]
- ⚠️ VERIFY fields (need manual confirmation): [list]
```

Do this for EVERY table in the SQL — main entity tables AND child tables (documents, attachments, logs).

---

### STEP 3 — Cross-reference classifications against the SRS

After classifying all columns, reconcile against the SRS:

**3A — Required fields check:**
For every field the SRS marks as Mandatory=Y in the field spec table:
- Confirm it is classified `USER_INPUT` or `LOV_CODE`
- Confirm it will appear in `required[]` of the CreateRequest schema
- Flag mismatches as ⚠️ MISMATCH

**3B — Backend-managed cross-check (§B5 or equivalent):**
For every column the SRS explicitly lists as backend-managed / out-of-scope for UI:
- Confirm its category is `BACKEND_MANAGED` or `AUTO_FILL`
- Flag any that were classified `USER_INPUT` as ⚠️ WRONG CATEGORY

**3C — Denormalization pairs check:**
For every `_CODE` + `_NAME` column pair:
- Confirm `_CODE` → `LOV_CODE` (user selects)
- Confirm `_NAME` → `LOV_DENORM` (backend auto-fills from the code)
- Confirm a LOV endpoint will be designed for the master table
- Flag any pair where both are `USER_INPUT` as ⚠️ LIKELY ERROR (user should not type the name directly)

**3D — State machine isolation check:**
- The primary state/status field (F_STATUS, STATE_CODE, etc.) must be `BACKEND_MANAGED`
- Users never set state directly — they call workflow action endpoints (submit, approve, reject)
- Flag if SRS field spec somehow lists the state field as user-editable

**Print the reconciliation result:**
```
## Cross-Reference Results
✅ N fields correctly classified
⚠️ N fields need review:
  - [TABLE.COLUMN]: [issue description]
```

If there are ⚠️ items, resolve them before continuing to STEP 4.

---

### STEP 4 — Analyze the SRS / functional spec

Extract from the markdown:

**A. Business entity & function scope:**
- Module code (e.g., `EXP.CAPEX_DOSSIER`) → derive API base path (e.g., `/exp/capex/dossiers`)
- Roles: Maker, Checker, Approver, Viewer (or equivalent)
- Permission scope field (e.g., TREASURY_CODE, BRANCH_CODE — from JWT claims)

**B. State machine (§A11 or equivalent):**
- All status enum values and their display labels
- Transition table: from-state + actor + action → to-state + side effects (notify, assign, hash, etc.)
- Which states allow Edit / Delete / Submit

**C. Field spec table (§B1 or equivalent):**
For each field: English name, Mandatory (Y/N/C), default value, UI type, validation rules, read-only/auto-fill conditions.
Cross-reference against Step 2 classifications — flag any contradiction.

**D. List screen filters (§B2 or equivalent):**
Filter fields, their types (single/multi-select), date range pairs, sort options.

**E. Business rules (§A7):**
Soft-delete rules, unique constraints, cross-field validations, file attachment rules, duplicate warning conditions.

**F. Validation rules (§A8):**
All VAL-XX rules → map to HTTP status codes and error response codes.

**G. Error/success codes (§A9):**
Extract all VDBAS-* codes (or project-equivalent) → use in response examples and descriptions.

**H. Workflow actions (§A5, §C1):**
Each button/action that calls an API. Group by: CRUD, state-transition, attachment, export, LOV lookup.

**I. LOV tables (Appendix):**
For each LOV — master table name, code field, name field, filter params needed.
Confirm a LOV endpoint is planned for every `LOV_CODE` field found in Step 2.

---

### STEP 5 — Design the API structure

Apply these rules:

**Base path:** Derive from module code. Example: `EXP.CAPEX_DOSSIER` → `/api/v1/exp/capex/dossiers`

**Standard CRUD endpoints for the main entity:**
```
GET    /resource              — list with filters + pagination
POST   /resource              — create (full validation → main saved state)
POST   /resource/drafts       — save draft (minimal validation → draft state)
GET    /resource/{id}         — get detail
PUT    /resource/{id}         — update (requires version for optimistic lock)
DELETE /resource/{id}         — soft-delete (requires reason + confirm fields per spec)
```

**Workflow endpoints (one per state transition action):**
```
POST /resource/{id}/submit    — send for review
POST /resource/{id}/approve   — checker or approver approves
POST /resource/{id}/reject    — checker or approver rejects
POST /resource/{id}/copy      — duplicate as new draft
```

**Sub-resource endpoints (for child tables):**
```
GET/POST          /resource/{id}/documents
GET/PUT/DELETE    /resource/{id}/documents/{docId}
GET/POST          /resource/{id}/attachments
GET/DELETE        /resource/{id}/attachments/{attId}   (GET = binary download)
```

**Audit endpoints:**
```
GET /resource/{id}/approval-log   — workflow step history
GET /resource/{id}/audit-log      — field change history (oldValue→newValue)
```

**Export:**
```
GET /resource/export   — sync (<50k rows → file) or async (≥50k → jobId + polling URL)
```

**LOV endpoints (one per distinct master table, not one per FK column):**
```
GET /lov/{resource}   — with search/filter params, returns active records only
```

---

### STEP 6 — Write the OpenAPI 3.0.3 YAML

Produce a complete, valid YAML. Use the Step 2 classification table as the single source of truth for every schema.

#### `openapi`, `info`, `servers`, `security`, `tags`

- Version from the SRS file version
- Base URL: `/api/v1`
- Security: `bearerAuth` (JWT with userId, role, scope claims)
- Tags: one per functional group (Dossiers, Documents, Attachments, Workflow, Audit, LOV, Export)

#### `paths`

For each endpoint:
- `tags`, `operationId` (camelCase, unique), `summary` (include event ID from SRS), `description`
- Query parameters: `schema`, `description`, `required`, multi-value params use `style: form, explode: true`
- `requestBody`: `required: true`, schema ref
- Responses: 200/201, 400, 401, 403, 404, 409 (optimistic lock), 413 (file size), 415 (file format), 422 (business rule)
- Error response `example` using actual error codes from SRS §A9

#### `components`

**`securitySchemes`:** bearerAuth (HTTP bearer, JWT)

**`parameters`:** reusable path params, `IdempotencyKey` header (UUID, prevents double-submit)

**`responses`:** BadRequest, Unauthorized, Forbidden, NotFound, Conflict, UnprocessableEntity

**`schemas` — build directly from Step 2 classification tables:**

**1. Enum schemas** — one per enum type (state, role, LOV codes that are enums)

**2. Request schemas** — include ONLY columns classified as USER_INPUT, USER_INPUT_CREATE_ONLY, LOV_CODE, or OPTIMISTIC_LOCK:

| Schema | Columns to include | `required[]` includes |
|--------|-------------------|----------------------|
| `{Entity}CreateRequest` | USER_INPUT + USER_INPUT_CREATE_ONLY + LOV_CODE | All Mandatory=Y fields |
| `{Entity}DraftRequest` | Same columns as Create | None (all optional for draft) |
| `{Entity}UpdateRequest` | USER_INPUT + LOV_CODE + OPTIMISTIC_LOCK | `version` + all Mandatory=Y editable fields |
| `Delete{Entity}Request` | `deleteReason` (minLength from spec) + `confirmReviewed` (boolean) | Both fields |
| `ApproveRequest` | `reason` (optional note) + `digitalSign` (optional object) | None required |
| `RejectRequest` | `reason` (minLength from spec) | `reason` |

**3. Response schemas** — include columns from ALL categories except INTERNAL_ONLY:

| Schema | Columns to include |
|--------|--------------------|
| `{Entity}Summary` | Columns shown in list grid (§B2) |
| `{Entity}Detail` | All columns (USER_INPUT + LOV_CODE + LOV_DENORM + AUTO_FILL + BACKEND_MANAGED + RESPONSE_ONLY) + nested child arrays |
| `{Entity}ListResponse` | items[] of Summary + Pagination + aggregate totals + status counts |
| `{Entity}CreateResponse` | id, code, fStatus, version (minimal confirmation) |
| `{Entity}UpdateResponse` | id, code, fStatus, version (new version after +1) |
| `WorkflowActionResponse` | id, fStatus, fStatusName, assignUser |

**4. LOV schemas** — one item schema + one list-response schema per LOV master table

#### OpenAPI type mapping (from Step 2 DB types):

| DB Type | OpenAPI | Extra constraints |
|---------|---------|-------------------|
| `RAW(16)` | `string` + `format: uuid` | — |
| `VARCHAR2(N)`, `NVARCHAR2(N)` | `string` + `maxLength: N` | — |
| `NUMBER(1)` as 0/1 flag | `integer` + `enum: [0,1]` | Only in BACKEND_MANAGED responses |
| `NUMBER(1)` as boolean concept | `boolean` | For user-facing boolean fields |
| `NUMBER(18)` money | `integer` | description: "Số tiền VND (#,##0)" |
| `NUMBER(p,s)` | `number` | — |
| `DATE` (date only) | `string` + `format: date` | — |
| `DATE` (with time) | `string` + `format: date-time` | Detect from column name: `_TIMESTAMP`, `_DATETIME`, `ACTION_DATE` |
| `TIMESTAMP` | `string` + `format: date-time` | — |
| `CLOB` | `string` | — |
| `DECIMAL(18)` | `number` | — |

#### Additional schema rules:

- **LOV_DENORM fields in responses:** add `description: "Auto-filled from {LOV_CODE_FIELD} via {MASTER_TABLE}; read-only"` — never in request body
- **BACKEND_MANAGED fields in responses:** add `description: "Managed by backend; read-only"` — never in request body  
- **LOV_CODE fields in requests:** add `description: "Select from /lov/{resource}"` so consumers know which LOV endpoint to call
- **Nullable:** add `nullable: true` only when DB column is actually nullable (NULL in DDL)
- **NOT NULL + no default → required in Create:** mandatory unless SRS explicitly says optional
- **File upload:** `multipart/form-data`, file field is `type: string, format: binary`
- **File download:** response `application/octet-stream`, schema `type: string, format: binary`

---

### STEP 7 — Write the output file

Write the complete YAML to the output path. Then:

1. Validate YAML syntax:
   ```
   python3 -c "import yaml; yaml.safe_load(open('<output_file>')); print('YAML OK')"
   ```
2. If validation fails, fix and re-validate before continuing.

3. Print the final summary:

```
## ✅ API Contract Generated: <output_file>

### Statistics
| Section    | Count |
|------------|-------|
| Paths      | N     |
| Operations | N     |
| Schemas    | N     |
| LOV endpoints | N  |

### Column Mapping Coverage
| Table | Total columns | In API (request/response) | Excluded (INTERNAL_ONLY) |
|-------|--------------|--------------------------|--------------------------|
| TABLE_A | N | N | N |
| ...     | N | N | N |

### All Operations
| Method | Path | operationId |
|--------|------|-------------|
| GET | /resource | listResources |
| ...

### Error codes from spec included in YAML
[list each VDBAS-* or equivalent code and where it appears]

### LOV endpoints vs LOV_CODE fields
| LOV_CODE Field | LOV Endpoint | ✅/⚠️ |
|----------------|-------------|-------|
| PROJECT_CODE | GET /lov/projects | ✅ |
| ...
```

---

### Quality checklist — verify ALL before finishing

**Schema correctness (from Step 2 classification):**
- [ ] Zero `BACKEND_MANAGED` or `AUTO_FILL` columns in any request body schema
- [ ] Zero `LOV_DENORM` columns in any request body schema  
- [ ] `OPTIMISTIC_LOCK` column present in UpdateRequest and absent from CreateRequest
- [ ] Every `NOT NULL` + `USER_INPUT` column is in `required[]` of CreateRequest (unless draft or conditional)
- [ ] Every `LOV_CODE` field has a corresponding `/lov/{resource}` endpoint
- [ ] Every `LOV_DENORM` field has `description` stating which `LOV_CODE` it is filled from

**Business logic correctness:**
- [ ] State field (F_STATUS) is `BACKEND_MANAGED` — not directly settable by user via request body
- [ ] Every state transition from the state machine has a corresponding workflow endpoint
- [ ] Soft-delete endpoint requires reason (minLength matches spec) + confirm boolean
- [ ] Submit endpoint description lists pre-conditions (must have child records, correct state, etc.)
- [ ] Approve/Reject endpoints describe SoD rules (different user+role per step)

**Structural correctness:**
- [ ] Every `operationId` is unique across the entire file
- [ ] Every `$ref` target exists in `components/schemas` or `components/parameters` or `components/responses`
- [ ] File upload endpoint uses `multipart/form-data` with file size limit and format enum
- [ ] File download endpoint returns `application/octet-stream`
- [ ] IdempotencyKey header present on all mutating endpoints (POST/PUT/DELETE)
- [ ] YAML is syntactically valid (python3 check passed)

**Coverage:**
- [ ] All error/success codes from SRS §A9 appear in response examples or descriptions
- [ ] All LOV tables from SRS appendix have a GET `/lov/{resource}` endpoint
- [ ] Export endpoint handles both sync and async cases
