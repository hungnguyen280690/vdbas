#!/usr/bin/env python3
"""
Integration test cho "EXP CAPEX Dossier API" (v0.2.0) theo OpenAPI contract
apiContract/capex-dossier-api.yaml.

BE phải đang chạy (docker compose up -d) và healthy.
Mặc định base URL: http://localhost:8085/api/v1  (docker-compose map 8085:8080, server url /api/v1)
Health check:        http://localhost:8085/actuator/health  (actuator ở root, ngoài /api/v1)

Cài đặt:
    pip install requests pyyaml jsonschema

Chạy:
    python3 integration_test.py \
        --base-url http://localhost:8085/api/v1 \
        --maker-token "$MAKER_TOKEN" \
        --checker-token "$CHECKER_TOKEN" \
        --approver-token "$APPROVER_TOKEN" \
        --report report.json

Biến môi trường thay cho flag: BASE_URL, BEARER_TOKEN, MAKER_TOKEN, CHECKER_TOKEN, APPROVER_TOKEN.

Exit code:
    0 = tất cả pass
    1 = có test FAIL
    2 = BE không sẵn sàng (health gate thất bại)
"""
import argparse
import datetime
import json
import os
import sys
import time
import uuid
from urllib.parse import urlsplit

try:
    import requests
except ImportError:
    print("Thiếu thư viện 'requests'. Chạy: pip install requests pyyaml jsonschema", file=sys.stderr)
    sys.exit(2)

try:
    import yaml
