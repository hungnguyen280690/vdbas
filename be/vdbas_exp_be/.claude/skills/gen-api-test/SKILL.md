---
name: gen-api-test
description: Generate a self-contained integration-test script (Python) that drives a running (Docker) backend against ANY OpenAPI contract — health check, smoke (GET + LOV), full resource lifecycle / workflow state machine derived from the contract, schema validation of responses, and negative cases (401/403/404/409/422). Use when the user wants to integration-test a dockerized BE according to its api_contract, or invokes /gen-api-test with a contract file and base URL.
---

# gen-api-test

Sinh một **script integration test** (Python, self-contained) để test toàn bộ API của một backend **đã chạy bằng Docker**, bám theo **OpenAPI contract bất kỳ**.

Skill này **tổng quát** — dùng chung một format cho mọi `api-contract.yaml`, **KHÔNG hardcode** cho feature/resource/role cụ thể nào. Mọi thứ đặc thù dự án (resource, vòng đời, state machine, danh sách role) đều được **suy ra trực tiếp từ contract** ở thời điểm sinh script (STEP 1–3). Nếu một thông tin không suy được từ contract, ghi rõ assumption trong output thay vì bịa.

Script sinh ra phải:

1. **Health check** — chờ BE sẵn sàng trước khi test.
2. **Smoke test** — gọi mọi endpoint `GET` không cần state (list + lookup/LOV), kiểm tra status + schema response.
3. **Lifecycle test** — chạy trọn vòng đời nghiệp vụ theo **state machine suy ra từ contract** (create → update → add child → các transition workflow → terminal), nối state giữa các bước (id, version, idempotency key).
4. **Negative test** — kiểm các lỗi đã khai báo trong contract: 401, 403, 404, 409, 422/400 (chỉ sinh case nào contract thực sự khai báo).
5. **Report** — in bảng tổng kết PASS/FAIL, ghi report JSON, và **exit code ≠ 0** nếu có test fail (để dùng trong CI).

## Usage

```
/gen-api-test <contract_file> [base_url] [output_script]
```

**Arguments** (space-separated, passed as the skill input):

- `contract_file` — đường dẫn OpenAPI YAML bất kỳ (vd `apiContract/api-contract.yaml`)
- `base_url` — (tuỳ chọn) URL gốc của BE đang chạy. Nếu không có, **tự suy ra** (xem STEP 2).
- `output_script` — (tuỳ chọn) đường dẫn script output; mặc định cùng thư mục contract, tên `integration_test.py`.

Nếu thiếu `contract_file`, hỏi user trước khi tiếp tục.

---

## Instructions

Thực hiện **đúng thứ tự**. KHÔNG bỏ bước. KHÔNG hardcode tên resource/role/đường dẫn — luôn lấy từ contract đã đọc.

---

### STEP 1 — Đọc & phân tích contract (nguồn sự thật duy nhất)

Đọc toàn bộ file OpenAPI YAML. Trích **động** (không giả định resource nào):

- `info.title`, `info.version`, `info.description`.
- `servers[].url` (base path, vd `/api/v1`).
- `security` toàn cục + `components.securitySchemes` (kiểu auth — thường `bearerAuth` JWT).
- Tất cả `paths`: với mỗi operation lấy `method`, `path`, `operationId`, `tags`, path/query params, `requestBody` schema ref, mọi response status + schema ref.
- `components.schemas` (để validate response body + để build payload).
- Custom header bắt buộc (quét `parameters` có `in: header` + `required: true`, vd `X-Idempotency-Key`).

Suy ra các **khái niệm trừu tượng** (đây là phần làm skill tổng quát — xem STEP 3 dùng lại):

- **Resources**: nhóm path theo tài nguyên gốc (collection path `…/{plural}` + item path `…/{plural}/{id}`). Một resource = có ít nhất một `POST` collection (create) và/hoặc `GET …/{id}` (read).
- **Status field & state machine**: tìm field trạng thái trong response schema của resource (field kiểu `string` có `enum`, tên thường chứa `status`/`state`/`fStatus`/…). Đọc thêm `info.description` và mô tả từng endpoint workflow để dựng đồ thị chuyển trạng thái (state → action → next state).
- **Workflow actions**: các `POST …/{id}/{action}` (submit/approve/reject/cancel/return/… — **bất kỳ tên nào**). Đây là cạnh của state machine.
- **Roles/authorization**: suy từ `security` scopes của từng operation, hoặc `x-roles`/`x-required-role` (nếu có), hoặc mô tả endpoint (vd “chỉ Approver”). Gom thành **tập role động** (vd có thể là `MAKER/CHECKER/APPROVER`, hoặc `USER/ADMIN`, hoặc bất kỳ). KHÔNG giả định bộ role cố định.

