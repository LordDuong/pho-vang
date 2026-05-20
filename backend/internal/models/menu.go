package models

import "time"

type MenuItem struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null;index"`
	Cat       string    `json:"cat" gorm:"type:varchar(50);not null;index"`
	Price     float64   `json:"price" gorm:"type:decimal(10,2);not null"`
	Desc      string    `json:"desc" gorm:"type:text"`
	Img       string    `json:"img" gorm:"type:varchar(500)"`
	Emoji     string    `json:"emoji" gorm:"type:varchar(10)"`
	Avail     bool      `json:"avail" gorm:"default:true;index"`
	SoldCount int       `json:"sold_count" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MenuItem) TableName() string {
	return "menu_items"
}