except ImportError:
    print("Thiếu thư viện 'pyyaml'. Chạy: pip install requests pyyaml jsonschema", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


# ─────────────────────────────────────────────
#  Màu (tự tắt khi không phải TTY)
# ─────────────────────────────────────────────
class C:
    enabled = sys.stdout.isatty()

    @classmethod
    def _w(cls, code, s):
        return f"\033[{code}m{s}\033[0m" if cls.enabled else s

    @classmethod
    def green(cls, s):  return cls._w("32", s)
    @classmethod
    def red(cls, s):    return cls._w("31", s)
    @classmethod
    def yellow(cls, s): return cls._w("33", s)
    @classmethod
    def cyan(cls, s):   return cls._w("36", s)
    @classmethod
    def dim(cls, s):    return cls._w("2", s)
    @classmethod
    def bold(cls, s):   return cls._w("1", s)


# ─────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(description="Integration test EXP CAPEX Dossier API theo OpenAPI contract")
    default_contract = os.path.join(os.path.dirname(os.path.abspath(__file__)), "capex-dossier-api.yaml")
    p.add_argument("--base-url", default=os.getenv("BASE_URL", "http://localhost:8085/api/v1"),
                   help="URL gốc của BE (gồm context path /api/v1)")
    p.add_argument("--contract", default=default_contract, help="Đường dẫn OpenAPI YAML")
    p.add_argument("--token", default=os.getenv("BEARER_TOKEN"), help="JWT mặc định (fallback cho mọi role)")
    p.add_argument("--maker-token", default=os.getenv("MAKER_TOKEN"), help="JWT vai trò Maker")
    p.add_argument("--checker-token", default=os.getenv("CHECKER_TOKEN"), help="JWT vai trò Checker")
    p.add_argument("--approver-token", default=os.getenv("APPROVER_TOKEN"), help="JWT vai trò Approver")
    p.add_argument("--report", help="Ghi report JSON ra đường dẫn này")
    p.add_argument("--only", help="Chỉ chạy 1 phase: smoke | lifecycle | negative")
    p.add_argument("--no-cleanup", action="store_true", help="Không xoá dữ liệu test sau khi chạy")
    p.add_argument("--timeout", type=float, default=float(os.getenv("HTTP_TIMEOUT", "30")), help="HTTP timeout (giây)")
    p.add_argument("--health-retries", type=int, default=15, help="Số lần thử health check")
    p.add_argument("--health-delay", type=float, default=2.0, help="Giãn cách giữa các lần health check (giây)")
    p.add_argument("--strict-schema", action="store_true",
                   help="Coi schema mismatch là FAIL (mặc định: WARN, không ảnh hưởng exit code)")
    p.add_argument("--insecure", action="store_true", help="Bỏ qua verify TLS")
    return p.parse_args()


# ─────────────────────────────────────────────
#  Contract loader + $ref resolver + OpenAPI→JSONSchema
# ─────────────────────────────────────────────
class Contract:
    def __init__(self, spec):
        self.spec = spec
        self.schemas = spec.get("components", {}).get("schemas", {})
        self.server = (spec.get("servers") or [{}])[0].get("url", "")
        self.version = spec.get("info", {}).get("version", "")
        self.title = spec.get("info", {}).get("title", "")

    @classmethod
    def load(cls, path):
        with open(path, "r", encoding="utf-8") as f:
            return cls(yaml.safe_load(f))

    def _resolve_ref(self, ref):
        # vd: '#/components/schemas/DossierSummary'
        node = self.spec
        for part in ref.lstrip("#/").split("/"):
            node = node[part]
        return node

    def to_jsonschema(self, name):
        """Resolve $ref + chuyển OpenAPI quirks (nullable) sang JSON Schema thuần."""
        root = self.schemas.get(name)
        if root is None:
            return None
        return self._convert(root, stack=())

    def _convert(self, node, stack):
        if isinstance(node, list):
            return [self._convert(n, stack) for n in node]
        if not isinstance(node, dict):
            return node

        if "$ref" in node:
            ref = node["$ref"]
            if ref in stack:
                return {}  # cycle guard
            return self._convert(self._resolve_ref(ref), stack + (ref,))

        out = {}
        for k, v in node.items():
            if k in ("example", "default", "description", "xml", "discriminator"):
                continue
            if k == "nullable":
                continue
            out[k] = self._convert(v, stack)

        # nullable → cho phép null
        if node.get("nullable") is True:
            t = out.get("type")
            if isinstance(t, str):
                out["type"] = [t, "null"]
            elif isinstance(t, list) and "null" not in t:
                out["type"] = t + ["null"]
            if "enum" in out and None not in out["enum"]:
                out["enum"] = list(out["enum"]) + [None]
        return out


# ─────────────────────────────────────────────
#  HTTP client
# ─────────────────────────────────────────────
class Client:
    def __init__(self, base_url, tokens, timeout, verify=True):
        self.base = base_url.rstrip("/")
        sp = urlsplit(self.base)
        self.origin = f"{sp.scheme}://{sp.netloc}"
        self.tokens = tokens  # {'maker':..,'checker':..,'approver':..,'default':..}
        self.timeout = timeout
        self.verify = verify
        self.s = requests.Session()

    def token_for(self, role):
        if role == "none":
            return None
        return self.tokens.get(role) or self.tokens.get("default")

    # BE xác thực qua header X-User-Id do gateway inject (GatewayAuthFilter trong
    # vdbas-common), KHÔNG dùng Authorization: Bearer trực tiếp. Map role → user id.
    USER_IDS = {
        "maker": os.getenv("MAKER_USER_ID", "test-maker"),
        "checker": os.getenv("CHECKER_USER_ID", "test-checker"),
        "approver": os.getenv("APPROVER_USER_ID", "test-approver"),
        "default": os.getenv("USER_ID", "test-user"),
    }

    def user_id_for(self, role):
        if role == "none":
            return None
        return self.USER_IDS.get(role) or self.USER_IDS.get("default")

    def request(self, method, path, role="maker", json_body=None, params=None,
                idempotency=False, expected=None):
        url = path if path.startswith("http") else self.base + path
        headers = {"Accept": "application/json"}
        tok = self.token_for(role)
        if tok:
            headers["Authorization"] = "Bearer " + tok
        uid = self.user_id_for(role)
        if uid:
            headers["X-User-Id"] = uid
        if idempotency:
            headers["X-Idempotency-Key"] = str(uuid.uuid4())
        t0 = time.time()
        try:
            resp = self.s.request(method, url, headers=headers, json=json_body,
                                  params=params, timeout=self.timeout, verify=self.verify)
        except requests.RequestException as e:
            ms = int((time.time() - t0) * 1000)
            short = url.replace(self.base, "")
            print(f"  {C.red('ERR')} {method:6} {short} → {e.__class__.__name__} ({ms}ms)")
            return None
        ms = int((time.time() - t0) * 1000)
        short = url.replace(self.base, "").replace(self.origin, "")
        ok = (expected is None) or (resp.status_code in expected)
        mark = C.green(str(resp.status_code)) if ok else C.red(str(resp.status_code))
        print(f"  {method:6} {short} → {mark} {C.dim(f'({ms}ms)')}")
        return resp

    def get_health(self):
        url = self.origin + "/actuator/health"
        try:
            return self.s.get(url, timeout=self.timeout, verify=self.verify)
        except requests.RequestException:
            return None


# ─────────────────────────────────────────────
#  Result registry + reporter
# ─────────────────────────────────────────────
class Results:
    def __init__(self, contract, strict_schema):
        self.items = []
        self.contract = contract
        self.strict_schema = strict_schema

    def add(self, name, phase, status, expected=None, actual=None, detail=""):
        self.items.append({
            "name": name, "phase": phase, "status": status,
            "expected": expected, "actual": actual, "detail": detail,
        })
        icon = {"PASS": C.green("✔ PASS"), "FAIL": C.red("✗ FAIL"),
                "SKIP": C.yellow("• SKIP"), "WARN": C.yellow("! WARN")}.get(status, status)
        line = f"    {icon}  {name}"
        if status in ("FAIL", "WARN") and detail:
            line += C.dim(f"  — {detail}")
        elif status == "SKIP" and detail:
            line += C.dim(f"  — {detail}")
        print(line)

    def check_status(self, name, phase, resp, expected):
        """expected = set/list status code chấp nhận."""
        if resp is None:
            self.add(name, phase, "FAIL", expected, "no-response", "Không gọi được endpoint")
            return False
        exp = set(expected) if not isinstance(expected, set) else expected
        if resp.status_code in exp:
            self.add(name, phase, "PASS", sorted(exp), resp.status_code)
            return True
        body = ""
        try:
            body = json.dumps(resp.json(), ensure_ascii=False)[:200]
        except Exception:
            body = (resp.text or "")[:200]
        self.add(name, phase, "FAIL", sorted(exp), resp.status_code, body)
        return False

    def check_schema(self, name, phase, body, schema_name):
        if not HAS_JSONSCHEMA:
            self.add(f"{name} [schema {schema_name}]", phase, "WARN",
                     detail="jsonschema chưa cài — bỏ qua validate")
            return
        schema = self.contract.to_jsonschema(schema_name)
        if schema is None:
            self.add(f"{name} [schema {schema_name}]", phase, "WARN",
                     detail=f"Không tìm thấy schema '{schema_name}' trong contract")
            return
        try:
            jsonschema.validate(instance=body, schema=schema)
            self.add(f"{name} [schema {schema_name}]", phase, "PASS")
        except jsonschema.ValidationError as e:
            loc = "/".join(str(x) for x in e.absolute_path) or "(root)"
            detail = f"{loc}: {e.message[:160]}"
            self.add(f"{name} [schema {schema_name}]", phase,
                     "FAIL" if self.strict_schema else "WARN", detail=detail)

    def has_failures(self):
        return any(i["status"] == "FAIL" for i in self.items)

    def print_summary(self):
        print("\n" + C.bold("═" * 60))
        print(C.bold(" TỔNG KẾT"))
        print(C.bold("═" * 60))
        phases = ["health", "smoke", "lifecycle", "negative"]
        seen = [p for p in phases if any(i["phase"] == p for i in self.items)]
        for p in seen:
            sub = [i for i in self.items if i["phase"] == p]
            c = {s: sum(1 for i in sub if i["status"] == s) for s in ("PASS", "FAIL", "SKIP", "WARN")}
            print(f"  {p:10} "
                  f"{C.green(str(c['PASS'])+' pass')}  "
                  f"{C.red(str(c['FAIL'])+' fail')}  "
                  f"{C.yellow(str(c['SKIP'])+' skip')}  "
                  f"{C.yellow(str(c['WARN'])+' warn')}")
        total = {s: sum(1 for i in self.items if i["status"] == s) for s in ("PASS", "FAIL", "SKIP", "WARN")}
        print(C.bold("─" * 60))
        verdict = C.green("ALL PASS") if not self.has_failures() else C.red("HAS FAILURES")
        print(f"  TOTAL: {total['PASS']} pass / {total['FAIL']} fail / "
              f"{total['SKIP']} skip / {total['WARN']} warn   → {verdict}")
        print(C.bold("═" * 60))

    def write_json(self, path):
        summary = {s: sum(1 for i in self.items if i["status"] == s)
                   for s in ("PASS", "FAIL", "SKIP", "WARN")}
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"summary": summary, "hasFailures": self.has_failures(),
                       "results": self.items}, f, ensure_ascii=False, indent=2)
        print(C.dim(f"\nReport JSON: {path}"))


