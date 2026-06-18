---
name: gen-impact
description: Analyze the gap between an OpenAPI YAML contract and a SQL DDL schema, then generate an impact.md (scope/out-of-scope, gap Q&A, Column→Entity mapping, File→Folder mapping for a Java/Spring BE). Use when the user wants an impact analysis of a contract vs DB, or invokes /gen-impact with a yaml_file, sql_file, and optional output_file.
---

# gen-impact

Phân tích gap giữa OpenAPI YAML và SQL DDL, sinh file `impact.md` gồm:
1. **Scope & Out-of-Scope** — phần nào mapping bao trùm (sinh code được), phần nào nằm ngoài (cần bổ sung thủ công)
2. Q&A từng điểm mapping chưa chuẩn (type mismatch, nullable conflict, missing column/field)
3. Bảng mapping: DB Column → Entity field (tên, Java type, annotation)
4. Bảng mapping: File cần tạo → Folder đích trong project BE

## Usage

```
/gen-impact <yaml_file> <sql_file> [output_file]
```

**Arguments** (space-separated, passed as the skill input):

- `yaml_file`   — đường dẫn file OpenAPI YAML (đã tồn tại)
- `sql_file`    — đường dẫn file SQL DDL (Oracle hoặc standard)
- `output_file` — (tuỳ chọn) đường dẫn file output; mặc định `impact.md` cùng thư mục với sql_file

Nếu thiếu argument, hỏi người dùng đường dẫn `yaml_file` và `sql_file` trước khi tiếp tục.

---

## Instructions

Parse arguments từ skill input.

Thực hiện **đúng thứ tự** các bước sau. KHÔNG bỏ qua hoặc gộp bước.

---

### STEP 1 — Đọc cả hai file

Đọc toàn bộ YAML file và SQL file trước khi làm bất kỳ bước nào.

Xác định:
- Danh sách tất cả **bảng** trong SQL (tên bảng, các cột, kiểu dữ liệu, nullable, PK/FK/UK)
- Danh sách tất cả **schemas** trong YAML components/schemas (tên schema, các field, kiểu, required, nullable)
- Danh sách tất cả **paths** trong YAML (method, path, request body schema ref, response schema ref)

---

### STEP 2 — Build Column ↔ Field mapping thô

Với **từng bảng** trong SQL, khớp từng column sang YAML field tương ứng:

**Quy tắc tìm field tương ứng (theo thứ tự ưu tiên):**
1. Chuyển tên column từ `SNAKE_UPPER_CASE` sang `camelCase` → tìm field đúng tên trong YAML schema
2. Nếu không tìm thấy, tìm theo alias thường gặp:
   - `F_STATUS` → `fStatus`
   - `RAW(16)` PK → `id` (uuid)
   - `*_CODE` + `*_NAME` cặp LOV → `*Code` + `*Name`
3. Nếu vẫn không tìm thấy → đánh dấu `YAML_MISSING`

Ngược lại, với **từng field trong YAML schemas**, kiểm tra có column tương ứng trong SQL không:
- Không có → đánh dấu `DB_MISSING` (computed field hoặc join field)

**Kết quả bước này** là bảng trung gian (nội bộ, không in ra):

```
TABLE_NAME | COLUMN | DB_TYPE | NULLABLE | YAML_SCHEMA | YAML_FIELD | YAML_TYPE | STATUS
```

STATUS values: `MATCHED` | `TYPE_MISMATCH` | `NULLABLE_MISMATCH` | `YAML_MISSING` | `DB_MISSING`

---

### STEP 3 — Phân loại gap theo mức độ nghiêm trọng

Với mỗi row có STATUS ≠ MATCHED, phân loại:

**CRITICAL** — sẽ gây bug runtime nếu không xử lý:
- Type mismatch giữa DB và YAML (ví dụ VARCHAR vs integer)
- NOT NULL trong DB nhưng YAML cho phép null / không required
- DB column NOT NULL không có giá trị default và không xuất hiện trong API request

