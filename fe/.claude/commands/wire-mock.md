# /wire-mock — Wire mock server into a page component

Thay thế import dữ liệu tĩnh từ `.mock.ts` bằng React Query hooks gọi mock server,
với tối thiểu thay đổi JSX (dùng adapter để giữ nguyên field names nội bộ).

**Cách dùng:** `/wire-mock <page-file.tsx> [<second-page-file.tsx>]`

**Ví dụ:**
- `/wire-mock vdbas_exp_fe/src/pages/FormList.tsx vdbas_exp_fe/src/pages/FormDetail.tsx`
- `/wire-mock vdbas_exp_fe/src/pages/SomePage.tsx`

---

## Context cần đọc trước

Đọc lần lượt để hiểu đủ trước khi sửa:

```
$ARGUMENTS
```

1. Từng file page trong `$ARGUMENTS`
2. File `.mock.ts` mà page đó import (tìm dòng `import ... from './*.mock'`)
3. `src/services/<module>Service.ts` và `src/hooks/use<Module>.ts` — kiểm tra service/hook đã có chưa
4. `src/types/index.ts` — kiểm tra types đã đủ chưa
5. `.env.mock` — xác nhận `VITE_API_BASE_URL`
6. `mock-server/server.js` — xác nhận endpoint đã có trên mock server

Nếu service hoặc hook chưa tồn tại → tạo mới theo CLAUDE.md pattern trước khi wire.

---

## Phân tích trước khi sửa

Với mỗi file page, xác định:

| Câu hỏi | Tìm trong code |
|---------|----------------|
| Mock data nào được dùng? | `import { MOCK_DATA, ... } from './*.mock'` |
| Field names có khớp API không? | So sánh interface mock.ts với types/index.ts |
| Dùng static array làm LOV? | `USER_LOV`, `LOV01_DATA`, v.v. |
| Filter/sort/pagination: client hay server? | Tìm `.filter()`, `.sort()`, `.slice()` trên toàn bộ records |
| Mutations nào cần wire? | `onSave`, `onDelete`, `onSubmit`, `onWorkflow`... |
| Đang dùng `alert()`/`confirm()` thay API? | Tìm `alert(`, `window.alert(`, `confirm(` trong handlers |

---

## Quyết định kiến trúc

### Khi nào dùng Adapter pattern vs refactor field names?

**Dùng Adapter** (ưu tiên) khi:
- Page đang dùng SCREAMING_SNAKE_CASE từ mock.ts
- Thay đổi field names sẽ ảnh hưởng nhiều dòng JSX, data-testid, data-api-field
- Chỉ muốn wire data layer, layout giữ nguyên

```ts
// Adapter: API camelCase → nội bộ SCREAMING_SNAKE_CASE
function toRecord(d: DossierSummary): DossierRecord {
  return {
    id: d.dossierId,
    DOSSIER_CODE: d.dossierCode,
    SEND_DATE: d.sendDate,
    STATE_CODE: d.stateCode as DossierStatus,
    PROJECT_CODE: d.projectCode,
    PROJECT_NAME: d.projectName,
    // ... map hết các field
  }
}
```

**Refactor field names trực tiếp** khi:
- Page đang trong giai đoạn xây dựng, chưa nhiều JSX
- Đang tạo page mới (không có mock.ts cũ)

---

## Các pattern wiring cụ thể

### Pattern 1 — List page (filter + sort + pagination)

**Có 2 cách:**

**A. Server-side (đúng kiến trúc, ưu tiên):**
- Map filter state của UI → query params của API
- Bỏ client-side `.filter()` / `.sort()` / `.slice()`
- Pagination dùng `data.totalElements` từ API

```ts
// Map filter state UI → API params
const queryParams = useMemo<DossierSearchParams>(() => ({
  page: currentPage - 1,   // BE 0-based
  size: pageSize,
  dossierCode: filters.dossier || undefined,
  stateCode:   filters.st    || undefined,
  dataSourceCode: (filters.src as DataSourceCode) || undefined,
  createdBy:   filters.creator  || undefined,
  checkedBy:   filters.checker  || undefined,
  approvedBy:  filters.approver || undefined,
  dateType:    filters.dateType as DateType,
  fromDate:    filters.fromDate || undefined,
  toDate:      filters.toDate   || undefined,
  sortField:   sortField,
  sortDir:     sortDir,
}), [currentPage, pageSize, filters, sortField, sortDir])

const { data, isLoading, isError } = CapexDossierHooks.useList(queryParams)
const records = (data?.content ?? []).map(toRecord)
const totalItems = data?.totalElements ?? 0
```

Thêm `useEffect` để sync `totalItems` vào pagination state.

**B. Client-side (giữ nguyên logic hiện tại — chỉ dùng khi A quá phức tạp):**
```ts
// Fetch all (không filter server-side) — nhanh wire nhưng không scale
const { data, isLoading } = CapexDossierHooks.useList({ size: 1000 })
const allRecords = (data?.content ?? []).map(toRecord)
// Giữ nguyên .filter() / .sort() / .slice() hiện có, chỉ đổi nguồn data
```

Ghi chú `// TODO: chuyển sang server-side filtering` nếu dùng B.

**Loading state:**
```tsx
// Thêm ở đầu render, TRƯỚC return JSX chính
if (isLoading) return <div className="page-wrapper"><div style={{padding: 40, textAlign: 'center'}}>Đang tải...</div></div>
if (isError)   return <div className="page-wrapper"><div style={{padding: 40, color: 'red'}}>Lỗi tải dữ liệu</div></div>
```

