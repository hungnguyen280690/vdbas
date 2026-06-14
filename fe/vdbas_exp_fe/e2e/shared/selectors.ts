/**
 * Selectors for form_list.html (CHI.CAPEX_DOSSIER — Danh sách hồ sơ Chi đầu tư)
 * All data-testid attributes extracted from the HTML source.
 */
export const SEL = {
  // ── Page Header Buttons ─────────────────────────────────────
  BTN_EXPORT:               '[data-testid="btn-export"]',
  BTN_NEW:                  '[data-testid="btn-new"]',

  // ── Quick Filter Inputs ─────────────────────────────────────
  SEARCH_INPUT:             '[data-testid="search-input"]',
  FILTER_STATE_CODE:        '[data-testid="filter-state-code"]',
  FILTER_DOSSIER_CODE:      '[data-testid="filter-dossier-code"]',
  BTN_LOOKUP_DOSSIER_CODE:  '[data-testid="btn-lookup-dossier-code"]',
  FILTER_DATA_SOURCE_CODE:  '[data-testid="filter-data-source-code"]',
  BTN_ADV_TOGGLE:           '[data-testid="btn-adv-toggle"]',
  BTN_SEARCH:               '[data-testid="btn-search"]',
  BTN_RESET_FILTER:         '[data-testid="btn-reset-filter"]',
  BTN_SAVE_FILTER:          '[data-testid="btn-save-filter"]',
  BTN_LOAD_FILTER:          '[data-testid="btn-load-filter"]',

  // ── Advanced Filter Panel ────────────────────────────────────
  ADV_FILTER_AREA:          '[data-testid="adv-filter-area"]',
  FILTER_DATE_TYPE:         '[data-testid="filter-date-type"]',
  FILTER_FROM_DATE:         '[data-testid="filter-from-date"]',
  FILTER_TO_DATE:           '[data-testid="filter-to-date"]',
  FILTER_PROJECT_CODE:      '[data-testid="filter-project-code"]',
  BTN_LOOKUP_PROJECT_CODE:  '[data-testid="btn-lookup-project-code"]',
  FILTER_CREATED_BY:        '[data-testid="filter-created-by"]',
  BTN_LOOKUP_CREATED_BY:    '[data-testid="btn-lookup-created-by"]',
  FILTER_CHECKED_BY:        '[data-testid="filter-checked-by"]',
  BTN_LOOKUP_CHECKED_BY:    '[data-testid="btn-lookup-checked-by"]',
  FILTER_APPROVED_BY:       '[data-testid="filter-approved-by"]',
  BTN_LOOKUP_APPROVED_BY:   '[data-testid="btn-lookup-approved-by"]',
  BTN_RESET_ADV_FILTER:     '[data-testid="btn-reset-adv-filter"]',
  BTN_SEARCH_ADV:           '[data-testid="btn-search-adv"]',
  FILTER_TAGS:              '[data-testid="filter-tags"]',

  // ── Stats Bar ───────────────────────────────────────────────
  STATS_BAR:                '[data-testid="stats-bar"]',
  STAT_TOTAL:               '[data-testid="stat-total"]',
  STAT_DRAFT:               '[data-testid="stat-draft"]',
  STAT_PENDING_CHECK:       '[data-testid="stat-pending-check"]',
  STAT_PENDING_APPROVE:     '[data-testid="stat-pending-approve"]',
  STAT_APPROVED:            '[data-testid="stat-approved"]',
  STAT_REJECTED:            '[data-testid="stat-rejected"]',
  STAT_TOTAL_VND:           '[data-testid="stat-total-vnd"]',

  // ── Table ───────────────────────────────────────────────────
  PAGE_SIZE_SELECT:         '[data-testid="page-size-select"]',
  LIST_TABLE:               '[data-testid="list-table"]',
  LIST_TBODY:               '[data-testid="list-tbody"]',
  FOOTER_COUNT:             '[data-testid="footer-count"]',
  FOOTER_DOC_TOTAL:         '[data-testid="footer-doc-total"]',
  FOOTER_VND_TOTAL:         '[data-testid="footer-vnd-total"]',

  // ── Pagination ──────────────────────────────────────────────
  PAGINATION_INFO:          '[data-testid="pagination-info"]',
  PAGINATION_FIRST:         '[data-testid="pagination-first"]',
  PAGINATION_PREV:          '[data-testid="pagination-prev"]',
  PAGINATION_NEXT:          '[data-testid="pagination-next"]',
  PAGINATION_LAST:          '[data-testid="pagination-last"]',

  // ── Per-row action buttons (dynamic — use helper rowBtn()) ──
  // Usage: SEL.rowBtn('REC-001', 'view') => '[data-testid="btn-view-REC-001"]'
  rowBtn: (id: string, action: 'view' | 'edit' | 'delete') =>
    `[data-testid="btn-${action}-${id}"]`,
  rowEl: (id: string) => `[data-testid="row-${id}"]`,

  // ── Modal — User Lookup ─────────────────────────────────────
  MODAL_LOOKUP_USER:        '[data-testid="modal-lookup-user"]',
  LOV_USER_NAME:            '[data-testid="lov-user-name"]',
  LOV_USER_ROLE:            '[data-testid="lov-user-role"]',
  LOV_USER_TBODY:           '[data-testid="lov-user-tbody"]',
  LOV_USER_COUNT:           '[data-testid="lov-user-count"]',
  BTN_CLOSE_LOOKUP_USER:    '[data-testid="btn-close-lookup-user"]',

  // ── Modal — Dossier Lookup ──────────────────────────────────
  MODAL_LOOKUP_DOSSIER:     '[data-testid="modal-lookup-dossier"]',
  LOV_DOSSIER_CODE:         '[data-testid="lov-dossier-code"]',
  LOV_DOSSIER_PROJECT:      '[data-testid="lov-dossier-project"]',
  LOV_DOSSIER_STATE:        '[data-testid="lov-dossier-state"]',
  LOV_DOSSIER_TBODY:        '[data-testid="lov-dossier-tbody"]',
  LOV_DOSSIER_COUNT:        '[data-testid="lov-dossier-count"]',
  BTN_CLOSE_LOOKUP_DOSSIER: '[data-testid="btn-close-lookup-dossier"]',

  // ── Modal — Export ──────────────────────────────────────────
  MODAL_EXPORT:             '[data-testid="modal-export"]',
  BTN_EXPORT_EXCEL:         '[data-testid="btn-export-excel"]',
  BTN_EXPORT_PDF:           '[data-testid="btn-export-pdf"]',
  BTN_EXPORT_CSV:           '[data-testid="btn-export-csv"]',
  BTN_CLOSE_EXPORT:         '[data-testid="btn-close-export"]',

  // ── TODO: missing data-testid in HTML ──────────────────────
  // These elements exist but lack data-testid — using fallback selectors:
  // - #page-buttons (rendered page number buttons inside pagination)     → '#page-buttons'
  // - .row-selected (selected row highlight class)                       → 'tr.row-selected'
  // - #adv-filter-count (badge inside btn-adv-toggle)                    → '#adv-filter-count'
  // - #export-count (count shown inside export dialog)                   → '#export-count'
  // - Individual table <th> sort headers                                 → 'th[onclick]'
  // - #saved-filter-group (wrapper that hides btn-load-filter)           → '#saved-filter-group'
} as const