**DECISION_NEEDED** — cần đội đưa ra quyết định kỹ thuật trước khi code:
- DB có bảng/cột mà YAML không có endpoint tương ứng
- YAML có field nhưng DB không có column (cần xác nhận: computed? join? thiếu cột?)
- YAML schema dùng enum nhưng DB dùng FK tới bảng danh mục (cần biết data trong bảng danh mục)

**IMPLEMENTATION_NOTE** — cần ghi chú trong code nhưng không block:
- Field tính toán runtime (SEQ_NO, totalBaseAmount, documentCount)
- Field cần JOIN bảng khác (displayName, userName)
- Backend auto-assign (WORKFLOW_CODE, ASSIGN_USER)

---

### STEP 4 — Phân tích Scope & Out-of-Scope

Mục tiêu: phân định rõ với **YAML + SQL hiện có**, phần nào đủ thông tin để **sinh code chạy được** (In-Scope), phần nào **không suy ra được** từ contract + DDL nên phải dev hiện thực thủ công hoặc xác nhận có sẵn từ thư viện/hệ thống dùng chung (Out-of-Scope).

Duyệt **từng path/endpoint** trong YAML và **từng bảng** trong SQL, gán nhãn theo tiêu chí dưới.

**Tiêu chí IN-SCOPE** (mapping bao trùm — sinh code tự động được):
- Endpoint có đủ request/response schema **và** map được sang bảng DB tương ứng (CRUD/query thuần).
- Entity ↔ table có mapping cột rõ ràng (đã có ở STEP 5).
- Validation khai báo được trực tiếp từ schema: `required`, `maxLength`, `minLength`, `enum`, `format`, `minimum/maximum`.
- Chuyển trạng thái workflow thuần = update cột trạng thái + ghi bản ghi log (bảng đã tồn tại).
- Phân trang/sắp xếp/lọc dựa trên cột có thật trong bảng.

**Tiêu chí OUT-OF-SCOPE** (YAML + SQL không cung cấp đủ thông tin để sinh code):
- **Bảo mật / danh tính:** trích xuất claim từ JWT/token (userId, role, tenant/đơn vị scope, displayName), phân quyền theo scope, cấu hình `SecurityFilterChain`/resource-server.
- **Lưu trữ nhị phân:** lưu file vật lý, quét virus, kiểm tra MIME/magic-byte (DB chỉ chứa metadata + đường dẫn).
- **Tích hợp ngoài:** notification/email/SMS, message queue, gọi hệ thống khác.
- **Kết xuất:** Excel/PDF/CSV (cần thư viện + template, không nằm trong schema).
- **Giá trị backend tự sinh có thuật toán:** sinh mã nghiệp vụ theo sequence (vd `*_CODE`), hash/checksum, scheduler/SLA, chữ ký số.
- **Quy tắc nghiệp vụ tham chiếu hệ thống/bảng ngoài phạm vi:** kỳ kế toán mở, dự toán/hạn mức, quy tắc SoD phức tạp — chỉ được nhắc trong `description` chứ không định nghĩa được từ schema.
- **Cấu hình hạ tầng:** kết nối DB, JPA, file storage, i18n message.

**Quy tắc gán nhãn khi mơ hồ:**
- Nếu một endpoint vừa có phần CRUD (in-scope) vừa phụ thuộc tích hợp ngoài (vd upload file = metadata in-scope + lưu file out-of-scope) → liệt kê ở **cả hai** mục, ghi rõ ranh giới ("metadata: in-scope; lưu/scan file: out-of-scope").
- Out-of-scope **không** có nghĩa là không làm — nghĩa là không sinh tự động được từ YAML+SQL; phải có dev hiện thực hoặc xác nhận tồn tại sẵn.

**Kết quả bước này** là 2 bảng (sẽ in ngay sau phần Tóm tắt ở STEP 9):

