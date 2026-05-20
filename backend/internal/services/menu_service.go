package services

import (
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type MenuService struct {
	menuRepo *repositories.MenuRepository
}

func NewMenuService(menuRepo *repositories.MenuRepository) *MenuService {
	return &MenuService{
		menuRepo: menuRepo,
	}
}

func (s *MenuService) CreateMenuItem(item *models.MenuItem) error {
	// Gán mặc định
	item.Avail = true
	item.SoldCount = 0
	if item.Emoji == "" {
		item.Emoji = "🍽️"
	}

	return s.menuRepo.Create(item)
}

func (s *MenuService) GetMenuItems() ([]models.MenuItem, error) {
	items, err := s.menuRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Chỉ trả item có sẵn
	var availableItems []models.MenuItem
	for _, item := range items {
		if item.Avail {
			availableItems = append(availableItems, item)
		}
	}

	return availableItems, nil
}

func (s *MenuService) GetMenuItemByID(id uint) (*models.MenuItem, error) {
	return s.menuRepo.GetByID(id)
}

func (s *MenuService) UpdateMenuItem(id uint, data map[string]interface{}) error {
	// Kiểm tra giá nếu được cập nhật
	if price, ok := data["price"]; ok {
		if priceVal, ok := price.(float64); ok && priceVal <= 0 {
			return ErrInvalidMenuItemPrice
		}
	}

	return s.menuRepo.Update(id, data)
}

func (s *MenuService) DeleteMenuItem(id uint) error {
	return s.menuRepo.SoftDelete(id)
}
