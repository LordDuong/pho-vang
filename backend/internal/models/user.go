package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"unique;not null"`
	Password string `gorm:"not null" json:"-"`
	Name     string `json:"name"`
	Role     string `gorm:"not null"`
	Wage     int    `json:"wage"`
}
