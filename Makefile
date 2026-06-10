# Variables
ROOT_DIR := $(shell pwd)
LOG_DIR := $(ROOT_DIR)/logs
COMMON_JAR := $(HOME)/.m2/repository/com/fis/vdbas/vdbas-common/1.0.0-SNAPSHOT/vdbas-common-1.0.0-SNAPSHOT.jar

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

.PHONY: help all build-common start stop restart status logs clean keycloak-start keycloak-stop

help:
	@echo -e "$(BLUE)VDBAS Management Commands:$(NC)"
	@echo -e "  $(YELLOW)make all$(NC)          - Build common lib and start all services (Docker)"
	@echo -e "  $(YELLOW)make build-common$(NC) - Build the shared backend library (vdbas-common)"
	@echo -e "  $(YELLOW)make start$(NC)        - Start all services using Docker Compose"
	@echo -e "  $(YELLOW)make stop$(NC)         - Stop all services using Docker Compose"
	@echo -e "  $(YELLOW)make restart$(NC)      - Stop and then start all services"
	@echo -e "  $(YELLOW)make status$(NC)       - Show status of all containers"
	@echo -e "  $(YELLOW)make logs$(NC)         - Show logs of all services"
	@echo -e "  $(YELLOW)make clean$(NC)        - Remove all containers and build artifacts"
	@echo -e "  $(YELLOW)make keycloak-start$(NC) - Start local Keycloak on port 8180"
	@echo -e "  $(YELLOW)make keycloak-stop$(NC)  - Stop local Keycloak"

all: build-common start-be start-fe status

stop: stop-be stop-fe status

restart: stop-be stop-fe start-be start-fe status

build-common:
	@echo -e "$(YELLOW)Ensuring vdbas-common is built...$(NC)"
	@if [ ! -f $(COMMON_JAR) ]; then \
		echo -e "$(BLUE)Compiling vdbas-common...$(NC)"; \
		cd be/vdbas_common && mvn clean install -DskipTests; \
	else \
		echo -e "$(GREEN)vdbas-common already exists.$(NC)"; \
	fi

keycloak-start:
	@echo -e "$(YELLOW)Starting Keycloak (local dev)...$(NC)"
	@cd infra/keycloak && docker compose up -d
	@echo -e "$(GREEN)Keycloak admin console: http://localhost:8180 (admin/admin)$(NC)"

keycloak-stop:
	@echo -e "$(RED)Stopping Keycloak...$(NC)"
	@cd infra/keycloak && docker compose down || true

start-db:
	@echo -e "$(YELLOW)Starting Infrastructure (Oracle)...$(NC)"
	@cd be/oracle-db && docker compose up -d

start-be:
	@echo -e "$(YELLOW)Starting Backend Services...$(NC)"
	@cd be/vdbas_quantri_be && docker compose up -d --build
	@cd be/vdbas_exp_be && docker compose up -d --build

start-fe:
	@echo -e "$(YELLOW)Starting Frontend Services...$(NC)"
	@cd fe/vdbas_host && docker compose up -d --build
	@cd fe/vdbas_exp_fe && docker compose up -d --build

stop-fe:
	@echo -e "$(RED)Stopping Frontend Services...$(NC)"
	@cd fe/vdbas_exp_fe && docker compose down || true
	@cd fe/vdbas_host && docker compose down || true

stop-be:
	@echo -e "$(RED)Stopping Backend Services...$(NC)"
	@cd be/vdbas_exp_be && docker compose down || true
	@cd be/vdbas_quantri_be && docker compose down || true

stop-db:
	@echo -e "$(RED)Stopping Infrastructure...$(NC)"
	@cd be/oracle-db && docker compose down || true

restart: stop start

status-infa:
	@echo -e "$(GREEN)Current Container Status:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "oracle|keycloak" || echo "No infra running."

status:
	@echo -e "$(GREEN)Current Container Status:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "vdbas" || echo "No containers running."


logs:
	@echo -e "$(BLUE)Showing live logs (Ctrl+C to stop)...$(NC)"
	@docker compose -f be/vdbas_quantri_be/docker-compose.yml -f be/vdbas_exp_be/docker-compose.yml -f fe/vdbas_host/docker-compose.yml -f fe/vdbas_exp_fe/docker-compose.yml logs -f

clean: stop
	@echo -e "$(YELLOW)Cleaning build artifacts...$(NC)"
	@cd be/vdbas_common && mvn clean
	@cd be/vdbas_quantri_be && mvn clean
	@cd be/vdbas_exp_be && mvn clean

.PHONY: test-e2e test-e2e-report install-e2e

install-e2e:
	@echo -e "$(BLUE)Installing Playwright and dependencies...$(NC)"
	@cd fe/vdbas_exp_fe && npm install && npx playwright install chromium --with-deps

test-e2e:
	@echo -e "$(BLUE)Running Playwright E2E tests via Docker...$(NC)"
	@docker run --rm --network="host" \
		-v $(ROOT_DIR):/work \
		-w /work/fe/vdbas_exp_fe \
		mcr.microsoft.com/playwright:v1.60.0-noble \
		/bin/bash -c "npx playwright test"

test-e2e-report:
	@echo -e "$(BLUE)Opening Playwright Test Report...$(NC)"
	@cd fe/vdbas_exp_fe && npx playwright show-report