# ─────────────────────────────────────────────
#  Helpers sinh dữ liệu
# ─────────────────────────────────────────────
def today():
    # datetime.date.today() dùng giờ hệ thống — chấp nhận trong môi trường test.
    return datetime.date.today().isoformat()


def first(lst, *keys):
    """Lấy giá trị key đầu tiên tìm thấy trong phần tử đầu của list."""
    if not lst:
        return None
    item = lst[0]
    for k in keys:
        if isinstance(item, dict) and item.get(k):
            return item[k]
    return None


def lov_list(resp):
    """Chuẩn hoá: trả list item bất kể response dạng data.items hay data[]."""
    if resp is None:
        return []
    try:
        body = resp.json()
    except Exception:
        return []
    # BE trả mảng trần ([{...}]); một số contract cũ bọc trong {"data": ...}.
    data = body.get("data") if isinstance(body, dict) else body
    if isinstance(data, dict):
        return data.get("items", []) or data.get("content", []) or []
    if isinstance(data, list):
        return data
    return []


def build_dossier_payload(lov, version=None):
    """Sinh payload create/draft từ schema, dùng LOV thật. Trả None nếu thiếu LOV bắt buộc."""
    project_code = first(lov.get("projects"), "projectCode")
    # Investor + Ban QLDA đã được gộp thành "organization" (LOV /lov/organizations).
    # Lấy organizationCode gắn với project nếu có, fallback sang LOV organizations.
    org_code = first(lov.get("projects"), "organizationCode") or \
        first(lov.get("organizations"), "organizationCode")
    data_source = first(lov.get("dataSources"), "code") or "MANUAL"
    if not (project_code and org_code):
        return None
    payload = {
        "sendDate": today(),
        "dossierTypeCode": "CAPEX",
        "dataSourceCode": data_source,
        "projectCode": project_code,
        "organizationCode": org_code,
    }
    if version is not None:
        payload["version"] = version
    return payload


