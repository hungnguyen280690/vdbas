---
name: gen-api-test
description: Generate a self-contained integration-test script (Python) that drives a running (Docker) backend against its OpenAPI contract — health check, full CRUD + workflow lifecycle, schema validation of responses, and negative cases (401/403/404/409/422). Use when the user wants to integration-test a dockerized BE according to its api_contract, or invokes /gen-api-test with a contract file and base URL.
---

# gen-api-test

Sinh một **script integration test** (Python, self-contained) để test toàn bộ API của một backend **đã chạy thành công bằng Docker**, bám theo **OpenAPI contract**.

Script sinh ra phải:
1. **Health check** — chờ BE sẵn sàng (`/actuator/health`) trước khi test.
2. **Smoke test** — gọi mọi endpoint `GET` đơn giản + tất cả `/lov/*`, kiểm tra status + schema response.
3. **Lifecycle test** — chạy trọn vòng đời nghiệp vụ theo state machine (create draft → update → add child → submit → approve → … → completed), nối state giữa các bước (id, version, idempotency key).
4. **Negative test** — kiểm các lỗi đã khai báo trong contract: 401 (thiếu token), 403 (sai role/scope), 404 (id không tồn tại), 409 (optimistic lock), 422 (vi phạm business rule).
5. **Report** — in bảng tổng kết PASS/FAIL, ghi report JSON, và **exit code ≠ 0** nếu có test fail (để dùng trong CI).

## Usage

```
/gen-api-test <contract_file> [base_url] [output_script]
```

**Arguments** (space-separated, passed as the skill input):

- `contract_file` — đường dẫn OpenAPI YAML (vd `apiContract/capex-dossier-api.yaml`)
- `base_url` — (tuỳ chọn) URL gốc của BE đang chạy. Nếu không có, **tự suy ra** (xem STEP 2).
- `output_script` — (tuỳ chọn) đường dẫn script output; mặc định `apiContract/integration_test.py`

Nếu thiếu `contract_file`, hỏi user trước khi tiếp tục.

---

## Instructions

Thực hiện **đúng thứ tự**. KHÔNG bỏ bước.

---

### STEP 1 — Đọc contract

Đọc toàn bộ file OpenAPI YAML. Trích:
- `info.version`, `servers[].url` (base path, vd `/api/v1`)
- `security` + `components.securitySchemes` (kiểu auth — thường `bearerAuth` JWT)
- Tất cả `paths`: method, path, `operationId`, `tags`, path/query params, `requestBody` schema ref, các response status + schema ref.
- `components.schemas` (để validate response body).
- Các custom header bắt buộc (vd `X-Idempotency-Key`).
- State machine + phân quyền role (đọc trong `info.description` và mô tả các endpoint workflow).

---

### STEP 2 — Xác định môi trường chạy (base URL)

Nếu `base_url` không được truyền:
1. Đọc `docker-compose.yml` ở thư mục project → tìm service BE, lấy **host port** đã map (vd `"8085:8080"` → host port `8085`).
2. Ghép với `servers[].url` trong contract → `http://localhost:{hostPort}{serverUrl}` (vd `http://localhost:8085/api/v1`).
3. Nếu không suy được, mặc định `http://localhost:8080` + server url, và ghi chú rõ trong output để user chỉnh.

Health endpoint: ưu tiên `/actuator/health` (Spring Boot — đọc `HEALTHCHECK` trong `Dockerfile` để xác nhận), nếu không có thì dùng endpoint `GET` nhẹ nhất trong contract.

---

### STEP 3 — Thiết kế test plan

Phân loại endpoint và dựng kịch bản. In ra một **test plan** ngắn gọn trước khi sinh code:

**A. Smoke (độc lập, không cần state):**
- Mọi `GET /lov/*` → 200 + validate item schema.
- Các `GET` list (vd `GET /...dossiers`) → 200 + validate pagination shape.

**B. Lifecycle (stateful, chạy tuần tự — dừng cả chuỗi nếu một bước fail):**
Dựng chuỗi từ state machine của contract. Với CAPEX Dossier:
1. `POST /…/dossiers/drafts` → tạo nháp → **capture** `id`, `version`.
2. `GET /…/dossiers/{id}` → 200, `fStatus` ∈ {DRAFT, SAVED}.
3. `PUT /…/dossiers/{id}` (kèm `version`) → 200, `version` tăng.
4. `POST /…/dossiers/{id}/documents` → thêm chứng từ con → capture `documentId`.
5. `POST /…/dossiers/{id}/submit` → SUBMITTED.
6. `POST /…/dossiers/{id}/approve` (role **Checker**) → APPROVED.
7. `POST /…/dossiers/{id}/approve` (role **Approver**) → COMPLETED.
8. (Nhánh phụ) tạo nháp khác → `POST /…/reject` hoặc `DELETE` (CANCELLED) để cover nhánh từ chối/huỷ.

