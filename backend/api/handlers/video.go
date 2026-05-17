package handlers

import (
	"net/http"
	"video-watermark-remover/database"
	"video-watermark-remover/models"
	"video-watermark-remover/services/parser"

	"github.com/gin-gonic/gin"
)

type VideoHandler struct {
	parserMgr *parser.ParserManager
}

func NewVideoHandler() *VideoHandler {
	return &VideoHandler{
		parserMgr: parser.NewParserManager(),
	}
}

func (h *VideoHandler) Parse(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required,url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "请输入有效的URL"})
		return
	}

	videoInfo, err := h.parserMgr.Parse(req.URL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// 如果用户登录了，保存历史记录
	if userID, exists := c.Get("userId"); exists {
		history := models.History{
			UserID:      userID.(uint),
			Platform:    videoInfo.Platform,
			OriginalURL: req.URL,
			VideoTitle:  videoInfo.Title,
			VideoURL:    videoInfo.VideoURL,
			CoverURL:    videoInfo.CoverURL,
		}
		database.DB.Create(&history)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    videoInfo,
	})
}