def build_document_payload(lov):
    doc_type = first(lov.get("documentTypes"), "documentTypeCode") or "GIAY_DNTT"
    return {
        "documentTypeCode": doc_type,
        "documentName": "Giấy đề nghị thanh toán (auto-test)",
        "documentNo": f"EXP/CAPEX/{datetime.date.today().year}/TEST{uuid.uuid4().hex[:5]}",
        "documentDate": today(),
        "accountingDate": today(),
        "baseAmount": 500000000,
    }


# ─────────────────────────────────────────────
#  Phase: health gate
# ─────────────────────────────────────────────
def wait_for_health(client, results, retries, delay):
    print(C.cyan("\n▶ HEALTH GATE"))
    for i in range(1, retries + 1):
        resp = client.get_health()
        if resp is not None and resp.status_code == 200:
            status = ""
            try:
                status = resp.json().get("status", "")
            except Exception:
                pass
            if status in ("", "UP"):
                results.add("BE health /actuator/health", "health", "PASS",
                            [200], resp.status_code, status)
                return True
        print(C.dim(f"  chờ BE healthy... ({i}/{retries})"))
        time.sleep(delay)
    results.add("BE health /actuator/health", "health", "FAIL",
                [200], None, "BE không healthy sau khi retry")
    return False


# ─────────────────────────────────────────────
#  Phase: smoke
# ─────────────────────────────────────────────
SMOKE_GETS = [
    ("Danh sách hồ sơ", "/exp/capex/dossiers", "DossierListResponse", {"page": 1, "pageSize": 20}),
    ("LOV dự án", "/lov/projects", "ProjectLovResponse", None),
    ("LOV kho bạc", "/lov/treasuries", "TreasuryLovResponse", None),
    ("LOV đơn vị (tổ chức)", "/lov/organizations", "OrganizationLovResponse", None),
    ("LOV nguồn gốc", "/lov/data-sources", None, None),
    ("LOV loại chứng từ", "/lov/document-types", None, None),
    ("LOV loại đính kèm", "/lov/attachment-types", None, None),
]


