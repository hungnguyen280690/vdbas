# -*- coding: utf-8 -*-
"""
Seed dữ liệu thật cho phân hệ EXP.CAPEX_DOSSIER vào DB sống.
Source-of-truth: schema LIVE (vdbas_exp_new_ai@172.16.5.20/vdbaspdb), giá trị lấy từ
mockup form_list/form_detail + spec EXP.CAPEX_DOSSIER.CRUD_spec_function_V0.2.md.

Schema đang biến động (ddl-auto=update redeploy) => ins() TỰ THÍCH ỨNG:
  - đọc cột thật + tập NOT NULL ngay lúc chạy
  - lọc bỏ key không có trong bảng
  - báo lỗi rõ nếu còn cột NOT NULL (không default) chưa được cấp giá trị
Mỗi row cấp cả 2 biến thể trường (ORGANIZATION_* và INVESTOR_*/PROJECT_MANAGEMENT_*)
để khớp mọi phiên bản schema. Idempotent: xoá con->cha rồi chèn lại, commit cuối.
"""
import oracledb, uuid, datetime as dt

conn = oracledb.connect(user='vdbas_exp_new_ai', password='vdbas_exp',
                        dsn='172.16.5.20:1521/vdbaspdb')
cur = conn.cursor()
USER = 'seed'
NOW = dt.datetime(2026, 6, 18, 9, 0, 0)

def d(s):
    return dt.datetime.strptime(s, "%d/%m/%Y").date()

def u():
    return uuid.uuid4().bytes

def audit(*, by=USER):
    return dict(CREATED_BY=by, CREATED_DATE=NOW, UPDATED_BY=by, UPDATED_DATE=NOW)

# ── nạp schema thật ──
SCHEMA = {}   # table -> {col: (nullable_bool, has_default_bool)}
cur.execute("""select table_name, column_name, nullable, data_default
               from user_tab_columns""")
for t, col, nl, dft in cur.fetchall():
    SCHEMA.setdefault(t, {})[col] = (nl == 'Y', dft is not None)

def ins(table, rows):
    if not rows:
        return
    info = SCHEMA[table]
    existing = set(info)
    filtered = [{k: v for k, v in r.items() if k in existing} for r in rows]
    used = set(filtered[0])
    req = {c for c, (nullable, has_def) in info.items() if not nullable and not has_def}
    missing = req - used
    if missing:
        raise RuntimeError(f"{table}: thiếu cột NOT NULL {sorted(missing)} | "
                           f"cột bảng={sorted(existing)}")
    cols = list(filtered[0])
    sql = f'INSERT INTO {table} ({", ".join(cols)}) VALUES ({", ".join(":"+c for c in cols)})'
    cur.executemany(sql, filtered)
    print(f"  {table}: {len(filtered)}")

# ───────────────────────── 0. Dọn dữ liệu seed cũ (con -> cha) ─────────────────────────
for t in ["EXP_DOCUMENT_ATTACHMENT", "EXP_DOSSIER_ATTACHMENT", "EXP_DIGITAL_SIGNED",
          "EXP_APPROVAL_LOG", "EXP_DOSSIER_SLA", "EXP_DOSSIER_DRAFT", "EXP_DOCUMENT",
          "EXP_DOSSIER", "EXP_PROJECT_SPECIFIC", "EXP_PROJECT", "EXP_PROJECT_TYPE",
          "EXP_DOSSIER_TYPE", "EXP_WORKFLOW", "EXP_DATA_SOURCE", "EXP_DOCUMENT_TYPE",
          "EXP_ATTACHMENT_TYPE", "COMMON_ORGANIZATION", "COMMON_TREASURY", "COMMON_STATUS"]:
    if t in SCHEMA:
        cur.execute(f'DELETE FROM "{t}"')
print("cleared old seed rows")

# ───────────────────────── 1. COMMON_TREASURY ─────────────────────────
treasuries = {
    "0001": "Kho bạc Nhà nước (KBNN TW)",
    "0003": "KBNN — Ban Giao dịch",
    "0011": "Kho bạc Nhà nước khu vực XI",
    "0015": "Kho bạc Nhà nước khu vực XV",
}
ins("COMMON_TREASURY", [dict(TREASURY_CODE=c, TREASURY_NAME=n,
    DESCRIPTION="Danh mục Kho bạc", STATUS=1, **audit()) for c, n in treasuries.items()])

