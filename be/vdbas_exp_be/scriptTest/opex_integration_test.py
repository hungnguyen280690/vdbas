#!/usr/bin/env python3
"""
Integration test cho "EXP OPEX Dossier API" — mirror của integration_test.py (CAPEX).

BE phải đang chạy (docker compose up -d) và healthy.
Mặc định base URL: http://localhost:8085/api/v1
Health check:      http://localhost:8085/actuator/health

Cài đặt:
    pip install requests pyyaml jsonschema

Chạy:
    python3 opex_integration_test.py \
        --base-url http://localhost:8085/api/v1 \
        --report opex_report.json

    # Không cần token — BE bypass auth qua X-User-Id header (test env).
    # Để test multi-role riêng biệt:
    python3 opex_integration_test.py \
        --maker-user-id  <maker-id> \
        --checker-user-id <checker-id> \
        --approver-user-id <approver-id>

Exit code:
    0 = tất cả pass
    1 = có test FAIL
    2 = BE không sẵn sàng
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
    print("Thiếu 'requests'. Chạy: pip install requests pyyaml jsonschema", file=sys.stderr)
    sys.exit(2)

try:
    import yaml
except ImportError:
    print("Thiếu 'pyyaml'. Chạy: pip install requests pyyaml jsonschema", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


# ─────────────────────────────────────────────
#  Màu
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
    p = argparse.ArgumentParser(description="Integration test EXP OPEX Dossier API")
    p.add_argument("--base-url", default=os.getenv("BASE_URL", "http://localhost:8085/api/v1"))
    p.add_argument("--maker-user-id",
                   default=os.getenv("MAKER_USER_ID", "6FCD264E878349EF9C5B32A6DA90448C"))
    p.add_argument("--checker-user-id",
                   default=os.getenv("CHECKER_USER_ID", "6FCD264E878349EF9C5B32A6DA90448C"))
    p.add_argument("--approver-user-id",
                   default=os.getenv("APPROVER_USER_ID", "6FCD264E878349EF9C5B32A6DA90448C"))
    p.add_argument("--report", default="opex_report.json")
    p.add_argument("--only", help="smoke | lifecycle | negative")
    p.add_argument("--no-cleanup", action="store_true")
    p.add_argument("--timeout", type=float, default=float(os.getenv("HTTP_TIMEOUT", "30")))
    p.add_argument("--health-retries", type=int, default=15)
    p.add_argument("--health-delay", type=float, default=2.0)
    p.add_argument("--strict-schema", action="store_true")
    p.add_argument("--insecure", action="store_true")
    return p.parse_args()


# ─────────────────────────────────────────────
#  HTTP client
# ─────────────────────────────────────────────
class Client:
    def __init__(self, base_url, user_ids, timeout, verify=True):
        self.base = base_url.rstrip("/")
        sp = urlsplit(self.base)
        self.origin = f"{sp.scheme}://{sp.netloc}"
        self.user_ids = user_ids   # {'maker':..,'checker':..,'approver':..}
        self.timeout = timeout
        self.verify = verify
        self.s = requests.Session()

    def _uid(self, role):
        return self.user_ids.get(role) or self.user_ids.get("maker")

    def request(self, method, path, role="maker", json_body=None, params=None,
                idempotency=False, expected=None):
        url = path if path.startswith("http") else self.base + path
        headers = {"Accept": "application/json", "X-User-Id": self._uid(role)}
        if idempotency:
            headers["Idempotency-Key"] = str(uuid.uuid4())
        t0 = time.time()
        try:
            resp = self.s.request(method, url, headers=headers, json=json_body,
                                  params=params, timeout=self.timeout, verify=self.verify)
        except requests.RequestException as e:
            ms = int((time.time() - t0) * 1000)
            print(f"  {C.red('ERR')} {method:6} {path} → {e.__class__.__name__} ({ms}ms)")
            return None
        ms = int((time.time() - t0) * 1000)
        ok = (expected is None) or (resp.status_code in expected)
        mark = C.green(str(resp.status_code)) if ok else C.red(str(resp.status_code))
        print(f"  {method:6} {path} → {mark} {C.dim(f'({ms}ms)')}")
        return resp

    def get_health(self):
        try:
            return self.s.get(self.origin + "/actuator/health",
                              timeout=self.timeout, verify=self.verify)
        except requests.RequestException:
            return None


# ─────────────────────────────────────────────
#  Results
# ─────────────────────────────────────────────
class Results:
    def __init__(self, strict_schema=False):
        self.items = []
        self.strict_schema = strict_schema

    def add(self, name, phase, status, expected=None, actual=None, detail=""):
        self.items.append({"name": name, "phase": phase, "status": status,
                           "expected": expected, "actual": actual, "detail": detail})
        icon = {"PASS": C.green("✔ PASS"), "FAIL": C.red("✗ FAIL"),
                "SKIP": C.yellow("• SKIP"), "WARN": C.yellow("! WARN")}.get(status, status)
        line = f"    {icon}  {name}"
        if status in ("FAIL", "WARN", "SKIP") and detail:
            line += C.dim(f"  — {detail}")
        print(line)

    def check_status(self, name, phase, resp, expected):
        if resp is None:
            self.add(name, phase, "FAIL", list(expected), "no-response", "Không gọi được endpoint")
            return False
        exp = set(expected)
        if resp.status_code in exp:
            self.add(name, phase, "PASS", sorted(exp), resp.status_code)
            return True
        body = ""
        try:
            body = json.dumps(resp.json(), ensure_ascii=False)[:300]
        except Exception:
            body = (resp.text or "")[:300]
        self.add(name, phase, "FAIL", sorted(exp), resp.status_code, body)
        return False

    def check_field(self, name, phase, obj, *fields):
        """Kiểm tra obj có đủ các field không None."""
        missing = [f for f in fields if obj.get(f) is None]
        if missing:
            self.add(name, phase, "FAIL", detail=f"Thiếu field: {missing}")
            return False
        self.add(name, phase, "PASS")
        return True

    def has_failures(self):
        return any(i["status"] == "FAIL" for i in self.items)

    def print_summary(self):
        print("\n" + C.bold("═" * 60))
        print(C.bold(" TỔNG KẾT — OPEX"))
        print(C.bold("═" * 60))
        for phase in ["health", "smoke", "lifecycle", "negative"]:
            sub = [i for i in self.items if i["phase"] == phase]
            if not sub:
                continue
            c = {s: sum(1 for i in sub if i["status"] == s) for s in ("PASS", "FAIL", "SKIP", "WARN")}
            print(f"  {phase:12} "
                  f"{C.green(str(c['PASS'])+' pass')}  "
                  f"{C.red(str(c['FAIL'])+' fail')}  "
                  f"{C.yellow(str(c['SKIP'])+' skip')}  "
                  f"{C.yellow(str(c['WARN'])+' warn')}")
        total = {s: sum(1 for i in self.items if i["status"] == s)
                 for s in ("PASS", "FAIL", "SKIP", "WARN")}
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
#  Helpers
# ─────────────────────────────────────────────
def today():
    return datetime.date.today().isoformat()


def body_of(resp):
    """Lấy body JSON; trả {} nếu lỗi parse."""
    try:
        return resp.json()
    except Exception:
        return {}


def lov_list(resp):
    """Chuẩn hoá: trả list item bất kể response dạng {items:[]} hay [{...}]."""
    if resp is None:
        return []
    b = body_of(resp)
    if isinstance(b, list):
        return b
    if isinstance(b, dict):
        return b.get("items") or b.get("content") or []
    return []


def build_opex_payload(lov):
    """
    Payload tạo hồ sơ OPEX: {organizationCode, treasuryCode, sendDate, dataSourceCode}.
    OPEX không có projectCode.
    """
    org = next((x.get("organizationCode") or x.get("code") for x in lov.get("organizations", [])
                if x.get("organizationCode") or x.get("code")), None)
    treasury = next((x.get("treasuryCode") or x.get("code") for x in lov.get("treasuries", [])
                     if x.get("treasuryCode") or x.get("code")), None)
    data_source = next((x.get("code") for x in lov.get("dataSources", [])
                        if x.get("code")), "MANUAL")
    if not (org and treasury):
        return None
    return {
        "organizationCode": org,
        "treasuryCode": treasury,
        "sendDate": today(),
        "dataSourceCode": data_source,
    }


def build_opex_document_payload(lov):
    """Payload thêm chứng từ OPEX: cần documentTypeCode + treasuryCode."""
    doc_type = next((x.get("documentTypeCode") or x.get("code") for x in lov.get("documentTypes", [])
                     if x.get("documentTypeCode") or x.get("code")), "CT_OPEX")
    treasury = next((x.get("treasuryCode") or x.get("code") for x in lov.get("treasuries", [])
                     if x.get("treasuryCode") or x.get("code")), "0012")
    return {
        "documentTypeCode": doc_type,
        "treasuryCode": treasury,
        "documentDate": today(),
        "accountingDate": today(),
        "originalAmount": 10000000,
        "baseAmount": 10000000,
    }


# ─────────────────────────────────────────────
#  Phase: health gate
# ─────────────────────────────────────────────
def wait_for_health(client, results, retries, delay):
    print(C.cyan("\n▶ HEALTH GATE"))
    for i in range(1, retries + 1):
        resp = client.get_health()
        if resp is not None and resp.status_code == 200:
            try:
                status = resp.json().get("status", "UP")
            except Exception:
                status = "UP"
            if status in ("", "UP"):
                results.add("BE health /actuator/health", "health", "PASS", [200], 200, status)
                return True
        print(C.dim(f"  chờ BE healthy... ({i}/{retries})"))
        time.sleep(delay)
    results.add("BE health /actuator/health", "health", "FAIL", [200], None,
                "BE không healthy sau khi retry")
    return False


# ─────────────────────────────────────────────
#  Phase: smoke
# ─────────────────────────────────────────────
def phase_smoke(client, results, lov_cache):
    print(C.cyan("\n▶ SMOKE"))
    P = "smoke"

    # OPEX list — kiểm tra envelope mới {items, pagination, statusCounts}
    resp = client.request("GET", "/exp/opex/dossiers",
                          params={"page": 0, "size": 20, "sort": "createdDate,desc"},
                          expected={200})
    if results.check_status("OPEX list 200", P, resp, {200}):
        b = body_of(resp)
        has_items = "items" in b
        has_pag   = "pagination" in b
        has_sc    = "statusCounts" in b
        if has_items and has_pag and has_sc:
            results.add("OPEX list envelope {items,pagination,statusCounts}", P, "PASS")
        else:
            missing = [k for k, v in [("items", has_items), ("pagination", has_pag),
                                       ("statusCounts", has_sc)] if not v]
            results.add("OPEX list envelope", P, "FAIL",
                        detail=f"Thiếu field: {missing}")

    # LOV endpoints cần cho lifecycle
    for label, path, cache_key, id_field in [
        ("LOV tổ chức",    "/lov/organizations", "organizations", "organizationCode"),
        ("LOV kho bạc",    "/lov/treasuries",    "treasuries",    "treasuryCode"),
        ("LOV nguồn gốc",  "/lov/data-sources",  "dataSources",   "code"),
        ("LOV loại CT",    "/lov/document-types","documentTypes", "documentTypeCode"),
    ]:
        r = client.request("GET", path, expected={200})
        if results.check_status(label, P, r, {200}):
            lov_cache[cache_key] = lov_list(r)


# ─────────────────────────────────────────────
#  Phase: lifecycle
# ─────────────────────────────────────────────
def phase_lifecycle(client, results, lov_cache):
    print(C.cyan("\n▶ LIFECYCLE OPEX (DRAFT → PENDING_CHECKER → CHECKED → APPROVED)"))
    P = "lifecycle"

    payload = build_opex_payload(lov_cache)
    if payload is None:
        msg = "LOV organizations/treasuries rỗng → không dựng được payload"
        for s in ["1. Tạo hồ sơ", "1b. Lưu nháp", "2. Xem chi tiết", "3. Cập nhật",
                  "4. Thêm chứng từ", "5. Submit", "6. Checker check", "7. Approver approve"]:
            results.add(s, P, "SKIP", detail=msg)
        return

    def skip_rest(steps, reason):
        for s in steps:
            results.add(s, P, "SKIP", detail=reason)

    # ── 1. Tạo hồ sơ → DRAFT ──────────────────────────────────────────────
    resp = client.request("POST", "/exp/opex/dossiers", role="maker",
                          json_body=payload, idempotency=True, expected={201})
    if not results.check_status("1. Tạo hồ sơ (DRAFT)", P, resp, {201}):
        skip_rest(["1b. Lưu nháp", "2. Xem chi tiết", "3. Cập nhật",
                   "4. Thêm chứng từ", "5. Submit", "6. Checker check", "7. Approver approve"],
                  "Tạo hồ sơ thất bại")
        return

    b = body_of(resp)
    dossier_id = b.get("id")
    version = b.get("version", 0)
    dossier_code = b.get("dossierCode", "")
    results.check_field("1. Response có id/dossierCode/version", P, b, "id", "dossierCode", "version")
    print(f"    {C.dim(f'id={dossier_id}  code={dossier_code}  ver={version}')}")

    # ── 1b. Lưu nháp /drafts ──────────────────────────────────────────────
    resp = client.request("POST", "/exp/opex/dossiers/drafts", role="maker",
                          json_body={k: v for k, v in payload.items()},
                          idempotency=True, expected={201})
    results.check_status("1b. Lưu nháp (/drafts)", P, resp, {201})

    # ── 2. Xem chi tiết ───────────────────────────────────────────────────
    resp = client.request("GET", f"/exp/opex/dossiers/{dossier_id}", role="maker", expected={200})
    if results.check_status("2. Xem chi tiết", P, resp, {200}):
        det = body_of(resp)
        results.check_field("2. Detail có id/fStatus/version", P, det, "id", "fStatus", "version")
        if det.get("version") is not None:
            version = det["version"]

    # ── 3. Cập nhật (optimistic lock) ────────────────────────────────────
    upd = {**payload, "version": version,
           "sendDate": (datetime.date.today() - datetime.timedelta(days=1)).isoformat()}
    resp = client.request("PUT", f"/exp/opex/dossiers/{dossier_id}", role="maker",
                          json_body=upd, expected={200})
    if results.check_status("3. Cập nhật", P, resp, {200}):
        nv = body_of(resp).get("version")
        if isinstance(nv, int) and nv > version:
            results.add("3b. Version tăng sau update", P, "PASS", f">{version}", nv)
        else:
            results.add("3b. Version tăng sau update", P, "WARN", f">{version}", nv,
                        "Version không tăng")
        if isinstance(nv, int):
            version = nv

    # ── 4. Thêm chứng từ ─────────────────────────────────────────────────
    doc_payload = build_opex_document_payload(lov_cache)
    resp = client.request("POST", f"/exp/opex/dossiers/{dossier_id}/documents", role="maker",
                          json_body=doc_payload, idempotency=True, expected={201})
    if not results.check_status("4. Thêm chứng từ (201)", P, resp, {201}):
        skip_rest(["5. Submit", "6. Checker check", "7. Approver approve"],
                  "Không thêm được chứng từ → không đủ điều kiện submit")
        return
    results.check_field("4. Document response có id", P, body_of(resp), "id")

    # refresh version trước submit
    r2 = client.request("GET", f"/exp/opex/dossiers/{dossier_id}", role="maker", expected={200})
    if r2 and r2.status_code == 200:
        v = body_of(r2).get("version")
        if isinstance(v, int):
            version = v

    # ── 5. Submit → PENDING_CHECKER ──────────────────────────────────────
    resp = client.request("POST", f"/exp/opex/dossiers/{dossier_id}/submit", role="maker",
                          idempotency=True, expected={200})
    if not results.check_status("5. Submit → PENDING_CHECKER", P, resp, {200}):
        skip_rest(["6. Checker check", "7. Approver approve"], "Submit thất bại")
        return
    b5 = body_of(resp)
    if b5.get("fStatus") == "PENDING_CHECKER":
        results.add("5b. fStatus = PENDING_CHECKER", P, "PASS")
    else:
        results.add("5b. fStatus = PENDING_CHECKER", P, "WARN",
                    "PENDING_CHECKER", b5.get("fStatus"), "Trạng thái không như kỳ vọng")

    # ── 6. Checker check → CHECKED ───────────────────────────────────────
    resp = client.request("POST", f"/exp/opex/dossiers/{dossier_id}/check", role="checker",
                          json_body={"reason": "Kiểm soát đạt (auto-test)"},
                          idempotency=True, expected={200})
    if not results.check_status("6. Checker check → CHECKED", P, resp, {200}):
        skip_rest(["7. Approver approve"], "Checker check thất bại")
        return
    b6 = body_of(resp)
    if b6.get("fStatus") in ("CHECKED", "APPROVAL_PENDING"):
        results.add(f"6b. fStatus = {b6.get('fStatus')}", P, "PASS")
    else:
        results.add("6b. fStatus sau check", P, "WARN",
                    "CHECKED/APPROVAL_PENDING", b6.get("fStatus"))

    # ── 7. Approver approve → APPROVED ───────────────────────────────────
    resp = client.request("POST", f"/exp/opex/dossiers/{dossier_id}/approve", role="approver",
                          json_body={"reason": "Phê duyệt (auto-test)"},
                          idempotency=True, expected={200})
    if results.check_status("7. Approver approve → APPROVED", P, resp, {200}):
        b7 = body_of(resp)
        if b7.get("fStatus") == "APPROVED":
            results.add("7b. fStatus = APPROVED", P, "PASS")
        else:
            results.add("7b. fStatus = APPROVED", P, "WARN",
                        "APPROVED", b7.get("fStatus"))

    # ── 8. Kiểm tra hồ sơ xuất hiện trong list ───────────────────────────
    resp = client.request("GET", "/exp/opex/dossiers",
                          params={"page": 0, "size": 20, "sort": "createdDate,desc"},
                          expected={200})
    if results.check_status("8. Hồ sơ xuất hiện trong list", P, resp, {200}):
        b8 = body_of(resp)
        ids = [x.get("id") for x in b8.get("items", [])]
        if dossier_id in ids:
            results.add("8b. id tìm thấy trong items", P, "PASS")
        else:
            results.add("8b. id tìm thấy trong items", P, "FAIL",
                        detail=f"{dossier_id} không có trong {ids[:5]}")


# ─────────────────────────────────────────────
#  Phase: negative
# ─────────────────────────────────────────────
def phase_negative(client, results, lov_cache):
    print(C.cyan("\n▶ NEGATIVE"))
    P = "negative"

    # 404 — id ngẫu nhiên
    resp = client.request("GET", f"/exp/opex/dossiers/{uuid.uuid4()}", expected={404})
    results.check_status("404 id không tồn tại", P, resp, {404})

    # 400/422 — tạo thiếu field bắt buộc
    resp = client.request("POST", "/exp/opex/dossiers", role="maker",
                          json_body={"dataSourceCode": "MANUAL"},
                          idempotency=True, expected={400, 422})
    results.check_status("400/422 create thiếu field required", P, resp, {400, 422})

    # 409 optimistic lock — tạo throwaway rồi update 2 lần với version cũ
    payload = build_opex_payload(lov_cache)
    if payload is None:
        results.add("409 optimistic lock", P, "SKIP", detail="LOV rỗng")
        return

    resp = client.request("POST", "/exp/opex/dossiers", role="maker",
                          json_body=payload, idempotency=True, expected={201})
    if resp is None or resp.status_code != 201:
        results.add("409 optimistic lock", P, "SKIP", detail="Không tạo được throwaway")
        return
    b = body_of(resp)
    tid = b.get("id")
    v0 = b.get("version", 0)

    upd = {**payload, "version": v0,
           "sendDate": (datetime.date.today() - datetime.timedelta(days=1)).isoformat()}
    client.request("PUT", f"/exp/opex/dossiers/{tid}", role="maker",
                   json_body=upd, expected={200})
    # gửi lại với version cũ → 409
    resp = client.request("PUT", f"/exp/opex/dossiers/{tid}", role="maker",
                          json_body=upd, expected={409})
    results.check_status("409 optimistic lock (version cũ)", P, resp, {409})

    # Submit hồ sơ ở DRAFT mà không có chứng từ → 400 (BIZ rule)
    resp2 = client.request("POST", "/exp/opex/dossiers", role="maker",
                           json_body=payload, idempotency=True, expected={201})
    if resp2 and resp2.status_code == 201:
        tid2 = body_of(resp2).get("id")
        resp = client.request("POST", f"/exp/opex/dossiers/{tid2}/submit",
                              role="maker", expected={400, 422})
        results.check_status("400/422 submit không có chứng từ", P, resp, {400, 422})
    else:
        results.add("400/422 submit không có chứng từ", P, "SKIP",
                    detail="Không tạo được throwaway")


# ─────────────────────────────────────────────
#  main
# ─────────────────────────────────────────────
def main():
    args = parse_args()
    user_ids = {
        "maker":    args.maker_user_id,
        "checker":  args.checker_user_id,
        "approver": args.approver_user_id,
    }
    client = Client(args.base_url, user_ids, timeout=args.timeout, verify=not args.insecure)
    results = Results(strict_schema=args.strict_schema)

    print(C.bold("\nEXP OPEX Dossier — Integration Test"))
    print(C.dim(f"Base URL : {client.base}"))
    print(C.dim(f"Health   : {client.origin}/actuator/health"))
    print(C.dim(f"Maker    : {user_ids['maker']}"))
    print(C.dim(f"Checker  : {user_ids['checker']}"))
    print(C.dim(f"Approver : {user_ids['approver']}"))

    if not wait_for_health(client, results, args.health_retries, args.health_delay):
        results.print_summary()
        if args.report:
            results.write_json(args.report)
        print(C.red("\nBE không sẵn sàng."))
        sys.exit(2)

    lov_cache = {}
    run = args.only

    if run in (None, "smoke"):
        phase_smoke(client, results, lov_cache)

    if run in (None, "lifecycle"):
        if run == "lifecycle" and not lov_cache:
            phase_smoke(client, results, lov_cache)
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
