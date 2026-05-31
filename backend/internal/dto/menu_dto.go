package dto

import "time"

type CreateMenuItemRequest struct {
	Name  string  `json:"name" binding:"required"`
	Cat   string  `json:"cat" binding:"required"`
	Price float64 `json:"price" binding:"required,gt=0"`
	Desc  string  `json:"desc,omitempty"`
	Img   string  `json:"img,omitempty"`
	Emoji string  `json:"emoji,omitempty"`
	Avail bool    `json:"avail,omitempty"`
}

type UpdateMenuItemRequest struct {
	Name  string  `json:"name,omitempty"`
	Cat   string  `json:"cat,omitempty"`
	Price float64 `json:"price,omitempty"`
	Desc  string  `json:"desc,omitempty"`
	Img   string  `json:"img,omitempty"`
	Emoji string  `json:"emoji,omitempty"`
	Avail *bool   `json:"avail,omitempty"`
}

type MenuItemResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Cat       string    `json:"cat"`
	Price     float64   `json:"price"`
	Desc      string    `json:"des"`
	Img       string    `json:"img"`
	Emoji     string    `json:"emoji"`
	Avail     bool      `json:"avail"`
	SoldCount int       `json:"sold_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
