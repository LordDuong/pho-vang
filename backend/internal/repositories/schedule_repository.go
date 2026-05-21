package repositories

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"gorm.io/gorm"
)

type ScheduleRepository struct {
	db *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) *ScheduleRepository {
	return &ScheduleRepository{db: db}
}

func (r *ScheduleRepository) FindByWeek(week string) ([]models.Schedule, error) {
	var schedules []models.Schedule
	err := r.db.Preload("Employee").Where("week = ?", week).Find(&schedules).Error
	return schedules, err
}

func (r *ScheduleRepository) DeleteByWeek(week string) error {
	return r.db.Where("week = ?", week).Delete(&models.Schedule{}).Error
}

func (r *ScheduleRepository) CreateBatch(schedules []models.Schedule) error {
	return r.db.Create(&schedules).Error
}
