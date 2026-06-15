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

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

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

// ── Capex Dossier ─────────────────────────────────────────────────────────────

// NOTE: /export phải đứng TRƯỚC /:id, nếu không Express sẽ match 'export' như một id
app.get('/api/v1/capex-dossier/export', (_req, res) => {
  res.status(202).json({ jobId: uuid(), message: 'Export đang được xử lý, bạn sẽ nhận email thông báo khi hoàn thành.' })
})

app.get('/api/v1/capex-dossier', (req, res) => {
  const all = read('capex-dossiers.json').filter(d => !d.deleted)
  const {
    dossierCode, projectCode, stateCode, dataSourceCode, createdBy, checkedBy, approvedBy,
    dateType = 'SEND_DATE', fromDate, toDate,
    page = 0, size = 20, sortField = 'CREATED_DATE', sortDir = 'desc',
  } = req.query

  let list = [...all]
  if (dossierCode)    list = list.filter(d => d.dossierCode.toLowerCase().includes(dossierCode.toLowerCase()))
  if (projectCode)    list = list.filter(d => d.projectCode.toLowerCase().includes(projectCode.toLowerCase()))
  if (stateCode)      list = list.filter(d => d.stateCode === stateCode)
  if (dataSourceCode) list = list.filter(d => d.dataSourceCode === dataSourceCode)
  if (createdBy)      list = list.filter(d => d.createdBy?.toLowerCase().includes(createdBy.toLowerCase()))
  if (checkedBy)      list = list.filter(d => d.checkedBy?.toLowerCase().includes(checkedBy.toLowerCase()))
  if (approvedBy)     list = list.filter(d => d.approvedBy?.toLowerCase().includes(approvedBy.toLowerCase()))

  const DATE_FIELD = { SEND_DATE: 'sendDate', CREATED_DATE: 'createdDate', CHECKED_DATE: 'checkedDate', APPROVED_DATE: 'approvedDate' }
  const df = DATE_FIELD[dateType] || 'sendDate'
  if (fromDate) list = list.filter(d => d[df] && d[df].slice(0, 10) >= fromDate)
  if (toDate)   list = list.filter(d => d[df] && d[df].slice(0, 10) <= toDate)

  const SORT_FIELD = { DOSSIER_CODE: 'dossierCode', SEND_DATE: 'sendDate', STATE_CODE: 'stateCode', CREATED_BY: 'createdBy', CREATED_DATE: 'createdDate', CHECKED_DATE: 'checkedDate', APPROVED_DATE: 'approvedDate', TOTAL_VND: 'totalAmountVnd' }
  const sf = SORT_FIELD[sortField] || 'createdDate'
  list.sort((a, b) => {
    const cmp = String(a[sf] ?? '').localeCompare(String(b[sf] ?? ''))
    return sortDir === 'desc' ? -cmp : cmp
  })

  const pageNum  = Number(page)
  const pageSize = Number(size)
  const totalElements = list.length
  const totalPages    = Math.ceil(totalElements / pageSize) || 0
  const content = list.slice(pageNum * pageSize, (pageNum + 1) * pageSize).map(d => ({
    dossierId: d.dossierId, dossierCode: d.dossierCode, sendDate: d.sendDate, stateCode: d.stateCode,
    projectCode: d.projectCode, projectName: d.projectName, dataSourceCode: d.dataSourceCode,
    createdBy: d.createdBy, createdDate: d.createdDate,
    checkedBy: d.checkedBy, checkedDate: d.checkedDate,
    approvedBy: d.approvedBy, approvedDate: d.approvedDate,
    checkRejectionReason: d.checkRejectionReason,
    approvalRejectionReason: d.approvalRejectionReason,
    returningReason: d.returningReason,
    totalAmountVnd: d.totalAmountVnd, documentCount: d.documentCount,
  }))

  res.json({ content, totalElements, totalPages })
})

