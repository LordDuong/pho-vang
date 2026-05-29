# Pho Vang — Restaurant Management System



## How to run demo

### *Edit file .env in folder Backend:
edit your DB_PASSWORD with your password in MySQL

### *Create new database name pho_vang:
Use this query to create new database, drop old database if you already have pho_vang:

CREATE DATABASE pho_vang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

### **Run Backend Go server by the following cmd line:
- cd backend
- go run . 
  
After the first time demo, you ctrl+f to find "seedDatabase()" in main.go and delete it, then you run demo with:
- cd backend
- go run main.go
  
### *In Frontend, open live server file index.html
### and use this table of accounts to sign in:
Username| Password| Role

admin| admin123: Owner

manager| manager123: Manager

staff| staff123: Waiter

kitchen| kitchen123: Kitchen




## Structure

### backend   → Go API
.
├── config

│   ├── config.go

│   └── database.go

├── internal
│   ├── constants

│   │   ├── .gitkeep

│   │   └── status.go

│   ├── dto

│   │   ├── menu_dto.go

│   │   └── order_dto.go

│   ├── handlers

│   │   ├── attendance_handler.go

│   │   ├── auth_handler.go

│   │   ├── menu_handler.go

│   │   ├── order_handler.go

│   │   ├── salary_handler.go

│   │   └── schedule_handler.go

│   ├── middleware

│   │   ├── .gitkeep

│   │   └── auth.go

│   ├── models

│   │   ├── attendance.go

│   │   ├── menu.go

│   │   ├── order_item.go

│   │   ├── order.go

│   │   ├── sale.go

│   │   ├── schedule.go

│   │   └── user.go

│   ├── repositories

│   │   ├── attendance_repository.go

│   │   ├── menu_repository.go

│   │   ├── order_repository.go

│   │   ├── sale_repository.go

│   │   ├── schedule_repository.go

│   │   └── user_repository.go

│   ├── routes

│   │   ├── order_routes.go

│   │   └── routes.go

│   ├── services

│   │   ├── attendance_service.go

│   │   ├── auth_service.go

│   │   ├── errors.go

│   │   ├── jwt_service.go

│   │   ├── menu_service.go

│   │   ├── order_service.go

│   │   ├── salary_service.go

│   │   ├── sale_service.go

│   │   └── schedule_service.go

│   ├── utils

│   │   └── .gitkeep

│   └── websocket

│       ├── handler.go

│       └── hub.go

├── .env

├── go.mod

├── go.sum

├── main.go

├── README.md

└── seed.go

### frontend  → Web UI

├── css

│   └── style.css

├── js

│   └── app.js

└── index.html



- main     → production 

- develop  → làm việc chính