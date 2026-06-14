# data-testid Plan: form_detail.html

## Tổng quan
- Cần thêm: 47 | Bỏ qua: 33 | field-spec.json: found

---

## Bảng thay đổi

### A — Header & Status

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 1 | `<span id="status-badge">` | `id="status-badge"` | `STATE_CODE` | `status-badge` | Badge trạng thái header |
| 2 | `<span onclick="...form_list.html">Danh sách hồ sơ...</span>` | `.breadcrumb span:first-child[onclick]` | — | `breadcrumb-link-list` | Link back về list |

### B — Tab navigation

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 3 | `<div id="tab-nav">` | `id="tab-nav"` | — | `tab-nav` | Container tab bar |
| 4 | `<button class="tab-btn active" onclick="switchTab('tab-general',...)">` | `button.tab-btn[onclick*="tab-general"]` | `tab-general` (field-spec.tabs[0].code) | `tab-general` | — |
| 5 | `<button class="tab-btn" data-tab-documents>` | `button[data-tab-documents]` | `tab-documents` (tabs[1].code) | `tab-documents` | — |
| 6 | `<button class="tab-btn" onclick="switchTab('tab-attach',...)">` | `button.tab-btn[onclick*="tab-attach"]` | `tab-attach` (tabs[2].code) | `tab-attach` | — |
| 7 | `<button class="tab-btn" onclick="switchTab('tab-history',...)">` | `button.tab-btn[onclick*="tab-history"]` | `tab-history` (tabs[3].code) | `tab-history` | Alt+H |
| 8 | `<button class="tab-btn" onclick="switchTab('tab-approval',...)">` | `button.tab-btn[onclick*="tab-approval"]` | `tab-approval` (tabs[4].code) | `tab-approval` | Alt+P |

### C — Tab pane containers

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 9  | `<div class="tab-pane active" id="tab-general">` | `id="tab-general"` | — | `pane-general` | — |
| 10 | `<div class="tab-pane" id="tab-documents">` | `id="tab-documents"` | — | `pane-documents` | — |
| 11 | `<div class="tab-pane" id="tab-attach">` | `id="tab-attach"` | — | `pane-attach` | — |
| 12 | `<div class="tab-pane" id="tab-history">` | `id="tab-history"` | — | `pane-history` | — |
| 13 | `<div class="tab-pane" id="tab-approval">` | `id="tab-approval"` | — | `pane-approval` | — |

### D — Documents grid (tab-documents)

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 14 | `<table id="doc-table">` | `id="doc-table"` | `tab-documents` | `doc-table` | — |
| 15 | `<tbody id="doc-tbody">` | `id="doc-tbody"` | — | `doc-tbody` | — |
| 16 | `<td id="doc-total">` | `id="doc-total"` | `PAYMENT_REQUEST_AMOUNT_VND` | `doc-total` | Tổng tiền VND footer |
| 17 | `<td id="doc-total-fx">` | `id="doc-total-fx"` | `PAYMENT_REQUEST_AMOUNT` | `doc-total-fx` | Tổng ngoại tệ footer |
| 18 | `<input type="hidden" id="doc-currency">` | `id="doc-currency"` | `CURRENCY_TYPE_CODE` | `doc-currency` | Hidden input loại tiền |

### E — History tab

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 19 | `<tbody id="history-tbody">` | `id="history-tbody"` | `tab-history` | `history-tbody` | — |

### F — Approval workflow (tab-approval)

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 20 | `<div class="workflow" id="approval-workflow">` | `id="approval-workflow"` | `tab-approval` | `approval-workflow` | Container |
| 21 | `<div id="step-maker">` | `id="step-maker"` | — | `step-maker` | Circle Maker |
| 22 | `<div id="step-checker">` | `id="step-checker"` | — | `step-checker` | Circle Checker |
| 23 | `<div id="step-approver">` | `id="step-approver"` | — | `step-approver` | Circle Approver |

### G — Error spans

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 24 | `<span class="error-msg" id="err-PROJECT_CODE">` | `id="err-PROJECT_CODE"` | `PROJECT_CODE` | `error-PROJECT_CODE` | Validation inline |

### H — Delete dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 25 | `<div id="dialog-delete-confirm">` | `id="dialog-delete-confirm"` | `deleteDialog.id` | `modal-delete-confirm` | Overlay container |
| 26 | `<div class="char-counter" id="delete-reason-counter">` | `id="delete-reason-counter"` | `DELETE_REASON` | `delete-reason-counter` | Char counter |

### I — Cancel confirm dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 27 | `<div id="dialog-cancel-confirm">` | `id="dialog-cancel-confirm"` | `cancelDialog.id` | `modal-cancel-confirm` | Overlay container |
| 28 | `<button onclick="...dialog-cancel-confirm.hidden=true">Tiếp tục chỉnh sửa</button>` | `#dialog-cancel-confirm button.btn-default` | `BTN_CONTINUE_EDIT` | `btn-continue-edit` | — |
| 29 | `<button onclick="window.location.href='form_list.html'">Xác nhận huỷ</button>` | `#dialog-cancel-confirm button.btn-primary` | `BTN_CONFIRM_CANCEL` | `btn-confirm-cancel` | — |

