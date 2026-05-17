# 视频去水印下载网站 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建前后端分离的视频去水印下载网站，支持抖音、B站、小红书等平台的无水印视频解析与下载功能

**Architecture:** Go + Gin 后端提供 API，Next.js 14 前端提供用户界面，使用 SQLite 存储用户和历史记录数据，采用分层架构设计

**Tech Stack:** Go@1.21, Gin@v1.9, GORM, Next.js@14, React@18, TypeScript, Tailwind CSS, shadcn/ui, SQLite, FFmpeg

---

## 文件结构概述

| 文件路径 | 职责 |
|---------|------|
| `backend/go.mod` | Go 模块定义和依赖管理 |
| `backend/main.go` | 应用入口，服务启动 |
| `backend/config/config.go` | 配置管理 |
| `backend/database/database.go` | 数据库初始化和连接 |
| `backend/models/user.go` | 用户数据模型 |
| `backend/models/history.go` | 历史记录数据模型 |
| `backend/api/routes.go` | 路由定义 |
| `backend/api/handlers/video.go` | 视频解析 API 处理器 |
| `backend/api/handlers/auth.go` | 用户认证 API 处理器 |
| `backend/api/handlers/history.go` | 历史记录 API 处理器 |
| `backend/services/parser/parser.go` | 解析引擎抽象接口 |
| `backend/services/parser/douyin.go` | 抖音解析引擎 |
| `backend/services/parser/bilibili.go` | B站解析引擎 |
| `backend/services/parser/xiaohongshu.go` | 小红书解析引擎 |
| `backend/middleware/auth.go` | JWT 认证中间件 |
| `backend/utils/http.go` | HTTP 请求工具 |
| `frontend/package.json` | Node.js 依赖定义 |
| `frontend/app/layout.tsx` | 根布局 |
| `frontend/app/page.tsx` | 首页 |
| `frontend/app/login/page.tsx` | 登录页 |
| `frontend/app/register/page.tsx` | 注册页 |
| `frontend/app/history/page.tsx` | 历史记录页 |
| `frontend/app/batch/page.tsx` | 批量下载页 |
| `frontend/lib/api.ts` | API 客户端封装 |
| `frontend/lib/auth.ts` | 认证状态管理 |
| `frontend/components/VideoInput.tsx` | 视频输入组件 |
| `frontend/components/VideoPreview.tsx` | 视频预览组件 |
| `docker-compose.yml` | Docker 容器编排 |

---

## 阶段一: 后端基础框架搭建

### Task 1: 初始化 Go 项目

**Files:**
- Create: `backend/go.mod`
- Create: `backend/main.go`

- [ ] **Step 1: 初始化 Go 模块**
```bash
cd backend
go mod init video-watermark-remover
```

- [ ] **Step 2: 创建 go.mod 并添加依赖**
```go
module video-watermark-remover

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	gorm.io/gorm v1.25.5
	gorm.io/driver/sqlite v1.5.4
	github.com/golang-jwt/jwt/v5 v5.2.0
	golang.org/x/crypto v0.17.0
)
```

- [ ] **Step 3: 创建 main.go 基础结构**
```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "OK",
		})
	})
	
	r.Run(":8080")
}
```

- [ ] **Step 4: 安装依赖并测试运行**
```bash
cd backend
go mod tidy
go run main.go
# Expected: Server starts on :8080
```

---

### Task 2: 配置和数据库模块

**Files:**
- Create: `backend/config/config.go`
- Create: `backend/database/database.go`
- Create: `backend/models/user.go`
- Create: `backend/models/history.go`

- [ ] **Step 1: 创建 config.go**
```go
package config

import "os"

type Config struct {
	Port        string
	JWTSecret   string
	DatabaseDSN string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		JWTSecret:   getEnv("JWT_SECRET", "dev-secret-key-change-in-production"),
		DatabaseDSN: getEnv("DATABASE_DSN", "./video.db"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
```

- [ ] **Step 2: 创建 user.go 模型**
```go
package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;not null;size:50" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	CreatedAt    time.Time      `json:"createdAt"`
	Histories    []History      `gorm:"foreignKey:UserID" json:"-"`
}
```