Mỗi bước mutating phải gửi `X-Idempotency-Key` mới (UUID).
Lấy danh sách field bắt buộc của request body từ `required[]` trong schema; tạo payload hợp lệ tối thiểu (xem STEP 4).

**C. Negative (bám đúng response codes trong contract):**
| Case | Cách dựng | Expect |
|------|-----------|--------|
| Thiếu/empty token | gọi 1 endpoint bảo vệ, không gửi `Authorization` | 401 |
| Sai role/scope | Maker gọi endpoint approve | 403 |
| Không tồn tại | `GET /…/dossiers/{uuid-ngẫu-nhiên}` | 404 |
| Optimistic lock | `PUT` với `version` cũ (sau khi đã update) | 409 |
| Vi phạm validation | `POST` create thiếu field `required` | 400 hoặc 422 |
| Sai định dạng file (nếu có upload) | upload sai MIME/size | 413/415 |

Chỉ sinh case nào contract thực sự khai báo status tương ứng.

---

### STEP 4 — Quy tắc sinh payload hợp lệ từ schema

Khi cần request body, tự sinh dữ liệu hợp lệ từ schema (KHÔNG hardcode bừa):
- `format: uuid` → UUID ngẫu nhiên hợp lệ (với FK/LOV code, **ưu tiên lấy giá trị thật** từ `GET /lov/*` tương ứng đã gọi ở phase Smoke).
- `format: date` → ngày hôm nay `yyyy-MM-dd`; `format: date-time` → ISO 8601 `+07:00`.
- `string` + `enum` → phần tử đầu hợp lệ; có `maxLength` → chuỗi ngắn an toàn.
- `integer`/`number` → giá trị trong `[minimum, maximum]` (mặc định 1 hoặc 1000 cho tiền).
- `boolean` → `true`.
- Chỉ điền field trong `required[]` cho payload "happy path tối thiểu"; với update thêm `version`.
- LOV code phải lấy từ kết quả LOV thật để tránh fail do FK không tồn tại — nếu LOV rỗng, **skip** lifecycle với cảnh báo rõ ràng (không pass giả).

---

### STEP 5 — Sinh script

Sinh **một file Python self-contained** theo skeleton dưới đây. Yêu cầu:
- Chỉ phụ thuộc `requests`, `PyYAML`, `jsonschema` (in hướng dẫn `pip install` ở đầu file trong docstring). Nếu `jsonschema` thiếu → schema-validation chuyển sang cảnh báo, không crash.
- `argparse`: `--base-url`, `--contract`, `--token`, `--maker-token`, `--checker-token`, `--approver-token`, `--report` (đường dẫn JSON out), `--only <tag>`, `--no-cleanup`, `--timeout`. Mọi flag có fallback qua biến môi trường (`BASE_URL`, `BEARER_TOKEN`, `MAKER_TOKEN`, …).
- HTTP helper tự gắn `Authorization: Bearer`, `X-Idempotency-Key` cho POST/PUT/DELETE, timeout, và log `METHOD path → status (ms)`.
- Hàm `validate_schema(body, schema_name)` resolve `$ref` trong contract rồi validate bằng `jsonschema`.
- Mỗi test trả `TestResult(name, phase, passed, expected, actual, detail)`. Gom vào registry.
- Thứ tự chạy: health gate → Smoke → Lifecycle → Negative. Lifecycle fail giữa chừng thì đánh dấu các bước sau là `SKIPPED` (không phải FAIL).
- Cuối: in bảng tổng kết theo phase (PASS/FAIL/SKIP), ghi `--report` JSON nếu có, `sys.exit(1)` nếu có FAIL.
- Output có màu (ANSI) nhưng tự tắt khi không phải TTY.

**Skeleton bắt buộc tuân theo:**

