package main

import (
	"log"
	"os"

	"github.com/TOM88bet/PHO-VANG/backend/config"
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
	"github.com/TOM88bet/PHO-VANG/backend/internal/routes"
	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	ws "github.com/TOM88bet/PHO-VANG/backend/internal/websocket"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.LoadEnv(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}
	if err := config.ConnectDatabase(); err != nil {
		log.Fatal("failed to connect database: ", err)
	}
	if err := config.DB.AutoMigrate(
		&models.User{},
		&models.Order{},
		&models.OrderItem{},
		&models.Sale{},
		&models.Attendance{},
		&models.MenuItem{},
		&models.Schedule{},
	); err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	// Order dependencies
	orderRepository := repositories.NewOrderRepository(config.DB)
	orderService := services.NewOrderService(orderRepository)
	orderHandler := handlers.NewOrderHandler(orderService)
	saleRepository := repositories.NewSaleRepository(config.DB)
	saleService := services.NewSaleService(saleRepository, orderRepository)
	orderHandler.SetSaleService(saleService)

	// Auth dependencies
	userRepository := repositories.NewUserRepository(config.DB)
	authService := services.NewAuthService(userRepository)
	authHandler := handlers.NewAuthHandler(authService)
	attendanceRepository := repositories.NewAttendanceRepository(config.DB)
	attendanceService := services.NewAttendanceService(attendanceRepository)
	attendanceHandler := handlers.NewAttendanceHandler(attendanceService)

	// Menu dependencies
	menuRepository := repositories.NewMenuRepository(config.DB)
	menuService := services.NewMenuService(menuRepository)
	menuHandler := handlers.NewMenuHandler(menuService)

	//salary
	salaryService := services.NewSalaryService(attendanceRepository, userRepository)
	salaryHandler := handlers.NewSalaryHandler(salaryService)

	//schedule
	scheduleRepository := repositories.NewScheduleRepository(config.DB)
	scheduleService := services.NewScheduleService(scheduleRepository)
	scheduleHandler := handlers.NewScheduleHandler(scheduleService)

	wsHub := ws.NewHub()
	wsHandler := ws.NewHandler(wsHub)
	orderHandler.SetWebSocketHub(wsHub)
	menuHandler.SetWebSocketHub(wsHub)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5500", "http://localhost:5500"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	routes.RegisterRoutes(router, orderHandler, authHandler, attendanceHandler, menuHandler, salaryHandler, scheduleHandler, wsHandler)
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}
	if err := router.Run(":" + port); err != nil {
		log.Fatal("failed to start server: ", err)
	}

}