def phase_smoke(client, results, lov_cache):
    print(C.cyan("\n▶ SMOKE"))
    for name, path, schema, params in SMOKE_GETS:
        resp = client.request("GET", path, role="maker", params=params, expected={200})
        ok = results.check_status(name, "smoke", resp, {200})
        if ok and schema:
            try:
                results.check_schema(name, "smoke", resp.json(), schema)
            except Exception as e:
                results.add(f"{name} [schema]", "smoke", "WARN", detail=f"parse JSON lỗi: {e}")
        # cache LOV để dùng cho lifecycle
        if ok and path == "/lov/projects":
            lov_cache["projects"] = lov_list(resp)
        elif ok and path == "/lov/organizations":
            lov_cache["organizations"] = lov_list(resp)
        elif ok and path == "/lov/document-types":
            lov_cache["documentTypes"] = lov_list(resp)
        elif ok and path == "/lov/data-sources":
            lov_cache["dataSources"] = lov_list(resp)


# ─────────────────────────────────────────────
#  Phase: lifecycle (stateful, dừng chuỗi nếu bước fail)
# ─────────────────────────────────────────────
def _data(resp):
    try:
        body = resp.json()
    except Exception:
        return {}
    # BE trả object trần (không bọc {"data": ...}); fallback về chính body.
    if isinstance(body, dict):
        d = body.get("data")
        return d if isinstance(d, dict) else body
    return {}


