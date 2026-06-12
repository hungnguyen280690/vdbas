# CODING_RULES — vdbas BE (Java)

---

## ⚠️ Gotchas — đọc trước

```
Package path:   com.fis.vdbas.qtdc.application.{domain}.servcie   ← "servcie" (typo cố ý)
Root package:   com.fis.vdbas.qtdc
Common lib:     com.fis.vdbas.common
deleted/active: Integer (0/1) — KHÔNG phải Boolean
```

---

## 1. Layer & Import

```
common/      ← constants, enums — không import module khác
domain/      ← JPA entity + repository — chỉ import common/
application/ ← service, DTO, mapper — import domain/ + common/
api/         ← controller, config — import application/ + common/
```

**Cấm:** `api/` không được import entity/repository từ `domain/`

---

## 2. API Conventions

```
Prefix   : /api/...          KHÔNG /v1/
Search   : POST + body       KHÔNG GET + param
Response : trả thẳng object  KHÔNG wrapper { code, message, data }
```

**Success** — Spring tự set 200, không dùng `@ResponseStatus`:
```java
public MyDto get(...)             // 200 + object
public PageResponseDto<?> search  // 200 + paged
public MyDto create(...)          // 200 (KHÔNG @ResponseStatus(CREATED))
public void delete(...)           // 200 rỗng (KHÔNG ResponseEntity<Void>)
```

**Error** — `GlobalExceptionHandler` (vdbas_common) xử lý tự động:
```json
{ "timestamp":"...", "status":404, "error":"Not Found",
  "message":"...", "errorCode":"ROLE_NOT_FOUND", "path":"...", "details":[] }
```
Chỉ `throw` đúng exception, không tự build error response.

**Controller rules:**
- KHÔNG `ResponseEntity<>`
- KHÔNG `@ResponseStatus`
- KHÔNG `@Transactional`
- KHÔNG import repository

---

## 3. Entity

```java
@Entity @Table(name = "table_name")   // khớp init_db.sql
@Getter @Setter @ToString             // KHÔNG @Data — StackOverflow với lazy
@NoArgsConstructor
public class MyEntity extends AbstractAuditing<UUID> {

    @Id @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override public UUID getId() { return this.id; }

    @Column(name = "is_deleted", nullable = false)
    @JdbcTypeCode(Types.NUMERIC)
    private Integer deleted = 0;           // Integer, KHÔNG Boolean

    @Column(name = "is_active")
    @JdbcTypeCode(Types.NUMERIC)
    private Integer active = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    @ToString.Exclude
    private MyEntity parent;

    @Column(name = "parent_id")
    private UUID parentId;                 // ghi qua field này, không qua association
}
```

**Rules:**
- Không suffix `Entity` — đúng: `AdministrativeUnit`, sai: `AdministrativeUnitEntity`
- Không khai báo lại `createdAt/updatedAt/createdBy/updatedBy` — có trong `AbstractAuditing`
- Không `@OneToMany` bidirectional
- Column name phải khớp `init_db.sql`

---

## 4. DTO

```java
// Extends BaseAuditingDto — KHÔNG @Builder, KHÔNG @AllArgsConstructor
@Data @EqualsAndHashCode(callSuper = true)
public class MyDto extends BaseAuditingDto {
    private UUID id;
    @NotBlank(message = "{field.required}")  // message key, không hardcode
    private String name;
}

// Tree DTO — @Builder.Default bắt buộc
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MyTreeDto {
    private UUID id;
    @Builder.Default
    private List<MyTreeDto> children = new ArrayList<>();  // BẮT BUỘC
}

// Search DTO — extends BaseSearchDto (có sẵn page/size/sortBy/sortDirection)
@Data @EqualsAndHashCode(callSuper = true)
public class MySearchDto extends BaseSearchDto {
    private String keyword;
    private Boolean deleted;  // null = không lọc
}
```

---

## 5. Repository

```java
@Repository
public interface MyRepository
        extends JpaRepository<MyEntity, UUID>, JpaSpecificationExecutor<MyEntity> {

    // Soft delete — SET cả deleted=1 VÀ endDate
    @Modifying
    @Query("UPDATE MyEntity e SET e.deleted=1, e.active=0, e.endDate=CURRENT_TIMESTAMP WHERE e.id=:id")
    void softDelete(@Param("id") UUID id);
}
```

---

## 6. Service

```java
@Service @RequiredArgsConstructor @Slf4j
@Transactional(readOnly = true)
public class MyService {

    private final MyRepository repository;
    private final MyMapper mapper;

    public PageResponseDto<MyDto> search(MySearchDto criteria) {
        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(),
            Sort.by("desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC,
                criteria.getSortBy() != null ? criteria.getSortBy() : "createdAt"));
        Page<MyEntity> page = repository.findAll(filter(criteria), pageable);
        return PageResponseDto.<MyDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .build();
    }

    public MyDto get(UUID id) {
        return mapper.toDto(
            repository.findById(id)
                .filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(
                    Constants.ErrorCode.NOT_FOUND, Constants.MessageKey.ENTITY_NOT_FOUND,
                    Constants.Resource.MY_ENTITY, "id", id.toString())));
    }

    @Transactional
    public MyDto create(MyDto input) {
        MyEntity e = mapper.toEntity(input);
        if (input.getActive() == null) e.setActive(FLAG_TRUE);
        return mapper.toDto(repository.save(e));
    }

    @Transactional
    public void delete(UUID id) {
        repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        repository.softDelete(id);
    }
}
```

