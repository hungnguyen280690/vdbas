/**
 * Interaction tests for form_list.html
 * CHI.CAPEX_DOSSIER — Danh sách hồ sơ Chi đầu tư
 *
 * Run against HTML baseline:  BASE_URL=http://localhost:8080 npx playwright test
 * Run against React build:     BASE_URL=http://localhost:5173 npx playwright test
 */
import { test, expect } from '@playwright/test'
import { SEL } from '../shared/selectors'
import {
  openPage,
  selectRow,
  expectModalOpen,
  expectModalClosed,
  waitForTableRows,
  getStatTotal,
  getRenderedRowCount,
} from '../shared/helpers'

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — Page load & initial render
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 1 — Page load & initial render', () => {
  test('page load — title hiển thị đúng', async ({ page }) => {
    await openPage(page)
    await expect(page).toHaveTitle(/CHI\.CAPEX_DOSSIER/)
  })

  test('page load — breadcrumb hiển thị "Danh sách hồ sơ"', async ({ page }) => {
    await openPage(page)
    const breadcrumb = page.locator('.breadcrumb')
    await expect(breadcrumb).toContainText('Danh sách hồ sơ')
  })

  test('page load — h1 page title hiển thị', async ({ page }) => {
    await openPage(page)
    await expect(page.locator('.page-title')).toBeVisible()
  })

  test('page load — table có 7 bản ghi mẫu', async ({ page }) => {
    await openPage(page)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(7)
  })

  test('page load — stat-total hiển thị 7', async ({ page }) => {
    await openPage(page)
    const total = await getStatTotal(page)
    expect(total).toBe(7)
  })

  test('page load — stats bar hiển thị đủ các chỉ số', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.STATS_BAR)).toBeVisible()
    await expect(page.locator(SEL.STAT_DRAFT)).toBeVisible()
    await expect(page.locator(SEL.STAT_PENDING_CHECK)).toBeVisible()
    await expect(page.locator(SEL.STAT_PENDING_APPROVE)).toBeVisible()
    await expect(page.locator(SEL.STAT_APPROVED)).toBeVisible()
    await expect(page.locator(SEL.STAT_REJECTED)).toBeVisible()
    await expect(page.locator(SEL.STAT_TOTAL_VND)).toBeVisible()
  })

  test('page load — stat-draft = 2 (REC-001, REC-007)', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.STAT_DRAFT)).toHaveText('2')
  })

  test('page load — stat-approved = 1 (REC-004)', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.STAT_APPROVED)).toHaveText('1')
  })

  test('page load — pagination info hiển thị', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('Hiển thị')
  })

  test('page load — footer-count hiển thị tổng 7 hồ sơ', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.FOOTER_COUNT)).toHaveText('7')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — Buttons
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 2 — Buttons', () => {
  test('btn-new — hiển thị trên page header', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.BTN_NEW)).toBeVisible()
  })

  test('btn-new — click → navigate đến form_detail.html?mode=new', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_NEW).click()
    await expect(page).toHaveURL(/mode=new/)
  })

  test('btn-export — hiển thị trên page header', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.BTN_EXPORT)).toBeVisible()
  })

  test('btn-export — click → mở dialog-export', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expectModalOpen(page, 'modal-export')
  })

  test('btn-search — click → trigger filter (table vẫn render)', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_SEARCH).click()
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBeGreaterThan(0)
  })

  test('btn-reset-filter — click → xóa search input', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'abc-test')
    await page.locator(SEL.BTN_RESET_FILTER).click()
    await expect(page.locator(SEL.SEARCH_INPUT)).toHaveValue('')
  })

  test('btn-reset-filter — click → xóa filter-state-code', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await page.locator(SEL.BTN_RESET_FILTER).click()
    await expect(page.locator(SEL.FILTER_STATE_CODE)).toHaveValue('')
  })

  test('btn-adv-toggle — click → advanced filter panel mở', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await expect(page.locator(SEL.ADV_FILTER_AREA)).toBeVisible()
  })

  test('btn-adv-toggle — click lần 2 → advanced filter panel đóng', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await expect(page.locator(SEL.ADV_FILTER_AREA)).toBeVisible()
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await expect(page.locator(SEL.ADV_FILTER_AREA)).toBeHidden()
  })

  test('btn-save-filter — hiển thị trong filter row', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.BTN_SAVE_FILTER)).toBeVisible()
  })

  test('btn-save-filter — click → lưu filter vào localStorage (btn-load-filter hiện)', async ({ page }) => {
    // Setup: dismiss the alert dialog
    page.on('dialog', dialog => dialog.dismiss())
    await openPage(page)
    await page.locator(SEL.BTN_SAVE_FILTER).click()
    // After saving, saved-filter-group becomes visible
    await expect(page.locator('#saved-filter-group')).toBeVisible()
  })

  test('btn-lookup-dossier-code — click → mở modal-lookup-dossier', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_LOOKUP_DOSSIER_CODE).click()
    await expectModalOpen(page, 'modal-lookup-dossier')
  })

  test('btn-reset-adv-filter — xóa advanced filter fields', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.fill(SEL.FILTER_CREATED_BY, 'test-user')
    await page.locator(SEL.BTN_RESET_ADV_FILTER).click()
    await expect(page.locator(SEL.FILTER_CREATED_BY)).toHaveValue('')
  })

  test('btn-search-adv — click → trigger filter từ advanced panel', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.locator(SEL.BTN_SEARCH_ADV).click()
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — Keyboard shortcuts
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 3 — Keyboard shortcuts', () => {
  test('keyboard Ctrl+N → navigate tạo mới (mode=new)', async ({ page }) => {
    await openPage(page)
    await page.keyboard.press('Control+n')
    await expect(page).toHaveURL(/mode=new/)
  })

  test('keyboard F5 → reset filter — search-input cleared', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'test-reset')
    await page.keyboard.press('F5')
    await expect(page.locator(SEL.SEARCH_INPUT)).toHaveValue('')
  })

  test('keyboard F5 → reset filter — table hiển thị đủ 7 bản ghi', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'nonexistent-xyz-999')
    await page.keyboard.press('F5')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(7)
  })

  test('keyboard F4 → mở dialog-lookup-dossier', async ({ page }) => {
    await openPage(page)
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-dossier')
  })

  test('keyboard Escape → đóng dialog-lookup-dossier', async ({ page }) => {
    await openPage(page)
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-dossier')
    await page.keyboard.press('Escape')
    await expectModalClosed(page, 'modal-lookup-dossier')
  })

  test('keyboard F2 — row được chọn DRAFT → navigate edit', async ({ page }) => {
    await openPage(page)
    await selectRow(page, 'REC-001') // REC-001 is DRAFT
    await page.keyboard.press('F2')
    await expect(page).toHaveURL(/mode=edit/)
  })

  test('keyboard F2 — không có row được chọn → không navigate', async ({ page }) => {
    await openPage(page)
    const urlBefore = page.url()
    await page.keyboard.press('F2')
    // Should stay on the same page
    await expect(page).toHaveURL(urlBefore)
  })

  test('keyboard F3 — row được chọn → navigate view', async ({ page }) => {
    await openPage(page)
    await selectRow(page, 'REC-001')
    await page.keyboard.press('F3')
    await expect(page).toHaveURL(/mode=view/)
  })

  test('keyboard F3 — không có row được chọn → không navigate', async ({ page }) => {
    await openPage(page)
    const urlBefore = page.url()
    await page.keyboard.press('F3')
    await expect(page).toHaveURL(urlBefore)
  })

  test('keyboard F9 — row DRAFT có chứng từ → hiện confirm dialog', async ({ page }) => {
    let dialogShown = false
    page.on('dialog', async dialog => {
      dialogShown = true
      await dialog.dismiss()
    })
    await openPage(page)
    await selectRow(page, 'REC-001') // REC-001: DRAFT, DOCUMENT_COUNT=2
    await page.keyboard.press('F9')
    expect(dialogShown).toBe(true)
  })

  test('keyboard F9 — row DRAFT không có chứng từ → hiện alert warning', async ({ page }) => {
    let alertText = ''
    page.on('dialog', async dialog => {
      alertText = dialog.message()
      await dialog.dismiss()
    })
    await openPage(page)
    await selectRow(page, 'REC-007') // REC-007: DRAFT, DOCUMENT_COUNT=0
    await page.keyboard.press('F9')
    expect(alertText).toContain('Cần có chứng từ')
  })

  test('keyboard Delete — row được chọn DRAFT → navigate delete', async ({ page }) => {
    await openPage(page)
    await selectRow(page, 'REC-001')
    await page.keyboard.press('Delete')
    await expect(page).toHaveURL(/action=delete/)
  })

  test('keyboard Ctrl+Shift+E → mở dialog-export', async ({ page }) => {
    await openPage(page)
    await page.keyboard.press('Control+Shift+E')
    await expectModalOpen(page, 'modal-export')
  })

  test('keyboard F8 — row PENDING_CHECK → hiện confirm phê duyệt', async ({ page }) => {
    let dialogShown = false
    page.on('dialog', async dialog => {
      dialogShown = true
      await dialog.dismiss()
    })
    await openPage(page)
    await selectRow(page, 'REC-002') // REC-002: PENDING_CHECK
    await page.keyboard.press('F8')
    expect(dialogShown).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 4 — Filter & Search
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 4 — Filter & Search', () => {
  test('search-input — nhập "HS-CHI-2026-0001" → lọc còn 1 kết quả', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'HS-CHI-2026-0001')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(1)
  })

  test('search-input — nhập text không tồn tại → empty state', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'NONEXISTENT-XYZ-99999')
    await page.waitForFunction(() => {
      const tbody = document.getElementById('list-tbody')
      return tbody?.textContent?.includes('Không có hồ sơ nào') ?? false
    })
    const emptyText = await page.locator(SEL.LIST_TBODY).textContent()
    expect(emptyText).toContain('Không có hồ sơ nào')
  })

  test('filter-state-code DRAFT → chỉ hiện Đang hoàn thiện (2 rows)', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(2)
    // Verify stat-total updates
    const total = await getStatTotal(page)
    expect(total).toBe(2)
  })

  test('filter-state-code APPROVED → chỉ hiện Đã phê duyệt (1 row)', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'APPROVED')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(1)
  })

  test('filter-data-source-code DVC → chỉ hiện nguồn DVC (1 row)', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_DATA_SOURCE_CODE, 'DVC')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(1)
  })

  test('filter-dossier-code — nhập mã → lọc đúng hồ sơ', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.FILTER_DOSSIER_CODE, 'HS-CHI-2026-0003')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(1)
  })

  test('advanced filter — filter-created-by lọc theo người lập', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.fill(SEL.FILTER_CREATED_BY, 'nguyen.van.a')
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(2) // REC-001 và REC-007 đều do nguyen.van.a tạo
  })

  test('advanced filter — filter-from-date + filter-to-date lọc theo ngày gửi', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.fill(SEL.FILTER_FROM_DATE, '01/05/2026')
    await page.fill(SEL.FILTER_TO_DATE, '31/05/2026')
    await page.locator(SEL.BTN_SEARCH_ADV).click()
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    // Records in May 2026: REC-001(15/05), REC-002(10/05), REC-003(05/05), REC-007(28/05) = 4
    expect(count).toBe(4)
  })

  test('filter tags — xuất hiện khi status filter active', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await expect(page.locator(SEL.FILTER_TAGS)).toContainText('Trạng thái')
  })

  test('filter tag × — click xóa tag status → clear filter', async ({ page }) => {
    await openPage(page)
    // filter-tags is inside adv-filter-area (display:none by default) — open panel first
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await expect(page.locator(SEL.ADV_FILTER_AREA)).toBeVisible()
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    // Wait for tag to appear inside the now-visible panel
    await page.waitForSelector(`${SEL.FILTER_TAGS} .filter-tag`, { state: 'visible' })
    // Click the × button inside the tag
    await page.locator(`${SEL.FILTER_TAGS} .filter-tag button`).first().click()
    // filter-state-code should be cleared
    await expect(page.locator(SEL.FILTER_STATE_CODE)).toHaveValue('')
    // Table should show all 7 records again
    const count = await getRenderedRowCount(page)
    expect(count).toBe(7)
  })

  test('filter tags — advanced filter badge count hiển thị', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.fill(SEL.FILTER_CREATED_BY, 'nguyen.van.a')
    await page.fill(SEL.FILTER_CHECKED_BY, 'nguyen.checker')
    await page.locator(SEL.BTN_SEARCH_ADV).click()
    // Badge should show 2
    const badge = page.locator('#adv-filter-count')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('2')
  })

  test('btn-reset-filter → xóa toàn bộ filter, table về 7 bản ghi', async ({ page }) => {
    await openPage(page)
    await page.fill(SEL.SEARCH_INPUT, 'REC-001')
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await page.locator(SEL.BTN_RESET_FILTER).click()
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(7)
  })

  test('save-filter → load-filter → áp dụng lại đúng bộ lọc', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss())
    await openPage(page)
    // Set a filter
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await waitForTableRows(page, 1)
    // Save it
    await page.locator(SEL.BTN_SAVE_FILTER).click()
    // Reset
    await page.locator(SEL.BTN_RESET_FILTER).click()
    await waitForTableRows(page, 1)
    expect(await getRenderedRowCount(page)).toBe(7)
    // Load saved filter
    await page.locator(SEL.BTN_LOAD_FILTER).click()
    await waitForTableRows(page, 1)
    const count = await getRenderedRowCount(page)
    expect(count).toBe(2) // DRAFT = 2
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 5 — Table interactions
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 5 — Table interactions', () => {
  test('column header DOSSIER_CODE click → sort asc', async ({ page }) => {
    await openPage(page)
    // Click header "Mã hồ sơ"
    await page.locator('th[onclick*="DOSSIER_CODE"]').click()
    await waitForTableRows(page, 1)
    // First row should be HS-CHI-2026-0001
    const firstCell = await page.locator(`${SEL.LIST_TBODY} tr:first-child td:first-child`).textContent()
    expect(firstCell).toContain('HS-CHI-2026-0001')
  })

  test('column header DOSSIER_CODE click lần 2 → sort desc', async ({ page }) => {
    await openPage(page)
    await page.locator('th[onclick*="DOSSIER_CODE"]').click()
    await page.locator('th[onclick*="DOSSIER_CODE"]').click()
    await waitForTableRows(page, 1)
    // First row should be HS-CHI-2026-0007
    const firstCell = await page.locator(`${SEL.LIST_TBODY} tr:first-child td:first-child`).textContent()
    expect(firstCell).toContain('HS-CHI-2026-0007')
  })

  test('row click → row nhận class row-selected', async ({ page }) => {
    await openPage(page)
    await selectRow(page, 'REC-001')
    await expect(page.locator(SEL.rowEl('REC-001'))).toHaveClass(/row-selected/)
  })

  test('row click → chỉ 1 row được chọn tại 1 thời điểm', async ({ page }) => {
    await openPage(page)
    await selectRow(page, 'REC-001')
    await selectRow(page, 'REC-002')
    const selectedRows = await page.locator('tr.row-selected').count()
    expect(selectedRows).toBe(1)
    await expect(page.locator(SEL.rowEl('REC-002'))).toHaveClass(/row-selected/)
  })

  test('row click vào actions col → không select row', async ({ page }) => {
    await openPage(page)
    // Playwright click on .actions-col may land on a button and navigate.
    // Use dispatchEvent to bubble a click through .actions-col → tr.selectRow()
    // which guards: if (event.target.closest('.actions-col')) return;
    await page.evaluate(() => {
      const actionsDiv = document.querySelector('[data-testid="row-REC-001"] .actions-col') as HTMLElement
      actionsDiv.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    const hasSelected = await page.locator(SEL.rowEl('REC-001')).evaluate(
      el => el.classList.contains('row-selected')
    )
    expect(hasSelected).toBe(false)
  })

  test('row dblclick → navigate đến detail view', async ({ page }) => {
    await openPage(page)
    await page.locator(`${SEL.rowEl('REC-001')} td:first-child`).dblclick()
    await expect(page).toHaveURL(/mode=view/)
  })

  test('btn-view per row → navigate đến form_detail view', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.rowBtn('REC-001', 'view')).click()
    await expect(page).toHaveURL(/id=REC-001.*mode=view|mode=view.*id=REC-001/)
  })

  test('btn-edit per row — REC-001 DRAFT → không disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-001', 'edit'))).not.toBeDisabled()
  })

  test('btn-edit per row — REC-001 DRAFT → click → navigate edit', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.rowBtn('REC-001', 'edit')).click()
    await expect(page).toHaveURL(/mode=edit/)
  })

  test('btn-edit per row — REC-002 PENDING_CHECK → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-002', 'edit'))).toBeDisabled()
  })

  test('btn-edit per row — REC-003 PENDING_APPROVE → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-003', 'edit'))).toBeDisabled()
  })

  test('btn-delete per row — REC-001 DRAFT → không disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-001', 'delete'))).not.toBeDisabled()
  })

  test('btn-delete per row — REC-001 DRAFT → click → navigate action=delete', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.rowBtn('REC-001', 'delete')).click()
    await expect(page).toHaveURL(/action=delete/)
  })

  test('btn-delete per row — REC-002 PENDING_CHECK → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-002', 'delete'))).toBeDisabled()
  })

  test('btn-delete per row — REC-004 APPROVED → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.rowBtn('REC-004', 'delete'))).toBeDisabled()
  })

  test('table link Mã hồ sơ — click → navigate view (không select row)', async ({ page }) => {
    await openPage(page)
    await page.locator(`${SEL.rowEl('REC-003')} td:first-child a`).click()
    await expect(page).toHaveURL(/id=REC-003.*mode=view|mode=view.*id=REC-003/)
  })

  test('status badge hiển thị đúng nhãn cho từng trạng thái', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(`${SEL.rowEl('REC-001')} .badge`)).toHaveText('Đang hoàn thiện')
    await expect(page.locator(`${SEL.rowEl('REC-002')} .badge`)).toHaveText('Chờ kiểm soát')
    await expect(page.locator(`${SEL.rowEl('REC-004')} .badge`)).toHaveText('Đã phê duyệt')
  })

  test('footer tổng tiền VND cập nhật theo filter', async ({ page }) => {
    await openPage(page)
    const totalBefore = await page.locator(SEL.FOOTER_VND_TOTAL).textContent()
    await page.selectOption(SEL.FILTER_STATE_CODE, 'APPROVED')
    await waitForTableRows(page, 1)
    const totalAfter = await page.locator(SEL.FOOTER_VND_TOTAL).textContent()
    // Total should change when filtering
    expect(totalAfter).not.toBe(totalBefore)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 6 — Pagination
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 6 — Pagination', () => {
  test('pagination-info — hiển thị đúng "Hiển thị X – Y trong Z"', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('Hiển thị')
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('7')
  })

  test('pagination-first — trang 1 → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGINATION_FIRST)).toBeDisabled()
  })

  test('pagination-prev — trang 1 → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGINATION_PREV)).toBeDisabled()
  })

  test('pagination-next — trang 1, data < pageSize → disabled', async ({ page }) => {
    await openPage(page)
    // 7 records, pageSize=20 → only 1 page → next disabled
    await expect(page.locator(SEL.PAGINATION_NEXT)).toBeDisabled()
  })

  test('pagination-last — trang 1, data < pageSize → disabled', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGINATION_LAST)).toBeDisabled()
  })

  test('page-size-select — hiển thị đúng các options', async ({ page }) => {
    await openPage(page)
    const options = await page.locator(`${SEL.PAGE_SIZE_SELECT} option`).allTextContents()
    expect(options).toContain('20/trang')
    expect(options).toContain('50/trang')
    expect(options).toContain('100/trang')
    expect(options).toContain('200/trang')
  })

  test('page-size-select — mặc định 20/trang', async ({ page }) => {
    await openPage(page)
    await expect(page.locator(SEL.PAGE_SIZE_SELECT)).toHaveValue('20')
  })

  test('page-size-select — đổi 50/trang → pagination-info cập nhật', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.PAGE_SIZE_SELECT, '50')
    // With 7 records and 50/page, still 1 page — info should still say 7
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('7')
  })

  // pageSize/currentPage are `let` vars — not on window. Use DOM to trigger onPageSizeChange().
  async function setPageSizeToOne(page: any) {
    await page.evaluate(() => {
      const sel = document.getElementById('page-size-select') as HTMLSelectElement
      const opt = document.createElement('option')
      opt.value = '1'
      opt.text = '1/trang'
      sel.appendChild(opt)
      sel.value = '1'
      sel.dispatchEvent(new Event('change'))
    })
  }

  test('pagination — multi-page navigation via pageSize=1', async ({ page }) => {
    await openPage(page)
    await setPageSizeToOne(page)
    await expect(page.locator(SEL.PAGINATION_NEXT)).not.toBeDisabled()
    await page.locator(SEL.PAGINATION_NEXT).click()
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('2')
  })

  test('pagination — btn-first → về trang 1 sau khi chuyển trang', async ({ page }) => {
    await openPage(page)
    await setPageSizeToOne(page)
    await page.locator(SEL.PAGINATION_NEXT).click()
    await page.locator(SEL.PAGINATION_FIRST).click()
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('1 –')
  })

  test('pagination — btn-last → trang cuối', async ({ page }) => {
    await openPage(page)
    await setPageSizeToOne(page)
    await page.locator(SEL.PAGINATION_LAST).click()
    await expect(page.locator(SEL.PAGINATION_INFO)).toContainText('7 –')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 7 — Modal: Export Dialog
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 7a — Modal: dialog-export', () => {
  test('mở bằng btn-export', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expectModalOpen(page, 'modal-export')
  })

  test('export-count hiển thị đúng số hồ sơ khớp bộ lọc', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    // 7 records unfiltered
    await expect(page.locator('#export-count')).toHaveText('7')
  })

  test('đóng bằng nút Đóng', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expectModalOpen(page, 'modal-export')
    await page.locator(SEL.BTN_CLOSE_EXPORT).click()
    await expectModalClosed(page, 'modal-export')
  })

  test('btn-export-excel hiển thị trong dialog', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expect(page.locator(SEL.BTN_EXPORT_EXCEL)).toBeVisible()
  })

  test('btn-export-pdf hiển thị trong dialog', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expect(page.locator(SEL.BTN_EXPORT_PDF)).toBeVisible()
  })

  test('btn-export-csv hiển thị trong dialog', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await expect(page.locator(SEL.BTN_EXPORT_CSV)).toBeVisible()
  })

  test('click Excel → đóng dialog + hiện alert', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss())
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await page.locator(SEL.BTN_EXPORT_EXCEL).click()
    await expectModalClosed(page, 'modal-export')
  })

  test('click PDF → đóng dialog', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss())
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await page.locator(SEL.BTN_EXPORT_PDF).click()
    await expectModalClosed(page, 'modal-export')
  })

  test('click CSV → đóng dialog', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss())
    await openPage(page)
    await page.locator(SEL.BTN_EXPORT).click()
    await page.locator(SEL.BTN_EXPORT_CSV).click()
    await expectModalClosed(page, 'modal-export')
  })

  test('export-count cập nhật sau khi filter', async ({ page }) => {
    await openPage(page)
    await page.selectOption(SEL.FILTER_STATE_CODE, 'DRAFT')
    await waitForTableRows(page, 1)
    await page.locator(SEL.BTN_EXPORT).click()
    await expect(page.locator('#export-count')).toHaveText('2')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 7b — Modal: dialog-lookup-user
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 7b — Modal: dialog-lookup-user', () => {
  async function openUserLookup(page: Parameters<typeof openPage>[0]) {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.locator(SEL.BTN_LOOKUP_CREATED_BY).click()
    await expectModalOpen(page, 'modal-lookup-user')
  }

  test('mở bằng btn-lookup-created-by (advanced filter)', async ({ page }) => {
    await openUserLookup(page)
  })

  test('mở bằng btn-lookup-checked-by (advanced filter)', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.locator(SEL.BTN_LOOKUP_CHECKED_BY).click()
    await expectModalOpen(page, 'modal-lookup-user')
  })

  test('mở bằng btn-lookup-approved-by (advanced filter)', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_ADV_TOGGLE).click()
    await page.locator(SEL.BTN_LOOKUP_APPROVED_BY).click()
    await expectModalOpen(page, 'modal-lookup-user')
  })

  test('hiển thị danh sách 7 user mặc định', async ({ page }) => {
    await openUserLookup(page)
    await expect(page.locator(SEL.LOV_USER_COUNT)).toContainText('7')
  })

  test('filter tên "nguyen" → lọc user có tên chứa "nguyen"', async ({ page }) => {
    await openUserLookup(page)
    await page.fill(SEL.LOV_USER_NAME, 'nguyen')
    const count = await page.locator(`${SEL.LOV_USER_TBODY} tr`).count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('filter vai trò Maker → chỉ hiện Maker users', async ({ page }) => {
    await openUserLookup(page)
    await page.selectOption(SEL.LOV_USER_ROLE, 'Maker')
    await expect(page.locator(SEL.LOV_USER_COUNT)).toContainText('5') // 5 Maker users
  })

  test('filter vai trò Checker → chỉ hiện Checker users', async ({ page }) => {
    await openUserLookup(page)
    await page.selectOption(SEL.LOV_USER_ROLE, 'Checker')
    await expect(page.locator(SEL.LOV_USER_COUNT)).toContainText('1')
  })

  test('filter vai trò Approver → chỉ hiện Approver users', async ({ page }) => {
    await openUserLookup(page)
    await page.selectOption(SEL.LOV_USER_ROLE, 'Approver')
    await expect(page.locator(SEL.LOV_USER_COUNT)).toContainText('1')
  })

  test('click row → điền username vào field nguồn, đóng dialog', async ({ page }) => {
    await openUserLookup(page)
    // Click first row (nguyen.van.a)
    await page.locator(`${SEL.LOV_USER_TBODY} tr:first-child`).click()
    await expectModalClosed(page, 'modal-lookup-user')
    // The target field (filter-created-by) should be filled
    await expect(page.locator(SEL.FILTER_CREATED_BY)).not.toHaveValue('')
  })

  test('đóng bằng nút Đóng (Esc)', async ({ page }) => {
    await openUserLookup(page)
    await page.locator(SEL.BTN_CLOSE_LOOKUP_USER).click()
    await expectModalClosed(page, 'modal-lookup-user')
  })

  test('filter tên không tồn tại → empty state', async ({ page }) => {
    await openUserLookup(page)
    await page.fill(SEL.LOV_USER_NAME, 'NONEXISTENT_USER_XYZ')
    await expect(page.locator(SEL.LOV_USER_TBODY)).toContainText('Không có kết quả')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 7c — Modal: dialog-lookup-dossier
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 7c — Modal: dialog-lookup-dossier', () => {
  async function openDossierLookup(page: Parameters<typeof openPage>[0]) {
    await openPage(page)
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-dossier')
  }

  test('mở bằng F4', async ({ page }) => {
    await openDossierLookup(page)
  })

  test('mở bằng btn-lookup-dossier-code', async ({ page }) => {
    await openPage(page)
    await page.locator(SEL.BTN_LOOKUP_DOSSIER_CODE).click()
    await expectModalOpen(page, 'modal-lookup-dossier')
  })

  test('hiển thị 7 hồ sơ mặc định', async ({ page }) => {
    await openDossierLookup(page)
    await expect(page.locator(SEL.LOV_DOSSIER_COUNT)).toContainText('7')
  })

  test('filter mã hồ sơ → lọc đúng', async ({ page }) => {
    await openDossierLookup(page)
    await page.fill(SEL.LOV_DOSSIER_CODE, '0001')
    const rowCount = await page.locator(`${SEL.LOV_DOSSIER_TBODY} tr`).count()
    expect(rowCount).toBe(1)
  })

  test('filter tên dự án → lọc đúng', async ({ page }) => {
    await openDossierLookup(page)
    await page.fill(SEL.LOV_DOSSIER_PROJECT, 'bệnh viện')
    const rows = await page.locator(`${SEL.LOV_DOSSIER_TBODY} tr`).count()
    expect(rows).toBeGreaterThanOrEqual(1)
  })

  test('filter trạng thái DRAFT → chỉ hiện DRAFT', async ({ page }) => {
    await openDossierLookup(page)
    await page.selectOption(SEL.LOV_DOSSIER_STATE, 'DRAFT')
    await expect(page.locator(SEL.LOV_DOSSIER_COUNT)).toContainText('2')
  })

  test('click row → điền mã vào filter-dossier-code, đóng dialog', async ({ page }) => {
    await openDossierLookup(page)
    await page.locator(`${SEL.LOV_DOSSIER_TBODY} tr:first-child`).click()
    await expectModalClosed(page, 'modal-lookup-dossier')
    await expect(page.locator(SEL.FILTER_DOSSIER_CODE)).not.toHaveValue('')
  })

  test('đóng bằng Escape', async ({ page }) => {
    await openDossierLookup(page)
    await page.keyboard.press('Escape')
    await expectModalClosed(page, 'modal-lookup-dossier')
  })

  test('đóng bằng nút Đóng (Esc)', async ({ page }) => {
    await openDossierLookup(page)
    await page.locator(SEL.BTN_CLOSE_LOOKUP_DOSSIER).click()
    await expectModalClosed(page, 'modal-lookup-dossier')
  })

  test('filter không tồn tại → empty state', async ({ page }) => {
    await openDossierLookup(page)
    await page.fill(SEL.LOV_DOSSIER_CODE, 'NONEXISTENT-XYZ')
    await expect(page.locator(SEL.LOV_DOSSIER_TBODY)).toContainText('Không có kết quả')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 8 — Conditional columns
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Group 8 — Conditional columns', () => {
  test('col "Lý do từ chối tiếp nhận" ẩn khi hasRejectedDoc=false (mặc định)', async ({ page }) => {
    await openPage(page)
    // Column is hidden via `hidden` attribute initially
    const col = page.locator('th[data-conditional-show="hasRejectedDoc"]')
    await expect(col).toBeHidden()
  })

  test('col "Người KS" ẩn khi hasCheckedDoc=false (mặc định)', async ({ page }) => {
    await openPage(page)
    const col = page.locator('th[data-conditional-show="hasCheckedDoc"]').first()
    await expect(col).toBeHidden()
  })

  test('applyConditionalColumns({hasRejectedDoc:true}) → col hiện', async ({ page }) => {
    await openPage(page)
    await page.evaluate(() => {
      (window as any).applyConditionalColumns({ hasRejectedDoc: true, hasCheckedDoc: false })
    })
    const col = page.locator('th[data-conditional-show="hasRejectedDoc"]')
    await expect(col).toBeVisible()
  })

  test('applyConditionalColumns({hasCheckedDoc:true}) → col KS hiện', async ({ page }) => {
    await openPage(page)
    await page.evaluate(() => {
      (window as any).applyConditionalColumns({ hasRejectedDoc: false, hasCheckedDoc: true })
    })
    const cols = page.locator('th[data-conditional-show="hasCheckedDoc"]')
    await expect(cols.first()).toBeVisible()
  })
})
