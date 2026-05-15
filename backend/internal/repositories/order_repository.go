package repositories

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"

	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

type TopItemResult struct {
	MenuItemID    uint    `json:"menu_item_id"`
	TotalQuantity int    `json:"total_quantity"`
	TotalRevenue  float64 `json:"total_revenue"`
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) CreateOrder(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) GetOrderByID(id uint) (*models.Order, error) {
	var order models.Order

	err := r.db.
		Preload("Items").
		First(&order, id).Error

	if err != nil {
		return nil, err
	}

	return &order, nil
}

func (r *OrderRepository) GetOrdersByCustomerID(customerID uint) ([]models.Order, error) {
	var orders []models.Order

	err := r.db.
		Preload("Items").
		Where("customer_id = ?", customerID).
		Order("created_at DESC").
		Find(&orders).Error

	return orders, err
}

func (r *OrderRepository) GetOrdersByStatus(status string) ([]models.Order, error) {
	var orders []models.Order

	err := r.db.
		Preload("Items").
		Where("status = ?", status).
		Order("created_at ASC").
		Find(&orders).Error

	return orders, err
}

func (r *OrderRepository) GetAllOrders() ([]models.Order, error) {
	var orders []models.Order

	err := r.db.
		Preload("Items").
		Order("created_at DESC").
		Find(&orders).Error

	return orders, err
}

func (r *OrderRepository) UpdateOrderStatus(id uint, status string) error {
	return r.db.
		Model(&models.Order{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *OrderRepository) GetTotalRevenue() (float64, error) {
	var total float64

	err := r.db.
		Model(&models.Order{}).
		Where("status = ?", "done").
		Select("COALESCE(SUM(total_price), 0)").
		Scan(&total).Error

	return total, err
}

func (r *OrderRepository) GetTopItems(limit int) ([]TopItemResult, error) {
	var results []TopItemResult

	err := r.db.
		Model(&models.OrderItem{}).
		Select("menu_item_id, SUM(quantity) AS total_quantity, SUM(price * quantity) AS total_revenue").
		Group("menu_item_id").
		Order("total_quantity DESC").
		Limit(limit).
		Scan(&results).Error

	return results, err
}