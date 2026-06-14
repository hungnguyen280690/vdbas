# Hướng dẫn kiểm thử FE

Có hai bộ test độc lập, phục vụ hai mục đích khác nhau.

---

## Tổng quan

| Bộ test | Thư mục | Mục đích | Target |
|---------|---------|----------|--------|
| **HTML baseline** | `vdbas_exp_fe/e2e/` | Kiểm tra UI trực tiếp trên HTML layout gốc, làm baseline đo fidelity React | `http://localhost:8080` |
| **React + mock** | `e2e/tests/mock/` | Kiểm tra React app chạy với mock server | `http://localhost:3003` |
| **React + real** | `e2e/tests/real/` | Smoke test trên React app với backend thật | `http://localhost:3000` |

---

## 1. HTML baseline — `vdbas_exp_fe/`

Test Playwright chạy trực tiếp trên file HTML layout (không cần build React). Server HTML được tự khởi động.

### Cấu trúc

```
vdbas_exp_fe/
├── playwright.config.ts          # config chính, tự serve HTML từ file/req/
└── e2e/
    ├── shared/
    │   ├── selectors.ts          # constants data-testid cho form_list
    │   ├── helpers.ts            # openPage, selectRow, expectModalOpen, ...
    │   ├── selectors.detail.ts   # constants data-testid cho form_detail
    │   └── helpers.detail.ts     # helpers riêng cho form_detail
    ├── form_list/
    │   ├── interactions.spec.ts  # 115 tests — buttons, keyboard, filter, table, pagination, modal
    │   └── visual.spec.ts        # screenshot baseline
    └── form_detail/
        ├── interactions.spec.ts  # 133 tests — form modes, tabs, modal, cascading fields
        └── visual.spec.ts        # screenshot baseline
```

### Cài đặt

```bash
cd fe/vdbas_exp_fe
npm install
npx playwright install chromium
```

### Chạy test

```bash
# Toàn bộ HTML baseline (server HTML tự khởi động)
npm run e2e

# Chỉ form_list hoặc form_detail
npm run e2e:html
npx playwright test --config playwright.config.ts e2e/form_list
npx playwright test --config playwright.config.ts e2e/form_detail

# Giao diện Playwright UI (xem từng test step)
npm run e2e:ui

# Test trên React sau khi convert (cần dev server chạy ở port 5173)
npm run dev &
npm run e2e:react
```

### Capture / đo fidelity

```bash
# Bước 1: Capture baseline từ HTML gốc
npm run e2e -- --update-snapshots

# Bước 2: Build + chạy React, so sánh với baseline
npm run dev &
npm run e2e:react
# Xem báo cáo diff ảnh tại playwright-report/index.html
```

### Nhóm test — form_list (115 tests)

| Nhóm | Test |
|------|------|
| 1 — Page load & initial render | 10 |
| 2 — Buttons | 14 |
| 3 — Keyboard shortcuts | 13 |
| 4 — Filter & Search | 14 |
| 5 — Table interactions | 18 |
| 6 — Pagination | 11 |
| 7 — Modals (export, lookup user, lookup dossier) | 31 |
| 8 — Conditional columns | 4 |

### Nhóm test — form_detail (133 tests)

| Nhóm | Test |
|------|------|
| 1 — Page load & initial render | 6 |
| 2 — Buttons | 30 |
| 3 — Keyboard shortcuts | 16 |
| 4 — Form modes (new/view/edit) | 8 |
| 5 — Cascading fields & conditional UI | 10 |
| 6 — Tabs | 9 |
| 7 — Modals (delete, cancel, lookup, print, outside-hour) | 37 |
| 8 — Documents tab | 5 |
| 9 — Attach tab | 4 |
| 10 — History & Approval tabs | 5 |
| 11 — Status badge | 6 |

### Lưu ý khi fix test

- **`selectRow`** — helper click vào `td:nth-child(2)`, không click `td:first-child` (có `<a>` với `stopPropagation`).
- **filter-tags** — nằm bên trong `adv-filter-area` (ẩn theo mặc định). Phải mở panel trước khi check tag.
- **Pagination JS** — `pageSize`/`currentPage` là `let` biến, không phải `window.*`. Inject qua DOM: thêm option vào select rồi dispatch `change`.
- **`dialog-outside-hour`** — xuất hiện theo giờ thực (ngoài 08–17h). Visual test force-open bằng `page.evaluate`.
- **File upload** — `test.skip()` vì không automate được native OS dialog.

---

## 2. React + mock server — `e2e/`

Test React app chạy với Vite dev server (mock mode) và mock API server.

### Cấu trúc

```
e2e/
├── playwright.config.ts          # mock mode: port 3003
├── playwright.config.real.ts     # real backend: port 3000
└── tests/
    ├── helpers/
    │   └── auth.ts
    ├── mock/
    │   └── category-groups.spec.ts
    └── real/
        └── smoke.spec.ts
```

### Cài đặt

```bash
cd fe/e2e
npm install
npx playwright install chromium
```

### Chạy test mock

```bash
# Trong e2e/ — tự khởi động mock server (port 9090) + vite dev:mock (port 3003)
npm test

# Xem UI
npm run test:ui
```

### Chạy test real backend

Yêu cầu backend đang chạy (`quantri_be:8082`, `exp_be:8085`).

```bash
# Build dev + preview + host app
npm run test:real
```

---

## Quy trình thêm test mới

### Cho HTML baseline

1. Thêm `data-testid` vào HTML (nếu chưa có) — xem danh sách còn thiếu bên dưới.
2. Thêm constant vào `e2e/shared/selectors.ts` hoặc `selectors.detail.ts`.
3. Viết test trong `interactions.spec.ts` tương ứng, theo nhóm có sẵn.
4. Chạy `npm run e2e -- --grep "tên test"` để verify trước khi commit.

### data-testid còn thiếu trong HTML

| Element | File | Fallback hiện tại |
|---------|------|-------------------|
| `btn-dismiss-outside-hour` | form_detail.html | `#dialog-outside-hour .btn-default` |
| `dialog-session-expired` | form_detail.html | chưa có test |
| Attachment table tbody | form_detail.html | `.data-table tbody` |
| `page-buttons` (số trang) | form_list.html | `#page-buttons` |
| `adv-filter-count` (badge) | form_list.html | `#adv-filter-count` |
| Sort header `<th>` | form_list.html | `th[onclick*="FIELD"]` |

---

## Xem báo cáo

```bash
# Mở HTML report sau khi chạy
npx playwright show-report
```

Báo cáo JSON fidelity: `test-results/fidelity-report.json`
