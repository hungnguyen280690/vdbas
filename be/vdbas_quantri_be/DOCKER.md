# Docker Deployment Guide - 3-Tier Architecture

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Spring Boot    │────▶│  Oracle     │
│   (React)       │     │  API (8080)     │     │  (1521)         │
└─────────────────┘     └────────┬────────┘     └─────────────────┘

```

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 2. Build & Run

```bash
# Build Docker image
docker-compose build

# Start application only (using external DB)
docker-compose up -d app

# Start all services (including Oracle)
docker-compose up -d
```

### 3. Verify

```bash
# Check container status
docker-compose ps

# View application logs
docker-compose logs -f app

# Test health endpoint
curl http://localhost:8080/actuator/health
```

## Deployment Scenarios

### Scenario 1: Deploy with External DB (Recommended for Production)

Use existing database server.

**.env configuration:**
```bash
SPRING_PROFILES_ACTIVE=dev
DEV_DB_HOST=172.27.236.112
DEV_DB_NAME=ORCLPDB1
DEV_DB_USER=vdbas
DEV_DB_PASSWORD=vdbas@123
```

**Start:**
```bash
docker-compose up -d app
```

### Scenario 2: Deploy with Local Oracle

Run Oracle in Docker.

**Start:**
```bash
docker-compose up -d
```

### Scenario 3: Full Local Development

Run everything locally for development.

**Start:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile (dev/prod/uat) | `dev` |
| `DEV_DB_HOST` | Oracle host | `oracle` |
| `DEV_DB_NAME` | Database name | `qttt_db` |
| `DEV_DB_USER` | Database user | `vdbas` |
| `DEV_DB_PASSWORD` | Database password | `qttt@123` |
| `DEV_ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `JAVA_OPTS` | JVM options | `-Xms2g -Xmx4g -XX:+UseG1GC` |

## Useful Commands

```bash
# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f app
docker-compose logs -f oracle

# Access application container
docker exec -it vdbas-qttt-be sh

# Access Oracle container
docker exec -it vdbas-oracle psql -U vdbas -d qttt_db

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View resource usage
docker stats
```

## Production Deployment

### 1. Build Image

```bash
docker build -t vdbas-qttt-be:1.0.0 .
```

### 2. Push to Registry

```bash
docker tag vdbas-qttt-be:1.0.0 your-registry/vdbas-qttt-be:1.0.0
docker push your-registry/vdbas-qttt-be:1.0.0
```

### 3. Deploy to Server

```bash
# On production server
docker pull your-registry/vdbas-qttt-be:1.0.0

# Run with environment variables
docker run -d \
  --name vdbas-qttt-be \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e DEV_DB_HOST=172.27.236.112 \
  -e DEV_DB_USER=vdbas \
  -e DEV_DB_PASSWORD=qttt@123 \
  -e JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC" \
  your-registry/vdbas-qttt-be:1.0.0
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Verify database connectivity
docker exec -it vdbas-qttt-be ping -c 3 172.27.236.112

# Check environment variables
docker exec -it vdbas-qttt-be env | grep DEV_
```

### Database connection issues

```bash
# Test connection from app container
docker exec -it vdbas-qttt-be nc -zv 172.27.236.112 1521
```

### Clear and rebuild

```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

## Log Location

Application logs are stored in Docker volume `app-logs`.

```bash
# Access logs
docker run --rm -v app-logs:/app/logs alpine ls -la /app/logs
```

## Monitoring

- **Health Check**: http://localhost:8080/actuator/health
- **Metrics**: http://localhost:8080/actuator/metrics
- **Info**: http://localhost:8080/actuator/info
- **Swagger UI**: http://localhost:8080/docs/swagger-ui.html
