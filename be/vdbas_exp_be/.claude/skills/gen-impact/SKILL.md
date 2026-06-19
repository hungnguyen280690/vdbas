---
name: gen-impact
description: Analyze the gap between an OpenAPI YAML contract and a SQL DDL schema AGAINST the existing BE codebase, then generate an impact.md (existing-vs-new inventory, scope/out-of-scope, gap Q&A, Column→Entity mapping, regression impact on existing code & old functionality, File→Folder mapping for a Java/Spring BE). Use when the user wants an impact analysis of a contract vs DB vs current code, or invokes /gen-impact with a yaml_file, sql_file, and optional output_file.
---

# gen-impact

Phân tích gap giữa OpenAPI YAML và SQL DDL **đối chiếu với code BE hiện có**, sinh file `impact.md` gồm:
1. **Inventory code hiện có** — phân loại mỗi artifact: đã có dùng lại (EXISTS_REUSE) / đã có phải sửa (EXISTS_MODIFY) / tạo mới (NEW)
2. **Scope & Out-of-Scope** — phần nào mapping bao trùm (sinh code được), phần nào nằm ngoài (cần bổ sung thủ công)
3. Q&A từng điểm mapping chưa chuẩn (type mismatch, nullable conflict, missing column/field)
4. Bảng mapping: DB Column → Entity field (tên, Java type, annotation)
5. **Tác động lên code & chức năng cũ** — bảng regression: sửa gì, phá vỡ chức năng cũ nào, mức rủi ro, cách re-test
6. Bảng mapping: File cần tạo/sửa → Folder đích (gắn nhãn đã-có/mới) trong project BE

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

### NGUYÊN TẮC TỐI THƯỢNG — Bảo toàn tính năng cũ (đọc trước mọi STEP)

Đây là ràng buộc **bao trùm toàn bộ phân tích**. Mọi đề xuất ở STEP 1B/1C/4/5/7/7B phải tuân theo:

1. **Tính năng cũ là BẤT BIẾN (frozen).** Mặc định **KHÔNG sửa** code/đường đi/hành vi của feature đang chạy. Trạng thái, kết quả, response của chức năng cũ phải **giữ nguyên 100%** sau khi thêm feature mới.
2. **Ưu tiên THÊM MỚI, không SỬA CŨ.** Khi contract mới cần hành vi khác code hiện có (state machine, enum, DTO, controller, query) → đề xuất **tạo artifact mới riêng** (enum/converter/service/controller/DTO/repository-method mới) thay vì sửa cái dùng chung. "Cần thì thêm mới, không sửa tính năng cũ để khỏi làm lỗi."
3. **Chỉ được `EXISTS_MODIFY` khi BẤT KHẢ KHÁNG**, và khi đó **chỉ cho phép thay đổi cộng thêm (additive), tương thích ngược**:
   - ✅ Được: thêm field **nullable** mới, thêm method mới, thêm endpoint mới, thêm nhánh `if (type==NEW)` không đụng nhánh cũ.
   - ❌ Cấm: đổi/xoá/thu hẹp hành vi cũ, đổi signature đang được gọi, đổi giá trị enum/trạng thái mà code cũ phụ thuộc, đổi query `@Modifying` dùng chung, đổi validation đang nới.
4. **Mọi thay đổi có thể làm đổi hành vi cũ → bắt buộc gắn 🔴 HIGH** ở STEP 7B **và** phải kèm một **phương án thay thế kiểu cô lập (NEW)** để team chọn. Không được im lặng sửa code dùng chung.
5. Khi phân vân giữa "sửa cái cũ cho tiện" và "tạo cái mới cho an toàn" → **luôn chọn tạo mới**. Chi phí thêm file < chi phí phá vỡ feature đang chạy production.

> Hệ quả lên nhãn: nếu reuse một artifact buộc phải đổi hành vi của nó (D1–D7 ở STEP 1C báo lệch) → KHÔNG gán `EXISTS_REUSE`; gán `EXISTS_REUSE_RISKY` và đề xuất tách `NEW`. Cột "Hướng xử lý" ở STEP 4/5 và "Thay đổi cần làm" ở STEP 7B phải ghi rõ phương án **cô lập (thêm mới)** là mặc định.

---

### STEP 1 — Đọc cả hai file

