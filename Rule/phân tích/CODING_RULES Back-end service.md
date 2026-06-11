# Coding Rules — vdbas_template_be

All entities, DTOs, mappers, repositories, services, and controllers created in this project must follow these rules. The rules are derived directly from the **actual codebase** (including the `category` sample feature) and must be treated as mandatory conventions.

---

## Table of Contents

1. [Project Structure & Architecture](#1-project-structure--architecture)
2. [Naming Conventions](#2-naming-conventions)
3. [Entity Rules](#3-entity-rules)
4. [DTO Rules](#4-dto-rules)
5. [Repository Rules](#5-repository-rules)
6. [Service Rules](#6-service-rules)
7. [Controller Rules](#7-controller-rules)
8. [Mapper Rules](#8-mapper-rules)
9. [Exception Handling Rules](#9-exception-handling-rules)
10. [Security & Authorization Rules](#10-security--authorization-rules)
11. [Pagination Rules](#11-pagination-rules)
12. [Caching Rules](#12-caching-rules)
13. [Auditing Rules](#13-auditing-rules)
14. [Constants & Enums Rules](#14-constants--enums-rules)
15. [Configuration Rules](#15-configuration-rules)
16. [Internationalization (i18n) Rules](#16-internationalization-i18n-rules)
17. [Soft Delete Rules](#17-soft-delete-rules)
18. [Hierarchy & Tree Rules](#18-hierarchy--tree-rules)
19. [Import Rules](#19-import-rules)
20. [Lombok & Annotation Rules](#20-lombok--annotation-rules)
21. [Logging Strategy](#21-logging-strategy)

---

## 1. Project Structure & Architecture

### Multi-Module Layout

```
vdbas_template_be/
├── common/      # Shared constants, enums, utils — NO Spring deps, NO JPA
├── domain/      # JPA entities + repositories (database layer)
├── application/ # Services, DTOs, mappers (business layer)
└── api/         # REST controllers, security, exception handling (HTTP layer)
```

### Dependency Direction (Clean Architecture)

```
api  →  application  →  domain  →  common
```

**Rules:**
- `common/` must **never** import from any other module.
- `domain/` may only import from `common/`. No service or controller code.
- `application/` may import from `domain/` and `common/`. No HTTP/controller code.
- `api/` imports from `application/` and `common/`. **Never** imports from `domain/` directly.
- Never add Spring Web or Spring Security annotations in `domain/` or `common/`.

### Package Organization (by Feature/Domain)

Each domain feature has mirrored sub-packages across all modules:

```
api/src/main/java/com/fis/template/
  └── api/{feature}/
        └── {Feature}Controller.java

application/src/main/java/com/fis/template/
  └── application/{feature}/
        ├── dto/
        │   ├── {Feature}Dto.java
        │   ├── {Feature}SearchDto.java
        │   └── {Feature}TreeDto.java    # only for hierarchical entities
        ├── mapper/
        │   └── {Feature}Mapper.java
        └── service/
              └── {Feature}Service.java

domain/src/main/java/com/fis/template/
  └── domain/{feature}/
        ├── {Feature}.java               # Entity class (no "Entity" suffix)
        └── {Feature}Repository.java

common/src/main/java/com/fis/template/
  └── common/
        ├── Constants.java
        ├── CacheConstants.java
        ├── enums/
        │   └── {EnumName}.java
        └── util/
              └── TokenUtils.java
```

**Rules:**
- One controller, one service, one repository, one mapper per domain entity.
- All packages share the root prefix `com.fis.template`.
- Services live in a `service/` sub-package under the feature package, not at the feature package root.
- Test classes mirror the production package structure under `src/test/java/`.

---

## 2. Naming Conventions

### Classes

| Type | Convention | Example |
|------|-----------|---------|
| Entity | PascalCase (no suffix) | `CategoryGroup`, `Category`, `User` |
| DTO | PascalCase + `Dto` suffix | `CategoryGroupDto`, `CategoryDto` |
| Search DTO | PascalCase + `SearchDto` suffix | `CategoryGroupSearchDto`, `CategorySearchDto` |
| Tree DTO | PascalCase + `TreeDto` suffix | `CategoryTreeDto` |
| Mapper | PascalCase + `Mapper` suffix | `CategoryGroupMapper`, `CategoryMapper` |
| Repository | PascalCase + `Repository` suffix | `CategoryGroupRepository` |
| Service | PascalCase + `Service` suffix | `CategoryGroupService`, `CategoryService` |
| Controller | PascalCase + `Controller` suffix | `CategoryGroupController`, `CategoryController` |
| Exception | PascalCase + `Exception` suffix | `ResourceNotFoundException` |
| Config class | PascalCase + `Config` suffix | `SecurityConfig`, `CacheConfig` |
| Constants holder | PascalCase, nested static classes | `Constants`, `CacheConstants` |

### Methods

| Type | Convention | Example |
|------|-----------|---------|
| List all (no pagination) | `findAll*()` | `findAllActive()`, `findAllByGroupCode(groupCode)` |
| Get by primary key | `get(UUID id)` | `get(id)` |
| Get by business key | `getBy{Field}({value})` | `getByCode(groupCode)` |
| Search paginated | `search(SearchDto)` | `search(criteria)` |
| Create | `create(Dto)` | `create(input)` |
| Update | `update(UUID id, Dto)` | `update(id, input)` |
| Delete | `delete(UUID id)` | `delete(id)` |
| Private filter builder | `filter(SearchDto)` | `filter(criteria)` |
| Private hierarchy compute | `computeHierarchyFields(Entity)` | `computeHierarchyFields(entity)` |
| Private tree builder | `buildTree(List<Entity>)` | `buildTree(all)` |
| Repository soft-delete | `softDelete(@Param("id") UUID id)` | `softDelete(id)` |
| Repository cascade soft-delete | `softDeleteBy{Field}(value)` | `softDeleteByGroupCode(groupCode)` |

### Fields & Variables

- Entity fields: `camelCase` matching DB column snake_case equivalent (e.g., `groupCode` ↔ `group_code`)
- Boolean soft-delete field: always named `deleted` (not `isDeleted`)
- Serial UID: always `private static final long serialVersionUID = 1L` with `@Serial`
- Log variable: `log` (from `@Slf4j`)
- Specification query builder variables: `predicates`, `cb`, `root`, `query`
- Tree map variable: `nodeMap` (using `LinkedHashMap` to preserve insertion order)

---

## 3. Entity Rules

### Base Classes

**`AbstractAuditing<T>`** — for entities that need full audit trail (created + updated tracking):

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Data
public abstract class AbstractAuditing<T> implements Serializable {
    public abstract T getId();

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**`AbstractAuditingCreate<T>`** — for append-only entities (e.g., `SystemIntegrationLog`):

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Data
public abstract class AbstractAuditingCreate<T> implements Serializable {
    public abstract T getId();

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

### Standard Entity Structure

Based on `CategoryGroup` and `Category` in `domain/category/`:

```java
@Entity
@Table(name = "category_groups")
@Getter
@Setter
@NoArgsConstructor
@ToString
public class CategoryGroup extends AbstractAuditing<UUID> {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "group_code", nullable = false, length = 50, unique = true)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 255)
    private String groupName;

    @Column(name = "group_name_en", length = 255)
    private String groupNameEn;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "active", nullable = false)
    private Boolean active = Boolean.TRUE;

    // JSONB column for extensible attributes
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ext_attributes", columnDefinition = "jsonb")
    private Map<String, Object> extAttributes;

    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted = Boolean.FALSE;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Override
    public UUID getId() { return id; }
}
```

**For hierarchical entities**, add `parent_id` + read-only join + hierarchy computed fields, and **exclude the lazy join from `@ToString`**:

```java
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "parent")           // ← NEVER include lazy associations in toString
public class Category extends AbstractAuditing<UUID> {

    @Serial
    private static final long serialVersionUID = 1L;

    // ... other fields ...

    @Column(name = "parent_id")
    private UUID parentId;

    // Read-only join — writes always go through parentId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private Category parent;

    @Column(name = "cat_level")
    private Integer catLevel = 1;

    @Column(name = "cat_path", length = 2000)
    private String catPath;

    @Override
    public UUID getId() { return id; }
}
```

### Entity Rules

- **Always** extend `AbstractAuditing<UUID>` (or `AbstractAuditingCreate<UUID>` for append-only) and implement `getId()`.
- **Always** declare `@Serial private static final long serialVersionUID = 1L` in every entity.
- **Always** use `@GeneratedValue(strategy = GenerationType.UUID)` for UUID primary keys.
- **Always** annotate UUID columns with `columnDefinition = "uuid"`.
- **Always** use `FetchType.LAZY` for all `@ManyToOne` relationships.
- **Always** annotate JSONB columns with `@JdbcTypeCode(SqlTypes.JSON)` and `columnDefinition = "jsonb"`.
- **Never** use `@Data` on entities. Use `@Getter`, `@Setter`, `@NoArgsConstructor`, `@ToString` separately.
- **Never** use bidirectional `@OneToMany` — prefer `parentId` field + separate query.
- **Always** exclude lazy-loaded associations from `@ToString` via `exclude = {"fieldName"}`.
- The `deleted` field is always `Boolean` (not `boolean`) initialized to `Boolean.FALSE`.
- The `endDate` field (`LocalDateTime`) is always set together with `deleted = true` during soft-delete.
- Column names must **exactly match** the DB schema in `db/migration/`.

---

## 4. DTO Rules

### Standard DTO

Audit fields are declared **flat** in every DTO that needs them — no base class inheritance:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryGroupDto {

    private UUID id;

    @NotBlank(message = "{category_group.groupCode.required}")
    @Size(max = 50, message = "{category_group.groupCode.size}")
    private String groupCode;

    @NotBlank(message = "{category_group.groupName.required}")
    @Size(max = 255, message = "{category_group.groupName.size}")
    private String groupName;

    @Size(max = 255, message = "{category_group.groupNameEn.size}")
    private String groupNameEn;

    private Integer orderIndex;
    private Boolean active;
    private Map<String, Object> extAttributes;

    // Audit fields — read-only, never accepted from the client
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Boolean deleted;
}
```

### Search DTO

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryGroupSearchDto {

    private int page = 0;
    private int size = 20;
    private String sortBy = "orderIndex";   // default sort matches the common use case
    private String sortDirection = "asc";

    // Filter fields
    private String groupCode;
    private String groupName;
    private Boolean active;
    private Boolean deleted;
}
```

### Pagination Response DTO

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponseDto<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
```

### Tree DTO

`children` must use `@Builder.Default` so that `PageResponseDto.builder()` also starts with an empty list:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryTreeDto {

    private UUID id;
    private String groupCode;
    private String itemCode;
    private String itemName;
    private UUID parentId;
    private Integer catLevel;
    private String catPath;
    private Integer orderIndex;

    @Builder.Default
    private List<CategoryTreeDto> children = new ArrayList<>();
}
```

### DTO Rules

- **Always** use `@Data @NoArgsConstructor @AllArgsConstructor @Builder` on all DTOs.
- **Always** declare audit fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deleted`) flat in the DTO — do not extend a base class.
- **Always** use message key strings (`"{entity.field.rule}"`) for validation messages — never hardcode human-readable text.
- **Always** validate at the DTO level using Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@Size`, `@Valid`).
- Audit fields are **read-only** — the client may never supply them; the mapper ignores them on `toEntity`.
- Search DTOs must provide default values for `page` (0), `size` (20), `sortBy`, and `sortDirection`.
- Tree DTOs must use `@Builder.Default` on the `children` field.
- Server-computed fields (`catLevel`, `catPath`) are declared in the DTO but annotated as `@Mapping(target = ..., ignore = true)` in the mapper — they are set by the service, never from the client.
- **Never** use the same DTO for both request and search — create a dedicated `SearchDto`.

---

## 5. Repository Rules

### Standard Repository

```java
@Repository
public interface CategoryGroupRepository extends
        JpaRepository<CategoryGroup, UUID>,
        JpaSpecificationExecutor<CategoryGroup> {

    boolean existsByGroupCodeAndDeletedIsFalse(String groupCode);

    Optional<CategoryGroup> findByGroupCodeAndDeletedIsFalse(String groupCode);

    List<CategoryGroup> findByDeletedIsFalseOrderByOrderIndexAsc();

    @Modifying
    @Query("UPDATE CategoryGroup e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);
}
```

### Cascade Soft-Delete

When a parent entity is deleted, cascade by adding a bulk soft-delete method keyed on the parent's business field:

```java
// In CategoryRepository — called by CategoryGroupService.delete()
@Modifying
@Query("UPDATE Category e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.groupCode = :groupCode")
void softDeleteByGroupCode(@Param("groupCode") String groupCode);
```

### Repository Rules

- **Always** extend both `JpaRepository<Entity, UUID>` and `JpaSpecificationExecutor<Entity>`.
- **Always** append `AndDeletedIsFalse` to derived query methods to exclude soft-deleted records.
- **Always** use `@Modifying` + `@Query` for soft-delete. The JPQL must set `deleted = true` AND `endDate = CURRENT_TIMESTAMP` together.
- **Never** implement hard-delete (`deleteById`) for entities with soft-delete support.
- Complex dynamic queries go in the service via `Specification<T>`, not in the repository.
- `@Param` annotation is required on all `@Query` named parameters.
- Add `softDeleteBy{ParentField}()` methods when child entities need cascade deletion.

---

## 6. Service Rules

### Class Declaration

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CategoryGroupService {

    private final CategoryGroupRepository repository;
    private final CategoryGroupMapper mapper;
    private final CategoryRepository categoryRepository;  // injected for cascade delete
}
```

### Section Separators

Use ASCII dividers to split the service into three visual sections:

```java
// ─── Queries ───────────────────────────────────────────────────────────────

// ─── Commands ──────────────────────────────────────────────────────────────

// ─── Private ───────────────────────────────────────────────────────────────
```

### Standard CRUD Methods

```java
// ─── Queries ───────────────────────────────────────────────────────────────

@Cacheable(value = CacheConstants.CATEGORY_GROUP_CACHE, key = "'all_active'")
public List<CategoryGroupDto> findAllActive() {
    return mapper.toDtoList(repository.findByDeletedIsFalseOrderByOrderIndexAsc());
}

public PageResponseDto<CategoryGroupDto> search(CategoryGroupSearchDto criteria) {
    Sort.Direction direction = "asc".equalsIgnoreCase(criteria.getSortDirection())
            ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(
            criteria.getPage(), criteria.getSize(),
            Sort.by(direction, criteria.getSortBy()));

    Page<CategoryGroup> page = repository.findAll(filter(criteria), pageable);

    return PageResponseDto.<CategoryGroupDto>builder()
            .content(mapper.toDtoList(page.getContent()))
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .build();
}

public CategoryGroupDto get(UUID id) {
    return repository.findById(id)
            .map(mapper::toDto)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                    Constants.Resource.CATEGORY_GROUP,
                    "id",
                    id.toString()));
}

// Lookup by business code — exposed as GET /code/{groupCode}
public CategoryGroupDto getByCode(String groupCode) {
    return repository.findByGroupCodeAndDeletedIsFalse(groupCode)
            .map(mapper::toDto)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                    Constants.Resource.CATEGORY_GROUP,
                    "groupCode",
                    groupCode));
}

// ─── Commands ──────────────────────────────────────────────────────────────

@Transactional
@CacheEvict(value = CacheConstants.CATEGORY_GROUP_CACHE, allEntries = true)
public CategoryGroupDto create(CategoryGroupDto input) {
    if (log.isDebugEnabled()) {
        log.debug("create category group with input: {}", input);
    }
    if (repository.existsByGroupCodeAndDeletedIsFalse(input.getGroupCode())) {
        throw new DuplicateResourceException(
                Constants.ErrorCode.CATEGORY_GROUP_CODE_DUPLICATE,
                Constants.MessageKey.CATEGORY_GROUP_CODE_DUPLICATE,
                Constants.Resource.CATEGORY_GROUP,
                "groupCode",
                input.getGroupCode());
    }
    CategoryGroup entity = mapper.toEntity(input);
    entity = repository.save(entity);
    return mapper.toDto(entity);
}

@Transactional
@CacheEvict(value = CacheConstants.CATEGORY_GROUP_CACHE, allEntries = true)
public CategoryGroupDto update(UUID id, CategoryGroupDto input) {
    CategoryGroup entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                    Constants.Resource.CATEGORY_GROUP,
                    "id",
                    id.toString()));

    // Uniqueness check only when the code is actually changing
    if (!entity.getGroupCode().equals(input.getGroupCode())
            && repository.existsByGroupCodeAndDeletedIsFalse(input.getGroupCode())) {
        throw new DuplicateResourceException(
                Constants.ErrorCode.CATEGORY_GROUP_CODE_DUPLICATE,
                Constants.MessageKey.CATEGORY_GROUP_CODE_DUPLICATE,
                Constants.Resource.CATEGORY_GROUP,
                "groupCode",
                input.getGroupCode());
    }

    mapper.updateEntityFromDto(input, entity);
    entity = repository.save(entity);
    return mapper.toDto(entity);
}

// When delete must cascade to child entities, load first to get the business key,
// then call the child repository's bulk soft-delete before soft-deleting the parent.
@Transactional
@Caching(evict = {
    @CacheEvict(value = CacheConstants.CATEGORY_GROUP_CACHE, allEntries = true),
    @CacheEvict(value = CacheConstants.CATEGORY_CACHE,       allEntries = true)
})
public void delete(UUID id) {
    CategoryGroup entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,
                    Constants.Resource.CATEGORY_GROUP,
                    "id",
                    id.toString()));

    categoryRepository.softDeleteByGroupCode(entity.getGroupCode()); // cascade
    repository.softDelete(id);
}
```

### Specification Filter (Private Method)

```java
// ─── Private ───────────────────────────────────────────────────────────────

private Specification<CategoryGroup> filter(CategoryGroupSearchDto criteria) {
    return (root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();

        // String LIKE — always case-insensitive
        if (criteria.getGroupCode() != null && !criteria.getGroupCode().isBlank()) {
            predicates.add(cb.like(
                    cb.lower(root.get("groupCode")),
                    "%" + criteria.getGroupCode().toLowerCase() + "%"));
        }

        // Boolean equality
        if (criteria.getActive() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.getActive()));
        }

        // Default: exclude deleted unless caller explicitly requests them
        if (criteria.getDeleted() != null) {
            predicates.add(cb.equal(root.get("deleted"), criteria.getDeleted()));
        } else {
            predicates.add(cb.equal(root.get("deleted"), Boolean.FALSE));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    };
}
```

### Service Rules

- **Always** annotate the class with `@Transactional(readOnly = true)`.
- **Always** override write methods (`create`, `update`, `delete`) with `@Transactional`.
- **Always** use the three section separators (`Queries / Commands / Private`) to structure service code.
- **Never** create a separate service interface — a single `@Service` class is the standard.
- **Always** use `@RequiredArgsConstructor` — never `@Autowired` field injection.
- **Never** add `log.debug("start of method")` / `log.debug("end of method")` entry-exit blocks in service methods — request lifecycle logging is handled centrally by `LoggingInterceptor`. See [§21 Logging Strategy](#21-logging-strategy).
- If a service method contains genuinely useful mid-logic debug context (e.g. a computed value, a cache miss), guard it with `if (log.isDebugEnabled())` and log the specific value, not generic entry/exit text.
- **Always** throw typed `BusinessException` subclasses — never raw `RuntimeException` or return `null`.
- **Always** use `Constants.ErrorCode.*`, `Constants.MessageKey.*`, `Constants.Resource.*` — never inline strings.
- Uniqueness check in `update()` must only trigger when the business key field actually changes — always compare current vs. incoming value before querying.
- When `delete()` must cascade to child entities: load the parent first (to retrieve the business key), bulk-soft-delete children, then soft-delete the parent.
- When a single `delete()` must evict multiple caches, use `@Caching(evict = { @CacheEvict(...), ... })`.
- The `filter()` method must default to `deleted = false` unless the caller explicitly passes `deleted = true`.
- **Never** call `repository.delete()` or `repository.deleteById()` on soft-deletable entities.

---

## 7. Controller Rules

### Standard Controller

```java
@RestController
@RequestMapping("/api/category-groups")
@RequiredArgsConstructor
public class CategoryGroupController {

    private final CategoryGroupService service;

    // GET list — cached, used for dropdowns
    @GetMapping
    public List<CategoryGroupDto> findAllActive() {
        return service.findAllActive();
    }

    // GET by primary key
    @GetMapping("/{id}")
    public CategoryGroupDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    // GET by business code — convenient for frontend lookups
    @GetMapping("/code/{groupCode}")
    public CategoryGroupDto getByCode(@PathVariable String groupCode) {
        return service.getByCode(groupCode);
    }

    // POST search — rich filter criteria via request body
    @PostMapping("/search")
    public PageResponseDto<CategoryGroupDto> search(@RequestBody CategoryGroupSearchDto body) {
        return service.search(body);
    }

    // POST create → 201
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryGroupDto create(@Valid @RequestBody CategoryGroupDto body) {
        return service.create(body);
    }

    // PUT update → 200
    @PutMapping("/{id}")
    public CategoryGroupDto update(@PathVariable UUID id, @Valid @RequestBody CategoryGroupDto body) {
        return service.update(id, body);
    }

    // DELETE → 204
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
```

### Tree Endpoint (Hierarchical Entities)

For hierarchical entities expose a dedicated tree endpoint in addition to the flat list:

```java
// Flat list — ordered by orderIndex
@GetMapping("/group/{groupCode}")
public List<CategoryDto> findAllByGroupCode(@PathVariable String groupCode) {
    return service.findAllByGroupCode(groupCode);
}

// Assembled tree — children nested inside parent nodes
@GetMapping("/group/{groupCode}/tree")
public List<CategoryTreeDto> findTreeByGroupCode(@PathVariable String groupCode) {
    return service.findTreeByGroupCode(groupCode);
}
```

### Controller Rules

- **Always** annotate with `@RestController` and `@RequestMapping("/api/{feature}")`.
- **Always** use `@RequiredArgsConstructor` — never `@Autowired`.
- **Always** add `@Valid` to `@RequestBody` parameters that carry validation-annotated DTOs.
- **Never** wrap responses in `ResponseEntity<>` — return the DTO or `void` directly.
- HTTP status mapping:
  - `GET` (list / detail) → **200 OK** (default)
  - `POST` (create) → **201 Created** — add `@ResponseStatus(HttpStatus.CREATED)`
  - `PUT` (update) → **200 OK** (default)
  - `DELETE` → **204 No Content** — add `@ResponseStatus(HttpStatus.NO_CONTENT)`
- Search endpoints always use `@PostMapping("/search")` with `@RequestBody SearchDto`.
- Add `GET /code/{code}` for entities that have a unique business code used by the frontend.
- Add `GET /group/{code}/tree` for hierarchical entities.
- **Never** add business logic in controllers — delegate entirely to the service.
- **Never** import repository classes from a controller.
- Controllers must not be annotated with `@Transactional`.

---

## 8. Mapper Rules

### Standard Mapper

```java
@Mapper(componentModel = "spring")
public interface CategoryGroupMapper {

    CategoryGroupDto toDto(CategoryGroup entity);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)   // set only by soft-delete, never from client
    CategoryGroup toEntity(CategoryGroupDto dto);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)
    void updateEntityFromDto(CategoryGroupDto dto, @MappingTarget CategoryGroup entity);

    List<CategoryGroupDto> toDtoList(List<CategoryGroup> entities);
}
```

### Mapper for Hierarchical Entities

Add `toTreeDto()` with `children` ignored (the service's `buildTree()` wires them), and also ignore all server-computed hierarchy fields:

```java
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryDto toDto(Category entity);

    // children are assembled by buildTree() in the service, never by the mapper
    @Mapping(target = "children", ignore = true)
    CategoryTreeDto toTreeDto(Category entity);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)
    @Mapping(target = "parent",    ignore = true)  // lazy join — write via parentId only
    @Mapping(target = "catLevel",  ignore = true)  // computed by computeHierarchyFields()
    @Mapping(target = "catPath",   ignore = true)  // computed by computeHierarchyFields()
    Category toEntity(CategoryDto dto);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)
    @Mapping(target = "parent",    ignore = true)
    @Mapping(target = "catLevel",  ignore = true)
    @Mapping(target = "catPath",   ignore = true)
    void updateEntityFromDto(CategoryDto dto, @MappingTarget Category entity);

    List<CategoryDto> toDtoList(List<Category> entities);
}
```

### Mapper Rules

- **Always** use `@Mapper(componentModel = "spring")`.
- **Every** mapper exposes: `toDto()`, `toEntity()`, `updateEntityFromDto()`, `toDtoList()`.
- **Always** ignore: `id`, all audit fields, `endDate` in `toEntity` and `updateEntityFromDto`.
- **Always** ignore lazy-loaded relationship fields (`parent`, `group`, etc.) — use the FK field (`parentId`) for writes.
- **Always** ignore server-computed fields (`catLevel`, `catPath`) — they are set by the service, not the mapper.
- For tree entities, add `toTreeDto()` with `@Mapping(target = "children", ignore = true)`.
- **Never** add business logic inside mappers.
- **Never** inject services or repositories into mappers.

---

## 9. Exception Handling Rules

### Custom Exception Hierarchy

```
BusinessException (base)
├── ResourceNotFoundException   → HTTP 404
├── DuplicateResourceException  → HTTP 409
├── InvalidOperationException   → HTTP 400
├── DatabaseConstraintException → HTTP 409
└── AccessDeniedException       → HTTP 403
```

### Exception Constructor Signatures

```java
// ResourceNotFoundException — 5-arg (preferred)
throw new ResourceNotFoundException(
        Constants.ErrorCode.CATEGORY_GROUP_NOT_FOUND,   // errorCode
        Constants.MessageKey.CATEGORY_GROUP_NOT_FOUND,  // messageKey
        Constants.Resource.CATEGORY_GROUP,              // resourceName
        "id",                                           // fieldName
        id.toString());                                 // fieldValue

// DuplicateResourceException — 5-arg (preferred)
throw new DuplicateResourceException(
        Constants.ErrorCode.CATEGORY_GROUP_CODE_DUPLICATE,
        Constants.MessageKey.CATEGORY_GROUP_CODE_DUPLICATE,
        Constants.Resource.CATEGORY_GROUP,
        "groupCode",
        input.getGroupCode());
```

### Error Response DTO

```java
@Data
@Builder
public class ErrorResponseDto {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String errorCode;
    private String path;
    private List<FieldErrorDto> details;  // populated for validation errors
}
```

### Exception Rules

- **Always** throw a typed `BusinessException` subclass matching the HTTP semantic.
- **Always** use `Constants.ErrorCode.*`, `Constants.MessageKey.*`, `Constants.Resource.*` — never inline strings.
- **Never** catch exceptions in services and swallow them silently.
- **Never** throw `NullPointerException` or `IllegalArgumentException` as public API errors — wrap in `InvalidOperationException`.
- `GlobalExceptionHandler` is the **only** place exceptions are mapped to HTTP responses.

---

## 10. Security & Authorization Rules

### JWT Resource Server

Authentication uses OAuth2 JWT. The security filter chain in `SecurityConfig`:

```java
http
    .csrf(csrf -> csrf.disable())
    .cors(Customizer.withDefaults())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
        .requestMatchers("/docs/swagger-ui/**", "/v3/api-docs/**").permitAll()
        .requestMatchers("/api/**").access(dynamicAuthorizationManager)
        .anyRequest().authenticated())
    .oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter)));
```

### Authority Format

| Authority Type | Format | Example |
|---------------|--------|---------|
| Role | `ROLE_<ROLE_CODE>` | `ROLE_TEMPLATE_ADMIN` |
| API Permission | `API:<METHOD>:<PATH>` | `API:POST:/api/category-groups` |

### App Code

```yaml
# application.yml
app:
  code: TEMPLATE
  security:
    default-role: TEMPLATE_ROLE_DEFAULT
```

`app.code` must match the `app_code` column in the `applications` table and the `CLIENT_TEMPLATE` clientId used by integration callers.

### Current User Utility

```java
public final class TokenUtils {
    public static String getUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            return jwtAuth.getToken().getClaimAsString("preferred_username");
        }
        return "system";
    }
}
```

### Security Rules

- **Never** hardcode secrets in Java source code.
- **Never** add `Authorization: Bearer ...` headers manually.
- **Never** use `@PreAuthorize` on controller methods — authorization goes through `DynamicAuthorizationManager`.
- Actuator health/info and Swagger UI must remain publicly accessible.
- CSRF must remain disabled — the API is stateless.
- `TokenUtils.getUsername()` is the **only** allowed way to get the current user's identity.
- **Never** call `SecurityContextHolder` from entity, repository, DTO, or mapper classes.

---

## 11. Pagination Rules

### Request Format

```java
// In every SearchDto
private int page = 0;              // 0-indexed
private int size = 20;
private String sortBy = "orderIndex";   // entity field name; use "createdAt" for audit-heavy entities
private String sortDirection = "asc";
```

### Service Implementation

```java
Sort.Direction direction = "asc".equalsIgnoreCase(criteria.getSortDirection())
        ? Sort.Direction.ASC : Sort.Direction.DESC;
Pageable pageable = PageRequest.of(
        criteria.getPage(), criteria.getSize(),
        Sort.by(direction, criteria.getSortBy()));

Page<Entity> page = repository.findAll(filter(criteria), pageable);

return PageResponseDto.<EntityDto>builder()
        .content(mapper.toDtoList(page.getContent()))
        .page(page.getNumber())
        .size(page.getSize())
        .totalElements(page.getTotalElements())
        .totalPages(page.getTotalPages())
        .build();
```

### Response Format

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

### Pagination Rules

- **Always** use 0-based page indexing.
- **Always** return `PageResponseDto<T>` — never return Spring's `Page<T>` or `Slice<T>`.
- Default page size is `20`. Validate in service: throw `InvalidOperationException` if `size > 200`.
- `sortBy` must reference a valid entity field. Invalid sort fields default to `createdAt`.

---

## 12. Caching Rules

### Cache Constants

```java
// common/src/.../common/CacheConstants.java
public final class CacheConstants {
    private CacheConstants() {}

    // Auth infrastructure caches — managed by the security layer, never evict from business services
    public static final String USER_PERMISSIONS_CACHE        = "user_permissions_cache";
    public static final String INTEGRATION_PERMISSIONS_CACHE = "integration_permissions_cache";

    // Domain caches — add one entry per entity/feature that needs caching
    public static final String CATEGORY_GROUP_CACHE = "category_group_cache";
    public static final String CATEGORY_CACHE       = "category_cache";
}
```

### Cache Registration

Every new cache name in `CacheConstants` must also be registered in **both** managers in `CacheConfig`:

```java
// Caffeine (dev/localhost)
CaffeineCacheManager cacheManager = new CaffeineCacheManager(
        CacheConstants.USER_PERMISSIONS_CACHE,
        CacheConstants.INTEGRATION_PERMISSIONS_CACHE,
        CacheConstants.CATEGORY_GROUP_CACHE,        // ← add here
        CacheConstants.CATEGORY_CACHE);             // ← and here

// Redis (prod)
RedisCacheManager.builder(connectionFactory)
        .initialCacheNames(java.util.Set.of(
                CacheConstants.USER_PERMISSIONS_CACHE,
                CacheConstants.INTEGRATION_PERMISSIONS_CACHE,
                CacheConstants.CATEGORY_GROUP_CACHE,
                CacheConstants.CATEGORY_CACHE))
        ...
```

### Cache Annotations

```java
// Read-through — stable key patterns
@Cacheable(value = CacheConstants.CATEGORY_GROUP_CACHE, key = "'all_active'")
public List<CategoryGroupDto> findAllActive() { ... }

@Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "'group_' + #groupCode")
public List<CategoryDto> findAllByGroupCode(String groupCode) { ... }

// Single-cache evict
@CacheEvict(value = CacheConstants.CATEGORY_GROUP_CACHE, allEntries = true)
@Transactional
public CategoryGroupDto create(CategoryGroupDto input) { ... }

// Multi-cache evict — use @Caching when a single write must clear several caches
@Caching(evict = {
    @CacheEvict(value = CacheConstants.CATEGORY_GROUP_CACHE, allEntries = true),
    @CacheEvict(value = CacheConstants.CATEGORY_CACHE,       allEntries = true)
})
@Transactional
public void delete(UUID id) { ... }
```

### Cache Rules

- **Always** declare cache names in `CacheConstants` — never inline strings in annotations.
- **Always** register new caches in `CacheConfig` (both Caffeine and Redis managers).
- **Always** use `allEntries = true` in `@CacheEvict` on write methods.
- Use `@Caching` when a single write must evict multiple caches.
- Cache keys must be deterministic strings — prefer `'prefix_' + #param` patterns.
- Dev/localhost uses **Caffeine**; prod uses **Redis**. Never hardcode implementation details in service code.
- Default TTL is 15 minutes (configured via `app.cache.default-ttl`).
- Auth caches (`USER_PERMISSIONS_CACHE`, `INTEGRATION_PERMISSIONS_CACHE`) are managed by the security infrastructure — **never** evict them from business service code.

---

## 13. Auditing Rules

### JPA Auditing Configuration

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {
    @Bean
    public AuditorAware<String> auditorProvider() {
        return TokenUtils::getUsername;
    }
}
```

### Auditing Rules

- **Never** manually set `createdAt`, `createdBy`, `updatedAt`, or `updatedBy` on an entity.
- **Never** pass auditing fields from the client. The mapper must ignore them on `toEntity`.
- `AuditorAware` reads the current username via `TokenUtils.getUsername()` from the JWT.
- `@EnableJpaAuditing` must appear in exactly one `@Configuration` class (`JpaConfig` in `api/`).

---

## 14. Constants & Enums Rules

### Constants Organization

Reflects the actual `Constants.java` in the codebase:

```java
public final class Constants {

    private Constants() {}

    public static final String ADMIN_USERNAME        = "template_admin";
    public static final String PREFIX_ROLE           = "ROLE_";
    public static final String PREFIX_API_PERMISSION = "API:";

    public static final class Resource {
        public static final String USER           = "User";
        public static final String CATEGORY_GROUP = "CategoryGroup";
        public static final String CATEGORY       = "Category";
        // Add one constant per domain entity — used in exception messages
    }

    public static final class ErrorCode {
        // Generic
        public static final String NOT_FOUND         = "RESOURCE_NOT_FOUND";
        public static final String DUPLICATE         = "DUPLICATE_RESOURCE";
        public static final String ACCESS_DENIED     = "ACCESS_DENIED";
        public static final String INVALID_OPERATION = "INVALID_OPERATION";

        // Infrastructure
        public static final String USER_NOT_SYNCED    = "USER_NOT_SYNCED";
        public static final String USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";

        // Category domain
        public static final String CATEGORY_GROUP_NOT_FOUND      = "CATEGORY_GROUP_NOT_FOUND";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE  = "CATEGORY_GROUP_CODE_DUPLICATE";
        public static final String CATEGORY_NOT_FOUND             = "CATEGORY_NOT_FOUND";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE   = "CATEGORY_ITEM_CODE_DUPLICATE";
        // Pattern for new features: {ENTITY}_{PROBLEM}
    }

    public static final class MessageKey {
        // Infrastructure
        public static final String USER_NOT_SYNCED         = "error.user.not_synced";
        public static final String USER_EXISTS             = "error.user.exists";
        public static final String ACCESS_DENIED_NO_PERMISSION = "error.access_denied.no_permission";
        public static final String ENTITY_NOT_FOUND        = "error.entity.notfound";
        public static final String DUPLICATE_ENTRY         = "error.duplicate.entry";

        // Category domain
        public static final String CATEGORY_GROUP_NOT_FOUND      = "error.category_group.notfound";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE  = "error.category_group.code.duplicate";
        public static final String CATEGORY_NOT_FOUND             = "error.category.notfound";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE   = "error.category.item_code.duplicate";
        // Pattern for new features: error.{entity}.{problem}
    }
}
```

### Constants & Enums Rules

- **Always** use `Constants.ErrorCode.*`, `Constants.MessageKey.*`, `Constants.Resource.*` — never inline strings.
- Error codes follow `{ENTITY}_{PROBLEM}` (e.g., `CATEGORY_GROUP_NOT_FOUND`).
- Message keys follow `error.{entity}.{problem}` (e.g., `error.category_group.notfound`).
- Enums live in `common/` and must not import from other modules.
- `Constants` must have a private constructor.

---

## 15. Configuration Rules

### Profile-Based Configuration

```
application.yml            # Base defaults (shared across all profiles)
application-localhost.yml  # Local developer machine (Caffeine, local PG)
application-dev.yml        # Development server (Caffeine, dev PG)
application-prod.yml       # Production (Redis, ddl-auto: validate)
```

### Key Defaults (application.yml)

```yaml
server:
  port: 8080
  forward-headers-strategy: framework

spring:
  application:
    name: vdbas-template
  datasource:
    url: jdbc:postgresql://${DEV_DB_HOST:localhost}:5432/${DEV_DB_NAME:template_db}
    username: ${DEV_DB_USER:template}
    password: ${DEV_DB_PASSWORD:template@123}
    driver-class-name: org.postgresql.Driver
  jpa:
    open-in-view: false       # MUST be false
    hibernate:
      ddl-auto: none          # Schema managed by db/migration/ scripts
  messages:
    basename: messages
    encoding: UTF-8
    default-locale: vi
    fallback-to-system-locale: false

app:
  code: TEMPLATE
  security:
    default-role: TEMPLATE_ROLE_DEFAULT
  cache:
    type: memory              # Override to "redis" in prod profile
    default-ttl: 15           # minutes
```

### Configuration Rules

- **Always** set `spring.jpa.open-in-view=false`.
- **Always** set `spring.jpa.hibernate.ddl-auto=none` — schema managed by `db/migration/` scripts.
- **Never** commit environment-specific secrets in `application-*.yml`. Use environment variables.
- All `@Value` injections use `${VAR_NAME:default}` format.
- All `@Configuration` classes live in the `api/` module.
- Never place `@Configuration` in `domain/` or `common/`.

---

## 16. Internationalization (i18n) Rules

### Message Files

```
api/src/main/resources/
├── messages.properties       # Default = Vietnamese
├── messages_vi.properties    # Vietnamese (explicit)
└── messages_en.properties    # English
```

### Message Key Pattern

```properties
# Exception messages
error.category_group.notfound=Không tìm thấy nhóm danh mục: {0}
error.category_group.code.duplicate=Mã nhóm danh mục ''{0}'' đã tồn tại trong hệ thống

# Validation messages
category_group.groupCode.required=Mã nhóm không được để trống
category_group.groupCode.size=Mã nhóm tối đa 50 ký tự
category_group.groupName.required=Tên nhóm không được để trống
```

### Message Key Naming

| Prefix | Usage | Example |
|--------|-------|---------|
| `error.{entity}.{problem}` | Exception messages | `error.category_group.notfound` |
| `{entity}.{field}.required` | Validation: required | `category_group.groupCode.required` |
| `{entity}.{field}.size` | Validation: max size | `category_group.groupName.size` |
| `{entity}.{field}.pattern` | Validation: regex | `user.username.pattern` |

> **Note on apostrophes in messages:** MessageFormat treats `'` as an escape character. To display a literal single quote inside a message arg, use `''` (two single quotes), e.g. `Mã ''{0}'' đã tồn tại`.

### i18n Rules

- **Every** exception message string must have a corresponding message key.
- **Always** add keys to **all three** message files simultaneously.
- Validation message keys in DTO annotations use `{entity.field.rule}` brace-notation.
- `MessageSource` is used exclusively in `GlobalExceptionHandler` — never in services or controllers.
- Use `''` (double-apostrophe) when a message pattern contains a literal `'` next to a `{n}` placeholder.

---

## 17. Soft Delete Rules

### Entity Fields

```java
@Column(name = "is_deleted", nullable = false)
private Boolean deleted = Boolean.FALSE;

@Column(name = "end_date")
private LocalDateTime endDate;
```

### Repository Soft-Delete Methods

```java
// Single record
@Modifying
@Query("UPDATE CategoryGroup e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
void softDelete(@Param("id") UUID id);

// Cascade: bulk soft-delete by parent's business key
@Modifying
@Query("UPDATE Category e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.groupCode = :groupCode")
void softDeleteByGroupCode(@Param("groupCode") String groupCode);
```

### Service Delete with Cascade

```java
@Transactional
@Caching(evict = { ... })
public void delete(UUID id) {
    // Load to get business key needed for cascade
    CategoryGroup entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(...));

    childRepository.softDeleteByGroupCode(entity.getGroupCode()); // cascade first
    repository.softDelete(id);                                    // then parent
}
```

### Rules

- **Always** set both `deleted = true` AND `endDate = CURRENT_TIMESTAMP` in the same JPQL statement.
- **Always** append `AndDeletedIsFalse` to derived query methods, or add `deleted = false` predicate in `filter()`.
- **Never** call `repository.delete()` or `repository.deleteById()` for soft-deletable entities.
- The `filter()` method defaults to `deleted = false` unless the caller passes `deleted = true` explicitly.
- Hard delete may only be used for pure join entities with no `AbstractAuditing` base (e.g., `RolePermission`, `UserRole`).
- When deleting a parent that owns child records, always cascade soft-delete children **before** soft-deleting the parent.

---

## 18. Hierarchy & Tree Rules

### Entity Fields

```java
@Column(name = "parent_id")
private UUID parentId;

@Column(name = "cat_level")
private Integer catLevel = 1;

@Column(name = "cat_path", length = 2000)
private String catPath;

// Read-only — writes go through parentId only
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id", insertable = false, updatable = false)
private Category parent;
```

### computeHierarchyFields (Private Service Method)

`catLevel` and `catPath` are **always computed by the service** — never accepted from the client and never set by the mapper.

```java
// Call before every repository.save() — both on create and update
private void computeHierarchyFields(Category entity) {
    if (entity.getParentId() != null) {
        Category parent = repository.findById(entity.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CATEGORY_NOT_FOUND,
                        Constants.MessageKey.CATEGORY_NOT_FOUND,
                        Constants.Resource.CATEGORY,
                        "parentId",
                        entity.getParentId().toString()));
        entity.setCatLevel(parent.getCatLevel() + 1);
        entity.setCatPath(parent.getCatPath() + "/" + entity.getItemCode());
    } else {
        entity.setCatLevel(1);
        entity.setCatPath(entity.getItemCode());
    }
}
```

### buildTree (Private Service Method)

Use `LinkedHashMap` (not `HashMap`) to preserve the DB ordering within each level:

```java
private List<CategoryTreeDto> buildTree(List<Category> all) {
    Map<UUID, CategoryTreeDto> nodeMap = new LinkedHashMap<>();
    for (Category item : all) {
        nodeMap.put(item.getId(), mapper.toTreeDto(item));
    }

    List<CategoryTreeDto> roots = new ArrayList<>();
    for (Category item : all) {
        CategoryTreeDto dto = nodeMap.get(item.getId());
        if (item.getParentId() != null && nodeMap.containsKey(item.getParentId())) {
            nodeMap.get(item.getParentId()).getChildren().add(dto);
        } else {
            roots.add(dto);
        }
    }
    return roots;
}
```

### Hierarchy Rules

- **Always** call `computeHierarchyFields(entity)` before every `repository.save()` — on both create and update.
- `catPath` separator is `/`. Path contains **codes**, not IDs (e.g., `PARENT_CODE/CHILD_CODE`).
- `catLevel` starts at `1` for root nodes.
- The `parent` relationship must be `insertable = false, updatable = false`.
- Use `LinkedHashMap` in `buildTree()` to preserve DB row ordering within each parent node's children list.
- Tree DTOs must declare `children` with `@Builder.Default` initialized to `new ArrayList<>()`.
- Always expose both a flat-list endpoint (`GET /group/{code}`) and a tree endpoint (`GET /group/{code}/tree`).

---

## 19. Import Rules

### Import Order

```java
// 1. Java standard library
import java.io.Serial;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// 2. Jakarta EE
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

// 3. Spring Framework
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;

// 4. Third-party libraries (alphabetical)
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.mapstruct.*;
import org.slf4j.*;

// 5. Internal — common module
import com.fis.template.common.CacheConstants;
import com.fis.template.common.Constants;
import com.fis.template.common.enums.*;

// 6. Internal — domain module
import com.fis.template.domain.category.*;

// 7. Internal — application module
import com.fis.template.application.category.dto.*;
import com.fis.template.application.category.mapper.*;
import com.fis.template.application.common.dto.PageResponseDto;
import com.fis.template.application.exception.*;

// 8. Internal — api module (only within api itself)
import com.fis.template.api.config.*;
```

### Import Rules

- **Never** use wildcard imports — use specific imports.
- **Never** import `domain` classes in the `api` module — the API layer only sees DTOs from `application/`.
- **Never** import `api` or `application` classes in `domain/` or `common/`.
- Always import `java.io.Serial` when declaring `serialVersionUID`.
- Use `LinkedHashMap` (not `HashMap`) in services that build trees.
- Remove all unused imports before committing.

---

## 20. Lombok & Annotation Rules

### Entity Annotations

```java
@Entity
@Table(name = "table_name")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"parent"})        // ALWAYS exclude lazy associations
public class SomeEntity extends AbstractAuditing<UUID> {

    @Serial
    private static final long serialVersionUID = 1L;
    // ...
}
```

### DTO Annotations

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SomeDto { ... }
```

### Tree DTO — `@Builder.Default` on children

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SomeTreeDto {
    // ...
    @Builder.Default
    private List<SomeTreeDto> children = new ArrayList<>();
}
```

### Service Annotations

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SomeService { ... }
```

### Repository Annotations

```java
@Repository
public interface SomeRepository extends JpaRepository<Entity, UUID>, JpaSpecificationExecutor<Entity> { ... }
```

### Controller Annotations

```java
@RestController
@RequestMapping("/api/path")
@RequiredArgsConstructor
public class SomeController { ... }
```

### Rules

- **Never** use `@Data` on JPA entities.
- **Always** declare `@Serial private static final long serialVersionUID = 1L` in every entity.
- **Always** exclude lazy-loaded associations from `@ToString`.
- Use `@Builder.Default` on `children` fields in tree DTOs.
- `@Slf4j` is the only logging annotation — never use `LoggerFactory.getLogger()` directly.
- `@RequiredArgsConstructor` + `final` fields — never `@Autowired`.
- **Never** mix `@Autowired` and `@RequiredArgsConstructor` in the same class.

---

## 21. Logging Strategy

### Architecture

HTTP request/response lifecycle logging is **centralised** in `LoggingInterceptor` (`api/.../config/LoggingInterceptor.java`). It is registered via `WebMvcConfig` for all `/api/**` paths, excluding `/actuator/**` and Swagger paths.

### How the Interceptor Works

```java
// Only active when DEBUG level is enabled — zero overhead in production
@Override
public boolean preHandle(HttpServletRequest request, ...) {
    if (!log.isDebugEnabled()) return true;

    // Injects X-Request-ID header for cross-service correlation
    // Logs: [reqId] --> METHOD /path?query | user=preferred_username
}

@Override
public void afterCompletion(HttpServletRequest request, ...) {
    if (!log.isDebugEnabled()) return;

    // Logs: [reqId] <-- METHOD /path | status=200 | elapsed=42ms
    // On error: appends | error=message
}
```

### Username Resolution

The interceptor reads `preferred_username` from the JWT claim via `SecurityContextHolder`. Falls back to `subject` then `"anonymous"`.

### Log Level Configuration

```yaml
# application.yml — enable DEBUG for the application package only
logging:
  level:
    com.fis.template: DEBUG
```

### Logging Rules

- **Never** add `log.debug("Entering method X")` / `log.debug("Exiting method X")` blocks in service or controller methods — `LoggingInterceptor` covers this at the HTTP boundary.
- **Never** add `log.debug()` solely to log method arguments that are already captured by the interceptor (HTTP method, path, query string, user, timing, status).
- **Always** guard any remaining `log.debug()` calls (mid-method business context) with `if (log.isDebugEnabled())` to ensure zero string-building overhead in production.
- `log.info()`, `log.warn()`, and `log.error()` are **not** subject to the interceptor rule — use them freely for operationally significant events.
- `GlobalExceptionHandler` remains responsible for `log.error()` on unhandled exceptions — do not duplicate error logging in the service layer.

### What to Log vs. What Not to Log

| Scenario | Correct approach |
|----------|------------------|
| Request received / response sent | `LoggingInterceptor` (automatic) |
| Method entry / exit in service | ❌ Do NOT add — interceptor handles this |
| Method parameters echoed in service | ❌ Do NOT add — redundant with interceptor |
| Result size / ID of saved entity | ❌ Do NOT add — interceptor covers success status |
| Significant mid-logic state (e.g. cache miss, branch taken) | ✅ `if (log.isDebugEnabled()) { log.debug("...") }` |
| External system call result | ✅ `log.info(...)` — operationally significant |
| Unhandled exception context | ✅ `log.error(...)` in `GlobalExceptionHandler` only |

### Files

| File | Location |
|------|----------|
| `LoggingInterceptor.java` | `api/src/main/java/com/fis/template/api/config/` |
| `WebMvcConfig.java` | `api/src/main/java/com/fis/template/api/config/` |

---

## Quick Reference

| Category | Rule |
|----------|------|
| Architecture | API → Application → Domain → Common (strict one-way) |
| Package root | `com.fis.template` for all modules |
| Service sub-package | `application/{feature}/service/` — never at feature root |
| Entity base | Extend `AbstractAuditing<UUID>` + `@Serial serialVersionUID = 1L` |
| ID strategy | `@GeneratedValue(strategy = GenerationType.UUID)` + `columnDefinition = "uuid"` |
| Lazy associations | `FetchType.LAZY` + `@ToString(exclude = "fieldName")` |
| Soft delete | `deleted = true` + `endDate = CURRENT_TIMESTAMP` via `@Modifying @Query` |
| Cascade soft-delete | Child `softDeleteBy{ParentField}()` called before parent `softDelete()` |
| DTO audit fields | Declared flat in every DTO — no base class extension |
| DTO tree children | `@Builder.Default private List<X> children = new ArrayList<>()` |
| Mapper ignores | `id`, audit fields, `endDate`, lazy joins, `catLevel`, `catPath` |
| Mapper tree node | Add `toTreeDto()` with `@Mapping(target = "children", ignore = true)` |
| Service sections | `// ─── Queries`, `// ─── Commands`, `// ─── Private` dividers |
| Hierarchy compute | Private `computeHierarchyFields(entity)` called before every `save()` |
| Tree build | Private `buildTree(all)` using `LinkedHashMap` to preserve ordering |
| Update uniqueness | Check only when the business key field actually changes |
| Multi-cache evict | `@Caching(evict = { @CacheEvict(...), @CacheEvict(...) })` |
| Cache registration | Add to both Caffeine and Redis managers in `CacheConfig` |
| Cache keys | `'prefix_' + #param` — always deterministic strings |
| Exception | `Constants.ErrorCode.*` + `Constants.MessageKey.*` + 5-arg constructor |
| Controller response | Direct DTO return; `@ResponseStatus` for 201/204; never `ResponseEntity` |
| Business code lookup | Add `GET /code/{code}` endpoint for entities with unique business codes |
| Pagination | `PageResponseDto<T>`; 0-based page; `@PostMapping("/search")` |
| Auth token | `TokenUtils.getUsername()` only — never `SecurityContextHolder` in entities/DTOs |
| App code | `TEMPLATE` — update in `application.yml` + DB for each new project |
| Logging | `LoggingInterceptor` handles request lifecycle; never add entry/exit debug logs in services; guard mid-logic `log.debug()` with `if (log.isDebugEnabled())` |
| DI | `@RequiredArgsConstructor` + `final` fields — never `@Autowired` |
| i18n | Keys in all 3 `messages*.properties`; `''` for literal apostrophes in patterns |
| DDL | `ddl-auto: none` — schema in `api/src/main/resources/db/migration/` |
| open-in-view | Always `false` |
| JSONB | `@JdbcTypeCode(SqlTypes.JSON)` + `columnDefinition = "jsonb"` |
| New feature checklist | Entity → Repository → Dto + SearchDto (+ TreeDto) → Mapper → Service → Controller → Constants → CacheConstants → CacheConfig → Messages (×3) → SQL migration |