# ───────────────────────── 2. COMMON_STATUS ─────────────────────────
# 8 trạng thái CAPEX + 9 trạng thái OPEX (DossierStatus enum). EXP_DOSSIER.F_STATUS
# có FK_DOSSIER_STATUS -> COMMON_STATUS.STATUS_CODE: state machine OPEX (PENDING_CHECKER,
# CHECKED, ...) BẮT BUỘC tồn tại, nếu không submit/check/approve OPEX vỡ ORA-02291.
statuses = [
    # CAPEX
    ("DRAFT", "Lưu nháp"), ("SAVED", "Đã lưu"), ("VALIDATED", "Đã kiểm tra"),
    ("SUBMITTED", "Đã gửi kiểm soát"), ("APPROVED", "Đã phê duyệt"),
    ("REJECTED", "Đã từ chối"), ("COMPLETED", "Đã hoàn thành"), ("CANCELLED", "Đã huỷ"),
    # OPEX (additive — khớp DossierService.labelOf)
    ("PENDING_CHECKER", "Chờ kiểm soát"), ("CHECKED", "Đã kiểm soát"),
    ("APPROVAL_PENDING", "Chờ phê duyệt"), ("APPROVAL_REJECTED", "Phê duyệt từ chối"),
    ("CHECK_REJECTED", "Kiểm soát từ chối"), ("CHECK_CANCELLED", "Kiểm soát huỷ"),
    ("APPROVAL_CANCELLED", "Phê duyệt huỷ"), ("REJECTED_BY_CHECKER", "Bị kiểm soát trả lại"),
    ("DELETED", "Đã xoá"),
]
ins("COMMON_STATUS", [dict(STATUS_CODE=c, STATUS_NAME=n, SUB_SYSTEM="EXP",
    DESCRIPTION="Trạng thái xử lý hồ sơ chi", STATUS=1, **audit()) for c, n in statuses])

# ───────────────────────── 3. EXP_DATA_SOURCE (LOV.03) ─────────────────────────
data_sources = [("THU_CONG", "Thủ công"), ("DVC", "Dịch vụ kho bạc"), ("AUTO", "Tự động")]
ins("EXP_DATA_SOURCE", [dict(DATA_SOURCE_CODE=c, DATA_SOURCE_NAME=n,
    DESCRIPTION="Nguồn gốc hồ sơ", STATUS=1, **audit()) for c, n in data_sources])

# ───────────────────────── 4. EXP_DOSSIER_TYPE ─────────────────────────
dossier_types = [("CAPEX", "Hồ sơ Chi đầu tư"), ("OPEX", "Hồ sơ Chi thường xuyên")]
ins("EXP_DOSSIER_TYPE", [dict(DOSSIER_TYPE_CODE=c, DOSSIER_TYPE_NAME=n,
    DESCRIPTION="Loại hồ sơ chi", STATUS=1, **audit()) for c, n in dossier_types])

# ───────────────────────── 5. EXP_WORKFLOW ─────────────────────────
# OPEX_STANDARD: OpexDossierService hardcode workflowCode=OPEX_STANDARD
# (CacheConstants.OPEX_WORKFLOW_CODE) -> phải có parent row, nếu không FK
# FK_DOSSIER_WORKFLOW vỡ ORA-02291 khi tạo hồ sơ OPEX.
ins("EXP_WORKFLOW", [
    dict(WORKFLOW_CODE="CAPEX_STANDARD",
         WORKFLOW_NAME="Luồng phê duyệt chuẩn Chi đầu tư (Maker–Checker–Approver)",
         DESCRIPTION="Luồng phê duyệt 3 cấp", STATUS=1, **audit()),
    dict(WORKFLOW_CODE="OPEX_STANDARD",
         WORKFLOW_NAME="Luồng phê duyệt chuẩn Chi thường xuyên (Maker–Checker–Approver)",
         DESCRIPTION="Luồng phê duyệt 3 cấp", STATUS=1, **audit()),
])