### Pattern 2 — LOV / lookup data (users, projects)

Thay static array bằng hook:

```ts
// Trước: const filteredUserLOV = USER_LOV.filter(...)
// Sau:
const { data: usersData } = MasterDataHooks.useUsers({ keyword: lovUserName, role: lovUserRole as 'Maker' | 'Checker' | 'Approver' || undefined })
const filteredUserLOV = (usersData ?? []).map(u => ({ ...u }))

// LOV dự án (FormDetail):
const { data: projectsData } = MasterDataHooks.useProjects({ code: lovFilters.code, name: lovFilters.name, projectTypeCode: lovFilters.type as 'Military' | 'Citizen' || undefined })
const lovResults = projectsData ?? []
```

Adapter từ `UserInfo` / `ProjectInfo` sang interface nội bộ nếu cần (thêm field aliases).

### Pattern 3 — Detail page (load record by ID)

```ts
// Thay: const record = MOCK_DATA.records.find(r => r.id === initialRecordId)
const { data: apiRecord, isLoading } = CapexDossierHooks.useDetail(initialRecordId ?? '')

// Adapter DossierDetail → DossierRecord nội bộ
const record: DossierRecord | null = apiRecord ? toDetailRecord(apiRecord) : null
```

Hàm `toDetailRecord` map DossierDetail (camelCase + nested documents/attachments) → type nội bộ.

### Pattern 4 — Mutations (save, delete, submit, workflow)

Thay `alert('✔ MSG-OK-...')` bằng mutation thực:

```ts
// Khai báo mutations ở top component
const createMutation  = CapexDossierHooks.useCreate({ skipNotification: false })
const updateMutation  = CapexDossierHooks.useUpdate(record?.dossierId ?? '', { skipNotification: false })
const deleteMutation  = CapexDossierHooks.useDelete()
const submitMutation  = CapexDossierHooks.useSubmit()
const workflowMutation = CapexDossierHooks.useWorkflowAction(record?.dossierId ?? '')

// Wrap handlers thành async và dùng try/catch
async function onSave() {
  if (!validateForm()) return
  try {
    const result = await createMutation.mutateAsync({
      sendDate: toISODate(form.SEND_DATE),      // convert DD/MM/YYYY → YYYY-MM-DD
      projectCode: form.PROJECT_CODE,
      projectSpecificCode: form.PROJECT_SPECIFIC_CODE || null,
      projectManagementCode: form.PROJECT_MANAGEMENT_CODE,
      dataSourceCode: form.DATA_SOURCE_CODE as DataSourceCode,
    })
    setIsDirty(false)
    navigateTo('/capex-dossier', { highlight: result.dossierId })
  } catch (error: unknown) {
    if ((error as Record<string, unknown>)._handled) return
    message.error(t('common.create_fail'))
  }
}

async function onConfirmDelete() {
  try {
    await deleteMutation.mutateAsync({
      id: record!.id,
      data: { deleteReason, confirmReviewed }
    })
    setIsDeleteOpen(false)
    navigateTo('/capex-dossier')
  } catch (error: unknown) {
    if ((error as Record<string, unknown>)._handled) return
    message.error(t('common.delete_fail'))
  }
}
```

**Date conversion helper** (thường cần khi form dùng DD/MM/YYYY):
```ts
function toISODate(dmy: string): string {
  // '15/05/2026' → '2026-05-15'
  const [d, m, y] = dmy.split('/')
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}
function fromISODate(iso: string): string {
  // '2026-05-15' → '15/05/2026'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
```

### Pattern 5 — Remove mock imports khi xong

```ts
// Xóa (hoặc giữ chỉ các type còn dùng):
import { MOCK_DATA, USER_LOV, type DossierRecord, type DossierStatus } from './FormList.mock'
//                ↓ sau khi wire
import type { DossierRecord, DossierStatus } from './FormList.mock'  // giữ type nếu cần adapter
// Hoặc xóa hẳn và dùng type từ types/index.ts
```

---

## Checklist sau khi wire

- [ ] `npm run dev:mock` chạy được (cần mock server đang chạy: `cd mock-server && npm run dev`)
- [ ] Danh sách hiển thị data từ mock server (không phải static)
- [ ] Filter/tìm kiếm gọi API (hoặc lọc từ data fetch về)
- [ ] Các LOV (user, project) lấy từ API
- [ ] Tạo mới → gọi POST và redirect về danh sách
- [ ] Xem detail → gọi GET /:id và hiển thị đúng
- [ ] Xóa → gọi DELETE, record biến mất khỏi danh sách sau khi refresh
- [ ] Loading state hiển thị khi đang fetch
- [ ] Không còn `import MOCK_DATA` cho logic chính (chỉ giữ type nếu dùng adapter)
- [ ] TypeScript không có lỗi mới

---

## Cách chạy mock mode

```bash
# Terminal 1 — mock server
cd mock-server && npm run dev

# Terminal 2 — FE app (mode mock dùng .env.mock)
cd vdbas_exp_fe && npm run dev:mock
```

App mở tại `http://localhost:3003` với `VITE_API_BASE_URL=http://localhost:9090/api/v1`.
Auth tự động fetch fake token từ `/api/mock/token`.

Để reset data về trạng thái ban đầu:
```bash
curl -X POST "http://localhost:9090/__reset?scope=capex-dossiers"
```
