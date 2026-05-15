package dto

import "time"

type CreateOrderItemRequest struct {
	MenuItemID uint    `json:"menu_item_id"`
	Name       string  `json:"name,omitempty"`
	Emoji      string  `json:"emoji,omitempty"`
	Price      float64 `json:"price,omitempty"`
	Quantity   int     `json:"quantity"`
}

type CreateOrderRequest struct {
	TableName string                   `json:"table_name"`
	Items     []CreateOrderItemRequest `json:"items"`
}

type OrderItemResponse struct {
	ID         uint    `json:"id"`
	MenuItemID uint    `json:"menu_item_id"`
	Name       string  `json:"name"`
	Emoji      string  `json:"emoji"`
	Price      float64 `json:"price"`
	Quantity   int     `json:"quantity"`
}

type OrderResponse struct {
	ID        uint                `json:"id"`
	TableName string              `json:"table_name"`
	Status    string              `json:"status"`
	Total     float64             `json:"total"`
	Items     []OrderItemResponse `json:"items"`
	CreatedAt time.Time           `json:"created_at"`
	UpdatedAt time.Time           `json:"updated_at"`
}

type CreateSaleRequest struct {
	OrderID   uint   `json:"order_id" binding:"required"`
	PayMethod string `json:"pay_method" binding:"required"`
}

type SaleResponse struct {
	ID          uint      `json:"id"`
	OrderID     uint      `json:"order_id"`
	TableName   string    `json:"table_name"`
	Total       float64   `json:"total"`
	PayMethod   string    `json:"pay_method"`
	CompletedAt time.Time `json:"completed_at"`
	CreatedAt   time.Time `json:"created_at"`
}

type TopItemData struct {
	MenuItemID    uint    `json:"menu_item_id"`
	TotalQuantity int     `json:"total_quantity"`
	TotalRevenue  float64 `json:"total_revenue"`
}

type RevenueResponse struct {
	TotalRevenue float64        `json:"total_revenue"`
	TotalOrders  int64          `json:"total_orders"`
	AverageOrder float64        `json:"average_order"`
	TopItems     []TopItemData  `json:"top_items"`
	RecentSales  []SaleResponse `json:"recent_sales"`
}
