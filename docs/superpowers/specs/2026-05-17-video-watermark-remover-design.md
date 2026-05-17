# 去水印下载网站设计规范

## 1. 项目概述

### 1.1 项目背景
创建一个前后端分离的视频去水印下载网站，支持主流短视频/长视频平台的无水印视频解析与下载。

### 1.2 技术选型
- **后端**：Go + Gin + SQLite + FFmpeg
- **前端**：Next.js 14 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **部署方式**：单机部署（个人学习/小范围使用）

### 1.3 支持平台
- 抖音/TikTok
- B站（哔哩哔哩）
- 小红书
- 微信视频号（可选高级功能）

### 1.4 核心功能
- 核心去水印解析
- 视频预览
- 批量下载
- 用户登录系统
- 历史记录管理
- 下载历史管理

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  首页    │  │ 用户中心 │  │ 批量下载 │  │ 历史记录 │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                           │                                 │
│                      API 调用                              │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    后端 (Go + Gin)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API 路由层                         │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                    │
│  ┌────────────────────┴────────────────────────────────┐   │
│  │                  业务逻辑层                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ 解析引擎 │  │ 用户服务 │  │ 下载服务 │           │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │   │
│  └───────┼─────────────┼─────────────┼──────────────────┘   │
│          │             │             │                      │
│  ┌───────┴─────────────┴─────────────┴──────────────────┐   │
│  │                    数据层                             │   │
│  │              SQLite + GORM ORM                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
/workspace
├── backend/
│   ├── api/
│   │   ├── handlers/          # HTTP 处理器
│   │   └── routes.go          # 路由定义
│   ├── services/
│   │   ├── parser/            # 各平台解析逻辑
│   │   ├── user.go            # 用户服务
│   │   └── downloader.go      # 下载服务
│   ├── models/
│   │   ├── user.go            # 用户模型
│   │   ├── history.go         # 历史记录模型
│   │   └── video.go           # 视频模型
│   ├── middleware/
│   │   ├── auth.go            # JWT 认证中间件
│   │   └── rate_limit.go      # 限流中间件
│   ├── utils/
│   │   ├── ffmpeg.go          # FFmpeg 封装
│   │   ├── encrypt.go         # 加密工具
│   │   └── http.go            # HTTP 工具
│   ├── config/
│   │   └── config.go          # 配置管理
│   ├── database/
│   │   └── database.go        # 数据库初始化
│   └── main.go
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 首页
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── history/
│   │   └── batch/
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── VideoPreview.tsx
│   │   ├── HistoryList.tsx
│   │   └── BatchInput.tsx
│   ├── lib/
│   │   ├── api.ts             # API 调用封装
│   │   ├── auth.ts            # 认证状态管理
│   │   └── utils.ts
│   └── public/
└── docker-compose.yml
```

## 3. 后端设计

### 3.1 API 接口设计

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/health` | GET | 否 | 健康检查 |
| `/api/parse` | POST | 否 | 解析视频链接 |
| `/api/video/:id` | GET | 否 | 获取视频信息 |
| `/api/download` | POST | 否 | 下载视频 |
| `/api/auth/register` | POST | 否 | 用户注册 |
| `/api/auth/login` | POST | 否 | 用户登录 |
| `/api/user/profile` | GET | 是 | 获取用户信息 |
| `/api/history` | GET | 是 | 获取历史记录 |
| `/api/history` | POST | 是 | 添加历史记录 |
| `/api/history/:id` | DELETE | 是 | 删除历史记录 |

### 3.2 数据库模型

#### User 模型
```go
type User struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    Username     string    `gorm:"uniqueIndex;not null" json:"username"`
    PasswordHash string    `gorm:"not null" json:"-"`
    CreatedAt    time.Time `json:"created_at"`
    Histories    []History `json:"-"`
}
```

#### History 模型
```go
type History struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    UserID      uint      `gorm:"index" json:"user_id"`
    Platform    string    `gorm:"not null" json:"platform"`
    OriginalURL string    `gorm:"not null" json:"original_url"`
    VideoTitle  string    `json:"video_title"`
    VideoURL    string    `json:"video_url"`
    CoverURL    string    `json:"cover_url"`
    CreatedAt   time.Time `json:"created_at"`
    User        User      `gorm:"foreignKey:UserID" json:"-"`
}
```

### 3.3 平台解析引擎设计

#### 抖音/TikTok 解析流程
1. 输入短链接 → 重定向获取真实 URL
2. 从 URL 或页面中提取 video_id/item_id
3. 获取视频信息和无水印地址

#### B站解析流程
1. bvid 转 aid 算法
2. 调用 `/x/web-interface/view` 获取 cid 列表
3. 调用 `/x/player/playurl` 获取视频流地址
4. 视频音频分别下载后使用 FFmpeg 合并

#### 小红书解析流程
1. 从分享链接提取 note_id
2. 解析笔记详情页获取视频信息

#### 视频号解析
- 特殊说明：由于限制较多，作为高级可选功能

### 3.4 FFmpeg 集成
- 用于音视频合并（B站）
- 用于视频格式转换
- 可选：用于基础视频处理

## 4. 前端设计

### 4.1 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 链接解析输入框 |
| `/login` | 登录页 | 用户登录 |
| `/register` | 注册页 | 用户注册 |
| `/dashboard` | 用户中心 | 用户信息和统计 |
| `/history` | 历史记录 | 解析历史列表 |
| `/batch` | 批量下载 | 多链接批量处理 |

### 4.2 组件规划

#### 核心组件
- `VideoInput` - 视频链接输入组件
- `VideoPreview` - 视频预览组件
- `HistoryList` - 历史记录列表
- `BatchInput` - 批量输入组件
- `DownloadButton` - 下载按钮

#### UI 组件 (shadcn/ui)
- Button
- Input
- Card
- Dialog
- Table
- Avatar
- Dropdown

## 5. 安全考虑

### 5.1 安全措施
- JWT 认证
- 密码 bcrypt 加密存储
- IP 限流防止滥用
- CORS 配置
- SQL 注入防护（GORM）
- XSS 防护

### 5.2 法律风险提示
- 首页显著位置显示法律声明
- 用户协议明确禁止商业用途
- 仅用于个人学习和欣赏

## 6. 部署方案

### 6.1 开发环境
- Go 1.21+
- Node.js 18+
- FFmpeg

### 6.2 生产部署
- Docker 容器化
- SQLite 数据持久化
- Nginx 反向代理

## 7. 开发计划

### Phase 1: 基础框架搭建
- 后端 Gin 框架初始化
- 数据库设计和初始化
- 前端 Next.js 项目初始化
- shadcn/ui 配置

### Phase 2: 核心解析功能
- 基础解析 API 框架
- B站解析实现（相对简单）
- 抖音解析实现
- 小红书解析实现

### Phase 3: 用户系统
- 用户注册/登录
- JWT 认证
- 历史记录功能

### Phase 4: 高级功能
- 视频预览
- 批量下载
- 前端优化

### Phase 5: 部署和优化
- Docker 配置
- 性能优化
- 安全加固
