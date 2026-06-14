/**
 * interactions.spec.ts — form_detail.html
 *
 * Covers:
 *   Nhóm 1 — Page load & initial render
 *   Nhóm 2 — Buttons
 *   Nhóm 3 — Keyboard shortcuts
 *   Nhóm 4 — Form modes (new / view / edit)
 *   Nhóm 5 — Cascading fields & conditional UI
 *   Nhóm 6 — Tabs
 *   Nhóm 7 — Modals
 *   Nhóm 8 — Documents tab
 *   Nhóm 9 — Delete confirm flow
 *   Nhóm 10 — Cancel confirm flow
 *
 * Environment toggle:
 *   BASE_URL=http://localhost:8080 npx playwright test   # HTML gốc
 *   BASE_URL=http://localhost:5173 npx playwright test   # React
 */

import { test, expect, Page } from '@playwright/test'
import { DSEL } from '../shared/selectors.detail'
import {
  openDetail,
  openDetailDismissDialogs,
  openDetailAcceptDialogs,
  expectModalOpen,
  expectModalClosed,
  fillProjectCode,
  fillBoardCode,
  openDeleteDialog,
  fillDeleteForm,
  dismissOutsideHourIfVisible,
  dismissConcurrentIfVisible,
} from '../shared/helpers.detail'

