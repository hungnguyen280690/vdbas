import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ strict: false }))  // strict: false cho phép parse boolean/null body (dùng bởi toggle active)

// ── Helpers ───────────────────────────────────────────────────────────────────

const dataPath = (file) => join(__dirname, 'data', file)
const read     = (file) => JSON.parse(readFileSync(dataPath(file), 'utf8'))
const write    = (file, data) => writeFileSync(dataPath(file), JSON.stringify(data, null, 2))

function fakeJwt(payload) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`
}

function now() { return new Date().toISOString() }

// ── Mock auth token (used by host VITE_MOCK_AUTH=true) ────────────────────────

app.get('/api/mock/token', (_req, res) => {
  res.json({
    token: fakeJwt({
      sub: 'mock-user-001',
      name: 'Mock User',
      email: 'mock@example.com',
      preferred_username: 'mockuser',
      given_name: 'Mock',
      family_name: 'User',
      realm_access: { roles: ['admin', 'user'] },
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  })
})

// ── Host: GET /api/me/apps ────────────────────────────────────────────────────

app.get('/api/me/apps', (_req, res) => {
  res.json(read('me-apps.json'))
})

// ── ACL: GET /api/me/menus  GET /api/me/apis ──────────────────────────────────

app.get('/api/me/menus', (_req, res) => res.json(read('me-menus.json')))
app.get('/api/me/apis',  (_req, res) => res.json(read('me-apis.json')))

// ── Category Groups ───────────────────────────────────────────────────────────

app.post('/api/v1/category-groups/search', (req, res) => {
  const all  = read('category-groups.json')
  const { page = 0, size = 10, groupCode, groupName, status, active, deleted, sort } = req.body ?? {}

  // Support cả `status` string (legacy) và `active`/`deleted` boolean (app hiện tại)
  const showDeleted  = status === 'deleted'  || deleted === true
  const filterActive = status === 'active'   || active  === true
  const filterInactive = status === 'inactive' || (active === false && deleted !== true)

  let list = showDeleted
    ? all.filter((g) => g.deleted)
    : all.filter((g) => !g.deleted)

  if (groupCode) list = list.filter((g) => g.groupCode.toLowerCase().includes(groupCode.toLowerCase()))
  if (groupName) list = list.filter((g) => g.groupName.toLowerCase().includes(groupName.toLowerCase()))
  if (filterActive)   list = list.filter((g) => g.active)
  if (filterInactive) list = list.filter((g) => !g.active)

  if (sort) {
    const [field, dir] = sort.split(',')
    list = [...list].sort((a, b) => {
      const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''))
      return dir === 'desc' ? -cmp : cmp
    })
  }

  const totalElements = list.length
  const content = list.slice(page * size, (page + 1) * size)
  res.json({ content, totalElements })
})

app.get('/api/v1/category-groups/:groupCode', (req, res) => {
  const group = read('category-groups.json').find((g) => g.groupCode === req.params.groupCode)
  return group ? res.json(group) : res.status(404).json({ message: 'Không tìm thấy' })
})

app.post('/api/v1/category-groups', (req, res) => {
  const groups = read('category-groups.json')
  if (groups.find((g) => g.groupCode === req.body.groupCode)) {
    return res.status(409).json({ message: 'Mã nhóm đã tồn tại', errorCode: 'DUPLICATE_CODE' })
  }
  const record = {
    ...req.body,
    active: req.body.active ?? true,
    deleted: false,
    system: req.body.system ?? false,
    createdBy: 'mockuser',
    createdAt: now(),
    updatedBy: 'mockuser',
    updatedAt: now(),
  }
  groups.push(record)
  write('category-groups.json', groups)
  res.status(201).json(record)
})

app.put('/api/v1/category-groups/:groupCode', (req, res) => {
  const groups = read('category-groups.json')
  const idx    = groups.findIndex((g) => g.groupCode === req.params.groupCode)
  if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy' })
  groups[idx] = { ...groups[idx], ...req.body, updatedBy: 'mockuser', updatedAt: now() }
  write('category-groups.json', groups)
  res.json(groups[idx])
})

// body is the raw boolean (axios puts true/false directly)
app.put('/api/v1/category-groups/:groupCode/active', (req, res) => {
  const groups  = read('category-groups.json')
  const idx     = groups.findIndex((g) => g.groupCode === req.params.groupCode)
  if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy' })
  const isActive = typeof req.body === 'boolean' ? req.body : Boolean(req.body)
  groups[idx] = { ...groups[idx], active: isActive, updatedBy: 'mockuser', updatedAt: now() }
  write('category-groups.json', groups)
  res.json(groups[idx])
})

app.delete('/api/v1/category-groups/:groupCode', (req, res) => {
  const groups = read('category-groups.json')
  const idx    = groups.findIndex((g) => g.groupCode === req.params.groupCode)
  if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy' })
  groups[idx].deleted   = true
  groups[idx].updatedAt = now()
  write('category-groups.json', groups)
  res.status(204).send()
})

// ── Test helpers (chỉ dùng trong E2E test) ───────────────────────────────────

const SEED_DATA = JSON.parse(readFileSync(join(__dirname, 'data', 'category-groups.seed.json'), 'utf8'))

app.post('/__reset', (_req, res) => {
  write('category-groups.json', SEED_DATA)
  res.json({ ok: true })
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 9090
app.listen(PORT, () => {
  console.log(`Mock server: http://localhost:${PORT}`)
  console.log('  GET  /api/mock/token')
  console.log('  GET  /api/me/apps')
  console.log('  GET  /api/me/menus')
  console.log('  GET  /api/me/apis')
  console.log('  POST /api/v1/category-groups/search')
  console.log('  CRUD /api/v1/category-groups/:groupCode')
})