```markdown
# Phạm vi triển khai (Scope)

## ✅ In-Scope — Mapping bao trùm (sinh code chạy được với DB sẵn có)

| Nhóm chức năng | Endpoint / Entity liên quan | Cơ sở mapping | Mức độ sẵn sàng |
|----------------|------------------------------|----------------|-----------------|
| CRUD hồ sơ | `POST/PUT/GET/DELETE /.../dossiers` ↔ `EXP_DOSSIER` | Schema + bảng map đầy đủ | ✅ Sinh code được |
| ... | ... | ... | ... |

## ⚠️ Out-of-Scope — Ngoài phạm vi mapping (cần bổ sung thủ công)

| Hạng mục | Endpoint / Field liên quan | Vì sao ngoài scope | Hướng xử lý đề xuất |
|----------|----------------------------|--------------------|---------------------|
| Trích xuất claim JWT | Toàn bộ endpoint (scope theo tenant, `createdBy`, SoD) | YAML chỉ khai báo `securitySchemes`, không có cách lấy claim | Dựng `SecurityConfig` / xác nhận thư viện auth dùng chung |
| Lưu & quét file | `POST /.../attachments` (lưu/scan file) | DB chỉ có metadata + path | Hiện thực `FileStorage` + virus scan |
| ... | ... | ... | ... |

> **Ghi chú:** Out-of-scope = YAML + SQL không đủ thông tin để generate; dev cần hiện thực hoặc xác nhận đã có sẵn từ thư viện/hệ thống dùng chung. Phần In-scope đủ điều kiện sinh code biên dịch & chạy với DB hiện có.
```

---

### STEP 5 — Sinh phần Q&A trong impact.md

Với **mỗi gap**, viết một Q&A block theo format:

```markdown
### GAP-{N}: {tên ngắn gọn}

**Bảng / Endpoint liên quan:** `{TABLE_NAME}` / `{path hoặc schema}`

**Vấn đề:**
{mô tả rõ ràng conflict/gap, bao gồm giá trị cụ thể từ DB và YAML}

**Mức độ:** `CRITICAL` | `DECISION_NEEDED` | `IMPLEMENTATION_NOTE`

**Câu hỏi:**
> {câu hỏi cụ thể cần team trả lời để unblock}

**Recommendation:**
{đề xuất kỹ thuật cụ thể với lý do — không được nói chung chung}

**Decision:** ☐ Chưa quyết định
```

Nhóm theo mức độ: CRITICAL trước, sau đó DECISION_NEEDED, cuối là IMPLEMENTATION_NOTE.

---

### STEP 6 — Sinh bảng Column → Entity Mapping

Với **từng bảng chính** (bảng chứa business entity, không phải danh mục/LOV), sinh bảng mapping:

```markdown
## Column → Entity Mapping: {TABLE_NAME} → {EntityClassName}

| DB Column | DB Type | Nullable | Java Field | Java Type | JPA Annotation | Notes |
|-----------|---------|----------|------------|-----------|----------------|-------|
| ID | RAW(16) | NOT NULL | id | UUID | @Id @Column(name="ID") | PK |
| VERSION | VARCHAR2(100) | NOT NULL | version | Integer | @Version @Column(name="VERSION") | ⚠️ DB là VARCHAR2, cần converter |
| ... | ... | ... | ... | ... | ... | ... |
```

**Quy tắc Java type mapping:**

| DB Type | Java Type | JPA note |
|---------|-----------|----------|
| `RAW(16)` PK | `UUID` | `@Column(columnDefinition="RAW(16)")` + `@Id` |
| `RAW(16)` FK | `UUID` | `@Column(columnDefinition="RAW(16)")` |
| `VARCHAR2(N)` / `NVARCHAR2(N)` | `String` | `@Column(length=N)` |
| `NUMBER(1)` boolean flag | `Integer` | `@Column` — expose qua getter trả boolean |
| `NUMBER(18)` money | `Long` | `@Column` |
| `NUMBER(p,s)` | `BigDecimal` | `@Column(precision=p, scale=s)` |
| `DATE` chỉ ngày | `LocalDate` | `@Column` |
| `DATE` có giờ | `LocalDateTime` | `@Column` |
| `TIMESTAMP` | `LocalDateTime` | `@Column` |
| `CLOB` | `String` | `@Lob @Column` |
| `DECIMAL(18)` | `BigDecimal` | `@Column` |

**Quy tắc đặt tên Java field:**
- `SNAKE_UPPER_CASE` → `camelCase` (ví dụ: `PROJECT_CODE` → `projectCode`)
- Cột `F_STATUS` → field `fStatus`
- Cột `ID` → field `id`
- Cột `VERSION` → field `version` với `@Version` nếu là optimistic lock

