import { test, expect, type Page } from '@playwright/test'
import { setMockAuth } from '../helpers/auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function gotoPage(page: Page) {
  await setMockAuth(page)
  await page.goto('/')
  // Click menu item "Nhóm danh mục" để navigate
  await page.getByText('Nhóm danh mục').click()
  // Đợi table load xong
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('DM_DONVI')).toBeVisible()
}

// Reset data về seed sau mỗi test write — tránh test pollution
test.afterEach(async ({ request }) => {
  await request.post('http://localhost:9090/__reset')
})

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('CategoryGroups — hiển thị', () => {
  test('load được danh sách từ mock server', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByText('DM_DONVI')).toBeVisible()
    await expect(page.getByText('Đơn vị')).toBeVisible()
    await expect(page.getByText('DM_LOAI_KP')).toBeVisible()
  })

  test('không hiển thị bản ghi đã xoá mặc định', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByText('DM_CU')).not.toBeVisible()
  })
})

test.describe('CategoryGroups — tìm kiếm và lọc', () => {
  test('tìm theo mã nhóm', async ({ page }) => {
    await gotoPage(page)
    await page.getByPlaceholder(/mã nhóm/i).fill('DM_DONVI')
    await page.getByRole('button', { name: /tìm kiếm/i }).click()
    await expect(page.getByText('DM_DONVI')).toBeVisible()
    await expect(page.getByText('DM_LOAI_KP')).not.toBeVisible()
  })

  test('tìm theo tên nhóm', async ({ page }) => {
    await gotoPage(page)
    await page.getByPlaceholder(/tên nhóm/i).fill('kinh phí')
    await page.getByRole('button', { name: /tìm kiếm/i }).click()
    await expect(page.getByText('DM_LOAI_KP')).toBeVisible()
    await expect(page.getByText('DM_DONVI')).not.toBeVisible()
  })

  test('lọc trạng thái inactive', async ({ page }) => {
    await gotoPage(page)
    await page.getByRole('combobox', { name: 'status-filter' }).click()
    await page.locator('.ant-select-dropdown').getByText('Ngưng hoạt động').click()
    await page.getByRole('button', { name: /tìm kiếm/i }).click()
    await expect(page.getByText('DM_NGAN_SACH')).toBeVisible()
    await expect(page.getByText('DM_DONVI')).not.toBeVisible()
  })

  test('reset bộ lọc trả về danh sách đầy đủ', async ({ page }) => {
    await gotoPage(page)
    await page.getByPlaceholder(/mã nhóm/i).fill('DM_DONVI')
    await page.getByRole('button', { name: /tìm kiếm/i }).click()
    await expect(page.getByText('DM_LOAI_KP')).not.toBeVisible()

    await page.getByRole('button', { name: /làm mới/i }).click()
    await expect(page.getByText('DM_LOAI_KP')).toBeVisible()
  })
})

test.describe('CategoryGroups — CRUD', () => {
  test('tạo mới nhóm danh mục', async ({ page }) => {
    await gotoPage(page)
    await page.getByRole('button', { name: /thêm mới/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    await modal.getByLabel(/mã nhóm/i).fill('TEST_NEW')
    await modal.getByLabel(/tên nhóm/i).fill('Nhóm Test Tự Động')
    await page.getByRole('button', { name: /lưu|xác nhận|ok/i }).click()

    await expect(page.getByText('TEST_NEW')).toBeVisible()
    await expect(page.getByText('Nhóm Test Tự Động')).toBeVisible()
  })

  test('tạo mới với mã trùng báo lỗi', async ({ page }) => {
    await gotoPage(page)
    await page.getByRole('button', { name: /thêm mới/i }).click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel(/mã nhóm/i).fill('DM_DONVI')
    await modal.getByLabel(/tên nhóm/i).fill('Trùng mã')
    await page.getByRole('button', { name: /lưu|xác nhận|ok/i }).click()

    // Toast hoặc message lỗi xuất hiện
    await expect(page.getByText(/đã tồn tại|duplicate/i)).toBeVisible({ timeout: 5_000 })
  })

  test('chỉnh sửa nhóm danh mục', async ({ page }) => {
    await gotoPage(page)

    // Click nút edit trên hàng DM_NGUON_VON
    const row = page.getByRole('row', { name: /DM_NGUON_VON/ })
    await row.getByRole('button').filter({ hasText: '' }).first().click() // icon button edit

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel(/mã nhóm/i)).toHaveValue('DM_NGUON_VON')

    await modal.getByLabel(/tên nhóm/i).fill('Nguồn vốn (đã sửa)')
    await page.getByRole('button', { name: /lưu|xác nhận|ok/i }).click()

    await expect(page.getByText('Nguồn vốn (đã sửa)')).toBeVisible()
  })

  test('xoá nhóm danh mục', async ({ page }) => {
    await gotoPage(page)

    const row = page.getByRole('row', { name: /DM_NGUON_VON/ })
    // Click nút xoá — mở Popconfirm
    await row.getByRole('button').last().click()

    // Xác nhận Popconfirm
    await page.getByRole('button', { name: /có|đồng ý|ok/i }).last().click()

    await expect(page.getByText('DM_NGUON_VON')).not.toBeVisible()
  })

  test('toggle active/inactive', async ({ page }) => {
    await gotoPage(page)

    // DM_DONVI đang active — toggle thành inactive
    const row = page.getByRole('row', { name: /DM_DONVI/ })
    const toggle = row.getByRole('switch')
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(toggle).not.toBeChecked()
  })
})

test.describe('CategoryGroups — phân quyền', () => {
  test('ẩn nút thêm mới khi không có quyền POST', async ({ page }) => {
    // Override API permissions — xoá quyền POST
    await page.route('**/api/me/apis**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { path: '/api/category-groups/{groupCode}', method: 'GET' },
        ]),
      })
    })

    await gotoPage(page)
    await expect(page.getByRole('button', { name: /thêm mới/i })).not.toBeVisible()
  })

  test('ẩn nút xoá khi không có quyền DELETE', async ({ page }) => {
    await page.route('**/api/me/apis**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { path: '/api/category-groups/search', method: 'POST' },
          { path: '/api/category-groups', method: 'POST' },
          { path: '/api/category-groups/{groupCode}', method: 'GET' },
          { path: '/api/category-groups/{groupCode}', method: 'PUT' },
          { path: '/api/category-groups/{groupCode}/active', method: 'PUT' },
          // DELETE bị bỏ
        ]),
      })
    })

    await gotoPage(page)
    const row = page.getByRole('row', { name: /DM_DONVI/ })
    // Nút xoá không tồn tại trong row
    await expect(row.getByTitle(/xoá/i)).not.toBeVisible()
  })
})
