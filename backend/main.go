package main

import (
	"video-watermark-remover/api"
	"video-watermark-remover/config"
	"video-watermark-remover/database"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Init(cfg.DatabaseDSN)

	r := gin.Default()
	api.SetupRoutes(r, cfg)
	
	r.Run(":" + cfg.Port)
}
