# /gen-mock — Generate mock server routes from an OpenAPI YAML

Tự động mở rộng `mock-server/server.js` với Express routes mới và tạo seed data JSON,
dựa trên một file OpenAPI YAML và (tuỳ chọn) file mock data `.ts` hiện có.

**Cách dùng:** `/gen-mock <yaml-file-path> [<mock-data-ts-file>]`

**Ví dụ:**
- `/gen-mock vdbas_exp_fe/api-contract/capex-dossier-api.yaml vdbas_exp_fe/src/pages/FormList.mock.ts`
- `/gen-mock vdbas_exp_fe/api-contract/some-other-api.yaml`

---

## Bước thực hiện

### 1. Đọc context hiện có

Đọc tất cả các file sau trước khi làm gì khác:

```
$ARGUMENTS
```

Parse arguments: `<yaml-path> [<mock-ts-path>]`

- Đọc `mock-server/server.js` — để hiểu pattern hiện tại (helpers, cấu trúc routes, __reset)
- Đọc file YAML tại `<yaml-path>`
- Nếu có `<mock-ts-path>`, đọc file đó để lấy seed data sẵn có

### 2. Xác định tên module

Lấy tên module từ **path segment đầu tiên** trong YAML (ví dụ `/capex-dossier` → `capex-dossiers`).
- Dùng tên này làm tên file data: `<module>.json`, `<module>.seed.json`
- Nếu YAML có nhiều nhóm tags (ví dụ Dossier + MasterData), tách thành từng file JSON riêng

### 3. Tạo seed data JSON

**Quy tắc chuyển đổi:**
- Field names: **camelCase** (theo đúng tên trong YAML schema `properties`)
- Ngày: `"YYYY-MM-DD"` cho `format: date`, ISO 8601 `"YYYY-MM-DDTHH:mm:ss.000Z"` cho `format: date-time`
- Số tiền VND: dùng số nguyên (không có decimal)
- Thêm `"deleted": false` và `"version": 0` vào mỗi record hỗ trợ soft-delete / optimistic lock
- Thêm `"documents": []`, `"attachments": []`, `"approvalHistory": []` nếu schema `DossierDetail` có nested arrays
- Tạo **tối thiểu 5–7 records** phủ đầy đủ các trạng thái enum (ví dụ: DRAFT, PENDING_CHECK, APPROVED, REJECTED...)
- Nếu có `<mock-ts-path>`, convert data từ file đó (map SCREAMING_SNAKE_CASE → camelCase, convert date format)
- ID dùng pseudo-UUID: `"00000001-0000-0000-0000-000000000000"` tăng dần

**Tạo file:**
- `mock-server/data/<module>.json` — dữ liệu runtime (sẽ bị ghi đè khi POST /__reset)
- `mock-server/data/<module>.seed.json` — bản gốc để reset (copy y hệt)
- `mock-server/data/<master-resource>.json` — cho mỗi master data endpoint (users, projects, v.v.)

### 4. Sinh Express routes

Đọc từng `path` trong YAML, map sang Express route theo các pattern sau:

#### GET list với query params (search/filter/sort/page)
```js
app.get('/api/v1/<path>', (req, res) => {
  const all = read('<module>.json').filter(r => !r.deleted)
  const { page = 0, size = 20, sortField = 'CREATED_DATE', sortDir = 'desc', ...filters } = req.query
  let list = [...all]

  // Filter: text fields dùng .includes() (case-insensitive), enum fields dùng ===
  // Date range: if (fromDate) list = list.filter(r => r[dateField]?.slice(0, 10) >= fromDate)

  // Sort
  const SORT_FIELD = { /* map SCREAMING_CASE → camelCase fields */ }
  const sf = SORT_FIELD[sortField] || 'createdDate'
  list.sort((a, b) => {
    const cmp = String(a[sf] ?? '').localeCompare(String(b[sf] ?? ''))
    return sortDir === 'desc' ? -cmp : cmp
  })

  const pageNum  = Number(page)
  const pageSize = Number(size)
  const totalElements = list.length
  const totalPages    = Math.ceil(totalElements / pageSize) || 0
  // Project chỉ các fields thuộc SummarySchema (bỏ nested arrays)
  const content = list.slice(pageNum * pageSize, (pageNum + 1) * pageSize).map(r => ({ ...summaryFields }))
  res.json({ content, totalElements, totalPages })
})
```