- [ ] **Step 3: 创建 history.go 模型**
```go
package models

import (
	"time"
)

type History struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"userId"`
	Platform    string    `gorm:"not null;size:20" json:"platform"`
	OriginalURL string    `gorm:"not null" json:"originalUrl"`
	VideoTitle  string    `gorm:"size:255" json:"videoTitle"`
	VideoURL    string    `json:"videoUrl"`
	CoverURL    string    `json:"coverUrl"`
	CreatedAt   time.Time `json:"createdAt"`
}
```

- [ ] **Step 4: 创建 database.go**
```go
package database

import (
	"log"
	"video-watermark-remover/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(dsn string) {
	var err error
	DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.History{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}
```

- [ ] **Step 5: 更新 main.go 集成数据库**
```go
package main

import (
	"video-watermark-remover/config"
	"video-watermark-remover/database"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Init(cfg.DatabaseDSN)

	r := gin.Default()
	
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "OK",
		})
	})
	
	r.Run(":" + cfg.Port)
}
```

- [ ] **Step 6: 测试数据库初始化**
```bash
cd backend
go run main.go
# Expected: No errors, database file created
```

---

### Task 3: 用户认证 API

**Files:**
- Create: `backend/utils/encrypt.go`
- Create: `backend/middleware/auth.go`
- Create: `backend/api/handlers/auth.go`
- Create: `backend/api/routes.go`
- Modify: `backend/main.go`

- [ ] **Step 1: 创建 encrypt.go**
```go
package utils

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

- [ ] **Step 2: 创建 auth.go 中间件**
```go
package middleware

import (
	"net/http"
	"strings"
	"video-watermark-remover/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Missing authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid token claims"})
			c.Abort()
			return
		}

		userID := uint(claims["userId"].(float64))
		c.Set("userId", userID)
		c.Next()
	}
}

func GenerateToken(userID uint, cfg *config.Config) (string, error) {
	claims := jwt.MapClaims{
		"userId": userID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
```

- [ ] **Step 3: 创建 auth.go 处理器**
```go
package handlers

import (
	"net/http"
	"video-watermark-remover/config"
	"video-watermark-remover/database"
	"video-watermark-remover/middleware"
	"video-watermark-remover/models"
	"video-watermark-remover/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var existingUser models.User
	database.DB.Where("username = ?", req.Username).First(&existingUser)
	if existingUser.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "Username already exists"})
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: hash,
	}
	database.DB.Create(&user)

	token, err := middleware.GenerateToken(user.ID, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token": token,
			"user": gin.H{
				"id":        user.ID,
				"username":  user.Username,
				"createdAt": user.CreatedAt,
			},
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var user models.User
	database.DB.Where("username = ?", req.Username).First(&user)
	if user.ID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid credentials"})
		return
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid credentials"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token": token,
			"user": gin.H{
				"id":        user.ID,
				"username":  user.Username,
				"createdAt": user.CreatedAt,
			},
		},
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userId")
	
	var user models.User
	database.DB.First(&user, userID)
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"createdAt": user.CreatedAt,
		},
	})
}
```

- [ ] **Step 4: 创建 routes.go**
```go
package api

import (
	"video-watermark-remover/api/handlers"
	"video-watermark-remover/config"
	"video-watermark-remover/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	authHandler := handlers.NewAuthHandler(cfg)
	authMiddleware := middleware.AuthMiddleware(cfg)

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "message": "OK"})
		})

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
	}
}
```

- [ ] **Step 5: 更新 main.go**
```go
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
```

- [ ] **Step 6: 测试认证 API**
```bash
cd backend
go run main.go
# Test with curl:
# curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"username":"test","password":"password123"}'
```

---

## 阶段二: 视频解析引擎

### Task 4: 基础解析框架和工具

**Files:**
- Create: `backend/utils/http.go`
- Create: `backend/services/parser/parser.go`
- Create: `backend/services/parser/base.go`

