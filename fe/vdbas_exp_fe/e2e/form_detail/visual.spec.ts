/**
 * visual.spec.ts — form_detail.html
 *
 * Screenshot baseline tests.
 * Run with --update-snapshots the first time against the HTML prototype:
 *   BASE_URL=http://localhost:8080 npx playwright test tests/form_detail/visual.spec.ts --update-snapshots
 *
 * Then run without flag against React to measure fidelity:
 *   BASE_URL=http://localhost:5173 npx playwright test tests/form_detail/visual.spec.ts
 */

import { test, expect } from '@playwright/test'
import {
  openDetail,
  openDetailDismissDialogs,
  openDeleteDialog,
  fillDeleteForm,
  dismissOutsideHourIfVisible,
  dismissConcurrentIfVisible,
} from '../shared/helpers.detail'
import { DSEL } from '../shared/selectors.detail'

const SNAP_OPTS = { maxDiffPixelRatio: 0.02 }
const SNAP_OPTS_LOOSE = { maxDiffPixelRatio: 0.04 }

// ─────────────────────────────────────────────────────────────
// mode=new
// ─────────────────────────────────────────────────────────────
test.describe('Visual — mode=new', () => {
  test('full page screenshot — mode=new', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page).toHaveScreenshot('form-detail-new-full.png', {
      ...SNAP_OPTS,
      fullPage: true,
    })
  })

  test('page-header — mode=new', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator('.page-header')).toHaveScreenshot('form-detail-new-header.png', SNAP_OPTS)
  })

  test('form Thông tin chung — mode=new', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.PANE_GENERAL)).toHaveScreenshot('form-detail-new-pane-general.png', SNAP_OPTS)
  })

  test('action-bar — mode=new', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator('.action-bar')).toHaveScreenshot('form-detail-new-action-bar.png', SNAP_OPTS)
  })

  test('tab-nav — mode=new (tab documents hidden)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.TAB_NAV)).toHaveScreenshot('form-detail-new-tab-nav.png', SNAP_OPTS)
  })
})

// ─────────────────────────────────────────────────────────────
// mode=view
// ─────────────────────────────────────────────────────────────
test.describe('Visual — mode=view REC-001 (DRAFT, Citizen)', () => {
  test('full page screenshot — mode=view REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page).toHaveScreenshot('form-detail-view-rec001-full.png', {
      ...SNAP_OPTS,
      fullPage: true,
    })
  })

  test('page-header — mode=view REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator('.page-header')).toHaveScreenshot('form-detail-view-header.png', SNAP_OPTS)
  })

  test('status-badge DRAFT', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.STATUS_BADGE)).toHaveScreenshot('status-badge-draft.png', SNAP_OPTS)
  })

  test('pane-general — mode=view REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.PANE_GENERAL)).toHaveScreenshot('form-detail-view-pane-general.png', SNAP_OPTS)
  })

  test('tab-nav — mode=view (all tabs visible)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.TAB_NAV)).toHaveScreenshot('form-detail-view-tab-nav.png', SNAP_OPTS)
  })

  test('pane-documents — mode=view REC-001 with 2 docs', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.PANE_DOCUMENTS)).toHaveScreenshot('form-detail-view-pane-documents.png', SNAP_OPTS)
  })

  test('pane-history — mode=view REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_HISTORY).click()
    await expect(page.locator(DSEL.PANE_HISTORY)).toHaveScreenshot('form-detail-view-pane-history.png', SNAP_OPTS)
  })

  test('pane-approval — mode=view REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveScreenshot('form-detail-view-pane-approval-draft.png', SNAP_OPTS)
  })

  test('action-bar — mode=view', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator('.action-bar')).toHaveScreenshot('form-detail-view-action-bar.png', SNAP_OPTS)
  })
})

test.describe('Visual — mode=view Military (REC-002)', () => {
  test('pane-general shows Military fields', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-002' })
    await expect(page.locator(DSEL.PANE_GENERAL)).toHaveScreenshot('form-detail-view-pane-general-military.png', SNAP_OPTS)
  })

  test('status-badge PENDING_CHECK', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-002' })
    await expect(page.locator(DSEL.STATUS_BADGE)).toHaveScreenshot('status-badge-pending-check.png', SNAP_OPTS)
  })
})