#### POST search (body thay vì query params — convention của project này)
Nếu YAML dùng `POST /<resource>/search` với body, dùng `req.body` thay `req.query`, giữ nguyên logic filter.

#### Static sub-paths (export, v.v.) — **PHẢI đặt TRƯỚC `/:id`**
```js
app.get('/api/v1/<path>/export', (_req, res) => {
  res.status(202).json({ jobId: uuid(), message: 'Export đang xử lý, email sẽ được gửi khi hoàn thành.' })
})
```

#### POST create
```js
app.post('/api/v1/<path>', (req, res) => {
  const records = read('<module>.json')
  const record = {
    <idField>: uuid(),
    <codeField>: generateCode(records), // e.g. `HS-CHI-${year}-${seq}`
    ...req.body,
    createdBy: 'mockuser', createdDate: now(),
    updatedBy: 'mockuser', updatedDate: now(),
    version: 0, deleted: false,
    documents: [], attachments: [], approvalHistory: [],
  }
  // Enrich từ master data nếu cần (lookup project name, user name...)
  records.push(record)
  write('<module>.json', records)
  res.status(201).json(record)
})
```

#### GET /:id
```js
app.get('/api/v1/<path>/:id', (req, res) => {
  const r = read('<module>.json').find(r => r.<idField> === req.params.id)
  if (!r || r.deleted) return res.status(404).json({ message: 'Không tìm thấy', errorCode: 'NOT_FOUND' })
  res.json(r)
})
```

#### PUT /:id (với version check)
```js
app.put('/api/v1/<path>/:id', (req, res) => {
  const records = read('<module>.json')
  const idx = records.findIndex(r => r.<idField> === req.params.id)
  if (idx === -1 || records[idx].deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  // Validate state nếu chỉ cho phép update ở trạng thái nhất định
  if (req.body.version !== undefined && req.body.version !== records[idx].version) {
    return res.status(409).json({ message: 'Dữ liệu đã thay đổi, vui lòng tải lại', errorCode: 'VERSION_CONFLICT' })
  }
  records[idx] = { ...records[idx], ...req.body, updatedBy: 'mockuser', updatedDate: now(), version: records[idx].version + 1 }
  write('<module>.json', records)
  res.json(records[idx])
})
```

#### DELETE /:id (soft delete)
```js
app.delete('/api/v1/<path>/:id', (req, res) => {
  // Validate req.body nếu schema yêu cầu (deleteReason, confirmReviewed...)
  records[idx].deleted   = true
  records[idx].stateCode = 'DELETED'  // nếu có stateCode
  records[idx].updatedDate = now()
  write('<module>.json', records)
  res.status(204).send()
})
```

#### POST /:id/submit (state transition đơn giản)
```js
app.post('/api/v1/<path>/:id/submit', (req, res) => {
  // Validate stateCode === 'DRAFT' trước khi transition
  records[idx].stateCode = 'PENDING_CHECK'
  records[idx].version   = records[idx].version + 1
  write(...)
  res.json({ ok: true, stateCode: 'PENDING_CHECK' })
})
```