Đọc toàn bộ YAML file và SQL file trước khi làm bất kỳ bước nào.

Xác định:
- Danh sách tất cả **bảng** trong SQL (tên bảng, các cột, kiểu dữ liệu, nullable, PK/FK/UK)
- Danh sách tất cả **schemas** trong YAML components/schemas (tên schema, các field, kiểu, required, nullable)
- Danh sách tất cả **paths** trong YAML (method, path, request body schema ref, response schema ref)

---

### STEP 1B — Inventory code HIỆN CÓ (đọc project, BẮT BUỘC)

Đây là bước skill cũ thiếu. KHÔNG được suy đoán "mới hay cũ" chỉ từ YAML+SQL — phải **đọc code thật** trong project trước.

Xác định cấu trúc project (đọc `pom.xml` / `build.gradle` + thư mục `src/main/java`):
- Nếu **multi-module hexagonal** (vd dự án này: modules `domain` / `application` / `common` / `api`, base package `com.fis.vdbas.exp`):
  - `domain/.../{feature}/`        → entity + repository port (interface)
  - `application/.../{feature}/service|mapper|dto/` → service, MapStruct mapper, DTO
  - `api/.../{feature}/`           → controller
  - `common/.../{enums|converter}/` → enum, converter dùng chung
- Nếu **single-module** → dùng layout `entity/ repository/ service/ controller/ dto/ ...`.

Quét toàn bộ code hiện có và đối chiếu với **mỗi bảng SQL, mỗi schema YAML, mỗi endpoint YAML** ở STEP 1. Với từng artifact (entity / repository / DTO / mapper / service / controller / enum), gán **một** nhãn:

| Nhãn | Ý nghĩa | Hệ quả |
|------|---------|--------|
| `EXISTS_REUSE`  | Đã có trong code, feature mới dùng lại **nguyên trạng** | Không sửa — chỉ inject/gọi |
| `EXISTS_REUSE_RISKY` | Đã có **nhưng** xây cho biến thể/feature anh em với **nghiệp vụ xung đột**, HOẶC đang **stub/hardcode/TODO** (chưa chạy thật) | ⚠️ Trông như reuse nhưng **là bẫy** — phải đối chiếu ngữ nghĩa ở STEP 1C trước khi quyết định reuse |
| `EXISTS_MODIFY` | Đã có nhưng phải **sửa** (thêm cột/field/method/endpoint, đổi signature, mở rộng enum) | ⚠️ **Rủi ro regression** — phải soi chức năng cũ |
| `NEW`           | Chưa có trong code → tạo mới | An toàn với code cũ |

> ⚠️ **Cảnh báo "EXISTS_REUSE giả":** một artifact tồn tại + trùng tên + biên dịch được **KHÔNG** có nghĩa là dùng lại được. Code có thể được viết cho **biến thể anh em** (vd CAPEX trong khi contract là OPEX) với state machine / workflow / validation **khác hẳn**, hoặc đang là **stub** (`return "SYSTEM"`, `// TODO`, mã tạm UUID). Trước khi gán `EXISTS_REUSE`, BẮT BUỘC chạy STEP 1C để xác minh ngữ nghĩa khớp. Nếu lệch → đổi nhãn thành `EXISTS_REUSE_RISKY` và mở một GAP.

**Phát hiện artifact DÙNG CHUNG** mà feature mới chạm vào (đây là nơi dễ phá chức năng cũ nhất):
- Base/abstract class (vd `AbstractAuditingEntity`, base entity, base service)
- Enum / converter dùng chung trong `common` (thêm giá trị enum, sửa converter)
- `GlobalExceptionHandler`, `ErrorCode`, security/audit config
- Service/mapper/repository đang được feature **khác** gọi (grep nơi sử dụng)

**Phát hiện stub/placeholder trong artifact định reuse** (grep BẮT BUỘC): tìm `TODO`, `FIXME`, `"SYSTEM"`, `placeholder`, `tạm`, `temp`, `out-of-scope` trong service/mapper sẽ dùng lại. Nếu logic nghiệp vụ cốt lõi (sinh mã, gán người xử lý, tính hash/SLA, ghi log) đang stub → nhãn `EXISTS_REUSE_RISKY` + ghi IMPLEMENTATION_NOTE, đừng coi là chạy được.

