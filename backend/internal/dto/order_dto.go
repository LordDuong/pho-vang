package dto

import "time"

type CreateOrderItemRequest struct {
	MenuItemID uint   `json:"menu_item_id"`
	Quantity   int    `json:"quantity"`
	Note       string `json:"note"`
}

type CreateOrderRequest struct {
	Items []CreateOrderItemRequest `json:"items"`
}

type OrderItemResponse struct {
	ID         uint    `json:"id"`
	MenuItemID uint    `json:"menu_item_id"`
	Quantity   int     `json:"quantity"`
	Note       string  `json:"note"`
	Status     string  `json:"status"`
	Price      float64 `json:"price"`
}

type OrderResponse struct {
	ID         uint                `json:"id"`
	CustomerID uint                `json:"customer_id"`
	Status     string              `json:"status"`
	TotalPrice float64             `json:"total_price"`
	Items      []OrderItemResponse `json:"items"`
	CreatedAt  time.Time           `json:"created_at"`
}