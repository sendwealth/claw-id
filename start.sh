#!/bin/bash

echo "🦞 启动 CLAW ID..."
echo ""

# 检查是否在项目目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 请在 claw-id 项目根目录运行此脚本"
    exit 1
fi

# 启动后端
echo "📡 启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   安装后端依赖..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "   等待后端启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3000/health > /dev/null; then
    echo "   ✅ 后端启动成功"
else
    echo "   ⚠️  后端可能未完全启动，请稍候..."
fi

echo ""

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   安装前端依赖..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端启动
echo "   等待前端启动..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLAW ID 已启动！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 后端 API: http://localhost:3000"
echo "📍 前端界面: http://localhost:3001"
echo ""
echo "💡 测试命令:"
echo "   curl http://localhost:3000/health"
echo "   curl http://localhost:3000/api/v1/platforms"
echo ""
echo "📝 文档:"
echo "   快速开始: docs/quickstart.md"
echo "   API 文档: docs/api.md"
echo ""
echo "🛑 按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 等待中断信号
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 保持运行
wait $BACKEND_PID $FRONTEND_PID
