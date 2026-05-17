package services

import (
	"errors"

	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo *repositories.UserRepository
}

func NewAuthService(repo *repositories.UserRepository) *AuthService {
	return &AuthService{repo: repo}
}

func (s *AuthService) Login(username, password string) (*models.User, error) {
	user, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, errors.New("Sai tên đăng nhập hoặc mật khẩu")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("Sai tên đăng nhập hoặc mật khẩu")
	}

	return user, nil
}

func (s *AuthService) CreateEmployee(username, password, name, role string, wage int) (*models.User, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username: username,
		Password: string(hashed),
		Name:     name,
		Role:     role,
		Wage:     wage,
	}

	err = s.repo.Create(user)
	return user, err
}