In ra một **bảng tóm tắt** những gì đã suy ra (resources, status field + states, workflow actions + role yêu cầu, custom headers) trước khi sang STEP 2.

---

### STEP 2 — Xác định môi trường chạy (base URL)

Nếu `base_url` không được truyền:

1. Đọc `docker-compose.yml` ở thư mục project → tìm service BE, lấy **host port** đã map (vd `"8085:8080"` → host port `8085`).
2. Ghép với `servers[].url` trong contract → `http://localhost:{hostPort}{serverUrl}`.
3. Nếu không suy được, mặc định `http://localhost:8080` + server url, và ghi chú rõ trong output để user chỉnh.

Health endpoint: ưu tiên `/actuator/health` (Spring Boot — đọc `HEALTHCHECK` trong `Dockerfile` nếu có để xác nhận), nếu không có thì dùng endpoint `GET` nhẹ nhất, không tham số trong contract.

---

### STEP 3 — Thiết kế test plan (suy ra từ STEP 1, không hardcode)

In ra một **test plan** ngắn gọn trước khi sinh code:

**A. Smoke (độc lập, không cần state):**

- Mọi `GET` không có path param (list/lookup/LOV) → 200 + validate schema response (pagination shape nếu là list, item schema nếu là lookup).

**B. Lifecycle (stateful, chạy tuần tự — dừng cả chuỗi nếu một bước fail):**

Dựng chuỗi **từ state machine đã suy ở STEP 1** cho (các) resource chính. Thuật toán tổng quát:

1. **Create** — gọi `POST` collection của resource → capture `id` (và `version` nếu schema có optimistic-lock).
2. **Read** — `GET …/{id}` → 200, xác nhận status field ∈ tập state khởi tạo.
3. **Update** — nếu có `PUT/PATCH …/{id}` → gửi kèm `version` (nếu có) → 200, `version` tăng.
4. **Add child** — nếu resource có sub-collection (`POST …/{id}/{child}`) → tạo bản ghi con, capture id con.
5. **Workflow transitions** — đi theo các cạnh state machine **theo đúng thứ tự đồ thị**: với mỗi action `POST …/{id}/{action}`, gọi bằng **token đúng role** mà contract yêu cầu cho action đó → xác nhận status chuyển sang state kế tiếp.
6. **Terminal & nhánh phụ** — chạy tới state terminal (completed/approved/…); nếu có nhánh từ chối/huỷ (reject/cancel/delete), tạo một bản ghi khác để cover nhánh đó.

Nếu contract **không có** workflow action nào (CRUD thuần) → lifecycle = create → read → update → (delete nếu có), bỏ qua phần transition.

Mỗi bước mutating gửi mọi **custom header bắt buộc** đã phát hiện (vd `X-Idempotency-Key` mới = UUID). Payload lấy từ `required[]` của schema (xem STEP 4).

**C. Negative (bám đúng response codes trong contract):**

| Case | Cách dựng | Expect |
| --- | --- | --- |
| Thiếu/empty token | gọi 1 endpoint bảo vệ, không gửi `Authorization` | 401 |
| Sai role/scope | gọi endpoint yêu cầu role X bằng token role Y | 403 |
| Không tồn tại | `GET …/{id}` với id ngẫu nhiên không tồn tại | 404 |
| Optimistic lock | `PUT/PATCH` với `version` cũ (sau khi đã update) | 409 |
| Vi phạm validation | `POST` create thiếu field `required` | 400 hoặc 422 |
| Sai định dạng/upload (nếu có) | upload sai MIME/size | 413/415 |

**Chỉ sinh case nào contract thực sự khai báo status tương ứng** cho endpoint đó. Role dùng trong case 403 lấy từ tập role động ở STEP 1 (chọn một role KHÔNG được phép cho action đó).

