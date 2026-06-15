# CAPEX Dossier — Database Impact & Backend Directory Analysis

> Generated from `EXPENDITURE.sql` + `API_CONTRACT.md`
> Module: `vdbas_exp_be`

---

## 1. Table Catalog (37 tables)

### 1.1 Core Business Tables

| Table | Mô tả | PK Type | Ghi chú |
|---|---|---|---|
| `EXP_DOSSIER` | Hồ sơ chi CAPEX | `RAW(16)` UUID | Bảng trung tâm. Có `DOSSIER_VERSION` (optimistic lock), `STATUS` (soft-delete) |
| `EXP_DOCUMENT` | Chứng từ trong hồ sơ | `RAW(16)` UUID | FK → `EXP_DOSSIER.DOSSIER_ID` |
| `EXP_DOCUMENT_LINE` | Dòng chứng từ (phân bổ, GL) | `RAW(16)` UUID | FK → `EXP_DOCUMENT`. Composite FK `(INVESTMENT_SOURCE_CODE, GL_SEGMENT12)` → `COMMON_INVESTMENT_SOURCE` |
| `EXP_ARCHIVE` | File đính kèm hồ sơ | `RAW(16)` UUID | FK → `EXP_DOSSIER`. `FILE_PATH` ẩn, không expose API |
| `EXP_APPROVAL_LOG` | Lịch sử phê duyệt | `RAW(16)` UUID | FK → `EXP_DOSSIER`. Có `PARENT_ID` tự tham chiếu (chuỗi phê duyệt) |
| `EXP_DIGITAL_SIGNED` | Chữ ký số | `RAW(16)` UUID | PK = `APPROVAL_LOG_ID` (1-1 với `EXP_APPROVAL_LOG`) |
| `EXP_DOSSIER_SLA` | SLA từng bước xử lý | `RAW(16)` UUID | FK → `EXP_DOSSIER`. `IS_NOTIFY` tracking gửi cảnh báo |

### 1.2 Workflow & Project Tables

| Table | Mô tả | PK Type |
|---|---|---|
| `EXP_WORKFLOW` | Danh mục luồng phê duyệt | `NUMBER(18)` |
| `EXP_PROJECT` | Danh mục dự án | `VARCHAR2(100)` |
| `EXP_PROJECT_SPECIFIC` | Dự án đặc thù (con) | `VARCHAR2(100)` |
| `EXP_PROJECT_MANAGEMENT` | Ban QLDA | `VARCHAR2(100)` |
| `EXP_PROJECT_TYPE` | Loại dự án | `VARCHAR2(100)` |
| `EXP_INVESTOR` | Chủ đầu tư | `VARCHAR2(100)` |

### 1.3 Master Data (EXP_ prefix)

| Table | Mô tả | API LOV |
|---|---|---|
| `EXP_CAPITAL_PLAN_TYPE` | Loại kế hoạch vốn | LOV.04 |
| `EXP_CAPITAL_YEAR` | Năm kế hoạch | _(dùng trong document line)_ |
| `EXP_CURRENCY_TYPE` | Loại tiền | LOV.05 |
| `EXP_DATA_SOURCE` | Nguồn gốc hồ sơ (MANUAL/DVC) | _(enum field)_ |
| `EXP_DOCUMENT_TEMPLATE` | Mẫu chứng từ | _(internal)_ |
| `EXP_DOCUMENT_TYPE` | Loại chứng từ | LOV.07 |
| `EXP_EXCHANGE_RATE` | Tỷ giá theo ngày | _(lookup khi nhập chứng từ)_ |
| `EXP_EXCHANGE_RATE_TYPE` | Loại tỷ giá | LOV.06 |
| `EXP_GUARANTEE` | Bảo lãnh | LOV.12 |
| `EXP_PAYMENT_TYPE` | Loại thanh toán (Tạm ứng/TT) | LOV.03 |
| `EXP_PROJECT_ITEM` | Hạng mục dự án | LOV.10 |
| `EXP_ACCOUNTING_PERIOD` | Kỳ kế toán (kiểm tra khóa sổ) | _(validation nội bộ)_ |

### 1.4 Common Tables (COMMON_ prefix)

