# Báo cáo Phân tích CODING_RULES — Đề xuất Tái cấu trúc

**Dự án:** `vdbas_quantri_be`
**Ngày:** 2026-06-11
**Phương pháp:** Multi-agent analysis (14 agents song song) — Scout → Categorize → Adversarial Verify → Synthesize

---

## 1. Bối cảnh & Vấn đề Đặt ra

CODING_RULES hiện tại (`CODING_RULES.md`) có **~1.676 dòng** văn bản và được load toàn bộ vào context window của AI mỗi khi bắt đầu làm việc với codebase. Nhóm kỹ thuật đặt ra 3 câu hỏi:

1. Rule nào AI **thực sự cần** để code đúng?
2. Rule nào AI **có thể tự suy ra** từ code hiện có?
3. Làm thế nào để **tránh đọc thừa context** mà vẫn đảm bảo chất lượng?

---

## 2. Phương pháp Phân tích

Chúng tôi tung 14 AI agents chạy song song theo 4 phases:

```
Phase 1 — Scout (4 agents):     Đọc codebase thực tế, không đọc CODING_RULES
Phase 2 — Categorize (7 agents): Mỗi agent phân loại 2-4 sections của CODING_RULES
Phase 3 — Verify (2 agents):    Adversarially kiểm tra lại các phân loại
Phase 4 — Synthesize (1 agent): Tổng hợp thành kế hoạch hành động
```

Mỗi rule được phân loại thành một trong bốn mức:

| Mức | Định nghĩa |
|-----|-----------|
| **CRITICAL** | AI không tự biết, sai sẽ gây bug/compile error/runtime failure |
| **HELPFUL** | Có ích nhưng AI có thể đoán ra nếu đọc code hiện có |
| **SELF_EVIDENT** | Nhìn vào bất kỳ file code nào là hiểu ngay |
| **REDUNDANT** | Thừa, mơ hồ, hoặc mâu thuẫn với code thực tế |

---

## 3. Phát hiện Quan trọng

### 3.1 Tỷ lệ phân bổ các rule

Sau khi phân tích toàn bộ 21 sections:

| Mức | Số rules | % tổng |
|-----|---------|--------|
| **CRITICAL** | 15 | ~18% |
| HELPFUL | 22 | ~27% |
| SELF_EVIDENT | 28 | ~34% |
| REDUNDANT | 17 | ~21% |

**Kết luận:** Chỉ ~18% nội dung CODING_RULES là thực sự cần thiết phải nằm trong active context.

### 3.2 Năm lỗi nghiêm trọng trong CODING_RULES hiện tại

Đây là phát hiện quan trọng nhất: **CODING_RULES hiện tại có lỗi sai** — AI nếu follow đúng rule sẽ viết code không biên dịch được hoặc không khớp với codebase.

#### Lỗi 1 — Kiểu dữ liệu `deleted` bị ghi sai

| | CODING_RULES ghi | Code thực tế (`vdbas_quantri_be`) |
|-|-----------------|----------------------------------|
| Kiểu | `Boolean deleted = Boolean.FALSE` | `Integer deleted = 0` với `@JdbcTypeCode(SqlTypes.NUMERIC)` |
| JPQL | `SET e.deleted = true` | `SET e.deleted = 1` |

AI nếu tạo entity mới theo CODING_RULES sẽ dùng `Boolean`, nhưng schema DB và các entity hiện tại dùng `Integer`. Đây là lỗi **silent** — không có compile error, chỉ fail lúc runtime khi execute JPQL.

#### Lỗi 2 — DTO example gây compile error

CODING_RULES (Section 4) cho ví dụ:
```java
// ❌ SAI — sẽ gây compile error
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto extends BaseAuditingDto { ... }
```

Code thực tế (`AdministrativeUnitDto.java`, `ApplicationDto.java`) dùng:
```java
// ✅ ĐÚNG
@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryDto extends BaseAuditingDto { ... }
```