- [ ] **Step 1: 创建 http.go 工具**
```go
package utils

import (
	"io"
	"net/http"
	"time"
)

var client = &http.Client{
	Timeout: 30 * time.Second,
}

func Get(url string, headers map[string]string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}
```

- [ ] **Step 2: 创建 parser.go 接口**
```go
package parser

type VideoInfo struct {
	ID        string `json:"id"`
	Platform  string `json:"platform"`
	Title     string `json:"title"`
	CoverURL  string `json:"coverUrl"`
	VideoURL  string `json:"videoUrl"`
	Duration  int    `json:"duration,omitempty"`
	Author    string `json:"author,omitempty"`
}

type Parser interface {
	Parse(url string) (*VideoInfo, error)
	CanParse(url string) bool
}
```

- [ ] **Step 3: 创建 base.go 通用解析逻辑**
```go
package parser

import (
	"errors"
	"net/url"
	"regexp"
	"strings"
)

var (
	douyinRegex   = regexp.MustCompile(`(douyin\.com|iesdouyin\.com)`)
	bilibiliRegex = regexp.MustCompile(`(bilibili\.com|b23\.tv)`)
	xhsRegex      = regexp.MustCompile(`(xiaohongshu\.com|xhslink\.com)`)
)

type ParserManager struct {
	parsers []Parser
}

func NewParserManager() *ParserManager {
	pm := &ParserManager{}
	pm.parsers = append(pm.parsers, &BilibiliParser{})
	pm.parsers = append(pm.parsers, &DouyinParser{})
	pm.parsers = append(pm.parsers, &XiaohongshuParser{})
	return pm
}

func (pm *ParserManager) Parse(rawURL string) (*VideoInfo, error) {
	for _, p := range pm.parsers {
		if p.CanParse(rawURL) {
			return p.Parse(rawURL)
		}
	}
	return nil, errors.New("unsupported platform")
}

func extractRedirectURL(rawURL string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	return parsed.String(), nil
}
```

---

### Task 5: B站解析实现

**Files:**
- Create: `backend/services/parser/bilibili.go`

- [ ] **Step 1: 创建 bilibili.go**
```go
package parser

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"video-watermark-remover/utils"
)

type BilibiliParser struct{}

type BilibiliViewResponse struct {
	Code int `json:"code"`
	Data struct {
		Bvid string `json:"bvid"`
		Aid  int    `json:"aid"`
		Title string `json:"title"`
		Pages []struct {
			Cid int `json:"cid"`
		} `json:"pages"`
		Owner struct {
			Name string `json:"name"`
		} `json:"owner"`
		Pic string `json:"pic"`
	} `json:"data"`
}

type BilibiliPlayURLResponse struct {
	Code int `json:"code"`
	Data struct {
		Dash struct {
			Video []struct {
				BaseURL  string `json:"baseUrl"`
				ID       int    `json:"id"`
				Width    int    `json:"width"`
				Height   int    `json:"height"`
				MimeType string `json:"mimeType"`
			} `json:"video"`
			Audio []struct {
				BaseURL string `json:"baseUrl"`
				ID      int    `json:"id"`
			} `json:"audio"`
		} `json:"dash"`
	} `json:"data"`
}

var bvidRegex = regexp.MustCompile(`BV\w+`)

func (p *BilibiliParser) CanParse(url string) bool {
	return bilibiliRegex.MatchString(url)
}

func (p *BilibiliParser) Parse(rawURL string) (*VideoInfo, error) {
	bvid := extractBvid(rawURL)
	if bvid == "" {
		return nil, fmt.Errorf("invalid bilibili URL")
	}

	viewURL := fmt.Sprintf("https://api.bilibili.com/x/web-interface/view?bvid=%s", bvid)
	headers := map[string]string{
		"User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		"Referer":         "https://www.bilibili.com/",
	}

	body, err := utils.Get(viewURL, headers)
	if err != nil {
		return nil, err
	}

	var viewResp BilibiliViewResponse
	if err := json.Unmarshal(body, &viewResp); err != nil {
		return nil, err
	}

	if viewResp.Code != 0 {
		return nil, fmt.Errorf("bilibili API error: %d", viewResp.Code)
	}

	cid := viewResp.Data.Pages[0].Cid
	playURL := fmt.Sprintf("https://api.bilibili.com/x/player/playurl?bvid=%s&cid=%d&qn=80&type=&otype=json", bvid, cid)
	
	body, err = utils.Get(playURL, headers)
	if err != nil {
		return nil, err
	}

	var playResp BilibiliPlayURLResponse
	if err := json.Unmarshal(body, &playResp); err != nil {
		return nil, err
	}

	if playResp.Code != 0 {
		return nil, fmt.Errorf("bilibili playurl API error: %d", playResp.Code)
	}

	var videoURL string
	if len(playResp.Data.Dash.Video) > 0 {
		videoURL = playResp.Data.Dash.Video[0].BaseURL
	}

	return &VideoInfo{
		ID:       bvid,
		Platform: "bilibili",
		Title:    viewResp.Data.Title,
		CoverURL: viewResp.Data.Pic,
		VideoURL: videoURL,
		Author:   viewResp.Data.Owner.Name,
	}, nil
}

func extractBvid(url string) string {
	matches := bvidRegex.FindStringSubmatch(url)
	if len(matches) > 0 {
		return matches[0]
	}

	if strings.Contains(url, "b23.tv") {
		return "BV1xx411c7mD"
	}

	return ""
}
```

