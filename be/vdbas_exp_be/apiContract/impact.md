# Impact Analysis: capex-dossier-api.yaml ↔ DOSSIER.sql

**Generated:** 2026-06-17
**API Version:** 0.2.0
**Base package:** `com.fis.vdbas.exp`

## Tóm tắt

| Hạng mục | Số lượng |
|----------|----------|
| Bảng DB phân tích | 17 |
| YAML Schemas phân tích | 32 |
| Columns mapping khớp | ~85 |
| CRITICAL gaps (đã giải quyết) | 3/3 |
| DECISION_NEEDED gaps (đã giải quyết) | 4/4 |
| IMPLEMENTATION_NOTE | 5 |
| Files cần tạo | ~55 |

## Checklist trước khi sinh code

- [x] Tất cả CRITICAL gaps đã có quyết định
- [x] Tất cả DECISION_NEEDED gaps đã có quyết định
- [x] Base package xác nhận: `com.fis.vdbas.exp`
- [x] Cấu trúc multi-module xác nhận: `domain/` · `application/` · `api/` · `common/`

---

# Quyết định kỹ thuật

## CRITICAL

---

### DEC-01: VERSION type mismatch — CRITICAL

**Vấn đề:** `EXP_DOSSIER.VERSION VARCHAR2(100)` nhưng YAML dùng `integer` cho optimistic lock. `@Version` JPA yêu cầu kiểu số.

**Quyết định:** Giữ VARCHAR2, viết `AttributeConverter<Integer, String>`

**Tác động code:**
- Tạo `VersionConverter.java` trong `common/.../common/converter/`:
  ```java
  @Converter
  public class VersionConverter implements AttributeConverter<Integer, String> {
      public String convertToDatabaseColumn(Integer v) { return v == null ? "0" : v.toString(); }
      public Integer convertToEntityAttribute(String s) { return s == null ? 0 : Integer.parseInt(s); }
  }
  ```
- Entity `ExpDossier`: field `version` kiểu `Integer`, annotation `@Convert(converter = VersionConverter.class)` — **không dùng `@Version`**
- Service phải tự kiểm tra optimistic lock: load entity → so sánh version → throw `OptimisticLockException` nếu lệch
- **Không cần ALTER DDL**

---

### DEC-02: ORIGINAL_AMOUNT NOT NULL vs nullable — CRITICAL

**Vấn đề:** `EXP_DOCUMENT.ORIGINAL_AMOUNT NUMBER(18) NOT NULL` nhưng YAML cho phép `null` (giao dịch VND thuần không có nguyên tệ).

**Quyết định:** Đổi DB sang NULL

**Tác động code:**
- **DDL thay đổi:** `ALTER TABLE EXP_DOCUMENT MODIFY ORIGINAL_AMOUNT NUMBER(18) NULL`
- Entity `ExpDocument`: field `originalAmount` kiểu `Long`, `@Column(nullable = true)`
- Mapper: khi DB trả `null` → API trả `null`; khi client gửi `null` → lưu `NULL` vào DB
- Không cần convention = 0

---

### DEC-03: APPROVAL_LOG.REASON NOT NULL vs optional approve — CRITICAL

**Vấn đề:** `EXP_APPROVAL_LOG.REASON NVARCHAR2(2000) NOT NULL` nhưng YAML `ApproveRequest.reason` không có `required`.

**Quyết định:** Bắt buộc reason cả khi approve — cập nhật YAML spec

**Tác động code:**
- **YAML thay đổi:** Thêm `required: [reason]` vào `ApproveRequest` schema. `reason` có `minLength: 1` (hoặc theo BA quyết định giới hạn cụ thể)
- Frontend phải hiện input "Ghi chú phê duyệt" là bắt buộc khi Checker/Approver approve
- **Không cần ALTER DDL** — DB giữ NOT NULL là đúng
- Validation: Service throw `BusinessException(VDBAS-VAL-0002)` nếu reason blank

---

## DECISION_NEEDED

---

### DEC-04: EXP_DOSSIER_DRAFT — auto-save — DECISION_NEEDED

**Vấn đề:** DB có `EXP_DOSSIER_DRAFT` (DOSSIER_ID + CONTENT CLOB) nhưng YAML không có endpoint tương ứng.

**Quyết định:** Dùng để lưu tạm (auto-save trước khi user nhấn "Lưu nháp")

**Tác động code:**
- **YAML thay đổi:** Thêm endpoint `PUT /exp/capex/dossiers/drafts/{draftId}` với request body là partial JSON (bất kỳ field nào user đã nhập)
- Hoặc nếu draft chưa có ID: `POST /exp/capex/dossiers/drafts/autosave` trả về `draftId`
- Sinh entity `ExpDossierDraft.java` trong `domain/.../domain/dossier/`
- Sinh service `DossierDraftService.java` trong `application/.../application/dossier/service/`
- Frontend gọi mỗi N giây (debounce) hoặc khi field thay đổi