| Table | Mô tả | API LOV |
|---|---|---|
| `COMMON_ALLOCATION_CRITERIA` | Tiêu thức phân bổ | LOV.09 |
| `COMMON_BANK` | Danh mục ngân hàng | _(FK từ `EXP_DOCUMENT_LINE`, `EXP_INVESTOR`)_ |
| `COMMON_GL_SEGMENT2` | TKTN | LOV.11 (segmentNo=2) |
| `COMMON_GL_SEGMENT4` | NDKT | LOV.11 (segmentNo=4) |
| `COMMON_GL_SEGMENT5` | Cấp NS | LOV.11 (segmentNo=5) |
| `COMMON_GL_SEGMENT8` | Chương | LOV.11 (segmentNo=8) |
| `COMMON_GL_SEGMENT9` | Ngành | LOV.11 (segmentNo=9) |
| `COMMON_GL_SEGMENT10` | CTMT | LOV.11 (segmentNo=10) |
| `COMMON_GL_SEGMENT12` | Nguồn | LOV.11 (segmentNo=12) |
| `COMMON_GL_SEGMENT13` | DP | LOV.11 (segmentNo=13) |
| `COMMON_INVESTMENT_SOURCE` | Nguồn đầu tư | LOV.08 |
| `COMMON_STATE` | Trạng thái hồ sơ | LOV.13 |
| `COMMON_TREASURY` | Kho bạc Nhà nước | LOV.02 |

### 1.5 Auxiliary Tables

| Table | Mô tả |
|---|---|
| `AUDIT_LOG` | Audit log chung (schema chưa đầy đủ — chỉ có `AUDIT_LOG_ID`) |
| `PAYMENT_CHANNEL` | Kênh thanh toán (không được expose qua API hiện tại) |

---

## 2. API → Database Operations

### 2.1 Dossier Endpoints

| Endpoint | Method | Tables ghi (INSERT/UPDATE/DELETE) | Tables đọc (SELECT) |
|---|---|---|---|
| `POST /capex-dossier` | INSERT | `EXP_DOSSIER` | `EXP_WORKFLOW`, `EXP_PROJECT`, `EXP_INVESTOR`, `EXP_PROJECT_MANAGEMENT`, `COMMON_TREASURY`, `EXP_DATA_SOURCE` |
| `GET /capex-dossier` | SELECT | — | `EXP_DOSSIER` + JOIN `EXP_DOCUMENT` (count) + `EXP_DOCUMENT_LINE` (sum) |
| `GET /capex-dossier/{id}` | SELECT | — | `EXP_DOSSIER`, `EXP_DOCUMENT`, `EXP_DOCUMENT_LINE`, `EXP_ARCHIVE`, `EXP_APPROVAL_LOG` |
| `PUT /capex-dossier/{id}` | UPDATE | `EXP_DOSSIER` (version check) | `EXP_PROJECT`, `EXP_PROJECT_MANAGEMENT`, `COMMON_TREASURY` |
| `DELETE /capex-dossier/{id}` | UPDATE (soft) | `EXP_DOSSIER` → `STATE_CODE='DELETED'`, `STATUS=0` | — |
| `POST /capex-dossier/{id}/submit` | UPDATE + INSERT | `EXP_DOSSIER` (state), `EXP_APPROVAL_LOG` | `EXP_DOSSIER` (validate state) |
| `POST /capex-dossier/{id}/workflow` | UPDATE + INSERT | `EXP_DOSSIER` (state + assign_user), `EXP_APPROVAL_LOG`, `EXP_DIGITAL_SIGNED` (nếu ký số) | `EXP_DOSSIER`, `EXP_APPROVAL_LOG` (parent_id) |

### 2.2 Document & Attachment Endpoints

| Endpoint | Method | Tables ghi | Tables đọc |
|---|---|---|---|
| `GET /capex-dossier/{id}/documents` | SELECT | — | `EXP_DOCUMENT`, `EXP_DOCUMENT_LINE` |
| `POST /capex-dossier/{id}/attachments` | INSERT | `EXP_ARCHIVE` | `EXP_DOSSIER` (validate state) |
| `DELETE /capex-dossier/{id}/attachments/{archiveId}` | DELETE | `EXP_ARCHIVE` | `EXP_DOSSIER` (validate state=DRAFT) |
| `GET …/attachments/{archiveId}/download` | SELECT | — | `EXP_ARCHIVE` (lấy `FILE_PATH`) |