Sau bảng, thêm:

```markdown
### Chú ý implement:
- {liệt kê các field cần xử lý đặc biệt: converter, computed property, v.v.}
```

---

### STEP 7 — Sinh bảng File → Folder Mapping

Xác định package gốc từ cấu trúc thư mục hiện tại (đọc thư mục project BE nếu có) hoặc dùng convention mặc định `com.vdbas.exp`.

Sinh bảng đầy đủ các file cần tạo:

```markdown
## File → Folder Mapping

**Base package:** `{com.vdbas.exp}` (điều chỉnh theo project thực tế)
**Base src path:** `src/main/java/{com/vdbas/exp}/`

### Entity Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `ExpDossier.java` | `entity/` | Map tới `EXP_DOSSIER` |
| `ExpDocument.java` | `entity/` | Map tới `EXP_DOCUMENT` |
| `ExpDossierAttachment.java` | `entity/` | Map tới `EXP_DOSSIER_ATTACHMENT` |
| ... | ... | ... |

### DTO Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `DossierCreateRequest.java` | `dto/request/` | Schema `DossierCreateRequest` trong YAML |
| `DossierDraftRequest.java` | `dto/request/` | |
| `DossierUpdateRequest.java` | `dto/request/` | |
| `DeleteDossierRequest.java` | `dto/request/` | |
| `AddDocumentRequest.java` | `dto/request/` | |
| `ApproveRequest.java` | `dto/request/workflow/` | |
| `RejectRequest.java` | `dto/request/workflow/` | |
| `DossierSummary.java` | `dto/response/` | Schema `DossierSummary` trong YAML |
| `DossierDetail.java` | `dto/response/` | |
| `DocumentSummary.java` | `dto/response/` | |
| `DocumentDetail.java` | `dto/response/` | |
| `AttachmentInfo.java` | `dto/response/` | |
| `ApprovalLogEntry.java` | `dto/response/audit/` | |
| `AuditLogEntry.java` | `dto/response/audit/` | |
| `DossierListResponse.java` | `dto/response/` | |
| `WorkflowActionResponse.java` | `dto/response/workflow/` | |
| ... (tất cả LOV response DTOs) | `dto/response/lov/` | |

### Repository Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `ExpDossierRepository.java` | `repository/` | Extends `JpaRepository<ExpDossier, UUID>` |
| `ExpDocumentRepository.java` | `repository/` | |
| ... | ... | ... |

### Service Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `DossierService.java` (interface) | `service/` | |
| `DossierServiceImpl.java` | `service/impl/` | |
| `DossierWorkflowService.java` | `service/` | Submit/Approve/Reject logic |
| `DocumentService.java` | `service/` | |
| `AttachmentService.java` | `service/` | File upload/download/virus scan |
| `AuditLogService.java` | `service/` | |
| `LovService.java` | `service/` | Tất cả LOV queries |

### Controller Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `DossierController.java` | `controller/` | CRUD + workflow endpoints |
| `DocumentController.java` | `controller/` | Sub-resource documents |
| `AttachmentController.java` | `controller/` | Upload/download |
| `AuditController.java` | `controller/` | Approval log + audit log |
| `ExportController.java` | `controller/` | Export endpoints |
| `LovController.java` | `controller/` | Tất cả /lov/* endpoints |

### Mapper Layer

| File | Folder | Ghi chú |
|------|--------|---------|
| `DossierMapper.java` | `mapper/` | MapStruct: Entity ↔ DTO |
| `DocumentMapper.java` | `mapper/` | |
| `AttachmentMapper.java` | `mapper/` | |
| `ApprovalLogMapper.java` | `mapper/` | |

### Enums & Constants

| File | Folder | Ghi chú |
|------|--------|---------|
| `DossierStatus.java` | `enums/` | Enum từ YAML `DossierStatus` schema |
| `ActionRole.java` | `enums/` | MAKER / CHECKER / APPROVER |
| `AttachmentTypeCode.java` | `enums/` | |
| `DataSourceCode.java` | `enums/` | |

### Exception & Error

| File | Folder | Ghi chú |
|------|--------|---------|
| `BusinessException.java` | `exception/` | Base business exception |
| `OptimisticLockException.java` | `exception/` | VAL-15 conflict |
| `InvalidStateException.java` | `exception/` | VAL-13 trạng thái không hợp lệ |
| `GlobalExceptionHandler.java` | `exception/handler/` | `@RestControllerAdvice` |
| `ErrorCode.java` | `exception/` | Constants: VDBAS-EXP-*, VDBAS-VAL-* |

### Config (đa số thuộc Out-of-Scope — xem STEP 4)

| File | Folder | Ghi chú |
|------|--------|---------|
| `SecurityConfig.java` | `config/` | ⚠️ Out-of-scope: JWT filter, role-based access |
| `AuditConfig.java` | `config/` | Spring Data Auditing |
| `FileStorageConfig.java` | `config/` | ⚠️ Out-of-scope: Upload path, max size |

### Resources

| File | Folder | Ghi chú |
|------|--------|---------|
| `application.yml` | `src/main/resources/` | DB, JPA, security config |
| `messages.properties` | `src/main/resources/i18n/` | Error message templates |
```