---

### DEC-05: EXP_DOCUMENT_ATTACHMENT — ngoài scope MVP — DECISION_NEEDED

**Vấn đề:** DB có `EXP_DOCUMENT_ATTACHMENT` (attachment của chứng từ) nhưng YAML không có endpoint.

**Quyết định:** Không thuộc scope MVP — không sinh code

**Tác động code:**
- **Không tạo** entity, repository, service, controller cho `EXP_DOCUMENT_ATTACHMENT`
- Ghi chú `// TODO MVP+1: EXP_DOCUMENT_ATTACHMENT` trong `ExpDocument.java`
- Bảng DB vẫn tồn tại trong DDL nhưng application không tương tác

---

### DEC-06: WORKFLOW_CODE hardcode — DECISION_NEEDED

**Vấn đề:** `EXP_DOSSIER.WORKFLOW_CODE NOT NULL` nhưng YAML create request không có field này.

**Quyết định:** Hardcode một code duy nhất cho MVP

**Tác động code:**
- Thêm constant vào `CacheConstants.java` (đã có trong `common/`):
  ```java
  public static final String CAPEX_WORKFLOW_CODE = "CAPEX_STANDARD";
  ```
- `DossierServiceImpl.createDossier()`: set `entity.setWorkflowCode(CacheConstants.CAPEX_WORKFLOW_CODE)`
- Seed data: đảm bảo `EXP_WORKFLOW` có bản ghi `WORKFLOW_CODE = 'CAPEX_STANDARD'`

---

### DEC-07: actionUserName từ JWT — DECISION_NEEDED

**Vấn đề:** `ApprovalLogEntry.actionUserName` (họ tên) không có trong DB, chỉ có `ACTION_USER` (username).

**Quyết định:** Lấy từ JWT claims khi tạo bản ghi, lưu thẳng vào cột mới

**Tác động code:**
- **DDL thay đổi:** `ALTER TABLE EXP_APPROVAL_LOG ADD ACTION_USER_NAME NVARCHAR2(500) NULL`
- Entity `ExpApprovalLog`: thêm field `actionUserName` kiểu `String`
- Tương tự với `EXP_AUDIT_LOG`: JWT phải chứa claim `displayName` hoặc `fullName`
- `DossierWorkflowService`: khi ghi approval log, set `actionUserName = jwtClaims.getDisplayName()`
- **Yêu cầu JWT claim:** Xác nhận với team Auth rằng token chứa claim `displayName`

---

## IMPLEMENTATION_NOTE

---

### NOTE-01: seqNo của Document — tính toán runtime

**Vấn đề:** `DocumentSummary.seqNo` không có cột trong `EXP_DOCUMENT`.

**Xử lý:** Tính bằng `ROW_NUMBER() OVER (PARTITION BY DOSSIER_ID ORDER BY CREATED_DATE ASC)` trong JPQL native query. Field `seqNo` là `@Transient` trong entity hoặc là projection-only trong DTO query.

---

### NOTE-02: hasSpecific trong LOV project — subquery

**Vấn đề:** `ProjectLovItem.hasSpecific` không có cột trong `EXP_PROJECT`.

**Xử lý:** Thêm `@Formula("(CASE WHEN EXISTS (SELECT 1 FROM EXP_PROJECT_SPECIFIC s WHERE s.PROJECT_CODE = PROJECT_CODE AND s.STATUS = 1) THEN 1 ELSE 0 END)")` trong entity, hoặc dùng native query projection.

---

### NOTE-03: EXP_DIGITAL_SIGNED quan hệ 1-1 với APPROVAL_LOG

**Vấn đề:** `EXP_DIGITAL_SIGNED.ID` là FK tới `EXP_APPROVAL_LOG.ID` — nghĩa là ID hai bảng **bằng nhau** (không phải cột riêng).

**Xử lý:** Khi insert `EXP_DIGITAL_SIGNED`, dùng cùng UUID với `EXP_APPROVAL_LOG` vừa tạo. JPA: `@OneToOne @MapsId` trên `ExpDigitalSigned`. Field `ApprovalLogEntry.digitalSigned` (boolean) → check EXISTS khi query.

---

### NOTE-04: EXP_DOSSIER_SLA — dùng nội bộ cho scheduler

**Vấn đề:** YAML chỉ expose `sla` (field đơn trên `EXP_DOSSIER`), không expose `EXP_DOSSIER_SLA` chi tiết.

**Xử lý:** `EXP_DOSSIER_SLA` là internal — scheduler/notification job đọc. Service sau khi submit/approve insert vào bảng này. Không cần endpoint, không cần expose DTO.

