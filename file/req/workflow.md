# Workflow: HTML → React Layout

4 bước, chạy tuần tự trên cùng 1 HTML file.

---

## Tổng quan

```
HTML file
  │
  ▼  (1) /html-analyze      → sinh .testid-plan.md (review trước)
  ▼  (2) /html-apply        → thêm data-testid vào HTML
  ▼  (3) /gen-ui-test       → sinh Playwright tests (chạy baseline trên HTML)
  ▼  (4) /html-to-react     → sinh .tsx + .css + route
         └── kiểm tra fidelity (chạy lại tests trên React)
```

---

## Bước 1 — Phân tích HTML, lập kế hoạch testid

```
/html-analyze <path/to/file.html>
```

**Sinh ra:** `file.testid-plan.md` — bảng liệt kê mọi element cần thêm `data-testid`.

**Việc cần làm:** mở file plan, review bảng, chỉnh sửa nếu cần → xác nhận trước khi qua bước 2.

---

## Bước 2 — Thêm data-testid vào HTML

```
/html-apply <path/to/file.html>
```

**Đọc plan từ bước 1, thêm `data-testid` vào HTML.** Không thay đổi gì khác.

**Báo cáo:** số testid đã thêm / bỏ qua / lỗi selector ambiguous (xử lý thủ công nếu có lỗi).

---

## Bước 3 — Sinh Playwright tests & capture baseline

```
/gen-ui-test <path/to/file.html>
```

**Sinh ra:**
```
tests/
  playwright.config.ts
  shared/selectors.ts
  shared/helpers.ts
  {tên-html}/
    interactions.spec.ts
    visual.spec.ts
```

**Chạy baseline trên HTML gốc** (xác nhận tests pass trước khi convert):
```bash
npx serve . -p 8080 &
BASE_URL=http://localhost:8080 npx playwright test --update-snapshots
```

---

## Bước 4 — Convert sang React

```
/html-to-react <path/to/file.html>
```

**Sinh ra:** `file.tsx` + `file.css` + `file.mock.ts` (nếu có inline data) + đăng ký route.

**Đo fidelity** — chạy lại đúng bộ tests trên React dev server:
```bash
npm run dev &
BASE_URL=http://localhost:5173 npx playwright test
```

Kết quả pass/fail là thước đo fidelity HTML → React.

---

## Checklist nhanh

- [ ] Bước 1: plan file đã review, không còn testid sai
- [ ] Bước 2: 0 selector ambiguous còn sót
- [ ] Bước 3: baseline pass 100% trên HTML gốc
- [ ] Bước 4: `npm run typecheck` không lỗi, fidelity tests pass ≥ 95%
