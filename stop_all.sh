#!/bin/bash

# Configuration and colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}        VDBAS Stop All Services Utility Script          ${NC}"
echo -e "${BLUE}========================================================${NC}"

# Function to stop any docker container using a specific port
stop_docker_on_port() {
    local port=$1
    if command -v docker &> /dev/null; then
        local container_id=$(docker ps --format "{{.ID}} {{.Ports}}" | grep -E ":$port->" | cut -d' ' -f1)
        if [ -n "$container_id" ]; then
            local c_name=$(docker ps --filter "id=$container_id" --format "{{.Names}}")
            echo -e "${YELLOW}Port $port is used by Docker container: $c_name ($container_id). Stopping container...${NC}"
            docker stop "$container_id" >/dev/null 2>&1
        fi
    fi
}

# Function to kill process on a port
kill_port() {
    local port=$1
    stop_docker_on_port $port
    
    local pid=""
    if command -v lsof &> /dev/null; then
        pid=$(lsof -t -i :$port)
    elif command -v fuser &> /dev/null; then
        pid=$(fuser $port/tcp 2>/dev/null)
    fi
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Port $port is in use by PID(s): $pid. Terminating...${NC}"
        kill $pid 2>/dev/null
        sleep 1
        if kill -0 $pid 2>/dev/null; then
            kill -9 $pid 2>/dev/null
        fi
    else
        echo -e "Port $port is clear."
    fi
}

# Stop any running run_all.sh process itself
stop_run_all_script() {
    local run_all_pids=$(pgrep -f "run_all.sh" | grep -v "$$")
    if [ -n "$run_all_pids" ]; then
        echo -e "${YELLOW}Found running run_all.sh with PID(s): $run_all_pids. Stopping...${NC}"
        kill $run_all_pids 2>/dev/null
        sleep 1
    fi
}

echo -e "${YELLOW}Stopping run_all.sh parent process...${NC}"
stop_run_all_script

echo -e "\n${YELLOW}Stopping backend services...${NC}"
kill_port 8082  # vdbas_quantri_be (Admin BE)
kill_port 8085  # vdbas_exp_be (Expense BE)

echo -e "\n${YELLOW}Stopping frontend services...${NC}"
kill_port 3000  # vdbas_host (Host FE)
kill_port 3003  # vdbas_exp_fe (Expense FE)

echo -e "\n${YELLOW}Cleaning up remaining docker containers...${NC}"
stop_docker_on_port 8085
stop_docker_on_port 3003

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}        All services have been stopped.                 ${NC}"
echo -e "${GREEN}========================================================${NC}"
