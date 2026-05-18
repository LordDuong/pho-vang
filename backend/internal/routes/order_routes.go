package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterOrderRoutes(router *gin.Engine, orderHandler *handlers.OrderHandler) {
	router.POST("/api/orders", orderHandler.CreateOrder)
	router.GET("/api/orders", orderHandler.GetOrders)
	router.GET("/api/orders/:id", orderHandler.GetOrderByID)
	router.PATCH("/api/orders/:id/status", orderHandler.UpdateOrderStatus)

	router.POST("/api/sales", orderHandler.CreateSale)

	router.GET("/api/revenue", orderHandler.GetRevenue)
}