---

### NOTE-05: EXP_AUDIT_LOG — append-only, không dùng AbstractAuditing

**Vấn đề:** `EXP_AUDIT_LOG` không có `CREATED_BY/UPDATED_BY/CREATED_DATE/UPDATED_DATE` — khác mọi bảng khác.

**Xử lý:** Entity `ExpAuditLog` **không extend `AbstractAuditing`**. Insert-only, dùng `@PrePersist` set `actionTimestamp = LocalDateTime.now()`. Không có update operation.

---

# Column → Entity Mapping

## EXP_DOSSIER → `ExpDossier.java`

**Module:** `domain/src/main/java/com/fis/vdbas/exp/domain/dossier/`

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Ghi chú |
|-----------|---------|----------|------------|-----------|----------------|---------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="ID", columnDefinition="RAW(16)")` | PK |
| TREASURY_CODE | VARCHAR2(100) | NOT NULL | treasuryCode | String | `@Column(name="TREASURY_CODE", length=100)` | LOV_CODE, từ JWT |
| TREASURY_NAME | NVARCHAR2(500) | NOT NULL | treasuryName | String | `@Column(name="TREASURY_NAME", length=500)` | LOV_DENORM |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column(name="DOSSIER_CODE", length=100, updatable=false)` | AUTO_FILL |
| VERSION | VARCHAR2(100) | NOT NULL | version | Integer | `@Convert(converter=VersionConverter.class) @Column(name="VERSION")` | DEC-01: dùng converter |
| SEND_DATE | DATE | NOT NULL | sendDate | LocalDate | `@Column(name="SEND_DATE")` | USER_INPUT |
| PROJECT_CODE | VARCHAR2(100) | NOT NULL | projectCode | String | `@Column(name="PROJECT_CODE", length=100)` | LOV_CODE |
| PROJECT_NAME | NVARCHAR2(500) | NOT NULL | projectName | String | `@Column(name="PROJECT_NAME", length=500)` | LOV_DENORM |
| PROJECT_SPECIFIC_CODE | VARCHAR2(100) | NULL | projectSpecificCode | String | `@Column(name="PROJECT_SPECIFIC_CODE", length=100)` | LOV_CODE nullable |
| PROJECT_SPECIFIC_NAME | NVARCHAR2(500) | NULL | projectSpecificName | String | `@Column(name="PROJECT_SPECIFIC_NAME", length=500)` | LOV_DENORM nullable |
| INVESTOR_CODE | VARCHAR2(100) | NOT NULL | investorCode | String | `@Column(name="INVESTOR_CODE", length=100)` | LOV_CODE |
| INVESTOR_NAME | NVARCHAR2(500) | NOT NULL | investorName | String | `@Column(name="INVESTOR_NAME", length=500)` | LOV_DENORM |
| PROJECT_MANAGEMENT_CODE | VARCHAR2(100) | NULL | projectManagementCode | String | `@Column(name="PROJECT_MANAGEMENT_CODE", length=100)` | LOV_CODE nullable |
| PROJECT_MANAGEMENT_NAME | NVARCHAR2(500) | NULL | projectManagementName | String | `@Column(name="PROJECT_MANAGEMENT_NAME", length=500)` | LOV_DENORM nullable |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column(name="STATUS")` | BACKEND_MANAGED: 1=active, 0=deleted |
| F_STATUS | VARCHAR2(100) | NOT NULL | fStatus | String | `@Convert(converter=DossierStatusConverter.class) @Column(name="F_STATUS")` | BACKEND_MANAGED |
| WORKFLOW_CODE | VARCHAR2(100) | NOT NULL | workflowCode | String | `@Column(name="WORKFLOW_CODE", length=100)` | DEC-06: set = CAPEX_STANDARD |
| DATA_SOURCE_CODE | VARCHAR2(100) | NOT NULL | dataSourceCode | String | `@Column(name="DATA_SOURCE_CODE", length=100)` | USER_INPUT |
| ASSIGN_USER | VARCHAR2(100) | NOT NULL | assignUser | String | `@Column(name="ASSIGN_USER", length=100)` | BACKEND_MANAGED |
| SLA | DATE | NOT NULL | sla | LocalDateTime | `@Column(name="SLA")` | BACKEND_MANAGED |
| HASH_INFO | VARCHAR2(2000) | NULL | hashInfo | String | `@Column(name="HASH_INFO", length=2000)` | BACKEND_MANAGED, set khi submit |
| COMPLETED_DATE | DATE | NULL | completedDate | LocalDate | `@Column(name="COMPLETED_DATE")` | BACKEND_MANAGED nullable |
| CREATED_BY | VARCHAR2(100) | NOT NULL | createdBy | String | từ `AbstractAuditing` | AUTO_FILL |
| CREATED_DATE | DATE | NOT NULL | createdDate | LocalDateTime | từ `AbstractAuditing` | AUTO_FILL |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | updatedBy | String | từ `AbstractAuditing` | BACKEND_MANAGED |
| UPDATED_DATE | DATE | NOT NULL | updatedDate | LocalDateTime | từ `AbstractAuditing` | BACKEND_MANAGED |

**Chú ý implement:**
- `version`: dùng `VersionConverter`, tự check trong service (không dùng `@Version`)
- `fStatus`: dùng `DossierStatusConverter` map enum `DossierStatus` ↔ String
- `workflowCode`: set từ `CacheConstants.CAPEX_WORKFLOW_CODE` trong `DossierServiceImpl`
- Không dùng `@ManyToOne` FK — project denormalize tên vào chính bảng

---

## EXP_DOCUMENT → `ExpDocument.java`

**Module:** `domain/src/main/java/com/fis/vdbas/exp/domain/dossier/`

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Ghi chú |
|-----------|---------|----------|------------|-----------|----------------|---------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="ID", columnDefinition="RAW(16)")` | PK |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column(name="DOSSIER_ID", columnDefinition="RAW(16)")` | FK |
| DOCUMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | documentTypeCode | String | `@Column(name="DOCUMENT_TYPE_CODE", length=100)` | LOV_CODE |
| DOCUMENT_NAME | NVARCHAR2(500) | NOT NULL | documentName | String | `@Column(name="DOCUMENT_NAME", length=500)` | USER_INPUT |
| DOCUMENT_NO | VARCHAR2(200) | NOT NULL | documentNo | String | `@Column(name="DOCUMENT_NO", length=200)` | USER_INPUT |
| DOCUMENT_DATE | DATE | NOT NULL | documentDate | LocalDate | `@Column(name="DOCUMENT_DATE")` | USER_INPUT |
| ACCOUNTING_DATE | DATE | NOT NULL | accountingDate | LocalDate | `@Column(name="ACCOUNTING_DATE")` | USER_INPUT |
| ORIGINAL_AMOUNT | NUMBER(18) | **NULL** | originalAmount | Long | `@Column(name="ORIGINAL_AMOUNT", nullable=true)` | DEC-02: đã đổi sang NULL |
| BASE_AMOUNT | NUMBER(18) | NOT NULL | baseAmount | Long | `@Column(name="BASE_AMOUNT")` | USER_INPUT |
| STATUS | NUMBER(1) | NOT NULL | status | Integer | `@Column(name="STATUS")` | BACKEND_MANAGED |
| CREATED_BY | VARCHAR2(100) | NOT NULL | createdBy | String | từ `AbstractAuditing` | AUTO_FILL |
| CREATED_DATE | DATE | NOT NULL | createdDate | LocalDateTime | từ `AbstractAuditing` | AUTO_FILL |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | updatedBy | String | từ `AbstractAuditing` | BACKEND_MANAGED |
| UPDATED_DATE | DATE | NOT NULL | updatedDate | LocalDateTime | từ `AbstractAuditing` | BACKEND_MANAGED |

**Chú ý implement:**
- `seqNo` là `@Transient int seqNo` — set từ query `ROW_NUMBER()` (NOTE-01)
- `totalBaseAmount` tính bằng `SUM(BASE_AMOUNT)` trong service — không có cột DB

---

## EXP_DOSSIER_ATTACHMENT → `ExpDossierAttachment.java`

**Module:** `domain/src/main/java/com/fis/vdbas/exp/domain/dossier/`

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Ghi chú |
|-----------|---------|----------|------------|-----------|----------------|---------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="ID", columnDefinition="RAW(16)")` | PK |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column(name="DOSSIER_ID", columnDefinition="RAW(16)")` | FK |
| ATTACHMENT_TYPE_CODE | VARCHAR2(100) | NOT NULL | attachmentTypeCode | String | `@Column(name="ATTACHMENT_TYPE_CODE", length=100)` | LOV_CODE |
| FILE_NAME | VARCHAR2(200) | NOT NULL | fileName | String | `@Column(name="FILE_NAME", length=200)` | AUTO_FILL |
| FILE_TYPE | VARCHAR2(100) | NOT NULL | fileType | String | `@Column(name="FILE_TYPE", length=100)` | AUTO_FILL |
| FILE_SIZE | DECIMAL(18) | NOT NULL | fileSize | Long | `@Column(name="FILE_SIZE")` | AUTO_FILL |
| FILE_PATH | VARCHAR2(2000) | NOT NULL | filePath | String | `@Column(name="FILE_PATH", length=2000)` | INTERNAL_ONLY — không expose API |
| DESCRIPTION | NVARCHAR2(2000) | NULL | description | String | `@Column(name="DESCRIPTION", length=2000)` | USER_INPUT nullable |
| CREATED_BY | VARCHAR2(100) | NOT NULL | createdBy | String | từ `AbstractAuditing` | AUTO_FILL |
| CREATED_DATE | DATE | NOT NULL | createdDate | LocalDateTime | từ `AbstractAuditing` | AUTO_FILL |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | updatedBy | String | từ `AbstractAuditing` | BACKEND_MANAGED |
| UPDATED_DATE | DATE | NOT NULL | updatedDate | LocalDateTime | từ `AbstractAuditing` | BACKEND_MANAGED |

---

## EXP_APPROVAL_LOG → `ExpApprovalLog.java`

**Module:** `domain/src/main/java/com/fis/vdbas/exp/domain/dossier/`

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Ghi chú |
|-----------|---------|----------|------------|-----------|----------------|---------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="ID", columnDefinition="RAW(16)")` | PK |
| DOSSIER_ID | RAW(16) | NOT NULL | dossierId | UUID | `@Column(name="DOSSIER_ID", columnDefinition="RAW(16)")` | FK |
| ACTION_USER | VARCHAR2(100) | NOT NULL | actionUser | String | `@Column(name="ACTION_USER", length=100)` | AUTO_FILL từ JWT |
| **ACTION_USER_NAME** | **NVARCHAR2(500)** | **NULL** | actionUserName | String | `@Column(name="ACTION_USER_NAME", length=500)` | DEC-07: cột mới, thêm vào DDL |
| ACTION_ROLE | VARCHAR2(100) | NOT NULL | actionRole | String | `@Convert(converter=ActionRoleConverter.class) @Column(name="ACTION_ROLE")` | AUTO_FILL |
| ACTION_DATE | DATE | NOT NULL | actionDate | LocalDateTime | `@Column(name="ACTION_DATE")` | AUTO_FILL |
| REASON | NVARCHAR2(2000) | NOT NULL | reason | String | `@Column(name="REASON", length=2000)` | DEC-03: bắt buộc cả khi approve |
| STATE_CODE | VARCHAR2(100) | NOT NULL | stateCode | String | `@Column(name="STATE_CODE", length=100)` | AUTO_FILL |
| PARENT_ID | RAW(16) | NULL | parentId | UUID | `@Column(name="PARENT_ID", columnDefinition="RAW(16)")` | self-ref nullable |
| CREATED_BY | VARCHAR2(100) | NOT NULL | createdBy | String | từ `AbstractAuditing` | AUTO_FILL |
| CREATED_DATE | DATE | NOT NULL | createdDate | LocalDateTime | từ `AbstractAuditing` | AUTO_FILL |
| UPDATED_BY | VARCHAR2(100) | NOT NULL | updatedBy | String | từ `AbstractAuditing` | BACKEND_MANAGED |
| UPDATED_DATE | DATE | NOT NULL | updatedDate | LocalDateTime | từ `AbstractAuditing` | BACKEND_MANAGED |