app.post('/api/v1/capex-dossier', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const { sendDate, projectCode, projectSpecificCode = null, projectManagementCode, dataSourceCode = 'Thủ công' } = req.body

  const year = new Date().getFullYear()
  const seq  = String(dossiers.length + 1).padStart(4, '0')

  const record = {
    dossierId: uuid(),
    dossierCode: `HS-CHI-${year}-${seq}`,
    sendDate,
    stateCode: 'DRAFT',
    projectCode,
    projectName: null,
    projectSpecificCode,
    projectSpecificName: null,
    projectManagementCode,
    projectManagementName: null,
    dataSourceCode,
    createdBy: 'mockuser',
    createdDate: now(),
    updatedBy: 'mockuser',
    updatedDate: now(),
    checkedBy: null, checkedDate: null,
    approvedBy: null, approvedDate: null,
    checkRejectionReason: null, approvalRejectionReason: null, returningReason: null,
    totalAmountVnd: 0,
    documentCount: 0,
    version: 0,
    deleted: false,
    documents: [], attachments: [], approvalHistory: [],
  }

  const projects = read('master-data-projects.json')
  const proj = projects.find(p => p.projectCode === projectCode &&
    (!projectSpecificCode || p.projectSpecificCode === projectSpecificCode))
  if (proj) {
    record.projectName         = proj.projectName
    record.projectSpecificName = proj.projectSpecificName ?? null
    record.projectManagementName = proj.projectManagementName
  }

  dossiers.push(record)
  write('capex-dossiers.json', dossiers)
  res.status(201).json(record)
})

app.get('/api/v1/capex-dossier/:id', (req, res) => {
  const d = read('capex-dossiers.json').find(d => d.dossierId === req.params.id)
  if (!d || d.deleted) return res.status(404).json({ message: 'Không tìm thấy', errorCode: 'NOT_FOUND' })
  res.json(d)
})

app.put('/api/v1/capex-dossier/:id', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  if (dossiers[idx].stateCode !== 'DRAFT') return res.status(400).json({ message: 'Chỉ có thể sửa hồ sơ ở trạng thái Nháp', errorCode: 'INVALID_STATE' })
  if (req.body.version !== undefined && req.body.version !== dossiers[idx].version) {
    return res.status(409).json({ message: 'Dữ liệu đã thay đổi, vui lòng tải lại trang', errorCode: 'VERSION_CONFLICT' })
  }

  const { sendDate, projectCode, projectSpecificCode, projectManagementCode } = req.body
  const updates = { updatedBy: 'mockuser', updatedDate: now(), version: (dossiers[idx].version ?? 0) + 1 }
  if (sendDate)             updates.sendDate             = sendDate
  if (projectCode)          updates.projectCode          = projectCode
  if (projectSpecificCode !== undefined) updates.projectSpecificCode = projectSpecificCode
  if (projectManagementCode) updates.projectManagementCode = projectManagementCode

  if (projectCode) {
    const projects = read('master-data-projects.json')
    const proj = projects.find(p => p.projectCode === projectCode &&
      (!projectSpecificCode || p.projectSpecificCode === projectSpecificCode))
    if (proj) {
      updates.projectName          = proj.projectName
      updates.projectSpecificName  = proj.projectSpecificName ?? null
      updates.projectManagementName = proj.projectManagementName
    }
  }

  dossiers[idx] = { ...dossiers[idx], ...updates }
  write('capex-dossiers.json', dossiers)
  res.json(dossiers[idx])
})

app.delete('/api/v1/capex-dossier/:id', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  const { deleteReason, confirmReviewed } = req.body ?? {}
  if (!deleteReason || deleteReason.length < 10) {
    return res.status(400).json({ message: 'Lý do xóa phải có ít nhất 10 ký tự', errorCode: 'VALIDATION_ERROR' })
  }
  if (!confirmReviewed) {
    return res.status(400).json({ message: 'Cần xác nhận đã xem xét trước khi xóa', errorCode: 'VALIDATION_ERROR' })
  }
  dossiers[idx].deleted     = true
  dossiers[idx].stateCode   = 'DELETED'
  dossiers[idx].updatedBy   = 'mockuser'
  dossiers[idx].updatedDate = now()
  write('capex-dossiers.json', dossiers)
  res.status(204).send()
})

