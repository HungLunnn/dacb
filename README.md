# Đồ án: Hệ thống Quản lý Thuê Trọ

Tài liệu này mô tả đầy đủ kiến trúc, cấu trúc CSDL, API, cách cài đặt/khởi chạy và tiến trình phát triển hiện tại của đồ án để lập trình viên hoặc AI có thể tiếp tục phát triển ngay mà không cần khảo sát lại toàn bộ mã nguồn.

---

## 1. Tổng quan

Hệ thống gồm 2 thành phần chạy độc lập theo mô hình Client–Server:

- **`Backend-qlyPhong`**: RESTful API viết bằng Java / Spring Boot.
- **`Frontend-QlyPhong`**: Single Page Application (SPA) viết bằng React / TypeScript / Vite / Material UI.
- **`docs/`**: Tài liệu báo cáo ([CHUONG_2_PHAN_TICH_VA_THIET_KE_HE_THONG.md](./docs/CHUONG_2_PHAN_TICH_VA_THIET_KE_HE_THONG.md)) và lược đồ SQL chuẩn ([schema.sql](./docs/schema.sql)).
- **`start-dev.ps1`**: Script PowerShell khởi chạy nhanh toàn bộ stack trên Windows.

### Các chức năng chính đã hoàn thiện
- Đăng nhập, đăng ký, tự động làm mới access token (refresh token), đăng xuất và đổi mật khẩu.
- Phân quyền RBAC theo 3 vai trò: `MANAGER`, `STAFF`, `USER`.
- Quản lý tài khoản người dùng (`MANAGER`), quản lý phòng trọ (lọc phòng trống, đồng bộ trạng thái thuê), quản lý khách thuê.
- Quản lý hợp đồng thuê phòng: tạo mới, sửa, xóa, tìm kiếm phân quyền, tự đồng bộ trạng thái (`DRAFT` → `ACTIVE` → `EXPIRED`) và **thanh lý hợp đồng trước hạn (`TERMINATED`)**.
- Quản lý hóa đơn điện nước hàng tháng: tự động gợi ý chỉ số cũ từ kỳ gần nhất, tính tiền phòng + điện + nước, chống trùng kỳ, xem/in phiếu báo tiền, xác nhận thanh toán (`PAID`) và hủy hóa đơn (`CANCELLED`).
- Hệ thống thông báo tự động (`NotificationBell`): cập nhật theo sự kiện hợp đồng/hóa đơn, lọc theo tài khoản & SĐT, đánh dấu đã đọc từng tin hoặc đọc tất cả.
- Tìm kiếm, phân trang, import/export và thống kê tổng quan.

---

## 2. Công nghệ sử dụng

### Backend (`Backend-qlyPhong`)
- **Java**: JDK 11 / 17 / 21 *(máy dev hiện cài sẵn `C:\Users\Administrator\.jdks\ms-21.0.10`)*.
- **Framework**: Spring Boot `2.7.17`, Spring MVC, Spring Security, Spring Data JPA.
- **Database**: MySQL 8 (`MySQL80` trên Windows, cổng `3306`, database `quan_ly_phong`).
- **Auth & Docs**: JWT (Access + Refresh Token), BCrypt, Springdoc OpenAPI / Swagger UI.
- **Tiện ích**: Lombok, Apache Commons CSV, Apache POI.

### Frontend (`Frontend-QlyPhong`)
- **Core**: React 18, TypeScript, Vite 4 (`@vitejs/plugin-react-swc`).
- **UI**: Material UI 5, Material React Table, MUI X Date Pickers (`dayjs`), `react-hot-toast`.
- **State & Data**: TanStack React Query (`react-query-kit`), Axios (có JWT interceptor), React Hook Form + Yup, Zustand, NiceModal.

---

## 3. Cấu trúc thư mục

