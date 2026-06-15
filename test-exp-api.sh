#!/usr/bin/env bash
# ==============================================================================
# test-exp-api.sh — Integration test cho CAPEX Dossier API (vdbas_exp_be)
#
# Cách dùng:
#   chmod +x test-exp-api.sh
#   ./test-exp-api.sh                     # build Docker rồi test
#   ./test-exp-api.sh --no-build          # skip build, chỉ test
#   ./test-exp-api.sh --no-docker         # không dùng Docker, test thẳng localhost:8080
#   ./test-exp-api.sh --stop-after        # dừng container sau khi test xong
#   BASE_URL=http://localhost:8085 ./test-exp-api.sh
# ==============================================================================
set -euo pipefail

# ─── Đường dẫn ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/be/vdbas_exp_be"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# ─── Cấu hình có thể override bằng env var ─────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:8085/api/v1}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-120}"   # giây chờ service ready
CONTAINER_NAME="vdbas-exp-api"

# ─── Dữ liệu test mẫu (override nếu DB có dữ liệu khác) ───────────────────────
TEST_PROJECT_CODE="${TEST_PROJECT_CODE:-7004686}"
TEST_PROJECT_MGMT_CODE="${TEST_PROJECT_MGMT_CODE:-1059227}"
TEST_TREASURY_CODE="${TEST_TREASURY_CODE:-BQP_TREASURY}"
TEST_SEND_DATE="${TEST_SEND_DATE:-$(date +%Y-%m-%d)}"
TEST_USER_ID="${TEST_USER_ID:-test-user-001}"

# ─── Flags ─────────────────────────────────────────────────────────────────────
DO_BUILD=true
USE_DOCKER=true
STOP_AFTER=false

for arg in "$@"; do
  case "$arg" in
    --no-build)   DO_BUILD=false ;;
    --no-docker)  USE_DOCKER=false; DO_BUILD=false; BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}" ;;
    --stop-after) STOP_AFTER=true ;;
  esac
done

# ─── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ─── Counters ──────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0
declare -a FAILED_TESTS=()

# ─── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[PASS]${NC} $*"; ((PASS++)); }
fail()    { echo -e "${RED}[FAIL]${NC} $*"; ((FAIL++)); FAILED_TESTS+=("$*"); }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
section() { echo -e "\n${BOLD}${CYAN}══════ $* ══════${NC}"; }

check_deps() {
  for cmd in curl jq docker; do
    command -v "$cmd" &>/dev/null || { echo -e "${RED}[ERROR]${NC} Cần cài '$cmd' trước khi chạy script"; exit 1; }
  done
}

# Gọi API, trả về HTTP body; in lỗi nếu có
call_api() {
  local method="$1" url="$2"; shift 2
  curl -s -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-User-Id: $TEST_USER_ID" \
    "$@"
}

# Kiểm tra HTTP status code
expect_status() {
  local test_name="$1" expected_status="$2" actual_status="$3" body="$4"
  if [[ "$actual_status" == "$expected_status" ]]; then
    success "$test_name → HTTP $actual_status"
    return 0
  else
    fail "$test_name → Mong đợi HTTP $expected_status, nhận HTTP $actual_status"
    echo -e "    Body: $(echo "$body" | jq -C . 2>/dev/null || echo "$body")"
    return 1
  fi
}

# Gọi API và lấy cả status code lẫn body
curl_with_status() {
  local method="$1" url="$2"; shift 2
  local response
  response=$(curl -s -w '\n__HTTP_STATUS__%{http_code}' -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-User-Id: $TEST_USER_ID" \
    "$@")
  local body status
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -1 | sed 's/__HTTP_STATUS__//')
  echo "$status|$body"
}

parse_status() { echo "$1" | cut -d'|' -f1; }
parse_body()   { echo "$1" | cut -d'|' -f2-; }

