package handlers

import (
	"net/http"

	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ScheduleHandler struct {
	service *services.ScheduleService
}

func NewScheduleHandler(service *services.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{service: service}
}

func (h *ScheduleHandler) GetSchedule(c *gin.Context) {
	weekStr := c.Query("week")

	schedule, err := h.service.GetSchedule(weekStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedule,
	})
}

func (h *ScheduleHandler) UpdateSchedule(c *gin.Context) {
	var body struct {
		Week string                   `json:"week"`
		Days []map[string]interface{} `json:"days"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Dữ liệu không hợp lệ",
		})
		return
	}

	err := h.service.UpdateSchedule(body.Week, body.Days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Đã cập nhật bảng ca tuần " + body.Week,
	})
}
