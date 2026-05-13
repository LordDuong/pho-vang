package models

import "time"

type Order struct {
	ID         uint        `json:"id" gorm:"primaryKey"`
	CustomerID uint        `json:"customer_id" gorm:"not null;index"`
	Status     string      `json:"status" gorm:"type:varchar(30);not null;default:'pending';index"`
	TotalPrice float64     `json:"total_price" gorm:"type:decimal(10,2);not null;default:0"`
	Items      []OrderItem `json:"items,omitempty" gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

func (Order) TableName() string {
	return "orders"
}
