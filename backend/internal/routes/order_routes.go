package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterOrderRoutes(router *gin.Engine, orderHandler *handlers.OrderHandler) {
	api := router.Group("/api")
	{
		api.POST("/orders", orderHandler.CreateOrder)
		api.GET("/orders", orderHandler.GetOrdersByStatus)
		api.PATCH("/orders/:id/status", orderHandler.UpdateOrderStatus)
		api.POST("/sales", orderHandler.CreateSale)
		api.GET("/revenue", orderHandler.GetTotalRevenue)
	}
}