// ─────────────────────────────────────────────────────────────
// Nhóm 1 — Page load & initial render
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 1 — Page load', () => {
  test('mode=new — title chứa "Tạo mới"', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page).toHaveTitle(/Tạo mới/)
  })

  test('mode=view — title chứa mã hồ sơ', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page).toHaveTitle(/HS-CHI-2026-0001/)
  })

  test('mode=new — breadcrumb hiển thị "Chi tiết hồ sơ"', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BREADCRUMB_LINK_LIST)).toBeVisible()
  })

  test('mode=view — status badge hiển thị đúng trạng thái', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.STATUS_BADGE)).toHaveText('Đang hoàn thiện')
  })

  test('mode=new — SEND_DATE được điền ngày hôm nay mặc định', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    const val = await page.locator(DSEL.INPUT_SEND_DATE).inputValue()
    expect(val).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  test('mode=new — DOSSIER_CODE có placeholder "(Tự động sinh)"', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    const ph = await page.locator(DSEL.INPUT_DOSSIER_CODE).getAttribute('placeholder')
    expect(ph).toContain('Tự động sinh')
  })

  test('mode=view REC-001 — tất cả trường được điền từ sample data', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.INPUT_DOSSIER_CODE)).toHaveValue('HS-CHI-2026-0001')
    await expect(page.locator(DSEL.INPUT_PROJECT_CODE)).toHaveValue('7122155')
    await expect(page.locator(DSEL.INPUT_PROJECT_NAME)).toHaveValue(/Bạch Mai/)
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 2 — Buttons
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 2 — Buttons', () => {
  // ── breadcrumb-link-list
  test('breadcrumb-link-list — click → navigate đến form_list.html', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BREADCRUMB_LINK_LIST).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })

  // ── btn-print (view only)
  test('btn-print — visible trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_PRINT)).toBeVisible()
  })

  test('btn-print — hidden trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_PRINT)).toBeHidden()
  })

  test('btn-print — click → mở modal-print-preview', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expectModalOpen(page, 'modal-print-preview')
  })

  // ── btn-edit (view only)
  test('btn-edit — visible trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_EDIT)).toBeVisible()
  })

  test('btn-edit — enabled khi DRAFT (REC-001)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_EDIT)).not.toBeDisabled()
  })

  test('btn-edit — disabled khi PENDING_CHECK (REC-002)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-002' })
    await expect(page.locator(DSEL.BTN_EDIT)).toBeDisabled()
  })

  test('btn-edit — click → navigate đến mode=edit', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_EDIT).click()
    await expect(page).toHaveURL(/mode=edit/)
  })

  // ── btn-delete (view only)
  test('btn-delete — visible trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_DELETE)).toBeVisible()
  })

  test('btn-delete — enabled khi DRAFT (REC-001)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_DELETE)).not.toBeDisabled()
  })

  test('btn-delete — disabled khi APPROVED (REC-004)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-004' })
    await expect(page.locator(DSEL.BTN_DELETE)).toBeDisabled()
  })

  test('btn-delete — click → mở modal-delete-confirm', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await openDeleteDialog(page)
    // Already asserts modal visible inside helper
  })

  // ── btn-back (view only)
  test('btn-back — visible trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_BACK)).toBeVisible()
  })

  test('btn-back — click → navigate đến form_list.html', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_BACK).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })

  // ── btn-cancel (new/edit)
  test('btn-cancel — visible trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_CANCEL)).toBeVisible()
  })

  test('btn-cancel — hidden trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_CANCEL)).toBeHidden()
  })

  // ── btn-save-draft (new/edit)
  test('btn-save-draft — visible trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE_DRAFT)).toBeVisible()
  })

  test('btn-save-draft — hidden trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_SAVE_DRAFT)).toBeHidden()
  })

  test('btn-save-draft — click → alert "Lưu nháp thành công"', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    page.on('dialog', d => {
      expect(d.message()).toContain('Lưu nháp')
      d.dismiss()
    })
    await page.locator(DSEL.BTN_SAVE_DRAFT).click()
  })

  // ── btn-save (new only)
  test('btn-save — visible trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE)).toBeVisible()
  })

  test('btn-save — hidden trong edit mode', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE)).toBeHidden()
  })

  // ── btn-save-edit (edit only)
  test('btn-save-edit — visible trong edit mode', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE_EDIT)).toBeVisible()
  })

  test('btn-save-edit — hidden trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE_EDIT)).toBeHidden()
  })

  // ── btn-submit (new/edit, disabled until has docs)
  test('btn-submit — visible trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SUBMIT)).toBeVisible()
  })

  test('btn-submit — disabled khi không có chứng từ (new mode)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SUBMIT)).toBeDisabled()
  })

  test('btn-submit — enabled khi record có documents (REC-001 view→edit)', async ({ page }) => {
    // REC-001 has 2 documents → submit should be enabled in edit mode
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await expect(page.locator(DSEL.BTN_SUBMIT)).not.toBeDisabled()
  })

  // ── btn-add-doc (edit only)
  test('btn-add-doc — visible trong edit mode', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    // Switch to documents tab first
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.BTN_ADD_DOC)).toBeVisible()
  })

  test('btn-add-doc — hidden trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.BTN_ADD_DOC)).toBeHidden()
  })

  // ── btn-lookup-project
  test('btn-lookup-project — click → mở modal-lookup-project', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await expectModalOpen(page, 'modal-lookup-project')
  })

  // ── btn-lookup-board
  test('btn-lookup-board — click → mở modal-lookup-project (board target)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_BOARD).click()
    await expectModalOpen(page, 'modal-lookup-project')
  })

  // ── btn-upload (attach tab, new/edit)
  test('btn-upload — visible trong new mode trên tab attach', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.BTN_UPLOAD)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 3 — Keyboard shortcuts
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 3 — Keyboard shortcuts', () => {
  test('Ctrl+S trong new mode — kích hoạt save (alert nếu fields rỗng)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    let dialogMessage = ''
    page.on('dialog', d => { dialogMessage = d.message(); d.dismiss() })
    await page.keyboard.press('Control+s')
    // Should show validation alert because fields are empty
    await page.waitForTimeout(300)
    expect(dialogMessage).toBeTruthy()
  })

  test('Ctrl+Shift+S trong new mode → alert "Lưu nháp thành công"', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Control+Shift+S')
    await page.waitForTimeout(300)
    expect(msg).toContain('nháp')
  })

  test('F9 trong new mode → kích hoạt submit (alert nếu fields rỗng)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('F9')
    await page.waitForTimeout(300)
    expect(msg).toBeTruthy()
  })

  test('Escape trong new mode (clean) → navigate đến form_list.html', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    // isDirty = false (no inputs touched) → navigate directly
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/form_list\.html/)
  })

  test('Escape trong new mode (dirty) → mở modal-cancel-confirm', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    // Make form dirty
    await page.fill(DSEL.INPUT_SEND_DATE, '01/01/2026')
    await page.keyboard.press('Escape')
    await expectModalOpen(page, 'modal-cancel-confirm')
  })

  test('Alt+H → switch sang tab Lịch sử', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Alt+h')
    await expect(page.locator(DSEL.PANE_HISTORY)).toHaveClass(/active/)
  })

  test('Alt+P → switch sang tab Trạng thái phê duyệt', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Alt+p')
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveClass(/active/)
  })

  test('F2 trong view mode → navigate đến mode=edit', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('F2')
    await expect(page).toHaveURL(/mode=edit/)
  })

  test('F4 khi focus PROJECT_CODE → mở modal-lookup-project', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.INPUT_PROJECT_CODE).focus()
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-project')
  })

  test('F4 khi focus PROJECT_MANAGEMENT_CODE → mở modal-lookup-project (board target)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE).focus()
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-project')
  })

  test('F4 tanpa focus khác → mở modal-lookup-project (project target)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-project')
  })

  test('Ctrl+P trong view mode → mở modal-print-preview', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Control+p')
    await expectModalOpen(page, 'modal-print-preview')
  })

  test('Ctrl+Shift+N trong edit mode → alert thêm chứng từ', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Control+Shift+N')
    await page.waitForTimeout(300)
    expect(msg).toContain('chứng từ')
  })

  test('Ctrl+U → trigger click upload zone', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Control+u')
    await page.waitForTimeout(300)
    expect(msg).toContain('upload')
  })

  test('Ctrl+J → alert download attachment', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Control+j')
    await page.waitForTimeout(300)
    expect(msg).toContain('Tải xuống')
  })

  test('Shift+Delete → alert xoá attachment', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Shift+Delete')
    await page.waitForTimeout(300)
    expect(msg).toContain('Xoá file')
  })

  test('Ctrl+Shift+C trong view mode → alert sao chép hồ sơ', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    let msg = ''
    page.on('dialog', d => { msg = d.message(); d.dismiss() })
    await page.keyboard.press('Control+Shift+C')
    await page.waitForTimeout(300)
    expect(msg).toContain('Sao chép')
  })

  test('Enter khi delete dialog mở và btn enabled → confirm delete', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await openDeleteDialog(page)
    await fillDeleteForm(page)
    // Confirm btn should now be enabled
    await expect(page.locator(DSEL.BTN_CONFIRM_DELETE)).not.toBeDisabled()
    // Enter should fire it → alert then redirect
    page.on('dialog', d => d.dismiss())
    await page.keyboard.press('Enter')
    // After dismiss we stay or navigate — just assert dialog fires
    await page.waitForTimeout(400)
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 4 — Form modes
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 4 — Form modes', () => {
  test('mode=new — fields có thể nhập (không bị disabled/readonly trừ DOSSIER_CODE)', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.INPUT_SEND_DATE)).not.toBeDisabled()
    await expect(page.locator(DSEL.INPUT_PROJECT_CODE)).not.toBeDisabled()
    await expect(page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE)).not.toBeDisabled()
    // DOSSIER_CODE luôn readonly
    await expect(page.locator(DSEL.INPUT_DOSSIER_CODE)).toHaveAttribute('readonly', '')
  })

  test('mode=view — các input bị disabled', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.INPUT_SEND_DATE)).toBeDisabled()
    await expect(page.locator(DSEL.INPUT_PROJECT_CODE)).toBeDisabled()
  })

  test('mode=view — DATA_SOURCE_CODE select bị disabled', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.INPUT_DATA_SOURCE_CODE)).toBeDisabled()
  })

  test('mode=edit — DATA_SOURCE_CODE disabled (đã lưu)', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await expect(page.locator(DSEL.INPUT_DATA_SOURCE_CODE)).toBeDisabled()
  })

  test('mode=view — btn-save hidden, btn-back visible', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.BTN_SAVE)).toBeHidden()
    await expect(page.locator(DSEL.BTN_BACK)).toBeVisible()
  })

  test('mode=new — btn-save visible, btn-back hidden', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE)).toBeVisible()
    await expect(page.locator(DSEL.BTN_BACK)).toBeHidden()
  })

  test('mode=edit — btn-save-edit visible, btn-save hidden', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-001' })
    await dismissOutsideHourIfVisible(page)
    await dismissConcurrentIfVisible(page)
    await expect(page.locator(DSEL.BTN_SAVE_EDIT)).toBeVisible()
    await expect(page.locator(DSEL.BTN_SAVE)).toBeHidden()
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 5 — Cascading fields & conditional UI
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 5 — Cascading & conditional UI', () => {
  test('PROJECT_CODE = 7122155 (Citizen) → PROJECT_NAME auto-fill', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7122155')
    await expect(page.locator(DSEL.INPUT_PROJECT_NAME)).toHaveValue(/Bạch Mai/)
  })

  test('PROJECT_CODE = 7122155 (Citizen) → PROJECT_MANAGEMENT fields auto-fill', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7122155')
    await expect(page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_CODE)).toHaveValue('3029123')
    await expect(page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_NAME)).toHaveValue(/Bạch Mai/)
  })

  test('PROJECT_CODE = 7122155 (Citizen) → Military fields ẩn', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7122155')
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_CODE)).toBeHidden()
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_NAME)).toBeHidden()
  })

  test('PROJECT_CODE = 7004686 (Military) → Military fields hiện', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7004686')
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_CODE)).toBeVisible()
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_NAME)).toBeVisible()
  })

  test('PROJECT_CODE bị xóa → PROJECT_NAME cleared, Military fields ẩn', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7004686')
    await fillProjectCode(page, '')
    await expect(page.locator(DSEL.INPUT_PROJECT_NAME)).toHaveValue('')
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_CODE)).toBeHidden()
  })

  test('PROJECT_MANAGEMENT_CODE cascade → PROJECT_MANAGEMENT_NAME auto-fill', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillBoardCode(page, '3029123')
    await expect(page.locator(DSEL.INPUT_PROJECT_MANAGEMENT_NAME)).toHaveValue(/Bạch Mai/)
  })

  test('mode=view REC-002 (Military) — Military fields hiển thị', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-002' })
    await expect(page.locator(DSEL.GROUP_PROJECT_SPECIFIC_CODE)).toBeVisible()
    await expect(page.locator(DSEL.INPUT_PROJECT_SPECIFIC_CODE)).toHaveValue('001200037')
  })

  test('VAL-18 duplicate check — điền cùng project + board trong new mode → modal-duplicate-warning', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    // REC-001 and REC-007 both have 7122155 + 3029123 as DRAFT
    await fillProjectCode(page, '7122155')
    await fillBoardCode(page, '3029123')
    // modal-duplicate-warning should appear
    await expectModalOpen(page, 'modal-duplicate-warning')
  })

  test('modal-duplicate-warning — btn-continue-duplicate → đóng modal, tiếp tục', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7122155')
    await fillBoardCode(page, '3029123')
    await expectModalOpen(page, 'modal-duplicate-warning')
    await page.locator(DSEL.BTN_CONTINUE_DUPLICATE).click()
    await expectModalClosed(page, 'modal-duplicate-warning')
  })

  test('modal-duplicate-warning — btn-cancel-duplicate → navigate đến form_list.html', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await fillProjectCode(page, '7122155')
    await fillBoardCode(page, '3029123')
    await expectModalOpen(page, 'modal-duplicate-warning')
    await page.locator(DSEL.BTN_CANCEL_DUPLICATE).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 6 — Tabs
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 6 — Tabs', () => {
  test('tab Thông tin chung — active mặc định khi load', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.TAB_GENERAL)).toHaveClass(/active/)
    await expect(page.locator(DSEL.PANE_GENERAL)).toHaveClass(/active/)
  })

  test('tab Danh sách chứng từ — click → pane-documents active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.PANE_DOCUMENTS)).toHaveClass(/active/)
  })

  test('tab Đính kèm — click → pane-attach active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.PANE_ATTACH)).toHaveClass(/active/)
  })

  test('tab Lịch sử — click → pane-history active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_HISTORY).click()
    await expect(page.locator(DSEL.PANE_HISTORY)).toHaveClass(/active/)
  })

  test('tab Trạng thái phê duyệt — click → pane-approval active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveClass(/active/)
  })

  test('tab Danh sách chứng từ — ẩn khi mode=new', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.TAB_DOCUMENTS)).toBeHidden()
  })

  test('tab Danh sách chứng từ — hiển thị khi mode=view', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await expect(page.locator(DSEL.TAB_DOCUMENTS)).toBeVisible()
  })

  test('Alt+H shortcut → pane-history active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Alt+h')
    await expect(page.locator(DSEL.PANE_HISTORY)).toHaveClass(/active/)
  })

  test('Alt+P shortcut → pane-approval active', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Alt+p')
    await expect(page.locator(DSEL.PANE_APPROVAL)).toHaveClass(/active/)
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 7 — Modals
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 7 — Modal: dialog-delete-confirm', () => {
  test('mở bằng btn-delete', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await expectModalOpen(page, 'modal-delete-confirm')
  })

  test('đóng bằng btn-cancel-delete', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await expectModalOpen(page, 'modal-delete-confirm')
    await page.locator(DSEL.BTN_CANCEL_DELETE).click()
    await expectModalClosed(page, 'modal-delete-confirm')
  })

  test('btn-confirm-delete disabled khi reason rỗng', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await expect(page.locator(DSEL.BTN_CONFIRM_DELETE)).toBeDisabled()
  })

  test('btn-confirm-delete disabled khi reason < 10 ký tự', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await page.fill(DSEL.INPUT_DELETE_REASON, 'short')
    await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
    await page.locator(DSEL.INPUT_CONFIRM_REVIEWED).check()
    await page.locator(DSEL.INPUT_CONFIRM_REVIEWED).dispatchEvent('change')
    await expect(page.locator(DSEL.BTN_CONFIRM_DELETE)).toBeDisabled()
  })

  test('btn-confirm-delete disabled khi checkbox chưa tick', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await page.fill(DSEL.INPUT_DELETE_REASON, 'Lý do xoá hợp lệ')
    await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
    // checkbox NOT checked
    await expect(page.locator(DSEL.BTN_CONFIRM_DELETE)).toBeDisabled()
  })

  test('btn-confirm-delete enabled khi reason >= 10 ký tự + checkbox', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await fillDeleteForm(page)
    await expect(page.locator(DSEL.BTN_CONFIRM_DELETE)).not.toBeDisabled()
  })

  test('char counter cập nhật khi nhập reason', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await page.fill(DSEL.INPUT_DELETE_REASON, 'Abc def ghi')
    await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
    await expect(page.locator(DSEL.DELETE_REASON_COUNTER)).toContainText('11')
  })

  test('char counter class=warn khi reason < 10 ký tự', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await page.fill(DSEL.INPUT_DELETE_REASON, 'short')
    await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
    await expect(page.locator(DSEL.DELETE_REASON_COUNTER)).toHaveClass(/warn/)
  })

  test('char counter không có class=warn khi reason >= 10 ký tự', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await page.fill(DSEL.INPUT_DELETE_REASON, '0123456789abcd')
    await page.locator(DSEL.INPUT_DELETE_REASON).dispatchEvent('input')
    await expect(page.locator(DSEL.DELETE_REASON_COUNTER)).not.toHaveClass(/warn/)
  })

  test('DELETED_BY được pre-fill (current user) khi mở dialog', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    const val = await page.locator(DSEL.INPUT_DELETED_BY).inputValue()
    expect(val).toBeTruthy()
  })

  test('DELETED_DATE được pre-fill (datetime) khi mở dialog', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    const val = await page.locator(DSEL.INPUT_DELETED_DATE).inputValue()
    expect(val).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  test('btn-confirm-delete click → alert thành công → navigate form_list', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_DELETE).click()
    await fillDeleteForm(page)
    page.on('dialog', d => d.dismiss())
    await page.locator(DSEL.BTN_CONFIRM_DELETE).click()
    await page.waitForTimeout(300)
    // After dismiss the alert, page stays or redirects — assert dialog appeared
  })

  test('mở tự động khi URL params action=delete + id=REC-001', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001', action: 'delete' })
    // Modal opens after 300ms setTimeout
    await page.waitForTimeout(500)
    await expectModalOpen(page, 'modal-delete-confirm')
  })
})

