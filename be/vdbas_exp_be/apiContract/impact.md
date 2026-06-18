# Impact Analysis: capex-dossier-api.yaml ↔ DOSSIER.sql

**Generated:** 2026-06-17  
**Updated:** 2026-06-18 (đồng bộ SQL mới — VERSION NUMBER, bỏ INVESTOR/PROJECT_MANAGEMENT, thêm ORGANIZATION/DOSSIER_TYPE)  
**API Version:** 0.2.0
**Base package:** `com.fis.vdbas.exp`

## Tóm tắt

| Hạng mục | Số lượng |
|----------|----------|
| Bảng DB phân tích | 20 |
| YAML Schemas phân tích | 32 |
| Columns mapping khớp | ~85 |
| **Nhóm chức năng In-Scope** | **9** |
| **Hạng mục Out-of-Scope** | **8** |
| CRITICAL gaps (đã giải quyết) | 2/2 |
| DECISION_NEEDED gaps (đã giải quyết) | 4/4 |
| IMPLEMENTATION_NOTE | 5 |
| Files cần tạo | ~55 |

## Checklist trước khi sinh code

- [x] Đã review Scope / Out-of-Scope
- [x] Tất cả CRITICAL gaps đã có quyết định
- [x] Tất cả DECISION_NEEDED gaps đã có quyết định
- [x] Base package xác nhận: `com.fis.vdbas.exp`
- [x] Cấu trúc multi-module xác nhận: `domain/` · `application/` · `api/` · `common/`

---

# Phạm vi triển khai (Scope)

> Phân định với **YAML + DDL hiện có**: phần nào đủ thông tin để **sinh code chạy được** (In-Scope),
> phần nào **không suy ra được** từ contract + DDL nên phải dev hiện thực thủ công hoặc xác nhận đã có sẵn
> từ thư viện/hệ thống dùng chung (Out-of-Scope). Giả định: **DB đã tồn tại sẵn** (chỉ cần 3 câu ALTER/INSERT ở mục DDL Changes).

## ✅ In-Scope — Mapping bao trùm (sinh code chạy được với DB sẵn có)

| Nhóm chức năng | Endpoint / Entity liên quan | Cơ sở mapping | Mức độ sẵn sàng |
|----------------|------------------------------|----------------|-----------------|
| CRUD hồ sơ | `GET/POST/PUT/GET{id}/DELETE /exp/capex/dossiers` ↔ `EXP_DOSSIER` | Schema + bảng map đầy đủ | ✅ Sinh code được |
| Lưu nháp | `POST /exp/capex/dossiers/drafts` ↔ `EXP_DOSSIER_DRAFT` | DEC-04 đã chốt | ✅ Sinh code được |
| Sao chép hồ sơ | `POST /exp/capex/dossiers/{id}/copy` ↔ `EXP_DOSSIER` (insert) | Re-use mapping `EXP_DOSSIER` | ✅ Sinh code được |
| Chứng từ trong hồ sơ | `GET/POST/PUT/DELETE /.../documents` ↔ `EXP_DOCUMENT` | Schema + bảng map đầy đủ (ORIGINAL_AMOUNT nullable DEC-02) | ✅ Sinh code được |
| Đính kèm — metadata | `GET /.../attachments`, `DELETE /.../attachments/{id}` ↔ `EXP_DOSSIER_ATTACHMENT` | Query/xoá metadata thuần | ✅ Sinh code được (xem out-scope cho phần file vật lý) |
| Workflow chuyển trạng thái | `POST /.../submit·approve·reject` → update `F_STATUS` + ghi `EXP_APPROVAL_LOG` | State + log có bảng (ACTION_USER_NAME DEC-07) | ✅ Sinh code được (xem out-scope: notify, hash, SoD theo JWT) |
| Audit & Approval log (xem) | `GET /.../approval-log`, `GET /.../audit-log` ↔ `EXP_APPROVAL_LOG`, `EXP_AUDIT_LOG` | Query + phân trang | ✅ Sinh code được |
| LOV tra cứu | `GET /lov/*` ↔ `COMMON_*`, `EXP_PROJECT*`, `EXP_*_TYPE`, `EXP_DATA_SOURCE`, `EXP_WORKFLOW` | Map 11 bảng LOV | ✅ Sinh code được |
| Lọc / sắp xếp / phân trang danh sách | `GET /exp/capex/dossiers` (search, fStatus, dateField, sortBy…) | Tất cả tiêu chí dựa trên cột có thật | ✅ Sinh code được |