### 2.3 Master Data Endpoints (READ-ONLY)

| Endpoint | Table | Filter |
|---|---|---|
| `GET /master-data/projects` | `EXP_PROJECT` JOIN `EXP_PROJECT_MANAGEMENT` | `code`, `name` |
| `GET /master-data/treasury` | `COMMON_TREASURY` | `STATUS=1` |
| `GET /master-data/payment-types` | `EXP_PAYMENT_TYPE` | `STATUS=1` |
| `GET /master-data/capital-plan-types` | `EXP_CAPITAL_PLAN_TYPE` | `STATUS=1` |
| `GET /master-data/currency-types` | `EXP_CURRENCY_TYPE` | `STATUS=1` |
| `GET /master-data/exchange-rate-types` | `EXP_EXCHANGE_RATE_TYPE` | `STATUS=1` |
| `GET /master-data/document-types` | `EXP_DOCUMENT_TYPE` | `STATUS=1` |
| `GET /master-data/investment-sources` | `COMMON_INVESTMENT_SOURCE` | `segmentCode` (optional) |
| `GET /master-data/allocation-criteria` | `COMMON_ALLOCATION_CRITERIA` | — |
| `GET /master-data/project-items` | `EXP_PROJECT_ITEM` | `STATUS=1`, `projectCode` (optional) |
| `GET /master-data/gl-segments/{segmentNo}` | `COMMON_GL_SEGMENT{segmentNo}` | segmentNo ∈ {2,4,5,8,9,10,12,13} |
| `GET /master-data/guarantees` | `EXP_GUARANTEE` | `guaranteeNo` (optional) |
| `GET /master-data/states` | `COMMON_STATE` | `SUB_SYSTEM='CAPEX'`, `STATUS=1` |

---

## 3. Foreign Key Dependency Graph

```
COMMON_GL_SEGMENT12 ←── COMMON_INVESTMENT_SOURCE
                                    ↑ (composite FK)
                               EXP_DOCUMENT_LINE ──→ EXP_DOCUMENT ──→ EXP_DOSSIER
                                    │                                       │
                     COMMON_GL_SEGMENT{2,4,5,8,9,10,13}        EXP_ARCHIVE ─┘
                     COMMON_ALLOCATION_CRITERIA                EXP_APPROVAL_LOG ──→ EXP_DIGITAL_SIGNED
                     COMMON_BANK                               EXP_DOSSIER_SLA
                     EXP_CAPITAL_YEAR
                                                               EXP_DOSSIER ──→ EXP_WORKFLOW
                     EXP_DOCUMENT ──→ EXP_DOCUMENT_TEMPLATE ──→ EXP_DOCUMENT_TYPE
                                  ──→ COMMON_TREASURY
                                  ──→ EXP_PAYMENT_TYPE
                                  ──→ EXP_CAPITAL_PLAN_TYPE
                                  ──→ EXP_GUARANTEE
                                  ──→ EXP_PROJECT_ITEM
                                  ──→ EXP_CURRENCY_TYPE ←── EXP_EXCHANGE_RATE
                                  ──→ EXP_EXCHANGE_RATE_TYPE

EXP_DOSSIER ──→ EXP_PROJECT ──→ EXP_INVESTOR ──→ COMMON_BANK
                            ──→ EXP_PROJECT_MANAGEMENT
                            ──→ EXP_PROJECT_TYPE
             ──→ EXP_PROJECT_SPECIFIC ──→ EXP_PROJECT
             ──→ COMMON_STATE
             ──→ COMMON_TREASURY
             ──→ EXP_DATA_SOURCE
```

---

## 4. Key Constraints & Patterns