# ───────────────────────── 6. EXP_DOCUMENT_TYPE ─────────────────────────
doc_types = [
    ("C202a", "Giấy rút dự toán ngân sách (Mẫu C2-02a/NS)"),
    ("C202b", "Giấy rút dự toán ngân sách (Mẫu C2-02b/NS)"),
    ("DNTT", "Giấy đề nghị thanh toán"),
    ("HDKT", "Hợp đồng kinh tế"),
    ("HDON", "Hóa đơn GTGT"),
]
doc_type_name = dict(doc_types)
ins("EXP_DOCUMENT_TYPE", [dict(DOCUMENT_TYPE_CODE=c, DOCUMENT_TYPE_NAME=n,
    DESCRIPTION="Loại chứng từ", STATUS=1, **audit()) for c, n in doc_types])

# ───────────────────────── 7. EXP_ATTACHMENT_TYPE ─────────────────────────
att_types = [
    ("ORIGINAL", "Chứng từ gốc"), ("CONTRACT", "Hợp đồng"), ("INVOICE", "Hóa đơn"),
    ("STATEMENT", "Bảng kê"), ("OTHER", "Văn bản khác"),
]
ins("EXP_ATTACHMENT_TYPE", [dict(ATTACHMENT_TYPE_CODE=c, ATTACHMENT_TYPE_NAME=n,
    DESCRIPTION="Loại đính kèm", STATUS=1, **audit()) for c, n in att_types])

# ───────────────────────── 8. COMMON_ORGANIZATION ─────────────────────────
orgs = {
    "1171277": "Cơ quan Báo và phát thanh",
    "1170918": "Văn phòng Sở Du lịch thành phố Hà Nội",
    "1059441": "Trường Trung học Công nghiệp Hà Nội",
    "1058252": "Sở Du lịch Hà Nội",
    "1056333": "Văn phòng Kho bạc Nhà nước",
    "1122826": "Trung tâm Y tế huyện Ia H'Drai",
    "1122899": "Đài Phát thanh và Truyền hình tỉnh Hà Giang",
    "1122910": "BQL Dự án Xử lý chất thải bệnh viện AG",
    "1121333": "Trường Tiểu học Long Hưng",
    "7499089": "BQL Dự án Đường An Phú 4 — Hòa Bình 3",
    "1121624": "Trường Mầm non xã Hương Nhượng",
    "1122831": "Trường TH&THCS xã Tân Mai",
    "1121625": "Câu lạc bộ Truyền thống kháng chiến Cần Giờ",
    "1122834": "Quỹ Hỗ trợ phụ nữ phát triển tỉnh Quảng Bình",
    "1122896": "Ban quản lý Bến xe khách huyện Ngọc Hồi",
    "7506106": "BQL Dự án Xây dựng tường rào UBND xã Giang Ly",
    "01701001": "Văn phòng Kho bạc Nhà nước",
}
# COMMON_ORGANIZATION (model mới) — cấp cả khoá biến thể cũ nếu schema yêu cầu
ins("COMMON_ORGANIZATION", [dict(ORGANIZATION_CODE=c, ORGANIZATION_NAME=n,
    INVESTOR_CODE=c, INVESTOR_NAME=n, PROJECT_MANAGEMENT_CODE=c, PROJECT_MANAGEMENT_NAME=n,
    DESCRIPTION="Đơn vị QHNS / Chủ đầu tư", STATUS=1, **audit()) for c, n in orgs.items()])

# ───────────────────────── 9. EXP_PROJECT_TYPE ─────────────────────────
proj_types = [("NORMAL", "Dự án thường"), ("MILITARY", "Dự án đặc thù (Quốc phòng)")]
ins("EXP_PROJECT_TYPE", [dict(PROJECT_TYPE_CODE=c, PROJECT_TYPE_NAME=n,
    DESCRIPTION="Loại dự án", STATUS=1, **audit()) for c, n in proj_types])

