package repositories

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"gorm.io/gorm"
)

type SaleRepository struct {
	db *gorm.DB
}

func NewSaleRepository(db *gorm.DB) *SaleRepository {
	return &SaleRepository{db: db}
}

func (r *SaleRepository) CreateSale(sale *models.Sale) error {
	return r.db.Create(sale).Error
}

func (r *SaleRepository) GetSaleByID(id uint) (*models.Sale, error) {
	var sale models.Sale

	err := r.db.First(&sale, id).Error

	if err != nil {
		return nil, err
	}

	return &sale, nil
}

func (r *SaleRepository) GetTotalRevenue() (float64, error) {
	var total float64

	err := r.db.
		Model(&models.Sale{}).
		Select("COALESCE(SUM(total), 0)").
		Scan(&total).Error

	return total, err
}

func (r *SaleRepository) GetTotalOrders() (int64, error) {
	var count int64

	err := r.db.
		Model(&models.Sale{}).
		Count(&count).Error

	return count, err
}

func (r *SaleRepository) GetRecentSales(limit int) ([]models.Sale, error) {
	var sales []models.Sale

	err := r.db.
		Order("created_at DESC").
		Limit(limit).
		Find(&sales).Error

	return sales, err
}

func (r *SaleRepository) SaleExistsByOrderID(orderID uint) (bool, error) {
	var count int64

	err := r.db.
		Model(&models.Sale{}).
		Where("order_id = ?", orderID).
		Count(&count).Error

	return count > 0, err
}
