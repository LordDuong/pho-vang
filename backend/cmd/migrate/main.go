package main

import (
	"fmt"
	"log"

	"github.com/TOM88bet/PHO-VANG/backend/config"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found")
	}

	if err := config.ConnectDatabase(); err != nil {
		log.Fatal("failed to connect database: ", err)
	}

	if err := config.DB.Migrator().DropTable("order_items"); err != nil {
		log.Println("error dropping order_items:", err)
	}

	if err := config.DB.Migrator().DropTable("orders"); err != nil {
		log.Println("error dropping orders:", err)
	}

	fmt.Println("Tables dropped successfully")
}
