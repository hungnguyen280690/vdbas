---
description: Build a complete Spring Boot multi-module backend API from api_contract/API_CONTRACT.md. Generates domain entities, repositories, application DTOs, MapStruct mappers, service classes, REST controllers, and TDD tests following the project's established patterns.
---

You are a senior Java backend engineer. Generate all Java source files for a Spring Boot 4/Java 21 multi-module project based on the API contract in `api_contract/API_CONTRACT.md` and optional SQL in `api_contract/*.sql`.

## Project structure

- **4 modules**: `common` → `domain` → `application` → `api`
- **Package root**: `com.fis.vdbas.exp`
- **DB**: Oracle (RAW(16) for UUID columns)
- **Stack**: Spring Boot 4.x, Java 21, JPA/Hibernate 6, MapStruct 1.5, Lombok, Spring Data JPA

## Step 1 — Read the contract

1. Read `api_contract/API_CONTRACT.md` — note every endpoint, HTTP method, request/response schema, error code
2. Read `api_contract/*.sql` — extract table names, column names, types, constraints
3. Read existing patterns: `domain/category/Category.java`, `application/category/service/CategoryService.java`, `api/category/CategoryController.java`

## Step 2 — Domain layer

For each entity table:
- `@Entity @Table(name="TABLE_NAME")`
- UUID PK: `@Column(columnDefinition = "RAW(16)")` + `@GeneratedValue`
- Entities with CREATED_BY/UPDATED_BY columns: `extends AbstractAuditing<UUID>` (provides `createdAt`, `updatedAt`, `createdBy`, `updatedBy`)
- Simple entities (master data): plain `@Column` fields, no AbstractAuditing
- Create a `JpaRepository` + `JpaSpecificationExecutor` per entity needing search

## Step 3 — Application layer DTOs

For each API schema:
- `@Data` Lombok
- Request DTOs: `@NotNull`/`@NotBlank`/`@Size` Bean Validation
- Follow API contract field names exactly; use `@JsonProperty` to rename if Java name differs

## Step 4 — MapStruct mappers

- `@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)`
- Use `@Mapping` for field name mismatches (e.g. `createdAt` → `createdDate`)
- Never embed logic in mappers — keep them declarative

## Step 5 — Service classes

- `@Service @RequiredArgsConstructor @Transactional(readOnly = true)`
- Write methods: add `@Transactional`
- Use `PageResponseDto<T>` from `com.fis.vdbas.common.dto` for paginated responses
- Use `ResourceNotFoundException` from `com.fis.vdbas.common.exception` for 404

## Step 6 — REST controllers

- `@RestController @RequestMapping("/api/v1/<resource>") @RequiredArgsConstructor`
- Match HTTP methods + status codes from contract exactly
- File upload: `@RequestPart MultipartFile` with `consumes = MULTIPART_FORM_DATA_VALUE`
- Download: `ResponseEntity<Resource>` with `Content-Disposition` header

## Step 7 — Update Constants.java

Add `ErrorCode` and `MessageKey` constants for the new domain module.

## Step 8 — TDD tests (MANDATORY)

For each service class create a Mockito unit test:
- File: `application/src/test/java/.../service/<ServiceName>Test.java`
- Test EVERY public method: happy path + all failure branches
- Use `@ExtendWith(MockitoExtension.class)` + `@InjectMocks` + `@Mock`

For each controller create a MockMvc unit test (Spring Boot 4.x removed `@WebMvcTest`):
- File: `api/src/test/java/.../api/<module>/<ControllerName>Test.java`
- Use `@ExtendWith(MockitoExtension.class)` + `@InjectMocks` controller + `@Mock` service
- Build MockMvc with `MockMvcBuilders.standaloneSetup(controller).build()` in `@BeforeEach`
- Test: 2xx happy paths, key status codes

## Step 9 — Verify compilation

Run: `mvn compile -pl domain,application,api --no-transfer-progress 2>&1 | tail -40`

Fix any compilation errors before reporting done.

## Reference implementation

See:
- `domain/capex/` — entity + repo patterns for this project
- `application/capex/service/CapexDossierService.java` — service pattern
- `api/capex/CapexDossierController.java` — controller pattern
- `api/src/test/java/.../capex/CapexDossierControllerTest.java` — test pattern