| Pattern | Chi tiết |
|---|---|
| **UUID (RAW 16)** | Các bảng core dùng `RAW(16)` — Oracle UUID. Lưu ý khi mapping JPA: dùng `@Type(type = "oracle-uuid")` hoặc converter riêng |
| **Optimistic Locking** | `EXP_DOSSIER.DOSSIER_VERSION` — API truyền `version`, BE dùng `@Version` của JPA |
| **Soft Delete** | `EXP_DOSSIER`: set `STATE_CODE='DELETED'` AND `STATUS=0`. Không xóa vật lý |
| **Composite FK** | `EXP_DOCUMENT_LINE(INVESTMENT_SOURCE_CODE, GL_SEGMENT12)` → `COMMON_INVESTMENT_SOURCE(INVESTMENT_SOURCE_CODE, SEGMENT_CODE)` — phải validate trước khi INSERT |
| **Denormalization** | `EXP_DOSSIER` lưu `PROJECT_NAME`, `PROJECT_MANAGEMENT_NAME`, `INVESTOR_NAME` để tăng tốc query list |
| **WORKFLOW_ID NOT NULL** | BE tự resolve khi tạo hồ sơ — FE không truyền |
| **HASH_INFO** | `EXP_DOSSIER.HASH_INFO` — JSON hash toàn bộ hồ sơ khi submit phê duyệt |
| **PARENT_ID** | `EXP_APPROVAL_LOG.PARENT_ID` — chuỗi linked-list lịch sử phê duyệt |
| **STATUS field pattern** | 0 = không hiệu lực / hết hiệu lực, 1 = hiệu lực (consistent trong tất cả bảng) |

---

## 5. Backend Directory Structure Mapping (`vdbas_exp_be`)

