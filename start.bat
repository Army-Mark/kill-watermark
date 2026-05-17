@echo off
echo 🚀 启动视频去水印下载工具
echo.

REM 启动后端
echo 📦 启动后端服务...
cd backend
start "Video Downloader Backend" cmd /k "go mod download && go run main.go"
cd ..

REM 等待一下
timeout /t 3 /nobreak >nul

REM 启动前端
echo 📦 启动前端服务...
cd frontend
call npm install
call npm run dev