app.post('/api/v1/capex-dossier/:id/submit', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  if (dossiers[idx].stateCode !== 'DRAFT') {
    return res.status(400).json({ message: 'Chỉ có thể nộp hồ sơ ở trạng thái Nháp', errorCode: 'INVALID_STATE' })
  }
  dossiers[idx].stateCode   = 'PENDING_CHECK'
  dossiers[idx].updatedBy   = 'mockuser'
  dossiers[idx].updatedDate = now()
  dossiers[idx].version     = (dossiers[idx].version ?? 0) + 1
  write('capex-dossiers.json', dossiers)
  res.json({ ok: true, stateCode: 'PENDING_CHECK' })
})

const WORKFLOW_TRANSITIONS = {
  PENDING_CHECK:   { CHECK: 'PENDING_APPROVE', REJECT: 'CHECK_REJECTED',   RETURN: 'CHECK_CANCELLED'   },
  PENDING_APPROVE: { APPROVE: 'APPROVED',      REJECT: 'APPROVE_REJECTED', RETURN: 'APPROVE_CANCELLED' },
}

app.post('/api/v1/capex-dossier/:id/workflow', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })

  const { action, reason } = req.body ?? {}
  const prevState   = dossiers[idx].stateCode
  const transitions = WORKFLOW_TRANSITIONS[prevState]
  if (!transitions?.[action]) {
    return res.status(400).json({ message: `Không thể thực hiện "${action}" ở trạng thái "${prevState}"`, errorCode: 'INVALID_TRANSITION' })
  }
  if ((action === 'REJECT' || action === 'RETURN') && (!reason || reason.length < 10)) {
    return res.status(400).json({ message: 'Lý do phải có ít nhất 10 ký tự', errorCode: 'VALIDATION_ERROR' })
  }

  const newState = transitions[action]
  dossiers[idx].stateCode   = newState
  dossiers[idx].updatedDate = now()
  dossiers[idx].version     = (dossiers[idx].version ?? 0) + 1

  const isCheckerAction   = prevState === 'PENDING_CHECK'
  const actionUser = isCheckerAction ? 'mockchecker' : 'mockapprover'
  const actionRole = isCheckerAction ? 'Checker' : 'Approver'

  if (action === 'CHECK')   { dossiers[idx].checkedBy  = actionUser; dossiers[idx].checkedDate  = now() }
  if (action === 'APPROVE') { dossiers[idx].approvedBy = actionUser; dossiers[idx].approvedDate = now() }
  if (action === 'REJECT' && isCheckerAction)   dossiers[idx].checkRejectionReason    = reason
  if (action === 'REJECT' && !isCheckerAction)  dossiers[idx].approvalRejectionReason = reason
  if (action === 'RETURN')  dossiers[idx].returningReason = reason

  dossiers[idx].approvalHistory = dossiers[idx].approvalHistory ?? []
  dossiers[idx].approvalHistory.push({
    logId: uuid(), actionUser, actionDate: now(), actionRole, stateCode: newState, reason: reason ?? '',
  })

  write('capex-dossiers.json', dossiers)
  res.json({ ok: true, stateCode: newState })
})

app.get('/api/v1/capex-dossier/:id/documents', (req, res) => {
  const d = read('capex-dossiers.json').find(d => d.dossierId === req.params.id)
  if (!d || d.deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  res.json(d.documents ?? [])
})

app.get('/api/v1/capex-dossier/:id/attachments', (req, res) => {
  const d = read('capex-dossiers.json').find(d => d.dossierId === req.params.id)
  if (!d || d.deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  res.json(d.attachments ?? [])
})

app.post('/api/v1/capex-dossier/:id/attachments', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })

  // Drain multipart body without a parser — just respond with a fake record
  let buf = Buffer.alloc(0)
  req.on('data', chunk => { buf = Buffer.concat([buf, chunk]) })
  req.on('end', () => {
    const attachment = {
      archiveId:   uuid(),
      fileName:    'uploaded_file.pdf',
      archiveType: 'OTHER',
      description: null,
      archiveDate: now().slice(0, 10),
      createdBy:   'mockuser',
      createdDate: now(),
      updatedBy:   null,
      updatedDate: null,
    }
    dossiers[idx].attachments = dossiers[idx].attachments ?? []
    dossiers[idx].attachments.push(attachment)
    write('capex-dossiers.json', dossiers)
    res.status(201).json(attachment)
  })
})