**Kết quả bước này** (bảng nội bộ, dùng cho STEP 4, 6, 7 và mục Tác động):

```
ARTIFACT | LOẠI(entity/dto/service/...) | ĐƯỜNG DẪN FILE (nếu có) | NHÃN | DÙNG CHUNG? | NƠI ĐANG ĐƯỢC GỌI
```

Với mỗi artifact `EXISTS_MODIFY` hoặc dùng chung, ghi rõ **ai đang phụ thuộc** (grep tên class/method trong toàn repo) — đây là input cho phần phân tích regression ở STEP 7B.

---

### STEP 1C — Đối chiếu NGỮ NGHĨA contract ↔ code hiện có (divergence detection, BẮT BUỘC)

Đây là bước rút ra từ thực tế: STEP 1B mới phát hiện artifact **có/không tồn tại**, nhưng cái nguy hiểm nhất là artifact **tồn tại mà ngữ nghĩa lệch** — biên dịch được nhưng vỡ runtime hoặc phá feature anh em. Chạy **đủ 7 detector** dưới đây; mỗi detector phát hiện gì → mở ngay một GAP (mức theo STEP 3) và đánh dấu artifact liên quan `EXISTS_REUSE_RISKY`/`EXISTS_MODIFY`.

| # | Detector | Cách kiểm tra cụ thể | Nếu lệch → |
|---|----------|----------------------|------------|
| D1 | **Namespace / base-path lệch** | So `paths:` trong YAML với `@RequestMapping`/`@GetMapping(...)` của controller hiện có (grep `RequestMapping`). Vd contract `/exp/opex/...` nhưng code `/exp/capex/...` | `CRITICAL` — quyết định tách controller hay nhánh hoá. Đừng giả định reuse được controller |
| D2 | **Enum value-set lệch** (⚠️ crash runtime) | Với mỗi enum YAML (`enum: [...]`) có converter/`@Enumerated` tương ứng trong code: so **tập giá trị**. Đặc biệt enum gắn `AttributeConverter` gọi `valueOf(dbData)` | `CRITICAL` — `valueOf` **ném IllegalArgumentException** khi đọc giá trị lạ. Đề xuất enum/converter riêng, không sửa enum dùng chung (HIGH regression) |
| D3 | **State machine: số/loại transition lệch** | Đếm endpoint workflow trong YAML (submit/check/approve/reject/cancel/return...) vs số method chuyển trạng thái trong service hiện có. Soi method có "gộp" nhiều bước bằng switch không | `CRITICAL`/`DECISION_NEEDED` — workflow gộp (3 bước) không phục vụ được contract tách (7 bước) + SoD |
| D4 | **Request DTO trùng tên nhưng khác field-set/required** | Với mỗi request schema YAML, so `required[]` + danh sách field với DTO code cùng vai trò. Tìm field contract **bắt buộc mà DTO thiếu** (vd `treasuryCode`), field code **bắt buộc mà contract bỏ** (vd `dossierId`, `documentNo` backend-gen) | `CRITICAL` nếu thiếu field NOT NULL/required; `DECISION_NEEDED` nếu lệch quy ước (client-gửi vs backend-sinh) |
| D5 | **Drift 2 chiều Entity ↔ DDL** | (a) Cột DDL `NOT NULL` **không có** field entity / không được audit-base ghi → vỡ insert ORA-01400. (b) Field entity có `@Column` **không tồn tại** trong DDL → schema-drift. Làm cho **mọi** entity reuse, không chỉ entity mới | `CRITICAL` cho (a) không default; `IMPLEMENTATION_NOTE` cho (b) |
| D6 | **Audit/identity NOT NULL không có nguồn ghi** | Cột `CREATED_BY/UPDATED_BY/CREATED_DATE/...` NOT NULL: kiểm `AuditorAware`/`@EnableJpaAuditing` có cấu hình trả non-null không. Cột cần user/role/IP từ JWT mà security chưa có | `CRITICAL` — chặn mọi POST cho tới khi auditor non-null |
| D7 | **Default-value / immutability / soft-delete lệch** | So quy tắc contract (vd soft-delete `F_STATUS=DELETED`, field `immutable VAL-17`) với code (`softDelete` set giá trị khác, `updatable` khác). Grep query `@Modifying` hard-code trạng thái | `CRITICAL`/`DECISION_NEEDED` — query dùng chung set sai trạng thái sẽ phá cả feature cũ lẫn mới |

