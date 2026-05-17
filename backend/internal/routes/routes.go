package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine, orderHandler *handlers.OrderHandler) {
	RegisterOrderRoutes(router, orderHandler)
}