### J — Project Lookup dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 30 | `<div id="dialog-lookup-project">` | `id="dialog-lookup-project"` | `BTN_LOOKUP_PROJECT` | `modal-lookup-project` | Overlay |
| 31 | `<input id="lov-project-code">` | `id="lov-project-code"` | `PROJECT_CODE` | `lov-project-code` | — |
| 32 | `<input id="lov-project-name">` | `id="lov-project-name"` | `PROJECT_NAME` | `lov-project-name` | — |
| 33 | `<select id="lov-project-type">` | `id="lov-project-type"` | — | `lov-project-type` | — |
| 34 | `<input id="lov-segment6">` | `id="lov-segment6"` | `PROJECT_MANAGEMENT_CODE` | `lov-segment6` | — |
| 35 | `<tbody id="lov-tbody">` | `id="lov-tbody"` | — | `lov-tbody` | — |
| 36 | `<span id="lov-count">` | `id="lov-count"` | — | `lov-count` | Số kết quả |
| 37 | `<button onclick="closeLookup()">Đóng (Esc)</button>` | `#dialog-lookup-project button[onclick="closeLookup()"]` | — | `btn-close-lookup-project` | — |

### K — Duplicate warning dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 38 | `<div id="dialog-duplicate-warning">` | `id="dialog-duplicate-warning"` | `VAL-18` | `modal-duplicate-warning` | Overlay |
| 39 | `<button onclick="...hidden=true; location.href='form_list.html'">Huỷ</button>` | `#dialog-duplicate-warning button.btn-default` | — | `btn-cancel-duplicate` | — |
| 40 | `<button onclick="...hidden=true">Tiếp tục</button>` | `#dialog-duplicate-warning button.btn-primary` | — | `btn-continue-duplicate` | — |

### L — Print preview dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 41 | `<div id="dialog-print-preview">` | `id="dialog-print-preview"` | `BTN_PRINT` | `modal-print-preview` | Overlay |
| 42 | `<button onclick="document.getElementById('dialog-print-preview').hidden=true">×</button>` | `#dialog-print-preview .modal-header button[onclick]` | — | `btn-close-print-preview` | — |
| 43 | `<button onclick="window.print()">` | `#dialog-print-preview button[onclick="window.print()"]` | — | `btn-print-browser` | — |

### M — Concurrent edit dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 44 | `<div id="dialog-concurrent">` | `id="dialog-concurrent"` | `MSG-ERR-CONCURRENT` | `modal-concurrent` | Overlay |
| 45 | `<button onclick="window.location.href='form_list.html'">← Quay lại danh sách</button>` | `#dialog-concurrent button.btn-default` | — | `btn-back-concurrent` | — |
| 46 | `<button onclick="document.getElementById('dialog-concurrent').hidden=true">Thử lại</button>` | `#dialog-concurrent button.btn-primary` | — | `btn-retry-concurrent` | — |

### N — Outside hour dialog

| # | Element | Selector unique | field-spec code | data-testid | Ghi chú |
|---|---------|-----------------|-----------------|-------------|---------|
| 47 | `<div id="dialog-outside-hour">` | `id="dialog-outside-hour"` | `MSG-WRN-OUTSIDE-HOUR` | `modal-outside-hour` | Overlay |

---

## Elements bỏ qua

| Element | Lý do |
|---------|-------|
| `data-testid="btn-print"` (đã có) | Đã có |
| `data-testid="btn-edit"` (đã có) | Đã có |
| `data-testid="input-dossier-code"` (đã có) | Đã có |
| `data-testid="input-send-date"` (đã có) | Đã có |
| `data-testid="input-project-code"` (đã có) | Đã có |
| `data-testid="btn-lookup-project"` (đã có) | Đã có |
| `data-testid="input-project-name"` (đã có) | Đã có |
| `data-testid="input-project-specific-code"` (đã có) | Đã có |
| `data-testid="btn-lookup-spec"` (đã có) | Đã có |
| `data-testid="input-project-specific-name"` (đã có) | Đã có |
| `data-testid="input-project-management-code"` (đã có) | Đã có |
| `data-testid="btn-lookup-board"` (đã có) | Đã có |
| `data-testid="input-project-management-name"` (đã có) | Đã có |
| `data-testid="input-state-code"` (đã có) | Đã có |
| `data-testid="input-data-source-code"` (đã có) | Đã có |
| `data-testid="btn-add-doc"` (đã có) | Đã có |
| `data-testid="upload-zone-attachments"` (đã có) | Đã có |
| `data-testid="btn-upload"` (đã có) | Đã có |
| `data-testid="select-doc-type"` (đã có) | Đã có |
| `data-testid="input-note"` (đã có) | Đã có |
| `data-testid="btn-delete"` (đã có) | Đã có |
| `data-testid="btn-cancel"` (đã có) | Đã có |
| `data-testid="btn-back"` (đã có) | Đã có |
| `data-testid="btn-save-draft"` (đã có) | Đã có |
| `data-testid="btn-save"` (đã có) | Đã có |
| `data-testid="btn-save-edit"` (đã có) | Đã có |
| `data-testid="btn-submit"` (đã có) | Đã có |
| `data-testid="input-delete-reason"` (đã có) | Đã có |
| `data-testid="input-confirm-reviewed"` (đã có) | Đã có |
| `data-testid="input-deleted-by"` (đã có) | Đã có |
| `data-testid="input-deleted-date"` (đã có) | Đã có |
| `data-testid="btn-cancel-delete"` (đã có) | Đã có |
| `data-testid="btn-confirm-delete"` (đã có) | Đã có |
| `id="delete-record-id"` span | Text display, không cần test riêng |
| `id="delete-record-state"` span | Text display |
| `id="approval-detail"` div | Text mô tả, assert qua content |
| `id="step-maker-name"`, `id="step-checker-name"`, `id="step-approver-name"` | Small text labels |
| `id="line-1"`, `id="line-2"` | Visual connector, không tương tác |
| `id="concurrent-msg"` | Text display |
| `id="doc-new-notice"` | Info label, test qua visibility |
| Print template cells (`id="p-*"`) | Nội dung trong modal, assert qua parent modal |
| `id="dialog-session-expired"` | Edge case không trigger trong normal flow — skip |

---

## Thực thi
Sau khi review: `/html-apply file/req/01-inputs/layout/form_detail.html`
