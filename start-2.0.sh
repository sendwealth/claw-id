#!/bin/bash

# CLAW ID 2.0 启动脚本

echo "🚀 启动 CLAW ID 2.0..."
echo ""

# 检查 .env 文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📝 正在从模板创建..."
    cp backend/.env.example backend/.env
    echo "✅ 已创建 backend/.env"
    echo "⚠️  请编辑 .env 文件并填写必要配置"
    echo ""
    echo "必需配置："
    echo "  - DATABASE_URL (PostgreSQL 连接)"
    echo "  - ENCRYPTION_KEY (运行生成命令)"
    echo "  - GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET"
    echo ""
    echo "生成 ENCRYPTION_KEY:"
    echo '  node -e "console.log(require('"'"'crypto'"'"').randomBytes(32).toString('"'"'hex'"'"'))"'
    echo ""
    exit 1
fi

# 检查 node_modules
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装依赖..."
    cd backend && npm install
    cd ..
fi

# 检查数据库迁移
if [ ! -d "backend/prisma/migrations" ]; then
    echo "🗄️  初始化数据库..."
    cd backend
    npx prisma generate
    npx prisma migrate dev --name init
    cd ..
fi

echo ""
echo "✅ 准备就绪"
echo ""
echo "🌐 启动服务..."
echo ""

# 启动后端
cd backend
npm start
