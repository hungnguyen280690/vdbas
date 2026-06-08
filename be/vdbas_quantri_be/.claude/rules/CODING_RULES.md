# Coding Rules — vdbas_quantri_be

All entities, DTOs, mappers, repositories, services, and controllers created in this project must follow these rules. The rules are derived directly from existing patterns in the codebase and must be treated as mandatory conventions.

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
vdbas_quantri_be/
├── common/           # Shared constants, enums, utils — NO Spring deps, NO JPA
├── domain/           # JPA entities + repositories (database layer)
├── application/      # Services, DTOs, mappers (business layer)
├── api/              # REST controllers, security, exception handling (HTTP layer)
├── api-integration/         # Integration HTTP endpoints (integration layer)
└── application-integration/ # Integration services (integration layer)
```

### Dependency Direction (Clean Architecture)

```
api → application → domain → common
```

**Rules:**
- `common/` must **never** import from any other module.
- `domain/` may only import from `common/`. No service or controller code.
- `application/` may import from `domain/` and `common/`. No HTTP/controller code.
- `api/` imports from `application/` and `common/`. Never imports from `domain/` directly.
- Never add Spring Web or Spring Security annotations in `domain/` or `common/`.

### Package Organization (by Feature/Domain)

Each domain feature has mirrored sub-packages across modules:

```
api/src/main/java/.../
  └── {feature}/
        └── {Feature}Controller.java

application/src/main/java/.../
  └── {feature}/
        ├── {Feature}Service.java
        ├── dto/
        │   ├── {Feature}Dto.java
        │   ├── {Feature}SearchDto.java
        │   └── {Feature}TreeDto.java   # only for hierarchical entities
        └── mapper/
              └── {Feature}Mapper.java

domain/src/main/java/.../
  └── {feature}/
        ├── {Feature}Entity.java
        └── {Feature}Repository.java

common/src/main/java/.../
  ├── constants/
  │   ├── Constants.java
  │   └── CacheConstants.java
  └── enums/
        └── {EnumName}.java
```

**Rules:**
- One controller, one service, one repository, one mapper per domain entity.
- All packages under a module share the same root package prefix (e.g., `vn.fis.vdbas.qtdc`).
- Test classes mirror the production package structure under `src/test/java/`.

---

## 2. Naming Conventions

### Classes

| Type | Convention | Example |
|------|-----------|---------|
| Entity | PascalCase + `Entity` suffix (optional, consistent within codebase) | `CategoryEntity`, `UserEntity` |
| DTO | PascalCase + `Dto` suffix | `CategoryDto`, `UserDto` |
| Search DTO | PascalCase + `SearchDto` suffix | `CategorySearchDto` |
| Tree DTO | PascalCase + `TreeDto` suffix | `CategoryTreeDto` |
| Mapper | PascalCase + `Mapper` suffix | `CategoryMapper` |
| Repository | PascalCase + `Repository` suffix | `CategoryRepository` |
| Service | PascalCase + `Service` suffix | `CategoryService` |
| Controller | PascalCase + `Controller` suffix | `CategoryController` |
| Exception | PascalCase + `Exception` suffix | `ResourceNotFoundException` |
| Config class | PascalCase + `Config` suffix | `SecurityConfig`, `JpaConfig` |
| Constants holder | PascalCase, nested static classes | `Constants`, `CacheConstants` |

### Methods

| Type | Convention | Example |
|------|-----------|---------|
| List all | `findAll*()` | `findAllByGroupCode()` |
| Get single | `get(UUID id)` | `get(id)` |
| Search paginated | `search(SearchDto)` | `search(criteria)` |
| Create | `create(Dto)` | `create(input)` |
| Update | `update(UUID id, Dto)` | `update(id, input)` |
| Delete | `delete(UUID id)` | `delete(id)` |
| Private filter | `filter(SearchDto)` | `filter(criteria)` |
| Repository soft-delete | `softDelete(@Param("id") UUID id)` | `softDelete(id)` |

### Fields & Variables

- Entity fields: `camelCase` matching DB column snake_case equivalent (e.g., `groupCode` ↔ `group_code`)
- Boolean fields: `is` prefix for soft-delete (`deleted`), active flags (`isInternal`)
- Log variable: `log` (from `@Slf4j`)
- Query builder variables: `predicates`, `cb`, `root`, `query`

---

## 3. Entity Rules

### Base Class

Every entity with CRUD operations must extend `AbstractAuditing<T>`:

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

### Standard Entity Structure

```java
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@ToString
public class Category extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    // JSONB column
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ext_attributes", columnDefinition = "jsonb")
    private Map<String, Object> extAttributes;

    // Soft delete
    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted = Boolean.FALSE;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    // Hierarchy
    @Column(name = "parent_id")
    private UUID parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private Category parent;

    @Override
    public UUID getId() { return id; }
}
```

### Entity Rules

- **Always** extend `AbstractAuditing<UUID>` and implement `getId()` — never declare `createdAt`, `updatedAt`, `createdBy`, `updatedBy` directly on the entity.
- **Always** use `@GeneratedValue(strategy = GenerationType.UUID)` for UUID primary keys.
- **Always** annotate UUID columns with `columnDefinition = "uuid"`.
- **Always** use `FetchType.LAZY` for all `@ManyToOne` and `@OneToMany` relationships.
- **Always** annotate JSONB columns with `@JdbcTypeCode(SqlTypes.JSON)` and `columnDefinition = "jsonb"`.
- **Never** use `@Data` on entities (generates `equals`/`hashCode` on mutable state). Use `@Getter`, `@Setter`, `@NoArgsConstructor`, `@ToString` separately.
- **Never** use bidirectional `@OneToMany` unless strictly necessary — prefer `parentId` field + separate query.
- The `deleted` field is always `Boolean` (not `boolean`) initialized to `Boolean.FALSE`.
- The `endDate` field (`LocalDateTime`) marks logical expiry and is paired with `deleted` for soft-delete.
- Column names must **exactly match** the DB schema defined in `init_db.sql`.

---

## 4. DTO Rules

### Base DTO

DTOs that expose audit fields extend `BaseAuditingDto`:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaseAuditingDto {
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Boolean deleted;
}
```

