---
name: gen-be-code
description: Generate Spring Boot backend code (entity, repository, DTO, MapStruct mapper, service, controller, shared registries) for ANY API feature from an OpenAPI contract YAML + an impact.md analysis. Mirrors the project's multi-module hexagonal conventions (common/domain/application/api). Use when the user wants to scaffold/implement BE code for a feature from its contract + impact, or invokes /gen-be-code with a yaml_file and impact_file.
---

# gen-be-code

Sinh code backend **Spring Boot** cho **một feature API bất kỳ** từ:
1. **OpenAPI contract YAML** (vd sinh ra bởi `/gen-api-contract`)
2. **impact.md** (vd sinh ra bởi `/gen-impact`) — chứa Scope/Out-of-Scope, Column→Entity mapping, File→Folder mapping

Code sinh ra **bám đúng convention thật của project** (đọc trực tiếp từ codebase, KHÔNG bịa), trải đều trên kiến trúc multi-module hexagonal: `common` / `domain` / `application` / `api`.

Skill này **tổng quát** — dùng chung một format cho mọi feature, không hardcode cho feature cụ thể nào.

## Usage

```
/gen-be-code <yaml_file> <impact_file> [feature_name]
```

**Arguments** (space-separated, passed as the skill input):

- `yaml_file`     — đường dẫn OpenAPI contract YAML (vd `apiContract/capex-dossier-api.yaml`)
- `impact_file`   — đường dẫn impact.md (vd `apiContract/impact.md`)
- `feature_name`  — (tuỳ chọn) tên feature dạng `camelCase` dùng làm tên package con (vd `dossier`). Nếu không truyền, **tự suy ra** từ contract (xem STEP 2).

Nếu thiếu `yaml_file` hoặc `impact_file`, hỏi user trước khi tiếp tục.

---

## Instructions

Thực hiện **đúng thứ tự** các bước. KHÔNG bỏ qua hoặc gộp bước. KHÔNG sinh Out-of-Scope thành logic thật — chỉ stub + `// TODO`.

---

## TDD policy — BẮT BUỘC cho các step quan trọng

Skill này áp dụng **TDD (test-first)** cho phần logic dễ sai nhất. Vòng lặp cho mỗi component quan trọng: **RED → GREEN → REFACTOR**.

1. **RED** — Viết test TRƯỚC khi sinh code thật. Test phải **biên dịch được nhưng FAIL** (vì class/method đích chưa tồn tại hoặc chưa có logic). Chạy `mvn test` để xác nhận đỏ.
2. **GREEN** — Sinh code thật **vừa đủ** để mọi test pass. Không thêm logic ngoài phạm vi test/contract.
3. **REFACTOR** — Dọn code, giữ test xanh.

**Step nào BẮT BUỘC test-first:**

| Component | Step | Lý do |
|-----------|------|-------|
| **Service** (CRUD + check trùng + soft-delete) | STEP 6 | Nhiều nhánh nghiệp vụ, ném exception có điều kiện |
| **Service — Workflow / state machine** | STEP 6 | **Phần dễ sai nhất** — phải test cả transition hợp lệ VÀ không hợp lệ |
| **Mapper** | STEP 5 | Phải đảm bảo KHÔNG rò rỉ field audit/id/deleted/backend-managed; convert Boolean↔Integer đúng |

**Step KHÔNG cần test-first** (khai báo thuần, kiểm bằng compile + integration test sau): Entity (STEP 3), Repository derived query (STEP 4 — chỉ test nếu có `@Query` custom), Controller (STEP 8 — phủ bởi `/gen-api-test`).

Test đặt tại `src/test/java/...` **cùng module với code đích** (Service/Mapper → module `application`), mirror package của class đích. Dùng **JUnit 5 + Mockito** (mock `Repository`); Mapper test dùng instance `Mappers.getMapper(...)` hoặc `@SpringBootTest` nếu cần Spring context.

**KHÔNG báo "done" nếu test chưa xanh** (xem STEP 9).

---

### STEP 0 — Học convention thật của project (BẮT BUỘC, làm trước tiên)

Không được giả định convention. Đọc một **feature tham chiếu đã tồn tại** trong codebase để sao chép style. Quy trình:

