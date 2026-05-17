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
	); err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	orderRepository := repositories.NewOrderRepository(config.DB)
	orderService := services.NewOrderService(orderRepository)
	orderHandler := handlers.NewOrderHandler(orderService)

	userRepository := repositories.NewUserRepository(config.DB)
	authService := services.NewAuthService(userRepository)
	authHandler := handlers.NewAuthHandler(authService)

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5500", "http://localhost:5500"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	routes.RegisterRoutes(router, orderHandler, authHandler)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
