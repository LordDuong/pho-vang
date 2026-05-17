package models

import "gorm.io/gorm"

type Order struct {
	gorm.Model
	TableNumber   string
	Status        string
	Total         float64
	PaymentMethod string
}