1. Đọc `pom.xml` gốc → xác nhận danh sách module (`common`, `domain`, `application`, `api`) và `groupId` (base package, vd `com.fis.vdbas.exp`).
2. Liệt kê file Java hiện có: `find . -name "*.java" -not -path "*/target/*"`.
3. Chọn **feature tham chiếu** (feature đã code đầy đủ nhất, vd `category`). Đọc đủ 1 file mỗi layer của nó:
   - `domain/.../{feature}/<Entity>.java` và `<Entity>Repository.java`
   - `application/.../{feature}/dto/<...>Dto.java`, `.../dto/<...>SearchDto.java`
   - `application/.../{feature}/mapper/<...>Mapper.java`
   - `application/.../{feature}/service/<...>Service.java`
   - `api/.../{feature}/<...>Controller.java`
   - `common/.../common/Constants.java` và `CacheConstants.java`
   - `api/src/main/resources/messages.properties`, `messages_en.properties`, `messages_vi.properties`
4. **Học convention TEST:** liệt kê test hiện có `find . -path "*/src/test/*" -name "*.java" -not -path "*/target/*"`; đọc 1 test mẫu (nếu có) để sao chép style (annotation, naming `<Class>Test`, cách mock, profile `test`). Kiểm tra **module nào đã có test deps**: `grep -l "spring-boot-starter-test" */pom.xml`. Nếu module chứa code đích (thường là `application` cho Service/Mapper) **chưa có** `spring-boot-starter-test`/`mockito`, ghi nhận để bổ sung ở STEP 2.5.
5. Ghi lại (nội bộ) các quy ước phát hiện được — base package, base class kế thừa, annotation, exception dùng chung, naming, **và convention test**. Đây là **nguồn sự thật** cho mọi file sinh ra; nếu codebase khác với mẫu dưới, **ưu tiên codebase**.

**Convention mặc định của project này** (xác nhận lại bằng STEP 0; điều chỉnh nếu codebase đã đổi):

- **Base package:** `com.fis.vdbas.exp`
- **Thư viện dùng chung** `com.fis.vdbas.common.*`:
  - `domain.AbstractAuditing<ID>` — entity base (audit fields)
  - `dto.BaseAuditingDto`, `dto.BaseSearchDto`, `dto.PageResponseDto<T>`
  - `mapper.BooleanIntegerMapper` — convert `Boolean ↔ Integer (0/1)`
  - `exception.ResourceNotFoundException`, `exception.DuplicateResourceException`
  - `util.Constants.FLAG_FALSE (0)`, `FLAG_TRUE (1)`
- **Module → package → nội dung:**

| Module | Package gốc | Layer chứa |
|--------|-------------|-----------|
| `common` | `com.fis.vdbas.exp.common` | `Constants`, `CacheConstants` (registries dùng chung) |
| `domain` | `com.fis.vdbas.exp.domain.<feature>` | Entity, Repository |
| `application` | `com.fis.vdbas.exp.application.<feature>` | `dto/`, `mapper/`, `service/` |
| `api` | `com.fis.vdbas.exp.api.<feature>` | Controller |

---

### STEP 1 — Đọc contract + impact

Đọc **toàn bộ** `yaml_file` và `impact_file`.

Từ **contract YAML** trích:
- `info.version`, `servers[].url` (base path).
- `paths`: method, path, `operationId`, params, request/response schema refs.
- `components.schemas`: mọi schema (request, response, enum, LOV).

Từ **impact.md** trích (nếu có — đây là input ưu tiên):
- **Scope / Out-of-Scope** → chỉ sinh code cho In-Scope; Out-of-Scope chỉ tạo stub + `// TODO`.
- **Column → Entity Mapping** → nguồn sự thật cho field/type/annotation của Entity.
- **File → Folder Mapping** → danh sách file cần tạo và folder đích.
- Các GAP `CRITICAL` / `DECISION_NEEDED` chưa có Decision.

**Gate quyết định:** nếu impact.md còn GAP `CRITICAL` hoặc `DECISION_NEEDED` mà mục **Decision** chưa được điền (vẫn `☐ Chưa quyết định`), **dừng lại và liệt kê** các gap đó, hỏi user muốn (a) quyết ngay, hay (b) sinh code với giả định mặc định (ghi rõ giả định trong `// TODO`). Không tự ý bỏ qua gap CRITICAL.

---

### STEP 2 — Xác định feature + danh sách file