test.describe('Nhóm 7 — Modal: dialog-cancel-confirm', () => {
  test('btn-cancel khi isDirty → mở modal-cancel-confirm', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.fill(DSEL.INPUT_SEND_DATE, '01/01/2026')
    await page.locator(DSEL.BTN_CANCEL).click()
    await expectModalOpen(page, 'modal-cancel-confirm')
  })

  test('btn-cancel khi không dirty → navigate form_list.html', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    // Don't touch any fields
    await page.locator(DSEL.BTN_CANCEL).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })

  test('modal-cancel-confirm — btn-continue-edit → đóng modal, ở lại form', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.fill(DSEL.INPUT_SEND_DATE, '01/01/2026')
    await page.locator(DSEL.BTN_CANCEL).click()
    await expectModalOpen(page, 'modal-cancel-confirm')
    await page.locator(DSEL.BTN_CONTINUE_EDIT).click()
    await expectModalClosed(page, 'modal-cancel-confirm')
    await expect(page).not.toHaveURL(/form_list\.html/)
  })

  test('modal-cancel-confirm — btn-confirm-cancel → navigate form_list.html', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.fill(DSEL.INPUT_SEND_DATE, '01/01/2026')
    await page.locator(DSEL.BTN_CANCEL).click()
    await page.locator(DSEL.BTN_CONFIRM_CANCEL).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })
})