Nếu cấu trúc thư mục hiện tại đã tồn tại (đọc được), điều chỉnh base package và folder path cho khớp. Đánh dấu `✅ Đã tồn tại` hoặc `🆕 Cần tạo mới` cho từng file.

---

### STEP 8 — Tạo Impact Summary

Trước phần Scope, thêm một tóm tắt đầu file:

```markdown
# Impact Analysis: {yaml_file} ↔ {sql_file}

**Generated:** {date}
**API Version:** {lấy từ info.version trong YAML}

## Tóm tắt

| Hạng mục | Số lượng |
|----------|----------|
| Bảng DB phân tích | N |
| YAML Schemas phân tích | N |
| Columns đã mapping khớp | N |
| **Endpoint In-Scope** | **N** |
| **Hạng mục Out-of-Scope** | **N** |
| **CRITICAL gaps** | **N** |
| **DECISION_NEEDED gaps** | **N** |
| IMPLEMENTATION_NOTE gaps | N |
| Files cần tạo mới (entity/dto/service/controller) | N |

## Checklist trước khi sinh code

- [ ] Đã review Scope / Out-of-Scope
- [ ] Tất cả CRITICAL gaps đã có quyết định
- [ ] Tất cả DECISION_NEEDED gaps đã có quyết định
- [ ] Package gốc đã xác nhận
- [ ] Cấu trúc folder đã review
```

---

### STEP 9 — Ghi file và báo cáo

Ghi toàn bộ nội dung ra `output_file` theo thứ tự:
1. Impact Summary (STEP 8)
2. **Scope & Out-of-Scope (STEP 4)** — bảng In-Scope, sau đó bảng Out-of-Scope
3. Q&A Gaps (STEP 5) — nhóm CRITICAL → DECISION_NEEDED → IMPLEMENTATION_NOTE
4. Column → Entity Mapping (STEP 6) — một bảng mỗi entity table
5. File → Folder Mapping (STEP 7)

Sau khi ghi xong, in ra:

```
## ✅ Impact Analysis Generated: {output_file}

### Stats
- {N} endpoint In-Scope → đủ điều kiện sinh code
- {N} hạng mục Out-of-Scope → cần bổ sung thủ công / xác nhận có sẵn
- {N} CRITICAL gaps → phải giải quyết trước khi code
- {N} DECISION_NEEDED gaps → cần team quyết định
- {N} IMPLEMENTATION_NOTE → ghi chú khi implement
- {N} entity files to create
- {N} DTO files to create
- {N} service/controller files to create

### Bước tiếp theo
1. Review phần Scope / Out-of-Scope — xác nhận ranh giới generate
2. Review và điền "Decision" cho từng gap trong impact.md
3. Xác nhận package gốc và folder structure
4. Chạy /gen-api-contract nếu cần cập nhật YAML sau khi resolve gaps
5. Dùng impact.md (phần In-Scope) làm input cho code generation
```
