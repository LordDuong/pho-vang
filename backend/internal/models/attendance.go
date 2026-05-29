package models

import "time"

type Attendance struct {
	ID         uint       `json:"id" gorm:"primaryKey"`
	UserID     uint       `json:"user_id" gorm:"not null;index"`
	User       User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Date       time.Time  `json:"date" gorm:"type:date;not null;index"`
	CheckedIn  *time.Time `json:"checked_in"`
	CheckedOut *time.Time `json:"checked_out"`
	TotalHours float64    `json:"total_hours" gorm:"default:0"`
	Late       bool       `json:"late" gorm:"default:false"`
	Status     string     `json:"status" gorm:"type:varchar(20);default:'absent';index"`
}
