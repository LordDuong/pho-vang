package handlers

import (
	"net/http"
	"strconv"

	"github.com/TOM88bet/PHO-VANG/backend/internal/dto"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var request dto.CreateOrderRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid request body",
		})
		return
	}

	order := models.Order{
		Status: "pending",
	}

	err := h.orderService.CreateOrder(&order)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to create order",
		})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid order id",
		})
		return
	}

	order, err := h.orderService.GetOrderByID(uint(id))

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "order not found",
		})
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) GetOrdersByStatus(c *gin.Context) {
	status := c.Query("status")

	orders, err := h.orderService.GetOrdersByStatus(status)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to fetch orders",
		})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	idParam := c.Param("id")
	status := c.Param("status")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid order id",
		})
		return
	}

	err = h.orderService.UpdateOrderStatus(uint(id), status)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to update order status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order status updated successfully",
	})
}

func (h *OrderHandler) GetTotalRevenue(c *gin.Context) {
	total, err := h.orderService.GetTotalRevenue()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to calculate revenue",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue": total,
	})
}

func (h *OrderHandler) GetTopItems(c *gin.Context) {
	items, err := h.orderService.GetTopItems(10)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to fetch top items",
		})
		return
	}

	c.JSON(http.StatusOK, items)
}