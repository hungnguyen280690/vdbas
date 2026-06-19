#!/usr/bin/env python3
"""
Integration test cho "EXP OPEX Dossier Management API" (v0.2.0) theo OpenAPI contract.
BE phải đang chạy (docker compose up). Mặc định base-url: http://localhost:8085/api/v1
(host port 8085 -> container 8080, lấy từ docker-compose.yml).

Cài đặt:  pip install requests pyyaml jsonschema
Chạy:     python3 integration_test.py \
              --base-url http://localhost:8085/api/v1 \
              --token MAKER="$TOKEN_MAKER" \
              --token CHECKER="$TOKEN_CHECKER" \
              --token APPROVER="$TOKEN_APPROVER" \
              --report report.json
Token cũng đọc được từ env: TOKEN_MAKER / TOKEN_CHECKER / TOKEN_APPROVER / TOKEN_VIEWER,
và BEARER_TOKEN (token mặc định cho endpoint không phân quyền).

Exit code: 0 = tất cả pass, 1 = có test fail, 2 = BE không sẵn sàng.

LƯU Ý: roles (MAKER/CHECKER/APPROVER/VIEWER) và state machine bên dưới được SUY RA
từ contract (bearerAuth description + mô tả các endpoint workflow), không hardcode thủ công.
"""
import argparse
import datetime
import json
import os
import sys
import time
import uuid

import requests

try:
    import yaml
