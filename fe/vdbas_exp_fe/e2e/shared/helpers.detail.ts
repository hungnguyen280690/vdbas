import { Page, expect } from '@playwright/test'
import { DSEL } from './selectors.detail'

/**
 * Helpers — form_detail.html
 * Reusable page actions for detail form tests.
 */

/** Open form_detail.html with URL params and wait for DOM ready */
export async function openDetail(
  page: Page,
  params: { mode?: 'new' | 'view' | 'edit'; id?: string; action?: string } = {}
) {
  const qs = new URLSearchParams()
  if (params.mode)   qs.set('mode', params.mode)
  if (params.id)     qs.set('id', params.id)
  if (params.action) qs.set('action', params.action)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  await page.goto(`/form_detail.html${query}`)
  await page.waitForLoadState('domcontentloaded')
  // Dismiss any time-based dialogs (outside-hour, concurrent) automatically
  // so tests that don't care about them stay green.
}

/** Open detail and suppress all alert / confirm / prompt dialogs */
export async function openDetailDismissDialogs(
  page: Page,
  params: { mode?: 'new' | 'view' | 'edit'; id?: string; action?: string } = {}
) {
  page.on('dialog', d => d.dismiss())
  await openDetail(page, params)
}

/** Open detail and accept all alert / confirm / prompt dialogs */
export async function openDetailAcceptDialogs(
  page: Page,
  params: { mode?: 'new' | 'view' | 'edit'; id?: string; action?: string } = {}
) {
  page.on('dialog', d => d.accept())
  await openDetail(page, params)
}

/** Assert a modal (identified by data-testid) is currently visible */
export async function expectModalOpen(page: Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible()
}

/** Assert a modal (identified by data-testid) is currently hidden */
export async function expectModalClosed(page: Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeHidden()
}

/** Click tab button and assert the correct pane becomes active */
export async function switchTab(page: Page, tabTestId: string, paneTestId: string) {
  await page.locator(`[data-testid="${tabTestId}"]`).click()
  await expect(page.locator(`[data-testid="${paneTestId}"]`)).toHaveClass(/active/)
}

/** Fill PROJECT_CODE and wait for cascade auto-fill of PROJECT_NAME */
export async function fillProjectCode(page: Page, projectCode: string) {
  await page.fill(DSEL.INPUT_PROJECT_CODE, projectCode)
  // Trigger oninput cascade
  await page.locator(DSEL.INPUT_PROJECT_CODE).dispatchEvent('input')
}

/** Fill PROJECT_MANAGEMENT_CODE and wait for cascade auto-fill */
export async function fillBoardCode(page: Page, boardCode: string) {
  await page.fill(DSEL.INPUT_PROJECT_MANAGEMENT_CODE, boardCode)
  await page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE).dispatchEvent('input')
}

/** Open delete dialog via btn-delete click (only available in view mode, DRAFT) */
export async function openDeleteDialog(page: Page) {
  await page.locator(DSEL.BTN_DELETE).click()
  await expectModalOpen(page, 'modal-delete-confirm')
}

/** Fill delete form to satisfy the enable condition (reason ≥ 10 chars + checkbox) */
export async function fillDeleteForm(page: Page, reason = 'Lý do xoá hợp lệ') {
  await page.fill(DSEL.INPUT_DELETE_REASON, reason)
  await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
  await page.locator(DSEL.INPUT_CONFIRM_REVIEWED).check()
  await page.locator(DSEL.INPUT_CONFIRM_REVIEWED).dispatchEvent('change')
}

/** Open lookup dialog via button click, wait for modal visible */
export async function openLookupDialog(page: Page, btnTestId: string) {
  await page.locator(`[data-testid="${btnTestId}"]`).click()
  await expectModalOpen(page, 'modal-lookup-project')
}

/** Dismiss the outside-hour warning if it appears (time-based) */
export async function dismissOutsideHourIfVisible(page: Page) {
  const modal = page.locator(DSEL.MODAL_OUTSIDE_HOUR)
  if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
    // TODO: add data-testid="btn-dismiss-outside-hour" to HTML
    await page.locator('#dialog-outside-hour .btn-default').click()
  }
}

/** Dismiss concurrent edit dialog if it appears (random ~30% for Military DRAFT) */
export async function dismissConcurrentIfVisible(page: Page) {
  const modal = page.locator(DSEL.MODAL_CONCURRENT)
  if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.locator(DSEL.BTN_RETRY_CONCURRENT).click()
  }
}
