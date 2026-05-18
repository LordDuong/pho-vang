package services

import (
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/constants"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type SaleService struct {
	saleRepo  *repositories.SaleRepository
	orderRepo *repositories.OrderRepository
}

func NewSaleService(saleRepo *repositories.SaleRepository, orderRepo *repositories.OrderRepository) *SaleService {
	return &SaleService{
		saleRepo:  saleRepo,
		orderRepo: orderRepo,
	}
}

func (s *SaleService) CreateSale(orderID uint, payMethod string) (*models.Sale, error) {
	order, err := s.orderRepo.GetOrderByID(orderID)
	if err != nil {
		return nil, err
	}

	if order.Status != constants.StatusWaitingPay {
		return nil, ErrInvalidPaymentStatus
	}

	saleExists, err := s.saleRepo.SaleExistsByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	if saleExists {
		return nil, ErrDuplicateSale
	}

	now := time.Now()
	sale := &models.Sale{
		OrderID:     orderID,
		Table:       order.Table,
		Total:       order.Total,
		PayMethod:   payMethod,
		CompletedAt: now,
	}

	if err := s.saleRepo.CreateSale(sale); err != nil {
		return nil, err
	}

	if err := s.orderRepo.UpdateOrderStatus(orderID, constants.StatusPaid); err != nil {
		return nil, err
	}

	return sale, nil
}

func (s *SaleService) GetRevenueStats() (map[string]interface{}, error) {
	totalRevenue, err := s.saleRepo.GetTotalRevenue()
	if err != nil {
		return nil, err
	}

	totalOrders, err := s.saleRepo.GetTotalOrders()
	if err != nil {
		return nil, err
	}

	recentSales, err := s.saleRepo.GetRecentSales(10)
	if err != nil {
		return nil, err
	}

	topItems, err := s.orderRepo.GetTopItemsFromPaidOrders(10)
	if err != nil {
		return nil, err
	}

	var avgOrder float64
	if totalOrders > 0 {
		avgOrder = totalRevenue / float64(totalOrders)
	}

	return map[string]interface{}{
		"total_revenue": totalRevenue,
		"total_orders":  totalOrders,
		"average_order": avgOrder,
		"top_items":     topItems,
		"recent_sales":  recentSales,
	}, nil
}
