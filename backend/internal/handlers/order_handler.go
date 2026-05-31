package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/TOM88bet/PHO-VANG/backend/internal/constants"
	"github.com/TOM88bet/PHO-VANG/backend/internal/dto"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	ws "github.com/TOM88bet/PHO-VANG/backend/internal/websocket"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OrderHandler struct {
	orderService *services.OrderService
	saleService  *services.SaleService
	wsHub        *ws.Hub
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

func (h *OrderHandler) SetSaleService(saleService *services.SaleService) {
	h.saleService = saleService
}

func (h *OrderHandler) SetWebSocketHub(wsHub *ws.Hub) {
	h.wsHub = wsHub
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

	createdOrder, err := h.orderService.GetOrderByID(order.ID)
	if err == nil {
		h.broadcastOrderToRoles("new_order", createdOrder)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    dto.ToOrderResponse(order),
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
		"data":    dto.ToOrderResponse(*order),
		"message": "Order retrieved successfully",
	})
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	statuses, err := parseOrderStatuses(c.QueryArray("status"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	tableName := c.Query("table")

	var orders []models.Order
	if len(statuses) > 0 || tableName != "" {
		orders, err = h.orderService.GetOrdersWithFilters(statuses, tableName)
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
		"data":    dto.ToOrderResponses(orders),
		"message": "Orders retrieved successfully",
	})
}

func parseOrderStatuses(rawStatuses []string) ([]string, error) {
	allowed := map[string]struct{}{
		constants.StatusPending:    {},
		constants.StatusConfirmed:  {},
		constants.StatusCooking:    {},
		constants.StatusReady:      {},
		constants.StatusServing:    {},
		constants.StatusWaitingPay: {},
		constants.StatusPaid:       {},
	}

	seen := make(map[string]struct{})
	statuses := make([]string, 0)

	for _, rawStatus := range rawStatuses {
		for _, status := range strings.Split(rawStatus, ",") {
			status = strings.TrimSpace(status)
			if status == "" {
				continue
			}

			if _, ok := allowed[status]; !ok {
				return nil, errors.New("invalid status value")
			}

			if _, ok := seen[status]; ok {
				continue
			}

			seen[status] = struct{}{}
			statuses = append(statuses, status)
		}
	}

	return statuses, nil
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
		if errors.Is(err, services.ErrDirectPaidUpdate) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "please use payment endpoint to mark order as paid",
			})
			return
		}

		if errors.Is(err, services.ErrInvalidStatusTransition) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "invalid status transition",
			})
			return
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
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

	updatedOrder, err := h.orderService.GetOrderByID(uint(id))
	if err == nil {
		h.broadcastOrderToRoles("order_updated", updatedOrder)
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
		if errors.Is(err, services.ErrInvalidPaymentStatus) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "order status must be waiting_pay to process payment",
			})
			return
		}

		if errors.Is(err, services.ErrDuplicateSale) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "sale already exists for this order",
			})
			return
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "order not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to create sale",
		})
		return
	}

	h.broadcastSaleToRoles("order_paid", sale)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    dto.ToSaleResponse(*sale),
		"message": "Sale created successfully",
	})
}

func (h *OrderHandler) broadcastOrderToRoles(event string, order *models.Order) {
	if h.wsHub == nil || order == nil {
		return
	}

	h.wsHub.BroadcastToRoles([]string{"waiter", "kitchen", "cashier", "manager", "owner"}, ws.Message{
		Event: event,
		Data:  dto.ToOrderResponse(*order),
	})
}

func (h *OrderHandler) broadcastSaleToRoles(event string, sale *models.Sale) {
	if h.wsHub == nil || sale == nil {
		return
	}

	h.wsHub.BroadcastToRoles([]string{"cashier", "manager", "owner"}, ws.Message{
		Event: event,
		Data:  dto.ToSaleResponse(*sale),
	})
}