**Nguyên tắc xử lý khi detector báo lệch:**
- Ưu tiên **cô lập biến thể mới** (enum/converter/service/controller riêng), **tái dùng entity + repository** chung. Đây là cách kéo rủi ro HIGH→MEDIUM, tránh sửa trực tiếp artifact mà feature cũ đang phụ thuộc.
- Mỗi lệch ngữ nghĩa → một GAP ở STEP 5 với giá trị cụ thể **hai phía** (contract nói gì, code đang làm gì), không nói chung chung.
- Ghi kết quả 7 detector vào bảng nội bộ để feed STEP 5 (Q&A) và STEP 7B (regression).

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
- **Enum value-set lệch** giữa YAML và enum code có converter (`valueOf` ném exception khi đọc giá trị lạ) — D2
- **Namespace/base-path lệch** giữa contract và controller hiện có — D1
- **State machine số transition lệch** (workflow gộp không phục vụ được contract tách) — D3
- **Request DTO thiếu field required/NOT NULL** so với contract — D4
- **Cột DDL NOT NULL không có field entity / không nguồn ghi** (audit, JWT) → ORA-01400 — D5/D6
- **Query dùng chung (`@Modifying`) hard-code trạng thái sai** so với contract (soft-delete, immutability) — D7

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

**BẮT BUỘC** dùng inventory ở STEP 1B (không dùng convention mặc định nếu project đã có code thật):
- Điều chỉnh base package + folder path cho khớp cấu trúc thật (vd dự án này: `com.fis.vdbas.exp`, multi-module `domain/application/common/api`, không phải `entity/ dto/` phẳng).
- Đánh dấu **mỗi file** đúng nhãn từ STEP 1B: `✅ EXISTS_REUSE` (dùng lại) · `🔧 EXISTS_MODIFY` (sửa — xem STEP 7B) · `🆕 NEW` (tạo mới).
- File `🔧 EXISTS_MODIFY` phải ghi cột Ghi chú: sửa cái gì (thêm field/method/endpoint nào).

---

### STEP 7B — Tác động lên CODE & CHỨC NĂNG CŨ (regression, BẮT BUỘC)

Đây là phần skill cũ thiếu. Chỉ dựa trên các artifact `EXISTS_MODIFY` và dùng chung từ STEP 1B. Nếu feature hoàn toàn `NEW` (không chạm code cũ) → ghi rõ "Không tác động code hiện có" và bỏ qua bảng.

Với **mỗi** artifact phải sửa, sinh một dòng:

```markdown
## Tác động lên code & chức năng cũ

| Artifact (file) | Thay đổi cần làm | Chức năng cũ liên quan | Rủi ro phá vỡ | Mức độ | Cách kiểm chứng (regression) |
|-----------------|------------------|------------------------|---------------|--------|------------------------------|
| `ExpDossier.java` (domain/dossier) | Thêm cột `NEW_COL` + getter | Mọi luồng đọc/ghi DOSSIER cũ | Thấp nếu nullable; cao nếu NOT NULL không default | ⚠️ MEDIUM | Chạy lại test CRUD dossier cũ; kiểm tra insert legacy |
| `DataSourceCode.java` (common/enums) | Thêm value mới | Validation nguồn dữ liệu ở feature cũ | Switch/exhaustive check có thể vỡ | ⚠️ MEDIUM | Grep nơi switch trên enum; rà default branch |
| `GlobalExceptionHandler.java` | Thêm mapping exception mới | Toàn bộ response lỗi của API cũ | Thấp (chỉ thêm @ExceptionHandler) | 🟢 LOW | Smoke test 1 endpoint cũ trả lỗi như trước |
| ... | ... | ... | ... | ... | ... |
```

**Quy tắc đánh giá rủi ro:**
- 🔴 **HIGH** — sửa shared base class, đổi signature method/endpoint đang được nhiều nơi gọi, đổi kiểu cột DB đang có dữ liệu, thu hẹp validation đang nới. **Mọi thay đổi làm đổi HÀNH VI cũ đều mặc định HIGH** (theo Nguyên tắc tối thượng).
- ⚠️ **MEDIUM** — thêm cột NOT NULL vào bảng cũ, mở rộng enum bị switch ở nơi khác, sửa mapper dùng chung.
- 🟢 **LOW** — thêm field nullable, thêm endpoint/handler mới không đụng luồng cũ, thêm method mới vào service (thay đổi **cộng thêm, tương thích ngược**).

