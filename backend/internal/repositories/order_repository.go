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
	TotalQuantity int     `json:"total_quantity"`
	TotalRevenue  float64 `json:"total_revenue"`
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) WithDB(db *gorm.DB) *OrderRepository {
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

func (r *OrderRepository) GetAllOrders() ([]models.Order, error) {
	var orders []models.Order

	err := r.db.
		Preload("Items").
		Order("created_at DESC").
		Find(&orders).Error

	return orders, err
}

func (r *OrderRepository) GetOrdersWithFilters(statuses []string, tableName string) ([]models.Order, error) {
	var orders []models.Order

	query := r.db

	conditions := map[string]interface{}{}
	if len(statuses) == 1 {
		conditions["status"] = statuses[0]
	} else if len(statuses) > 1 {
		query = query.Where("status IN ?", statuses)
	}
	if tableName != "" {
		conditions["table_name"] = tableName
	}

	if len(conditions) > 0 {
		query = query.Where(conditions)
	}

	query = query.Preload("Items")
	err := query.
		Order("created_at DESC").
		Find(&orders).Error

	return orders, err
}

func (r *OrderRepository) UpdateOrderStatus(id uint, status string) error {
	result := r.db.
		Model(&models.Order{}).
		Where("id = ?", id).
		Update("status", status)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (r *OrderRepository) GetTotalRevenue() (float64, error) {
	var total float64

	err := r.db.
		Model(&models.Order{}).
		Where("status = ?", "paid").
		Select("COALESCE(SUM(total), 0)").
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

func (r *OrderRepository) GetTopItemsFromPaidOrders(limit int) ([]TopItemResult, error) {
	var results []TopItemResult

	err := r.db.
		Model(&models.OrderItem{}).
		Joins("JOIN orders ON order_items.order_id = orders.id").
		Where("orders.status = ?", "paid").
		Select("order_items.menu_item_id, SUM(order_items.quantity) AS total_quantity, SUM(order_items.price * order_items.quantity) AS total_revenue").
		Group("order_items.menu_item_id").
		Order("total_quantity DESC").
		Limit(limit).
		Scan(&results).Error

	return results, err
}
