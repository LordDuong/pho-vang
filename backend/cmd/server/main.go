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
		&models.Order{},
		&models.OrderItem{},
		&models.Sale{},
	); err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	orderRepository := repositories.NewOrderRepository(config.DB)
	orderService := services.NewOrderService(orderRepository)
	orderHandler := handlers.NewOrderHandler(orderService)

	saleRepository := repositories.NewSaleRepository(config.DB)
	saleService := services.NewSaleService(saleRepository, orderRepository)
	orderHandler.SetSaleService(saleService)

	router := gin.Default()

	routes.RegisterRoutes(router, orderHandler)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