```text
okla/
├── Backend-qlyPhong/
│   └── src/main/java/com/example/demo/
│       ├── controller/       # REST Controllers (Auth, User, Apartment, Customer, Contract, Invoice, Notification)
│       ├── service/          # interfaces/ & implement/ (nghiệp vụ @Transactional)
│       ├── repository/       # Spring Data JPA Repositories
│       ├── entity/           # 7 JPA Entities ánh xạ bảng MySQL
│       ├── enumuration/      # ERole, EContractStatus, EInvoiceStatus, ENotificationType, EStatus
│       ├── model/DTO/        # DTO request/response
│       ├── model/mapper/     # EntityToDto mapper
│       ├── config/           # SecurityConfig, JwtAuthFilter, WebConfig (CORS), SwaggerConfig
│       ├── util/             # JwtUtil, AuthUtils, MyUtils, validator/
│       ├── exception/        # Custom exceptions & GlobalExceptionHandler
│       ├── helper/           # CsvHelper, ExcelHelper
│       └── message/          # Hằng số thông báo
├── Frontend-QlyPhong/
│   └── src/
│       ├── App/              # Layout, AppBar, Main
│       ├── api/              # auth.ts, authStorage.ts, privateInstance.ts, index.ts
│       ├── components/       # NotificationBell, PageHeader, IndexToolBar, MRTRowAction, inputs/
│       ├── constants/        # AppRoutes.ts, index.ts, schema.ts
│       ├── context/          # AuthProvider, UserProvider
│       ├── features/         # Apartment, Contract, Customer, Invoice, Login, Statistic, user
│       ├── hooks/            # contract.ts, invoice.ts, apartment.ts, customer.ts, user.ts, useAuth.ts
│       ├── router/           # index.tsx, RequireSignedIn, RequireAdmin
│       ├── types/            # ApiData.ts, enums.ts, props.ts, returns.ts
│       └── utils/            # defaultMRTOptions, routerLoader, stringFormats
├── docs/
│   ├── CHUONG_2_PHAN_TICH_VA_THIET_KE_HE_THONG.md   # Báo cáo Chương 2 (kèm Mermaid ERD, Use Case, Sequence)
│   └── schema.sql                                   # Script DDL MySQL 8 chuẩn
├── docker-compose.yml
├── start-dev.ps1             # Script khởi chạy nhanh Backend + Frontend + kiểm tra MySQL80
└── README.md
```

---

## 4. Cơ sở dữ liệu hiện hành (MySQL Workbench / MySQL80)

Hệ thống kết nối trực tiếp tới **MySQL80 cài trên Windows** (cùng instance với **MySQL Workbench**):

- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `quan_ly_phong`
- **Username**: `root`
- **Password**: `123456`
- **Cấu hình**: `Backend-qlyPhong/src/main/resources/application.properties` (`spring.jpa.hibernate.ddl-auto=update`).

