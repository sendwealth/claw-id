#!/bin/bash

# CLAW ID Discord 注册测试脚本
# 时间: 2026-02-28 22:35

echo "🦞 CLAW ID - Discord 注册测试"
echo "================================"
echo ""

# 设置环境
cd /home/rowan/clawd/products/claw-id/backend

# 安装依赖（如果需要）
if [ ! -d "node_modules/playwright" ]; then
    echo "📦 安装 Playwright..."
    npm install playwright
    npx playwright install chromium
fi

# 创建测试目录
mkdir -p screenshots

# 运行测试
echo "🎭 开始测试 Discord 注册..."
node -e "
const discordRegistration = require('./src/services/discordRegistration');
const emailService = require('./src/services/emailService');

async function test() {
  // 创建测试智能体
  const agent = {
    email: 'agent-17722844@claw.id',
    username: 'CLAW-ID-Bot',
    password: 'ClawID2026!Secure'
  };

  console.log('📋 测试信息:');
  console.log('  邮箱:', agent.email);
  console.log('  用户名:', agent.username);
  console.log('');

  // 执行注册
  const result = await discordRegistration.register(agent);

  console.log('');
  console.log('📊 注册结果:');
  console.log(JSON.stringify(result, null, 2));

  // 保存结果
  const fs = require('fs');
  fs.writeFileSync('discord-registration-result.json', JSON.stringify(result, null, 2));

  console.log('');
  console.log('💾 结果已保存到: discord-registration-result.json');
}

test().catch(console.error);
"

echo ""
echo "✅ 测试完成！"
