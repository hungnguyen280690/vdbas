# data-testid Plan: form_list.html

## Tổng quan
- Cần thêm: 52 | Bỏ qua: 16 | field-spec.json: found

---

## Bảng thay đổi

### A — Buttons (action bar)

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 1 | `<button id="btn-adv-toggle">` | `id="btn-adv-toggle"` | — | `btn-adv-toggle` | Toggle advanced filter |
| 2 | `<button onclick="saveFilter()">` | `button[onclick="saveFilter()"]` | — | `btn-save-filter` | Lưu bộ lọc |
| 3 | `<button id="btn-load-filter">` | `id="btn-load-filter"` | — | `btn-load-filter` | Áp dụng bộ lọc đã lưu |

### B — Quick filter inputs

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 4 | `<input id="filter-dossier-code">` | `id="filter-dossier-code"` | `DOSSIER_CODE` (listFilter.quickFilter) | `filter-dossier-code` | — |
| 5 | `<select id="filter-data-source-code">` | `id="filter-data-source-code"` | `DATA_SOURCE_CODE` (listFilter.quickFilter) | `filter-data-source-code` | — |
| 6 | `<button class="btn-lookup" onclick="openDossierLookup()">` | `button.btn-lookup[onclick="openDossierLookup()"]` | `BTN_LOOKUP` | `btn-lookup-dossier-code` | F4 — tra cứu hồ sơ |

### C — Advanced filter area & inputs

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 7  | `<div id="adv-filter-area">` | `id="adv-filter-area"` | — | `adv-filter-area` | Container toggle |
| 8  | `<select id="filter-date-type">` | `id="filter-date-type"` | `DATE_FIELD` (listFilter.advancedFilter) | `filter-date-type` | — |
| 9  | `<input id="filter-from-date">` | `id="filter-from-date"` | `FROM_DATE` | `filter-from-date` | — |
| 10 | `<input id="filter-to-date">` | `id="filter-to-date"` | `TO_DATE` | `filter-to-date` | — |
| 11 | `<input id="filter-project-code">` | `id="filter-project-code"` | `PROJECT_CODE` (listFilter.advancedFilter) | `filter-project-code` | — |
| 12 | `<input id="filter-created-by">` | `id="filter-created-by"` | `CREATED_BY` | `filter-created-by` | — |
| 13 | `<input id="filter-checked-by">` | `id="filter-checked-by"` | `CHECKED_BY` | `filter-checked-by` | — |
| 14 | `<input id="filter-approved-by">` | `id="filter-approved-by"` | `APPROVED_BY` | `filter-approved-by` | — |
| 15 | `<button onclick="openUserLookup('filter-created-by',...)">` | `button.btn-lookup[onclick*="filter-created-by"]` | `BTN_LOOKUP` | `btn-lookup-created-by` | F4 — tra cứu người lập |
| 16 | `<button onclick="openUserLookup('filter-checked-by',...)">` | `button.btn-lookup[onclick*="filter-checked-by"]` | `BTN_LOOKUP` | `btn-lookup-checked-by` | F4 — tra cứu người KS |
| 17 | `<button onclick="openUserLookup('filter-approved-by',...)">` | `button.btn-lookup[onclick*="filter-approved-by"]` | `BTN_LOOKUP` | `btn-lookup-approved-by` | F4 — tra cứu người PD |
| 18 | `<button class="btn-lookup" title="F4">` (project-code row) | `#adv-filter-area .btn-lookup[title="F4"]` | `BTN_LOOKUP` | `btn-lookup-project-code` | F4 — tra cứu dự án |
| 19 | `<button onclick="resetAdvFilter()">` | `button[onclick="resetAdvFilter()"]` | `BTN_RESET_FILTER` | `btn-reset-adv-filter` | Xóa bộ lọc nâng cao |
| 20 | `<button class="btn btn-primary btn-sm" onclick="onFilter()">` (trong adv-filter-area) | `#adv-filter-area button.btn-primary[onclick="onFilter()"]` | `BTN_SEARCH` | `btn-search-adv` | Tìm kiếm trong advanced |
| 21 | `<div id="filter-tags">` | `id="filter-tags"` | — | `filter-tags` | Container filter chips |

### D — Stats bar

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 22 | `<div id="stats-bar">` | `id="stats-bar"` | `statsBar.id` | `stats-bar` | Container stats |
| 23 | `<span id="stat-total">` | `id="stat-total"` | `STAT_TOTAL` | `stat-total` | — |
| 24 | `<span id="stat-draft">` | `id="stat-draft"` | `STAT_DRAFT` | `stat-draft` | — |
| 25 | `<span id="stat-pending-check">` | `id="stat-pending-check"` | `STAT_PENDING_CHECK` | `stat-pending-check` | — |
| 26 | `<span id="stat-pending-approve">` | `id="stat-pending-approve"` | `STAT_PENDING_APPROVE` | `stat-pending-approve` | — |
| 27 | `<span id="stat-approved">` | `id="stat-approved"` | `STAT_APPROVED` | `stat-approved` | — |
| 28 | `<span id="stat-rejected">` | `id="stat-rejected"` | `STAT_REJECTED` | `stat-rejected` | — |
| 29 | `<span id="stat-total-vnd">` | `id="stat-total-vnd"` | `STAT_TOTAL_VND` | `stat-total-vnd` | — |