### Danh sách 7 bảng trong `quan_ly_phong`
1. **`role`**: 3 vai trò `MANAGER`, `STAFF`, `USER`.
2. **`user`**: tài khoản đăng nhập, `email`, `username`, `password` (BCrypt), `full_name`, `phone_number` (kiểm tra duy nhất ở Service), `active`, `access_token`, `refresh_token`, `role_id`.
3. **`apartment`**: phòng trọ (`address`, `retail_price`, `number_of_room`, `status`: `0` còn trống / `1` đã thuê).
4. **`customer`**: khách thuê (`full_name`, `address`, `citizen_id`, `date_of_birth`, `phone_number`).
5. **`contract`**: hợp đồng thuê (`start_date`, `end_date`, `create_date`, `retail_price`, `total`, `status` (`DRAFT`/`ACTIVE`/`EXPIRED`/`TERMINATED`), `terminated_at`, `termination_reason`, `customer_id`, `apartment_id`, `user_id`).
6. **`invoice`**: hóa đơn điện nước hàng tháng (`invoice_number` UNIQUE, `contract_id`, `billing_month`, `billing_year`, `UNIQUE(contract_id, billing_month, billing_year)`, `room_amount`, `electric_old/new/usage/rate/amount`, `water_old/new/usage/rate/amount`, `amount`, `issue_date`, `due_date`, `status` (`UNPAID`/`PAID`/`CANCELLED`), `paid_at`, `created_at`).
7. **`notification`**: thông báo (`user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `recipient_phone`, kèm index tối ưu truy vấn).

> Nếu triển khai trên máy mới, tạo database bằng file [docs/schema.sql](./docs/schema.sql) hoặc chạy `CREATE DATABASE quan_ly_phong;` rồi bật Backend để Hibernate tự sinh bảng và dữ liệu mặc định.

---

## 5. Hướng dẫn Setup & Khởi chạy

### Yêu cầu môi trường
- **MySQL 8** đang chạy dịch vụ `MySQL80` ở cổng `3306` với database `quan_ly_phong` (`root` / `123456`).
- **JDK 11 / 17 / 21** (máy hiện có `C:\Users\Administrator\.jdks\ms-21.0.10`).
- **Node.js 18+** & npm.

### Cách 1: Khởi chạy nhanh 1 lệnh trên Windows (Khuyên dùng)

```powershell
cd C:\Users\Administrator\Downloads\okla\okla
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Script tự động kiểm tra dịch vụ `MySQL80` (cổng `3306`), mở cửa sổ **Backend** (cổng `9090`) với sẵn `JAVA_HOME` và mở cửa sổ **Frontend** (cổng `5174`). Chờ cửa sổ Backend báo `Started DemoApplication` (~10–15 giây) là sử dụng được ngay.

### Cách 2: Chạy thủ công từng phần

**Backend (cổng `9090`):**
```powershell
$env:JAVA_HOME = "C:\Users\Administrator\.jdks\ms-21.0.10"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd C:\Users\Administrator\Downloads\okla\okla\Backend-qlyPhong
.\mvnw.cmd spring-boot:run
```

**Frontend (cổng `5174`):**
```powershell
cd C:\Users\Administrator\Downloads\okla\okla\Frontend-QlyPhong
npm install
npm run dev
```

### Cách 3: Build kiểm tra
```powershell
# Backend compile
$env:JAVA_HOME = "C:\Users\Administrator\.jdks\ms-21.0.10"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd Backend-qlyPhong; .\mvnw.cmd compile -DskipTests

# Frontend production bundle
cd Frontend-QlyPhong; npx vite build
```

### Cách 4: Chạy bằng Docker Compose (tùy chọn)
`docker-compose.yml` đã cấu hình trỏ tới `host.docker.internal:3306/quan_ly_phong`:
```powershell
docker compose up --build -d
```
*(Lưu ý: chạy trên Windows bằng Cách 1 nhanh hơn nhiều vì tận dụng trực tiếp Maven cache và `node_modules` cục bộ).*

### Địa chỉ truy cập & Tài khoản mặc định
- **Frontend**: `http://localhost:5174`
- **Backend**: `http://localhost:9090`
- **Swagger UI**: `http://localhost:9090/swagger-ui/index.html`
- **Admin mặc định** (tự tạo trong `DemoApplication` khi bảng `user` trống):
  - Email / Username: `admin@example.com`
  - Password: `12345`
  - Role: `MANAGER`

---

## 6. Xác thực, Phân quyền & CORS

- **Roles**: `MANAGER` (Quản trị viên), `STAFF` (Nhân viên), `USER` (Người thuê).
- **CORS**: `WebConfig` cho phép `.allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")` với `allowCredentials(true)` kết hợp `http.cors()` trong `SecurityConfig`.
- **JWT & Refresh Token**:
  - Frontend `privateInstance.ts` tự gắn `Bearer <accessToken>`; khi gặp `401`/`403` từ `JwtAuthFilter` sẽ refresh token 1 lần duy nhất (`_retry = true`) qua `publicInstance` rồi gọi lại request.
  - Đăng ký công khai (`POST /auth/register`) bắt buộc SĐT Việt Nam 10 số hợp lệ, chống trùng email & SĐT, luôn gán role `USER`.
  - Tạo tài khoản từ quản trị (`POST /users/add`, chỉ `MANAGER`) hỗ trợ chọn đúng `username` và `role` (`MANAGER`/`STAFF`/`USER`).
- **Đã loại bỏ**: chức năng quên mật khẩu / reset password (`/forgotPassword`, `/auth/resetPassword`).

---

## 7. Danh sách API nghiệp vụ chính

### Auth (`/auth`)
- `POST /auth/register` — Đăng ký tài khoản mới (`USER`).
- `POST /auth/login` — Đăng nhập, trả về `access_token` và `refresh_token`.
- `POST /auth/refreshToken` — Làm mới access token.
- `GET /auth/logout` — Đăng xuất và xóa token phiên.

### Users (`/users`)
- `GET /users/details` — Thông tin tài khoản hiện tại.
- `GET /users`, `POST /users/add`, `POST /users/block/{id}`, `POST /users/unblock/{id}`, `GET /users/statistic`, `GET /users/export` — Chỉ `MANAGER`.
- `GET /users/{id}`, `POST /users/update/{id}`, `POST /users/changePassword/{id}`.

### Apartments (`/apartments`)
- `GET /apartments` — Danh sách phòng (hỗ trợ `?available=true` để lọc phòng còn trống).
- `GET /apartments/{id}`, `GET /apartments/search?q=...`, `GET /apartments/export`.
- `POST /apartments/add`, `POST /apartments/update/{id}`, `POST /apartments/import` — `MANAGER`/`STAFF`.
- `DELETE /apartments/delete/{id}`, `GET /apartments/statistic` — `MANAGER`.

### Customers (`/customers`)
- `GET /customers`, `GET /customers/{id}`, `GET /customers/search?q=...`, `POST /customers/add`, `POST /customers/update/{id}`, `DELETE /customers/delete/{id}`, `POST /customers/import`, `GET /customers/export`, `GET /customers/statistic`.

### Contracts (`/contracts`)
- `GET /contracts` — Danh sách hợp đồng (tự đồng bộ `DRAFT`/`ACTIVE`/`EXPIRED`; `USER` chỉ thấy HĐ thuộc mình hoặc khớp SĐT).
- `GET /contracts/{id}` — Chi tiết hợp đồng (kiểm tra quyền sở hữu với `USER`).
- `GET /contracts/search?q=...` — Tìm theo địa chỉ phòng, tên/SĐT khách, trạng thái (có phạm vi `USER`, trả về `ContractResponse`).
- `POST /contracts/add` — Tạo hợp đồng (`MANAGER`/`STAFF`), kiểm tra trùng lịch, tự tính `total`, đồng bộ `Apartment.status`, gửi thông báo `CONTRACT_CREATED`.
- `POST /contracts/update/{id}` — Cập nhật hợp đồng (`MANAGER`/`STAFF`), chặn sửa HĐ đã `TERMINATED`, đồng bộ lại phòng.
- `POST /contracts/terminate/{id}` — **Thanh lý trước hạn (`TERMINATED`)** (`MANAGER`/`STAFF`): chặn nếu đã `TERMINATED`/`EXPIRED` hoặc còn hóa đơn `UNPAID`, giải phóng phòng trống, gửi thông báo `CONTRACT_TERMINATED`.
- `DELETE /contracts/delete/{id}` — Xóa hợp đồng (`MANAGER`), chặn xóa HĐ `ACTIVE` hoặc HĐ đã có hóa đơn.
- `GET /contracts/statistic?nowYear=YYYY` — Thống kê (`MANAGER`).

### Invoices (`/invoices`)
- `GET /invoices` — Danh sách hóa đơn phân trang, hỗ trợ lọc `status`, `billingMonth`, `billingYear`, `contractId` (`USER` chỉ xem hóa đơn của mình).
- `GET /invoices/{id}` — Chi tiết phiếu hóa đơn (kiểm tra quyền `USER`).
- `GET /invoices/latest-meter?contractId=...` — Gợi ý chỉ số điện/nước cũ và đơn giá kỳ gần nhất (`MANAGER`/`STAFF`).
- `POST /invoices/create` — Tính tiền điện nước, lập phiếu hóa đơn `UNPAID` cho hợp đồng `ACTIVE` và gửi thông báo `INVOICE_CREATED` (`MANAGER`/`STAFF`).
- `POST /invoices/{id}/pay` — Xác nhận đã thanh toán (`PAID`), lưu `paidAt`, chống thanh toán lặp, gửi `INVOICE_PAID` (`MANAGER`/`STAFF`).
- `POST /invoices/{id}/cancel` — Hủy hóa đơn `UNPAID` sang `CANCELLED` và gửi thông báo (`MANAGER`/`STAFF`).

**Công thức tính hóa đơn:**
```text
electricUsage  = electricNew - electricOld
electricAmount = electricUsage × electricRate   (mặc định 3.000 VNĐ/kWh)
waterUsage     = waterNew - waterOld
waterAmount    = waterUsage × waterRate         (mặc định 10.000 VNĐ/m³)
roomAmount     = retailPrice của hợp đồng
amount (tổng)  = roomAmount + electricAmount + waterAmount
```

### Notifications (`/notifications`)
- `GET /notifications` — Danh sách thông báo kèm `unreadCount` (hợp nhất theo `recipientPhone` và `user_id`).
- `POST /notifications/{id}/read` — Đánh dấu 1 thông báo đã đọc.
- `POST /notifications/read-all` — Đánh dấu toàn bộ thông báo chưa đọc là đã đọc.

---

## 8. Route Frontend hiện hành

- Công khai: `/login`, `/register`
- Đã đăng nhập (`RequireSignedIn`):
  - `/` — Dashboard thống kê
  - `/apartments`, `/apartments/add`, `/apartments/:id/edit`
  - `/customers`, `/customers/add`, `/customers/:id/edit` (hiển thị menu cho `MANAGER` & `STAFF`)
  - `/contracts`, `/contracts/add`, `/contracts/:id/edit`
  - `/invoices` — Lập phiếu hóa đơn điện nước, lọc, xem/in phiếu, thanh toán, hủy
  - `/account/edit`, `/account/edit/changePassword`
- Quản trị (`RequireAdmin` — `MANAGER`):
  - `/users`, `/users/add`, `/users/:id/edit`

---

## 9. Tiến trình hoàn thiện đồ án (Status Checklist)

| # | Hạng mục yêu cầu | Trạng thái | Chi tiết triển khai |
| :-: | :--- | :---: | :--- |
| **1** | Bổ sung bảng `invoice` & `notification` vào CSDL; thiết kế giao diện Hợp đồng | **Hoàn thành** | Đã đồng bộ đủ 7 bảng trên `quan_ly_phong` (`localhost:3306`) kèm unique constraint & index (`docs/schema.sql`). Giao diện Hợp đồng (`ContractList`, `CreateContract`, `EditContract`) đã Việt hóa, hiển thị tạm tính tổng tiền, lọc phòng trống, `DetailPanel` có đầy đủ thông tin thanh lý `TERMINATED`. |
| **2** | Viết API tạo hợp đồng & Thanh lý hợp đồng trước hạn (`TERMINATED`) | **Hoàn thành** | `POST /contracts/add` và `POST /contracts/terminate/{id}` chạy trong `@Transactional`, đồng bộ trạng thái phòng (`Apartment.status`) và hợp đồng hết hạn (`EXPIRED`), chặn thanh lý khi còn hóa đơn `UNPAID`, sửa bảo mật & query `GET /contracts/search`. |
| **3** | Xây dựng API tính tiền điện nước, tạo phiếu hóa đơn & gửi thông báo | **Hoàn thành** | Đã tách chuẩn `InvoiceService` & `NotificationService`, hỗ trợ gợi ý chỉ số kỳ trước (`latest-meter`), tính tiền phòng/điện/nước, lọc đa tiêu chí, chống thanh toán lặp, hỗ trợ hủy hóa đơn (`cancel`) và đánh dấu đọc tất cả thông báo (`read-all`). |
| **4** | Thiết kế giao diện hóa đơn, ghép API hợp đồng & viết Chương 2 báo cáo | **Hoàn thành** | Nâng cấp `InvoicePage` dùng React Query, sửa lỗi báo thành công giả, thêm lọc/phân trang/in phiếu báo tiền; ghép đầy đủ API Hợp đồng + sửa CORS & Axios interceptor + sửa trang đăng ký `RegisterPage`; hoàn thành báo cáo tại `docs/CHUONG_2_PHAN_TICH_VA_THIET_KE_HE_THONG.md`. |
