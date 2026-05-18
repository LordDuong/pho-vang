package models

type OrderItem struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	OrderID    uint    `json:"order_id" gorm:"not null;index"`
	MenuItemID uint    `json:"menu_item_id" gorm:"not null;index"`
	Name       string  `json:"name" gorm:"type:varchar(255);not null"`
	Emoji      string  `json:"emoji" gorm:"type:varchar(10)"`
	Price      float64 `json:"price" gorm:"type:decimal(10,2);not null"`
	Quantity   int     `json:"quantity" gorm:"not null;default:1"`
}

func (OrderItem) TableName() string {
	return "order_items"
}