**Lý do:** `@Builder` trên child class khi parent class không có `@Builder` gây lỗi `no suitable constructor`. `@AllArgsConstructor` trên child không include fields từ parent. AI follow đúng ví dụ trong rule sẽ tạo ra code không biên dịch được.

#### Lỗi 3 — Entity suffix rule mơ hồ

CODING_RULES viết: *"Entity | PascalCase + Entity suffix (optional, consistent within codebase)"*

Từ "optional" gây mơ hồ. Nhưng khi agent đọc toàn bộ codebase, 100% entity trong `vdbas_quantri_be` **không có suffix**: `AdministrativeUnit`, `Role`, `Application`, `Permission`. AI có xu hướng thêm suffix `Entity` theo Spring convention phổ biến trong training data.

#### Lỗi 4 — DTO audit field mâu thuẫn

CODING_RULES Quick Reference (dòng 409): *"DTO audit fields: Declared flat in every DTO — do not extend a base class"*

Nhưng `vdbas_quantri_be` dùng `BaseAuditingDto` từ `com.fis.vdbas.common.dto`. AI không biết class này tồn tại ở common module nếu không có rule. Hai rule mâu thuẫn nhau trong cùng một document.

#### Lỗi 5 — Package typo `servcie` hoàn toàn vắng mặt

Agent scout đọc toàn bộ project phát hiện: **tất cả** service packages trong `vdbas_quantri_be` dùng `servcie` (sai chính tả, không phải `service`):

```
com.fis.vdbas.qtdc.application.administrative.servcie
com.fis.vdbas.qtdc.application.auth.servcie
com.fis.vdbas.qtdc.application.profile.servcie
com.fis.vdbas.qtdc.application.user.servcie
```

CODING_RULES không đề cập đến điều này. AI tạo file mới sẽ dùng `service` đúng chính tả → Spring component scan không nhận diện → bean không được tạo → `NullPointerException` lúc runtime.

---

## 4. Phân tích Chi tiết: Rule nào Thực sự Cần?

### 4.1 Các rule CRITICAL (AI không thể tự suy ra)

Dưới đây là 15 rules mà cả hai verifier agent đồng thuận là CRITICAL, với lý do kỹ thuật cụ thể:

---

**R1: `api/` cấm import `domain/` trực tiếp**

*Tại sao cần rule:* AI có xu hướng inject `Repository` thẳng vào `Controller` — đây là pattern xuất hiện nhiều trong training data. Khi đọc một file controller riêng lẻ, không thể suy ra constraint này từ code. Maven multi-module không luôn enforce nếu `pom.xml` chưa cấu hình strict.

*Hậu quả nếu vi phạm:* Vi phạm Clean Architecture, domain logic rò rỉ lên HTTP layer, khó test.

```java
// ❌ AI hay làm — sai
@RestController
public class CategoryController {
    private final CategoryRepository repository; // import từ domain/
}

// ✅ Đúng
@RestController
public class CategoryController {
    private final CategoryService service; // import từ application/
}
```

---

**R2: Entity extend `AbstractAuditing<UUID>` — không khai báo lại audit fields**

*Tại sao cần rule:* AI không biết `AbstractAuditing` tồn tại ở `common` module. Nếu không có rule, AI sẽ khai báo `createdAt`, `updatedAt`, `createdBy`, `updatedBy` trực tiếp trên entity → duplicate column mapping error của JPA.

---

**R3: NO `@Data` trên entity — dùng `@Getter + @Setter + @NoArgsConstructor + @ToString`**

*Tại sao CRITICAL (không chỉ HELPFUL):* Agent ban đầu phân loại là HELPFUL, verifier đã nâng lên CRITICAL vì:

- `@Data` generate `equals()`/`hashCode()` dựa trên **tất cả fields**
- Với lazy-loaded association (entity `parent`), `toString()` trigger lazy load → `StackOverflowError`
- Hibernate dirty-checking bị phá vỡ vì `hashCode()` thay đổi sau persist

*Đây là AI gotcha phổ biến nhất với JPA.* AI modern (kể cả GPT-4, Claude) vẫn hay dùng `@Data` vì tiện.

