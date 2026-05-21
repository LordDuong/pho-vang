package services

import (
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type SalaryService struct {
	attendanceRepo *repositories.AttendanceRepository
	userRepo       *repositories.UserRepository
}

func NewSalaryService(attendanceRepo *repositories.AttendanceRepository, userRepo *repositories.UserRepository) *SalaryService {
	return &SalaryService{attendanceRepo: attendanceRepo, userRepo: userRepo}
}

type SalaryRecord struct {
	UserID      uint    `json:"user_id"`
	UserName    string  `json:"user_name"`
	Role        string  `json:"role"`
	WagePerHour int     `json:"wage_per_hour"`
	TotalHours  float64 `json:"total_hours"`
	LateDays    int     `json:"late_days"`
	GrossSalary float64 `json:"gross_salary"`
	Deductions  float64 `json:"deductions"`
	NetSalary   float64 `json:"net_salary"`
}

func (s *SalaryService) Calculate(monthStr string) ([]SalaryRecord, error) {
	var month time.Time
	var err error

	if monthStr == "" {
		now := time.Now()
		month = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	} else {
		month, err = time.Parse("2006-01", monthStr)
		if err != nil {
			return nil, err
		}
	}

	nextMonth := month.AddDate(0, 1, 0)

	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var records []SalaryRecord

	for _, user := range users {
		if user.Role == "customer" || user.Role == "owner" {
			continue
		}

		attendance, err := s.attendanceRepo.FindByUserIDAndDateRange(user.ID, month, nextMonth)
		if err != nil {
			continue
		}

		var totalHours float64
		var lateDays int

		for _, a := range attendance {
			totalHours += a.TotalHours
			if a.Late {
				lateDays++
			}
		}

		grossSalary := totalHours * float64(user.Wage)
		deductions := float64(lateDays) * 50000
		netSalary := grossSalary - deductions

		records = append(records, SalaryRecord{
			UserID:      user.ID,
			UserName:    user.Name,
			Role:        user.Role,
			WagePerHour: user.Wage,
			TotalHours:  totalHours,
			LateDays:    lateDays,
			GrossSalary: grossSalary,
			Deductions:  deductions,
			NetSalary:   netSalary,
		})
	}

	return records, nil
}