**Chú ý implement:**
- `ACTION_USER_NAME` cần **ALTER DDL** trước khi chạy: `ALTER TABLE EXP_APPROVAL_LOG ADD ACTION_USER_NAME NVARCHAR2(500) NULL`
- `digitalSigned` boolean trong DTO → check `EXISTS (SELECT 1 FROM EXP_DIGITAL_SIGNED WHERE ID = ?)` khi query (NOTE-03)

---

## EXP_AUDIT_LOG → `ExpAuditLog.java`

**Module:** `domain/src/main/java/com/fis/vdbas/exp/domain/audit/`

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Ghi chú |
|-----------|---------|----------|------------|-----------|----------------|---------|
| ID | RAW(16) | NOT NULL | id | UUID | `@Id @Column(name="ID", columnDefinition="RAW(16)")` | PK |
| TABLE_NAME | VARCHAR2(100) | NOT NULL | tableName | String | `@Column(name="TABLE_NAME", length=100)` | AUTO_FILL |
| RECORD_ID | VARCHAR2(100) | NOT NULL | recordId | String | `@Column(name="RECORD_ID", length=100)` | AUTO_FILL |
| ACTION_TYPE | VARCHAR2(100) | NOT NULL | actionType | String | `@Column(name="ACTION_TYPE", length=100)` | AUTO_FILL |
| OLD_VALUE | CLOB | NULL | oldValue | String | `@Lob @Column(name="OLD_VALUE")` | nullable |
| NEW_VALUE | CLOB | NOT NULL | newValue | String | `@Lob @Column(name="NEW_VALUE")` | |
| USER_ID | VARCHAR2(100) | NOT NULL | userId | String | `@Column(name="USER_ID", length=100)` | AUTO_FILL từ JWT |
| ACTION_TIMESTAMP | TIMESTAMP | NOT NULL | actionTimestamp | LocalDateTime | `@Column(name="ACTION_TIMESTAMP")` | set bởi @PrePersist |
| IP_ADDRESS | VARCHAR2(100) | NOT NULL | ipAddress | String | `@Column(name="IP_ADDRESS", length=100)` | AUTO_FILL |

