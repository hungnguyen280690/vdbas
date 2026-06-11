# CODING_RULES — vdbas FE (React + TypeScript)

---

## ⚠️ Gotchas — đọc trước

```
State management : React Query (@tanstack/react-query) — KHÔNG Redux/Zustand
HTTP client      : Axios wrapper tại shared/services/api.ts (get/post/put/del)
Auth             : JWT lưu localStorage key "kc_token"
Permission       : PermissionContext — hasApiPermission(path, method)
i18n             : react-i18next, useTranslation() → t()
UI lib           : Ant Design (antd)
```

---

## 1. Cấu trúc thư mục thực tế

```
src/
├── app/              ← App.tsx, providers root
├── modules/
│   ├── chi_dt/       ← module domain (pages/ bên trong)
│   └── chi_tx/
├── shared/
│   ├── components/   ← UI dùng chung (PascalCase.tsx)
│   ├── contexts/     ← AuthContext, PermissionContext
│   ├── hooks/        ← useDebounce, useMetadata, useAcl
│   ├── models/       ← class constant (CategoryGroup.ts)
│   ├── services/     ← api.ts (axios), aclService.ts, metadataService.ts
│   ├── types/        ← index.ts — toàn bộ interface/type
│   ├── lib/          ← queryClient.ts
│   ├── locales/      ← vi.json, en.json
│   └── utils/        ← treeUtils.ts
└── viewer/           ← màn hình public (không cần login)
```

**Không có** `core/`, `store/` global, Redux — đừng tạo.

---

## 2. Đặt tên file

| Loại | Convention thực tế | Ví dụ |
|------|-------------------|-------|
| Page | `PascalCase.tsx` | `CategoryGroupsPage.tsx` |
| Component | `PascalCase.tsx` | `CategoryGroupFormModal.tsx` |
| Hook tổng hợp (query+mutation) | `use[Domain].ts` (hoặc `[Domain]Hooks`) | `useAcl.ts` |
| Service (API call) | `[domain]Service.ts` | `aclService.ts` |
| Types | `index.ts` trong `shared/types/` | |
| Model/constant | `PascalCase.ts` | `CategoryGroup.ts` |

---

## 3. API Layer

**Tất cả API call đi qua wrapper tại `shared/services/api.ts`:**

```ts
import { get, post, put, del } from '@/shared/services/api'

// search — luôn POST + body (khớp BE convention)
export const listItems = (params = {}) => post('/items/search', params)
export const getItem   = (id: string)  => get(`/items/${id}`)
export const createItem = (data: ItemPayload) => post('/items', data)
export const updateItem = (id: string, data: ItemPayload) => put(`/items/${id}`, data)
export const deleteItem = (id: string) => del(`/items/${id}`)
```

**ACL/permission API** dùng `aclGet` từ cùng file (trỏ `VITE_ACL_API_BASE_URL`).

**Error handling:** interceptor trong `api.ts` tự xử lý — parse `error.message` từ BE, show toast nếu có `errorCode` match i18n key. Trong hook/page chỉ cần:
```ts
try {
  await mutation.mutateAsync(data)
} catch (error: unknown) {
  if ((error as Record<string, unknown>)._handled) return  // đã có toast
  message.error(translate('common.update_fail'))           // fallback
}
```

---

## 4. React Query Hooks Pattern