# ───────────────────────── 10. EXP_PROJECT ─────────────────────────
projects = [
    ("7004686", "Dự án Cải tạo, nâng cấp trụ sở làm việc", "NORMAL", "1056333"),
    ("7122155", "Dự án Mua sắm trang thiết bị CNTT (đặc thù)", "MILITARY", "1170918"),
    ("7499089", "Đường An Phú 4 — Hòa Bình 3", "NORMAL", "7499089"),
    ("7506106", "Xây dựng tường rào UBND xã Giang Ly", "NORMAL", "7506106"),
    ("7301045", "Dự án Trang thiết bị y tế tuyến huyện", "NORMAL", "1122826"),
    ("7305120", "Dự án Đầu tư hạ tầng phát thanh truyền hình", "NORMAL", "1122899"),
    ("7410088", "Dự án Xây dựng trường học đạt chuẩn", "NORMAL", "1121333"),
    ("7415099", "Dự án Cải tạo cơ sở giáo dục", "NORMAL", "1059441"),
]
PROJ = {c: (n, t, o) for c, n, t, o in projects}
ins("EXP_PROJECT", [dict(PROJECT_CODE=c, PROJECT_TYPE_CODE=t, PROJECT_NAME=n,
    ORGANIZATION_CODE=o, INVESTOR_CODE=o, PROJECT_MANAGEMENT_CODE=o,
    DESCRIPTION="Dự án/công trình chi đầu tư", STATUS=1, **audit())
    for c, n, t, o in projects])

# ───────────────────────── 11. EXP_PROJECT_SPECIFIC ─────────────────────────
specifics = [
    ("001200037", "7122155", "Hạng mục đặc thù — Hệ thống bảo mật"),
    ("001200038", "7122155", "Hạng mục đặc thù — Thiết bị chuyên dụng"),
]
ins("EXP_PROJECT_SPECIFIC", [dict(PROJECT_SPECIFIC_CODE=c, PROJECT_CODE=p,
    PROJECT_SPECIFIC_NAME=n, DESCRIPTION="Dự án đặc thù", STATUS=1, **audit())
    for c, p, n in specifics])

# ───────────────────────── 12. EXP_DOSSIER ─────────────────────────
dossiers_src = [
    ("T.MX1X2.001.01-260601-0001", "1171277", "01/06/2026", "nguyen.van.an", "0001", "DRAFT",     "7004686", "THU_CONG"),
    ("T.MX2X3.002.01-260530-0002", "1170918", "30/05/2026", "tran.thi.bich", "0003", "DRAFT",     "7122155", "THU_CONG"),
    ("T.MX3X4.003.01-260520-0003", "1059441", "20/05/2026", "le.hong.phuc",  "0011", "SAVED",     "7415099", "THU_CONG"),
    ("T.MX4X5.004.01-260515-0004", "1058252", "15/05/2026", "pham.quoc.hung","0015", "VALIDATED", "7004686", "THU_CONG"),
    ("T.MX1X2.001.01-260510-0005", "1056333", "10/05/2026", "vu.thi.lan",    "0001", "SUBMITTED", "7004686", "THU_CONG"),
    ("T.MX2X3.002.01-260505-0006", "1122826", "05/05/2026", "hoang.minh.duc","0003", "SUBMITTED", "7301045", "THU_CONG"),
    ("T.MX3X4.003.01-260428-0007", "1122899", "28/04/2026", "nguyen.van.an", "0011", "APPROVED",  "7305120", "THU_CONG"),
    ("T.MX4X5.004.01-260425-0008", "1122910", "25/04/2026", "tran.thi.bich", "0015", "APPROVED",  "7506106", "DVC"),
    ("T.MX1X2.001.01-260420-0009", "1121333", "20/04/2026", "le.hong.phuc",  "0001", "APPROVED",  "7410088", "THU_CONG"),
    ("T.MX2X3.002.01-260415-0010", "7499089", "15/04/2026", "pham.quoc.hung","0003", "APPROVED",  "7499089", "THU_CONG"),
    ("T.MX3X4.003.01-260410-0011", "1121624", "10/04/2026", "vu.thi.lan",    "0011", "REJECTED",  "7410088", "THU_CONG"),
    ("T.MX4X5.004.01-260405-0012", "1122831", "05/04/2026", "hoang.minh.duc","0015", "REJECTED",  "7415099", "THU_CONG"),
    ("T.MX1X2.001.01-260401-0013", "1121625", "01/04/2026", "nguyen.van.an", "0001", "REJECTED",  "7004686", "THU_CONG"),
    ("T.MX2X3.002.01-260328-0014", "1122834", "28/03/2026", "tran.thi.bich", "0003", "REJECTED",  "7301045", "THU_CONG"),
    ("T.MX3X4.003.01-260325-0015", "1122896", "25/03/2026", "le.hong.phuc",  "0011", "COMPLETED", "7506106", "THU_CONG"),
    ("T.MX4X5.004.01-260320-0016", "7506106", "20/03/2026", "pham.quoc.hung","0015", "COMPLETED", "7506106", "THU_CONG"),
    ("T.MX2X3.002.01-260601-T001", "01701001","01/06/2026", "he.thong.kbnn", "0011", "DRAFT",     "7004686", "DVC"),
    ("T.MX3X4.003.01-260528-T002", "1056333", "28/05/2026", "he.thong.kbnn", "0011", "VALIDATED", "7122155", "DVC"),
]
CHECKER, APPROVER = "kiemsoat.vien01", "phe.duyet01"

