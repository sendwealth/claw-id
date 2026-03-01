#!/usr/bin/env node

// Discord Webhook 发布工具 - 立即可用
// 时间: 2026-02-28 22:35

const https = require('https');
const fs = require('fs');
const path = require('path');

// Discord Webhook 配置
// 注意：需要在 Discord 频道设置中创建 Webhook
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

/**
 * 通过 Webhook 发布消息到 Discord
 */
async function postToDiscord(content) {
  if (!WEBHOOK_URL) {
    console.error('❌ 错误: 需要设置 DISCORD_WEBHOOK_URL 环境变量');
    console.log('');
    console.log('📝 如何获取 Webhook URL:');
    console.log('1. 打开 Discord 频道设置');
    console.log('2. 进入 Integrations > Webhooks');
    console.log('3. 点击 "New Webhook"');
    console.log('4. 复制 Webhook URL');
    console.log('5. 运行: export DISCORD_WEBHOOK_URL="你的Webhook URL"');
    process.exit(1);
  }

  // 从 Webhook URL 提取 ID 和 Token
  const match = WEBHOOK_URL.match(/webhooks\/(\d+)\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    console.error('❌ 错误: 无效的 Webhook URL');
    process.exit(1);
  }

  const webhookId = match[1];
  const webhookToken = match[2];

  // 准备发布内容
  const postData = JSON.stringify({
    username: 'CLAW ID Bot',
    avatar_url: 'https://raw.githubusercontent.com/sendwealth/claw-id/main/assets/logo.png',
    embeds: [{
      title: '🦞 CLAW ID - AI 智能体身份证系统',
      description: content.description || '世界上第一个为 AI 智能体设计的数字身份认证平台',
      url: 'https://github.com/sendwealth/claw-id',
      color: 5814783, // 蓝色
      fields: content.fields || [],
      footer: {
        text: '🦞 Long live the lobster!',
        icon_url: 'https://raw.githubusercontent.com/sendwealth/claw-id/main/assets/logo.png'
      },
      timestamp: new Date().toISOString()
    }]
  });

  // 发送请求
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: `/api/webhooks/${webhookId}/${webhookToken}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log('✅ 消息发布成功！');
          resolve({ success: true });
        } else {
          console.error('❌ 发布失败:', res.statusCode, data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🦞 CLAW ID - Discord 发布工具');
  console.log('==============================');
  console.log('');

  // 读取发布内容
  const contentFile = path.join(__dirname, '../marketing/discord-post-content.json');

  let content;
  if (fs.existsSync(contentFile)) {
    content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
  } else {
    // 默认内容
    content = {
      description: '世界上第一个为 AI 智能体设计的数字身份认证平台',
      fields: [
        {
          name: '🎯 核心功能',
          value: '• 自动生成邮箱\n• 自动生成 API Key\n• 平台自动注册（开发中）',
          inline: true
        },
        {
          name: '🚀 技术栈',
          value: '• Node.js + Express\n• Next.js + Tailwind\n• Playwright 自动化',
          inline: true
        },
        {
          name: '📦 快速开始',
          value: '```bash\ngit clone https://github.com/sendwealth/claw-id.git\ncd claw-id\n./start.sh\n```'
        },
        {
          name: '💰 商业模式',
          value: '• 基础版：¥99/月\n• 专业版：¥299/月\n• 企业版：¥999/月',
          inline: true
        },
        {
          name: '🔗 链接',
          value: '[GitHub](https://github.com/sendwealth/claw-id) | [文档](https://github.com/sendwealth/claw-id/tree/main/docs) | [官网](https://sendwealth.github.io/claw-intelligence/)',
          inline: true
        }
      ]
    };
  }

  // 发布到 Discord
  await postToDiscord(content);

  console.log('');
  console.log('🎉 完成！');
}

main().catch((error) => {
  console.error('❌ 错误:', error.message);
  process.exit(1);
});