### Standard DTO

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{category.groupCode.required}")
    @Size(max = 50, message = "{category.groupCode.size}")
    private String groupCode;

    @NotBlank(message = "{category.itemName.required}")
    @Size(max = 255, message = "{category.itemName.size}")
    private String itemName;

    private Map<String, Object> extAttributes;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private UUID parentId;
}
```

### Search DTO

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategorySearchDto {
    private int page = 0;
    private int size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";

    // Filter fields
    private String groupCode;
    private String itemName;
    private Boolean deleted;
    private Boolean isActive;
    private Map<String, Object> extAttributes;
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

### DTO Rules

- **Always** use `@Data @NoArgsConstructor @AllArgsConstructor @Builder` on all DTOs.
- **Always** use message keys (`"{feature.field.rule}"`) for validation messages — never hardcode strings.
- **Always** validate at the DTO level using Jakarta Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Valid`).
- Auditing fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deleted`) are **read-only** — the client may never supply them; the mapper ignores them on `toEntity`.
- Search DTOs must provide default values for `page` (0), `size` (20), `sortBy`, and `sortDirection`.
- Tree DTOs add a `private List<{Feature}TreeDto> children = new ArrayList<>()` field.
- **Never** use the same DTO for both request (create/update) and search — create a dedicated `SearchDto`.

---

## 5. Repository Rules

### Standard Repository

```java
@Repository
public interface CategoryRepository extends
        JpaRepository<Category, UUID>,
        JpaSpecificationExecutor<Category> {

    // Named query — always filter deleted
    List<Category> findByGroupCodeAndDeletedIsFalse(String groupCode);

    // Soft delete via JPQL
    @Modifying
    @Query("UPDATE Category e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);

    // Existence check
    boolean existsByGroupCodeAndItemCodeAndDeletedIsFalse(String groupCode, String itemCode);
}
```

### Repository Rules

- **Always** extend both `JpaRepository<Entity, UUID>` and `JpaSpecificationExecutor<Entity>`.
- **Always** append `AndDeletedIsFalse` to derived query methods that should exclude soft-deleted records.
- **Always** use `@Modifying` + `@Query` for the soft-delete method. The JPQL must set `deleted = true` AND `endDate = CURRENT_TIMESTAMP`.
- **Never** implement hard-delete (`deleteById`) for entities with soft-delete support — override it to throw `UnsupportedOperationException` if needed.
- Complex dynamic queries go in the service via `Specification<T>`, not in the repository.
- `@Param` annotation is required on all `@Query` named parameters.

---

## 6. Service Rules

### Class Declaration

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;
    // Other injected dependencies
}
```

### Standard CRUD Methods

```java
// List (no pagination)
public List<CategoryDto> findAllByGroupCode(String groupCode) {
    return mapper.toDtoList(repository.findByGroupCodeAndDeletedIsFalse(groupCode));
}

// Paginated search
public PageResponseDto<CategoryDto> search(CategorySearchDto criteria) {
    Sort.Direction direction = "asc".equalsIgnoreCase(criteria.getSortDirection())
            ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(),
            Sort.by(direction, criteria.getSortBy()));

    Page<Category> page = repository.findAll(this.filter(criteria), pageable);

    return PageResponseDto.<CategoryDto>builder()
            .content(mapper.toDtoList(page.getContent()))
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .build();
}

// Get single
public CategoryDto get(UUID id) {
    return repository.findById(id)
            .map(mapper::toDto)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_NOT_FOUND,
                    Constants.Resource.CATEGORY,
                    "id",
                    id.toString()));
}

// Create
@Transactional
public CategoryDto create(CategoryDto input) {
    if (log.isDebugEnabled()) {
        log.debug("create category with input: {}", input);
    }
    Category entity = mapper.toEntity(input);
    entity = repository.save(entity);
    return mapper.toDto(entity);
}

// Update
@Transactional
public CategoryDto update(UUID id, CategoryDto input) {
    Category entity = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.CATEGORY_NOT_FOUND,
                    Constants.MessageKey.CATEGORY_NOT_FOUND,
                    Constants.Resource.CATEGORY,
                    "id",
                    id.toString()));

    mapper.updateEntityFromDto(input, entity);
    entity = repository.save(entity);
    return mapper.toDto(entity);
}

// Delete (soft)
@Transactional
public void delete(UUID id) {
    if (!repository.existsById(id)) {
        throw new ResourceNotFoundException(
                Constants.ErrorCode.CATEGORY_NOT_FOUND,
                Constants.MessageKey.CATEGORY_NOT_FOUND,
                Constants.Resource.CATEGORY,
                "id",
                id.toString());
    }
    repository.softDelete(id);
}
```

### Specification Filter (Private Method)

```java
private Specification<Category> filter(CategorySearchDto criteria) {
    return (root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();

        // String like — always case-insensitive
        if (criteria.getGroupCode() != null && !criteria.getGroupCode().isBlank()) {
            predicates.add(cb.like(cb.lower(root.get("groupCode")),
                    "%" + criteria.getGroupCode().toLowerCase() + "%"));
        }

        // Boolean / enum equality
        if (criteria.getDeleted() != null) {
            predicates.add(cb.equal(root.get("deleted"), criteria.getDeleted()));
        } else {
            predicates.add(cb.equal(root.get("deleted"), false));
        }

        // Date validity (active = endDate IS NULL)
        if (Boolean.TRUE.equals(criteria.getIsActive())) {
            predicates.add(cb.isNull(root.get("endDate")));
        }

        // JSONB field containment (PostgreSQL @> operator)
        if (criteria.getExtAttributes() != null && !criteria.getExtAttributes().isEmpty()) {
            criteria.getExtAttributes().forEach((key, val) ->
                predicates.add(cb.isTrue(
                    cb.function("jsonb_contains", Boolean.class,
                        root.get("extAttributes"),
                        cb.function("jsonb_build_object", String.class,
                            cb.literal(key), cb.literal(val))
                    )
                ))
            );
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    };
}
```

### Service Rules

- **Always** annotate the class with `@Transactional(readOnly = true)`.
- **Always** override write methods (`create`, `update`, `delete`) with `@Transactional` (removes `readOnly`).
- **Never** create a separate service interface unless the application requires a strategy pattern or multiple implementations. Single `@Service` class is the standard.
- **Always** use `@RequiredArgsConstructor` — never `@Autowired` field injection.
- **Never** add `log.debug("start of method")` / `log.debug("end of method")` entry-exit blocks in service methods — request lifecycle logging is handled centrally by `LoggingInterceptor`. See [§21 Logging Strategy](#21-logging-strategy).
- If a service method contains genuinely useful mid-logic debug context (e.g. a computed value, a cache miss), guard it with `if (log.isDebugEnabled())` and log the specific value, not generic entry/exit text.
- **Always** throw typed `BusinessException` subclasses (`ResourceNotFoundException`, `DuplicateResourceException`, etc.) — never throw raw `RuntimeException` or return `null`.
- **Always** use `Constants.ErrorCode`, `Constants.MessageKey`, and `Constants.Resource` constants when constructing exceptions.
- The `filter()` method must always add a `deleted = false` predicate unless the search DTO explicitly requests deleted records.
- **Never** call `repository.delete()` or `repository.deleteById()` for entities that use soft-delete.

---

## 7. Controller Rules

### Standard Controller

```java
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    public List<CategoryDto> findAll(@RequestParam String groupCode) {
        return service.findAllByGroupCode(groupCode);
    }

    @GetMapping("/{id}")
    public CategoryDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping("/search")
    public PageResponseDto<CategoryDto> search(@RequestBody CategorySearchDto body) {
        return service.search(body);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable UUID id, @Valid @RequestBody CategoryDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
```

### Controller Rules

- **Always** annotate with `@RestController` and `@RequestMapping("/api/{feature}")`.
- **Always** use `@RequiredArgsConstructor` — never `@Autowired`.
- **Always** add `@Valid` to `@RequestBody` parameters that carry DTOs.
- **Never** wrap responses in `ResponseEntity<>` — return the DTO or `void` directly and set HTTP status via `@ResponseStatus`.
- HTTP status mapping:
  - `GET` (list / detail) → 200 OK (default)
  - `POST` (create) → 201 Created — use `@ResponseStatus(HttpStatus.CREATED)`
  - `PUT` (update) → 200 OK (default)
  - `DELETE` → 204 No Content — use `@ResponseStatus(HttpStatus.NO_CONTENT)`
- Search endpoints use `@PostMapping("/search")` with a `@RequestBody SearchDto` — never put filter params in `@GetMapping` query strings for complex filtering.
- **Never** add business logic in controllers — delegate everything to the service layer.
- **Never** import or call `repository` classes directly from a controller.
- Controller classes must not be annotated with `@Transactional`.

---

## 8. Mapper Rules

### Standard Mapper

```java
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryDto toDto(Category entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "parent", ignore = true)
    Category toEntity(CategoryDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "parent", ignore = true)
    void updateEntityFromDto(CategoryDto dto, @MappingTarget Category entity);

    List<CategoryDto> toDtoList(List<Category> entities);
}
```

### Mapper Rules

- **Always** use `@Mapper(componentModel = "spring")` — MapStruct generates a Spring bean.
- **Every** mapper must expose: `toDto(Entity)`, `toEntity(Dto)`, `updateEntityFromDto(Dto, @MappingTarget Entity)`, `toDtoList(List<Entity>)`.
- **Always** ignore auditing fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deleted`) in `toEntity` and `updateEntityFromDto`.
- **Always** ignore `id` in `toEntity` (creation — ID is DB-generated).
- **Always** ignore lazy-loaded relationship objects (e.g., `parent`, `group`) in `toEntity` and `updateEntityFromDto` — use the foreign key field (`parentId`) instead.
- **Never** add business logic inside mappers.
- **Never** inject services or repositories into mappers.

---

## 9. Exception Handling Rules

### Custom Exception Hierarchy

```
BusinessException (base)
├── ResourceNotFoundException  → HTTP 404
├── DuplicateResourceException → HTTP 409
├── InvalidOperationException  → HTTP 400
├── DatabaseConstraintException → HTTP 409
└── AccessDeniedException      → HTTP 403
```

### Base Exception

```java
@Getter
public class BusinessException extends RuntimeException {
    private final String errorCode;
    private final String messageKey;
    private final Object[] messageArgs;

    public BusinessException(String errorCode, String messageKey, Object... messageArgs) {
        super(messageKey);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }
}
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

@Data
@Builder
public class FieldErrorDto {
    private String field;
    private String message;
}
```

### Global Exception Handler

```java
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponseDto handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return buildResponse(HttpStatus.NOT_FOUND, resolveMessage(ex), ex.getErrorCode(), req);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleDuplicate(DuplicateResourceException ex, HttpServletRequest req) {
        return buildResponse(HttpStatus.CONFLICT, resolveMessage(ex), ex.getErrorCode(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<FieldErrorDto> details = ex.getBindingResult().getAllErrors().stream()
                .map(e -> FieldErrorDto.builder()
                        .field(((FieldError) e).getField())
                        .message(e.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Validation failed")
                .path(req.getRequestURI())
                .details(details)
                .build();
    }

    private String resolveMessage(BusinessException ex) {
        return messageSource.getMessage(ex.getMessageKey(), ex.getMessageArgs(),
                LocaleContextHolder.getLocale());
    }
}
```

### Exception Rules

- **Always** throw a typed `BusinessException` subclass. Choose the subclass that matches the HTTP semantic.
- **Always** pass `Constants.ErrorCode.*`, `Constants.MessageKey.*`, and optional message args to the exception constructor.
- **Never** catch exceptions in services and swallow them silently.
- **Never** throw `NullPointerException` or `IllegalArgumentException` as public API errors — wrap them in `InvalidOperationException`.
- `GlobalExceptionHandler` is the **only** place where exceptions are mapped to HTTP responses.
- `ResourceNotFoundException` constructor signature: `(String errorCode, String messageKey, String resource, String field, String value)`.

---

## 10. Security & Authorization Rules

### JWT Resource Server

Authentication uses OAuth2 JWT issued by Keycloak. The security filter chain is configured in `SecurityConfig`:

```java
http
    .csrf(csrf -> csrf.disable())
    .cors(Customizer.withDefaults())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
        .requestMatchers("/api/**").access(dynamicAuthorizationManager)
        .anyRequest().authenticated())
    .oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter)));
```

### Authority Format

Authorities are loaded from the DB via `CustomJwtAuthenticationConverter`:

| Authority Type | Format | Example |
|---------------|--------|---------|
| Role | `ROLE_<ROLE_CODE>` | `ROLE_qtdc_admin` |
| API Permission | `API:<METHOD>:<PATH>` | `API:POST:/api/categories` |

### Current User Utility

```java
// Extract username from SecurityContext (used by AuditorAware)
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

- **Never** hardcode usernames, passwords, or secrets in Java source code.
- **Never** add `Authorization: Bearer ...` headers manually — the token is read from the `SecurityContext`.
- **Never** use `@PreAuthorize` on individual controller methods — authorization is handled centrally by `DynamicAuthorizationManager` which reads from the `permissions` table.
- Actuator health/info endpoints and Swagger UI **must** remain publicly accessible.
- CSRF must remain disabled (`csrf.disable()`) — the API is stateless.
- `TokenUtils.getUsername()` is the **only** allowed way to get the current user's identity inside the application layer.
- **Never** call `SecurityContextHolder` from entity, repository, DTO, or mapper classes.

---

## 11. Pagination Rules

### Request Format

All paginated endpoints accept a `SearchDto` via `@PostMapping("/search")`:

```java
// In SearchDto
private int page = 0;          // 0-indexed
private int size = 20;
private String sortBy = "createdAt";
private String sortDirection = "desc";  // "asc" or "desc"
```

### Service Implementation

```java
Sort.Direction direction = "asc".equalsIgnoreCase(criteria.getSortDirection())
        ? Sort.Direction.ASC : Sort.Direction.DESC;
Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(),
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

- **Always** use 0-based page indexing (Spring Data `Pageable` is 0-based; the frontend also sends 0-based).
- **Always** return `PageResponseDto<T>` — never return Spring's `Page<T>` or `Slice<T>` directly to the controller.
- Default page size is `20`. Maximum allowed page size must be validated in the service (throw `InvalidOperationException` if `size > 200`).
- `sortBy` must reference a valid entity field name. Invalid sort fields default to `createdAt`.

---

## 12. Caching Rules

### Cache Constants

All cache names are declared as constants in `CacheConstants`:

```java
public final class CacheConstants {
    public static final String CATEGORY_CACHE          = "category_cache";
    public static final String USER_PERMISSIONS_CACHE  = "user_permissions_cache";
    // Add new cache names here
}
```

### Cache Annotations

```java
// Read-through cache
@Cacheable(value = CacheConstants.CATEGORY_CACHE, key = "'group_' + #groupCode")
public List<CategoryDto> findAllByGroupCode(String groupCode) { ... }

// Evict on write
@CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
@Transactional
public CategoryDto create(CategoryDto input) { ... }

@CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
@Transactional
public CategoryDto update(UUID id, CategoryDto input) { ... }

@CacheEvict(value = CacheConstants.CATEGORY_CACHE, allEntries = true)
@Transactional
public void delete(UUID id) { ... }
```

### Cache Rules

- **Always** declare cache names as constants in `CacheConstants` — never inline strings.
- **Always** apply `@CacheEvict(allEntries = true)` to all `@Transactional` write methods in a service that also has `@Cacheable` methods.
- Cache keys must be deterministic strings. Prefer `'prefix_' + #param` pattern.
- Development profile uses **Caffeine** (in-memory); production uses **Redis**. Never hard-code cache implementation details in application code.
- Default TTL is 15 minutes. Shorter TTL values may be configured per-cache in `application.yml` — always document the reason in a code comment.

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
- **Never** pass auditing fields from the client (request body). The mapper must ignore them on `toEntity`.
- The `AuditorAware` bean reads the current username from the JWT token via `TokenUtils.getUsername()`.
- Use `@EnableJpaAuditing(auditorAwareRef = "auditorProvider")` in exactly one `@Configuration` class (`JpaConfig`).

---

## 14. Constants & Enums Rules

### Constants Organization

```java
// common/src/.../constants/Constants.java
public final class Constants {

    private Constants() {}  // Prevent instantiation

    public static final String PREFIX_ROLE           = "ROLE_";
    public static final String PREFIX_API_PERMISSION = "API:";

    public static final class Resource {
        public static final String USER     = "User";
        public static final String CATEGORY = "Category";
        // One entry per domain entity
    }

    public static final class ErrorCode {
        public static final String CATEGORY_NOT_FOUND       = "CATEGORY_NOT_FOUND";
        public static final String CATEGORY_GROUP_DUPLICATE = "CATEGORY_GROUP_DUPLICATE";
        // Pattern: {ENTITY}_{PROBLEM}
    }

    public static final class MessageKey {
        public static final String CATEGORY_NOT_FOUND       = "error.category.notfound";
        public static final String CATEGORY_GROUP_DUPLICATE = "error.category.group.duplicate";
        // Must match key in messages.properties
    }
}
```

### Enum Rules

```java
// common/src/.../enums/OwnerType.java
public enum OwnerType {
    PERSON,
    ORG
}
```

### Constants & Enums Rules

- **Always** use `Constants.ErrorCode.*`, `Constants.MessageKey.*`, and `Constants.Resource.*` in service exception throws — never inline strings.
- All error codes follow `{ENTITY}_{PROBLEM}` (e.g., `CATEGORY_NOT_FOUND`, `USER_DUPLICATE_USERNAME`).
- All message keys follow `error.{entity}.{problem}` (e.g., `error.category.notfound`).
- Enums live in `common/` module. They must **not** import from `domain/`, `application/`, or `api/`.
- `Constants` class must have a private constructor to prevent instantiation.
- **Never** use magic strings or magic numbers in service or controller logic — extract to constants.

---

## 15. Configuration Rules

### Profile-Based Configuration

```
application.yml          # Base defaults
application-localhost.yml  # Local developer machine
application-dev.yml      # Development server
application-uat.yml      # UAT / staging
application-prod.yml     # Production
application-test.yml     # Test (H2 or test container)
```

### Key Defaults (application.yml)

```yaml
server:
  port: 8080
  forward-headers-strategy: framework

spring:
  application:
    name: vdbas-quantri-be
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    driver-class-name: org.postgresql.Driver
  jpa:
    open-in-view: false      # MUST be false — prevents lazy-load outside transaction
    hibernate:
      ddl-auto: none          # Schema managed by SQL scripts, never by Hibernate
  messages:
    basename: messages
    encoding: UTF-8
    default-locale: vi
    fallback-to-system-locale: false

app:
  security:
    default-role: QTTT_ROLE_DEFAULT
  cors:
    allowed-origins: ${ALLOWED_ORIGINS}
    allowed-methods: "*"
    allowed-headers: "*"
    allow-credentials: true
  cache:
    default-ttl: 15   # minutes
```

### Configuration Rules

- **Always** set `spring.jpa.open-in-view=false` — lazy-load issues must be solved in the service layer, not by the open-session-in-view anti-pattern.
- **Always** set `spring.jpa.hibernate.ddl-auto=none` — schema is managed by the SQL init scripts (`init_db.sql`).
- **Never** commit environment-specific secrets (DB passwords, Keycloak secrets) in any `application-*.yml`. Use environment variables or `.env` files.
- CORS configuration must read allowed origins from `${ALLOWED_ORIGINS}` environment variable.
- All `@Value` injections must reference environment variables in the `${VAR_NAME}` format, not hardcoded values.
- All `@Configuration` classes must be in the `api/` module (except `JpaConfig` which is in `domain/`).

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
# messages.properties (Vietnamese)
error.category.notfound=Không tìm thấy danh mục với ID: {0}
error.category.group.duplicate=Nhóm danh mục '{0}' và mục '{1}' đã tồn tại
category.groupCode.required=Mã nhóm không được để trống
category.groupCode.size=Mã nhóm tối đa {max} ký tự
```

### Message Key Naming

| Prefix | Usage | Example |
|--------|-------|---------|
| `error.{entity}.{problem}` | Exception messages | `error.user.notfound` |
| `{entity}.{field}.required` | Validation: required | `category.groupCode.required` |
| `{entity}.{field}.size` | Validation: size | `category.itemName.size` |
| `{entity}.{field}.pattern` | Validation: pattern | `user.username.pattern` |

### i18n Rules

- **Every** visible string used in `ErrorResponseDto.message` must have a corresponding message key.
- **Always** add keys to **all three** message files simultaneously (`messages.properties`, `messages_vi.properties`, `messages_en.properties`).
- Validation message keys in DTO annotations use `{entity.field.rule}` brace-notation (Jakarta validation resolves them via `MessageSource`).
- `MessageSource` is injected and used exclusively in `GlobalExceptionHandler` — never resolve messages in service or controller code.
- Message args (`{0}`, `{1}`, `{max}`) must be documented inline in the message file comment.

---

## 17. Soft Delete Rules

### Pattern

Every entity that supports logical deletion must have both:
```java
@Column(name = "is_deleted", nullable = false)
private Boolean deleted = Boolean.FALSE;

@Column(name = "end_date")
private LocalDateTime endDate;
```

### Repository Method

```java
@Modifying
@Query("UPDATE Category e SET e.deleted = true, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
void softDelete(@Param("id") UUID id);
```

### Service Method

```java
@Transactional
public void delete(UUID id) {
    if (!repository.existsById(id)) {
        throw new ResourceNotFoundException(...);
    }
    repository.softDelete(id);
}
```

### Rules

- **Always** set both `deleted = true` AND `endDate = CURRENT_TIMESTAMP` in the soft-delete query.
- **Always** append `AndDeletedIsFalse` (or equivalent Specification predicate) to all list/search queries.
- **Never** call `repository.delete()` or `repository.deleteById()` for soft-deletable entities.
- The `Specification`-based `filter()` method must default to `deleted = false` unless the caller explicitly passes `deleted = true`.
- Hard delete may only be used for pure join/mapping entities that have no `AbstractAuditing` base (e.g., `RolePermission`, `UserRole`).

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

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id", insertable = false, updatable = false)
private Category parent;
```

### Path & Level Calculation (Service)

```java
if (entity.getParentId() != null) {
    Category parent = repository.findById(entity.getParentId())
            .orElseThrow(() -> new ResourceNotFoundException(...));
    entity.setCatLevel(parent.getCatLevel() + 1);
    entity.setCatPath(parent.getCatPath() + "/" + entity.getItemCode());
} else {
    entity.setCatLevel(1);
    entity.setCatPath(entity.getItemCode());
}
```

### Tree Building (Service)

```java
public List<EntityTreeDto> buildTree(List<Entity> all) {
    Map<UUID, EntityTreeDto> map = new HashMap<>();
    for (Entity item : all) {
        map.put(item.getId(), mapper.toTreeDto(item));
    }

    List<EntityTreeDto> roots = new ArrayList<>();
    for (Entity item : all) {
        EntityTreeDto dto = map.get(item.getId());
        if (item.getParentId() != null && map.containsKey(item.getParentId())) {
            map.get(item.getParentId()).getChildren().add(dto);
        } else {
            roots.add(dto);
        }
    }
    return roots;
}
```

### Hierarchy Rules

- **Always** compute `catPath` and `catLevel` in the service before saving — never accept them from the client.
- `catPath` separator is `/`. Path contains codes, not IDs (e.g., `PARENT_CODE/CHILD_CODE`).
- `catLevel` starts at `1` for root nodes.
- The `parent` relationship must be `insertable = false, updatable = false` — use `parentId` UUID field for writes.
- Tree DTOs must initialize `children` as `new ArrayList<>()` to avoid NPE during tree assembly.

---

## 19. Import Rules

### Import Order

Organize imports in this order (IntelliJ default Java import order with groups):

```java
// 1. Java standard library
import java.time.LocalDateTime;
import java.util.*;

// 2. Jakarta EE
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

// 3. Spring Framework
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.security.core.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;

// 4. Third-party libraries (alphabetical)
import lombok.*;
import org.hibernate.annotations.*;
import org.mapstruct.*;
import org.slf4j.*;

// 5. Internal — common module
import vn.fis.vdbas.qtdc.common.constants.*;
import vn.fis.vdbas.qtdc.common.enums.*;

// 6. Internal — domain module
import vn.fis.vdbas.qtdc.domain.{feature}.*;

// 7. Internal — application module
import vn.fis.vdbas.qtdc.application.{feature}.dto.*;
import vn.fis.vdbas.qtdc.application.{feature}.mapper.*;

// 8. Internal — api module (only within api module itself)
import vn.fis.vdbas.qtdc.api.exception.*;
```

### Import Rules

- **Never** use wildcard imports (`import java.util.*`) in production code — use specific imports.
- **Never** import `domain` classes in the `api` module. The API layer only sees DTOs from `application/`.
- **Never** import `api` or `application` classes in `domain/` or `common/`.
- Remove all unused imports before committing — the compiler warns and CI will fail.

---

## 20. Lombok & Annotation Rules

### Entity Annotations

```java
@Entity
@Table(name = "table_name")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"parent", "children"})   // Exclude lazy associations from toString
public class SomeEntity extends AbstractAuditing<UUID> { ... }
```

### DTO Annotations

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SomeDto { ... }
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

- **Never** use `@Data` on JPA entities — it causes issues with proxy-based lazy loading.
- **Never** use `@EqualsAndHashCode` on entities with bidirectional relationships.
- **Always** exclude lazy-loaded associations from `@ToString` via `exclude = {"fieldName"}`.
- Use `@Builder` on DTOs to enable fluent construction (pairs well with `PageResponseDto.builder()`).
- `@Slf4j` is the only allowed logging annotation — never use `LoggerFactory.getLogger()` directly.
- `@RequiredArgsConstructor` generates a constructor for all `final` fields — always declare injected dependencies as `final`.
- **Never** mix `@Autowired` field injection with `@RequiredArgsConstructor` constructor injection in the same class.

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

The interceptor reads `preferred_username` from the Keycloak JWT claim via `SecurityContextHolder`. Falls back to `subject` then `"anonymous"`.

### Log Level Configuration

```yaml
# application.yml — enable DEBUG for the application package only
logging:
  level:
    com.fis.qttt: DEBUG
```

### Logging Rules

- **Never** add `log.debug("Entering method X")` / `log.debug("Exiting method X")` blocks in service or controller methods — `LoggingInterceptor` covers this at the HTTP boundary.
- **Never** add `log.debug()` solely to log method arguments that are already captured by the interceptor (HTTP method, path, query string, user, timing, status).
- **Always** guard any remaining `log.debug()` calls (mid-method business context) with `if (log.isDebugEnabled())` to ensure zero string-building overhead in production.
- `log.info()`, `log.warn()`, and `log.error()` are **not** subject to the interceptor rule — use them freely for operationally significant events (e.g. Keycloak sync success, cache eviction, unexpected state).
- `GlobalExceptionHandler` remains responsible for `log.error()` on unhandled exceptions — do not duplicate error logging in the service layer.
- `DynamicAuthorizationManager` may keep its own debug logging for access-decision context — it is not an HTTP service method.

### What to Log vs. What Not to Log

| Scenario | Correct approach |
|----------|------------------|
| Request received / response sent | `LoggingInterceptor` (automatic) |
| Method entry / exit in service | ❌ Do NOT add — interceptor handles this |
| Method parameters echoed in service | ❌ Do NOT add — redundant with interceptor |
| Result size / ID of saved entity | ❌ Do NOT add — interceptor covers success status |
| Significant mid-logic state (e.g. cache miss, branch taken) | ✅ `if (log.isDebugEnabled()) { log.debug("...") }` |
| External system call result (Keycloak, DB batch count) | ✅ `log.info(...)` — operationally significant |
| Unhandled exception context | ✅ `log.error(...)` in `GlobalExceptionHandler` only |

### Files

| File | Location |
|------|----------|
| `LoggingInterceptor.java` | `api/src/main/java/com/fis/qttt/api/config/` |
| `WebMvcConfig.java` | `api/src/main/java/com/fis/qttt/api/config/` |

---

## Quick Reference

| Category | Rule |
|----------|------|
| Architecture | API → Application → Domain → Common (one-way dependency) |
| Entity base | Extend `AbstractAuditing<UUID>`, never declare audit fields directly |
| ID strategy | `@GeneratedValue(strategy = GenerationType.UUID)` + `columnDefinition = "uuid"` |
| Soft delete | `deleted = true` + `endDate = CURRENT_TIMESTAMP` via `@Modifying @Query` |
| DTO validation | `@NotBlank`, `@Size` with message key `"{entity.field.rule}"` |
| Mapper | MapStruct interface; always ignore audit fields + lazy relations in `toEntity` |
| Service class | `@Transactional(readOnly = true)` + write methods override with `@Transactional` |
| Exception | `Constants.ErrorCode.*` + `Constants.MessageKey.*` — never inline strings |
| Controller response | Direct DTO return; `@ResponseStatus` for 201/204; never `ResponseEntity` |
| Pagination | `PageResponseDto<T>`; 0-based page; `@PostMapping("/search")` + `@RequestBody SearchDto` |
| Caching | Cache names from `CacheConstants`; `@CacheEvict(allEntries = true)` on all writes |
| Auth token | Read via `TokenUtils.getUsername()` — never call `SecurityContextHolder` in entities/DTOs |
| Logging | `LoggingInterceptor` handles request lifecycle; never add entry/exit debug logs in services; guard mid-logic `log.debug()` with `if (log.isDebugEnabled())` |
| DI | `@RequiredArgsConstructor` + `final` fields — never `@Autowired` |
| i18n | Keys in all three `messages*.properties` files; `MessageSource` only in `GlobalExceptionHandler` |
| DDL | `ddl-auto: none` — schema managed by `init_db.sql` |
| open-in-view | Always `false` — solve lazy-load in service layer |
| JSONB | `@JdbcTypeCode(SqlTypes.JSON)` + `columnDefinition = "jsonb"` |
| Hierarchy path | `catLevel` starts at 1; `catPath` uses `/` separator with codes |
