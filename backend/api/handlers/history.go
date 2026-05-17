package handlers

import (
	"net/http"
	"video-watermark-remover/database"
	"video-watermark-remover/models"

	"github.com/gin-gonic/gin"
)

type HistoryHandler struct{}

func NewHistoryHandler() *HistoryHandler {
	return &HistoryHandler{}
}

func (h *HistoryHandler) List(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "请先登录"})
		return
	}

	var histories []models.History
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&histories)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    histories,
	})
}

func (h *HistoryHandler) Delete(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "请先登录"})
		return
	}
	
	id := c.Param("id")
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.History{})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