---

**R4: Entity KHÔNG dùng suffix `Entity`**

*Tại sao CRITICAL:* AI training data chứa rất nhiều codebase dùng `UserEntity`, `OrderEntity`. Không có rule tường minh, AI sẽ tự thêm suffix. Kết quả: tên class không khớp với code hiện có, gây confusion và inconsistency.

---

**R5: UUID PK: `@GeneratedValue(strategy = GenerationType.UUID)` + `columnDefinition = "uuid"`**

*Tại sao CRITICAL:*

- Hibernate 6 thay đổi behavior của `GenerationType.AUTO` — tạo sequence-based `Long` ID thay vì UUID
- Thiếu `columnDefinition = "uuid"` gây type mismatch với PostgreSQL `uuid` column type
- Không có compile error — lỗi chỉ xuất hiện lúc runtime khi INSERT

---

**R6: `FetchType.LAZY` trên tất cả `@ManyToOne`**

*Tại sao CRITICAL (không chỉ HELPFUL):* JPA **default** của `@ManyToOne` là `EAGER` — counterintuitive. AI và nhiều developer quên override. `EAGER` trên entity cha gây N+1 problem: query 100 records → 100+1 queries thực thi.

---

**R7: Cấm bidirectional `@OneToMany`**

*Tại sao CRITICAL:* Hoàn toàn counterintuitive với JPA convention chuẩn. AI luôn tạo bidirectional relationship theo habit. Project này dùng pattern `parentId (UUID)` field + separate query — không có rule tường minh AI sẽ không biết.

---

**R8: JSONB: `@JdbcTypeCode(SqlTypes.JSON)` + `columnDefinition = "jsonb"`**

*Tại sao CRITICAL:* AI dùng `@Column` thông thường cho JSON field → **không có compile error** → fail lúc runtime khi thực thi INSERT/SELECT với PostgreSQL `jsonb` column.

---

**R9: Column names từ `init_db.sql` — không tự đặt tên**

*Tại sao CRITICAL:* AI không thể tự suy ra `source of truth` là SQL file. Sẽ tự đặt tên theo Java convention (camelCase → snake_case tự động), dẫn đến mismatch với schema thực tế.

---

**R10: Soft-delete JPQL — `deleted = 1` (Integer), KHÔNG phải `true`; luôn include `endDate`**

*Tại sao CRITICAL:* Hai gotcha trong một:
1. `vdbas_quantri_be` dùng `Integer` cho `deleted`, JPQL phải dùng `= 1` không phải `= true`
2. AI hay chỉ set `deleted` mà quên `endDate` → logic incomplete, không có exception

---

**R11: DTO extend `BaseAuditingDto` — không khai báo lại audit fields**

*Tại sao CRITICAL:* AI không biết `BaseAuditingDto` tồn tại ở `com.fis.vdbas.common.dto`. Không có rule này AI sẽ khai báo flat.

---

**R12: Child DTO chỉ `@Data + @EqualsAndHashCode(callSuper = true)` — không dùng `@Builder/@AllArgsConstructor`**