def phase_lifecycle(client, results, lov_cache):
    print(C.cyan("\n▶ LIFECYCLE (draft → … → completed)"))
    P = "lifecycle"

    payload = build_dossier_payload(lov_cache)
    if payload is None:
        msg = "LOV (projects/organizations) rỗng → không dựng được payload hợp lệ"
        for step in ["1. Tạo nháp", "2. Xem chi tiết", "3. Cập nhật", "4. Thêm chứng từ",
                     "5. Gửi kiểm soát", "6. Checker duyệt", "7. Approver duyệt"]:
            results.add(step, P, "SKIP", detail=msg)
        return

    def skip_rest(steps, reason):
        for s in steps:
            results.add(s, P, "SKIP", detail=reason)

    # 1. Tạo hồ sơ ("lưu thật") → SAVED
    resp = client.request("POST", "/exp/capex/dossiers", role="maker",
                          json_body=payload, idempotency=True, expected={201})
    if not results.check_status("1. Tạo hồ sơ (SAVED)", P, resp, {201}):
        skip_rest(["1b. Lưu nháp gắn hồ sơ", "2. Xem chi tiết", "3. Cập nhật", "4. Thêm chứng từ",
                   "5. Gửi kiểm soát", "6. Checker duyệt", "7. Approver duyệt"],
                  "Bước tạo hồ sơ thất bại")
        return
    results.check_schema("1. Tạo hồ sơ", P, resp.json(), "DossierCreateResponse")
    d = _data(resp)
    dossier_id = d.get("id")
    version = d.get("version", 0)

    # 1b. Lưu nháp (autosave) — gắn vào hồ sơ vừa tạo
    resp = client.request("POST", "/exp/capex/dossiers/drafts", role="maker",
                          json_body={**payload, "dossierId": dossier_id},
                          idempotency=True, expected={201})
    results.check_status("1b. Lưu nháp gắn hồ sơ", P, resp, {201})

    # 2. Xem chi tiết
    resp = client.request("GET", f"/exp/capex/dossiers/{dossier_id}", role="maker", expected={200})
    if results.check_status("2. Xem chi tiết", P, resp, {200}):
        results.check_schema("2. Xem chi tiết", P, resp.json(), "DossierDetailResponse")
        det = _data(resp)
        if det.get("version") is not None:
            version = det["version"]

    # 3. Cập nhật (optimistic lock) → version +1. Đổi sendDate để entity "dirty" → @Version tăng.
    upd = build_dossier_payload(lov_cache, version=version)
    upd["sendDate"] = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    resp = client.request("PUT", f"/exp/capex/dossiers/{dossier_id}", role="maker",
                          json_body=upd, expected={200})
    if results.check_status("3. Cập nhật (version+1)", P, resp, {200}):
        results.check_schema("3. Cập nhật", P, resp.json(), "DossierUpdateResponse")
        nv = _data(resp).get("version")
        if isinstance(nv, int):
            if nv > version:
                results.add("3b. Version tăng sau update", P, "PASS", version + 1, nv)
            else:
                results.add("3b. Version tăng sau update", P, "WARN", "> " + str(version), nv,
                            "Version không tăng như kỳ vọng")
            version = nv

    # 4. Thêm chứng từ
    doc_payload = build_document_payload(lov_cache)
    resp = client.request("POST", f"/exp/capex/dossiers/{dossier_id}/documents", role="maker",
                          json_body=doc_payload, idempotency=True, expected={201})
    if not results.check_status("4. Thêm chứng từ", P, resp, {201}):
        skip_rest(["5. Gửi kiểm soát", "6. Checker duyệt", "7. Approver duyệt"],
                  "Thêm chứng từ thất bại → không đủ điều kiện submit (BIZ-012)")
        return
    results.check_schema("4. Thêm chứng từ", P, resp.json(), "DocumentDetailResponse")

    # refresh version trước submit
    resp = client.request("GET", f"/exp/capex/dossiers/{dossier_id}", role="maker", expected={200})
    if resp is not None and resp.status_code == 200:
        v = _data(resp).get("version")
        if isinstance(v, int):
            version = v

    # 5. Gửi kiểm soát → SUBMITTED
    resp = client.request("POST", f"/exp/capex/dossiers/{dossier_id}/submit", role="maker",
                          json_body={"version": version}, idempotency=True, expected={200})
    if not results.check_status("5. Gửi kiểm soát (SUBMITTED)", P, resp, {200}):
        skip_rest(["6. Checker duyệt", "7. Approver duyệt"], "Submit thất bại")
        return
    results.check_schema("5. Gửi kiểm soát", P, resp.json(), "WorkflowActionResponse")

    # 6. Checker duyệt → APPROVED (đã kiểm soát)
    resp = client.request("POST", f"/exp/capex/dossiers/{dossier_id}/approve", role="checker",
                          json_body={"reason": "Kiểm soát đạt yêu cầu (auto-test)"},
                          idempotency=True, expected={200})
    if not results.check_status("6. Checker duyệt (APPROVED)", P, resp, {200}):
        skip_rest(["7. Approver duyệt"], "Checker duyệt thất bại")
        return
    results.check_schema("6. Checker duyệt", P, resp.json(), "WorkflowActionResponse")

    # 7. Approver duyệt → COMPLETED
    resp = client.request("POST", f"/exp/capex/dossiers/{dossier_id}/approve", role="approver",
                          json_body={"reason": "Phê duyệt cuối (auto-test)"},
                          idempotency=True, expected={200})
    if results.check_status("7. Approver duyệt (COMPLETED)", P, resp, {200}):
        results.check_schema("7. Approver duyệt", P, resp.json(), "WorkflowActionResponse")


