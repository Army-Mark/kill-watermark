package api

import (
	"video-watermark-remover/api/handlers"
	"video-watermark-remover/config"
	"video-watermark-remover/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	authHandler := handlers.NewAuthHandler(cfg)
	videoHandler := handlers.NewVideoHandler()
	historyHandler := handlers.NewHistoryHandler()
	authMiddleware := middleware.AuthMiddleware(cfg)

	// 启用 CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "message": "OK"})
		})

		video := api.Group("/")
		video.Use(authMiddleware)
		{
			video.POST("/parse", videoHandler.Parse)
		}

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		user := api.Group("/user")
		user.Use(authMiddleware)
		{
			user.GET("/profile", authHandler.GetProfile)
		}

		history := api.Group("/history")
		history.Use(authMiddleware)
		{
			history.GET("", historyHandler.List)
			history.DELETE("/:id", historyHandler.Delete)
		}
	}
}