def assignee(st, maker):
    # CAPEX + OPEX states; .get fallback=maker để an toàn cho trạng thái OPEX.
    return {"DRAFT": maker, "SAVED": maker, "VALIDATED": maker, "SUBMITTED": CHECKER,
            "APPROVED": APPROVER, "REJECTED": maker, "COMPLETED": "SYSTEM",
            "PENDING_CHECKER": CHECKER, "CHECKED": APPROVER, "APPROVAL_PENDING": APPROVER,
            "CHECK_REJECTED": maker, "APPROVAL_REJECTED": maker,
            "REJECTED_BY_CHECKER": maker}.get(st, maker)

DOSS = {}   # code -> meta dict
dossier_rows = []
for code, org, sd, by, tre, st, pcode, ds in dossiers_src:
    did = u()
    sdd = d(sd)
    pname, ptype, _ = PROJ[pcode]
    is_mil = ptype == "MILITARY"
    ps_code = "001200037" if is_mil else None
    ps_name = "Hạng mục đặc thù — Hệ thống bảo mật" if is_mil else None
    cdate = dt.datetime.combine(sdd, dt.time(8, 30))
    DOSS[code] = dict(id=did, tre=tre, tre_name=treasuries[tre], pcode=pcode,
                      st=st, sd=sdd, by=by)
    dossier_rows.append(dict(
        ID=did, TREASURY_CODE=tre, TREASURY_NAME=treasuries[tre],
        DOSSIER_TYPE_CODE="CAPEX", DOSSIER_CODE=code, VERSION=1,
        SEND_DATE=sdd, PROJECT_CODE=pcode, PROJECT_NAME=pname,
        PROJECT_SPECIFIC_CODE=ps_code, PROJECT_SPECIFIC_NAME=ps_name,
        ORGANIZATION_CODE=org, ORGANIZATION_NAME=orgs[org],
        INVESTOR_CODE=org, INVESTOR_NAME=orgs[org],
        PROJECT_MANAGEMENT_CODE=org, PROJECT_MANAGEMENT_NAME=orgs[org],
        STATUS=1, F_STATUS=st, WORKFLOW_CODE="CAPEX_STANDARD", DATA_SOURCE_CODE=ds,
        ASSIGN_USER=assignee(st, by),
        SLA=dt.datetime.combine(sdd + dt.timedelta(days=5), dt.time(17, 0)),
        HASH_INFO=('{"documentHash":"seedhash","algorithm":"SHA256"}'
                   if st in ("SUBMITTED", "APPROVED", "COMPLETED") else None),
        COMPLETED_DATE=(sdd + dt.timedelta(days=7) if st == "COMPLETED" else None),
        CREATED_BY=by, CREATED_DATE=cdate, UPDATED_BY=by, UPDATED_DATE=cdate,
    ))
ins("EXP_DOSSIER", dossier_rows)