# ─────────────────────────────────────────────
#  Phase: negative (bám đúng status code contract khai báo)
# ─────────────────────────────────────────────
def phase_negative(client, results, lov_cache):
    print(C.cyan("\n▶ NEGATIVE"))
    P = "negative"

    # 401 — gọi endpoint bảo vệ không kèm token
    resp = client.request("GET", "/exp/capex/dossiers", role="none",
                          params={"page": 1}, expected={401})
    results.check_status("401 thiếu token", P, resp, {401})

    # 404 — dossier id ngẫu nhiên không tồn tại
    resp = client.request("GET", f"/exp/capex/dossiers/{uuid.uuid4()}", role="maker", expected={404})
    results.check_status("404 id không tồn tại", P, resp, {404})

    # 400/422 — create thiếu field bắt buộc
    resp = client.request("POST", "/exp/capex/dossiers", role="maker",
                          json_body={"dataSourceCode": "THU_CONG"}, idempotency=True,
                          expected={400, 422})
    results.check_status("400/422 create thiếu field required", P, resp, {400, 422})

    # 409 & 403 cần 1 hồ sơ throwaway ở DRAFT/SAVED
    payload = build_dossier_payload(lov_cache)
    if payload is None:
        results.add("409 optimistic lock", P, "SKIP", detail="LOV rỗng → không tạo được hồ sơ test")
        results.add("403 Maker gọi approve", P, "SKIP", detail="LOV rỗng → không tạo được hồ sơ test")
        return

    resp = client.request("POST", "/exp/capex/dossiers", role="maker",
                          json_body=payload, idempotency=True, expected={201})
    if resp is None or resp.status_code != 201:
        results.add("409 optimistic lock", P, "SKIP", detail="Không tạo được hồ sơ throwaway")
        results.add("403 Maker gọi approve", P, "SKIP", detail="Không tạo được hồ sơ throwaway")
        return
    d = _data(resp)
    tid = d.get("id")
    v0 = d.get("version", 1)

    # update lần 1 (v0 → v0+1) — đổi sendDate để entity dirty → version thật sự tăng
    mod = build_dossier_payload(lov_cache, version=v0)
    mod["sendDate"] = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    client.request("PUT", f"/exp/capex/dossiers/{tid}", role="maker",
                   json_body=mod, expected={200})
    # update lần 2 với version cũ v0 → kỳ vọng 409
    resp = client.request("PUT", f"/exp/capex/dossiers/{tid}", role="maker",
                          json_body=mod, expected={409})
    results.check_status("409 optimistic lock (version cũ)", P, resp, {409})

    # Approve khi chưa SUBMITTED → bị state-machine chặn (400). Lưu ý: phân vai/SoD (403)
    # là out-of-scope ở BE hiện tại, nên đây kiểm tra rào trạng thái thay vì 403.
    resp = client.request("POST", f"/exp/capex/dossiers/{tid}/approve", role="maker",
                          json_body={"reason": "approve sai trạng thái"}, idempotency=True,
                          expected={400})
    results.check_status("Approve sai trạng thái → 400 (SoD/403 out-of-scope)", P, resp, {400})


# ─────────────────────────────────────────────
#  main
# ─────────────────────────────────────────────
def main():
    args = parse_args()

    if not os.path.exists(args.contract):
        print(C.red(f"Không tìm thấy contract: {args.contract}"), file=sys.stderr)
        sys.exit(2)
    contract = Contract.load(args.contract)

    tokens = {
        "maker": args.maker_token,
        "checker": args.checker_token,
        "approver": args.approver_token,
        "default": args.token,
    }
    if not any(tokens.values()):
        print(C.yellow(
            "⚠ Chưa có JWT nào (--token / --maker-token / --checker-token / --approver-token).\n"
            "  Các request bảo vệ sẽ trả 401/403 → phần lớn test FAIL.\n"
            "  Set token theo từng role rồi chạy lại để có kết quả thực."))

    client = Client(args.base_url, tokens, timeout=args.timeout, verify=not args.insecure)
    results = Results(contract, strict_schema=args.strict_schema)

    print(C.bold(f"\n{contract.title} v{contract.version}"))
    print(C.dim(f"Base URL: {client.base}   |   Health: {client.origin}/actuator/health"))
    print(C.dim(f"jsonschema: {'có' if HAS_JSONSCHEMA else 'KHÔNG cài (schema → WARN)'}   |   "
                f"schema mode: {'strict' if args.strict_schema else 'lenient (WARN)'}"))

    if not wait_for_health(client, results, args.health_retries, args.health_delay):
        results.print_summary()
        if args.report:
            results.write_json(args.report)
        print(C.red("\nBE không sẵn sàng — kiểm tra `docker compose ps` và `docker compose logs api`."))
        sys.exit(2)

    lov_cache = {}
    run = args.only
    if run in (None, "smoke"):
        phase_smoke(client, results, lov_cache)
    if run in (None, "lifecycle"):
        if run == "lifecycle" and not lov_cache:
            phase_smoke(client, results, lov_cache)  # cần LOV cho lifecycle
        phase_lifecycle(client, results, lov_cache)
    if run in (None, "negative"):
        if run == "negative" and not lov_cache:
            phase_smoke(client, results, lov_cache)
        phase_negative(client, results, lov_cache)

    results.print_summary()
    if args.report:
        results.write_json(args.report)
    sys.exit(1 if results.has_failures() else 0)


if __name__ == "__main__":
    main()
