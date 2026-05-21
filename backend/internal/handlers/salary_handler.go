package handlers

import (
	"net/http"

	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type SalaryHandler struct {
	service *services.SalaryService
}

func NewSalaryHandler(service *services.SalaryService) *SalaryHandler {
	return &SalaryHandler{service: service}
}

func (h *SalaryHandler) GetSalary(c *gin.Context) {
	monthStr := c.Query("month")

	records, err := h.service.Calculate(monthStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    records,
	})
}
