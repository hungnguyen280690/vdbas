# vdbas-exp-be

Spring Boot backend exp for VDBAS projects. Provides a clean, production-ready skeleton with JWT authentication, dynamic API authorization, Oracle DB, and caching — all business domain code removed and ready for new feature development.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    vdbas-exp-be                     │
│                                                         │
│  api (port 8080)                                        │
│  ┌──────────────────┐                                   │
│  │  REST Controllers │                                   │
│  │  Security Config  │                                   │
│  │  GlobalExHandler  │                                   │
│  └────────┬─────────┘                                   │
│           │                                             │
│  application                                            │
│  ┌──────────────────┐                                   │
│  │  AuthorizationSvc │                                   │
│  │  Exceptions/DTOs  │                                   │
│  └────────┬─────────┘                                   │
│           │                                             │
│  domain (JPA entities + repositories)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  auth: Application, Permission, Role, RolePermission│ │
│  │         SharedApiResource, SystemApiPermission      │ │
│  │  user: User, UserRole                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  common (constants, enums, utils)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Constants, CacheConstants, TokenUtils            │  │
│  │  enums: AuthSource, OwnerType                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Module Dependency Direction (Clean Architecture)

```
api  →  application  →  domain  →  common
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 4.0.5 |
| Build | Maven (multi-module) |
| Database | Oracle 19c+ |
| Auth | JWT / OAuth2 Resource Server |
| Cache | Caffeine (dev) / Redis (prod) |
| ORM | Spring Data JPA / Hibernate |
| Mapper | MapStruct 1.5.5 |
| Docs | SpringDoc OpenAPI 3 (Swagger UI) |

---

## Project Structure

```
vdbas-exp-be/
├── common/                         # Shared constants, enums, utils
│   └── .../common/
│       ├── Constants.java
│       ├── CacheConstants.java
│       ├── enums/AuthSource.java
│       ├── enums/OwnerType.java
│       └── util/TokenUtils.java
│
├── domain/                         # JPA entities + repositories
│   └── .../domain/
│       ├── AbstractAuditing.java
│       ├── AbstractAuditingCreate.java
│       ├── auth/  (Application, Permission, Role, RolePermission, ...)
│       └── user/  (User, UserRole)
│
├── application/                    # Business services, DTOs, exceptions
│   └── .../application/
│       ├── auth/AuthorizationService.java
│       ├── auth/           (AuthorizationService)
│       ├── common/dto/     (ErrorResponseDto, PageResponseDto, ...)
│       └── exception/      (BusinessException hierarchy)
│
├── api/                            # REST layer, security, configuration
│   └── .../
│       ├── expApplication.java
│       ├── api/config/   (SecurityConfig, JpaConfig, CacheConfig)
│       ├── api/exception/GlobalExceptionHandler.java
│       └── api/security/ (CustomJwtAuthenticationConverter, DynamicAuthorizationManager)
│
├── Dockerfile
├── docker-compose.yml
├── run-dev.bat
└── pom.xml
```

---

## Prerequisites

- **Java 21** (Eclipse Temurin recommended)
- **Maven 3.9+**
- **Oracle 19c+** — database must exist before starting


---

## Quick Start (Local)

### 1. Configure environment

Copy and edit the environment variables in `run-dev.bat` (Windows) or set them in your shell:

```bash
# Database
DEV_DB_HOST=localhost
DEV_DB_NAME=exp_db
DEV_DB_USER=exp
DEV_DB_PASSWORD=exp@123

```

### 2. Run with the batch script (Windows)

```bat
run-dev.bat
```

Choose:
- **1** — Build and run API (port 8080)
- **2** — Deploy to Docker
- **3** — Stop all containers

### 3. Run manually

```bash
# Build all modules
mvn clean install -DskipTests

# Run API
cd api
mvn spring-boot:run -Dspring-boot.run.profiles=localhost
```

---

## Spring Profiles

| Profile | Description | Config file |
|---------|-------------|-------------|
| `localhost` | Local developer machine | `application-localhost.yml` |
| `dev` | Development server | `application-dev.yml` |
| `prod` | Production (Redis, ddl-auto: validate) | `application-prod.yml` |

---

## API Endpoints

| Path | Description |
|------|-------------|
| `GET /actuator/health` | Health check (public) |
| `GET /docs/swagger-ui.html` | Swagger UI (public, disabled in prod) |
| `POST /api/**` | Business endpoints — JWT required, permission checked |

---

## Authorization Model

Requests to `/api/**` require a valid JWT. Authorities are loaded from the database:

| Type | Format | Example |
|------|--------|---------|
| Role | `ROLE_<ROLE_CODE>` | `ROLE_exp_ADMIN` |
| API Permission | `API:<METHOD>:<PATH>` | `API:GET:/api/users/**` |

Permissions are stored in the `permissions` table and assigned via `role_permission` → `user_role`.

---

## Security

- **Never** commit secrets to the repository. Use environment variables or a `.env` file (`.env` is in `.gitignore`).
- **Never** use `@PreAuthorize` on individual methods — all authorization goes through `DynamicAuthorizationManager`.
- Token refresh and Bearer header injection are handled automatically — never add `Authorization` headers manually.

---

## Adding a New Feature

1. **Domain** — Add entity + repository in `domain/src/.../domain/{feature}/`
2. **Application** — Add service + DTOs + mapper in `application/src/.../application/{feature}/`
3. **API** — Add controller in `api/src/.../api/{feature}/`
4. **Constants** — Add `Resource`, `ErrorCode`, `MessageKey` entries to `Constants.java`
5. **Messages** — Add i18n keys to `messages.properties`, `messages_vi.properties`, `messages_en.properties`
6. **Permissions** — Insert `Permission` rows and map them via the DB

See `.claude/rules/CODING_RULES.md` for the full coding conventions.

---

## Docker

See [DOCKER.md](DOCKER.md) for container deployment instructions.

---

## Useful Commands

```bash
# Full build (all modules)
mvn clean install -DskipTests

# Build only api and dependencies
mvn clean install -DskipTests -pl common,domain,application,api -am

# Run tests
mvn test

# Check for dependency updates
mvn versions:display-dependency-updates
```