1. **Feature name:** nếu `feature_name` được truyền thì dùng; nếu không, suy từ contract — lấy resource chính trong base path (vd `/exp/capex/dossiers` → `dossier`), dạng `camelCase` số ít. Từ đó dẫn xuất:
   - PascalCase entity prefix: `Dossier`
   - package con: `dossier`
   - table name: lấy từ Column→Entity mapping trong impact (vd `EXP_DOSSIER`).
2. **Build danh sách file** từ File→Folder Mapping của impact. Nếu impact không có bảng đó, tự dẫn xuất theo bộ chuẩn dưới (chỉ cho In-Scope):

| Layer | File | Module/Folder |
|-------|------|---------------|
| Entity | `<Entity>.java` (+ child entity nếu có bảng con) | `domain/.../<feature>/` |
| Repository | `<Entity>Repository.java` | `domain/.../<feature>/` |
| DTO | `<Entity>Dto.java`, `<Entity>SearchDto.java`, các `*Request`/`*Response` từ schema | `application/.../<feature>/dto/` |
| Mapper | `<Entity>Mapper.java` | `application/.../<feature>/mapper/` |
| Service | `<Entity>Service.java` (+ `WorkflowService` nếu có state machine) | `application/.../<feature>/service/` |
| Controller | `<Entity>Controller.java` | `api/.../<feature>/` |

3. **In ra Generation Plan** ngắn gọn (bảng file → path → ✅ tạo mới / ⚠️ đã tồn tại sẽ ghi đè / ⏭️ skip vì Out-of-Scope) **trước khi** ghi bất kỳ file nào. Với file đã tồn tại, mặc định KHÔNG ghi đè trừ khi user xác nhận — thay vào đó báo và bỏ qua.

---

### STEP 2.5 — Chuẩn bị hạ tầng test (TDD setup)

Trước khi viết test (STEP 5/6), đảm bảo module đích biên dịch & chạy được test:

1. Nếu module chứa Service/Mapper (`application`) **chưa có** `spring-boot-starter-test` (phát hiện ở STEP 0), thêm vào `application/pom.xml` (append vào `<dependencies>`, không xoá deps cũ):
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-test</artifactId>
       <scope>test</scope>
   </dependency>
   ```
   (Phiên bản do `spring-boot-starter-parent` quản lý — KHÔNG hardcode version. `spring-boot-starter-test` đã kèm JUnit 5 + Mockito + AssertJ.)
2. Nếu cần Spring context cho test (vd Mapper qua DI) và profile `test` đã có ở module tham chiếu, tái dùng đúng cấu hình đó. Mặc định ưu tiên **unit test thuần Mockito** (nhanh, không cần context).
3. Bổ sung file `pom.xml` vừa sửa vào **Generation Plan** (STEP 2) dưới dạng `✏️ updated`.

---

### STEP 3 — Sinh Entity (module `domain`)

Dùng **Column → Entity Mapping** trong impact làm nguồn sự thật. Quy tắc:

- `package com.fis.vdbas.exp.domain.<feature>;`
- Annotation lớp: `@Entity @Table(name = "<table>") @Getter @Setter @ToString @NoArgsConstructor`.
- `extends AbstractAuditing<UUID>` — KHÔNG tự khai báo lại các cột audit (`createdBy/createdAt/updatedBy/updatedAt`) nếu base class đã có (xác nhận ở STEP 0).
- PK UUID:
  ```java
  @Id
  @GeneratedValue
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Override
  public UUID getId() { return this.id; }
  ```
- Mỗi cột → field `camelCase` với `@Column(name = "<snake_col>", nullable = <...>, length = <N nếu string>)`.
- Cột soft-delete `is_deleted` → `private Integer deleted = 0;` (`@Column(name = "is_deleted", nullable = false)`).
- `CLOB`/text lớn → `@Lob @Column(name=...)` + `private String ...`.
- FK reference → ngoài field code/id thuần, thêm quan hệ đọc-only khi mapping yêu cầu:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "<fk_col>", insertable = false, updatable = false)
  private <RefEntity> <ref>;
  ```
- Java type theo bảng map của impact (RAW(16)→UUID, VARCHAR2(N)→String, NUMBER(p,s)→BigDecimal, NUMBER(18) money→Long, NUMBER(1) flag→Integer, DATE→LocalDate/LocalDateTime, TIMESTAMP→LocalDateTime, CLOB→String).
- Field optimistic-lock (nếu có): `@Version private Integer version;`.

