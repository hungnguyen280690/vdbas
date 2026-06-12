import type { Page } from '@playwright/test'

// Fake JWT không cần Keycloak — khớp với format AuthContext.tsx parse
function makeFakeJwt() {
  const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header  = b64({ alg: 'none', typ: 'JWT' })
  const payload = b64({
    sub: 'mock-user-001',
    name: 'Mock User',
    email: 'mock@example.com',
    preferred_username: 'mockuser',
    given_name: 'Mock',
    family_name: 'User',
    realm_access: { roles: ['admin', 'user'] },
    exp: Math.floor(Date.now() / 1000) + 86400,
  })
  return `${header}.${payload}.`
}

// Đặt token vào localStorage trước khi app load — tránh màn hình login
export async function setMockAuth(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('kc_token', token)
  }, makeFakeJwt())
}