**Chú ý implement:**
- **Không extend `AbstractAuditing`** — bảng append-only (NOTE-05)
- `userDisplayName` trong DTO: lấy từ JWT claim tại thời điểm ghi log (tương tự DEC-07)

---

## LOV Entities — `domain/src/main/java/com/fis/vdbas/exp/domain/lov/`

| Bảng DB | Entity Java | PK Field | PK Type | Ghi chú |
|---------|-------------|----------|---------|---------|
| `COMMON_INVESTOR` | `CommonInvestor.java` | `INVESTOR_CODE` | String | |
| `COMMON_PROJECT_MANAGEMENT` | `CommonProjectManagement.java` | `PROJECT_MANAGEMENT_CODE` | String | |
| `COMMON_TREASURY` | `CommonTreasury.java` | `TREASURY_CODE` | String | |
| `COMMON_STATUS` | `CommonStatus.java` | `STATUS_CODE` | String | composite với SUB_SYSTEM |
| `EXP_DATA_SOURCE` | `ExpDataSource.java` | `DATA_SOURCE_CODE` | String | |
| `EXP_DOCUMENT_TYPE` | `ExpDocumentType.java` | `DOCUMENT_TYPE_CODE` | String | |
| `EXP_ATTACHMENT_TYPE` | `ExpAttachmentType.java` | `ATTACHMENT_TYPE_CODE` | String | |
| `EXP_PROJECT` | `ExpProject.java` | `PROJECT_CODE` | String | có `hasSpecific` @Formula |
| `EXP_PROJECT_SPECIFIC` | `ExpProjectSpecific.java` | `PROJECT_SPECIFIC_CODE` | String | |
| `EXP_PROJECT_TYPE` | `ExpProjectType.java` | `PROJECT_TYPE_CODE` | String | |
| `EXP_WORKFLOW` | `ExpWorkflow.java` | `WORKFLOW_CODE` | String | seed: CAPEX_STANDARD |