Sinh entity con (documents/attachments/log…) tương tự nếu nằm trong In-Scope.

---

### STEP 4 — Sinh Repository (module `domain`)

- `extends JpaRepository<<Entity>, UUID>, JpaSpecificationExecutor<<Entity>>`.
- Soft-delete bằng `@Modifying @Query` (KHÔNG xoá cứng):
  ```java
  @Modifying
  @Query("UPDATE <Entity> e SET e.deleted = 1, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
  void softDelete(@Param("id") UUID id);
  ```
  (bỏ `endDate` nếu entity không có cột đó.)
- Thêm derived query cho ràng buộc unique/lookup mà service cần: `existsBy...AndDeleted(...)`, `findBy...AndDeleted(...)`.
- Truy vấn phức tạp/lọc động → để service dùng `Specification` (xem STEP 6), không nhồi vào repository.

---

### STEP 5 — Sinh DTO + Mapper (module `application`)

**DTO** (`dto/`):
- DTO chính `<Entity>Dto`: `@Data @EqualsAndHashCode(callSuper = true) extends BaseAuditingDto`.
  - Field user-input có validation: `@NotBlank(message = "{<feature>.<field>.required}")`, `@Size(max = N, message = "{<feature>.<field>.size}")`, `@NotNull`, `@Min/@Max`, `@Pattern`… theo constraint trong schema/impact.
  - **KHÔNG** đặt validation lên field backend-managed/auto-fill/denorm (theo phân loại trong impact); các field đó chỉ để đọc trong response.
  - Message key validation phải thêm vào cả 3 file `messages*.properties` ở STEP 7.
- `<Entity>SearchDto`: `@Data @EqualsAndHashCode(callSuper = true) extends BaseSearchDto` — chứa các field lọc trong §List/filters của contract (+ `Boolean deleted` nếu cần).
- Các `*Request` / `*Response` riêng trong schema (CreateRequest, UpdateRequest, Detail, Summary, WorkflowActionResponse…) → mỗi schema một DTO, field đúng theo `components.schemas`. Có thể tái dùng `<Entity>Dto` nếu schema trùng để tránh trùng lặp — ưu tiên theo cách feature tham chiếu làm.

**Mapper** (`mapper/`) — **TDD: RED trước, GREEN sau:**

🔴 **RED — viết test trước** (`application/src/test/java/.../<feature>/mapper/<Entity>MapperTest.java`):
- Lấy mapper bằng `Mappers.getMapper(<Entity>Mapper.class)` (MapStruct sinh impl khi compile).
- Test phải khẳng định các bất biến quan trọng:
  - `toEntity(dto)` rồi assert **field audit/`id`/`deleted` KHÔNG bị set từ DTO** (phải null/giá trị mặc định) — chống rò rỉ field backend-managed.
  - `toDto(entity)` map đúng field nghiệp vụ.
  - `updateEntityFromDto(dto, entity)` chỉ đổi field cho phép, **giữ nguyên** audit/`id`/`deleted`.
  - Nếu có Boolean↔Integer: assert `true→1`, `false→0`, `null→null`.
- Chạy `mvn -pl application -am test` → test FAIL (mapper chưa có / chưa ignore đúng). Đây là trạng thái RED hợp lệ.

🟢 **GREEN — sinh mapper** cho test xanh:
- `@Mapper(componentModel = "spring")`; `extends BooleanIntegerMapper` nếu có field Boolean↔Integer.
- Phương thức: `toDto`, `toDtoList`, `toEntity`, `updateEntityFromDto(dto, @MappingTarget entity)`.
- `@Mapping(target = "...", ignore = true)` cho mọi field audit (`createdAt/createdBy/updatedAt/updatedBy`), `deleted`, `id` (trên update), và field backend tính toán — KHÔNG để mapper ghi đè chúng từ request.

---

### STEP 6 — Sinh Service (module `application`) — **TDD bắt buộc**

Đây là step quan trọng nhất → áp dụng đầy đủ **RED → GREEN → REFACTOR**.

#### 🔴 STEP 6a — RED: viết test trước

Tạo `application/src/test/java/.../<feature>/service/<Entity>ServiceTest.java`:
- `@ExtendWith(MockitoExtension.class)`; `@Mock <Entity>Repository repository; @Mock <Entity>Mapper mapper; @InjectMocks <Entity>Service service;`.
- Phủ **mọi method nghiệp vụ** (mỗi case một `@Test`, đặt tên rõ `methodName_condition_expected`):

