#!/bin/bash

echo "🚀 启动视频去水印下载工具"
echo ""

# 检查是否安装了 Go
if ! command -v go &> /dev/null; then
    echo "❌ 请先安装 Go 1.21+"
    exit 1
fi

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+"
    exit 1
fi

# 启动后端（后台运行）
echo "📦 启动后端服务..."
cd backend
go mod download
go run main.go > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID) - http://localhost:8080"

# 等待一下
sleep 2

# 启动前端
echo "📦 启动前端服务..."
cd ../frontend
npm install
echo "✅ 前端启动中..."
npm run dev

# 清理（如果脚本被中断）
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM
