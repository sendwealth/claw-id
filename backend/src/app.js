// CLAW ID 2.0 主应用
// 文件: src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const passport = require('passport');

// 导入服务
const githubOAuth = require('./services/githubOAuth');
const discordBot = require('./services/discordBot');
const apiKeyManager = require('./services/apiKeyManager');

// 导入路由
const authRoutes = require('./routes/auth');
const platformRoutes = require('./routes/platforms');
const agentRoutes = require('./routes/agents');

const app = express();
const prisma = new PrismaClient();

// 导出 prisma 供其他模块使用
app.prisma = prisma;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// 初始化服务
githubOAuth.initialize(prisma);
discordBot.initialize(prisma);
apiKeyManager.initialize(prisma);

// 路由
app.use('/auth', authRoutes);
app.use('/api/v1/platforms', platformRoutes);
app.use('/api/v1/agents', agentRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      github: process.env.GITHUB_CLIENT_ID ? 'configured' : 'not_configured',
      discord: process.env.DISCORD_BOT_TOKEN ? 'configured' : 'not_configured'
    }
  });
});

// API 信息
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'CLAW ID API',
    version: '2.0.0',
    description: 'AI智能体身份管理与API集成平台',
    endpoints: {
      auth: {
        'POST /auth/api-keys': '创建API Key',
        'POST /auth/github': 'GitHub OAuth认证',
        'POST /auth/discord/bot': '添加Discord Bot'
      },
      platforms: {
        'GET /api/v1/platforms': '获取支持的平台列表',
        'GET /api/v1/platforms/github/repos/:agentId': '获取GitHub仓库',
        'GET /api/v1/platforms/discord/guilds/:agentId': '获取Discord服务器'
      },
      agents: {
        'GET /api/v1/agents': '获取智能体列表',
        'POST /api/v1/agents': '创建智能体',
        'GET /api/v1/agents/:id': '获取智能体详情'
      }
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '请求的资源不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 CLAW ID 2.0 服务已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`\n✨ 支持的平台:`);
  console.log(`   - GitHub (OAuth)`);
  console.log(`   - Discord (Bot)`);
  console.log(`   - 更多平台开发中...`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭服务...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