| Method | Case bắt buộc test |
|--------|--------------------|
| `get(id)` | tìm thấy → trả DTO; **không thấy → ném `ResourceNotFoundException`** (`assertThrows`) |
| `create(dto)` | tạo OK → `repository.save` được gọi; **trùng → ném `DuplicateResourceException`** (mock `existsBy...` = true) |
| `update(id,dto)` | cập nhật OK; **không thấy → `ResourceNotFoundException`**; đổi field unique nhưng trùng → `DuplicateResourceException` |
| `delete(id)` | tồn tại → gọi `repository.softDelete(id)`; không thấy → `ResourceNotFoundException` |
| `search(criteria)` | trả `PageResponseDto` đúng (mock `repository.findAll(any(), any())`) |

- **Workflow / state machine (nếu In-Scope) — test KỸ nhất:** với MỖI transition (submit/approve/reject/…):
  - **Happy path:** entity ở state hợp lệ → state mới đúng + `save` gọi (+ ghi log nếu có bảng log).
  - **Negative:** entity ở state KHÔNG hợp lệ → ném đúng exception (`BusinessException`/`InvalidStateException` theo convention). Đây là test chống bug nghiêm trọng nhất — KHÔNG được bỏ.
- Verify tương tác bằng `verify(repository).save(...)`, dùng `ArgumentCaptor` khi cần kiểm giá trị set.
- Chạy `mvn -pl application -am test` → FAIL (Service chưa tồn tại / chưa có logic). Trạng thái RED hợp lệ.

> Phân quyền theo role/scope = Out-of-Scope (cần JWT claim) → **không viết test** cho nó, chỉ `// TODO` trong code.

#### 🟢 STEP 6b — GREEN: sinh Service cho test xanh

- `package ...application.<feature>.service;`
- Annotation lớp: `@Service @RequiredArgsConstructor @Slf4j @Transactional(readOnly = true)`.
- Inject `private final <Entity>Repository repository;` và `private final <Entity>Mapper mapper;`.
- Nếu cần gọi method có cache từ trong cùng bean (self-invocation), inject self như feature tham chiếu:
  ```java
  @org.springframework.context.annotation.Lazy
  @org.springframework.beans.factory.annotation.Autowired
  private <Entity>Service self;
  ```
- **Caching:** đăng ký cache name mới trong `CacheConstants` (STEP 7). Query đọc → `@Cacheable(value = CacheConstants.<FEATURE>_CACHE, key = "...")`; mutation → `@Transactional @CacheEvict(value = ..., allEntries = true)`.
- **Method chuẩn:**
  - `get(UUID id)` → `repository.findById(id).orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.<X>_NOT_FOUND, Constants.MessageKey.<X>_NOT_FOUND, Constants.Resource.<X>, "id", id.toString()))`.
  - `search(<Entity>SearchDto)` → build `Pageable` từ `sortBy/sortDirection/page/size`, gọi `repository.findAll(filter(criteria), pageable)`, trả `PageResponseDto.<Dto>builder()....build()`.
  - `create(dto)` → check trùng bằng `existsBy...` → ném `DuplicateResourceException(Constants.ErrorCode...., Constants.MessageKey...., Constants.Resource...., field, value)`; `mapper.toEntity` → `repository.save` → `mapper.toDto`.
  - `update(id, dto)` → `findById...orElseThrow(ResourceNotFoundException)`; check unique khi field đổi; `mapper.updateEntityFromDto`; save; toDto.
  - `delete(id)` → check tồn tại → `repository.softDelete(id)`.
- **Lọc động:** private method `Specification<<Entity>> filter(<Entity>SearchDto criteria)` build `List<Predicate>` (equal cho code/enum, `cb.like(cb.lower(...), "%"+v.toLowerCase()+"%")` cho text, mặc định loại `deleted = FLAG_FALSE`).
- **Workflow/state machine** (nếu In-Scope): mỗi transition (submit/approve/reject…) là một method `@Transactional` riêng — load entity, kiểm tra state hợp lệ (ném `BusinessException`/`InvalidStateException` theo convention nếu sai), set trạng thái mới, ghi log nếu có bảng log, save. Phân quyền theo role/scope = **Out-of-Scope** (cần JWT claim) → để `// TODO` rõ ràng, không bịa.
- Mọi error code / message key dùng phải khai báo trong `Constants` (STEP 7).

