package models

import "time"

type OrderItem struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	OrderID    uint      `json:"order_id" gorm:"not null;index"`
	MenuItemID uint      `json:"menu_item_id" gorm:"not null;index"`
	Quantity   int       `json:"quantity" gorm:"not null;default:1"`
	Note       string    `json:"note" gorm:"type:text"`
	Status     string    `json:"status" gorm:"type:varchar(30);not null;default:'pending';index"`
	Price      float64   `json:"price" gorm:"type:decimal(10,2);not null"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (OrderItem) TableName() string {
	return "order_items"
}
