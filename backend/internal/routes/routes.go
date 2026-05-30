package routes

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/handlers"
	"github.com/TOM88bet/PHO-VANG/backend/internal/middleware"
	ws "github.com/TOM88bet/PHO-VANG/backend/internal/websocket"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, orderHandler *handlers.OrderHandler, authHandler *handlers.AuthHandler, attendanceHandler *handlers.AttendanceHandler, menuHandler *handlers.MenuHandler, salaryHandler *handlers.SalaryHandler, scheduleHandler *handlers.ScheduleHandler, wsHandler *ws.Handler) {
	r.GET("/ws", wsHandler.ServeWS)
	RegisterOrderRoutes(r, orderHandler)

	api := r.Group("/api")
	{
		api.POST("/login", authHandler.Login)
		api.GET("/menu", menuHandler.GetMenuItems)

		auth := api.Group("", middleware.RequireAuth())
		{
			auth.POST("/employees", middleware.RequireRole("manager", "owner"), authHandler.CreateEmployee)
			auth.GET("/employees", middleware.RequireRole("manager", "owner"), authHandler.GetEmployees)
			auth.PATCH("/employees/:id", middleware.RequireRole("manager", "owner"), authHandler.UpdateEmployee)
			auth.DELETE("/employees/:id", middleware.RequireRole("owner"), authHandler.DeleteEmployee)

			//attendance routes
			auth.POST("/attendance/checkin", middleware.RequireRole("waiter", "cashier", "kitchen", "manager"), attendanceHandler.CheckIn)
			auth.POST("/attendance/checkout", middleware.RequireRole("waiter", "cashier", "kitchen", "manager"), attendanceHandler.CheckOut)
			auth.GET("/attendance", middleware.RequireRole("manager", "owner"), attendanceHandler.GetAttendance)

			//menu routes
			auth.GET("/menu/all", middleware.RequireRole("manager", "owner"), menuHandler.GetAllMenuItems)
			auth.POST("/menu", middleware.RequireRole("manager", "owner"), menuHandler.CreateMenuItem)
			auth.PATCH("/menu/:id", middleware.RequireRole("manager", "owner"), menuHandler.UpdateMenuItem)
			auth.DELETE("/menu/:id", middleware.RequireRole("manager", "owner"), menuHandler.DeleteMenuItem)

			//salary routes
			auth.GET("/salary", middleware.RequireRole("manager", "owner"), salaryHandler.GetSalary)

			//schedule routes
			auth.GET("/schedule", middleware.RequireRole("manager", "owner", "waiter", "cashier", "kitchen"), scheduleHandler.GetSchedule)
			auth.PUT("/schedule", middleware.RequireRole("manager", "owner"), scheduleHandler.UpdateSchedule)
		}
	}
}