# ──────────────────── 12b. EXP_DOSSIER (OPEX — Chi thường xuyên) ────────────────────
# Hồ sơ OPEX theo mockup form_list/form_detail: DOSSIER_TYPE_CODE=OPEX,
# WORKFLOW_CODE=OPEX_STANDARD, KHÔNG dùng field dự án (PROJECT_*). State machine OPEX
# (DRAFT→PENDING_CHECKER→CHECKED→APPROVED, nhánh CHECK_REJECTED/APPROVAL_REJECTED).
opex_src = [
    # (DOSSIER_CODE, org, send_date, maker, treasury, F_STATUS, data_source)
    ("EXP/OPEX/260601-0001", "1171277", "01/06/2026", "nguyen.van.an",  "0001", "DRAFT",            "THU_CONG"),
    ("EXP/OPEX/260530-0002", "1170918", "30/05/2026", "tran.thi.bich",  "0003", "DRAFT",            "DVC"),
    ("EXP/OPEX/260528-0003", "1059441", "28/05/2026", "le.hong.phuc",   "0011", "PENDING_CHECKER",  "THU_CONG"),
    ("EXP/OPEX/260525-0004", "1058252", "25/05/2026", "pham.quoc.hung", "0015", "PENDING_CHECKER",  "DVC"),
    ("EXP/OPEX/260520-0005", "1056333", "20/05/2026", "vu.thi.lan",     "0001", "CHECKED",          "THU_CONG"),
    ("EXP/OPEX/260515-0006", "1122826", "15/05/2026", "hoang.minh.duc", "0003", "APPROVED",         "THU_CONG"),
    ("EXP/OPEX/260510-0007", "1122899", "10/05/2026", "nguyen.van.an",  "0011", "APPROVED",         "DVC"),
    ("EXP/OPEX/260505-0008", "1122910", "05/05/2026", "tran.thi.bich",  "0015", "CHECK_REJECTED",   "THU_CONG"),
    ("EXP/OPEX/260501-0009", "1121333", "01/05/2026", "le.hong.phuc",   "0001", "APPROVAL_REJECTED","THU_CONG"),
    ("EXP/OPEX/260428-0010", "7499089", "28/04/2026", "pham.quoc.hung", "0003", "REJECTED_BY_CHECKER","DVC"),
]

def opex_assignee(st, maker):
    return {"DRAFT": maker, "REJECTED_BY_CHECKER": maker, "PENDING_CHECKER": CHECKER,
            "CHECK_REJECTED": maker, "CHECKED": APPROVER, "APPROVAL_PENDING": APPROVER,
            "APPROVED": APPROVER, "APPROVAL_REJECTED": maker}.get(st, maker)

opex_rows = []
for code, org, sd, by, tre, st, ds in opex_src:
    did = u()
    sdd = d(sd)
    cdate = dt.datetime.combine(sdd, dt.time(8, 30))
    DOSS[code] = dict(id=did, tre=tre, tre_name=treasuries[tre], pcode=None,
                      st=st, sd=sdd, by=by)
    opex_rows.append(dict(
        ID=did, TREASURY_CODE=tre, TREASURY_NAME=treasuries[tre],
        DOSSIER_TYPE_CODE="OPEX", DOSSIER_CODE=code, VERSION=1,
        SEND_DATE=sdd,
        ORGANIZATION_CODE=org, ORGANIZATION_NAME=orgs[org],
        INVESTOR_CODE=org, INVESTOR_NAME=orgs[org],
        PROJECT_MANAGEMENT_CODE=org, PROJECT_MANAGEMENT_NAME=orgs[org],
        STATUS=1, F_STATUS=st, WORKFLOW_CODE="OPEX_STANDARD", DATA_SOURCE_CODE=ds,
        ASSIGN_USER=opex_assignee(st, by),
        SLA=dt.datetime.combine(sdd + dt.timedelta(days=5), dt.time(17, 0)),
        HASH_INFO=('{"documentHash":"seedhash","algorithm":"SHA256"}'
                   if st in ("PENDING_CHECKER", "CHECKED", "APPROVED") else None),
        COMPLETED_DATE=(sdd + dt.timedelta(days=3) if st == "APPROVED" else None),
        CREATED_BY=by, CREATED_DATE=cdate, UPDATED_BY=by, UPDATED_DATE=cdate,
    ))