---

### STEP 7 — Cập nhật registries dùng chung (module `common` + resources `api`)

Đây là bước hay bị quên — **bắt buộc** để code biên dịch và message hiển thị đúng.

1. **`common/.../common/Constants.java`** — thêm cho feature:
   - `Resource.<FEATURE>` (vd `"Dossier"`)
   - `ErrorCode.<FEATURE>_NOT_FOUND`, `<FEATURE>_<X>_DUPLICATE`, các code nghiệp vụ khác (giữ format chuỗi UPPER_SNAKE như hiện có).
   - `MessageKey.<FEATURE>_NOT_FOUND` = `"error.<feature>.notfound"` … (key dạng `error.<feature>.<x>`).
2. **`common/.../common/CacheConstants.java`** — thêm `public static final String <FEATURE>_CACHE = "<feature>_cache";`.
3. **`api/src/main/resources/messages.properties`, `messages_en.properties`, `messages_vi.properties`** — thêm:
   - Mọi **validation message key** đã dùng trong DTO (`<feature>.<field>.required`, `.size`, …).
   - Mọi **error message key** đã khai trong `MessageKey` (`error.<feature>....`).
   - `messages.properties` + `messages_vi.properties`: tiếng Việt; `messages_en.properties`: tiếng Anh. Giữ nguyên các key cũ.

Chỉnh sửa các file này bằng cách **thêm vào** (append đúng block tương ứng), không xoá nội dung sẵn có.

---

### STEP 8 — Sinh Controller (module `api`)

- `package com.fis.vdbas.exp.api.<feature>;`
- `@RestController @RequestMapping("/api/<plural-resource>") @RequiredArgsConstructor` — base path khớp contract (giữ tiền tố `/api` như feature tham chiếu; nếu contract dùng `/api/v1/...` thì theo contract).
- Inject `private final <Entity>Service service;`.
- Map endpoint đúng theo contract:
  - `GET /{id}` → `get`.
  - `POST /search` → `search(@RequestBody <Entity>SearchDto)` trả `PageResponseDto<...>` (hoặc `GET` list với `@RequestParam` nếu contract dùng query params — theo contract).
  - `POST` → `@ResponseStatus(HttpStatus.CREATED)` + `@Valid @RequestBody`.
  - `PUT /{id}` → `@Valid @RequestBody`.
  - `DELETE /{id}` → `@ResponseStatus(HttpStatus.NO_CONTENT)`, trả `void`.
  - Workflow: `POST /{id}/submit|approve|reject|...` map sang service tương ứng.
- KHÔNG nhồi business logic vào controller — chỉ delegate sang service. KHÔNG tự handle exception (đã có `@RestControllerAdvice` toàn cục — xác nhận ở STEP 0; nếu chưa có thì ghi chú Out-of-Scope, đừng tự tạo trừ khi user yêu cầu).
- Bảo mật (JWT, role, scope) = **Out-of-Scope**: nếu contract yêu cầu, để `// TODO: enforce role/scope from JWT (out-of-scope)` thay vì bịa `@PreAuthorize` với claim không xác định.

---

### STEP 9 — Biên dịch & chạy test (GREEN) & sửa lỗi

1. Build + chạy test module liên quan (multi-module Maven):
   ```
   ./mvnw -q -pl common,domain,application,api -am test
   ```
   (nếu không có wrapper, dùng `mvn`; muốn nhanh khi mới sửa Service/Mapper: `./mvnw -q -pl application -am test`.)
2. Đọc lỗi compile/test → sửa (thiếu import, sai tên field MapStruct, thiếu message key, sai kiểu, logic chưa khớp test). Lặp **RED → GREEN** đến khi:
   - **compile sạch**, VÀ
   - **mọi test PASS** (đặc biệt các test workflow negative-case ở STEP 6a).
3. Nếu một test fail vì test viết sai (giả định sai về contract) → sửa test cho đúng contract/impact, KHÔNG nới lỏng để né bug. Nếu fail vì code sai → sửa code.
4. **KHÔNG báo "done" khi còn lỗi compile HOẶC còn test đỏ.** Nếu một lỗi/test bắt nguồn từ Out-of-Scope (vd thiếu `SecurityConfig`, JWT claim), nêu rõ và đề xuất thay vì bịa hoặc xoá test.