*Tại sao CRITICAL:*
- `@Builder` trên child class khi parent không có `@Builder` → compile error
- `@AllArgsConstructor` trên child không include parent fields
- AI sẽ follow ví dụ **sai** trong CODING_RULES hiện tại (Lỗi #2 ở phần 3.2)

---

**R13: `@Builder.Default` trên `children` field trong TreeDto**

*Tại sao CRITICAL:* Lombok `@Builder` ignore field initializer (`= new ArrayList<>()`) trừ khi có `@Builder.Default`. Kết quả: `children = null` sau `builder().build()` → `NullPointerException` khi iterate tree. Lỗi **silent** và khó debug.

---

**R14: Mapper ignore `endDate` trong `toEntity`/`updateEntityFromDto`**

*Tại sao CRITICAL:* Không có `@Mapping(target = "endDate", ignore = true)` → MapStruct map `endDate` từ request DTO vào entity → client có thể **ghi đè soft-delete timestamp** tùy ý → lỗ hổng bảo mật nhỏ nhưng có tác động thực tế.

---

**R15: Package typo `servcie` — chỉ áp dụng cho `vdbas_quantri_be`**

*Tại sao CRITICAL:* Typo này nhất quán 100% trong toàn codebase. AI dùng đúng chính tả `service` → Spring không scan → `UnsatisfiedDependencyException` lúc startup.

---

### 4.2 Các rule SELF_EVIDENT (có thể bỏ khỏi active context)

Những rule này **hiện diện rõ ràng** trong code — agent scout đọc codebase trực tiếp mà không đọc CODING_RULES vẫn phát hiện được:

| Rule | Lý do Self-Evident |
|------|-------------------|
| Multi-module layout | Thấy ngay từ `pom.xml` và cấu trúc thư mục |
| Package tổ chức theo feature | Thấy ngay khi `ls` thư mục `application/` |
| Method naming (`findAll*`, `get`, `search`, `create`, `update`, `delete`) | Thấy trong 2-3 service file bất kỳ |
| `log` variable từ `@Slf4j` | Thấy trong mọi service file |
| `predicates/cb/root/query` trong Specification | Thấy trong mọi `filter()` method |
| `@Service`, `@Repository`, `@RestController` annotations | Spring convention phổ biến trong training data |
| `@RequiredArgsConstructor` + `final` fields | Thấy trong mọi service, controller |

### 4.3 Các rule REDUNDANT (cần xem lại hoặc xóa)

| Rule | Vấn đề |
|------|--------|
| Prose giải thích WHY của từng rule | Thêm token noise; AI chỉ cần pattern đúng để follow |
| Entity suffix "optional" | Từ "optional" gây mơ hồ — code thực tế là 0% dùng suffix |
| Dependency direction (đoạn văn dài) | Giữ 1 dòng "forbidden import" trong Tier 1 là đủ |
| Clean Architecture prose explanation | AI hiểu Clean Architecture từ training data |
| Spring Web/Security cấm trong `domain/` | Self-evident với Clean Architecture |

---

## 5. Đề xuất Tái cấu trúc: Hệ thống 3 Tầng

### Nguyên lý

Thay vì một file monolithic 1.676 dòng, tổ chức thành 3 tầng theo mức độ cần thiết:

```
Tier 1: CODING_RULES_CORE.md        (~120-150 lines, luôn load)
Tier 2: CODING_RULES_FEATURE.md     (~300 lines, load khi cần)
Tier 3: CODING_RULES_REFERENCE.md   (~1.200 lines, chỉ lookup)
```

### Tier 1 — Core Rules (luôn load, < 150 lines)

**Nguyên tắc viết:** Chỉ code snippets và bảng, không có prose giải thích. Mỗi snippet tối đa 15 dòng.

Nội dung gồm:

1. **Bảng Quick Gotchas** (10 dòng) — các lỗi AI hay mắc nhất
2. **Entity skeleton** (15 dòng) — template copy-paste đúng
3. **DTO skeleton** (12 dòng) — template copy-paste đúng
4. **Repository signature** (5 dòng) — bao gồm soft-delete JPQL đúng
5. **Forbidden imports** (3 dòng) — `api/` không import `domain/`
6. **Project-specific note** (3 dòng) — `servcie` typo, `Integer deleted`

Ước tính: **~120-150 lines** thay vì ~400 lines "phần quan trọng" hiện tại.

### Tier 2 — Feature-Specific (load khi làm feature liên quan)

| Section | Khi nào load |
|---------|-------------|
| Tree/Hierarchy + `buildTree()` với `LinkedHashMap` | Khi entity có `parentId` field |
| SearchDto + `JpaSpecificationExecutor` + dynamic predicates | Khi implement search/filter endpoint |
| Cascade soft-delete pattern | Khi entity parent có child entities |
| JSONB full deserialization config | Khi thêm JSON column mới |
| `api-integration` / `application-integration` patterns | Khi làm cross-service integration |
| Validation message key conventions | Khi thêm DTO validation |

### Tier 3 — Reference (không preload, chỉ tra cứu)

- Toàn bộ prose giải thích lý do tại sao rule tồn tại
- Full column mapping từ `init_db.sql`
- Integration module patterns chi tiết
- Lịch sử quyết định thiết kế

---

## 6. Tác động Ước tính

| Metric | Hiện tại | Sau tái cấu trúc | Cải thiện |
|--------|---------|-----------------|-----------|
| Lines trong active context | ~1.676 | ~120-150 | **-91%** |
| Token tiêu tốn mỗi session | ~8.000-10.000 tokens | ~600-750 tokens | **-92%** |
| Rules thực sự cần thiết | Không rõ | 15 rules CRITICAL | Rõ ràng |
| Lỗi sai trong CODING_RULES | 5 lỗi chưa phát hiện | 0 (sau khi fix) | Chuẩn |

*Lưu ý: Tier 2 thêm ~50-80 lines khi làm feature có hierarchy/search. Vẫn tiết kiệm ~85% so với hiện tại.*

---

## 7. Kế hoạch Hành động

### Bước 1 — Sửa lỗi ngay (ưu tiên cao nhất, thực hiện trước khi dùng AI)

Các lỗi này **đang gây ra code sai** nếu AI follow CODING_RULES:

- [ ] **Lỗi #1:** Đổi `Boolean deleted = Boolean.FALSE` → `Integer deleted = 0` + `@JdbcTypeCode(SqlTypes.NUMERIC)` trong tất cả ví dụ Entity
- [ ] **Lỗi #1 (JPQL):** Đổi `SET e.deleted = true` → `SET e.deleted = 1` trong tất cả ví dụ Repository
- [ ] **Lỗi #2:** Xóa `@Builder`, `@AllArgsConstructor`, `@NoArgsConstructor` khỏi ví dụ child DTO extends BaseAuditingDto
- [ ] **Lỗi #3:** Đổi Entity suffix rule từ "optional" → tường minh "FORBIDDEN: không dùng `Entity` suffix"
- [ ] **Lỗi #4:** Tách note rõ ràng: template (`vdbas_exp_be`) dùng flat audit fields; `vdbas_quantri_be` dùng `BaseAuditingDto`
- [ ] **Lỗi #5:** Thêm vào đầu CODING_RULES: *"`vdbas_quantri_be` ONLY: service package folder là `servcie` (typo được giữ nguyên để nhất quán)"*

### Bước 2 — Tạo `CODING_RULES_CORE.md` (Tier 1)

Viết lại 15 CRITICAL rules dưới dạng code snippets và bảng, mục tiêu < 150 lines.

### Bước 3 — Restructure thành 3 tầng

Tách file hiện có thành `CORE`, `FEATURE`, `REFERENCE`.

### Bước 4 — Cập nhật `.claude/rules/` config

Cấu hình để chỉ load `CODING_RULES_CORE.md` mặc định; các Tier 2/3 được referenced khi cần.

---

## 8. Tóm tắt cho Team

> **Vấn đề:** CODING_RULES hiện tại (1.676 dòng) chứa ~82% nội dung mà AI có thể tự suy ra từ code, đồng thời có 5 lỗi sai đang khiến AI tạo ra code không đúng.
>
> **Giải pháp:** Tổ chức lại thành 3 tầng — chỉ ~15 rules thực sự CRITICAL cần ở trong active context, còn lại là feature-specific (load khi cần) hoặc reference (tra cứu khi cần).
>
> **Lợi ích ngay lập tức:**
> - Fix 5 lỗi sai trong CODING_RULES → AI không tạo code broken nữa
> - Giảm ~91% context tiêu tốn → AI response nhanh hơn, ít hallucination hơn
> - 15 CRITICAL rules rõ ràng → dễ onboard member mới, dễ review AI output

---

*Báo cáo được tạo bởi multi-agent analysis pipeline. Kết quả dựa trên 14 agents đọc trực tiếp codebase `vdbas_quantri_be`, không dựa trên assumption.*
