#!/bin/bash

# CLAW ID 推送到 GitHub

echo "🦞 推送 CLAW ID 到 GitHub..."
echo ""

cd /home/rowan/clawd/products/claw-id

# 检查远程仓库
if git remote | grep -q "origin"; then
    echo "✅ 远程仓库已配置"
    git remote -v
else
    echo "❌ 未配置远程仓库"
    echo ""
    echo "请先在 GitHub 创建仓库："
    echo "https://github.com/new"
    echo ""
    echo "然后运行："
    echo "git remote add origin https://github.com/YOUR_USERNAME/claw-id.git"
    exit 1
fi

echo ""
echo "📦 推送到 GitHub..."

# 推送
if git push -u origin main; then
    echo ""
    echo "🎉 推送成功！"
    echo ""
    echo "📱 访问你的仓库："
    echo "https://github.com/sendwealth/claw-id"
    echo ""
    echo "✅ CLAW ID 已成功上传到 GitHub！"
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "1. GitHub 仓库未创建"
    echo "2. 需要认证（GitHub Token）"
    echo "3. 网络问题"
    echo ""
    echo "解决方案："
    echo "1. 访问 https://github.com/new 创建仓库"
    echo "2. 配置 GitHub Token: git config --global credential.helper store"
    echo "3. 检查网络连接"
fi
