package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"
	"github.com/TOM88bet/PHO-VANG/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterOrderRoutes(router *gin.Engine, orderHandler *handlers.OrderHandler) {
	// Public
	router.POST("/api/orders", orderHandler.CreateOrder)

	// Protected
	api := router.Group("/api", middleware.RequireAuth())
	{
		api.GET("/orders", middleware.RequireRole("waiter", "cashier", "kitchen", "manager", "owner"), orderHandler.GetOrders)
		api.GET("/orders/:id", middleware.RequireRole("waiter", "cashier", "kitchen", "manager", "owner"), orderHandler.GetOrderByID)
		api.PATCH("/orders/:id/status", middleware.RequireRole("waiter", "kitchen", "cashier", "manager", "owner"), orderHandler.UpdateOrderStatus)

		api.POST("/sales", middleware.RequireRole("cashier", "manager", "owner"), orderHandler.CreateSale)

		api.GET("/revenue", middleware.RequireRole("owner", "manager"), orderHandler.GetRevenue)
	}
}
