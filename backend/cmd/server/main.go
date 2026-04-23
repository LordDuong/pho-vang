package main

import (
	"log"

	"github.com/TOM88bet/PHO-VANG/backend/config"
	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadEnv()
	config.ConnectDatabase()

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Go go",
		})
	})

	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}