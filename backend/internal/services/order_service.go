package services

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type OrderService struct {
	orderRepo *repositories.OrderRepository
}

func NewOrderService(orderRepo *repositories.OrderRepository) *OrderService {
	return &OrderService{
		orderRepo: orderRepo,
	}
}

func (s *OrderService) CreateOrder(order *models.Order) error {
	return s.orderRepo.CreateOrder(order)
}

func (s *OrderService) GetOrderByID(id uint) (*models.Order, error) {
	return s.orderRepo.GetOrderByID(id)
}

func (s *OrderService) GetCustomerOrders(customerID uint) ([]models.Order, error) {
	return s.orderRepo.GetOrdersByCustomerID(customerID)
}

func (s *OrderService) GetOrdersByStatus(status string) ([]models.Order, error) {
	return s.orderRepo.GetOrdersByStatus(status)
}

func (s *OrderService) UpdateOrderStatus(id uint, status string) error {
	return s.orderRepo.UpdateOrderStatus(id, status)
}

func (s *OrderService) GetTotalRevenue() (float64, error) {
	return s.orderRepo.GetTotalRevenue()
}

func (s *OrderService) GetTopItems(limit int) ([]repositories.TopItemResult, error) {
	return s.orderRepo.GetTopItems(limit)
}