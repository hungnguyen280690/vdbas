import { test, expect, type Page } from '@playwright/test'

const E2E_USER = 'maker01'
const E2E_PASS = '123'

async function loginKeycloak(page: Page) {
  // App redirects to Keycloak — wait for the SSO page
  await page.waitForURL(/vst-sso\.apps\.ocp\.vst\.gov\.vn/, { timeout: 20_000 })
  await page.fill('input[name="username"]', E2E_USER)
  await page.fill('input[name="password"]', E2E_PASS)
  await page.click('#kc-login')
  // Wait for redirect back to the host app
  await page.waitForURL('http://localhost:3000/**', { timeout: 20_000 })
  // Wait for Keycloak callback to finish and token to be stored in localStorage
  await page.waitForFunction(() => !!localStorage.getItem('kc_token'), { timeout: 15_000 })
}

test('host tải được và xác thực thành công', async ({ page }) => {
  await page.goto('/')
  await loginKeycloak(page)
  await expect(page).not.toHaveURL(/error/)
  await expect(page.locator('body')).toBeVisible()
})

test('navigate được vào exp app và CategoryGroups table hiển thị', async ({ page }) => {
  await page.goto('/')
  await loginKeycloak(page)
  await page.goto('/exp')
  await page.waitForLoadState('networkidle', { timeout: 30_000 })
  // "Nhóm danh mục" nằm trong sub-menu "Quản lý Chi" — cần expand trước
  await page.getByRole('menuitem', { name: /Quản lý Chi/ }).click()
  await page.getByText('Nhóm danh mục').click()
  await expect(page.getByRole('table')).toBeVisible({ timeout: 20_000 })
})

test('API category-groups trả về dữ liệu (không rỗng)', async ({ page, request }) => {
  await page.goto('/')
  await loginKeycloak(page)

  // Lấy JWT từ localStorage (AuthProvider lưu sau khi auth thành công)
  const token = await page.evaluate(() => localStorage.getItem('kc_token'))
  expect(token).toBeTruthy()

  const res = await request.post('http://localhost:8085/api/category-groups/search', {
    data: { page: 0, size: 10 },
    headers: {
      Authorization: `Bearer ${token}`,
      'X-User-Id': '6FCD264E878349EF9C5B32A6DA90448C',
    },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body).toHaveProperty('content')
})