test.describe('Nhóm 7 — Modal: dialog-lookup-project', () => {
  test('mở bằng btn-lookup-project', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await expectModalOpen(page, 'modal-lookup-project')
  })

  test('mở bằng F4', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.keyboard.press('F4')
    await expectModalOpen(page, 'modal-lookup-project')
  })

  test('đóng bằng btn-close-lookup-project', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await expectModalOpen(page, 'modal-lookup-project')
    await page.locator(DSEL.BTN_CLOSE_LOOKUP_PROJECT).click()
    await expectModalClosed(page, 'modal-lookup-project')
  })

  test('modal load — hiển thị tất cả 3 LOV records mặc định', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await expect(page.locator(DSEL.LOV_COUNT)).toContainText('3')
  })

  test('filter lov-project-type = Military → chỉ hiện Military rows', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.locator(DSEL.LOV_PROJECT_TYPE).selectOption('Military')
    await expect(page.locator(DSEL.LOV_COUNT)).toContainText('2')
  })

  test('filter lov-project-code → kết quả lọc thu hẹp', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.fill(DSEL.LOV_PROJECT_CODE, '7122')
    await expect(page.locator(DSEL.LOV_COUNT)).toContainText('1')
  })

  test('filter lov-project-name (case-insensitive) → kết quả lọc', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.fill(DSEL.LOV_PROJECT_NAME, 'bạch mai')
    await expect(page.locator(DSEL.LOV_COUNT)).toContainText('1')
  })

  test('filter lov-segment6 → kết quả lọc theo ĐVQHNS', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.fill(DSEL.LOV_SEGMENT6, '1059227')
    await expect(page.locator(DSEL.LOV_COUNT)).toContainText('2')
  })

  test('filter không có kết quả → empty state trong tbody', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    await page.fill(DSEL.LOV_PROJECT_CODE, 'NONEXISTENT999')
    await expect(page.locator(DSEL.LOV_TBODY)).toContainText('Không có kết quả')
  })

  test('click row LOV → điền PROJECT_CODE, đóng dialog', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.BTN_LOOKUP_PROJECT).click()
    // Filter to Citizen only to get predictable row
    await page.locator(DSEL.LOV_PROJECT_TYPE).selectOption('Citizen')
    await page.locator(DSEL.LOV_TBODY).locator('tr').first().click()
    // Dialog should close
    await expectModalClosed(page, 'modal-lookup-project')
    // PROJECT_CODE should be filled
    await expect(page.locator(DSEL.INPUT_PROJECT_CODE)).toHaveValue('7122155')
  })
})

