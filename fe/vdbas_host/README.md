# Vdbas_host app — Micro Frontend Host

Vdbas_host App là host trung tâm tích hợp các micro frontend theo Webpack Module Federation.

---

## Cấu trúc project

```
src/
├── index.ts              # Entry point (async import bắt buộc)
├── bootstrap.tsx         # Khởi động React
├── App.tsx               # Provider tree
├── global.d.ts           # TypeScript shims cho Webpack MF
│
├── auth/
│   ├── types.ts          # AuthState, AuthContextValue
│   ├── authService.ts    # Login, refresh token, JWT decode
│   └── AuthProvider.tsx  # Context + auto token refresh
│
├── permissions/
│   ├── types.ts          # PermissionManifest, AppPermission
│   ├── permissionService.ts  # Fetch manifest từ API
│   ├── PermissionProvider.tsx # Context + helpers
│   └── PermissionGuard.tsx   # HOC bảo vệ route/UI
│
├── registry/
│   ├── moduleRegistry.ts # Dynamic remote loading
│   ├── mockRegistry.ts   # Mock remote URLs
│   └── RemoteLoader.tsx  # Lazy wrapper + ErrorBoundary + IFrameRemote
│
├── router/
│   └── AppRouter.tsx     # Routes động từ manifest
│
├── layout/
│   ├── Shell.tsx         # Layout chính
│   ├── Sidebar.tsx       # Nav động từ manifest
│   ├── Header.tsx        # Breadcrumb + actions
│   └── LoadingScreen.tsx
│
├── pages/
│   ├── LoginPage.tsx
│   ├── ForbiddenPage.tsx
│   └── NotFoundPage.tsx
│
└── styles/
    └── global.css        # Design tokens + reset
```

---

## Bắt đầu nhanh

```bash
npm install
npm start        # http://localhost:3000
```

**Demo login:** `admin@demo.com` / `demo`

---

## Tích hợp backend thật

### 1. Auth API

```
POST /api/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token }

POST /api/auth/refresh
  Body: { refresh_token }
  Response: { access_token, refresh_token }

POST /api/auth/logout
  Body: { refresh_token }
```

Sau đó xoá mock trong `src/auth/authService.ts`.

### 2. Permission API

```
GET /api/permissions/manifest
  Headers: Authorization: Bearer <token>
  Response: {
    apps: [
      {
        key: "hrm",
        label: "Nhân sự",
        icon: "people",
        color: "#6366f1",
        features: [
          {
            key: "employee",
            label: "Quản lý nhân viên",
            icon: "person",
            actions: ["view", "create", "edit", "delete"]
          }
        ]
      }
    ]
  }
```

Xoá mock trong `src/permissions/permissionService.ts`.

### 3. Module Registry API

```
GET /api/module-registry
  Headers: Authorization: Bearer <token>
  Response: [
    { name: "hrm", url: "https://hrm.company.com/remoteEntry.js", type: "module-federation" },
    { name: "oracle-erp", url: "", type: "iframe", iframeUrl: "https://oracle.company.com/module" }
  ]
```

Xoá mock trong `src/registry/moduleRegistry.ts` và `src/registry/mockRegistry.ts`.

---

## Thêm Remote App mới

### Phía Remote App

```js
// webpack.config.js của remote app
new ModuleFederationPlugin({
  name: 'hrm',               // Phải khớp với key trong registry
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',    // Entry point chính
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true, requiredVersion: '^6.22.0' },
  },
})
```

### Phía Backend

Thêm entry vào Permission API và Module Registry API. Shell tự động render nav và route mà **không cần rebuild**.

---

## Sử dụng PermissionGuard

```tsx
import { PermissionGuard } from '@/permissions/PermissionGuard';

// Bảo vệ toàn bộ page
<PermissionGuard app="hrm">
  <HrmPage />
</PermissionGuard>

// Bảo vệ feature
<PermissionGuard app="hrm" feature="payroll">
  <PayrollPage />
</PermissionGuard>

// Bảo vệ action (ẩn nút nếu không có quyền)
<PermissionGuard app="hrm" feature="employee" action="delete">
  <DeleteButton />
</PermissionGuard>

// Custom fallback
<PermissionGuard app="hrm" feature="reports" fallback={<UpgradePrompt />}>
  <ReportsPage />
</PermissionGuard>
```

---

## Biến môi trường

```env
REACT_APP_API_BASE=https://api.company.com
```

---

## Shared dependencies

Shell khai báo `eager: true` cho react, react-dom, react-router-dom. Remote apps khai báo các package này là `singleton` (không `eager`). Điều này đảm bảo chỉ có 1 instance React chạy trong toàn hệ thống.

Nếu version conflict xảy ra, Webpack sẽ warning trong console — cần align version giữa Shell và tất cả remote apps.