```
vdbas_exp_be/
├── api/                          ← Spring MVC Controllers (REST layer)
│   └── src/main/java/.../api/
│       ├── controller/
│       │   ├── CapexDossierController.java   (POST/GET/PUT/DELETE /capex-dossier/*)
│       │   └── MasterDataController.java     (GET /master-data/*)
│       └── dto/
│           ├── request/
│           │   ├── DossierCreateRequest.java
│           │   ├── DossierUpdateRequest.java
│           │   ├── WorkflowActionRequest.java
│           │   └── DossierDeleteRequest.java
│           └── response/
│               ├── DossierHeaderResponse.java
│               ├── DossierSummaryResponse.java
│               ├── DossierDetailResponse.java
│               ├── DocumentDetailResponse.java
│               ├── AttachmentInfoResponse.java
│               └── PagedResponse.java
│
├── application/                  ← Use Cases / Services (business logic)
│   └── src/main/java/.../application/
│       ├── service/
│       │   ├── CapexDossierService.java      (create, update, delete, submit, workflow)
│       │   ├── DocumentService.java          (document CRUD)
│       │   ├── AttachmentService.java        (upload, download, delete)
│       │   └── MasterDataService.java        (tất cả LOV endpoints)
│       └── validator/
│           ├── DossierStateValidator.java    (VAL-13: only DRAFT can edit/delete)
│           ├── OptimisticLockValidator.java  (VAL-15: version check)
│           └── InvestmentSourceValidator.java (VAL-COMPOSITE-FK)
│
├── domain/                       ← JPA Entities + Repositories
│   └── src/main/java/.../domain/
│       ├── entity/
│       │   ├── dossier/
│       │   │   ├── ExpDossier.java           → EXP_DOSSIER
│       │   │   ├── ExpDocument.java          → EXP_DOCUMENT
│       │   │   ├── ExpDocumentLine.java      → EXP_DOCUMENT_LINE
│       │   │   ├── ExpArchive.java           → EXP_ARCHIVE
│       │   │   ├── ExpApprovalLog.java       → EXP_APPROVAL_LOG
│       │   │   ├── ExpDigitalSigned.java     → EXP_DIGITAL_SIGNED
│       │   │   └── ExpDossierSla.java        → EXP_DOSSIER_SLA
│       │   ├── project/
│       │   │   ├── ExpProject.java           → EXP_PROJECT
│       │   │   ├── ExpProjectSpecific.java   → EXP_PROJECT_SPECIFIC
│       │   │   ├── ExpProjectManagement.java → EXP_PROJECT_MANAGEMENT
│       │   │   ├── ExpProjectType.java       → EXP_PROJECT_TYPE
│       │   │   └── ExpInvestor.java          → EXP_INVESTOR
│       │   ├── masterdata/
│       │   │   ├── ExpCapitalPlanType.java   → EXP_CAPITAL_PLAN_TYPE
│       │   │   ├── ExpCapitalYear.java       → EXP_CAPITAL_YEAR
│       │   │   ├── ExpCurrencyType.java      → EXP_CURRENCY_TYPE
│       │   │   ├── ExpDataSource.java        → EXP_DATA_SOURCE
│       │   │   ├── ExpDocumentTemplate.java  → EXP_DOCUMENT_TEMPLATE
│       │   │   ├── ExpDocumentType.java      → EXP_DOCUMENT_TYPE
│       │   │   ├── ExpExchangeRate.java      → EXP_EXCHANGE_RATE
│       │   │   ├── ExpExchangeRateType.java  → EXP_EXCHANGE_RATE_TYPE
│       │   │   ├── ExpGuarantee.java         → EXP_GUARANTEE
│       │   │   ├── ExpPaymentType.java       → EXP_PAYMENT_TYPE
│       │   │   ├── ExpProjectItem.java       → EXP_PROJECT_ITEM
│       │   │   └── ExpWorkflow.java          → EXP_WORKFLOW
│       │   └── common/
│       │       ├── CommonAllocationCriteria.java → COMMON_ALLOCATION_CRITERIA
│       │       ├── CommonBank.java               → COMMON_BANK
│       │       ├── CommonGlSegment.java          → COMMON_GL_SEGMENT{2,4,5,8,9,10,12,13} (generic)
│       │       ├── CommonInvestmentSource.java   → COMMON_INVESTMENT_SOURCE
│       │       ├── CommonState.java              → COMMON_STATE
│       │       └── CommonTreasury.java           → COMMON_TREASURY
│       └── repository/
│           ├── ExpDossierRepository.java
│           ├── ExpDocumentRepository.java
│           ├── ExpDocumentLineRepository.java
│           ├── ExpArchiveRepository.java
│           ├── ExpApprovalLogRepository.java
│           ├── ExpProjectRepository.java
│           └── MasterData*Repository.java (per LOV table)
│
└── common/                       ← Shared utilities, constants, exceptions
    └── src/main/java/.../common/
        ├── constant/
        │   ├── DossierState.java     (DRAFT, PENDING_CHECK, APPROVED, DELETED…)
        │   └── DataSource.java       (MANUAL, DVC)
        ├── exception/
        │   ├── DossierNotFoundException.java
        │   ├── InvalidStateException.java
        │   ├── OptimisticLockException.java
        │   └── CompositeKeyValidationException.java
        └── util/
            ├── DossierCodeGenerator.java  (EXP/CAPEX/{year}/{seq})
            └── UuidConverter.java         (RAW(16) ↔ Java UUID)
```

---

## 6. Tables NOT Exposed via API (cần lưu ý)

| Table | Lý do không expose |
|---|---|
| `EXP_ACCOUNTING_PERIOD` | Dùng nội bộ để validate khóa sổ khi tạo/cập nhật chứng từ |
| `EXP_DIGITAL_SIGNED` | BE tự tạo khi workflow có ký số — FE không tương tác trực tiếp |
| `EXP_DOSSIER_SLA` | Quản lý SLA nội bộ — FE chỉ thấy trường `SLA` trong `EXP_DOSSIER` |
| `EXP_DOCUMENT_TEMPLATE` | Được lookup nội bộ theo `DOCUMENT_TEMPLATE_ID` |
| `EXP_EXCHANGE_RATE` | Dùng khi tra cứu tỷ giá theo ngày — không phải LOV trực tiếp |
| `PAYMENT_CHANNEL` | Chưa có API endpoint trong contract hiện tại |
| `AUDIT_LOG` | Schema chưa đầy đủ — BE ghi nội bộ |
| `EXP_WORKFLOW` | BE tự resolve `WORKFLOW_ID` — FE không truyền |
| `EXP_ARCHIVE.FILE_PATH` | Physical path ẩn — chỉ dùng khi serve download |
