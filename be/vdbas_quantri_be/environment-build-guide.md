# Hướng dẫn Build và Chạy Ứng dụng theo Môi trường

Tài liệu này hướng dẫn cách build và chạy ứng dụng Spring Boot (đa module) trên các môi trường khác nhau. Dự án hiện tại đã được cấu trúc theo mô hình **12-Factor App**, tức là sử dụng **Biến môi trường (Environment Variables)** thay vì duy trì nhiều file profile (như `application-dev.yml`, `application-prod.yml`).

## 1. Cấu trúc cấu hình
Dự án sử dụng duy nhất file `api/src/main/resources/application.yml` cho tất cả các môi trường. Các giá trị trong file này đã được gán sẵn giá trị mặc định cho môi trường dev/local.
Khi triển khai lên các môi trường khác (Test, Production), bạn chỉ cần thay đổi các biến môi trường tương ứng.

Một số biến môi trường quan trọng:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Cấu hình kết nối cơ sở dữ liệu Oracle.
- `KEYCLOAK_URL`, `KEYCLOAK_INTERNAL_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_SECRET`: Cấu hình Keycloak phục vụ xác thực JWT.
- `CACHE_TYPE`: Loại cache sử dụng (mặc định là `memory`, có thể chuyển sang `redis`).
- `CORS_ALLOWED_ORIGINS`: Tên miền được phép gọi API (CORS).
- `LOG_LEVEL_APP`, `LOG_LEVEL_SQL`: Cấu hình mức độ hiển thị log (Nên để `INFO` và `ERROR` trên Production).

*(Tham khảo thêm file `.env.example` và `docker-compose.yml` để nắm rõ cấu hình đầy đủ).*

## 2. Build ứng dụng
Dự án bao gồm nhiều module (`common`, `domain`, `application`, `api`). Để build toàn bộ dự án, bạn chạy lệnh sau tại thư mục gốc:

```bash
mvn clean install -DskipTests
```
Lệnh này sẽ tiến hành biên dịch tất cả các module và tạo ra file đóng gói cuối cùng tại `api/target/api-0.0.1-SNAPSHOT.jar`.

## 3. Chạy ứng dụng môi trường Development (Dev/Local)
Để tiện lợi cho quá trình phát triển trên hệ điều hành Windows, dự án cung cấp sẵn script `run_dev.bat`.

### 3.1. Chạy thông qua script `run_dev.bat`
Mở Terminal hoặc Command Prompt, chạy lệnh:
```cmd
.\run_dev.bat
```
Script sẽ hiển thị menu tương tác với các tùy chọn:
1. Build và chạy API trực tiếp bằng Maven (Local JVM).
2. Build và deploy service lên Docker (thông qua `docker-compose`).
3. Deploy CHỈ API lên Docker.
4. Tắt tất cả container của dự án (Down).
5. Chỉ Build project (`mvn clean install`).

### 3.2. Chạy thủ công bằng Maven
Nếu không sử dụng script, bạn có thể build và chạy thủ công:
```bash
mvn clean install -DskipTests
cd api
mvn spring-boot:run
```
*(Hệ thống sẽ chạy với cấu hình mặc định (localhost, cổng 8080) được định nghĩa trong `application.yml`)*.

## 4. Chạy ứng dụng môi trường Testing / Production
Trên các môi trường này, ứng dụng thường được chạy qua Docker Compose hoặc chạy trực tiếp bằng file JAR đi kèm với cấu hình biến môi trường.

### Cách 1: Sử dụng Docker Compose (Khuyên dùng)
Bạn cần thiết lập các biến môi trường (hoặc sử dụng file `.env`) và khởi chạy Docker:
```bash
export DB_HOST=10.0.0.5
export DB_NAME=vdbas_prod
export DB_USER=prod_root
export DB_PASSWORD=SecurePassword123
export KEYCLOAK_URL=https://sso.yourdomain.com
export CORS_ALLOWED_ORIGINS=https://your-production-domain.com

docker-compose up -d --build
```

### Cách 2: Chạy trực tiếp file JAR
Nếu triển khai không dùng Docker container, bắt buộc phải truyền biến môi trường vào máy chủ:
```bash
export DB_HOST=10.0.0.5
export DB_NAME=vdbas_prod
export DB_USER=prod_root
export DB_PASSWORD=SecurePassword123
export KEYCLOAK_URL=https://sso.yourdomain.com
export KEYCLOAK_SECRET=YourClientSecret
export CORS_ALLOWED_ORIGINS=https://your-production-domain.com

java -Xms512m -Xmx1g -XX:+UseG1GC -jar api/target/api-0.0.1-SNAPSHOT.jar
```