Gom query + mutation theo domain vào 1 object trong `shared/hooks/`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const ItemHooks = {
  useList: (params = {}) =>
    useQuery<PagedResponse<ItemRecord>>({
      queryKey: ['items', 'list', params],
      queryFn:  () => listItems(params),
      staleTime: 30_000,
    }),

  useCreate: (options: MutationHookOptions<ItemRecord, ItemPayload> = {}) => {
    const qc = useQueryClient()
    const { skipNotification, onSuccess: callerOnSuccess } = options
    return useMutation<ItemRecord, Error, ItemPayload>({
      mutationFn: (data) => createItem(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: ['items'] })
        if (!skipNotification) message.success(i18n.t('common.create_success'))
        callerOnSuccess?.(data, variables, context)
      },
    })
  },

  useDelete: (options: MutationHookOptions<void, string> = {}) => {
    const qc = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (id) => deleteItem(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['items'] })
        if (!options.skipNotification) message.success(i18n.t('common.delete_success'))
      },
    })
  },
}
```

**Rules:**
- `queryKey` luôn bắt đầu bằng domain string: `['items', ...]`
- Invalidate sau mỗi mutation
- `skipNotification` option để caller tự xử lý toast khi cần

---

## 5. Page Component Pattern

```tsx
const MyPage: React.FC = () => {
  // 1. i18n
  const { t } = useTranslation()

  // 2. Permissions
  const { hasApiPermission } = usePermissions()
  const canCreate = hasApiPermission('/api/items', 'POST')
  const canUpdate = hasApiPermission('/api/items', 'PUT')
  const canDelete = hasApiPermission('/api/items', 'DELETE')

  // 3. Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1, pageSize: 10, total: 0,
  })

  // 4. Filter state — 2 lớp: inputFilters (UI) + filters (đã commit, drive query)
  const [filters,      setFilters]      = useState<FilterState>(defaultFilters)
  const [inputFilters, setInputFilters] = useState<InputFilterState>(defaultInputFilters)

  // 5. Query params — memoized, page là 0-based cho BE
  const queryParams = useMemo(() => ({
    page: pagination.current - 1,
    size: pagination.pageSize,
    ...filters,
  }), [pagination, filters])

  // 6. Query
  const { data, isLoading } = ItemHooks.useList(queryParams)

  // 7. Mutations
  const deleteMutation = ItemHooks.useDelete()

  // 8. Derived
  const items = data?.content ?? []
  const total = data?.totalElements ?? 0

  useEffect(() => {
    setPagination(prev => ({ ...prev, total }))
  }, [total])

  // 9. Handlers
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    setFilters(prev => ({ ...prev, ...inputFilters }))
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)._handled) return
      message.error(t('common.delete_fail'))
    }
  }

  return ( /* JSX */ )
}
```

---

## 6. Types — tất cả trong `shared/types/index.ts`

```ts
// Paged response từ BE
export interface PagedResponse<T> {
  content?: T[]
  totalElements?: number
}

// Pagination state UI
export interface PaginationState {
  current:  number
  pageSize: number
  total:    number
}

// Mutation hook options
export interface MutationHookOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void
  skipNotification?: boolean
}
```

Không định nghĩa interface rải rác trong từng file — đưa về `shared/types/index.ts`.

---

## 7. Model Constants

Dùng class với static field thay vì string literal rải rác:

```ts
// shared/models/CategoryGroup.ts
export class CategoryGroup {
  static readonly GROUP_CODE = 'groupCode'
  static readonly GROUP_NAME = 'groupName'
  static readonly IS_ACTIVE  = 'active'
  static readonly DELETED    = 'deleted'
}

// Dùng trong column definition
{ dataIndex: CategoryGroup.GROUP_CODE, key: CategoryGroup.GROUP_CODE }
```

---

## 8. Permission Guard

```tsx
// Ẩn button/action theo permission API
const canCreate = hasApiPermission('/api/category-groups', 'POST')

{canCreate && <Button onClick={handleCreate}>Thêm mới</Button>}
```

Path phải khớp **chính xác** với `@RequestMapping` trong BE controller.

---

## Quick Reference

| Đúng | Sai |
|------|-----|
| React Query (`useQuery/useMutation`) | Redux Toolkit cho server state |
| `post('/items/search', params)` | `get('/items?...')` cho search |
| 2 lớp filter state (input + committed) | 1 state filter vừa drive UI vừa drive query |
| `page: pagination.current - 1` | `page: pagination.current` (BE 0-based) |
| `if (_handled) return` trước fallback error | show toast kép |
| Types trong `shared/types/index.ts` | Interface rải rác trong từng file |
| `hasApiPermission('/api/...', 'POST')` | Check permission bằng role string |
| `qc.invalidateQueries({ queryKey: ['items'] })` | Reload page / manual refetch |