ins("EXP_DOSSIER", opex_rows)

# ───────────────────────── 13. EXP_DOCUMENT ─────────────────────────
AMOUNTS = [25000000, 52500000, 48000000, 175000000, 240000000, 85500000, 64000000,
           150000000, 45000000, 15000000, 38000000, 78500000, 124000000, 33200000,
           18500000, 42000000]
doc_rows, ct, ai = [], 588, 0
doc_count_per, doc_first_id = {}, {}
for i, (code, m) in enumerate(DOSS.items()):
    sdd = m["sd"]
    n = 0 if m["st"] == "DRAFT" else (1 + (i % 3))
    doc_count_per[code] = n
    for k in range(n):
        ct += 1
        amt = AMOUNTS[ai % len(AMOUNTS)]; ai += 1
        dtype = "C202a" if k % 2 == 0 else "C202b"
        docid = u()
        if code not in doc_first_id:
            doc_first_id[code] = docid
        doc_rows.append(dict(
            ID=docid, DOSSIER_ID=m["id"], TREASURY_CODE=m["tre"], TREASURY_NAME=m["tre_name"],
            DOCUMENT_TYPE_CODE=dtype, DOCUMENT_NAME=doc_type_name[dtype],
            DOCUMENT_NO=f"CT{ct:04d}", DOCUMENT_DATE=sdd - dt.timedelta(days=2),
            ACCOUNTING_DATE=sdd, ORIGINAL_AMOUNT=amt, BASE_AMOUNT=amt, STATUS=1,
            CREATED_BY=m["by"], CREATED_DATE=dt.datetime.combine(sdd, dt.time(9, 0)),
            UPDATED_BY=m["by"], UPDATED_DATE=dt.datetime.combine(sdd, dt.time(9, 0)),
        ))
ins("EXP_DOCUMENT", doc_rows)

# ───────────────────────── 14. EXP_DOSSIER_ATTACHMENT ─────────────────────────
att_rows = []
for code, m in DOSS.items():
    if doc_count_per.get(code, 0) == 0:
        continue
    sdd = m["sd"]
    att_rows.append(dict(
        ID=u(), DOSSIER_ID=m["id"], ATTACHMENT_TYPE_CODE="ORIGINAL",
        FILE_NAME=f"chung-tu-goc-{code}.pdf", FILE_TYPE="pdf", FILE_SIZE=204800,
        FILE_PATH=f"/storage/exp/{code}/chung-tu-goc.pdf",
        DESCRIPTION="Chứng từ gốc kèm hồ sơ",
        CREATED_DATE=dt.datetime.combine(sdd, dt.time(9, 10)),
        UPDATED_DATE=dt.datetime.combine(sdd, dt.time(9, 10)),
        CREATED_BY=m["by"], UPDATED_BY=m["by"],
    ))
ins("EXP_DOSSIER_ATTACHMENT", att_rows)

# ───────────────────────── 14b. EXP_DOCUMENT_ATTACHMENT ─────────────────────────
docatt_rows = []
for code, docid in doc_first_id.items():
    m = DOSS[code]
    sdd = m["sd"]
    docatt_rows.append(dict(
        ID=u(), DOCUMENT_ID=docid, ATTACHMENT_TYPE_CODE="INVOICE",
        FILE_NAME=f"hoa-don-{code}.pdf", FILE_TYPE="pdf", FILE_SIZE=153600,
        FILE_PATH=f"/storage/exp/{code}/hoa-don.pdf", DESCRIPTION="Hóa đơn kèm chứng từ",
        CREATED_DATE=dt.datetime.combine(sdd, dt.time(9, 15)),
        UPDATED_DATE=dt.datetime.combine(sdd, dt.time(9, 15)),
        CREATED_BY=m["by"], UPDATED_BY=m["by"],
    ))
ins("EXP_DOCUMENT_ATTACHMENT", docatt_rows)

