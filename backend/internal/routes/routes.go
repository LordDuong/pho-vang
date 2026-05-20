package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"
	"github.com/TOM88bet/PHO-VANG/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, orderHandler *handlers.OrderHandler, authHandler *handlers.AuthHandler, menuHandler *handlers.MenuHandler) {
	RegisterOrderRoutes(r, orderHandler)

	api := r.Group("/api")
	{
		api.POST("/login", authHandler.Login)

		// Endpoint công khai
		api.GET("/menu", menuHandler.GetMenuItems)

		auth := api.Group("", middleware.RequireAuth())
		{
			auth.POST("/employees", middleware.RequireRole("manager", "owner"), authHandler.CreateEmployee)

			// Endpoints bảo vệ
			auth.POST("/menu", middleware.RequireRole("manager", "owner"), menuHandler.CreateMenuItem)
			auth.PATCH("/menu/:id", middleware.RequireRole("manager", "owner"), menuHandler.UpdateMenuItem)
			auth.DELETE("/menu/:id", middleware.RequireRole("manager", "owner"), menuHandler.DeleteMenuItem)
		}
	}
}
