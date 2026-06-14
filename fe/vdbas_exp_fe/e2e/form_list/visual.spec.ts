/**
 * Visual / screenshot baseline tests for form_list.html
 * CHI.CAPEX_DOSSIER — Danh sách hồ sơ Chi đầu tư
 *
 * Capture baseline:
 *   npx serve . -p 8080 &
 *   BASE_URL=http://localhost:8080 npx playwright test tests/form_list/visual.spec.ts --update-snapshots
 *
 * Compare against React:
 *   BASE_URL=http://localhost:5173 npx playwright test tests/form_list/visual.spec.ts
 */
import { test, expect } from '@playwright/test'
import { openPage } from '../shared/helpers'
import { SEL } from '../shared/selectors'

test.describe('Visual — form_list full page', () => {
  test('visual — full page screenshot', async ({ page }) => {
    await openPage(page)
    await expect(page).toHaveScreenshot('form-list-full.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    })
  })

  test('visual — page header (title + breadcrumb + buttons)', async ({ page }) => {
    await openPage(page)
    const header = page.locator('.page-header')
    await expect(header).toHaveScreenshot('page-header.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — filter card (quick filters)', async ({ page }) => {
    await openPage(page)
    // Capture only the filter card body (quick search row)
    const filterCard = page.locator('.card').first()
    await expect(filterCard).toHaveScreenshot('filter-card.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — advanced filter panel (expanded)', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await expect(page.locator(SEL.ADV_FILTER_AREA)).toBeVisible()
    const advPanel = page.locator(SEL.ADV_FILTER_AREA)
    await expect(advPanel).toHaveScreenshot('adv-filter-panel.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — stats bar', async ({ page }) => {
    await openPage(page)
    const statsBar = page.locator(SEL.STATS_BAR)
    await expect(statsBar).toHaveScreenshot('stats-bar.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — data table (header + 7 rows)', async ({ page }) => {
    await openPage(page)
    const table = page.locator(SEL.LIST_TABLE)
    await expect(table).toHaveScreenshot('data-table.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — table row selected state', async ({ page }) => {
    await openPage(page)
    await page.locator(`${SEL.rowEl('REC-001')} td:first-child`).click()
    const table = page.locator(SEL.LIST_TABLE)
    await expect(table).toHaveScreenshot('data-table-row-selected.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — pagination row', async ({ page }) => {
    await openPage(page)
    const pagination = page.locator('.pagination-row')
    await expect(pagination).toHaveScreenshot('pagination-row.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — empty state (no results)', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'NONEXISTENT-XYZ-99999')
    await page.waitForFunction(() => {
      const tbody = document.getElementById('list-tbody')
      return tbody?.textContent?.includes('Không có hồ sơ nào') ?? false
    })
    const table = page.locator(SEL.LIST_TABLE)
    await expect(table).toHaveScreenshot('data-table-empty.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — filter tags (after applying status filter)', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await page.waitForSelector(`${SEL.FILTER_TAGS} .filter-tag`)
    const filterTags = page.locator(SEL.FILTER_TAGS)
    await expect(filterTags).toHaveScreenshot('filter-tags.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})

test.describe('Visual — Modals', () => {
  test('visual — modal-export', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expect(page.locator(SEL.MODAL_EXPORT)).toBeVisible()
    await expect(page.locator(SEL.MODAL_EXPORT)).toHaveScreenshot('modal-export.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — modal-lookup-dossier', async ({ page }) => {
    await openPage(page)
    await page.keyboard.press('F4')
    await expect(page.locator(SEL.MODAL_LOOKUP_DOSSIER)).toBeVisible()
    await expect(page.locator(SEL.MODAL_LOOKUP_DOSSIER)).toHaveScreenshot('modal-lookup-dossier.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — modal-lookup-user', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.locator(SEL.BTN_LOOKUP_CREATED_BY).click()
    await expect(page.locator(SEL.MODAL_LOOKUP_USER)).toBeVisible()
    await expect(page.locator(SEL.MODAL_LOOKUP_USER)).toHaveScreenshot('modal-lookup-user.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('visual — status badge colors (all variants visible)', async ({ page }) => {
    await openPage(page)
    // All 7 records have different statuses — take a screenshot of the status column
    const tbody = page.locator(SEL.LIST_TBODY)
    await expect(tbody).toHaveScreenshot('status-badges.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