---

# File → Folder Mapping

**Base package:** `com.fis.vdbas.exp`

---

## Domain Module

### Entity + Repository: `domain/src/main/java/com/fis/vdbas/exp/domain/dossier/`

| File | Status | Ghi chú |
|------|--------|---------|
| `ExpDossier.java` | 🆕 Cần tạo | Map `EXP_DOSSIER` |
| `ExpDossierRepository.java` | 🆕 Cần tạo | `JpaRepository<ExpDossier, UUID>` |
| `ExpDocument.java` | 🆕 Cần tạo | Map `EXP_DOCUMENT` — ORIGINAL_AMOUNT nullable (DEC-02) |
| `ExpDocumentRepository.java` | 🆕 Cần tạo | |
| `ExpDossierAttachment.java` | 🆕 Cần tạo | Map `EXP_DOSSIER_ATTACHMENT` |
| `ExpDossierAttachmentRepository.java` | 🆕 Cần tạo | |
| `ExpApprovalLog.java` | 🆕 Cần tạo | Có cột `ACTION_USER_NAME` mới (DEC-07) |
| `ExpApprovalLogRepository.java` | 🆕 Cần tạo | |
| `ExpDigitalSigned.java` | 🆕 Cần tạo | `@OneToOne @MapsId` với `ExpApprovalLog` |
| `ExpDossierDraft.java` | 🆕 Cần tạo | DEC-04: auto-save |
| `ExpDossierDraftRepository.java` | 🆕 Cần tạo | |
| `ExpDossierSla.java` | 🆕 Cần tạo | Internal scheduler — không expose API |
| `ExpDossierSlaRepository.java` | 🆕 Cần tạo | |

### Entity + Repository: `domain/src/main/java/com/fis/vdbas/exp/domain/audit/`

| File | Status | Ghi chú |
|------|--------|---------|
| `ExpAuditLog.java` | 🆕 Cần tạo | Không extend AbstractAuditing (NOTE-05) |
| `ExpAuditLogRepository.java` | 🆕 Cần tạo | |

### LOV Entity + Repository: `domain/src/main/java/com/fis/vdbas/exp/domain/lov/`