# ─── Docker: build & start ──────────────────────────────────────────────────────
docker_build() {
  section "Docker Build"
  log "Building Docker image từ $COMPOSE_FILE ..."
  docker compose -f "$COMPOSE_FILE" build --no-cache
  log "Build hoàn thành."
}

docker_start() {
  section "Docker Start"
  log "Khởi động container ..."
  docker compose -f "$COMPOSE_FILE" up -d
  log "Container đang khởi động: $CONTAINER_NAME"
}

wait_for_service() {
  section "Chờ service sẵn sàng"
  local health_url="$BASE_URL/../actuator/health"
  # Dùng /actuator/health nếu có, fallback dùng /api/v1/master-data/states
  local check_url="${BASE_URL%/api/v1}/actuator/health"
  log "Chờ service tại $check_url (timeout: ${WAIT_TIMEOUT}s) ..."
  local elapsed=0
  while [[ $elapsed -lt $WAIT_TIMEOUT ]]; do
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$check_url" 2>/dev/null || echo "000")
    if [[ "$status" == "200" ]]; then
      log "Service ready sau ${elapsed}s."
      return 0
    fi
    # Thử endpoint khác nếu actuator không expose
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "X-User-Id: $TEST_USER_ID" "$BASE_URL/master-data/states" 2>/dev/null || echo "000")
    if [[ "$status" == "200" ]]; then
      log "Service ready sau ${elapsed}s."
      return 0
    fi
    sleep 3
    ((elapsed+=3))
    echo -n "."
  done
  echo ""
  warn "Service chưa ready sau ${WAIT_TIMEOUT}s — tiếp tục test (có thể fail)."
}

docker_stop() {
  section "Dừng container"
  log "Dừng và xóa container ..."
  docker compose -f "$COMPOSE_FILE" down
}

# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUPS
# ══════════════════════════════════════════════════════════════════════════════

# ─── LOV / Master Data ────────────────────────────────────────────────────────
test_master_data() {
  section "Master Data (LOV)"

  local endpoints=(
    "GET|/master-data/states|LOV.13 Trạng thái hồ sơ"
    "GET|/master-data/payment-types|LOV.03 Loại thanh toán"
    "GET|/master-data/capital-plan-types|LOV.04 Loại kế hoạch vốn"
    "GET|/master-data/currency-types|LOV.05 Loại tiền"
    "GET|/master-data/exchange-rate-types|LOV.06 Loại tỷ giá"
    "GET|/master-data/document-types|LOV.07 Loại chứng từ"
    "GET|/master-data/allocation-criteria|LOV.09 Tiêu thức phân bổ"
    "GET|/master-data/investment-sources|LOV.08 Nguồn đầu tư"
    "GET|/master-data/investment-sources?segmentCode=X|LOV.08 filter by segmentCode"
    "GET|/master-data/treasury|LOV.02 Kho bạc"
    "GET|/master-data/treasury?code=${TEST_TREASURY_CODE}|LOV.02 filter by code"
    "GET|/master-data/projects|LOV.01 Dự án"
    "GET|/master-data/projects?code=${TEST_PROJECT_CODE}|LOV.01 filter by code"
    "GET|/master-data/project-items|LOV.10 Hạng mục dự án"
    "GET|/master-data/project-items?projectCode=${TEST_PROJECT_CODE}|LOV.10 filter by project"
    "GET|/master-data/guarantees|LOV.12 Bảo lãnh"
    "GET|/master-data/gl-segments/2|LOV.11 GL Segment 2 (TKTN)"
    "GET|/master-data/gl-segments/4|LOV.11 GL Segment 4 (NDKT)"
    "GET|/master-data/gl-segments/5|LOV.11 GL Segment 5 (Cấp NS)"
    "GET|/master-data/gl-segments/8|LOV.11 GL Segment 8 (Chương)"
    "GET|/master-data/gl-segments/9|LOV.11 GL Segment 9 (Ngành)"
    "GET|/master-data/gl-segments/10|LOV.11 GL Segment 10 (CTMT)"
    "GET|/master-data/gl-segments/12|LOV.11 GL Segment 12 (Nguồn)"
    "GET|/master-data/gl-segments/13|LOV.11 GL Segment 13 (DP)"
  )

  for entry in "${endpoints[@]}"; do
    IFS='|' read -r method path name <<< "$entry"
    local res
    res=$(curl_with_status "$method" "$BASE_URL$path")
    local status body
    status=$(parse_status "$res")
    body=$(parse_body "$res")
    expect_status "$name" "200" "$status" "$body" || true
    # In số lượng records trả về
    if [[ "$status" == "200" ]]; then
      local count
      count=$(echo "$body" | jq 'length' 2>/dev/null || echo "?")
      echo "    → $count records"
    fi
  done

  # LOV.11 segment không hợp lệ → expect 400 hoặc 404
  local res
  res=$(curl_with_status "GET" "$BASE_URL/master-data/gl-segments/99")
  local status body
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" || "$status" == "404" ]]; then
    success "LOV.11 GL Segment số không hợp lệ (99) → HTTP $status (đúng)"
  else
    fail "LOV.11 GL Segment số không hợp lệ (99) → Mong đợi 400/404, nhận $status"
  fi
}