**Rules:**
- `@Transactional` chỉ ở service, không ở controller
- Debug log: `if (log.isDebugEnabled()) { log.debug("...") }`
- Dùng `FLAG_TRUE` / `FLAG_FALSE` từ `com.fis.vdbas.common.util.Constants`

---

## 7. Mapper

```java
@Mapper(componentModel = "spring")
public interface MyMapper extends BooleanIntegerMapper {

    MyDto toDto(MyEntity e);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)   // client không ghi đè timestamp xóa
    @Mapping(target = "parent",    ignore = true)
    MyEntity toEntity(MyDto dto);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted",   ignore = true)
    @Mapping(target = "endDate",   ignore = true)
    @Mapping(target = "parent",    ignore = true)
    void updateEntityFromDto(MyDto dto, @MappingTarget MyEntity entity);

    List<MyDto> toDtoList(List<MyEntity> list);
}
```

---

## 8. Controller Skeleton

```java
@RestController
@RequestMapping("/api/my-entities")
@RequiredArgsConstructor
public class MyEntityController {

    private final MyService service;

    @PostMapping("/search")
    public PageResponseDto<MyDto> search(@RequestBody MySearchDto body) {
        return service.search(body);
    }

    @GetMapping("/{id}")
    public MyDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    public MyDto create(@Valid @RequestBody MyDto body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public MyDto update(@PathVariable UUID id, @Valid @RequestBody MyDto body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
```

---

## 9. Exception & Constants

```java
throw new ResourceNotFoundException(
    Constants.ErrorCode.NOT_FOUND,
    Constants.MessageKey.ENTITY_NOT_FOUND,
    Constants.Resource.MY_ENTITY, "id", id.toString());

throw new DuplicateResourceException(
    Constants.ErrorCode.DUPLICATE,
    Constants.MessageKey.DUPLICATE_ENTRY,
    Constants.Resource.MY_ENTITY, "code", value);
```

Thêm constant mới tại `com.fis.vdbas.qtdc.common.Constants`.

---

## 10. Caching

```java
// 1. Khai báo tên tại com.fis.vdbas.qtdc.common.CacheConstants
public static final String MY_ENTITY_CACHE = "my_entity_cache";

// 2. Đăng ký trong api/config/CacheConfig.java (cả Caffeine và Redis)

// 3. Dùng trong service
@Cacheable(value = CacheConstants.MY_ENTITY_CACHE, key = "'all'")
public List<MyDto> findAll() { ... }

@CacheEvict(value = CacheConstants.MY_ENTITY_CACHE, allEntries = true)
@Transactional
public MyDto create(MyDto input) { ... }
```

---

## 11. Hierarchy & Tree (chỉ khi entity có parentId)

```java
// buildTree — LinkedHashMap để giữ thứ tự DB, KHÔNG HashMap
private List<MyTreeDto> buildTree(List<MyEntity> all) {
    Map<UUID, MyTreeDto> nodeMap = new LinkedHashMap<>();
    for (MyEntity item : all) nodeMap.put(item.getId(), mapper.toTreeDto(item));
    List<MyTreeDto> roots = new ArrayList<>();
    for (MyEntity item : all) {
        MyTreeDto dto = nodeMap.get(item.getId());
        if (item.getParentId() != null && nodeMap.containsKey(item.getParentId()))
            nodeMap.get(item.getParentId()).getChildren().add(dto);
        else roots.add(dto);
    }
    return roots;
}

// computeHierarchyFields — gọi trước mỗi repository.save()
private void computeHierarchyFields(MyEntity entity) {
    if (entity.getParentId() != null) {
        MyEntity parent = repository.findById(entity.getParentId()).orElseThrow();
        entity.setUnitLevel(parent.getUnitLevel() + 1);
        entity.setPath(parent.getPath() + "/" + entity.getCode());
    } else {
        entity.setUnitLevel(1);
        entity.setPath(entity.getCode());
    }
}
```

---

## Quick Reference

| Đúng | Sai |
|------|-----|
| `Integer deleted = 0` | `Boolean deleted = false` |
| `SET deleted=1, endDate=CURRENT_TIMESTAMP` | `SET deleted=true` |
| `@Data @EqualsAndHashCode(callSuper=true) extends BaseAuditingDto` | `@Builder @AllArgsConstructor extends BaseAuditingDto` |
| `@Getter @Setter @ToString` trên Entity | `@Data` trên Entity |
| `@ManyToOne(fetch=LAZY)` | `@ManyToOne` (default EAGER) |
| `application.{domain}.servcie.MyService` | `application.{domain}.service.MyService` |
| `@Builder.Default List<X> children = new ArrayList<>()` | `List<X> children` với `@Builder` |
| Controller không có `@ResponseStatus` | `@ResponseStatus(CREATED)` |
| `/api/my-entities` | `/v1/my-entities` |
| `POST /search` + body | `GET /search` + param |