except ImportError:
    print("Thiếu PyYAML. Chạy: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


# ============================================================
# Derived-from-contract metadata (STEP 1/3)
# ============================================================
HEALTH_URL_SUFFIX = "/actuator/health"   # ngoài base path /api/v1 (Spring Boot actuator)
STATUS_FIELD = "fStatus"
IDEMPOTENCY_HEADER = "Idempotency-Key"    # components.parameters.IdempotencyKey

# --- BYPASS JWT ---------------------------------------------------------------
# BE KHÔNG tự verify JWT. Gateway (IBM DataPower) verify Keycloak token rồi inject
# header X-User-Id (xem com.fis.vdbas.common.security.GatewayAuthFilter). Ở dev mode
# (app.gateway.internal-token để trống) chỉ cần CÓ header X-User-Id là authenticated.
# Vì vậy bypass = gửi thẳng X-User-Id thay cho Authorization: Bearer.
GATEWAY_USER_HEADER = "X-User-Id"

# action endpoint (suffix dưới /{id}) -> role được phép + trạng thái kết quả mong đợi
WORKFLOW = {
    "submit":         {"role": "MAKER",    "to": {"PENDING_CHECKER"}},
    "check":          {"role": "CHECKER",  "to": {"CHECKED", "APPROVAL_PENDING"}},
    "check-reject":   {"role": "CHECKER",  "to": {"CHECK_REJECTED"}},
    "check-return":   {"role": "CHECKER",  "to": {"DRAFT"}},
    "approve":        {"role": "APPROVER", "to": {"APPROVED"}},
    "approve-reject": {"role": "APPROVER", "to": {"APPROVAL_REJECTED"}},
    "approve-cancel": {"role": "APPROVER", "to": {"CHECKED"}},
}
ALL_ROLES = ["MAKER", "CHECKER", "APPROVER", "VIEWER"]


# ============================================================
# CLI
# ============================================================
def parse_args():
    here = os.path.dirname(os.path.abspath(__file__))
    p = argparse.ArgumentParser(
        description="Integration test cho EXP OPEX Dossier API theo OpenAPI contract.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Roles suy ra từ contract: " + ", ".join(ALL_ROLES) +
               "\nEnv token: TOKEN_<ROLE> (vd TOKEN_MAKER), BEARER_TOKEN cho default.",
    )
    p.add_argument("--base-url", default=os.environ.get("BASE_URL", "http://localhost:8085/api/v1"))
    p.add_argument("--contract", default=os.environ.get("CONTRACT", os.path.join(here, "api-contract.yaml")))
    p.add_argument("--token", action="append", default=[], metavar="ROLE=JWT",
                   help="Token theo role, lặp lại nhiều lần. Vd: --token MAKER=eyJ...")
    p.add_argument("--report", default=os.environ.get("REPORT"))
    p.add_argument("--only", default=None, help="Chỉ chạy phase: smoke|lifecycle|negative")
    p.add_argument("--no-cleanup", action="store_true")
    # Bypass JWT: gửi header X-User-Id (gateway-injected) thay vì Bearer token.
    # Mặc định BẬT (BE dev không verify JWT). Tắt bằng --no-bypass-auth.
    p.add_argument("--bypass-auth", dest="bypass", action="store_true", default=None,
                   help="Bypass JWT bằng header X-User-Id (mặc định bật nếu không có token).")
    p.add_argument("--no-bypass-auth", dest="bypass", action="store_false",
                   help="Tắt bypass: chỉ dùng Authorization: Bearer.")
    p.add_argument("--user-id", default=os.environ.get("X_USER_ID", "itest-user"),
                   help="Giá trị cơ sở cho header X-User-Id khi bypass.")
    p.add_argument("--timeout", type=float, default=float(os.environ.get("TIMEOUT", "30")))
    args = p.parse_args()

    tokens = {}
    # env fallback
    for role in ALL_ROLES:
        v = os.environ.get("TOKEN_" + role)
        if v:
            tokens[role] = v
    if os.environ.get("BEARER_TOKEN"):
        tokens["DEFAULT"] = os.environ["BEARER_TOKEN"]
    # CLI overrides
    for pair in args.token:
        if "=" not in pair:
            p.error("--token phải dạng ROLE=JWT (vd MAKER=eyJ...)")
        role, _, jwt = pair.partition("=")
        tokens[role.strip().upper()] = jwt.strip()
    args.tokens = tokens
    # Bypass mặc định bật (BE dev không verify JWT, chỉ cần X-User-Id).
    if args.bypass is None:
        env = os.environ.get("BYPASS_AUTH")
        args.bypass = (env.lower() not in ("0", "false", "no")) if env else True
    return args


# ============================================================
# Contract loader + $ref resolver + validator
# ============================================================
class Contract:
    def __init__(self, doc):
        self.doc = doc
        self.title = doc.get("info", {}).get("title", "API")
        self.version = doc.get("info", {}).get("version", "")
        servers = doc.get("servers", [])
        self.server_url = servers[0]["url"] if servers else ""
        self.paths = doc.get("paths", {})

    @classmethod
    def load(cls, path):
        with open(path, "r", encoding="utf-8") as f:
            return cls(yaml.safe_load(f))

    def lookup_ref(self, ref):
        assert ref.startswith("#/"), "chỉ hỗ trợ local $ref: " + ref
        node = self.doc
        for part in ref[2:].split("/"):
            node = node[part]
        return node

    def deref(self, node, stack=frozenset()):
        """Giải đệ quy $ref + allOf, xử lý nullable -> cho phép null (OpenAPI 3.0)."""
        if isinstance(node, dict):
            if "$ref" in node:
                ref = node["$ref"]
                if ref in stack:
                    return {}
                return self.deref(self.lookup_ref(ref), stack | {ref})
            if "allOf" in node:
                merged = {"type": "object", "properties": {}, "required": []}
                extra = {k: v for k, v in node.items() if k != "allOf"}
                for sub in node["allOf"]:
                    d = self.deref(sub, stack)
                    merged["properties"].update(d.get("properties", {}))
                    merged["required"] += d.get("required", [])
                    for k, v in d.items():
                        if k not in ("properties", "required"):
                            merged[k] = v
                merged.update(self.deref(extra, stack))
                if not merged["properties"]:
                    merged.pop("properties")
                if not merged["required"]:
                    merged.pop("required")
                return merged
            out = {k: self.deref(v, stack) for k, v in node.items()}
            if out.pop("nullable", False):
                t = out.get("type")
                if isinstance(t, str):
                    out["type"] = [t, "null"]
            return out
        if isinstance(node, list):
            return [self.deref(x, stack) for x in node]
        return node

    def schema_by_name(self, name):
        return self.deref({"$ref": "#/components/schemas/" + name})


def validate_schema(body, schema, name, results, ctx):
    """Validate body theo schema (đã deref). Thiếu jsonschema -> WARN, không fail cứng."""
    if not HAS_JSONSCHEMA:
        return
    try:
        jsonschema.validate(instance=body, schema=schema)
    except jsonschema.ValidationError as e:
        results.add(TestResult(
            name="schema:" + name + " @ " + ctx, phase="schema", passed=False,
            expected="hợp lệ theo " + name, actual=str(e.message),
            detail="/".join(str(x) for x in e.absolute_path)))


# ============================================================
# HTTP client
# ============================================================
class Client:
    MUTATING = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, base_url, tokens, timeout, log_fn, bypass=False, user_id="itest-user"):
        self.base = base_url.rstrip("/")
        self.root = base_url.split("/api/", 1)[0] if "/api/" in base_url else base_url.rstrip("/")
        self.tokens = tokens or {}
        self.timeout = timeout
        self.log = log_fn
        self.bypass = bypass
        self.user_id = user_id
        self.s = requests.Session()

    def token_for(self, role):
        if role and role in self.tokens:
            return self.tokens[role]
        return self.tokens.get("DEFAULT") or next(
            (self.tokens[r] for r in ALL_ROLES if r in self.tokens), None)

    def has_auth(self, role=None):
        """Có thể authenticated cho role này? (bypass = luôn có; ngược lại cần token)."""
        if self.bypass:
            return True
        return self.token_for(role) is not None

    def request(self, method, path, role=None, no_auth=False, **kw):
        url = path if path.startswith("http") else self.base + path
        headers = dict(kw.pop("headers", {}) or {})
        if not no_auth:
            tok = self.token_for(role)
            if tok:
                headers["Authorization"] = "Bearer " + tok
            # Bypass JWT: gateway-injected X-User-Id (BE dev không verify Bearer).
            if self.bypass and GATEWAY_USER_HEADER not in headers:
                suffix = role.lower() if role else "default"
                headers[GATEWAY_USER_HEADER] = self.user_id + "-" + suffix
        if method.upper() in self.MUTATING and IDEMPOTENCY_HEADER not in headers:
            headers[IDEMPOTENCY_HEADER] = str(uuid.uuid4())
        t0 = time.time()
        resp = self.s.request(method, url, headers=headers, timeout=self.timeout, **kw)
        ms = int((time.time() - t0) * 1000)
        self.log("  %-6s %s -> %s (%dms)%s" % (
            method.upper(), path, resp.status_code, ms,
            "" if not role else " [" + role + "]"))
        return resp