# ─── Tạo Dossier (Happy Path) ─────────────────────────────────────────────────
test_create_dossier() {
  local payload
  payload=$(cat <<EOF
{
  "sendDate": "${TEST_SEND_DATE}",
  "projectCode": "${TEST_PROJECT_CODE}",
  "projectSpecificCode": null,
  "projectManagementCode": "${TEST_PROJECT_MGMT_CODE}",
  "treasuryCode": "${TEST_TREASURY_CODE}",
  "dataSourceCode": "MANUAL"
}
EOF
)
  local res
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier" -d "$payload")
  local status body
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST /capex-dossier — Tạo hồ sơ mới" "201" "$status" "$body"; then
    CREATED_ID=$(echo "$body" | jq -r '.dossierId // empty')
    CREATED_CODE=$(echo "$body" | jq -r '.dossierCode // empty')
    CREATED_VERSION=$(echo "$body" | jq -r '.version // 1')
    CREATED_STATE=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → dossierId: $CREATED_ID"
    echo "    → dossierCode: $CREATED_CODE"
    echo "    → stateCode: $CREATED_STATE"
    echo "    → version: $CREATED_VERSION"
    return 0
  fi
  return 1
}

# ─── CAPEX Dossier — CRUD + Workflow ─────────────────────────────────────────
test_capex_dossier() {
  section "CAPEX Dossier — CRUD"

  # ── 1. Search (empty) ──────────────────────────────────────────────────────
  local res status body
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "GET /capex-dossier — Danh sách (không filter)" "200" "$status" "$body"; then
    local total
    total=$(echo "$body" | jq '.totalElements // 0')
    echo "    → totalElements: $total"
  fi

  # ── 2. Search với filter ───────────────────────────────────────────────────
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier?stateCode=DRAFT&page=0&size=5")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  expect_status "GET /capex-dossier?stateCode=DRAFT — Filter theo trạng thái" "200" "$status" "$body" || true

  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier?fromDate=2026-01-01&toDate=2026-12-31")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  expect_status "GET /capex-dossier?fromDate...toDate — Filter theo ngày" "200" "$status" "$body" || true

  # ── 3. Tạo hồ sơ ──────────────────────────────────────────────────────────
  CREATED_ID=""; CREATED_CODE=""; CREATED_VERSION=1
  if ! test_create_dossier; then
    warn "Không tạo được hồ sơ — bỏ qua các test phụ thuộc vào dossierId."
    ((SKIP++))
    return
  fi
  local dossier_id="$CREATED_ID"
  local dossier_version="$CREATED_VERSION"

  # ── 4. Get Detail ──────────────────────────────────────────────────────────
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier/$dossier_id")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "GET /capex-dossier/{id} — Chi tiết hồ sơ" "200" "$status" "$body"; then
    local doc_count attach_count
    doc_count=$(echo "$body" | jq '.documents | length')
    attach_count=$(echo "$body" | jq '.attachments | length')
    echo "    → documents: $doc_count, attachments: $attach_count"
  fi

  # ── 5. Get Documents ───────────────────────────────────────────────────────
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier/$dossier_id/documents")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  expect_status "GET /capex-dossier/{id}/documents — Danh sách chứng từ" "200" "$status" "$body" || true

  # ── 6. Update (DRAFT) ──────────────────────────────────────────────────────
  local update_payload
  update_payload=$(cat <<EOF
{
  "sendDate": "$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)",
  "projectCode": "${TEST_PROJECT_CODE}",
  "projectManagementCode": "${TEST_PROJECT_MGMT_CODE}",
  "treasuryCode": "${TEST_TREASURY_CODE}",
  "version": $dossier_version
}
EOF
)
  res=$(curl_with_status "PUT" "$BASE_URL/capex-dossier/$dossier_id" -d "$update_payload")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "PUT /capex-dossier/{id} — Cập nhật hồ sơ (DRAFT)" "200" "$status" "$body"; then
    dossier_version=$(echo "$body" | jq -r '.version // 2')
    echo "    → version mới: $dossier_version"
  fi

  # ── 7. Update với version sai → expect 409 ────────────────────────────────
  local wrong_version_payload
  wrong_version_payload=$(cat <<EOF
{
  "sendDate": "${TEST_SEND_DATE}",
  "projectCode": "${TEST_PROJECT_CODE}",
  "treasuryCode": "${TEST_TREASURY_CODE}",
  "version": 9999
}
EOF
)
  res=$(curl_with_status "PUT" "$BASE_URL/capex-dossier/$dossier_id" -d "$wrong_version_payload")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "409" ]]; then
    success "PUT /capex-dossier/{id} — Version sai → HTTP 409 (Optimistic Lock - đúng)"
  elif [[ "$status" == "400" ]]; then
    success "PUT /capex-dossier/{id} — Version sai → HTTP 400 (chấp nhận được)"
  else
    fail "PUT /capex-dossier/{id} — Version sai → Mong đợi 409, nhận $status"
  fi

  # ── 8. Search tìm thấy code vừa tạo ───────────────────────────────────────
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier?dossierCode=$CREATED_CODE")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "GET /capex-dossier?dossierCode=... — Search by code" "200" "$status" "$body"; then
    local found
    found=$(echo "$body" | jq '.totalElements // 0')
    echo "    → found: $found records với code $CREATED_CODE"
  fi

  # ── 9. Get 404 ────────────────────────────────────────────────────────────
  local fake_id="00000000-0000-0000-0000-000000000000"
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier/$fake_id")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "404" ]]; then
    success "GET /capex-dossier/{id} — ID không tồn tại → HTTP 404 (đúng)"
  else
    fail "GET /capex-dossier/{id} — ID không tồn tại → Mong đợi 404, nhận $status"
  fi

  # ── 10. Upload Attachment ──────────────────────────────────────────────────
  section "Attachment"
  local tmp_file
  tmp_file=$(mktemp /tmp/test-attach-XXXX.txt)
  echo "Test attachment content - $(date)" > "$tmp_file"

  local attach_res attach_status attach_body
  attach_res=$(curl -s -w '\n__HTTP_STATUS__%{http_code}' \
    -X POST "$BASE_URL/capex-dossier/$dossier_id/attachments" \
    -H "X-User-Id: $TEST_USER_ID" \
    -F "file=@$tmp_file;type=text/plain" \
    -F "archiveType=OTHER" \
    -F "description=Test file upload" \
    -F "archiveDate=${TEST_SEND_DATE}")
  attach_body=$(echo "$attach_res" | sed '$d')
  attach_status=$(echo "$attach_res" | tail -1 | sed 's/__HTTP_STATUS__//')

  local archive_id=""
  if expect_status "POST /capex-dossier/{id}/attachments — Upload file" "201" "$attach_status" "$attach_body"; then
    archive_id=$(echo "$attach_body" | jq -r '.archiveId // empty')
    echo "    → archiveId: $archive_id"
  fi
  rm -f "$tmp_file"

  if [[ -n "$archive_id" ]]; then
    # Download attachment
    local dl_status
    dl_status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "X-User-Id: $TEST_USER_ID" \
      "$BASE_URL/capex-dossier/$dossier_id/attachments/$archive_id/download")
    if [[ "$dl_status" == "200" ]]; then
      success "GET /capex-dossier/{id}/attachments/{archiveId}/download — Download file → HTTP 200"
    else
      fail "GET download attachment → Mong đợi 200, nhận $dl_status"
    fi

    # Delete attachment
    res=$(curl_with_status "DELETE" "$BASE_URL/capex-dossier/$dossier_id/attachments/$archive_id")
    status=$(parse_status "$res"); body=$(parse_body "$res")
    if [[ "$status" == "204" ]]; then
      success "DELETE /capex-dossier/{id}/attachments/{archiveId} — Xóa file → HTTP 204"
    else
      fail "DELETE attachment → Mong đợi 204, nhận $status"
    fi
  fi

  # ── 11. Validation errors ──────────────────────────────────────────────────
  section "Validation Errors"

  # Tạo với thiếu required field
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier" \
    -d '{"sendDate":"2026-06-01"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "POST /capex-dossier — Thiếu required fields → HTTP 400 (đúng)"
    local err_fields
    err_fields=$(echo "$body" | jq -r '.errors // [] | map(.field) | join(", ")' 2>/dev/null || echo "?")
    echo "    → Các field lỗi: $err_fields"
  else
    fail "POST /capex-dossier — Thiếu required fields → Mong đợi 400, nhận $status"
  fi

  # Tạo với body rỗng
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier" -d '{}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "POST /capex-dossier — Body rỗng → HTTP 400 (đúng)"
  else
    fail "POST /capex-dossier — Body rỗng → Mong đợi 400, nhận $status"
  fi

  # Delete với reason quá ngắn
  res=$(curl_with_status "DELETE" "$BASE_URL/capex-dossier/$dossier_id" \
    -d '{"deleteReason":"ngắn","confirmReviewed":true}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "DELETE /capex-dossier/{id} — deleteReason < 10 ký tự → HTTP 400 (đúng)"
  else
    fail "DELETE /capex-dossier/{id} — deleteReason quá ngắn → Mong đợi 400, nhận $status"
  fi

  # ── 12. Workflow: DRAFT → PENDING_CHECK → PENDING_APPROVE → APPROVED ──────
  section "Workflow: Happy Path (Submit → CHECK → APPROVE)"

  # Submit
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_id/submit")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST /capex-dossier/{id}/submit — Nộp hồ sơ" "200" "$status" "$body"; then
    local new_state
    new_state=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → stateCode: $new_state (expect: PENDING_CHECK)"
    [[ "$new_state" == "PENDING_CHECK" ]] && success "    stateCode = PENDING_CHECK ✓" || warn "    stateCode = $new_state (mong đợi PENDING_CHECK)"
    dossier_version=$(echo "$body" | jq -r '.version // 1')
  fi

  # Submit lần 2 → expect 400 (sai state)
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_id/submit")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "POST submit lần 2 (đã PENDING_CHECK) → HTTP 400 MSG-ERR-STATUS (đúng)"
  else
    warn "POST submit lần 2 → nhận $status (mong đợi 400)"
  fi

  # Update sau khi submit → expect 400
  res=$(curl_with_status "PUT" "$BASE_URL/capex-dossier/$dossier_id" \
    -d "{\"sendDate\":\"${TEST_SEND_DATE}\",\"version\":$dossier_version}")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "PUT /capex-dossier/{id} — Sau khi submit (VAL-13) → HTTP 400 (đúng)"
  else
    warn "PUT sau khi submit → nhận $status (mong đợi 400)"
  fi

  # Workflow CHECK
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_id/workflow" \
    -d '{"action":"CHECK"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST workflow CHECK (PENDING_CHECK → PENDING_APPROVE)" "200" "$status" "$body"; then
    local st
    st=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → stateCode: $st (expect: PENDING_APPROVE)"
    dossier_version=$(echo "$body" | jq -r '.version // 1')
  fi

  # Workflow APPROVE
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_id/workflow" \
    -d '{"action":"APPROVE"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST workflow APPROVE (PENDING_APPROVE → APPROVED)" "200" "$status" "$body"; then
    local st
    st=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → stateCode: $st (expect: APPROVED)"
  fi

  # ── 13. Workflow: REJECT ────────────────────────────────────────────────────
  section "Workflow: REJECT Flow (Submit → REJECT)"

  CREATED_ID=""; test_create_dossier || { warn "Không tạo được hồ sơ để test REJECT"; ((SKIP++)); return; }
  local dossier_reject_id="$CREATED_ID"

  # Submit
  curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_reject_id/submit" > /dev/null 2>&1 || true

  # Workflow REJECT không có reason → expect 400
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_reject_id/workflow" \
    -d '{"action":"REJECT"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "POST workflow REJECT không có reason → HTTP 400 (đúng)"
  else
    warn "POST workflow REJECT không có reason → nhận $status (mong đợi 400)"
  fi

  # REJECT với reason quá ngắn → expect 400
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_reject_id/workflow" \
    -d '{"action":"REJECT","reason":"ngắn"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "400" ]]; then
    success "POST workflow REJECT reason < 10 ký tự → HTTP 400 (đúng)"
  else
    warn "POST workflow REJECT reason quá ngắn → nhận $status"
  fi

  # REJECT với reason đủ dài
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_reject_id/workflow" \
    -d '{"action":"REJECT","reason":"Hồ sơ thiếu tài liệu chứng minh khối lượng hoàn thành"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST workflow REJECT với reason hợp lệ" "200" "$status" "$body"; then
    local st
    st=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → stateCode: $st (expect: CHECK_REJECTED)"
  fi

  # ── 14. Workflow: RETURN ────────────────────────────────────────────────────
  section "Workflow: RETURN Flow (Submit → CHECK → RETURN về DRAFT)"

  CREATED_ID=""; test_create_dossier || { warn "Không tạo được hồ sơ để test RETURN"; ((SKIP++)); return; }
  local dossier_return_id="$CREATED_ID"

  # Submit
  curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_return_id/submit" > /dev/null 2>&1 || true

  # Checker RETURN (PENDING_CHECK → DRAFT)
  res=$(curl_with_status "POST" "$BASE_URL/capex-dossier/$dossier_return_id/workflow" \
    -d '{"action":"RETURN","reason":"Cần bổ sung thêm tài liệu dự án theo yêu cầu"}')
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if expect_status "POST workflow RETURN (PENDING_CHECK → DRAFT)" "200" "$status" "$body"; then
    local st
    st=$(echo "$body" | jq -r '.stateCode // empty')
    echo "    → stateCode: $st (expect: DRAFT)"
  fi

  # Sau khi RETURN về DRAFT, có thể update lại
  local v
  v=$(echo "$body" | jq -r '.version // 1')
  res=$(curl_with_status "PUT" "$BASE_URL/capex-dossier/$dossier_return_id" \
    -d "{\"sendDate\":\"${TEST_SEND_DATE}\",\"version\":$v}")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "200" ]]; then
    success "PUT sau khi RETURN về DRAFT — có thể update lại (đúng)"
  else
    warn "PUT sau RETURN → nhận $status"
  fi

  # ── 15. Delete (Soft Delete) ───────────────────────────────────────────────
  section "Soft Delete"

  CREATED_ID=""; test_create_dossier || { warn "Không tạo được hồ sơ để test DELETE"; ((SKIP++)); return; }
  local dossier_del_id="$CREATED_ID"

  local del_payload='{"deleteReason":"Hồ sơ nhập sai thông tin dự án cần xóa và tạo lại","confirmReviewed":true}'
  res=$(curl_with_status "DELETE" "$BASE_URL/capex-dossier/$dossier_del_id" -d "$del_payload")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "204" ]]; then
    success "DELETE /capex-dossier/{id} — Soft delete thành công → HTTP 204"
  else
    fail "DELETE /capex-dossier/{id} — Soft delete → Mong đợi 204, nhận $status"
    echo "    Body: $body"
  fi

  # Verify: GET sau khi xóa
  res=$(curl_with_status "GET" "$BASE_URL/capex-dossier/$dossier_del_id")
  status=$(parse_status "$res"); body=$(parse_body "$res")
  if [[ "$status" == "404" ]]; then
    success "GET sau soft delete → HTTP 404 (đúng — bị ẩn)"
  else
    local st
    st=$(echo "$body" | jq -r '.stateCode // empty' 2>/dev/null)
    if [[ "$st" == "DELETED" ]]; then
      success "GET sau soft delete → stateCode=DELETED (đúng)"
    else
      warn "GET sau soft delete → nhận $status / stateCode=$st"
    fi
  fi

  # Delete không có confirmReviewed=true → expect 400
  CREATED_ID=""; test_create_dossier || true
  if [[ -n "$CREATED_ID" ]]; then
    res=$(curl_with_status "DELETE" "$BASE_URL/capex-dossier/$CREATED_ID" \
      -d '{"deleteReason":"Hồ sơ nhập sai thông tin dự án cần xóa","confirmReviewed":false}')
    status=$(parse_status "$res"); body=$(parse_body "$res")
    if [[ "$status" == "400" ]]; then
      success "DELETE — confirmReviewed=false → HTTP 400 (đúng)"
    else
      warn "DELETE confirmReviewed=false → nhận $status"
    fi
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
main() {
  echo -e "${BOLD}${CYAN}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║       CAPEX API Integration Test — vdbas_exp_be             ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  BASE_URL  : ${YELLOW}$BASE_URL${NC}"
  echo -e "  Thời gian : $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""

  check_deps

  # ── Docker lifecycle ──────────────────────────────────────────────────────
  if [[ "$USE_DOCKER" == "true" ]]; then
    if [[ "$DO_BUILD" == "true" ]]; then
      docker_build
    fi
    docker_start
    wait_for_service
  fi

  # ── Run tests ─────────────────────────────────────────────────────────────
  test_master_data
  test_capex_dossier

  # ── Docker cleanup ────────────────────────────────────────────────────────
  if [[ "$USE_DOCKER" == "true" && "$STOP_AFTER" == "true" ]]; then
    docker_stop
  fi

  # ── Summary ───────────────────────────────────────────────────────────────
  echo ""
  echo -e "${BOLD}${CYAN}══════ KẾT QUẢ TEST ══════${NC}"
  echo -e "  ${GREEN}PASS${NC} : $PASS"
  echo -e "  ${RED}FAIL${NC} : $FAIL"
  echo -e "  ${YELLOW}SKIP${NC} : $SKIP"
  echo -e "  Tổng  : $((PASS + FAIL + SKIP))"

  if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}Các test FAIL:${NC}"
    for t in "${FAILED_TESTS[@]}"; do
      echo -e "  ${RED}✗${NC} $t"
    done
  fi

  echo ""
  if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ Tất cả test PASS — API sẵn sàng tích hợp FE!${NC}"
    exit 0
  else
    echo -e "${RED}${BOLD}✗ Có $FAIL test FAIL — kiểm tra lại trước khi tích hợp.${NC}"
    exit 1
  fi
}

main "$@"
