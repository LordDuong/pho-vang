package services

import (
	"errors"
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/constants"
	"github.com/TOM88bet/PHO-VANG/backend/internal/dto"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
	mysql "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
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
	saleExists, err := s.saleRepo.SaleExistsByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	if saleExists {
		return nil, ErrDuplicateSale
	}

	order, err := s.orderRepo.GetOrderByID(orderID)
	if err != nil {
		return nil, err
	}

	if order.Status != constants.StatusWaitingPay {
		return nil, ErrInvalidPaymentStatus
	}

	now := time.Now()
	sale := &models.Sale{
		OrderID:     orderID,
		Table:       order.Table,
		Total:       order.Total,
		PayMethod:   payMethod,
		CompletedAt: now,
	}

	err = s.saleRepo.Transaction(func(tx *gorm.DB) error {
		txSaleRepo := s.saleRepo.WithDB(tx)
		txOrderRepo := s.orderRepo.WithDB(tx)

		if err := txSaleRepo.CreateSale(sale); err != nil {
			var me *mysql.MySQLError
			if errors.As(err, &me) && me.Number == 1062 {
				return ErrDuplicateSale
			}
			return err
		}

		if err := txOrderRepo.UpdateOrderStatus(orderID, constants.StatusPaid); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return sale, nil
}

func (s *SaleService) GetRevenueStats() (dto.RevenueResponse, error) {
	totalRevenue, err := s.saleRepo.GetTotalRevenue()
	if err != nil {
		return dto.RevenueResponse{}, err
	}

	totalOrders, err := s.saleRepo.GetTotalOrders()
	if err != nil {
		return dto.RevenueResponse{}, err
	}

	recentSales, err := s.saleRepo.GetRecentSales(10)
	if err != nil {
		return dto.RevenueResponse{}, err
	}

	topItems, err := s.orderRepo.GetTopItemsFromPaidOrders(10)
	if err != nil {
		return dto.RevenueResponse{}, err
	}

	var avgOrder float64
	if totalOrders > 0 {
		avgOrder = totalRevenue / float64(totalOrders)
	}

	topItemResponses := make([]dto.TopItemData, 0, len(topItems))
	for _, item := range topItems {
		topItemResponses = append(topItemResponses, dto.TopItemData{
			MenuItemID:    item.MenuItemID,
			TotalQuantity: item.TotalQuantity,
			TotalRevenue:  item.TotalRevenue,
		})
	}

	return dto.ToRevenueResponse(
		totalRevenue,
		totalOrders,
		avgOrder,
		topItemResponses,
		dto.ToSaleResponses(recentSales),
	), nil
}
