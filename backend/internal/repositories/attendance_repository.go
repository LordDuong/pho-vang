package repositories

import (
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"gorm.io/gorm"
)

type AttendanceRepository struct {
	db *gorm.DB
}

func NewAttendanceRepository(db *gorm.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) FindTodayByUserID(userID uint) (*models.Attendance, error) {
	var attendance models.Attendance
	today := time.Now().Format("2006-01-02")
	err := r.db.Where("user_id = ? AND DATE(date) = ?", userID, today).First(&attendance).Error
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) Create(attendance *models.Attendance) error {
	return r.db.Create(attendance).Error
}

func (r *AttendanceRepository) Update(attendance *models.Attendance) error {
	return r.db.Save(attendance).Error
}

func (r *AttendanceRepository) FindByDate(date time.Time) ([]models.Attendance, error) {
	var records []models.Attendance
	dateStr := date.Format("2006-01-02")
	err := r.db.
		Preload("User").
		Where("DATE(date) = ?", dateStr).
		Find(&records).Error
	return records, err
}

func (r *AttendanceRepository) FindByUserID(userID uint) ([]models.Attendance, error) {
	var records []models.Attendance
	err := r.db.
		Where("user_id = ?", userID).
		Order("date DESC").
		Find(&records).Error
	return records, err
}

func (r *AttendanceRepository) FindByUserIDAndDateRange(userID uint, from, to time.Time) ([]models.Attendance, error) {
	var records []models.Attendance
	err := r.db.
		Where("user_id = ? AND date >= ? AND date < ?", userID, from, to).
		Find(&records).Error
	return records, err
}