# ───────────────────────── 15. EXP_APPROVAL_LOG ─────────────────────────
log_rows = []
def add_log(did, code, user, role, day, reason, state, parent=None):
    lid = u()
    log_rows.append(dict(ID=lid, DOSSIER_ID=did, DOSSIER_CODE=code, ACTION_USER=user,
        ACTION_ROLE=role, ACTION_DATE=day, REASON=reason, STATE_CODE=state, PARENT_ID=parent,
        CREATED_DATE=dt.datetime.combine(day, dt.time(10, 0)), CREATED_BY=user,
        UPDATED_BY=user, UPDATED_DATE=dt.datetime.combine(day, dt.time(10, 0))))
    return lid

for code, m in DOSS.items():
    sdd, by, st, did = m["sd"], m["by"], m["st"], m["id"]
    if st in ("SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"):
        pid = add_log(did, code, by, "MAKER", sdd, "Gửi kiểm soát hồ sơ", "SUBMITTED")
        if st == "REJECTED":
            add_log(did, code, CHECKER, "CHECKER", sdd + dt.timedelta(days=1),
                    "Từ chối kiểm soát: hồ sơ thiếu chứng từ gốc, đề nghị bổ sung", "REJECTED", pid)
        elif st in ("APPROVED", "COMPLETED"):
            cid = add_log(did, code, CHECKER, "CHECKER", sdd + dt.timedelta(days=1),
                          "Kiểm soát đạt yêu cầu, chuyển phê duyệt", "APPROVED", pid)
            aid = add_log(did, code, APPROVER, "APPROVER", sdd + dt.timedelta(days=2),
                          "Phê duyệt hồ sơ chi đầu tư", "APPROVED", cid)
            if st == "COMPLETED":
                add_log(did, code, "SYSTEM", "SYSTEM", sdd + dt.timedelta(days=3),
                        "Hoàn tất xử lý hồ sơ", "COMPLETED", aid)
ins("EXP_APPROVAL_LOG", log_rows)

# ───────────────────────── 16. EXP_DOSSIER_SLA ─────────────────────────
sla_rows = []
for code, m in DOSS.items():
    sdd, by, st, did = m["sd"], m["by"], m["st"], m["id"]
    role = {"SUBMITTED": "CHECKER", "APPROVED": "APPROVER"}.get(st, "MAKER")
    sla_rows.append(dict(ID=u(), DOSSIER_ID=did, ACTION_ROLE=role, ACTION_USER=assignee(st, by),
        SLA=dt.datetime.combine(sdd + dt.timedelta(days=5), dt.time(17, 0)), IS_NOTIFY=0,
        CREATED_BY=by, CREATED_DATE=dt.datetime.combine(sdd, dt.time(8, 30)),
        UPDATED_BY=by, UPDATED_DATE=dt.datetime.combine(sdd, dt.time(8, 30))))
ins("EXP_DOSSIER_SLA", sla_rows)

conn.commit()
print("\nCOMMIT OK")

# ───────────────────────── Verify ─────────────────────────
print("\n=== ROW COUNTS ===")
for t in ["COMMON_TREASURY", "COMMON_STATUS", "COMMON_ORGANIZATION", "EXP_DATA_SOURCE",
          "EXP_DOSSIER_TYPE", "EXP_WORKFLOW", "EXP_DOCUMENT_TYPE", "EXP_ATTACHMENT_TYPE",
          "EXP_PROJECT_TYPE", "EXP_PROJECT", "EXP_PROJECT_SPECIFIC", "EXP_DOSSIER",
          "EXP_DOCUMENT", "EXP_DOSSIER_ATTACHMENT", "EXP_DOCUMENT_ATTACHMENT",
          "EXP_APPROVAL_LOG", "EXP_DOSSIER_SLA"]:
    if t in SCHEMA:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        print(f"  {t:<26} {cur.fetchone()[0]}")
cur.execute("SELECT F_STATUS, COUNT(*) FROM EXP_DOSSIER GROUP BY F_STATUS ORDER BY F_STATUS")
print("  EXP_DOSSIER by F_STATUS:", dict(cur.fetchall()))
conn.close()