#### POST /:id/workflow (state machine)
```js
const WORKFLOW_TRANSITIONS = {
  PENDING_CHECK:   { CHECK: 'PENDING_APPROVE', REJECT: 'CHECK_REJECTED',   RETURN: 'CHECK_CANCELLED' },
  PENDING_APPROVE: { APPROVE: 'APPROVED',      REJECT: 'APPROVE_REJECTED', RETURN: 'APPROVE_CANCELLED' },
}

app.post('/api/v1/<path>/:id/workflow', (req, res) => {
  const { action, reason } = req.body ?? {}
  const transitions = WORKFLOW_TRANSITIONS[records[idx].stateCode]
  if (!transitions?.[action]) return res.status(400).json({ message: '...', errorCode: 'INVALID_TRANSITION' })
  if ((action === 'REJECT' || action === 'RETURN') && (!reason || reason.length < 10)) {
    return res.status(400).json({ message: 'Lý do phải có ít nhất 10 ký tự' })
  }
  // Cập nhật stateCode, set audit fields (checkedBy/approvedBy...), push vào approvalHistory
  // append { logId: uuid(), actionUser, actionDate: now(), actionRole, stateCode: newState, reason }
})
```

#### GET /:id/sub-resource (nested array)
```js
app.get('/api/v1/<path>/:id/<sub>', (req, res) => {
  const r = read('<module>.json').find(r => r.<idField> === req.params.id)
  if (!r || r.deleted) return res.status(404).json({ message: 'Không tìm thấy' })
  res.json(r.<subArray> ?? [])
})
```

#### POST /:id/attachments (multipart — không cần parse thực)
```js
app.post('/api/v1/<path>/:id/attachments', (req, res) => {
  let buf = Buffer.alloc(0)
  req.on('data', chunk => { buf = Buffer.concat([buf, chunk]) })
  req.on('end', () => {
    const att = { archiveId: uuid(), fileName: 'uploaded_file.pdf', archiveType: 'OTHER',
                  description: null, archiveDate: now().slice(0, 10),
                  createdBy: 'mockuser', createdDate: now(), updatedBy: null, updatedDate: null }
    records[idx].attachments.push(att)
    write('<module>.json', records)
    res.status(201).json(att)
  })
})
```

#### DELETE /:id/sub-resource/:subId
```js
app.delete('/api/v1/<path>/:id/<sub>/:subId', (req, res) => {
  const subIdx = (records[idx].<subArray> ?? []).findIndex(s => s.<subIdField> === req.params.subId)
  if (subIdx === -1) return res.status(404).json({ message: 'Không tìm thấy' })
  records[idx].<subArray>.splice(subIdx, 1)
  write('<module>.json', records)
  res.status(204).send()
})
```

#### GET master data (LOV)
```js
app.get('/api/v1/master-data/<resource>', (req, res) => {
  const all = read('master-data-<resource>.json')
  let list = [...all]
  // Filter by keyword (username + fullname) hoặc các query params khác
  res.json(list)
})
```

### 5. Thêm uuid() helper nếu chưa có

Check xem `mock-server/server.js` đã có `function uuid()` chưa. Nếu chưa, thêm sau `function now()`:

```js
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
```

### 6. Cập nhật __reset endpoint

Thêm constant seed mới và update handler để reset module mới:

```js
const <MODULE>_SEED = JSON.parse(readFileSync(join(__dirname, 'data', '<module>.seed.json'), 'utf8'))

app.post('/__reset', (req, res) => {
  const { scope } = req.query
  if (!scope || scope === 'category-groups') write('category-groups.json', SEED_DATA)
  if (!scope || scope === '<module>') write('<module>.json', <MODULE>_SEED)
  res.json({ ok: true })
})
```

Nếu `__reset` đã có dạng này (với `scope`), chỉ cần thêm dòng mới vào.

### 7. Cập nhật startup logging

Trong `app.listen(...)`, thêm các dòng `console.log` cho routes mới.

---

## Checklist trước khi xong

- [ ] Tất cả paths trong YAML đã có route tương ứng
- [ ] Static paths (như `/export`) đứng **TRƯỚC** `/:id`
- [ ] Seed JSON validate được (không có trailing comma, đúng format ngày)
- [ ] `__reset` reset được module mới (dùng `?scope=<module>` để test riêng)
- [ ] Startup logging đã bao gồm routes mới
