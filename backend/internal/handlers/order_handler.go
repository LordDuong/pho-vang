package handlers

import (
	"net/http"
	"strconv"

	"github.com/TOM88bet/PHO-VANG/backend/internal/constants"
	"github.com/TOM88bet/PHO-VANG/backend/internal/dto"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService *services.OrderService
	saleService  *services.SaleService
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

func (h *OrderHandler) SetSaleService(saleService *services.SaleService) {
	h.saleService = saleService
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var request dto.CreateOrderRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid request body",
		})
		return
	}

	if request.TableName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "table_name is required",
		})
		return
	}

	if len(request.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "items array cannot be empty",
		})
		return
	}

	var items []models.OrderItem
	var totalPrice float64

	for _, itemReq := range request.Items {
		if itemReq.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "quantity must be greater than 0",
			})
			return
		}

		if itemReq.Price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "price cannot be negative",
			})
			return
		}

		totalPrice += itemReq.Price * float64(itemReq.Quantity)
		items = append(items, models.OrderItem{
			MenuItemID: itemReq.MenuItemID,
			Name:       itemReq.Name,
			Emoji:      itemReq.Emoji,
			Price:      itemReq.Price,
			Quantity:   itemReq.Quantity,
		})
	}

	order := models.Order{
		Table:  request.TableName,
		Status: "pending",
		Total:  totalPrice,
		Items:  items,
	}

	err := h.orderService.CreateOrder(&order)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to create order",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    order,
		"message": "Order created successfully",
	})
}

func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid order id",
		})
		return
	}

	order, err := h.orderService.GetOrderByID(uint(id))

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "order not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
		"message": "Order retrieved successfully",
	})
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	status := c.Query("status")
	tableName := c.Query("table")

	var orders []models.Order
	var err error

	if status != "" || tableName != "" {
		orders, err = h.orderService.GetOrdersWithFilters(status, tableName)
	} else {
		orders, err = h.orderService.GetAllOrders()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to fetch orders",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
		"message": "Orders retrieved successfully",
	})
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid order id",
		})
		return
	}

	var request gin.H
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid request body",
		})
		return
	}

	status, ok := request["status"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "status is required",
		})
		return
	}

	validStatuses := []string{
		constants.StatusPending,
		constants.StatusConfirmed,
		constants.StatusCooking,
		constants.StatusReady,
		constants.StatusServing,
		constants.StatusWaitingPay,
		constants.StatusPaid,
	}

	isValid := false
	for _, valid := range validStatuses {
		if status == valid {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid status value",
		})
		return
	}

	err = h.orderService.UpdateOrderStatus(uint(id), status)

	if err != nil {
		if err.Error() == "invalid status transition" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "invalid status transition",
			})
			return
		}

		if err.Error() == "order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "order not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to update order status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order status updated successfully",
	})
}

func (h *OrderHandler) GetRevenue(c *gin.Context) {
	stats, err := h.saleService.GetRevenueStats()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to calculate revenue",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
		"message": "Revenue retrieved successfully",
	})
}

func (h *OrderHandler) CreateSale(c *gin.Context) {
	var request dto.CreateSaleRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid request body",
		})
		return
	}

	if request.OrderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "order_id is required",
		})
		return
	}

	if request.PayMethod == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "pay_method is required",
		})
		return
	}

	validPayMethods := []string{
		constants.PayMethodCash,
		constants.PayMethodTransfer,
		constants.PayMethodMomo,
		constants.PayMethodVNPay,
	}

	isValid := false
	for _, valid := range validPayMethods {
		if request.PayMethod == valid {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid pay_method value",
		})
		return
	}

	sale, err := h.saleService.CreateSale(request.OrderID, request.PayMethod)

	if err != nil {
		if err.Error() == "order not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "order not found",
			})
			return
		}

		if err.Error() == "order status must be waiting_pay to process payment" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "order status must be waiting_pay to process payment",
			})
			return
		}

		if err.Error() == "sale already exists for this order" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "sale already exists for this order",
			})
			return
		}

		if err.Error() == "order already paid" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "order already paid",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to create sale",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    sale,
		"message": "Sale created successfully",
	})
}
