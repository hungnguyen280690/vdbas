# Hướng dẫn Kiến trúc & Tích hợp Micro Frontend (Vdbas-host)

Tài liệu này chi tiết cách hệ thống `vdbas-host` hoạt động và quy trình để tích hợp một ứng dụng con (Remote App) mới vào hệ sinh thái.

---

## 1. Tổng quan Kiến trúc

Hệ thống sử dụng mô hình **Host-Remote** dựa trên **Module Federation (MF)** và **IFrame Injection**.

- **Host (Shell):** Chịu trách nhiệm về Xác thực (Keycloak), Phân quyền, Điều hướng chính (Sidebar/Header), và Tải động các Remote Apps.
- **Remote Apps:** Các ứng dụng độc lập (HRM, ERP, CRM...) được phát triển và triển khai riêng biệt.
- **Registry & Manifest:** Một cơ chế động để đăng ký URL của các Remote Apps và cấu trúc menu/quyền hạn mà không cần build lại Host.

### Luồng hoạt động:
1. Người dùng đăng nhập qua **Keycloak**.
2. Host gọi **Permission API** để lấy `Manifest` (danh sách App, Menu, Action mà user được phép).
3. Host gọi **Registry API** để lấy URL của các `remoteEntry.js` (MF) hoặc `iframeUrl`.
4. **AppRouter** tự động tạo Routes dựa trên Manifest.
5. Khi truy cập vào một Route, **RemoteLoader** sẽ nạp mã nguồn từ Remote App và render vào vùng nội dung chính.

---

## 2. Phương cách Tích hợp Remote App

### Cách 1: Sử dụng Module Federation (Khuyến khích)
Dùng khi Remote App là React/Vue/Angular hiện đại và muốn chia sẻ tài nguyên (shared dependencies).

#### Bước 1: Cấu hình phía Remote App (Vite)
Cài đặt `@module-federation/vite` và cấu hình trong `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'hrm_app', // Tên định danh duy nhất
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx', // Export component chính
      },
      shared: ['react', 'react-dom', 'react-router-dom', 'antd'] // Các lib dùng chung
    })
  ],
  build: {
    target: 'esnext'
  }
});
```

#### Bước 2: Đăng ký tại Host (vdbas-host)
Hiện tại, dự án quản lý thông qua `src/registry/moduleRegistry.ts`. Bạn cần thêm entry:

```typescript
// Ví dụ cấu hình trong Registry API hoặc Mock
{
  name: "hrm", 
  url: "https://hrm-prod.vdbas.com/assets/remoteEntry.js", 
  type: "module-federation" 
}
```

---

### Cách 2: Sử dụng IFrame
Dùng cho các ứng dụng cũ (Legacy), ứng dụng viết bằng ngôn ngữ khác (PHP, Java JSP) hoặc ứng dụng của bên thứ 3.

#### Cách đăng ký:
Chỉ cần cung cấp URL trang web trong Registry:

```typescript
{
  name: "oracle-erp",
  url: "", // Không có file MF
  type: "iframe",
  iframeUrl: "https://oracle-erp.internal.com/dashboard"
}
```
Host sẽ sử dụng `IFrameRemote.tsx` để nhúng ứng dụng này vào Shell.

---

## 3. Hệ thống Phân quyền (Permissions)

Để Remote App xuất hiện trên Sidebar và có Route truy cập, bạn phải cấu hình trong **Permission Manifest**.

### Cấu trúc một App trong Manifest:
```json
{
  "key": "hrm",
  "label": "Nhân sự",
  "icon": "UserOutlined",
  "color": "#1890ff",
  "features": [
    {
      "key": "employee_list",
      "label": "Danh sách nhân viên",
      "path": "/hrm/employees",
      "actions": ["view", "create", "edit", "delete"]
    }
  ]
}
```

---

## 4. Chia sẻ Dữ liệu & Sự kiện

### 4.1. Auth Context
Remote App có thể nhận `token` từ Host thông qua:
- **Props:** Host truyền trực tiếp vào `<RemoteApp token={...} />`.
- **Custom Events:** Sử dụng `window.dispatchEvent` để truyền dữ liệu qua lại giữa Shell và Remote.

### 4.2. Styling
Host sử dụng **Ant Design 6** với CSS Variables. Remote Apps nên tuân thủ các Design Tokens này để giao diện đồng bộ:
- Sử dụng biến màu: `var(--ant-primary-color)`
- Reset CSS: Host đã có `global.css`, Remote nên tránh cài đặt reset global gây xung đột.

---

## 5. Quy trình Triển khai (CI/CD)

1. **Remote App:** Build và đẩy lên Storage (S3/Minio) hoặc Web Server độc lập. Đảm bảo file `remoteEntry.js` có thể truy cập qua CORS.
2. **Registry API:** Cập nhật URL mới của Remote App vào Database.
3. **Host:** Không cần làm gì cả. Người dùng F5 trình duyệt sẽ thấy phiên bản mới nhất của Remote App.

---

## 6. Lưu ý Quan trọng
- **Version Alignment:** Đảm bảo `react` và `react-dom` ở các Remote App không cao hơn version của Host (v19).
- **Z-Index:** Cẩn thận với các Modal/Popover của Remote App khi hiển thị trong Shell.
- **Error Boundary:** Mỗi Remote App khi load sẽ được bao bọc bởi một Error Boundary của Host để tránh làm sập toàn bộ hệ thống nếu App con bị lỗi.