app.delete('/api/v1/capex-dossier/:id/attachments/:attachmentId', (req, res) => {
  const dossiers = read('capex-dossiers.json')
  const idx = dossiers.findIndex(d => d.dossierId === req.params.id)
  if (idx === -1 || dossiers[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  const attachIdx = (dossiers[idx].attachments ?? []).findIndex(a => a.archiveId === req.params.attachmentId)
  if (attachIdx === -1) return res.status(404).json({ message: 'Không tìm thấy tệp đính kèm' })
  dossiers[idx].attachments.splice(attachIdx, 1)
  write('capex-dossiers.json', dossiers)
  res.status(204).send()
})

// ── Master Data ────────────────────────────────────────────────────────────────

app.get('/api/v1/master-data/projects', (req, res) => {
  const all = read('master-data-projects.json')
  const { code, name, projectTypeCode, projectManagementCode } = req.query
  let list = [...all]
  if (code)                  list = list.filter(p => p.projectCode.toLowerCase().includes(code.toLowerCase()))
  if (name)                  list = list.filter(p => p.projectName.toLowerCase().includes(name.toLowerCase()))
  if (projectTypeCode)       list = list.filter(p => p.projectTypeCode === projectTypeCode)
  if (projectManagementCode) list = list.filter(p => p.projectManagementCode === projectManagementCode)
  res.json(list)
})

app.get('/api/v1/master-data/users', (req, res) => {
  const all = read('master-data-users.json')
  const { keyword, role } = req.query
  let list = [...all]
  if (keyword) list = list.filter(u =>
    u.username.toLowerCase().includes(keyword.toLowerCase()) ||
    u.fullname.toLowerCase().includes(keyword.toLowerCase()))
  if (role) list = list.filter(u => u.role === role)
  res.json(list)
})

// ── Test helpers (chỉ dùng trong E2E test) ───────────────────────────────────

const SEED_DATA        = JSON.parse(readFileSync(join(__dirname, 'data', 'category-groups.seed.json'), 'utf8'))
const CAPEX_DOSSIER_SEED = JSON.parse(readFileSync(join(__dirname, 'data', 'capex-dossiers.seed.json'), 'utf8'))

app.post('/__reset', (req, res) => {
  const { scope } = req.query
  if (!scope || scope === 'category-groups') write('category-groups.json', SEED_DATA)
  if (!scope || scope === 'capex-dossiers')  write('capex-dossiers.json', CAPEX_DOSSIER_SEED)
  res.json({ ok: true })
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 9090
app.listen(PORT, () => {
  console.log(`Mock server: http://localhost:${PORT}`)
  console.log('  GET  /api/mock/token')
  console.log('  GET  /api/me/apps | /api/me/menus | /api/me/apis')
  console.log('  POST /api/v1/category-groups/search')
  console.log('  CRUD /api/v1/category-groups/:groupCode')
  console.log('  GET  /api/v1/capex-dossier  (search + filter + sort + page)')
  console.log('  CRUD /api/v1/capex-dossier/:id')
  console.log('  POST /api/v1/capex-dossier/:id/submit')
  console.log('  POST /api/v1/capex-dossier/:id/workflow  (CHECK|APPROVE|REJECT|RETURN)')
  console.log('  GET  /api/v1/capex-dossier/:id/documents')
  console.log('  CRUD /api/v1/capex-dossier/:id/attachments/:attachmentId')
  console.log('  GET  /api/v1/capex-dossier/export')
  console.log('  GET  /api/v1/master-data/projects | /api/v1/master-data/users')
})