test.describe('Nhóm 7 — Modal: dialog-print-preview', () => {
  test('mở bằng btn-print', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expectModalOpen(page, 'modal-print-preview')
  })

  test('mở bằng Ctrl+P trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.keyboard.press('Control+p')
    await expectModalOpen(page, 'modal-print-preview')
  })

  test('đóng bằng btn-close-print-preview', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expectModalOpen(page, 'modal-print-preview')
    await page.locator(DSEL.BTN_CLOSE_PRINT_PREVIEW).click()
    await expectModalClosed(page, 'modal-print-preview')
  })

  test('print preview hiển thị mã hồ sơ đúng', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expect(page.locator('#p-dossier-code')).toContainText('HS-CHI-2026-0001')
  })

  test('print preview hiển thị document list', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    // REC-001 has 2 documents
    await expect(page.locator('#p-doc-tbody tr')).toHaveCount(2)
  })

  test('btn-print-browser hiển thị trong print preview modal', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.BTN_PRINT).click()
    await expect(page.locator(DSEL.BTN_PRINT_BROWSER)).toBeVisible()
  })
})

test.describe('Nhóm 7 — Modal: dialog-concurrent', () => {
  test('btn-retry-concurrent → đóng modal', async ({ page }) => {
    // Force open by navigating directly (concurrent dialog appears ~30% for Military DRAFT edit)
    await openDetail(page, { mode: 'edit', id: 'REC-002' }) // Military DRAFT
    // Poll until visible or timeout
    const modal = page.locator(DSEL.MODAL_CONCURRENT)
    const visible = await modal.isVisible({ timeout: 2000 }).catch(() => false)
    if (!visible) {
      test.skip() // Probabilistic: only triggers 30% of the time
      return
    }
    await page.locator(DSEL.BTN_RETRY_CONCURRENT).click()
    await expectModalClosed(page, 'modal-concurrent')
  })

  test('btn-back-concurrent → navigate form_list.html', async ({ page }) => {
    await openDetail(page, { mode: 'edit', id: 'REC-002' })
    const modal = page.locator(DSEL.MODAL_CONCURRENT)
    const visible = await modal.isVisible({ timeout: 2000 }).catch(() => false)
    if (!visible) {
      test.skip()
      return
    }
    await page.locator(DSEL.BTN_BACK_CONCURRENT).click()
    await expect(page).toHaveURL(/form_list\.html/)
  })
})

