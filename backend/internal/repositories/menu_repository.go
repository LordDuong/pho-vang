package repositories

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"gorm.io/gorm"
)

type MenuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) *MenuRepository {
	return &MenuRepository{db: db}
}

func (r *MenuRepository) Create(menuItem *models.MenuItem) error {
	return r.db.Create(menuItem).Error
}

func (r *MenuRepository) GetByID(id uint) (*models.MenuItem, error) {
	var menuItem models.MenuItem

	err := r.db.First(&menuItem, id).Error

	if err != nil {
		return nil, err
	}

	return &menuItem, nil
}

func (r *MenuRepository) GetAll() ([]models.MenuItem, error) {
	var items []models.MenuItem

	err := r.db.
		Order("created_at DESC").
		Find(&items).Error

	return items, err
}

func (r *MenuRepository) Update(id uint, data map[string]interface{}) error {
	result := r.db.
		Model(&models.MenuItem{}).
		Where("id = ?", id).
		Updates(data)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (r *MenuRepository) SoftDelete(id uint) error {
	result := r.db.
		Model(&models.MenuItem{}).
		Where("id = ?", id).
		Update("avail", false)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