Với mỗi dòng HIGH/MEDIUM: cột "Cách kiểm chứng" phải nêu **test/endpoint cụ thể** cần chạy lại, không nói chung chung.

**BẮT BUỘC (Nguyên tắc tối thượng):** với mỗi dòng 🔴 HIGH (đổi hành vi cũ), cột "Thay đổi cần làm" phải kèm **phương án cô lập thay thế (tạo mới, không sửa cũ)** — vd "thay vì sửa enum dùng chung → tạo `OpexDossierStatus` riêng". Nếu phương án cô lập khả thi, đề xuất nó làm **mặc định** và hạ rủi ro xuống MEDIUM/LOW. Chỉ giữ HIGH khi thực sự không thể tách.

Cuối mục, thêm:

```markdown
### Tóm tắt regression
- File phải sửa (EXISTS_MODIFY): N
- Artifact dùng chung bị chạm: N
- Rủi ro HIGH: N  ·  MEDIUM: N  ·  LOW: N
- Khu vực cần re-test trước khi merge: {liệt kê feature cũ}
```

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
| Artifact đã có — dùng lại (EXISTS_REUSE) | N |
| **Artifact reuse rủi ro (EXISTS_REUSE_RISKY — biến thể anh em / stub)** | **N** |
| Artifact đã có — phải sửa (EXISTS_MODIFY) | N |
| **Files cần tạo mới (NEW)** | **N** |
| **Rủi ro regression HIGH / MEDIUM** | **N / N** |

## Checklist trước khi sinh code

- [ ] Đã review Scope / Out-of-Scope
- [ ] Đã chạy 7 detector ngữ nghĩa (STEP 1C) — không còn `EXISTS_REUSE_RISKY` chưa giải quyết
- [ ] Đã chốt detector lớn (namespace D1, enum D2, state machine D3) nếu phát hiện
- [ ] Tất cả CRITICAL gaps đã có quyết định
- [ ] Tất cả DECISION_NEEDED gaps đã có quyết định
- [ ] Đã review danh sách EXISTS_REUSE / EXISTS_REUSE_RISKY / EXISTS_MODIFY / NEW (STEP 1B)
- [ ] Đã review mục Tác động lên code & chức năng cũ (STEP 7B)
- [ ] Có kế hoạch re-test cho mọi rủi ro HIGH / MEDIUM
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
5. **Tác động lên code & chức năng cũ (STEP 7B)** — bảng regression + tóm tắt
6. File → Folder Mapping (STEP 7) — mỗi file có nhãn EXISTS_REUSE / EXISTS_MODIFY / NEW

Sau khi ghi xong, in ra:

```
## ✅ Impact Analysis Generated: {output_file}

### Stats
- {N} endpoint In-Scope → đủ điều kiện sinh code
- {N} hạng mục Out-of-Scope → cần bổ sung thủ công / xác nhận có sẵn
- {N} CRITICAL gaps → phải giải quyết trước khi code
- {N} DECISION_NEEDED gaps → cần team quyết định
- {N} IMPLEMENTATION_NOTE → ghi chú khi implement
- {N} artifact EXISTS_REUSE → dùng lại, không sửa
- {N} artifact EXISTS_MODIFY → phải sửa (⚠️ regression)
- {N} files NEW → tạo mới
- {N} rủi ro HIGH / {N} MEDIUM → cần re-test trước khi merge

### Bước tiếp theo
1. Review phần Scope / Out-of-Scope — xác nhận ranh giới generate
2. Review danh sách EXISTS_REUSE / EXISTS_MODIFY / NEW — xác nhận cái gì tái dùng, cái gì tạo mới
3. Review mục Tác động lên code & chức năng cũ — chốt kế hoạch re-test cho HIGH/MEDIUM
4. Review và điền "Decision" cho từng gap trong impact.md
5. Xác nhận package gốc và folder structure
6. Chạy /gen-api-contract nếu cần cập nhật YAML sau khi resolve gaps
7. Dùng impact.md (phần In-Scope) làm input cho code generation
```
