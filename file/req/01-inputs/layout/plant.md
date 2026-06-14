# Plant: HTML → React Conversion với Unified Test Suite

## Mục tiêu

Convert `form_list.html` và `form_detail.html` sang React components, đo lường **% fidelity có căn cứ định lượng** thay vì ước tính cảm quan.

---

## Phương pháp đo lường

1 bộ Playwright test duy nhất chạy trên cả 2 environments — chỉ đổi `BASE_URL`:

```bash
# HTML gốc (baseline = 100%)
BASE_URL=http://localhost:8080 playwright test

# React sau convert
BASE_URL=http://localhost:5173 playwright test
```

### 3 lớp đo %

| Lớp | Công cụ | Kết quả |
|-----|---------|---------|
| **Visual** | Playwright screenshot pixel diff | `98.7% pixel match` |
| **Structural** | `getByTestId()` presence check | `46/47 elements = 97.8%` |
| **CSS** | `getComputedStyle()` sampling | `19/20 properties = 95%` |

---

## Naming Convention: `data-testid`

Nguồn sự thật: `field-spec.json` codes. Mapping 1:1 sang JSX sau khi convert.

| Element type | field-spec code | `data-testid` value |
|---|---|---|
| Input / field | `PROJECT_CODE` | `field-PROJECT_CODE` |
| Button | `BTN_SAVE` | `BTN_SAVE` |
| Tab | `tab-general` | `tab-general` |
| Stats bar item | `STAT_TOTAL` | `STAT_TOTAL` |
| Status badge | dynamic | `badge-STATE_CODE` |
| Error message | per field | `error-PROJECT_CODE` |
| Modal | semantic | `modal-delete`, `modal-lookup-project` |
| Table row | dynamic | `row-{DOSSIER_CODE}` |

**Lý do dùng `data-testid` thay `id`:**
- `id` phải unique toàn DOM — React render nhiều instance sẽ vi phạm
- `data-testid` không ảnh hưởng CSS/accessibility
- Playwright có `page.getByTestId()` built-in

---

## Cấu trúc test

```
tests/
  playwright.config.ts        # BASE_URL từ env var, 2 projects: html & react
  shared/
    selectors.ts              # Constants từ field-spec codes
    helpers.ts                # Common actions, page objects
  visual/
    list-visual.spec.ts       # Screenshot diff: form_list
    detail-visual.spec.ts     # Screenshot diff: form_detail
  structural/
    list-page.spec.ts         # Element presence + CSS computed
    detail-page.spec.ts
  functional/
    create-flow.spec.ts       # TC group 1 (14 TCs)
    view-flow.spec.ts         # TC group 2 (5 TCs)
    update-flow.spec.ts       # TC group 3 (6 TCs)
    delete-flow.spec.ts       # TC group 4 (6 TCs)
```

Functional tests lấy trực tiếp từ `testcases.json` → `automationHints.uiSelectors`.

---

## Thứ tự thực hiện

### Bước 1 — Thêm `data-testid` vào HTML
- `form_list.html`: ~80–100 attributes
- `form_detail.html`: ~120–150 attributes
- Mapping từ `field-spec.json` (fields, buttons, tabs, stats, modals)

### Bước 2 — Setup Playwright project
- `playwright.config.ts` với BASE_URL env var
- `tests/shared/selectors.ts` — export constants

### Bước 3 — Capture baseline từ HTML
```bash
npx serve . -p 8080
BASE_URL=http://localhost:8080 npx playwright test --update-snapshots
```
HTML baseline = 100% reference.

### Bước 4 — Viết structural + functional tests
- Dựa trên selectors.ts + testcases.json automationHints

### Bước 5 — Convert HTML → React
- Component tree theo structure HTML
- Copy CSS sang global stylesheet trước
- Carry over `data-testid` 1:1 vào JSX

### Bước 6 — Đo fidelity
```bash
BASE_URL=http://localhost:5173 npx playwright test
npx playwright show-report
```

---

## Ước lượng tỉ lệ thành công

| Lớp | First pass | Sau fix |
|-----|-----------|---------|
| Structural | ~99% | 99.5% |
| CSS computed | ~85–90% | 93–97% |
| Visual pixel | ~88–93% | 96–99% |
| Functional | ~80–88% | 92–96% |
| **Overall** | **~88–92%** | **~95–98%** |

**Rủi ro chính:**
- Font antialiasing / subpixel rendering khác nhau → dùng `maxDiffPixelRatio: 0.02`
- CSS modules thay đổi specificity → test với global CSS trước
- React synthetic events timing khác vanilla JS → kiểm tra keyboard shortcuts kỹ

**99% pixel-perfect**: khả thi sau 1–2 vòng fix targeted.

---

## Output Report Format

```
=== UI Fidelity Report ===
Environment : React (localhost:5173)
Baseline    : HTML (localhost:8080)

Visual      : 98.7%  (12,340 / 12,500 pixels match)
Structural  : 97.8%  (46 / 47 elements present)
CSS Style   : 95.0%  (19 / 20 properties match)
Functional  : 93.5%  (29 / 31 test cases pass)

Overall Score : 96.2%
Missing       : [badge-STATE_CODE] not found; [BTN_APPROVE] color mismatch
```

---

## Files liên quan

| File | Vai trò |
|------|---------|
| `form_list.html` | Source layout 1 — thêm data-testid, serve làm baseline |
| `form_detail.html` | Source layout 2 — thêm data-testid, serve làm baseline |
| `field-spec.json` | Nguồn sự thật cho naming convention |
| `testcases.json` | Source cho functional tests (31 TCs, 4 groups) |
| `tests/` | Playwright test suite (tạo mới) |