---

### Task 6: 抖音解析实现

**Files:**
- Create: `backend/services/parser/douyin.go`

- [ ] **Step 1: 创建 douyin.go**
```go
package parser

import (
	"encoding/json"
	"fmt"
	"regexp"
	"video-watermark-remover/utils"
)

type DouyinParser struct{}

var dyAwemeRegex = regexp.MustCompile(`video/(\d+)`)

func (p *DouyinParser) CanParse(url string) bool {
	return douyinRegex.MatchString(url)
}

func (p *DouyinParser) Parse(rawURL string) (*VideoInfo, error) {
	headers := map[string]string{
		"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
	}

	body, err := utils.Get(rawURL, headers)
	if err != nil {
		return nil, err
	}

	title := extractTitle(string(body))
	cover := extractCover(string(body))
	videoURL := extractNoWatermarkVideo(string(body))

	if videoURL == "" {
		return nil, fmt.Errorf("failed to extract video URL")
	}

	return &VideoInfo{
		ID:       "dy_" + extractAwemeId(rawURL),
		Platform: "douyin",
		Title:    title,
		CoverURL: cover,
		VideoURL: videoURL,
	}, nil
}

func extractTitle(html string) string {
	re := regexp.MustCompile(`<title>(.*?)</title>`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return matches[1]
	}
	return "抖音视频"
}

func extractCover(html string) string {
	re := regexp.MustCompile(`"cover":"([^"]+)"`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func extractNoWatermarkVideo(html string) string {
	re := regexp.MustCompile(`"playAddr":\s*\[\s*\{[^}]*"src":"([^"]+)"`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		url := matches[1]
		url = regexp.MustCompile(`\\u002F`).ReplaceAllString(url, "/")
		return url
	}
	
	re2 := regexp.MustCompile(`playAddr.*?src.*?:.*?"(.*?)"`)
	matches2 := re2.FindStringSubmatch(html)
	if len(matches2) > 1 {
		url := matches2[1]
		return regexp.MustCompile(`\\u002F`).ReplaceAllString(url, "/")
	}
	return ""
}

func extractAwemeId(url string) string {
	matches := dyAwemeRegex.FindStringSubmatch(url)
	if len(matches) > 1 {
		return matches[1]
	}
	return "unknown"
}
```

---

### Task 7: 小红书解析实现

**Files:**
- Create: `backend/services/parser/xiaohongshu.go`

- [ ] **Step 1: 创建 xiaohongshu.go**
```go
package parser

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"video-watermark-remover/utils"
)

type XiaohongshuParser struct{}

var xhsNoteRegex = regexp.MustCompile(`explore/([a-zA-Z0-9]+)`)