## ⚠️ Out-of-Scope — Ngoài phạm vi mapping (cần bổ sung thủ công)

| Hạng mục | Endpoint / Field liên quan | Vì sao ngoài scope | Hướng xử lý đề xuất |
|----------|----------------------------|--------------------|---------------------|
| Trích xuất claim JWT | **Toàn bộ endpoint** — scope theo `TREASURY_CODE`, `createdBy`, role SoD (BIZ-001), `actionUserName`/`displayName` (DEC-07) | YAML chỉ khai báo `securitySchemes: bearerAuth`, không có cách lấy claim; project chưa có `SecurityFilterChain`/resource-server | Dựng `SecurityConfig` + filter giải mã JWT, hoặc xác nhận lấy từ thư viện auth dùng chung |
| Lưu & quét file đính kèm | `POST /.../attachments` (lưu file, virus scan, kiểm tra MIME/magic-byte, VAL-09/VAL-20) | DB chỉ chứa metadata + `FILE_PATH`; nội dung nhị phân không có trong schema | Hiện thực `FileStorageService` + tích hợp virus scan |
| Tải file đính kèm (streaming) | `GET /.../attachments/{id}` (đọc binary từ storage, audit BIZ-007) | Đọc/stream file vật lý không suy ra từ YAML+SQL | Hiện thực đọc file từ `FILE_PATH` + set Content-Disposition |
| Notification | `submit` / `approve` / `reject` (notify Checker/Approver/Maker) | Không có bảng/schema mô tả kênh thông báo | Tích hợp service notification/email/queue |
| Kết xuất Excel/PDF/CSV | `GET /exp/capex/dossiers/export` (+ async `jobId`/`export-jobs`) | Cần thư viện + template; định dạng file không nằm trong schema | Chọn lib (Apache POI/JasperReports) + cơ chế async job |
| Giá trị backend tự sinh có thuật toán | `DOSSIER_CODE` (sequence), `HASH_INFO` (khi submit), `SLA` (scheduler), `EXP_DIGITAL_SIGNED` (ký số) | Là thuật toán/luồng nền, không phải mapping cột thuần | Hiện thực generator/scheduler riêng (NOTE-03, NOTE-04) |
| Quy tắc nghiệp vụ tham chiếu hệ thống ngoài | Kỳ kế toán mở (VAL-08), dành/kiểm tra dự toán (VAL-21) | Phụ thuộc bảng/hệ thống ngoài phạm vi DDL này | Xác nhận nguồn dữ liệu + tích hợp kiểm tra |
| Cấu hình hạ tầng | `SecurityConfig`, `FileStorageConfig` | Cấu hình môi trường, không sinh từ contract | Tự cấu hình theo môi trường dev/prod |

> **Ghi chú:** Out-of-scope = YAML + SQL không đủ thông tin để generate; dev cần hiện thực hoặc xác nhận đã có sẵn.
> Phần In-Scope đủ điều kiện sinh code biên dịch & chạy với DB hiện có.

---

# Quyết định kỹ thuật

## CRITICAL

---

### ~~DEC-01: VERSION type mismatch~~ — ĐÃ HẾT HIỆU LỰC