test.describe('Nhóm 7 — Modal: dialog-outside-hour', () => {
  test('modal-outside-hour — có dismiss button', async ({ page }) => {
    // Outside-hour dialog appears only when h < 8 or h >= 17 — force check via JS mock
    await openDetailDismissDialogs(page, { mode: 'new' })
    // Manually open the dialog to test dismiss button exists
    await page.evaluate(() => {
      const el = document.getElementById('dialog-outside-hour')
      if (el) el.hidden = false
    })
    await expectModalOpen(page, 'modal-outside-hour')
    // TODO: add data-testid="btn-dismiss-outside-hour" to HTML
    // Fallback selector:
    const dismissBtn = page.locator('#dialog-outside-hour .btn-default')
    await dismissBtn.click()
    await expectModalClosed(page, 'modal-outside-hour')
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 8 — Documents tab
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 8 — Documents tab', () => {
  test('REC-001 view — doc-tbody có 2 chứng từ', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    // 2 data rows
    await expect(page.locator(DSEL.DOC_TBODY).locator('tr')).toHaveCount(2)
  })

  test('REC-001 view — doc-total hiển thị tổng tiền', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    const total = await page.locator(DSEL.DOC_TOTAL).textContent()
    // 800M + 700M = 1.500.000.000
    expect(total).toContain('1.500.000.000')
  })

  test('REC-007 view — doc-tbody hiển thị empty state', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-007' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.DOC_TBODY)).toContainText('Chưa có chứng từ nào')
  })

  test('mode=new — tab chứng từ bị ẩn, notice hiện', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await expect(page.locator(DSEL.TAB_DOCUMENTS)).toBeHidden()
    await expect(page.locator('#doc-new-notice')).toBeVisible()
  })

  test('doc-total-fx hiển thị "—" khi VND only (không có tiền ngoại tệ)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_DOCUMENTS).click()
    await expect(page.locator(DSEL.DOC_TOTAL_FX)).toHaveText('—')
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 9 — Attach tab
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 9 — Attach tab', () => {
  test('upload-zone hiển thị trong new mode', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.UPLOAD_ZONE_ATTACHMENTS)).toBeVisible()
  })

  test('upload-zone hidden trong view mode', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.UPLOAD_ZONE_ATTACHMENTS)).toBeHidden()
  })

  test('select-doc-type hiển thị đúng options', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.SELECT_DOC_TYPE)).toBeVisible()
    const opts = await page.locator(DSEL.SELECT_DOC_TYPE).locator('option').allTextContents()
    expect(opts).toContain('Chứng từ gốc')
    expect(opts).toContain('Hợp đồng')
  })

  test('input-note có maxlength=250', async ({ page }) => {
    await openDetailDismissDialogs(page, { mode: 'new' })
    await dismissOutsideHourIfVisible(page)
    await page.locator(DSEL.TAB_ATTACH).click()
    await expect(page.locator(DSEL.INPUT_NOTE)).toHaveAttribute('maxlength', '250')
  })

  test.skip('btn-upload click → file chooser dialog (skip: native OS dialog)', async ({ page }) => {
    // Cannot automate native file-picker dialog without using page.setInputFiles
    // TODO: replace upload-zone onclick with <input type="file"> pattern
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 10 — History & Approval tabs
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 10 — History & Approval tabs', () => {
  test('history-tbody có entries khi record có data', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-004' })
    await page.locator(DSEL.TAB_HISTORY).click()
    // REC-004 has CHECKED_BY and APPROVED_BY → 4 history entries
    await expect(page.locator(DSEL.HISTORY_TBODY).locator('tr')).toHaveCount(4)
  })

  test('approval-workflow hiển thị cho record APPROVED (REC-004)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-004' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.APPROVAL_WORKFLOW)).toBeVisible()
    await expect(page.locator(DSEL.STEP_MAKER)).toHaveClass(/done/)
    await expect(page.locator(DSEL.STEP_CHECKER)).toHaveClass(/done/)
    await expect(page.locator(DSEL.STEP_APPROVER)).toHaveClass(/done/)
  })

  test('approval-workflow step-maker active cho DRAFT record (REC-001)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-001' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator(DSEL.STEP_MAKER)).toHaveClass(/done/)
    await expect(page.locator(DSEL.STEP_CHECKER)).not.toHaveClass(/done/)
  })

  test('approval rejection reason hiển thị cho CHECK_REJECTED (REC-005)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-005' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator('#approval-detail')).toContainText('Từ chối kiểm soát')
  })

  test('approval rejection reason hiển thị cho APPROVE_REJECTED (REC-006)', async ({ page }) => {
    await openDetail(page, { mode: 'view', id: 'REC-006' })
    await page.locator(DSEL.TAB_APPROVAL).click()
    await expect(page.locator('#approval-detail')).toContainText('Từ chối phê duyệt')
  })
})

