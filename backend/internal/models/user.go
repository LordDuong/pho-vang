package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"type:varchar(255);unique;not null"`
	Password string `gorm:"type:varchar(255);not null" json:"-"`
	Name     string `gorm:"type:varchar(255)" json:"name"`
	Role     string `gorm:"type:varchar(50);not null" json:"role"`
	Wage     int    `json:"wage"`
}
