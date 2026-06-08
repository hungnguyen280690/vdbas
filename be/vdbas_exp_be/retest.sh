#!/usr/bin/env bash

# Setup environment variables
export DB_HOST=${DB_HOST:-172.16.5.20}
export DB_PORT=${DB_PORT:-1521}
export DB_NAME=${DB_NAME:-vdbaspdb}
export DB_USER=${DB_USER:-vdbas_exp}
export DB_PASSWORD=${DB_PASSWORD:-vdbas_exp}
export SERVER_PORT=8081
export APP_PORT=8081
export DB_DDL_AUTO=update
export CACHE_TYPE=memory
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5002,http://localhost:5173
export SWAGGER_ENABLED=true
export LOG_LEVEL_APP=DEBUG
export LOG_LEVEL_SQL=INFO

echo "Starting vdbas-exp-be on port 8081 in background..."
mvn spring-boot:run -o -pl api -Dspring-boot.run.arguments="--server.port=8081" > exp_be_test_run.log 2>&1 &
APP_PID=$!

cleanup() {
    echo "Stopping backend (PID: $APP_PID)..."
    kill $APP_PID 2>/dev/null
    sleep 2
    kill -9 $APP_PID 2>/dev/null
}
trap cleanup EXIT

echo "Waiting for backend to start (checking health endpoint)..."
TIMEOUT=60
count=0
while [ $count -lt $TIMEOUT ]; do
    if curl -s http://localhost:8081/actuator/health | grep -q '"status":"UP"'; then
        echo "Backend is UP and healthy!"
        break
    fi
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $TIMEOUT ]; then
    echo "ERROR: Backend failed to start or connect to database within $TIMEOUT seconds."
    echo "Please check be/vdbas_exp_be/exp_be_test_run.log for details."
    tail -n 40 exp_be_test_run.log
    exit 1
fi

echo "Running API integration tests..."
python3 test_api.py
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo "API integration tests PASSED!"
else
    echo "API integration tests FAILED!"
fi

exit $TEST_RESULT