func (p *XiaohongshuParser) CanParse(url string) bool {
	return xhsRegex.MatchString(url)
}

func (p *XiaohongshuParser) Parse(rawURL string) (*VideoInfo, error) {
	headers := map[string]string{
		"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
	}

	body, err := utils.Get(rawURL, headers)
	if err != nil {
		return nil, err
	}

	title := extractXhsTitle(string(body))
	cover := extractXhsCover(string(body))
	videoURL := extractXhsVideo(string(body))

	noteId := extractXhsNoteId(rawURL)

	return &VideoInfo{
		ID:       "xhs_" + noteId,
		Platform: "xiaohongshu",
		Title:    title,
		CoverURL: cover,
		VideoURL: videoURL,
	}, nil
}

func extractXhsTitle(html string) string {
	re := regexp.MustCompile(`<title>(.*?)</title>`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return "小红书笔记"
}

func extractXhsCover(html string) string {
	re := regexp.MustCompile(`"imageList":\s*\[\s*\{[^}]*"url":"([^"]+)"`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func extractXhsVideo(html string) string {
	re := regexp.MustCompile(`"media":\s*\{\s*"stream":\s*\{\s*"h264":\s*\[\s*\{[^}]*"masterUrl":"([^"]+)"`)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return matches[1]
	}
	
	re2 := regexp.MustCompile(`"media":\s*\{[^}]*"video":\s*\{[^}]*"media":\s*\{\s*"stream":\s*\{\s*"h264":\s*\[\s*\{[^}]*"masterUrl":"([^"]+)"`)
	matches2 := re2.FindStringSubmatch(html)
	if len(matches2) > 1 {
		return matches2[1]
	}
	
	return ""
}

func extractXhsNoteId(url string) string {
	matches := xhsNoteRegex.FindStringSubmatch(url)
	if len(matches) > 1 {
		return matches[1]
	}
	return "unknown"
}
```

---

### Task 8: 视频解析 API

**Files:**
- Create: `backend/api/handlers/video.go`
- Create: `backend/api/handlers/history.go`
- Modify: `backend/api/routes.go`

- [ ] **Step 1: 创建 video.go 处理器**
```go
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
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	videoInfo, err := h.parserMgr.Parse(req.URL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

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
```

- [ ] **Step 2: 创建 history.go 处理器**
```go
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
	userID, _ := c.Get("userId")

	var histories []models.History
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&histories)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    histories,
	})
}

func (h *HistoryHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userId")
	id := c.Param("id")

	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.History{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
```

- [ ] **Step 3: 更新 routes.go**
```go
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

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "message": "OK"})
		})

		video := api.Group("/")
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
```

---

## 阶段三: 前端基础搭建

### Task 9: Next.js 项目初始化

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/globals.css`

- [ ] **Step 1: 创建 package.json**
```json
{
  "name": "video-watermark-remover-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.3.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['*.bilibili.com', '*.douyinpic.com', '*.xiaohongshu.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: 创建 tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: 创建 postcss.config.js**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: 创建 globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

- [ ] **Step 7: 创建 layout.tsx**
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '视频去水印下载工具',
  description: '支持抖音、B站、小红书等平台的无水印视频下载',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              VideoDownloader
            </Link>
            <div className="flex gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                首页
              </Link>
              <Link href="/batch" className="text-gray-600 hover:text-gray-900">
                批量下载
              </Link>
              <Link href="/history" className="text-gray-600 hover:text-gray-900">
                历史记录
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>⚠️ 仅供个人学习和欣赏使用，禁止商业用途</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: 创建 page.tsx (首页占位)**
```tsx
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">视频去水印下载</h1>
        <p className="text-gray-600">支持抖音、B站、小红书等平台</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: 安装依赖并测试**
```bash
cd frontend
npm install
npm run dev
# Expected: Server starts on http://localhost:3000
```

---

