# Docker Deployment Guide — vdbas-exp-be

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Spring Boot    │────▶│  Oracle         │
│   (React)       │     │  API (8080)     │     │  (1521)         │
└─────────────────┘     └────────┬────────┘     └─────────────────┘

```

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2 GB RAM available

---

## Quick Start

### 1. Configure environment

Create a `.env` file in the project root (it is excluded from git via `.gitignore`):

```bash
# Spring profile
SPRING_PROFILES_ACTIVE=dev

# Database
DEV_DB_HOST=oracle
DEV_DB_NAME=ORCLPDB1
DEV_DB_USER=exp
DEV_DB_PASSWORD=exp@123


# CORS
DEV_ALLOWED_ORIGINS=http://localhost:5173

# JVM
JAVA_OPTS=-Xms512m -Xmx1g -XX:+UseG1GC
```

### 2. Build & Run

```bash
# Build Docker image and start all services (app + oracle)
docker-compose up -d --build

# Start app only (using external DB)
docker-compose up -d app

# View startup logs
docker-compose logs -f app
```

### 3. Verify

```bash
# Check container status
docker-compose ps

# Health check
curl http://localhost:8080/actuator/health

# Swagger UI (dev profile only)
open http://localhost:8080/docs/swagger-ui.html
```

---

## Deployment Scenarios

### Scenario 1: External DB (Recommended for production)

Configure `.env` to point to existing servers, then:

```bash
docker-compose up -d app
```

### Scenario 2: Include Oracle in Docker

Start both app and database:

```bash
docker-compose up -d
```

### Scenario 3: Local development (localhost profile)

Use `run-dev.bat` (Windows) or run Maven directly for fastest iteration without Docker.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile (`dev`/`prod`) | `dev` |
| `DEV_DB_HOST` | Oracle host | `oracle` |
| `DEV_DB_NAME` | Database name | `ORCLPDB1` |
| `DEV_DB_USER` | Database username | `exp` |
| `DEV_DB_PASSWORD` | Database password | `exp@123` |
| `DEV_ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `JAVA_OPTS` | JVM flags | `-Xms512m -Xmx1g -XX:+UseG1GC` |
| `APP_PORT` | Host port mapped to 8080 | `8080` |

---

## Useful Commands

```bash
# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f app
docker-compose logs -f oracle

# Access app container shell
docker exec -it vdbas-exp-be sh

# Access Oracle
docker exec -it exp-oracle sqlplus exp/exp@123@//localhost:1521/ORCLPDB1

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Resource usage
docker stats
```

---

## Production Build

### Build image

```bash
docker build -t vdbas-exp-be:1.0.0 .
```

### Push to registry

```bash
docker tag vdbas-exp-be:1.0.0 your-registry/vdbas-exp-be:1.0.0
docker push your-registry/vdbas-exp-be:1.0.0
```

### Run on server

```bash
docker run -d \
  --name vdbas-exp-be \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e PROD_DB_HOST=db-host \
  -e PROD_DB_NAME=ORCLPDB1 \
  -e PROD_DB_USER=exp \
  -e PROD_DB_PASSWORD=<secret> \
  -e JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC" \
  your-registry/vdbas-exp-be:1.0.0
```

---

## Troubleshooting

### Application won't start

```bash
docker-compose logs app
```

### Database connection issues

```bash
# Test connectivity from app container
docker exec -it vdbas-exp-be nc -zv oracle 1521
```

### Clear and rebuild

```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

---

## Monitoring

| Endpoint | Description |
|----------|-------------|
| `http://localhost:8080/actuator/health` | Health status |
| `http://localhost:8080/actuator/info` | Application info |
| `http://localhost:8080/docs/swagger-ui.html` | Swagger UI (dev only) |
