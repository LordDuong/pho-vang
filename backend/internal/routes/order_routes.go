package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterOrderRoutes(router *gin.Engine, orderHandler *handlers.OrderHandler) {
	customerRoutes := router.Group("/api/customer")
	{
		customerRoutes.POST("/orders", orderHandler.CreateOrder)
		customerRoutes.GET("/orders/:id", orderHandler.GetOrderByID)
	}

	staffRoutes := router.Group("/api/staff")
	{
		staffRoutes.GET("/orders", orderHandler.GetOrdersByStatus)
		staffRoutes.PUT("/orders/:id/:status", orderHandler.UpdateOrderStatus)
	}

	ownerRoutes := router.Group("/api/owner")
	{
		ownerRoutes.GET("/revenue", orderHandler.GetTotalRevenue)
		ownerRoutes.GET("/top-items", orderHandler.GetTopItems)
	}
}