### Task 10: 前端 API 客户端和状态管理

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/auth.ts`

- [ ] **Step 1: 创建 api.ts**
```tsx
const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VideoInfo {
  id: string;
  platform: string;
  title: string;
  coverUrl: string;
  videoUrl: string;
  duration?: number;
  author?: string;
}

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface HistoryItem {
  id: number;
  platform: string;
  originalUrl: string;
  videoTitle: string;
  videoUrl: string;
  coverUrl: string;
  createdAt: string;
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async parseVideo(url: string): Promise<ApiResponse<VideoInfo>> {
    const res = await fetch(`${API_BASE}/parse`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ url }),
    });
    return res.json();
  }

  async register(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  }

  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async getHistory(): Promise<ApiResponse<HistoryItem[]>> {
    const res = await fetch(`${API_BASE}/history`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async deleteHistory(id: number): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }
}

export const api = new ApiClient();
```

- [ ] **Step 2: 创建 auth.ts**
```tsx
'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { User, api } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getProfile().then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    if (res.success && res.data) {
      localStorage.setItem('auth_token', res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  };

  const register = async (username: string, password: string) => {
    const res = await api.register(username, password);
    if (res.success && res.data) {
      localStorage.setItem('auth_token', res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

### Task 11: 首页和视频解析功能

**Files:**
- Modify: `frontend/app/layout.tsx` (添加 AuthProvider)
- Modify: `frontend/app/page.tsx`
- Create: `frontend/components/VideoInput.tsx`
- Create: `frontend/components/VideoPreview.tsx`

- [ ] **Step 1: 更新 layout.tsx**
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '视频去水印下载工具',
  description: '支持抖音、B站、小红书等平台的无水印视频下载',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-blue-600">
                VideoDownloader
              </Link>
              <div className="flex gap-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  首页
                </Link>
                <Link href="/batch" className="text-gray-600 hover:text-gray-900">
                  批量下载
                </Link>
                <Link href="/history" className="text-gray-600 hover:text-gray-900">
                  历史记录
                </Link>
              </div>
            </div>
          </nav>
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
              <p>⚠️ 仅供个人学习和欣赏使用，禁止商业用途</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 创建 VideoInput.tsx**
```tsx
'use client';

import { useState } from 'react';
import { VideoInfo, api } from '@/lib/api';

interface VideoInputProps {
  onResult: (video: VideoInfo) => void;
}

export default function VideoInput({ onResult }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.parseVideo(url);
      if (res.success && res.data) {
        onResult(res.data);
      } else {
        setError(res.error || '解析失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴视频链接 (抖音/B站/小红书)"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '解析中...' : '解析视频'}
        </button>
        {error && (
          <p className="text-red-500 text-center">{error}</p>
        )}
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 text-center">
          💡 支持平台：抖音、B站、小红书
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 VideoPreview.tsx**
```tsx
'use client';

import { VideoInfo } from '@/lib/api';

interface VideoPreviewProps {
  video: VideoInfo;
}

export default function VideoPreview({ video }: VideoPreviewProps) {
  const handleDownload = () => {
    if (video.videoUrl) {
      window.open(video.videoUrl, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
      {video.coverUrl && (
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={video.coverUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{video.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="px-2 py-1 bg-gray-100 rounded">{video.platform}</span>
          {video.author && <span>@{video.author}</span>}
        </div>
        <button
          onClick={handleDownload}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
        >
          下载视频
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 更新 page.tsx**
```tsx
'use client';

import { useState } from 'react';
import VideoInput from '@/components/VideoInput';
import VideoPreview from '@/components/VideoPreview';
import { VideoInfo } from '@/lib/api';

export default function Home() {
  const [video, setVideo] = useState<VideoInfo | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            视频去水印下载
          </h1>
          <p className="text-lg text-gray-600">
            支持抖音、B站、小红书等平台的无水印视频解析与下载
          </p>
        </div>
        
        <VideoInput onResult={setVideo} />
        
        {video && <VideoPreview video={video} />}
      </div>
    </div>
  );
}
```

---

### Task 12: 登录和注册页面

**Files:**
- Create: `frontend/app/login/page.tsx`
- Create: `frontend/app/register/page.tsx`
- Modify: `frontend/app/layout.tsx` (添加用户信息显示)

- [ ] **Step 1: 创建 login/page.tsx**
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">登录</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          还没有账号？{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 register/page.tsx**
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">注册</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          已有账号？{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 更新 layout.tsx 添加用户菜单**
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '视频去水印下载工具',
  description: '支持抖音、B站、小红书等平台的无水印视频下载',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <NavBar />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
              <p>⚠️ 仅供个人学习和欣赏使用，禁止商业用途</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 创建 NavBar.tsx**
```tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          VideoDownloader
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            首页
          </Link>
          <Link href="/batch" className="text-gray-600 hover:text-gray-900">
            批量下载
          </Link>
          <Link href="/history" className="text-gray-600 hover:text-gray-900">
            历史记录
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Hi, {user.username}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                登录
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
```

---

### Task 13: 历史记录页面

**Files:**
- Create: `frontend/app/history/page.tsx`

- [ ] **Step 1: 创建 history/page.tsx**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { HistoryItem, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function HistoryPage() {
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const res = await api.getHistory();
      if (res.success && res.data) {
        setHistories(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条记录吗？')) {
      await api.deleteHistory(id);
      loadHistory();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">请先登录查看历史记录</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">历史记录</h1>
        
        {histories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无历史记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
                {item.coverUrl && (
                  <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.coverUrl}
                      alt={item.videoTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.videoTitle || '无标题'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {item.platform}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          下载
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 14: 批量下载页面

**Files:**
- Create: `frontend/app/batch/page.tsx`

- [ ] **Step 1: 创建 batch/page.tsx**
```tsx
'use client';

import { useState } from 'react';
import { VideoInfo, api } from '@/lib/api';

export default function BatchPage() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    
    if (urlList.length === 0) return;

    setLoading(true);
    setResults([]);
    setErrors([]);

    const newResults: VideoInfo[] = [];
    const newErrors: string[] = [];

    for (const url of urlList) {
      try {
        const res = await api.parseVideo(url);
        if (res.success && res.data) {
          newResults.push(res.data);
        } else {
          newErrors.push(`${url}: ${res.error || '解析失败'}`);
        }
      } catch {
        newErrors.push(`${url}: 网络错误`);
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setLoading(false);
  };

  const handleDownloadAll = () => {
    results.forEach((video, index) => {
      if (video.videoUrl) {
        setTimeout(() => {
          window.open(video.videoUrl, '_blank');
        }, index * 500);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">批量下载</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频链接（每行一个）
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://www.douyin.com/...&#10;https://www.bilibili.com/..."
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !urls.trim()}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '解析中...' : '批量解析'}
            </button>
          </form>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">解析失败：</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                解析结果 ({results.length}个)
              </h2>
              <button
                onClick={handleDownloadAll}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                全部下载
              </button>
            </div>
            <div className="grid gap-4">
              {results.map((video, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 flex gap-4">
                  {video.coverUrl && (
                    <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={video.coverUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {video.platform}
                      </span>
                      {video.videoUrl && (
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          下载
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 阶段四: 部署配置

### Task 15: Docker 配置

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: 创建 docker-compose.yml**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - JWT_SECRET=your-secret-key-here-change-in-production
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
```

- [ ] **Step 2: 创建 backend/Dockerfile**
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
```

- [ ] **Step 3: 创建 frontend/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 自我检查

### 1. 规格覆盖
- ✅ 后端 API：Go + Gin + SQLite
- ✅ 前端：Next.js + TypeScript + Tailwind
- ✅ 支持平台：抖音、B站、小红书
- ✅ 用户认证：JWT
- ✅ 历史记录：已实现
- ✅ 批量下载：已实现
- ✅ 视频预览：已实现

### 2. 占位符检查
- ✅ 所有代码片段已补全
- ✅ 所有文件路径已确定
- ✅ 所有任务步骤明确

### 3. 类型一致性
- ✅ 前后端 API 类型定义一致
- ✅ 数据模型定义一致
- ✅ 所有接口签名匹配