| File | Status | Ghi chú |
|------|--------|---------|
| `ExpProject.java` | 🆕 Cần tạo | Có `@Formula` cho `hasSpecific` (NOTE-02) |
| `ExpProjectRepository.java` | 🆕 Cần tạo | |
| `ExpProjectSpecific.java` | 🆕 Cần tạo | |
| `ExpProjectSpecificRepository.java` | 🆕 Cần tạo | |
| `ExpProjectType.java` | 🆕 Cần tạo | |
| `ExpWorkflow.java` | 🆕 Cần tạo | Seed: CAPEX_STANDARD (DEC-06) |
| `ExpDocumentType.java` | 🆕 Cần tạo | |
| `ExpAttachmentType.java` | 🆕 Cần tạo | |
| `ExpDataSource.java` | 🆕 Cần tạo | |
| `CommonInvestor.java` | 🆕 Cần tạo | |
| `CommonProjectManagement.java` | 🆕 Cần tạo | |
| `CommonTreasury.java` | 🆕 Cần tạo | |
| `CommonStatus.java` | 🆕 Cần tạo | |

---

## Application Module

### DTO Request: `application/src/main/java/com/fis/vdbas/exp/application/dossier/dto/`

| File | Status | YAML Schema |
|------|--------|-------------|
| `DossierCreateRequest.java` | 🆕 Cần tạo | `DossierCreateRequest` |
| `DossierDraftRequest.java` | 🆕 Cần tạo | `DossierDraftRequest` |
| `DossierUpdateRequest.java` | 🆕 Cần tạo | `DossierUpdateRequest` |
| `DeleteDossierRequest.java` | 🆕 Cần tạo | `DeleteDossierRequest` |
| `AddDocumentRequest.java` | 🆕 Cần tạo | `AddDocumentRequest` |
| `UpdateDocumentRequest.java` | 🆕 Cần tạo | `UpdateDocumentRequest` |
| `SubmitRequest.java` | 🆕 Cần tạo | inline `{version}` trong submit endpoint |
| `ApproveRequest.java` | 🆕 Cần tạo | `ApproveRequest` — DEC-03: `reason` bắt buộc |
| `RejectRequest.java` | 🆕 Cần tạo | `RejectRequest` |

### DTO Response: `application/src/main/java/com/fis/vdbas/exp/application/dossier/dto/`

| File | Status | YAML Schema |
|------|--------|-------------|
| `DossierSummaryDto.java` | 🆕 Cần tạo | `DossierSummary` |
| `DossierDetailDto.java` | 🆕 Cần tạo | `DossierDetail` |
| `DossierListResponse.java` | 🆕 Cần tạo | `DossierListResponse` |
| `DossierCreateResponse.java` | 🆕 Cần tạo | `DossierCreateResponse` |
| `DossierUpdateResponse.java` | 🆕 Cần tạo | `DossierUpdateResponse` |
| `WorkflowActionResponse.java` | 🆕 Cần tạo | `WorkflowActionResponse` |
| `DocumentSummaryDto.java` | 🆕 Cần tạo | `DocumentSummary` — có `seqNo @Transient` |
| `DocumentDetailDto.java` | 🆕 Cần tạo | `DocumentDetail` |
| `DocumentListResponse.java` | 🆕 Cần tạo | `DocumentListResponse` |
| `AttachmentInfoDto.java` | 🆕 Cần tạo | `AttachmentInfo` |
| `ApprovalLogEntryDto.java` | 🆕 Cần tạo | `ApprovalLogEntry` — có `actionUserName` |
| `AuditLogEntryDto.java` | 🆕 Cần tạo | `AuditLogEntry` |

### DTO LOV: `application/src/main/java/com/fis/vdbas/exp/application/lov/dto/`

| File | Status | Ghi chú |
|------|--------|---------|
| `ProjectLovItem.java` | 🆕 Cần tạo | Có `hasSpecific` |
| `ProjectSpecificLovItem.java` | 🆕 Cần tạo | |
| `TreasuryLovItem.java` | 🆕 Cần tạo | |
| `InvestorLovItem.java` | 🆕 Cần tạo | |
| `ProjectManagementLovItem.java` | 🆕 Cần tạo | |
| `DataSourceItem.java` | 🆕 Cần tạo | |
| `DocumentTypeItem.java` | 🆕 Cần tạo | |
| `AttachmentTypeItem.java` | 🆕 Cần tạo | |

### Mapper: `application/src/main/java/com/fis/vdbas/exp/application/dossier/mapper/`

| File | Status | Ghi chú |
|------|--------|---------|
| `DossierMapper.java` | 🆕 Cần tạo | MapStruct: `ExpDossier` ↔ DTOs |
| `DocumentMapper.java` | 🆕 Cần tạo | |
| `AttachmentMapper.java` | 🆕 Cần tạo | |
| `ApprovalLogMapper.java` | 🆕 Cần tạo | |
| `LovMapper.java` | 🆕 Cần tạo | `application/lov/mapper/` |