> **SQL mới:** `EXP_DOSSIER.VERSION NUMBER(3) NOT NULL` — JPA `@Version Integer` hoạt động trực tiếp.  
> `VersionConverter.java` **đã xóa**. Entity dùng `@Version @Column(name="VERSION") private Integer version`.

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
| DOSSIER_TYPE_CODE | VARCHAR2(100) | NOT NULL | dossierTypeCode | String | `@Column(name="DOSSIER_TYPE_CODE", length=100)` | USER_INPUT: CAPEX/OPEX |
| DOSSIER_CODE | VARCHAR2(100) | NOT NULL | dossierCode | String | `@Column(name="DOSSIER_CODE", length=100, updatable=false)` | AUTO_FILL |
| VERSION | NUMBER(3) | NOT NULL | version | Integer | `@Version @Column(name="VERSION")` | JPA optimistic lock trực tiếp |
| SEND_DATE | DATE | NOT NULL | sendDate | LocalDate | `@Column(name="SEND_DATE")` | USER_INPUT |
| PROJECT_CODE | VARCHAR2(100) | NULL | projectCode | String | `@Column(name="PROJECT_CODE", length=100)` | LOV_CODE nullable (CAPEX=NOT NULL, OPEX=NULL per CHECK) |
| PROJECT_NAME | NVARCHAR2(500) | NULL | projectName | String | `@Column(name="PROJECT_NAME", length=500)` | LOV_DENORM nullable |
| PROJECT_SPECIFIC_CODE | VARCHAR2(100) | NULL | projectSpecificCode | String | `@Column(name="PROJECT_SPECIFIC_CODE", length=100)` | LOV_CODE nullable |
| PROJECT_SPECIFIC_NAME | NVARCHAR2(500) | NULL | projectSpecificName | String | `@Column(name="PROJECT_SPECIFIC_NAME", length=500)` | LOV_DENORM nullable |
| ORGANIZATION_CODE | VARCHAR2(100) | NOT NULL | organizationCode | String | `@Column(name="ORGANIZATION_CODE", length=100)` | LOV_CODE — Đơn vị QHNS |
| ORGANIZATION_NAME | NVARCHAR2(500) | NOT NULL | organizationName | String | `@Column(name="ORGANIZATION_NAME", length=500)` | LOV_DENORM |
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
- `version`: `@Version Integer` — JPA tự xử lý optimistic lock, service throw `OptimisticLockingFailureException` khi lệch
- `fStatus`: dùng `DossierStatusConverter` map enum `DossierStatus` ↔ String
- `workflowCode`: set từ `CacheConstants.CAPEX_WORKFLOW_CODE` trong `DossierServiceImpl`
- `projectCode` nullable — CHECK constraint DB đảm bảo CAPEX≠NULL/OPEX=NULL
- Không dùng `@ManyToOne` FK — LOV denormalize tên vào chính bảng

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
| `COMMON_ORGANIZATION` | `CommonOrganization.java` | `ORGANIZATION_CODE` | String | Thay thế INVESTOR + PROJECT_MANAGEMENT |
| `COMMON_TREASURY` | `CommonTreasury.java` | `TREASURY_CODE` | String | |
| `COMMON_STATUS` | `CommonStatus.java` | `STATUS_CODE` | String | composite với SUB_SYSTEM |
| `EXP_DATA_SOURCE` | `ExpDataSource.java` | `DATA_SOURCE_CODE` | String | |
| `EXP_DOCUMENT_TYPE` | `ExpDocumentType.java` | `DOCUMENT_TYPE_CODE` | String | |
| `EXP_ATTACHMENT_TYPE` | `ExpAttachmentType.java` | `ATTACHMENT_TYPE_CODE` | String | |
| `EXP_DOSSIER_TYPE` | `ExpDossierType.java` | `DOSSIER_TYPE_CODE` | String | CAPEX/OPEX |
| `EXP_PROJECT` | `ExpProject.java` | `PROJECT_CODE` | String | có `hasSpecific` @Formula; cột `PROJECT_TYPE_CODE`, `ORGANIZATION_CODE` |
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
| `CommonOrganization.java` | 🆕 Cần tạo | Thay thế CommonInvestor + CommonProjectManagement |
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
| `ProjectLovItem.java` | 🆕 Cần tạo | Có `hasSpecific`; fields: `projectTypeCode`, `organizationCode` |
| `ProjectSpecificLovItem.java` | 🆕 Cần tạo | |
| `TreasuryLovItem.java` | 🆕 Cần tạo | |
| `OrganizationLovItem.java` | 🆕 Cần tạo | Thay thế InvestorLovItem + ProjectManagementLovItem |
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

> **Không cần ALTER cho VERSION** — SQL mới đã là `NUMBER(3)`, JPA `@Version` dùng trực tiếp.

---

## Bước tiếp theo

1. Chạy DDL changes (3 câu ALTER/INSERT ở trên) trên môi trường dev
2. Cập nhật `capex-dossier-api.yaml`: thêm `required: [reason]` vào `ApproveRequest` (DEC-03)
3. Tạo entity theo thứ tự: LOV entities → `ExpDossier` → child tables (`ExpDocument`, `ExpApprovalLog`...)
4. Tạo `VersionConverter` trước khi tạo `ExpDossier` entity
5. Xác nhận với team Auth rằng JWT token có claim `displayName` (cần cho DEC-07)
