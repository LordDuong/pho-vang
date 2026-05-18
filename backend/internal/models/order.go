package models

import "time"

type Order struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	Table     string      `json:"table_name" gorm:"type:varchar(50);column:table_name"`
	Status    string      `json:"status" gorm:"type:varchar(30);not null;default:'pending';index"`
	Total     float64     `json:"total" gorm:"type:decimal(10,2);not null;default:0"`
	Items     []OrderItem `json:"items,omitempty" gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

func (Order) TableName() string {
	return "orders"
}
