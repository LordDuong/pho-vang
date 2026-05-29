package models

import "time"

type Sale struct {
	ID uint `json:"id" gorm:"primaryKey"`
	// Kiểm tra tránh thanh toán trùng đơn hàng
	OrderID     uint      `json:"order_id" gorm:"not null;uniqueIndex:idx_order_id"`
	Table       string    `json:"table_name" gorm:"type:varchar(50);column:table_name"`
	Total       float64   `json:"total" gorm:"type:decimal(10,2);not null"`
	PayMethod   string    `json:"pay_method" gorm:"type:varchar(50);not null;index"`
	CompletedAt time.Time `json:"completed_at"`
	CreatedAt   time.Time `json:"created_at" gorm:"index"`
}

func (Sale) TableName() string {
	return "sales"
}
