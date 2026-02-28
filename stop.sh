#!/bin/bash

# CLAW ID 停止脚本

echo "🦞 停止 CLAW ID..."

# 读取并停止后端
if [ -f "backend/.backend.pid" ]; then
    BACKEND_PID=$(cat backend/.backend.pid)
    kill $BACKEND_PID 2>/dev/null
    echo "✅ 后端已停止 (PID: $BACKEND_PID)"
    rm backend/.backend.pid
fi

# 读取并停止前端
if [ -f "frontend/.frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/.frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ 前端已停止 (PID: $FRONTEND_PID)"
    rm frontend/.frontend.pid
fi

# 确保所有相关进程都停止
pkill -f "node.*claw-id/backend" 2>/dev/null
pkill -f "next.*claw-id/frontend" 2>/dev/null

echo "🎉 CLAW ID 已完全停止"
