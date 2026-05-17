package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"
	"github.com/TOM88bet/PHO-VANG/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, orderHandler *handlers.OrderHandler, authHandler *handlers.AuthHandler) {
	api := r.Group("/api")
	{
		// Public
		api.POST("/login", authHandler.Login)

		// Protected
		auth := api.Group("/", middleware.RequireAuth())
		{
			auth.POST("/employees", middleware.RequireRole("manager", "owner"), authHandler.CreateEmployee)
		}
	}
}