test.describe('Visual — mode=view APPROVED (REC-004)', () => {
  test('pane-approval — all steps done', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-004' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveScreenshot('form-detail-view-pane-approval-approved.png', SNAP_OPTS)
  })

  test('status-badge APPROVED', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-004' })
    await expect(page.locator(DSEL.STATUS_BADGE)).toHaveScreenshot('status-badge-approved.png', SNAP_OPTS)
  })
})

test.describe('Visual — mode=view CHECK_REJECTED (REC-005)', () => {
  test('pane-approval shows rejection reason', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-005' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveScreenshot('form-detail-view-pane-approval-check-rejected.png', SNAP_OPTS)
  })
})

// ─────────────────────────────────────────────────────────────
// mode=edit
// ─────────────────────────────────────────────────────────────
test.describe('Visual — mode=edit REC-001', () => {
  test('full page screenshot — mode=edit REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await expect(page).toHaveScreenshot('form-detail-edit-rec001-full.png', {
      ...SNAP_OPTS,
      fullPage: true,
    })
  })

  test('action-bar — mode=edit (btn-save-edit + btn-submit)', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await expect(page.locator('.action-bar')).toHaveScreenshot('form-detail-edit-action-bar.png', SNAP_OPTS)
  })

  test('pane-documents — mode=edit shows btn-add-doc', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.PANE_DOCUMENTS)).toHaveScreenshot('form-detail-edit-pane-documents.png', SNAP_OPTS)
  })
})

// ─────────────────────────────────────────────────────────────
// Modals visual
// ─────────────────────────────────────────────────────────────
test.describe('Visual — Modals', () => {
  test('modal-delete-confirm — empty state', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await openDeleteDialog(page)
    await expect(page.locator(DSEL.MODAL_DELETE_CONFIRM)).toHaveScreenshot(
      'modal-delete-confirm-empty.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-delete-confirm — filled + enabled state', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await openDeleteDialog(page)
    await fillDeleteForm(page)
    await expect(page.locator(DSEL.MODAL_DELETE_CONFIRM)).toHaveScreenshot(
      'modal-delete-confirm-filled.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-cancel-confirm', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.fill(DSEL.INPUT_SEND_DATE, '01/01/2026')
    await page.locator(DSEL.BTN_CANCEL).click()
    await expect(page.locator(DSEL.MODAL_CANCEL_CONFIRM)).toHaveScreenshot(
      'modal-cancel-confirm.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-lookup-project — default (all results)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await expect(page.locator(DSEL.MODAL_LOOKUP_PROJECT)).toHaveScreenshot(
      'modal-lookup-project-default.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-lookup-project — filtered Military', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.locator(DSEL.LOV_PROJECT_TYPE).selectOption('Military')
    await expect(page.locator(DSEL.MODAL_LOOKUP_PROJECT)).toHaveScreenshot(
      'modal-lookup-project-military.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-print-preview — REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expect(page.locator(DSEL.MODAL_PRINT_PREVIEW)).toHaveScreenshot(
      'modal-print-preview-rec001.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-outside-hour', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await page.evaluate(() => {
      const el = document.getElementById('dialog-outside-hour')
      if (el) el.hidden = false
    })
    await expect(page.locator(DSEL.MODAL_OUTSIDE_HOUR)).toHaveScreenshot(
      'modal-outside-hour.png', SNAP_OPTS_LOOSE
    )
  })

  test('modal-duplicate-warning', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    // Fill project + board to trigger duplicate (REC-001 + REC-007 both DRAFT with same codes)
    await page.locator(DSEL.INPUT_PROJECT_CODE).fill('7122155')
    await page.locator(DSEL.INPUT_PROJECT_CODE).dispatchEvent('input')
    await page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE).fill('3029123')
    await page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE).dispatchEvent('input')
    await expect(page.locator(DSEL.MODAL_DUPLICATE_WARNING)).toHaveScreenshot(
      'modal-duplicate-warning.png', SNAP_OPTS_LOOSE
    )
  })
})

// ─────────────────────────────────────────────────────────────
// Attach tab visual
// ─────────────────────────────────────────────────────────────
test.describe('Visual — Attach tab', () => {
  test('pane-attach — mode=new (upload zone visible)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.PANE_ATTACH)).toHaveScreenshot(
      'form-detail-new-pane-attach.png', SNAP_OPTS
    )
  })

  test('pane-attach — mode=view (upload zone hidden)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.PANE_ATTACH)).toHaveScreenshot(
      'form-detail-view-pane-attach.png', SNAP_OPTS
    )
  })
})
