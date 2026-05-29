package models

type Schedule struct {
	ID         uint   `json:"id" gorm:"primaryKey"`
	Week       string `json:"week" gorm:"type:varchar(20);not null;index"`
	Day        int    `json:"day" gorm:"not null"`
	EmployeeID uint   `json:"employee_id" gorm:"not null;index"`
	Employee   User   `json:"employee,omitempty" gorm:"foreignKey:EmployeeID"`
	Shift      string `json:"shift" gorm:"type:varchar(50);not null;index"`
}