---

### STEP 4 — Quy tắc sinh payload hợp lệ từ schema

Khi cần request body, tự sinh dữ liệu hợp lệ từ schema (KHÔNG hardcode bừa):

- `format: uuid` → UUID ngẫu nhiên hợp lệ (với FK/LOV code, **ưu tiên lấy giá trị thật** từ endpoint lookup/LOV tương ứng đã gọi ở phase Smoke).
- `format: date` → ngày hôm nay `yyyy-MM-dd`; `format: date-time` → ISO 8601 (kèm offset nếu contract gợi ý timezone).
- `string` + `enum` → phần tử đầu hợp lệ; có `maxLength` → chuỗi ngắn an toàn; có `pattern` → sinh chuỗi khớp pattern đơn giản.
- `integer`/`number` → giá trị trong `[minimum, maximum]` (mặc định 1, hoặc giá trị an toàn cho field tiền tệ).
- `boolean` → `true`; `array` → 1 phần tử hợp lệ; nested `object` → đệ quy theo `required[]`.
- Chỉ điền field trong `required[]` cho payload "happy path tối thiểu"; với update thêm `version` nếu schema có.
- Code tham chiếu (FK/LOV) phải lấy từ kết quả lookup thật để tránh fail do FK không tồn tại — nếu lookup rỗng, **skip** bước lifecycle phụ thuộc với cảnh báo rõ ràng (không pass giả).

---

### STEP 5 — Sinh script

Sinh **một file Python self-contained** theo skeleton dưới đây. Yêu cầu:

- Chỉ phụ thuộc `requests`, `PyYAML`, `jsonschema` (in hướng dẫn `pip install` ở đầu file trong docstring). Nếu `jsonschema` thiếu → schema-validation chuyển sang cảnh báo, không crash.
- **Token theo role là động**: `argparse` nhận `--token ROLE=JWT` (lặp lại nhiều lần) + một `--token DEFAULT=JWT` cho endpoint không phân quyền. Fallback qua biến môi trường `TOKEN_<ROLE>` (vd role `APPROVER` → `TOKEN_APPROVER`) và `BEARER_TOKEN` cho default. **KHÔNG hardcode tên role** (maker/checker/…) thành flag riêng — sinh danh sách role từ contract và document chúng trong `--help`.
- Các flag khác: `--base-url`, `--contract`, `--report` (đường dẫn JSON out), `--only <tag/phase>`, `--no-cleanup`, `--timeout`. Mọi flag có fallback env (`BASE_URL`, `CONTRACT`, …).
- HTTP helper tự gắn `Authorization: Bearer <token-của-role-đang-dùng>`, các custom header bắt buộc cho mutating request, timeout, và log `METHOD path → status (ms)`.
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
Chạy:     python3 integration_test.py --base-url <base_url> \
              --token <ROLE1>="$JWT1" --token <ROLE2>="$JWT2"   # role suy ra từ contract
