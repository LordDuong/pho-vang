package main

import (
	"errors"
	"fmt"
	"log"

	"github.com/TOM88bet/PHO-VANG/backend/config"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedDatabase() {
	users := []models.User{
		{
			Username: "admin",
			Password: hashPassword("admin123"),
			Name:     "Quan ly chung",
			Role:     "owner",
			Wage:     50000,
		},
		{
			Username: "manager",
			Password: hashPassword("manager123"),
			Name:     "Truong ca",
			Role:     "manager",
			Wage:     40000,
		},
		{
			Username: "staff",
			Password: hashPassword("staff123"),
			Name:     "Nhan vien phuc vu",
			Role:     "waiter",
			Wage:     25000,
		},
		{
			Username: "kitchen",
			Password: hashPassword("kitchen123"),
			Name:     "Bep",
			Role:     "kitchen",
			Wage:     30000,
		},
		{
			Username: "cashier",
			Password: hashPassword("cashier123"),
			Name:     "Thu ngan",
			Role:     "cashier",
			Wage:     28000,
		},
	}

	for _, user := range users {
		password := user.Password
		updates := map[string]interface{}{
			"name": user.Name,
			"role": user.Role,
			"wage": user.Wage,
		}

		err := config.DB.Where("username = ?", user.Username).Assign(updates).FirstOrCreate(&user, models.User{
			Username: user.Username,
			Password: password,
			Name:     user.Name,
			Role:     user.Role,
			Wage:     user.Wage,
		}).Error
		if err != nil {
			log.Printf("Error seeding user %s: %v", user.Username, err)
			continue
		}

		fmt.Printf("Seeded user: %s (role: %s)\n", user.Username, user.Role)
	}

	menuItems := []models.MenuItem{
		{Name: "Pho Bo", Cat: "pho", Price: 45000, Desc: "Pho bo nuoc dung ngon", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Pho Ga", Cat: "pho", Price: 40000, Desc: "Pho ga mem ngon", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Pho Tom", Cat: "pho", Price: 48000, Desc: "Pho tom tuoi sach", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Pho Hai San", Cat: "pho", Price: 55000, Desc: "Pho voi hai san mix", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Nuoc Cam", Cat: "nuoc", Price: 15000, Desc: "Cam tuoi vat", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Nuoc Dau", Cat: "nuoc", Price: 15000, Desc: "Dau tay tuoi", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Nuoc Chanh", Cat: "nuoc", Price: 12000, Desc: "Chanh tuoi mat", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Nuoc Mia", Cat: "nuoc", Price: 12000, Desc: "Mia tuoi ngon", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Ca Phe Den", Cat: "nuoc", Price: 20000, Desc: "Ca phe den dam da", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Ca Phe Sua", Cat: "nuoc", Price: 25000, Desc: "Ca phe sua ngon", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Banh Flan", Cat: "trang mieng", Price: 18000, Desc: "Banh flan mem ngon", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Kem Vani", Cat: "trang mieng", Price: 20000, Desc: "Kem vani lanh", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Che Ba Mau", Cat: "trang mieng", Price: 22000, Desc: "Che ba mau mat lanh", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Goi Cuon", Cat: "khai vi", Price: 35000, Desc: "Goi cuon tom thit", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
		{Name: "Banh Mi", Cat: "khai vi", Price: 28000, Desc: "Banh mi pate thom", Img: "https://via.placeholder.com/200", Emoji: "PV", Avail: true},
	}

	for _, item := range menuItems {
		var existing models.MenuItem
		err := config.DB.Where("name = ? AND cat = ?", item.Name, item.Cat).First(&existing).Error
		if err == nil {
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Error checking menu item %s: %v", item.Name, err)
			continue
		}
		if err := config.DB.Create(&item).Error; err != nil {
			log.Printf("Error seeding menu item %s: %v", item.Name, err)
			continue
		}

		fmt.Printf("Seeded menu: %s (%.0f d)\n", item.Name, item.Price)
	}

	fmt.Println("\nDatabase seeding completed")
	fmt.Println("\nTest Login Credentials:")
	fmt.Println("Username    | Password   | Role")
	fmt.Println("admin       | admin123   | Owner")
	fmt.Println("manager     | manager123 | Manager")
	fmt.Println("staff       | staff123   | Waiter")
	fmt.Println("kitchen     | kitchen123 | Kitchen")
	fmt.Println("cashier     | cashier123 | Cashier")
}

func hashPassword(password string) string {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Error hashing password:", err)
	}
	return string(hashed)
}