```python
#!/usr/bin/env python3
"""
Integration test cho <API title> theo OpenAPI contract.
BE phải đang chạy (docker compose up). Mặc định: <base_url>.

Cài đặt:  pip install requests pyyaml jsonschema
Chạy:     python3 integration_test.py --base-url http://localhost:8085/api/v1 \
              --maker-token "$MAKER_JWT" --checker-token "$CHECKER_JWT" --approver-token "$APPROVER_JWT"
Exit code: 0 = tất cả pass, 1 = có test fail.
"""
import argparse, os, sys, json, time, uuid, datetime
import requests, yaml
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

# ---- config / cli ----
def parse_args(): ...
# ---- contract loader: paths, schemas, $ref resolver ----
class Contract: ...
# ---- http client: auth, idempotency-key, logging, timing ----
class Client: ...
# ---- result registry + colored reporter ----
class Results: ...
# ---- payload builder từ schema (STEP 4) ----
def build_payload(schema, contract, lov_cache): ...
# ---- phases ----
def wait_for_health(client, retries, delay): ...
def phase_smoke(client, contract, results, lov_cache): ...
def phase_lifecycle(client, contract, results, lov_cache): ...
def phase_negative(client, contract, results): ...
# ---- main ----
def main():
    args = parse_args()
    contract = Contract.load(args.contract)
    client = Client(args.base_url, tokens=..., timeout=args.timeout)
    if not wait_for_health(client, ...): sys.exit(2)
    lov_cache = {}
    phase_smoke(client, contract, results, lov_cache)
    phase_lifecycle(client, contract, results, lov_cache)
    phase_negative(client, contract, results)
    results.print_summary()
    if args.report: results.write_json(args.report)
    sys.exit(1 if results.has_failures() else 0)

if __name__ == "__main__":
    main()
```

Điền đầy đủ thân hàm — KHÔNG để `...` trong file output. Bám tên endpoint/schema thật từ contract đã đọc ở STEP 1.

---

### STEP 6 — Ghi file + validate cú pháp

1. Ghi script ra `output_script`.
2. Kiểm cú pháp: `python3 -m py_compile <output_script>` → sửa nếu lỗi.
3. (Nếu có thể) thử import nhanh để chắc không lỗi runtime cơ bản.

---

### STEP 7 — Chạy thử & báo cáo

1. Kiểm BE có đang chạy: `docker compose ps` (hoặc `docker ps`). Nếu chưa chạy, hướng dẫn user `docker compose up -d` rồi đợi healthy.
2. Nếu BE đang chạy và **đã có token** (user cung cấp), chạy thật:
   ```
   python3 <output_script> --base-url <base_url> [--token ...]
   ```
   và tóm tắt kết quả.
3. Nếu **chưa có token / BE chưa chạy**, KHÔNG bịa kết quả. In hướng dẫn chạy + liệt kê biến môi trường cần set (token theo từng role).

In tổng kết cuối:

```
## ✅ Integration Test Script Generated: <output_script>

### Test plan
- Smoke:     N endpoints (GET + LOV)
- Lifecycle: N bước (draft → … → completed)
- Negative:  N case (401/403/404/409/422 theo contract)

### Cách chạy
1. docker compose up -d   # đảm bảo BE healthy
2. export MAKER_TOKEN=... CHECKER_TOKEN=... APPROVER_TOKEN=...
3. python3 <output_script> --base-url <base_url> --report report.json

### Lưu ý
- Cần lấy JWT thật theo từng role (Maker/Checker/Approver) — script không tự sinh token.
- LOV code dùng trong lifecycle lấy từ /lov/* thật; nếu LOV rỗng, lifecycle sẽ SKIP.
```

---

### Quality checklist — verify trước khi kết thúc

**Bám contract:**
- [ ] Mọi endpoint trong test gọi đúng `path` + `method` + params như contract.
- [ ] Mỗi response được validate đúng schema ref của status đó (qua `$ref` resolver).
- [ ] Chỉ sinh negative case cho status code contract thực sự khai báo.
- [ ] Custom header bắt buộc (vd `X-Idempotency-Key`) được gửi ở mọi mutating request.

**Tính đúng integration:**
- [ ] Health gate chạy trước, retry/backoff, fail rõ ràng nếu BE không lên (exit 2).
- [ ] Lifecycle nối state thật (id/version capture từ response, không hardcode).
- [ ] Optimistic-lock case dùng `version` cũ thật sau một lần update thành công.
- [ ] LOV code trong payload lấy từ LOV thật; LOV rỗng → SKIP có cảnh báo (không PASS giả).
- [ ] Lifecycle fail giữa chừng → các bước sau SKIPPED, không tính FAIL.

**Chạy được & CI-friendly:**
- [ ] `python3 -m py_compile` pass, không còn `...` trong file.
- [ ] Token/URL nhận qua CLI flag và env var; không hardcode secret.
- [ ] Exit code: 0 nếu all pass, 1 nếu có FAIL, 2 nếu BE không sẵn sàng.
- [ ] Report JSON ghi được khi có `--report`.
- [ ] Output màu tự tắt khi không phải TTY.