Exit code: 0 = tất cả pass, 1 = có test fail, 2 = BE không sẵn sàng.
"""
import argparse, os, sys, json, time, uuid, datetime, re
import requests, yaml
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

# ---- config / cli (parse --token ROLE=JWT lặp lại, fallback env TOKEN_<ROLE>) ----
def parse_args(): ...
# ---- contract loader: paths, schemas, $ref resolver, suy ra resources/state-machine/roles ----
class Contract: ...
# ---- http client: chọn token theo role, idempotency-key/custom headers, logging, timing ----
class Client: ...
# ---- result registry + colored reporter ----
class Results: ...
# ---- payload builder từ schema (STEP 4) ----
def build_payload(schema, contract, lookup_cache): ...
# ---- phases ----
def wait_for_health(client, retries, delay): ...
def phase_smoke(client, contract, results, lookup_cache): ...
def phase_lifecycle(client, contract, results, lookup_cache): ...
def phase_negative(client, contract, results): ...
# ---- main ----
def main():
    args = parse_args()
    contract = Contract.load(args.contract)
    client = Client(args.base_url, tokens=..., timeout=args.timeout)
    if not wait_for_health(client, ...): sys.exit(2)
    lookup_cache = {}
    results = Results()
    phase_smoke(client, contract, results, lookup_cache)
    phase_lifecycle(client, contract, results, lookup_cache)
    phase_negative(client, contract, results)
    results.print_summary()
    if args.report: results.write_json(args.report)
    sys.exit(1 if results.has_failures() else 0)

if __name__ == "__main__":
    main()
```

Điền đầy đủ thân hàm — KHÔNG để `...` trong file output. Bám tên endpoint/schema/role thật từ contract đã đọc ở STEP 1. Lifecycle phải được sinh từ state machine suy ra, không phải chuỗi cứng cho một resource cụ thể.

---

### STEP 6 — Ghi file + validate cú pháp

1. Ghi script ra `output_script`.
2. Kiểm cú pháp: `python3 -m py_compile <output_script>` → sửa nếu lỗi.
3. (Nếu có thể) thử import nhanh để chắc không lỗi runtime cơ bản.

---

### STEP 7 — Chạy thử & báo cáo

1. Kiểm BE có đang chạy: `docker compose ps` (hoặc `docker ps`). Nếu chưa chạy, hướng dẫn user `docker compose up -d` rồi đợi healthy.
2. Nếu BE đang chạy và **đã có token** (user cung cấp), chạy thật và tóm tắt kết quả.
3. Nếu **chưa có token / BE chưa chạy**, KHÔNG bịa kết quả. In hướng dẫn chạy + liệt kê biến môi trường cần set (token theo từng role **suy ra từ contract**).

In tổng kết cuối:

```
## ✅ Integration Test Script Generated: <output_script>

### Suy ra từ contract
- Resources:  <danh sách resource>
- States:     <status field> ∈ {…}
- Workflow:   <action → role yêu cầu>
- Roles:      <tập role động>

### Test plan
- Smoke:     N endpoints (GET + lookup/LOV)
- Lifecycle: N bước (create → … → terminal)
- Negative:  N case (theo status code contract khai báo)

### Cách chạy
1. docker compose up -d   # đảm bảo BE healthy
2. export TOKEN_<ROLE1>=... TOKEN_<ROLE2>=...   # tên env theo role suy ra
3. python3 <output_script> --base-url <base_url> --report report.json

### Lưu ý
- Cần lấy JWT thật theo từng role — script không tự sinh token.
- Code tham chiếu (LOV/FK) trong lifecycle lấy từ endpoint lookup thật; nếu rỗng, bước phụ thuộc sẽ SKIP.
```

---

### Quality checklist — verify trước khi kết thúc

**Tổng quát (không hardcode):**

- [ ] Không còn tên resource/role/đường dẫn cứng của một feature cụ thể trong **instructions logic** — mọi thứ lấy từ contract khi chạy.
- [ ] Tập role + tên env token được sinh từ `security`/scopes/description của contract, không phải danh sách cố định.
- [ ] Lifecycle được dựng từ state machine suy ra; CRUD thuần (không workflow) vẫn chạy đúng.

**Bám contract:**

- [ ] Mọi endpoint trong test gọi đúng `path` + `method` + params như contract.
- [ ] Mỗi response được validate đúng schema ref của status đó (qua `$ref` resolver).
- [ ] Chỉ sinh negative case cho status code contract thực sự khai báo.
- [ ] Custom header bắt buộc được gửi ở mọi mutating request.

**Tính đúng integration:**

- [ ] Health gate chạy trước, retry/backoff, fail rõ ràng nếu BE không lên (exit 2).
- [ ] Lifecycle nối state thật (id/version capture từ response, không hardcode).
- [ ] Optimistic-lock case dùng `version` cũ thật sau một lần update thành công (chỉ khi schema có version).
- [ ] Code tham chiếu trong payload lấy từ lookup thật; lookup rỗng → SKIP có cảnh báo (không PASS giả).
- [ ] Lifecycle fail giữa chừng → các bước sau SKIPPED, không tính FAIL.

**Chạy được & CI-friendly:**

- [ ] `python3 -m py_compile` pass, không còn `...` trong file.
- [ ] Token/URL nhận qua CLI flag và env var; không hardcode secret.
- [ ] Exit code: 0 nếu all pass, 1 nếu có FAIL, 2 nếu BE không sẵn sàng.
- [ ] Report JSON ghi được khi có `--report`.
- [ ] Output màu tự tắt khi không phải TTY.
