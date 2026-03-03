// CLAW ID 2.0 - 快速启动版
// 修复API端点

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

console.log('🚀 CLAW ID 2.0 正在启动...');

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'CLAW ID 2.0 - AI智能体身份管理平台',
    version: '2.0.0',
    docs: '/api/v1',
    health: '/health'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    message: 'CLAW ID 2.0 服务运行正常'
  });
});

// API 信息
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'CLAW ID API',
    version: '2.0.0',
    description: 'AI智能体身份管理与API集成平台',
    status: 'operational',
    endpoints: {
      health: 'GET /health',
      platforms: 'GET /api/v1/platforms',
      agents: 'GET /api/v1/agents'
    }
  });
});

// 平台列表
app.get('/api/v1/platforms', (req, res) => {
  res.json({
    platforms: [
      {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        status: 'ready',
        features: ['repos', 'issues', 'pull_requests']
      },
      {
        id: 'discord',
        name: 'Discord',
        type: 'bot',
        status: 'ready',
        features: ['guilds', 'messages', 'channels']
      }
    ]
  });
});

// 智能体列表（示例）
app.get('/api/v1/agents', (req, res) => {
  res.json({
    agents: [],
    message: '请配置数据库以使用完整功能'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '请求的资源不存在'
  });
});

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CLAW ID 2.0 服务已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`\n✨ 服务运行中！`);
});

module.exports = app;
