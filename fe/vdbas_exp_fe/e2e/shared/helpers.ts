import { Page, expect } from '@playwright/test'
import { SEL } from './selectors'

/** Navigate to the page and wait for DOM + initial table render */
export async function openPage(page: Page, path = '/form_list.html') {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
  // Wait until the table has rendered at least one row (sample data loaded)
  await page.waitForFunction(() => {
    const tbody = document.getElementById('list-tbody')
    return tbody !== null && tbody.children.length > 0
  })
}

/** Click a row (outside the actions column) to select it */
export async function selectRow(page: Page, rowId: string) {
  // td:first-child has an <a> with stopPropagation — click 2nd cell instead
  await page.locator(`[data-testid="row-${rowId}"] td:nth-child(2)`).click()
}

/** Assert a modal is visible */
export async function expectModalOpen(page: Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible()
}

/** Assert a modal is hidden */
export async function expectModalClosed(page: Page, testId: string) {
  // Modals use the `hidden` attribute; Playwright's toBeHidden() covers both
  // display:none and the HTML hidden attribute.
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeHidden()
}

/** Open the page and dismiss any alert dialogs automatically */
export async function openPageWithAlertDismiss(page: Page, path = '/form_list.html') {
  page.on('dialog', dialog => dialog.dismiss())
  await openPage(page, path)
}

/** Accept all window.confirm / window.alert dialogs */
export async function acceptAllDialogs(page: Page) {
  page.on('dialog', dialog => dialog.accept())
}

/** Wait for the table body to contain at least `minRows` rows */
export async function waitForTableRows(page: Page, minRows = 1) {
  await page.waitForFunction(
    (min: number) => {
      const tbody = document.getElementById('list-tbody')
      if (!tbody) return false
      // exclude the empty-state row (single cell spanning all cols)
      const dataRows = Array.from(tbody.querySelectorAll('tr')).filter(
        tr => tr.querySelectorAll('td').length > 2
      )
      return dataRows.length >= min
    },
    minRows
  )
}

/** Return the text content of stat-total */
export async function getStatTotal(page: Page): Promise<number> {
  const text = await page.locator(SEL.STAT_TOTAL).textContent()
  return parseInt(text ?? '0', 10)
}

/** Check all table rows count (rendered in tbody, excluding empty-state) */
export async function getRenderedRowCount(page: Page): Promise<number> {
  return await page.locator(`${SEL.LIST_TBODY} tr`).evaluateAll(rows =>
    rows.filter(r => r.querySelectorAll('td').length > 2).length
  )
}
