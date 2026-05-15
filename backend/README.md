# 🍜 GoDish – Backend API Documentation

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Vai Trò & Quyền Hạn](#vai-trò--quyền-hạn)
- [Cơ Sở Dữ Liệu](#cơ-sở-dữ-liệu)
- [BE 1: Auth + Menu](#-be-1--auth--menu)
- [BE 2: Order + Stats](#-be-2--order--stats)
- [Hằng Số](#hằng-số)
- [Ưu Tiên Phát Triển](#ưu-tiên-phát-triển)

---

## 📖 Tổng Quan

**GoDish** là một hệ thống quản lý nhà hàng và đặt hàng toàn diện.

### Quy Trình Luồng Chính

```
👤 Khách hàng tạo đơn hàng
  ↓
👨‍💼 Nhân viên nhận/xử lý đơn hàng
  ↓
🍽️ Thực phẩm được chuẩn bị
  ↓
💳 Thanh toán hoàn tất
  ↓
📊 Chủ sở hữu xem doanh thu/thống kê
```

---

## 👥 Vai Trò & Quyền Hạn

| Vai Trò           | Chức Năng Chính                               |
| ----------------- | --------------------------------------------- |
| **👤 Khách hàng** | Đăng nhập, xem menu, đặt hàng, thanh toán     |
| **👨‍💼 Nhân viên**  | Nhận đơn, xử lý trạng thái, phục vụ khách     |
| **👨‍💻 Chủ sở hữu** | Quản lý menu, xem doanh thu, xem top sản phẩm |

---

## 🗄️ Cơ Sở Dữ Liệu

### User

| Trường       | Kiểu     | Mô Tả                          |
| ------------ | -------- | ------------------------------ |
| `id`         | INT      | ID người dùng                  |
| `username`   | STRING   | Tên đăng nhập                  |
| `password`   | STRING   | Mật khẩu (hash)                |
| `role`       | STRING   | Vai trò (customer/staff/owner) |
| `created_at` | DATETIME | Ngày tạo                       |

### MenuItem

| Trường        | Kiểu     | Mô Tả          |
| ------------- | -------- | -------------- |
| `id`          | INT      | ID sản phẩm    |
| `name`        | STRING   | Tên món ăn     |
| `description` | TEXT     | Mô tả chi tiết |
| `price`       | DECIMAL  | Giá            |
| `category`    | STRING   | Danh mục       |
| `image`       | STRING   | URL hình ảnh   |
| `available`   | BOOLEAN  | Còn phục vụ    |
| `created_at`  | DATETIME | Ngày tạo       |

### Order

| Trường        | Kiểu     | Mô Tả          |
| ------------- | -------- | -------------- |
| `id`          | INT      | ID đơn hàng    |
| `customer_id` | INT      | ID khách hàng  |
| `status`      | STRING   | Trạng thái đơn |
| `total_price` | DECIMAL  | Tổng giá       |
| `created_at`  | DATETIME | Ngày tạo       |

### OrderItem

| Trường         | Kiểu    | Mô Tả                 |
| -------------- | ------- | --------------------- |
| `id`           | INT     | ID chi tiết đơn       |
| `order_id`     | INT     | ID đơn hàng           |
| `menu_item_id` | INT     | ID sản phẩm           |
| `quantity`     | INT     | Số lượng              |
| `note`         | TEXT    | Ghi chú               |
| `status`       | STRING  | Trạng thái chi tiết   |
| `price`        | DECIMAL | Giá tại thời điểm đặt |

### Trạng Thái Đơn Hàng

```
pending → accepted → preparing → served → done
              ↓
           cancelled
```

---

## 👤 BE 1 — AUTH + MENU + CORE SYSTEM

### 📦 Khối Chức Năng

#### 🔧 Core Setup

- Cấu hình Gin
- Cấu hình GORM
- Kết nối MySQL
- Quản lý biến môi trường
- Route & Middleware

#### 🔐 Authentication & Authorization

- Đăng nhập JWT
- Mã hóa mật khẩu (bcrypt)
- Xác thực vai trò
- Auth middleware

#### 👤 User System

- User model
- User repository/service
- Lấy thông tin user hiện tại

#### 📖 Menu Management

- Menu CRUD
- Kiểm tra sẵn có

### 📡 API Endpoints

#### 🔐 Authentication

| Method | Endpoint          | Mô Tả                       |
| ------ | ----------------- | --------------------------- |
| POST   | `/api/auth/login` | Đăng nhập                   |
| GET    | `/api/auth/me`    | Lấy thông tin user hiện tại |

#### 📖 Menu (Public)

| Method | Endpoint        | Mô Tả              |
| ------ | --------------- | ------------------ |
| GET    | `/api/menu`     | Lấy danh sách menu |
| GET    | `/api/menu/:id` | Chi tiết sản phẩm  |

#### 📖 Menu Management (Owner)

| Method | Endpoint              | Mô Tả             |
| ------ | --------------------- | ----------------- |
| POST   | `/api/owner/menu`     | Tạo sản phẩm      |
| PUT    | `/api/owner/menu/:id` | Cập nhật sản phẩm |
| DELETE | `/api/owner/menu/:id` | Xóa sản phẩm      |

---

## 📦 BE 2 — ORDER + BUSINESS FLOW + STATS

### 📦 Khối Chức Năng

#### 📋 Order System

- Tạo đơn hàng
- Chi tiết đơn hàng
- Lịch sử trạng thái
- Chi tiết từng sản phẩm trong đơn

#### 👨‍💼 Staff Processing

- Nhận đơn hàng
- Cập nhật trạng thái
- Workflow nhà bếp

#### 📊 Revenue & Statistics

- Tính toán doanh thu
- Top sản phẩm bán chạy
- Thống kê đơn hàng

### 📡 API Endpoints

#### 🛒 Customer Orders

| Method | Endpoint                   | Mô Tả             |
| ------ | -------------------------- | ----------------- |
| POST   | `/api/customer/orders`     | Tạo đơn hàng      |
| GET    | `/api/customer/orders`     | Lấy đơn của khách |
| GET    | `/api/customer/orders/:id` | Chi tiết đơn hàng |

#### 👨‍💼 Staff Orders

| Method | Endpoint                          | Mô Tả                   |
| ------ | --------------------------------- | ----------------------- |
| GET    | `/api/staff/orders`               | Danh sách đơn hoạt động |
| PUT    | `/api/staff/orders/:id/accept`    | Chấp nhận đơn           |
| PUT    | `/api/staff/orders/:id/preparing` | Đang chuẩn bị           |
| PUT    | `/api/staff/orders/:id/served`    | Đã phục vụ              |
| PUT    | `/api/staff/orders/:id/done`      | Hoàn thành              |

#### 📊 Owner Statistics

| Method | Endpoint               | Mô Tả                 |
| ------ | ---------------------- | --------------------- |
| GET    | `/api/owner/revenue`   | Thống kê doanh thu    |
| GET    | `/api/owner/top-items` | Top sản phẩm bán chạy |

---

## 📌 Hằng Số

### Vai Trò

```
customer  → Khách hàng
staff     → Nhân viên
owner     → Chủ sở hữu
```

### Trạng Thái Đơn

```
pending   → Chờ xử lý
accepted  → Đã chấp nhận
preparing → Đang chuẩn bị
served    → Đã phục vụ
done      → Hoàn thành
cancelled → Đã hủy
```

---
