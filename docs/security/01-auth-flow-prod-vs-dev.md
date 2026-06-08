# Luồng Xác Thực (Authentication Flow) - Môi Trường Production & Development

Tài liệu này mô tả chi tiết luồng xác thực của hệ thống VDBAS, đặc biệt là cách các Backend Microservices xử lý request thông qua `GatewayAuthFilter`.

## 1. Môi trường Production (Môi trường thật)

Trong môi trường Production, bảo mật được thắt chặt. Hệ thống áp dụng cơ chế **Gateway Authentication Offloading** (Đẩy việc xác thực ra Gateway) kết hợp với **Shared Secret** (Bí mật chia sẻ) để chống việc bypass Gateway.

### Cấu hình bắt buộc
*   API Gateway và các Backend Microservices phải được cấu hình chung một mã bí mật thông qua biến môi trường: `app.gateway.internal-token` (ví dụ: `super_secret_12345`). Mã này không bao giờ được lộ ra public.

### Luồng xử lý request
1.  **Client Request:** Client (Frontend/Mobile) gửi HTTP Request kèm header `Authorization: Bearer <JWT_TOKEN>` đến API Gateway.
2.  **Gateway Verify Token:** API Gateway chặn request lại, mang JWT Token đi xác thực với Identity Provider (ví dụ: Keycloak). Gateway kiểm tra chữ ký, thời hạn, và quyền hạn của token.
3.  **Gateway Inject Headers:** Nếu JWT hợp lệ, Gateway bóc tách thông tin định danh của user và tạo ra các Headers nội bộ:
    *   `X-User-Id: <user_id>` (Thông tin user)
    *   `X-Internal-Token: super_secret_12345` (Mã bí mật chia sẻ để chứng minh request đến từ Gateway).
    Sau đó, Gateway forward request (cùng các headers này) xuống Backend Microservice tương ứng.
4.  **Backend Filter (GatewayAuthFilter):**
    *   Backend nhận request. Filter sẽ kiểm tra sự tồn tại và tính hợp lệ của header `X-Internal-Token`.
    *   **Thành công:** Nếu mã bí mật khớp, Backend tin tưởng request, đọc `X-User-Id` để set `SecurityContext` (đăng nhập thành công) và xử lý logic nghiệp vụ.
    *   **Thất bại:** Nếu có ai đó cố tình gọi trực tiếp vào Backend (bỏ qua Gateway) hoặc Gateway truyền sai mã bí mật, Backend sẽ từ chối ngay lập tức với lỗi `401 Unauthorized` (Thông báo: *"Request must be forwarded through the API Gateway"*).

---

## 2. Môi trường Development (Môi trường phát triển / Local)

Trong môi trường Development, để tạo điều kiện thuận lợi cho lập trình viên (không cần phải cài đặt toàn bộ API Gateway hoặc liên tục lấy JWT token để test API), hệ thống mở một "cửa hậu" (Dev Mode) một cách có chủ đích.

### Cấu hình
*   Biến môi trường `app.gateway.internal-token` được **bỏ trống** (hoặc không khai báo). Theo cấu hình `@Value("${app.gateway.internal-token:}")`, Spring Boot sẽ gán giá trị rỗng (`""`).

### Luồng xử lý request
1.  **Client/Script Request:** Lập trình viên hoặc script test (như `test_all_apis.py`) gửi HTTP Request **trực tiếp** vào cổng của Backend (ví dụ: `localhost:8081`).
2.  **Mock Headers:** Request chỉ cần đính kèm header định danh, ví dụ: `X-User-Id: system_admin`. Không cần JWT Token, không cần qua Gateway.
3.  **Backend Filter (GatewayAuthFilter) Bỏ Qua Kiểm Tra:**
    *   Filter nhận request. Do biến `expectedInternalToken` (đọc từ cấu hình) đang là rỗng, logic kiểm tra `X-Internal-Token` bị **bỏ qua hoàn toàn**.
    *   Filter trực tiếp đọc header `X-User-Id` có trong request.
4.  **Chấp Nhận Request:** Backend coi request này là hợp lệ, set `SecurityContext` cho user `system_admin` và tiến hành xử lý logic bình thường.

### Tổng kết
Chính nhờ cơ chế "bỏ qua kiểm tra mã bí mật khi cấu hình rỗng" này mà các script test chạy thẳng vào Backend ở môi trường local vẫn hoạt động trơn tru mà không bị lỗi `401 Unauthorized`.
