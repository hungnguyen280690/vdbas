# Kiến Trúc Bảo Mật - Môi Trường Production & Development

Tài liệu này giải thích kiến trúc bảo mật tổng thể của hệ thống VDBAS (đặc biệt là khối Backend) và lý do tại sao hệ thống hoạt động khác biệt giữa môi trường Production và Development.

## 1. Kiến Trúc Tổng Thể: Gateway Authentication Offloading

Hệ thống VDBAS được thiết kế theo kiến trúc Microservices. Để tối ưu hóa hiệu suất và tập trung quản lý bảo mật, kiến trúc sư đã áp dụng pattern **Gateway Authentication Offloading**.

*   **Vấn đề:** Nếu mỗi Microservice (Exp, QuanTri,...) tự mình kiểm tra JWT Token (gọi lên IAM Server như Keycloak, parse token, verify signature,...), hệ thống sẽ bị chậm, tốn resource và code bị lặp lại ở khắp nơi.
*   **Giải pháp:** Giao toàn bộ việc "gác cổng" và "kiểm tra vé" (JWT Token) cho **API Gateway** (như IBM DataPower, Kong).
    *   Gateway sẽ chặn mọi request từ Internet, kiểm tra token.
    *   Nếu token đúng, Gateway dịch token đó thành các Header HTTP đơn giản (ví dụ: `X-User-Id`) và chuyển xuống các Microservices nội bộ.
    *   Các Microservices nằm sâu bên trong mạng nội bộ hoàn toàn tin tưởng Gateway. Chúng chỉ cần đọc Header `X-User-Id` là biết ai đang thao tác, xử lý cực kỳ nhanh gọn.

## 2. Kiến Trúc Trên Môi Trường Production

Trên Production, các Backend Microservices chạy phía sau API Gateway. Tuy nhiên, kiến trúc này sinh ra một rủi ro bảo mật nghiêm trọng: **Bypass Gateway**.

*   **Rủi ro:** Điều gì xảy ra nếu hacker lọt được vào mạng nội bộ (hoặc vô tình expose port backend), gọi thẳng vào IP/Port của Backend và tự truyền header `X-User-Id: admin`? Backend sẽ mù quáng tin tưởng và thực thi lệnh của hacker.
*   **Kiến trúc bảo vệ (Shared Secret):** Để giải quyết rủi ro này, kiến trúc Production thêm một lớp bảo vệ gọi là **Shared Secret** (Mã bí mật chia sẻ).
    *   Cả Gateway và Backend đều được cấu hình chung một mã bí mật (qua biến `app.gateway.internal-token`).
    *   Chỉ khi request đi qua Gateway, Gateway mới nhúng mã bí mật này vào header `X-Internal-Token` trước khi chuyển xuống Backend.
    *   Backend (`GatewayAuthFilter`) bắt buộc phải thấy mã bí mật này thì mới cho phép truy cập. Mọi request gọi trực tiếp từ bên ngoài (không có mã bí mật) sẽ bị từ chối.

## 3. Kiến Trúc Trên Môi Trường Development

Trên môi trường Development, ưu tiên hàng đầu là sự tiện lợi và tốc độ phát triển. Việc bắt ép các lập trình viên phải dựng API Gateway nội bộ hoặc liên tục sinh JWT Token hợp lệ chỉ để test một API cục bộ là quá rườm rà.

*   **Sự thích ứng kiến trúc (Dev Mode):** Kiến trúc hệ thống linh hoạt tự động chuyển đổi sang "Dev Mode" dựa trên cấu hình môi trường.
    *   Trên Dev, biến `app.gateway.internal-token` không được thiết lập (giá trị rỗng).
    *   Code trong `GatewayAuthFilter` được thiết kế thông minh:
        ```java
        // Nếu cấu hình rỗng, bỏ qua kiểm tra Shared Secret
        if (!expectedInternalToken.isBlank()) {
            // ... logic chặn bảo mật ...
        }
        ```
    *   Hệ thống gỡ bỏ lớp bảo vệ Shared Secret. Mọi request gọi thẳng vào Backend chỉ cần cung cấp `X-User-Id` là được chấp nhận.

## 4. Giải Thích Lý Do Script Test Hoạt Động

Lý do script Python (`test_all_apis.py`) chạy thành công (gọi thẳng vào Backend Port 8081) mà không dính lỗi bảo mật `401 Unauthorized` là do sự kết hợp của 2 yếu tố kiến trúc trên môi trường Dev:

1.  **Token Offloading:** Backend không đòi hỏi JWT Token (`Authorization: Bearer...`) mà chỉ mong đợi các Custom Headers. Script test đã truyền đúng header cần thiết:
    ```python
    HEADERS = {
        "X-User-Id": "system_admin",
        # ...
    }
    ```
2.  **Dev Mode Bypass:** Do không cấu hình biến `app.gateway.internal-token` ở môi trường Dev, `GatewayAuthFilter` đã tắt cơ chế kiểm tra **Shared Secret**. Code backend tin tưởng hoàn toàn vào header `X-User-Id` được gửi từ script Python mà không yêu cầu request đó phải đi qua Gateway.

Kiến trúc này đảm bảo tính bảo mật tuyệt đối trên Production nhưng vẫn giữ được sự linh hoạt tối đa cho đội ngũ phát triển.
