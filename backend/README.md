# 🍜 Pho Vang / GoKitchen Backend

Backend API cho hệ thống quản lý nhà hàng Pho Vang.

Mục tiêu của project là xử lý:

- đăng nhập theo vai trò
- quản lý menu
- tạo và xử lý đơn hàng
- thanh toán và doanh thu
- realtime update bằng WebSocket

Kiến trúc hiện tại:

```text
handler -> service -> repository -> database
```

---

## Mục Lục

- [🍜 Pho Vang / GoKitchen Backend](#-pho-vang--gokitchen-backend)
  - [Mục Lục](#mục-lục)
  - [Tổng quan](#tổng-quan)
  - [Tính năng](#tính-năng)
    - [Đã triển khai](#đã-triển-khai)
    - [Roles hiện có](#roles-hiện-có)
  - [Tech stack](#tech-stack)
  - [Cấu trúc thư mục](#cấu-trúc-thư-mục)
  - [Cài đặt](#cài-đặt)
    - [Yêu cầu](#yêu-cầu)
    - [Cài dependencies](#cài-dependencies)
  - [Biến môi trường](#biến-môi-trường)
  - [Database setup](#database-setup)
  - [Chạy backend](#chạy-backend)
  - [API routes](#api-routes)
    - [Auth](#auth)
    - [Menu](#menu)
    - [Orders](#orders)
    - [Sales](#sales)
    - [Revenue](#revenue)
    - [Employees](#employees)
    - [Attendance](#attendance)
    - [Salary](#salary)
    - [Schedule](#schedule)
  - [Response format](#response-format)
    - [Success](#success)
    - [Error](#error)
  - [WebSocket](#websocket)
    - [Kết nối](#kết-nối)
    - [Role hợp lệ](#role-hợp-lệ)
    - [Message format](#message-format)
    - [Events đã triển khai](#events-đã-triển-khai)
    - [Lưu ý về WebSocket auth](#lưu-ý-về-websocket-auth)
  - [Luồng đơn hàng](#luồng-đơn-hàng)
    - [Quy tắc](#quy-tắc)
  - [Ví dụ request / response](#ví-dụ-request--response)
    - [1. Login](#1-login)
    - [2. Create order](#2-create-order)
    - [3. Create sale](#3-create-sale)
    - [4. Error example](#4-error-example)
  - [Business rules](#business-rules)
    - [Order status](#order-status)
    - [Payment](#payment)
    - [Menu](#menu-1)
    - [WebSocket](#websocket-1)
    - [Các module còn có thể thay đổi](#các-module-còn-có-thể-thay-đổi)
  - [Postman testing flow](#postman-testing-flow)
    - [Nên chạy theo thứ tự](#nên-chạy-theo-thứ-tự)
    - [Biến môi trường nên có](#biến-môi-trường-nên-có)
    - [Gợi ý kiểm tra](#gợi-ý-kiểm-tra)
  - [WebSocket testing guide](#websocket-testing-guide)
    - [Mở 3 tab WebSocket](#mở-3-tab-websocket)
    - [Test nhanh](#test-nhanh)
    - [Kỳ vọng theo role](#kỳ-vọng-theo-role)
  - [Known limitations](#known-limitations)
  - [Future improvements](#future-improvements)
  - [Ghi chú](#ghi-chú)

---

## Tổng quan

Pho Vang / GoKitchen là backend cho hệ thống quản lý nhà hàng. Backend dùng Gin để xử lý HTTP API, GORM để làm việc với MySQL, JWT cho xác thực, và Gorilla WebSocket cho realtime events.

Project hiện đã có:

- JWT authentication
- role-based middleware
- menu CRUD
- order management
- order status workflow
- sales/payment processing
- revenue statistics
- attendance, salary, schedule
- WebSocket realtime updates
- auto migration khi khởi động

---

## Tính năng

### Đã triển khai

- Đăng nhập bằng JWT
- Phân quyền theo role
- CRUD menu
- Tạo đơn hàng public
- Cập nhật trạng thái đơn theo workflow cố định
- Tạo sale khi đơn đã tới trạng thái `waiting_pay`
- Chặn thanh toán trùng đơn
- Tính doanh thu và top sản phẩm
- Realtime broadcast cho order và menu
- Chấm công, xem lương, xem lịch làm việc

### Roles hiện có

- `customer`
- `waiter`
- `kitchen`
- `cashier`
- `manager`
- `owner`

---

## Tech stack

| Thành phần       | Công nghệ         |
| ---------------- | ----------------- |
| Language         | Go                |
| HTTP framework   | Gin               |
| ORM              | GORM              |
| Database         | MySQL             |
| Auth             | JWT               |
| Password hashing | bcrypt            |
| WebSocket        | Gorilla WebSocket |

---

## Cấu trúc thư mục

```text
backend/
├── config/
│   ├── config.go
│   └── database.go
├── internal/
│   ├── constants/
│   ├── dto/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── websocket/
├── main.go
└── README.md
```

Những phần chính:

- `handlers/`: nhận request và trả response
- `services/`: xử lý business rules
- `repositories/`: truy cập database
- `models/`: struct GORM
- `routes/`: đăng ký route
- `middleware/`: auth và role guard
- `websocket/`: hub, client, handler

---

## Cài đặt

### Yêu cầu

- Go theo version trong `go.mod`
- MySQL đang chạy
- file `.env` trong thư mục `backend/`

### Cài dependencies

```bash
cd backend
go mod download
```

---

## Biến môi trường

Tạo file `.env` trong `backend/` với các biến sau:

| Biến          | Bắt buộc | Mô tả                         |
| ------------- | -------- | ----------------------------- |
| `DB_USER`     | Có       | Tên user MySQL                |
| `DB_PASSWORD` | Có       | Mật khẩu MySQL                |
| `DB_HOST`     | Có       | Host MySQL, ví dụ `127.0.0.1` |
| `DB_PORT`     | Có       | Cổng MySQL, ví dụ `3306`      |
| `DB_NAME`     | Có       | Tên database                  |
| `JWT_SECRET`  | Có       | Secret để ký và verify JWT    |
| `APP_PORT`    | Không    | Port backend, mặc định `8080` |

Ví dụ:

```env
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=pho_vang
JWT_SECRET=your_super_secret_key
APP_PORT=8080
```

---

## Database setup

Backend tự `AutoMigrate` các model sau khi start:

- `User`
- `Order`
- `OrderItem`
- `Sale`
- `Attendance`
- `MenuItem`
- `Schedule`

Lưu ý:

- Database MySQL phải được tạo sẵn trước khi chạy backend.
- Khi backend khởi động, nó sẽ tự migrate schema cần thiết.

---

## Chạy backend

Chạy từ thư mục `backend` bằng:

```bash
go run .
```

Backend mặc định chạy ở:

```text
http://localhost:8080
```

Nếu muốn đổi port:

```env
APP_PORT=8081
```

---

## API routes

### Auth

| Method | Endpoint     | Quyền  | Mô tả                 |
| ------ | ------------ | ------ | --------------------- |
| POST   | `/api/login` | Public | Đăng nhập và nhận JWT |

Protected APIs cần header:

```text
Authorization: Bearer <jwt_token>
```

### Menu

| Method | Endpoint        | Quyền              | Mô tả                  |
| ------ | --------------- | ------------------ | ---------------------- |
| GET    | `/api/menu`     | Public             | Lấy menu còn available |
| POST   | `/api/menu`     | `manager`, `owner` | Tạo món mới            |
| PATCH  | `/api/menu/:id` | `manager`, `owner` | Cập nhật món           |
| DELETE | `/api/menu/:id` | `manager`, `owner` | Xóa mềm món            |

### Orders

| Method | Endpoint                 | Quyền                                              | Mô tả                   |
| ------ | ------------------------ | -------------------------------------------------- | ----------------------- |
| POST   | `/api/orders`            | Public                                             | Tạo đơn mới             |
| GET    | `/api/orders`            | `waiter`, `cashier`, `kitchen`, `manager`, `owner` | Danh sách đơn           |
| GET    | `/api/orders/:id`        | `waiter`, `cashier`, `kitchen`, `manager`, `owner` | Chi tiết đơn            |
| PATCH  | `/api/orders/:id/status` | `waiter`, `kitchen`, `cashier`, `manager`, `owner` | Cập nhật trạng thái đơn |

Query params của `GET /api/orders`:

- `status`
- `table`

### Sales

| Method | Endpoint     | Quyền                         | Mô tả                 |
| ------ | ------------ | ----------------------------- | --------------------- |
| POST   | `/api/sales` | `cashier`, `manager`, `owner` | Tạo sale / thanh toán |

### Revenue

| Method | Endpoint       | Quyền              | Mô tả              |
| ------ | -------------- | ------------------ | ------------------ |
| GET    | `/api/revenue` | `manager`, `owner` | Thống kê doanh thu |

### Employees

| Method | Endpoint             | Quyền              | Mô tả               |
| ------ | -------------------- | ------------------ | ------------------- |
| POST   | `/api/employees`     | `manager`, `owner` | Tạo nhân viên       |
| GET    | `/api/employees`     | `manager`, `owner` | Danh sách nhân viên |
| PATCH  | `/api/employees/:id` | `manager`, `owner` | Cập nhật nhân viên  |
| DELETE | `/api/employees/:id` | `owner`            | Xóa nhân viên       |

### Attendance

| Method | Endpoint                   | Quyền                                     | Mô tả          |
| ------ | -------------------------- | ----------------------------------------- | -------------- |
| POST   | `/api/attendance/checkin`  | `waiter`, `cashier`, `kitchen`, `manager` | Chấm công vào  |
| POST   | `/api/attendance/checkout` | `waiter`, `cashier`, `kitchen`, `manager` | Chấm công ra   |
| GET    | `/api/attendance`          | `manager`, `owner`                        | Xem attendance |

Query params của `GET /api/attendance`:

- `date`
- `user_id`

### Salary

| Method | Endpoint      | Quyền              | Mô tả      |
| ------ | ------------- | ------------------ | ---------- |
| GET    | `/api/salary` | `manager`, `owner` | Tính lương |

Query params:

- `month`

### Schedule

| Method | Endpoint        | Quyền                                              | Mô tả              |
| ------ | --------------- | -------------------------------------------------- | ------------------ |
| GET    | `/api/schedule` | `manager`, `owner`, `waiter`, `cashier`, `kitchen` | Xem lịch làm việc  |
| PUT    | `/api/schedule` | `manager`, `owner`                                 | Cập nhật lịch tuần |

Query params:

- `week`

---

## Response format

### Success

Hầu hết response thành công dùng format:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Một số endpoint chỉ trả:

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": "message"
}
```

---

## WebSocket

### Kết nối

```text
GET /ws?role={role}
```

Ví dụ:

```text
ws://localhost:8080/ws?role=kitchen
ws://localhost:8080/ws?role=cashier
ws://localhost:8080/ws?role=owner
```

### Role hợp lệ

- `customer`
- `waiter`
- `kitchen`
- `cashier`
- `manager`
- `owner`

### Message format

```json
{
  "event": "...",
  "data": {}
}
```

### Events đã triển khai

| Event           | Khi nào bắn                              | Role nhận                                          |
| --------------- | ---------------------------------------- | -------------------------------------------------- |
| `new_order`     | Tạo order thành công                     | `waiter`, `kitchen`, `cashier`, `manager`, `owner` |
| `order_updated` | Cập nhật status order thành công         | `waiter`, `kitchen`, `cashier`, `manager`, `owner` |
| `order_paid`    | Tạo sale thành công                      | `cashier`, `manager`, `owner`                      |
| `menu_updated`  | Create / update / delete menu thành công | `customer`, `manager`, `owner`                     |

### Lưu ý về WebSocket auth

Hiện WebSocket xác thực role bằng query param `role`.

- WebSocket chưa verify JWT
- Cách này đủ cho demo và test nội bộ
- Hub hiện tại là in-memory nên chỉ dùng ổn cho một instance

---

## Luồng đơn hàng

Workflow hiện tại:

```text
pending
→ confirmed
→ cooking
→ ready
→ serving
→ waiting_pay
→ paid
```

### Quy tắc

- không được bỏ qua trạng thái
- không được đi ngược trạng thái
- không được tạo sale nếu đơn chưa tới `waiting_pay`
- không được thanh toán 2 lần
- đơn đã `paid` thì không sửa trạng thái nữa

---

## Ví dụ request / response

### 1. Login

Request:

```json
{
  "username": "manager01",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "manager01",
      "name": "Manager",
      "role": "manager",
      "wage": 12000000
    }
  }
}
```

### 2. Create order

Request:

```json
{
  "table_name": "Bàn A1",
  "items": [
    {
      "menu_item_id": 1,
      "name": "Phở bò tái",
      "emoji": "🍜",
      "price": 65000,
      "quantity": 2
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "table_name": "Bàn A1",
    "status": "pending",
    "total": 130000,
    "items": [
      {
        "id": 21,
        "menu_item_id": 1,
        "name": "Phở bò tái",
        "emoji": "🍜",
        "price": 65000,
        "quantity": 2
      }
    ]
  },
  "message": "Order created successfully"
}
```

### 3. Create sale

Request:

```json
{
  "order_id": 10,
  "pay_method": "Tiền mặt"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "order_id": 10,
    "table_name": "Bàn A1",
    "total": 130000,
    "pay_method": "Tiền mặt",
    "completed_at": "2026-05-22T10:00:00Z"
  },
  "message": "Sale created successfully"
}
```

### 4. Error example

```json
{
  "success": false,
  "error": "sale already exists for this order"
}
```

---

## Business rules

### Order status

- chỉ đi theo flow đã định
- không skip state
- không backward state

### Payment

- chỉ tạo sale khi order đang ở `waiting_pay`
- nếu order đã có sale thì trả lỗi duplicate sale
- không được thanh toán lại order đã paid

### Menu

- món tạo mới có thể được gán mặc định `avail = true`
- `menu_updated` chỉ bắn sau khi DB thao tác thành công

### WebSocket

- hub hiện tại là in-memory
- client disconnect thì được loại khỏi hub
- write lỗi sẽ unregister client

### Các module còn có thể thay đổi

Các phần sau đã có trong code nhưng vẫn có thể được chỉnh thêm trong quá trình phát triển:

- `employees`
- `attendance`
- `salary`
- `schedule`

Các module này dùng được để test và demo, nhưng nếu sau này mở rộng nghiệp vụ thì route hoặc validation có thể thay đổi nhẹ.

---

## Postman testing flow

Đã có bộ file trong thư mục `postman/` để test nhanh.

### Nên chạy theo thứ tự

1. Login manager
2. Login cashier
3. Login kitchen
4. Login waiter
5. Create menu item
6. Create order
7. Get order by id
8. Update status theo flow
9. Create valid sale
10. Get revenue
11. Test invalid cases
12. Delete menu item

### Biến môi trường nên có

- `base_url`
- `manager_token`
- `cashier_token`
- `kitchen_token`
- `waiter_token`
- `menu_id`
- `order_id`

### Gợi ý kiểm tra

- login xong mỗi role sẽ lưu token riêng
- tạo menu sẽ lưu `menu_id`
- tạo order sẽ lưu `order_id`
- tạo sale sẽ tự test duplicate payment

---

## WebSocket testing guide

### Mở 3 tab WebSocket

- `ws://localhost:8080/ws?role=kitchen`
- `ws://localhost:8080/ws?role=cashier`
- `ws://localhost:8080/ws?role=owner`

### Test nhanh

1. Giữ cả 3 tab đang connect.
2. Tạo order mới.
3. Quan sát `new_order`.
4. Đổi trạng thái order.
5. Quan sát `order_updated`.
6. Tạo sale thành công.
7. Quan sát `order_paid`.
8. Tạo / sửa / xóa menu.
9. Quan sát `menu_updated`.

### Kỳ vọng theo role

- `kitchen`: nhận order và update order
- `cashier`: nhận order, update order, paid event
- `owner`: nhận tất cả event

---

## Known limitations

- WebSocket hub đang là in-memory, chưa scale đa instance
- chưa có Redis / message broker
- chưa có Docker Compose chính thức
- chưa có automated integration tests cho WebSocket và flow end-to-end
- WebSocket auth còn đơn giản, dựa vào query `role`

---

## Future improvements

- thêm Docker và Docker Compose
- thêm integration tests cho order/payment/websocket
- chuẩn hóa response DTO hơn nữa
- thêm validation chi tiết hơn ở tầng DTO
- nâng cấp WebSocket auth sang JWT hoặc token-based auth riêng
- thêm logging / observability chuẩn hơn
- nếu scale nhiều instance, tách realtime sang broker như Redis Pub/Sub

---

## Ghi chú

Backend này được thiết kế theo hướng dễ demo và dễ test bằng Postman. Nếu muốn phát triển tiếp, nên bắt đầu từ phần test tự động và chuẩn hóa tài liệu API.
