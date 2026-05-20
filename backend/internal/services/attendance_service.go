package services

import (
	"errors"
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type AttendanceService struct {
	repo *repositories.AttendanceRepository
}

func NewAttendanceService(repo *repositories.AttendanceRepository) *AttendanceService {
	return &AttendanceService{repo: repo}
}

func (s *AttendanceService) CheckIn(userID uint) (*models.Attendance, error) {
	// Check if already checked in today
	existing, err := s.repo.FindTodayByUserID(userID)
	if err == nil && existing != nil {
		return nil, errors.New("Bạn đã điểm danh hôm nay rồi")
	}

	now := time.Now()
	today := now.Truncate(24 * time.Hour)

	// Late if after 08:15
	lateThreshold := time.Date(now.Year(), now.Month(), now.Day(), 8, 15, 0, 0, now.Location())
	isLate := now.After(lateThreshold)

	attendance := &models.Attendance{
		UserID:    userID,
		Date:      today,
		CheckedIn: &now,
		Late:      isLate,
		Status:    "on_time",
	}

	if isLate {
		attendance.Status = "late"
	}

	err = s.repo.Create(attendance)
	return attendance, err
}

func (s *AttendanceService) CheckOut(userID uint) (*models.Attendance, error) {
	attendance, err := s.repo.FindTodayByUserID(userID)
	if err != nil {
		return nil, errors.New("Bạn chưa điểm danh vào hôm nay")
	}

	if attendance.CheckedOut != nil {
		return nil, errors.New("Bạn đã điểm danh ra rồi")
	}

	now := time.Now()
	attendance.CheckedOut = &now

	// Calculate total hours
	duration := now.Sub(*attendance.CheckedIn)
	attendance.TotalHours = duration.Hours()

	err = s.repo.Update(attendance)
	return attendance, err
}

func (s *AttendanceService) GetByDate(dateStr string) ([]models.Attendance, error) {
	var date time.Time
	var err error

	if dateStr == "" {
		date = time.Now()
	} else {
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, errors.New("Định dạng ngày không hợp lệ (YYYY-MM-DD)")
		}
	}

	return s.repo.FindByDate(date)
}

func (s *AttendanceService) GetByUserID(userID uint) ([]models.Attendance, error) {
	return s.repo.FindByUserID(userID)
}