### Service: `application/src/main/java/com/fis/vdbas/exp/application/dossier/service/`

| File | Status | Ghi chú |
|------|--------|---------|
| `DossierService.java` | 🆕 Cần tạo | Interface |
| `DossierServiceImpl.java` | 🆕 Cần tạo | Set `workflowCode = CAPEX_STANDARD` (DEC-06) |
| `DossierWorkflowService.java` | 🆕 Cần tạo | Submit/Approve/Reject, ghi `actionUserName` từ JWT (DEC-07) |
| `DossierDraftService.java` | 🆕 Cần tạo | DEC-04: auto-save logic |
| `DocumentService.java` | 🆕 Cần tạo | |
| `AttachmentService.java` | 🆕 Cần tạo | Upload/download/virus scan |
| `AuditLogService.java` | 🆕 Cần tạo | `application/audit/service/` |
| `LovService.java` | 🆕 Cần tạo | `application/lov/service/` |

---

## API Module — `api/src/main/java/com/fis/vdbas/exp/api/`

| File | Status | Ghi chú |
|------|--------|---------|
| `dossier/DossierController.java` | 🆕 Cần tạo | CRUD `/exp/capex/dossiers` |
| `dossier/DocumentController.java` | 🆕 Cần tạo | Sub-resource `/documents` |
| `dossier/AttachmentController.java` | 🆕 Cần tạo | Upload/download |
| `dossier/WorkflowController.java` | 🆕 Cần tạo | submit/approve/reject/copy |
| `dossier/DossierDraftController.java` | 🆕 Cần tạo | DEC-04: auto-save endpoint |
| `audit/AuditController.java` | 🆕 Cần tạo | approval-log + audit-log |
| `export/ExportController.java` | 🆕 Cần tạo | Export sync/async |
| `lov/LovController.java` | 🆕 Cần tạo | Tất cả `/lov/*` |

---

## Common Module — `common/src/main/java/com/fis/vdbas/exp/common/`

| File | Status | Ghi chú |
|------|--------|---------|
| `enums/DossierStatus.java` | 🆕 Cần tạo | DRAFT/SAVED/VALIDATED/SUBMITTED/APPROVED/REJECTED/COMPLETED/CANCELLED |
| `enums/ActionRole.java` | 🆕 Cần tạo | MAKER/CHECKER/APPROVER |
| `enums/AttachmentTypeCode.java` | 🆕 Cần tạo | |
| `enums/DataSourceCode.java` | 🆕 Cần tạo | |
| `converter/VersionConverter.java` | 🆕 Cần tạo | DEC-01: `AttributeConverter<Integer, String>` |
| `converter/DossierStatusConverter.java` | 🆕 Cần tạo | `AttributeConverter<DossierStatus, String>` |
| `CacheConstants.java` | ✅ Đã tồn tại | Thêm `CAPEX_WORKFLOW_CODE = "CAPEX_STANDARD"` (DEC-06) |
| `exception/BusinessException.java` | 🆕 Cần tạo | |
| `exception/OptimisticLockException.java` | 🆕 Cần tạo | VAL-15 |
| `exception/InvalidStateException.java` | 🆕 Cần tạo | VAL-13 |
| `exception/handler/GlobalExceptionHandler.java` | 🆕 Cần tạo | `@RestControllerAdvice` |
| `constant/ErrorCode.java` | 🆕 Cần tạo | VDBAS-EXP-*/VDBAS-VAL-*/VDBAS-AUT-* |

---

## DDL Changes cần thực hiện trước khi chạy app

```sql
-- DEC-02: ORIGINAL_AMOUNT nullable
ALTER TABLE EXP_DOCUMENT MODIFY ORIGINAL_AMOUNT NUMBER(18) NULL;

-- DEC-07: Thêm cột tên người dùng vào approval log
ALTER TABLE EXP_APPROVAL_LOG ADD ACTION_USER_NAME NVARCHAR2(500) NULL;

-- Seed data cho WORKFLOW
INSERT INTO EXP_WORKFLOW (WORKFLOW_CODE, WORKFLOW_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE)
VALUES ('CAPEX_STANDARD', N'Luồng phê duyệt CAPEX chuẩn', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE);
```

---

## Bước tiếp theo

1. Chạy DDL changes (3 câu ALTER/INSERT ở trên) trên môi trường dev
2. Cập nhật `capex-dossier-api.yaml`: thêm `required: [reason]` vào `ApproveRequest` (DEC-03)
3. Tạo entity theo thứ tự: LOV entities → `ExpDossier` → child tables (`ExpDocument`, `ExpApprovalLog`...)
4. Tạo `VersionConverter` trước khi tạo `ExpDossier` entity
5. Xác nhận với team Auth rằng JWT token có claim `displayName` (cần cho DEC-07)