---

### STEP 10 — Báo cáo

In tổng kết:

```
## ✅ BE Code Generated: feature "<feature>"

### Files created/updated
| Module | File | Trạng thái |
|--------|------|-----------|
| domain | <Entity>.java | 🆕 |
| domain | <Entity>Repository.java | 🆕 |
| application | dto/<Entity>Dto.java | 🆕 |
| application | mapper/<Entity>Mapper.java | 🆕 |
| application | service/<Entity>Service.java | 🆕 |
| api | <Entity>Controller.java | 🆕 |
| common | Constants.java | ✏️ updated |
| common | CacheConstants.java | ✏️ updated |
| api | messages*.properties (x3) | ✏️ updated |
| application | pom.xml (test deps) | ✏️ updated (nếu có) |

### Tests written (TDD)
| Module | Test file | Cases |
|--------|-----------|-------|
| application | mapper/<Entity>MapperTest.java | <n> (audit/id/deleted ignore, boolean↔int) |
| application | service/<Entity>ServiceTest.java | <n> (CRUD + duplicate/notfound + workflow happy & negative) |

### Endpoints implemented
| Method | Path | → Service method |
|--------|------|------------------|
| ... | ... | ... |

### Build & Test
- mvn test: ✅ PASS (<n> tests) / ❌ FAIL (chi tiết)

### Out-of-Scope còn lại (TODO trong code)
- [ ] <vd: enforce role/scope từ JWT>
- [ ] <vd: lưu & quét file vật lý>
- [ ] <vd: sinh mã nghiệp vụ theo sequence>

### Bước tiếp theo
1. Review TODO Out-of-Scope ở trên.
2. Tạo migration DDL cho bảng mới nếu chưa có (domain/.../db/migration).
3. Chạy /gen-api-test để kiểm thử tích hợp.
```

---

### Quality checklist — verify TRƯỚC khi kết thúc

**Bám convention (STEP 0):**
- [ ] Mọi file đặt đúng module/package theo kiến trúc (domain=entity/repo, application=dto/mapper/service, api=controller).
- [ ] Entity `extends AbstractAuditing<UUID>`, không khai trùng field audit; soft-delete dùng `deleted` Integer.
- [ ] DTO `extends BaseAuditingDto`; SearchDto `extends BaseSearchDto`; dùng `PageResponseDto` cho list.
- [ ] Mapper `@Mapper(componentModel="spring")`, ignore field audit/id/deleted hợp lý.
- [ ] Service dùng `ResourceNotFoundException`/`DuplicateResourceException` với code từ `Constants`, KHÔNG `new RuntimeException`.

**Đúng phân loại từ impact:**
- [ ] Không field backend-managed/auto-fill/denorm nào nhận giá trị từ request body (validation + mapper đã chặn).
- [ ] Mọi field `Mandatory=Y` (USER_INPUT) có validation tương ứng.
- [ ] Out-of-Scope chỉ là stub + `// TODO`, KHÔNG bịa logic (JWT claim, file storage, export, sequence code…).

**TDD (test-first cho step quan trọng):**
- [ ] Đã viết test TRƯỚC khi sinh code cho **Mapper** (STEP 5) và **Service** (STEP 6) — RED rồi mới GREEN.
- [ ] Mapper test khẳng định KHÔNG rò rỉ field audit/id/deleted và convert Boolean↔Integer đúng.
- [ ] Service test phủ CRUD + nhánh `ResourceNotFoundException`/`DuplicateResourceException`.
- [ ] **Mỗi workflow transition có cả test happy-path VÀ negative (state không hợp lệ).**
- [ ] Phần Out-of-Scope (JWT/role/scope) KHÔNG bị viết test (chỉ `// TODO`).

**Registries & build:**
- [ ] Mọi ErrorCode/MessageKey/cache name đã khai trong `Constants`/`CacheConstants`.
- [ ] Mọi validation/error message key đã thêm vào cả 3 file `messages*.properties`.
- [ ] Module `application` có `spring-boot-starter-test` (đã thêm nếu thiếu — STEP 2.5).
- [ ] `mvn test` PASS (compile sạch + **mọi test xanh**); không ghi đè file đã tồn tại khi chưa được user xác nhận.
- [ ] GAP CRITICAL/DECISION_NEEDED chưa quyết đã được hỏi user (STEP 1 gate), không tự ý bỏ qua.
