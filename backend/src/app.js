// CLAW ID 2.0 主应用
// 文件: src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');
const passport = require('passport');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const swaggerUi = require('swagger-ui-express');
const specs = require('./utils/swagger');

// 导入服务
const githubOAuth = require('./services/githubOAuth');
const discordBot = require('./services/discordBot');
const apiKeyManager = require('./services/apiKeyManager');

// 导入中间件
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth');
const userAuthRoutes = require('./routes/userAuth');
const platformRoutes = require('./routes/platforms');
const agentRoutes = require('./routes/agents');

const app = express();
const prisma = new PrismaClient();

// Prisma查询日志（开发环境）
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    if (e.duration > 100) { // 慢查询 > 100ms
      logger.warn('Slow Prisma query detected', {
        query: e.query,
        duration: `${e.duration}ms`,
        params: e.params
      });
    }
  });
}

// 导出 prisma 供其他模块使用
app.prisma = prisma;

// ===========================================
// 安全中间件
// ===========================================
app.use(helmet());
app.use(cors());

// ===========================================
// 响应压缩
// ===========================================
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // 只压缩>1KB的响应
  level: 6 // 压缩级别
}));

// ===========================================
// 速率限制
// ===========================================
app.use(generalLimiter); // 全局限制：15分钟100次
app.use('/api/v1/auth/login', authLimiter); // 登录限制：1小时5次
app.use('/api/v1', apiLimiter); // API限制：1分钟60次

// ===========================================
// 其他中间件
// ===========================================
app.use(express.json());
app.use(passport.initialize());

// 注入 prisma 到 request
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous',
      ip: req.ip
    });
    
    // 慢查询告警
    if (duration > 1000) {
      logger.warn('Slow API detected', {
        path: req.path,
        method: req.method,
        duration: `${duration}ms`,
        userId: req.userId || 'anonymous'
      });
    }
  });
  
  next();
});

// ===========================================
// API Documentation (Swagger)
// ===========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CLAW ID API文档'
}));

// API文档JSON格式
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Prometheus 指标收集中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    metrics.httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    metrics.httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });
  
  next();
});

// Prometheus 指标端点
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// 初始化服务
githubOAuth.initialize(prisma);
discordBot.initialize(prisma);
apiKeyManager.initialize(prisma);

// 路由
app.use('/auth', authRoutes);
app.use('/api/auth', userAuthRoutes);
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
      },
      userAuth: {
        'POST /api/auth/register': '用户注册',
        'POST /api/auth/login': '用户登录',
        'GET /api/auth/me': '获取当前用户信息',
        'PUT /api/auth/me': '更新用户信息',
        'POST /api/auth/change-password': '修改密码'
      }
    }
  });
});

// 404处理（在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理（必须在最后）
app.use(errorHandler);

// 启动服务器（仅在非测试环境）
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info('CLAW ID 2.0 server started', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
    logger.info('Server endpoints available', {
      health: `http://localhost:${PORT}/health`,
      api: `http://localhost:${PORT}/api/v1`
    });
    logger.info('Platform integrations configured', {
      github: process.env.GITHUB_CLIENT_ID ? 'enabled' : 'disabled',
      discord: process.env.DISCORD_BOT_TOKEN ? 'enabled' : 'disabled'
    });
  });
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('Shutting down server gracefully');
  await prisma.$disconnect();
  logger.info('Database disconnected');
  process.exit(0);
});

module.exports = app;
