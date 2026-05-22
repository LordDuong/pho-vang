package services

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/constants"
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

func (s *OrderService) CalculateOrderTotal(order *models.Order) float64 {
	var total float64
	for _, item := range order.Items {
		total += item.Price * float64(item.Quantity)
	}
	return total
}

func (s *OrderService) CreateOrder(order *models.Order) error {

	if order.Total == 0 && len(order.Items) > 0 {
		order.Total = s.CalculateOrderTotal(order)
	}
	return s.orderRepo.CreateOrder(order)
}

func (s *OrderService) GetOrderByID(id uint) (*models.Order, error) {
	return s.orderRepo.GetOrderByID(id)
}

func (s *OrderService) GetAllOrders() ([]models.Order, error) {
	return s.orderRepo.GetAllOrders()
}

func (s *OrderService) GetOrdersWithFilters(statuses []string, tableName string) ([]models.Order, error) {
	return s.orderRepo.GetOrdersWithFilters(statuses, tableName)
}

func (s *OrderService) UpdateOrderStatus(id uint, status string) error {
	order, err := s.orderRepo.GetOrderByID(id)
	if err != nil {
		return err
	}

	if !constants.IsValidStatusTransition(order.Status, status) {
		return ErrInvalidStatusTransition
	}

	return s.orderRepo.UpdateOrderStatus(id, status)
}

func (s *OrderService) GetTotalRevenue() (float64, error) {
	return s.orderRepo.GetTotalRevenue()
}
