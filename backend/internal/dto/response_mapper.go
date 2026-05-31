package dto

import "github.com/TOM88bet/PHO-VANG/backend/internal/models"

func ToMenuItemResponse(item models.MenuItem) MenuItemResponse {
	return MenuItemResponse{
		ID:        item.ID,
		Name:      item.Name,
		Cat:       item.Cat,
		Price:     item.Price,
		Desc:      item.Desc,
		Img:       item.Img,
		Emoji:     item.Emoji,
		Avail:     item.Avail,
		SoldCount: item.SoldCount,
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}
}

func ToMenuItemResponses(items []models.MenuItem) []MenuItemResponse {
	responses := make([]MenuItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, ToMenuItemResponse(item))
	}
	return responses
}

func ToOrderItemResponse(item models.OrderItem) OrderItemResponse {
	return OrderItemResponse{
		ID:         item.ID,
		OrderID:    item.OrderID,
		MenuItemID: item.MenuItemID,
		Name:       item.Name,
		Emoji:      item.Emoji,
		Price:      item.Price,
		Quantity:   item.Quantity,
	}
}

func ToOrderItemResponses(items []models.OrderItem) []OrderItemResponse {
	responses := make([]OrderItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, ToOrderItemResponse(item))
	}
	return responses
}

func ToOrderResponse(order models.Order) OrderResponse {
	return OrderResponse{
		ID:        order.ID,
		TableName: order.Table,
		Status:    order.Status,
		Total:     order.Total,
		Items:     ToOrderItemResponses(order.Items),
		CreatedAt: order.CreatedAt,
		UpdatedAt: order.UpdatedAt,
	}
}

func ToOrderResponses(orders []models.Order) []OrderResponse {
	responses := make([]OrderResponse, 0, len(orders))
	for _, order := range orders {
		responses = append(responses, ToOrderResponse(order))
	}
	return responses
}

func ToSaleResponse(sale models.Sale) SaleResponse {
	return SaleResponse{
		ID:          sale.ID,
		OrderID:     sale.OrderID,
		TableName:   sale.Table,
		Total:       sale.Total,
		PayMethod:   sale.PayMethod,
		CompletedAt: sale.CompletedAt,
		CreatedAt:   sale.CreatedAt,
	}
}

func ToSaleResponses(sales []models.Sale) []SaleResponse {
	responses := make([]SaleResponse, 0, len(sales))
	for _, sale := range sales {
		responses = append(responses, ToSaleResponse(sale))
	}
	return responses
}

func ToRevenueResponse(totalRevenue float64, totalOrders int64, averageOrder float64, topItems []TopItemData, recentSales []SaleResponse) RevenueResponse {
	return RevenueResponse{
		TotalRevenue: totalRevenue,
		TotalOrders:  totalOrders,
		AverageOrder: averageOrder,
		TopItems:     topItems,
		RecentSales:  recentSales,
	}
}