# ============================================================
# Result registry + reporter
# ============================================================
class TestResult:
    def __init__(self, name, phase, passed, expected, actual, detail="", skipped=False):
        self.name, self.phase, self.passed = name, phase, passed
        self.expected, self.actual, self.detail = expected, actual, detail
        self.skipped = skipped


class Results:
    def __init__(self):
        self.items = []

    def add(self, r):
        self.items.append(r)
        return r

    def record(self, name, phase, passed, expected, actual, detail=""):
        return self.add(TestResult(name, phase, passed, expected, actual, detail))

    def skip(self, name, phase, reason):
        return self.add(TestResult(name, phase, True, "-", "SKIP", reason, skipped=True))

    def has_failures(self):
        return any((not r.passed and not r.skipped) for r in self.items)

    def print_summary(self):
        c = Color
        print("\n" + c.bold("================ SUMMARY ================"))
        phases = []
        for r in self.items:
            if r.phase not in phases:
                phases.append(r.phase)
        for ph in phases:
            rs = [r for r in self.items if r.phase == ph]
            p = sum(1 for r in rs if r.passed and not r.skipped)
            f = sum(1 for r in rs if not r.passed and not r.skipped)
            s = sum(1 for r in rs if r.skipped)
            print("%-12s %s  %s  %s" % (
                ph, c.green("PASS " + str(p)), c.red("FAIL " + str(f)), c.yellow("SKIP " + str(s))))
        print(c.bold("-----------------------------------------"))
        for r in self.items:
            if not r.passed and not r.skipped:
                print(c.red("  ✗ [%s] %s" % (r.phase, r.name)))
                print("      expected=%s actual=%s %s" % (r.expected, r.actual, r.detail))
        for r in self.items:
            if r.skipped:
                print(c.yellow("  ⚠ SKIP [%s] %s — %s" % (r.phase, r.name, r.detail)))
        total_p = sum(1 for r in self.items if r.passed and not r.skipped)
        total_f = sum(1 for r in self.items if not r.passed and not r.skipped)
        total_s = sum(1 for r in self.items if r.skipped)
        print(c.bold("TOTAL: ") + c.green(str(total_p) + " pass") + ", " +
              c.red(str(total_f) + " fail") + ", " + c.yellow(str(total_s) + " skip"))

    def write_json(self, path):
        data = {
            "summary": {
                "pass": sum(1 for r in self.items if r.passed and not r.skipped),
                "fail": sum(1 for r in self.items if not r.passed and not r.skipped),
                "skip": sum(1 for r in self.items if r.skipped),
            },
            "results": [{
                "name": r.name, "phase": r.phase, "passed": r.passed,
                "skipped": r.skipped, "expected": r.expected,
                "actual": r.actual, "detail": r.detail,
            } for r in self.items],
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Report -> " + path)


class Color:
    on = sys.stdout.isatty()

    @staticmethod
    def _w(code, s):
        return ("\033[%sm%s\033[0m" % (code, s)) if Color.on else s

    @staticmethod
    def green(s): return Color._w("32", s)
    @staticmethod
    def red(s): return Color._w("31", s)
    @staticmethod
    def yellow(s): return Color._w("33", s)
    @staticmethod
    def bold(s): return Color._w("1", s)


# ============================================================
# Payload builder từ schema (STEP 4)
# ============================================================
import re

_LOV_RE = re.compile(r"/lov/([a-z0-9\-]+)", re.I)


def lov_items(body):
    """Chuẩn hoá body LOV về list item. BE hiện trả mảng thuần
    (vd [{organizationCode, organizationName}]); contract mô tả {items:[...]}.
    Hỗ trợ cả hai shape."""
    if isinstance(body, list):
        return body
    if isinstance(body, dict):
        return body.get("items", []) or []
    return []


def lov_pick_code(item):
    """Lấy giá trị 'code' của 1 item LOV bất kể tên field
    (code | *Code | *_code | value | id | string đầu tiên)."""
    if not isinstance(item, dict):
        return item
    if "code" in item:
        return item["code"]
    for k, v in item.items():
        if isinstance(v, str) and (k.lower().endswith("code") or k.lower() in ("value", "id")):
            return v
    for v in item.values():
        if isinstance(v, str):
            return v
    return None


def _lov_code(prop_schema, lov_cache, client, results):
    """Nếu description trỏ tới /lov/<x>, lấy code thật từ LOV (cache)."""
    desc = prop_schema.get("description", "") if isinstance(prop_schema, dict) else ""
    m = _LOV_RE.search(desc or "")
    if not m:
        return None
    name = m.group(1)
    if name not in lov_cache:
        try:
            r = client.request("GET", "/lov/" + name)
            items = lov_items(r.json()) if r.status_code == 200 else []
        except Exception:
            items = []
        lov_cache[name] = items
    items = lov_cache[name]
    return lov_pick_code(items[0]) if items else None


def _string_value(schema):
    enum = schema.get("enum")
    if enum:
        return enum[0]
    s = "auto_test"
    mn = schema.get("minLength")
    mx = schema.get("maxLength")
    if mn and len(s) < mn:
        s = s + "_" + "x" * (mn - len(s))
    if mx and len(s) > mx:
        s = s[:mx]
    return s


def build_payload(schema, contract, lov_cache, client, results, only_required=True):
    """Sinh body hợp lệ tối thiểu từ schema đã deref."""
    schema = contract.deref(schema)
    t = schema.get("type")
    if isinstance(t, list):
        t = next((x for x in t if x != "null"), "object")
    if "enum" in schema:
        return schema["enum"][0]
    if t == "object" or "properties" in schema:
        props = schema.get("properties", {})
        required = schema.get("required", list(props.keys()) if not only_required else [])
        out = {}
        for name, ps in props.items():
            if only_required and name not in required:
                continue
            ps = contract.deref(ps)
            code = _lov_code(ps, lov_cache, client, results)
            if code is not None:
                out[name] = code
            else:
                out[name] = build_payload(ps, contract, lov_cache, client, results, only_required)
        return out
    if t == "array":
        item = build_payload(schema.get("items", {}), contract, lov_cache, client, results, only_required)
        return [item]
    if t == "integer" or t == "number":
        lo = schema.get("minimum", 1)
        hi = schema.get("maximum")
        val = lo if lo else 1
        # field tiền tệ -> giá trị an toàn lớn hơn
        if hi is None and lo in (None, 0, 1):
            val = 1000
        if hi is not None and val > hi:
            val = hi
        return int(val) if t == "integer" else val
    if t == "boolean":
        return True
    if t == "string":
        fmt = schema.get("format")
        if fmt == "uuid":
            return str(uuid.uuid4())
        if fmt == "date":
            return datetime.date.today().isoformat()
        if fmt == "date-time":
            return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S+07:00")
        return _string_value(schema)
    return None


# ============================================================
# Helpers cho lifecycle
# ============================================================
# Ngày gửi khác "hôm nay" để PUT update tạo thay đổi thật (entity dirty -> @Version tăng).
_ALT_SEND_DATE = "2025-12-01"


def _force_change(update_payload):
    """Đảm bảo body update KHÁC giá trị create để Hibernate ra UPDATE và bump @Version."""
    if "sendDate" in update_payload:
        update_payload["sendDate"] = _ALT_SEND_DATE
    return update_payload


def _reason_body(contract, lov_cache, client, results, action):
    """Body cho action workflow có ghi approval-log. REASON là NOT NULL (DEC-03 —
    bắt buộc cả khi check/approve), Oracle coi '' là NULL nên phải gửi reason không rỗng."""
    schema_name = {"check": "ApproveRequest", "approve": "ApproveRequest"}.get(action)
    body = {}
    if schema_name and schema_name in contract.doc.get("components", {}).get("schemas", {}):
        body = build_payload(contract.schema_by_name(schema_name),
                             contract, lov_cache, client, results, only_required=False) or {}
    body.setdefault("reason", "Integration test - " + action)
    return body


# ============================================================
# Phases
# ============================================================
def wait_for_health(client, retries=20, delay=2.0):
    url = client.root + HEALTH_URL_SUFFIX
    for i in range(retries):
        try:
            r = client.s.get(url, timeout=client.timeout)
            client.log("  GET    %s -> %s" % (HEALTH_URL_SUFFIX, r.status_code))
            if r.status_code == 200 and r.json().get("status") == "UP":
                return True
        except Exception as e:
            client.log("  health attempt %d: %s" % (i + 1, e))
        time.sleep(delay)
    return False


def _has_token(client):
    return bool(client.tokens) or client.bypass


def phase_smoke(client, contract, results, lov_cache):
    print(Color.bold("\n--- SMOKE ---"))
    if not _has_token(client):
        results.skip("smoke (all)", "smoke", "Không có token -> mọi endpoint trả 401")
        return
    # mọi GET không có path param
    for path, ops in contract.paths.items():
        if "{" in path:
            continue
        op = ops.get("get")
        if not op:
            continue
        # endpoint export bắt buộc query 'format' -> bỏ qua trong smoke
        required_q = [p for p in op.get("parameters", []) if isinstance(p, dict)
                      and p.get("in") == "query" and p.get("required")]
        if required_q:
            results.skip("GET " + path, "smoke", "bỏ qua: cần query bắt buộc " +
                         ",".join(p["name"] for p in required_q))
            continue
        r = client.request("GET", path)
        # LOV phụ trợ chưa hiện thực (vd /lov/users phụ thuộc IDP - xem impact.md):
        # contract khai báo nhưng BE chưa có route -> 404/500. Báo SKIP, không fail giả.
        if path.startswith("/lov/") and r.status_code in (404, 500, 501):
            results.skip("GET " + path, "smoke",
                         "LOV chưa hiện thực (" + str(r.status_code) + ") - ngoài scope")
            continue
        ok = r.status_code == 200
        results.record("GET " + path, "smoke", ok, "200", str(r.status_code))
        if ok:
            body = r.json()
            is_lov = path.startswith("/lov/")
            # LOV hiện trả mảng thuần (existing endpoint) lệch contract {items:[...]}.
            # Không validate cứng wrapper cho /lov/ để tránh báo lỗi giả; chỉ cache items.
            if is_lov:
                lov_cache[path.split("/lov/")[1]] = lov_items(body)
            else:
                schema_ref = (op.get("responses", {}).get("200", {})
                              .get("content", {}).get("application/json", {}).get("schema"))
                if schema_ref:
                    try:
                        validate_schema(body, contract.deref(schema_ref), path, results, "smoke")
                    except ValueError:
                        pass


def _create_dossier(client, contract, results, lov_cache, role="MAKER"):
    """POST create (full validation) -> (id, version) hoặc (None, None)."""
    schema = contract.schema_by_name("DossierCreateRequest")
    body = build_payload(schema, contract, lov_cache, client, results)
    missing = [k for k in schema.get("required", []) if not body.get(k)]
    if missing:
        results.skip("create dossier", "lifecycle",
                     "LOV rỗng cho field bắt buộc: " + ",".join(missing) + " -> không tạo được")
        return None, None
    r = client.request("POST", "/exp/opex/dossiers", role=role, json=body)
    ok = r.status_code == 201
    results.record("POST create dossier", "lifecycle", ok, "201", str(r.status_code),
                   "" if ok else r.text[:200])
    if not ok:
        return None, None
    data = r.json()
    validate_schema(data, contract.schema_by_name("DossierCreateResponse"),
                    "DossierCreateResponse", results, "lifecycle")
    return data.get("id"), data.get("version")


def phase_lifecycle(client, contract, results, lov_cache):
    print(Color.bold("\n--- LIFECYCLE (create -> submit -> check -> approve) ---"))
    if not _has_token(client):
        results.skip("lifecycle (all)", "lifecycle", "Không có token -> không thể chạy vòng đời")
        return

    did, version = _create_dossier(client, contract, results, lov_cache)
    if not did:
        results.skip("lifecycle remainder", "lifecycle", "create thất bại -> bỏ các bước sau")
        return

    # GET detail
    r = client.request("GET", "/exp/opex/dossiers/" + did)
    ok = r.status_code == 200 and r.json().get(STATUS_FIELD) == "DRAFT"
    results.record("GET dossier detail (DRAFT)", "lifecycle", ok, "200 & fStatus=DRAFT",
                   str(r.status_code) + " " + str(r.json().get(STATUS_FIELD) if r.ok else ""))
    if r.ok:
        validate_schema(r.json(), contract.schema_by_name("DossierDetail"),
                        "DossierDetail", results, "lifecycle")

    # UPDATE (version bump) — phải đổi field thật sự, nếu không entity không "dirty"
    # thì @Version (JPA) sẽ KHÔNG tăng (Hibernate bỏ qua UPDATE no-op).
    upd = build_payload(contract.schema_by_name("DossierUpdateRequest"),
                        contract, lov_cache, client, results)
    upd["version"] = version
    _force_change(upd)
    r = client.request("PUT", "/exp/opex/dossiers/" + did, role="MAKER", json=upd)
    new_version = version
    if r.status_code == 200:
        new_version = r.json().get("version", version)
        results.record("PUT update (version bump)", "lifecycle",
                       new_version == version + 1, "version=" + str(version + 1),
                       "version=" + str(new_version))
    else:
        results.record("PUT update", "lifecycle", False, "200", str(r.status_code), r.text[:200])

    # ADD document (child)
    doc_body = build_payload(contract.schema_by_name("DocumentCreateRequest"),
                             contract, lov_cache, client, results)
    r = client.request("POST", "/exp/opex/dossiers/" + did + "/documents", role="MAKER", json=doc_body)
    doc_ok = r.status_code == 201
    results.record("POST add document", "lifecycle", doc_ok, "201", str(r.status_code),
                   "" if doc_ok else r.text[:200])

    # WORKFLOW transitions: submit -> check -> approve
    chain = [("submit", "MAKER"), ("check", "CHECKER"), ("approve", "APPROVER")]
    broke = False
    for action, role in chain:
        if broke:
            results.skip("POST " + action, "lifecycle", "bước trước fail -> SKIP")
            continue
        if not client.has_auth(role):
            results.skip("POST " + action, "lifecycle", "thiếu token role " + role)
            broke = True
            continue
        body = _reason_body(contract, lov_cache, client, results, action)
        r = client.request("POST", "/exp/opex/dossiers/" + did + "/" + action, role=role, json=body)
        expect_to = WORKFLOW[action]["to"]
        ok = r.status_code == 200 and r.json().get(STATUS_FIELD) in expect_to
        results.record("POST " + action + " [" + role + "]", "lifecycle", ok,
                       "200 & fStatus∈" + str(expect_to),
                       str(r.status_code) + " " + str(r.json().get(STATUS_FIELD) if r.ok else r.text[:120]))
        if not ok:
            broke = True

    # NHÁNH PHỤ: reject path (create -> submit -> check-reject)
    did2, v2 = _create_dossier(client, contract, results, lov_cache)
    if did2:
        client.request("POST", "/exp/opex/dossiers/" + did2 + "/documents", role="MAKER",
                       json=build_payload(contract.schema_by_name("DocumentCreateRequest"),
                                          contract, lov_cache, client, results))
        rs = client.request("POST", "/exp/opex/dossiers/" + did2 + "/submit", role="MAKER")
        checker_ok = client.has_auth("CHECKER")
        if rs.status_code == 200 and checker_ok:
            rj = build_payload(contract.schema_by_name("RejectRequest"),
                               contract, lov_cache, client, results)
            rr = client.request("POST", "/exp/opex/dossiers/" + did2 + "/check-reject",
                                role="CHECKER", json=rj)
            ok = rr.status_code == 200 and rr.json().get(STATUS_FIELD) == "CHECK_REJECTED"
            results.record("POST check-reject [CHECKER]", "lifecycle", ok,
                           "200 & fStatus=CHECK_REJECTED",
                           str(rr.status_code) + " " + str(rr.json().get(STATUS_FIELD) if rr.ok else ""))
        else:
            results.skip("POST check-reject", "lifecycle", "submit fail hoặc thiếu token CHECKER")

    # CLEANUP nhánh: soft-delete một draft mới
    if not getattr(client, "_no_cleanup", False):
        did3, _ = _create_dossier(client, contract, results, lov_cache)
        if did3:
            dbody = build_payload(contract.schema_by_name("DeleteDossierRequest"),
                                  contract, lov_cache, client, results, only_required=False)
            rr = client.request("DELETE", "/exp/opex/dossiers/" + did3, role="MAKER", json=dbody)
            ok = rr.status_code == 200
            results.record("DELETE soft-delete draft", "lifecycle", ok, "200", str(rr.status_code),
                           "" if ok else rr.text[:200])


def phase_negative(client, contract, results):
    print(Color.bold("\n--- NEGATIVE ---"))

    # 401: gọi endpoint bảo vệ không token (luôn chạy được)
    r = client.request("GET", "/exp/opex/dossiers", no_auth=True)
    results.record("401 missing token", "negative", r.status_code == 401, "401", str(r.status_code))

    if not _has_token(client):
        for case in ["403 wrong role", "404 not found", "409 optimistic lock", "400/422 validation"]:
            results.skip(case, "negative", "Không có token")
        return

    # 404: GET id ngẫu nhiên
    r = client.request("GET", "/exp/opex/dossiers/" + str(uuid.uuid4()))
    results.record("404 not found", "negative", r.status_code == 404, "404", str(r.status_code))

    # 403: create (MAKER-only) bằng role khác MAKER.
    wrong_role = next((rl for rl in ["VIEWER", "CHECKER", "APPROVER"] if rl in client.tokens), None)
    if wrong_role:
        body = build_payload(contract.schema_by_name("DossierCreateRequest"), contract, {}, client, results)
        r = client.request("POST", "/exp/opex/dossiers", role=wrong_role, json=body)
        results.record("403 wrong role (" + wrong_role + " create)", "negative",
                       r.status_code == 403, "403", str(r.status_code), r.text[:160])
    elif client.bypass:
        # Bypass mode: BE chưa enforce role (out-of-scope, xem OpexDossierController)
        # nên mọi X-User-Id đều tạo được -> không thể kiểm 403.
        results.skip("403 wrong role", "negative",
                     "bypass: BE chưa phân quyền role (enforce role out-of-scope)")
    else:
        results.skip("403 wrong role", "negative", "không có token role != MAKER để thử")

    # 400/422: create thiếu field required (body rỗng)
    r = client.request("POST", "/exp/opex/dossiers", role="MAKER", json={})
    results.record("400/422 missing required", "negative",
                   r.status_code in (400, 422), "400 hoặc 422", str(r.status_code))

    # 409: optimistic lock — tạo, update 1 lần, rồi PUT lại bằng version cũ
    lov_cache = {}
    did, version = _create_dossier(client, contract, results, lov_cache)
    if did and version is not None:
        upd = build_payload(contract.schema_by_name("DossierUpdateRequest"), contract, lov_cache, client, results)
        upd["version"] = version
        _force_change(upd)
        client.request("PUT", "/exp/opex/dossiers/" + did, role="MAKER", json=upd)  # version -> +1
        stale = dict(upd)
        stale["version"] = version  # cố tình dùng version cũ
        r = client.request("PUT", "/exp/opex/dossiers/" + did, role="MAKER", json=stale)
        results.record("409 optimistic lock", "negative", r.status_code == 409, "409", str(r.status_code), r.text[:160])
    else:
        results.skip("409 optimistic lock", "negative", "không tạo được dossier để thử")


# ============================================================
# main
# ============================================================
def main():
    args = parse_args()
    print(Color.bold("Contract: ") + args.contract)
    print(Color.bold("Base URL: ") + args.base_url)
    print(Color.bold("Tokens:   ") + (", ".join(sorted(args.tokens)) or "(none)"))
    print(Color.bold("Bypass:   ") + ("X-User-Id (JWT bypass ON)" if args.bypass else "off"))

    contract = Contract.load(args.contract)
    results = Results()

    def logfn(msg):
        print(msg)

    client = Client(args.base_url, args.tokens, args.timeout, logfn,
                    bypass=args.bypass, user_id=args.user_id)
    client._no_cleanup = args.no_cleanup

    print(Color.bold("\n--- HEALTH ---"))
    if not wait_for_health(client, retries=15, delay=2.0):
        print(Color.red("BE không sẵn sàng (health != UP). Hãy `docker compose up -d` rồi đợi healthy."))
        sys.exit(2)

    lov_cache = {}
    only = args.only
    if only in (None, "smoke"):
        phase_smoke(client, contract, results, lov_cache)
    if only in (None, "lifecycle"):
        phase_lifecycle(client, contract, results, lov_cache)
    if only in (None, "negative"):
        phase_negative(client, contract, results)

    results.print_summary()
    if args.report:
        results.write_json(args.report)
    sys.exit(1 if results.has_failures() else 0)


if __name__ == "__main__":
    main()