### E — Table & footer

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 30 | `<table id="list-table">` | `id="list-table"` | `grid` | `list-table` | — |
| 31 | `<select id="page-size-select">` | `id="page-size-select"` | `grid.pageSize` | `page-size-select` | Số bản ghi/trang |
| 32 | `<span id="footer-count">` | `id="footer-count"` | — | `footer-count` | Số hồ sơ ở footer |
| 33 | `<td id="footer-doc-total">` | `id="footer-doc-total"` | — | `footer-doc-total` | Tổng số CT ở footer |
| 34 | `<td id="footer-vnd-total">` | `id="footer-vnd-total"` | — | `footer-vnd-total` | Tổng tiền VND ở footer |

### F — Dialog: User Lookup

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 35 | `<div id="dialog-lookup-user">` | `id="dialog-lookup-user"` | — | `modal-lookup-user` | Overlay container |
| 36 | `<input id="lov-user-name">` | `id="lov-user-name"` | — | `lov-user-name` | Tìm theo tên/username |
| 37 | `<select id="lov-user-role">` | `id="lov-user-role"` | — | `lov-user-role` | Lọc theo vai trò |
| 38 | `<tbody id="lov-user-tbody">` | `id="lov-user-tbody"` | — | `lov-user-tbody` | Danh sách kết quả |
| 39 | `<span id="lov-user-count">` | `id="lov-user-count"` | — | `lov-user-count` | Số kết quả |
| 40 | `<button onclick="closeUserLookup()">Đóng (Esc)</button>` | `#dialog-lookup-user button[onclick="closeUserLookup()"]` | — | `btn-close-lookup-user` | — |

### G — Dialog: Dossier Lookup

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 41 | `<div id="dialog-lookup-dossier">` | `id="dialog-lookup-dossier"` | — | `modal-lookup-dossier` | Overlay container |
| 42 | `<input id="lov-dossier-code">` | `id="lov-dossier-code"` | — | `lov-dossier-code` | — |
| 43 | `<input id="lov-dossier-project">` | `id="lov-dossier-project"` | — | `lov-dossier-project` | — |
| 44 | `<select id="lov-dossier-state">` | `id="lov-dossier-state"` | — | `lov-dossier-state` | — |
| 45 | `<tbody id="lov-dossier-tbody">` | `id="lov-dossier-tbody"` | — | `lov-dossier-tbody` | — |
| 46 | `<span id="lov-dossier-count">` | `id="lov-dossier-count"` | — | `lov-dossier-count` | — |
| 47 | `<button onclick="closeDossierLookup()">Đóng (Esc)</button>` | `#dialog-lookup-dossier button[onclick="closeDossierLookup()"]` | — | `btn-close-lookup-dossier` | — |

### H — Dialog: Export

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 48 | `<div id="dialog-export">` | `id="dialog-export"` | `BTN_EXPORT` | `modal-export` | Overlay container |
| 49 | `<button onclick="doExport('excel')">` | `button[onclick="doExport('excel')"]` | `BTN_EXPORT` | `btn-export-excel` | — |
| 50 | `<button onclick="doExport('pdf')">` | `button[onclick="doExport('pdf')"]` | `BTN_EXPORT` | `btn-export-pdf` | — |
| 51 | `<button onclick="doExport('csv')">` | `button[onclick="doExport('csv')"]` | `BTN_EXPORT` | `btn-export-csv` | — |
| 52 | `<button onclick="...dialog-export.hidden=true">Đóng</button>` | `#dialog-export .modal-footer button.btn-default` | — | `btn-close-export` | — |

---

## Elements bỏ qua

| Element | Lý do |
|---------|-------|
| `data-testid="btn-export"` (đã có) | Đã có |
| `data-testid="btn-new"` (đã có) | Đã có |
| `data-testid="search-input"` (đã có) | Đã có |
| `data-testid="filter-state-code"` (đã có) | Đã có |
| `data-testid="btn-search"` (đã có) | Đã có |
| `data-testid="btn-reset-filter"` (đã có) | Đã có |
| `data-testid="list-tbody"` (đã có) | Đã có |
| `data-testid="pagination-info"` (đã có) | Đã có |
| `data-testid="pagination-first"` (đã có) | Đã có |
| `data-testid="pagination-prev"` (đã có) | Đã có |
| `data-testid="pagination-next"` (đã có) | Đã có |
| `data-testid="pagination-last"` (đã có) | Đã có |
| `data-testid="row-${r.id}"` (JS dynamic) | Dynamic trong JS render, đã có |
| `data-testid="btn-view-${r.id}"` (JS dynamic) | Dynamic trong JS render, đã có |
| `data-testid="btn-edit-${r.id}"` (JS dynamic) | Dynamic trong JS render, đã có |
| `data-testid="btn-delete-${r.id}"` (JS dynamic) | Dynamic trong JS render, đã có |
| `<span id="adv-filter-count">` | Internal UI badge, không cần test trực tiếp |
| `<span id="page-buttons">` | Wrapper động cho page number buttons |
| `<span id="user-lookup-title">` | Display label, không tương tác |
| `<span id="export-count">` | Inline count, không cần test riêng |

---

## Thực thi
Sau khi review: `/html-apply file/req/01-inputs/layout/form_list.html`
