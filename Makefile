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

.PHONY: help all build-common start stop restart status logs clean keycloak-start keycloak-stop start-mock stop-mock start-fe-dev stop-fe-dev

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
	@echo -e "  $(YELLOW)make start-mock$(NC)     - Start mock server + frontend in mock mode (dev local)"
	@echo -e "  $(YELLOW)make stop-mock$(NC)      - Stop mock server + frontend mock processes"
	@echo -e "  $(YELLOW)make start-fe-dev$(NC)   - Start frontend locally against real backend (dev mode)"
	@echo -e "  $(YELLOW)make stop-fe-dev$(NC)    - Stop locally-running frontend dev processes"
	@echo -e "  $(YELLOW)make install-e2e$(NC)    - Install Playwright and all E2E dependencies"
	@echo -e "  $(YELLOW)make test-e2e$(NC)       - Run E2E tests (mock mode, auto-starts mock server + app)"
	@echo -e "  $(YELLOW)make test-e2e-real$(NC)  - Run E2E tests against real backend (requires real BE + Keycloak running)"
	@echo -e "  $(YELLOW)make test-e2e-ui$(NC)    - Open Playwright UI mode"
	@echo -e "  $(YELLOW)make test-e2e-headed$(NC)- Run E2E tests with browser visible"
	@echo -e "  $(YELLOW)make test-e2e-docker$(NC)- Run E2E tests via Docker (CI)"
	@echo -e "  $(YELLOW)make test-e2e-report$(NC)- Open last test HTML report"

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

start-mock:
	@mkdir -p $(LOG_DIR)
	@echo -e "$(YELLOW)Starting Mock Server (background)...$(NC)"
	@cd fe/mock-server && npm install --silent
	@cd fe/mock-server && nohup node server.js > $(LOG_DIR)/mock-server.log 2>&1 & echo $$! > $(LOG_DIR)/mock-server.pid
	@echo -e "$(GREEN)Mock server running on http://localhost:9090 (PID: $$(cat $(LOG_DIR)/mock-server.pid))$(NC)"
	@echo -e "$(YELLOW)Starting Frontend (mock mode)...$(NC)"
	@cd fe/vdbas_exp_fe && nohup npm run dev:mock > $(LOG_DIR)/vdbas_exp_fe-mock.log 2>&1 &
	@cd fe/vdbas_host && nohup npm run dev:mock > $(LOG_DIR)/vdbas_host-mock.log 2>&1 &
	@echo -e "$(GREEN)Frontend mock started. Logs: $(LOG_DIR)/$(NC)"

stop-mock:
	@echo -e "$(RED)Stopping Mock Server...$(NC)"
	@if [ -f $(LOG_DIR)/mock-server.pid ]; then \
		kill $$(cat $(LOG_DIR)/mock-server.pid) 2>/dev/null || true; \
		rm -f $(LOG_DIR)/mock-server.pid; \
	fi
	@pkill -f "vdbas_exp_fe.*dev:mock" 2>/dev/null || true
	@pkill -f "vdbas_host.*dev:mock" 2>/dev/null || true
	@echo -e "$(GREEN)Mock services stopped.$(NC)"

# Run FE locally in real mode (against real backend — no mock server needed).
# Backend must already be running (make start-be or Docker).
start-fe-dev:
	@mkdir -p $(LOG_DIR)
	@echo -e "$(YELLOW)Starting Frontend (real backend mode)...$(NC)"
	@cd fe/vdbas_exp_fe && nohup npm run dev > $(LOG_DIR)/vdbas_exp_fe-dev.log 2>&1 &
	@cd fe/vdbas_host && nohup npm run dev > $(LOG_DIR)/vdbas_host-dev.log 2>&1 &
	@echo -e "$(GREEN)Frontend dev started (VITE_MOCK_AUTH=false). Logs: $(LOG_DIR)/$(NC)"

stop-fe-dev:
	@echo -e "$(RED)Stopping Frontend dev processes...$(NC)"
	@pkill -f "vdbas_exp_fe.*vite" 2>/dev/null || true
	@pkill -f "vdbas_host.*vite" 2>/dev/null || true
	@echo -e "$(GREEN)Frontend dev processes stopped.$(NC)"

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

BE_HEALTH_TIMEOUT := 120

.PHONY: install-e2e test-e2e test-e2e-real wait-be test-e2e-ui test-e2e-headed test-e2e-docker test-e2e-report

install-e2e:
	@echo -e "$(BLUE)Installing E2E test dependencies...$(NC)"
	@cd fe/mock-server && npm install
	@cd fe/vdbas_exp_fe && npm install
	@cd fe/e2e && npm install

test-e2e:
	@echo -e "$(BLUE)Running E2E tests (mock mode — auto-starts mock server + app)...$(NC)"
	@cd fe/e2e && npm test

wait-be:
	@echo -e "$(YELLOW)Waiting for backends to be ready (timeout: $(BE_HEALTH_TIMEOUT)s each)...$(NC)"
	@elapsed=0; \
	printf "  quantri_be :8082 "; \
	until curl -sf --max-time 3 http://localhost:8082/actuator/health >/dev/null 2>&1; do \
		if [ $$elapsed -ge $(BE_HEALTH_TIMEOUT) ]; then \
			printf "\n"; \
			echo -e "$(RED)ERROR: quantri_be :8082 not ready after $(BE_HEALTH_TIMEOUT)s.$(NC)"; \
			echo -e "$(RED)       Check logs: docker logs vdbas-quantri-api$(NC)"; \
			exit 1; \
		fi; \
		printf "."; sleep 3; elapsed=$$((elapsed+3)); \
	done; \
	echo -e " $(GREEN)OK ($$elapsed s)$(NC)"
	@elapsed=0; \
	printf "  exp_be     :8085 "; \
	until curl -sf --max-time 3 http://localhost:8085/actuator/health >/dev/null 2>&1; do \
		if [ $$elapsed -ge $(BE_HEALTH_TIMEOUT) ]; then \
			printf "\n"; \
			echo -e "$(RED)ERROR: exp_be :8085 not ready after $(BE_HEALTH_TIMEOUT)s.$(NC)"; \
			echo -e "$(RED)       Check logs: docker logs vdbas-exp-api$(NC)"; \
			exit 1; \
		fi; \
		printf "."; sleep 3; elapsed=$$((elapsed+3)); \
	done; \
	echo -e " $(GREEN)OK ($$elapsed s)$(NC)"
	@echo -e "$(GREEN)Both backends ready — running tests.$(NC)"

test-e2e-real: start-be wait-be
	@echo -e "$(BLUE)Running E2E tests against real backend...$(NC)"
	@echo -e "$(YELLOW)FE auto-started by Playwright. Ensure Keycloak is running (make keycloak-start).$(NC)"
	@cd fe/e2e && npm run test:real

test-e2e-ui:
	@echo -e "$(BLUE)Opening Playwright UI mode...$(NC)"
	@cd fe/e2e && npm run test:ui

test-e2e-headed:
	@echo -e "$(BLUE)Running E2E tests (headed)...$(NC)"
	@cd fe/e2e && npm run test:headed

test-e2e-docker:
	@echo -e "$(BLUE)Running E2E tests via Docker (CI)...$(NC)"
	@docker run --rm --network="host" \
		-v $(ROOT_DIR):/work \
		-w /work/fe/e2e \
		mcr.microsoft.com/playwright:v1.60.0-noble \
		/bin/bash -c "npm install && npm test"

test-e2e-report:
	@echo -e "$(BLUE)Opening Playwright test report...$(NC)"
	@cd fe/e2e && npx playwright show-report
