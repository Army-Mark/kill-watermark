# 视频去水印下载工具

一个现代化的视频去水印下载工具，支持抖音、Bilibili、小红书等主流平台。

## 技术栈

- **后端**: Go 1.21 + Gin + GORM + SQLite
- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **UI组件**: Lucide Icons

## 功能特性

- ✅ 支持多个主流视频平台
- ✅ 无水印视频解析
- ✅ 视频预览
- ✅ 批量下载
- ✅ 用户登录/注册
- ✅ 历史记录管理
- ✅ 响应式设计

## 快速开始

### 前置要求

- Go 1.21+
- Node.js 18+

### 后端启动

```bash
cd backend
go mod download
go run main.go
```

后端服务将在 `http://localhost:8080` 启动

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

## 项目结构

```
.
├── backend/          # Go 后端
│   ├── api/          # API 处理器和路由
│   ├── services/     # 业务逻辑和解析引擎
│   ├── models/       # 数据模型
│   ├── middleware/   # 中间件
│   ├── utils/        # 工具函数
│   └── config/       # 配置
├── frontend/         # Next.js 前端
│   ├── app/          # App Router 页面
│   ├── components/   # React 组件
│   └── lib/          # 工具和 API 客户端
└── docs/             # 文档
```

## 使用说明

1. 从视频平台复制视频链接
2. 粘贴到网站输入框
3. 点击解析按钮
4. 预览视频后点击下载

## 注意事项

⚠️ **重要声明**: 本工具仅供个人学习和欣赏使用，禁止商业用途。请尊重视频创作者的版权。

## License

MIT
