#!/bin/bash

# Configuration and colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROOT_DIR="$(pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

PIDS=()

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}        VDBAS Run All Services Utility Script          ${NC}"
echo -e "${BLUE}========================================================${NC}"

# Function to stop any docker container using a specific port
stop_docker_on_port() {
    local port=$1
    local container_id=$(docker ps --format "{{.ID}} {{.Ports}}" | grep -E ":$port->" | cut -d' ' -f1)
    if [ -n "$container_id" ]; then
        local c_name=$(docker ps --filter "id=$container_id" --format "{{.Names}}")
        echo -e "${YELLOW}Port $port is used by Docker container: $c_name ($container_id). Stopping container...${NC}"
        docker stop "$container_id" >/dev/null 2>&1
    fi
}

# Function to kill process on a port
kill_port() {
    local port=$1
    stop_docker_on_port $port
    local pid=$(lsof -t -i :$port)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Port $port is in use by PID(s): $pid. Terminating...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Cleanup handler on Exit/Ctrl+C
cleanup() {
    echo -e "\n${RED}Stopping all services and cleaning up...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    
    # Terminate any remaining java/node processes on specified ports
    kill_port 8082
    kill_port 8085
    kill_port 3000
    kill_port 3003
    
    echo -e "${GREEN}All services stopped successfully.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Clean up ports before starting
echo -e "${YELLOW}Checking and cleaning ports...${NC}"
kill_port 8082  # vdbas_quantri_be
kill_port 8085  # vdbas_exp_be
kill_port 3000  # vdbas_host (FE)
kill_port 3003  # vdbas_exp_fe (FE)
# Also clean up 8085 and 3003 docker containers to prevent duplicate apps
stop_docker_on_port 8085
stop_docker_on_port 3003


# 2. Setup Frontends Env and Dependencies
setup_frontend() {
    local fe_dir=$1
    local name=$2
    
    echo -e "\n${BLUE}Setting up Frontend: $name...${NC}"
    cd "$ROOT_DIR/fe/$fe_dir" || exit 1
    
    # Copy env if missing
    if [ ! -f ".env" ] && [ -f ".env.development" ]; then
        echo -e "${YELLOW}Copying .env.development to .env for $name${NC}"
        cp .env.development .env
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules not found. Running npm install for $name...${NC}"
        npm install
    fi
}

setup_frontend "vdbas_host" "Host App (Port 3000)"
setup_frontend "vdbas_exp_fe" "Expense App (Port 3003)"

# 3. Compile Backend Shared Library if not already done
echo -e "\n${BLUE}Ensuring Backend Shared Library is built...${NC}"
if [ ! -f "$HOME/.m2/repository/com/fis/vdbas/vdbas-common/1.0.0-SNAPSHOT/vdbas-common-1.0.0-SNAPSHOT.jar" ]; then
    echo -e "${YELLOW}vdbas-common jar not found. Compiling now...${NC}"
    cd "$ROOT_DIR/be/vdbas_common" || exit 1
    mvn clean install -DskipTests
else
    echo -e "${GREEN}vdbas-common library is already compiled.${NC}"
fi

# 4. Start Services
echo -e "\n${BLUE}Starting all services concurrently...${NC}"

# A. Start Backend - vdbas_quantri_be (Port 8082)
echo -e "${YELLOW}Starting Admin Backend (vdbas_quantri_be) on port 8082...${NC}"
cd "$ROOT_DIR/be/vdbas_quantri_be" || exit 1
export DB_HOST=172.16.5.20
export DB_PORT=1521
export DB_NAME=vdbaspdb
export DB_USER=vdbas_qtdc
export DB_PASSWORD=qttt@123
export SERVER_PORT=8082
export APP_PORT=8082
export KEYCLOAK_URL=https://vst-sso.apps.ocp.vst.gov.vn
export KEYCLOAK_REALM=vdbas_dev
export KEYCLOAK_SECRET=JIWKPyo2KS68qgQXJKxh7bI4LnVvIRAT
export KEYCLOAK_DEFAULT_PASSWORD=ChangeMe123!
export CACHE_TYPE=memory
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
export SWAGGER_ENABLED=true
export LOG_LEVEL_APP=DEBUG
export LOG_LEVEL_SQL=INFO

mvn spring-boot:run -pl api -Dspring-boot.run.arguments="--server.port=8082" > "$LOG_DIR/quantri_be.log" 2>&1 &
PIDS+=($!)

# B. Start Backend - vdbas_exp_be (Port 8085)
echo -e "${YELLOW}Starting Expense Backend (vdbas_exp_be) on port 8085...${NC}"
cd "$ROOT_DIR/be/vdbas_exp_be" || exit 1
export DB_HOST=172.16.5.20
export DB_PORT=1521
export DB_NAME=vdbaspdb
export DB_USER=vdbas_exp
export DB_PASSWORD=vdbas_exp
export SERVER_PORT=8085
export APP_PORT=8085
export DB_DDL_AUTO=update
export CACHE_TYPE=memory
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3003,http://localhost:5173
export SWAGGER_ENABLED=true
export LOG_LEVEL_APP=DEBUG
export LOG_LEVEL_SQL=INFO

mvn spring-boot:run -pl api -Dspring-boot.run.arguments="--server.port=8085" > "$LOG_DIR/exp_be.log" 2>&1 &
PIDS+=($!)

# C. Start Frontend - vdbas_exp_fe (Port 3003)
echo -e "${YELLOW}Starting Expense Frontend (vdbas_exp_fe) on port 3003...${NC}"
cd "$ROOT_DIR/fe/vdbas_exp_fe" || exit 1
npm run dev > "$LOG_DIR/exp_fe.log" 2>&1 &
PIDS+=($!)

# D. Start Frontend - vdbas_host (Port 3000)
echo -e "${YELLOW}Starting Host Frontend (vdbas_host) on port 3000...${NC}"
cd "$ROOT_DIR/fe/vdbas_host" || exit 1
npm run dev > "$LOG_DIR/host_fe.log" 2>&1 &
PIDS+=($!)

# 5. Display Status Table
echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}              ALL SERVICES STARTED SUCCESSFULLY (BACKGROUND)            ${NC}"
echo -e "${GREEN}========================================================================${NC}"
printf "${BLUE}%-25s | %-6s | %-35s${NC}\n" "Service" "Port" "Log File"
echo -e "---------------------------+--------+-----------------------------------"
printf "%-25s | %-6s | %-35s\n" "Admin BE (quantri_be)" "8082" "logs/quantri_be.log"
printf "%-25s | %-6s | %-35s\n" "Expense BE (exp_be)" "8085" "logs/exp_be.log"
printf "%-25s | %-6s | %-35s\n" "Host Frontend (host)" "3000" "logs/host_fe.log"
printf "%-25s | %-6s | %-35s\n" "Expense Frontend (exp_fe)" "3003" "logs/exp_fe.log"
echo -e "---------------------------+--------+-----------------------------------"
echo -e "${YELLOW}Press Ctrl+C at any time to gracefully shut down all services.${NC}"
echo -e "To view live logs, run: ${BLUE}tail -f logs/*.log${NC}"
echo -e "${GREEN}========================================================================${NC}"

# Hold execution
wait