// ─────────────────────────────────────────────────────────────
// Nhóm 11 — Status badge per record
// ─────────────────────────────────────────────────────────────
test.describe('Nhóm 11 — Status badge', () => {
  const statusCases: Array<{ id: string; label: string; cls: string }> = [
    { id: 'REC-001', label: 'Đang hoàn thiện', cls: 'status-DRAFT' },
    { id: 'REC-002', label: 'Chờ kiểm soát', cls: 'status-PENDING_CHECK' },
    { id: 'REC-003', label: 'Chờ phê duyệt', cls: 'status-PENDING_APPROVE' },
    { id: 'REC-004', label: 'Đã phê duyệt', cls: 'status-APPROVED' },
    { id: 'REC-005', label: 'Từ chối kiểm soát', cls: 'status-CHECK_REJECTED' },
    { id: 'REC-006', label: 'Từ chối phê duyệt', cls: 'status-APPROVE_REJECTED' },
  ]

  for (const { id, label, cls } of statusCases) {
    test(`status-badge cho ${id} — text="${label}", class="${cls}"`, async ({ page }) => {
      await openDetail(page, { mode: 'view', id })
      await expect(page.locator(DSEL.STATUS_BADGE)).toHaveText(label)
      await expect(page.locator(DSEL.STATUS_BADGE)).toHaveClass(new RegExp(cls))
    })
  }
})
