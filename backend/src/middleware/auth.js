// 认证中间件
// 文件: src/middleware/auth.js

const apiKeyManager = require('../services/apiKeyManager');

/**
 * API Key 认证中间件
 */
async function requireApiKey(req, res, next) {
  try {
    // 从 header 获取 API Key
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: '缺少API Key',
        message: '请在header中提供 x-api-key 或 Authorization: Bearer <api-key>'
      });
    }

    // 验证 API Key
    const result = await apiKeyManager.verifyApiKey(apiKey);

    if (!result.valid) {
      return res.status(401).json({
        error: '无效的API Key',
        message: 'API Key不存在或已过期'
      });
    }

    // 将用户信息附加到 request
    req.user = result.user;
    next();
  } catch (error) {
    console.error('API Key验证失败:', error);
    res.status(500).json({
      error: '认证失败',
      message: error.message
    });
  }
}

/**
 * 管理员权限中间件
 */
async function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: '权限不足',
      message: '需要管理员权限'
    });
  }
  next();
}

/**
 * 资源所有权检查中间件
 */
async function requireOwnership(req, res, next) {
  const resourceId = req.params.agentId || req.params.id;
  const userId = req.user.id;

  // TODO: 检查资源是否属于当前用户
  // 这里需要查询数据库验证所有权
  
  next();
}

/**
 * 速率限制中间件（基于API Key）
 */
const rateLimiter = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
  return async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return next();
    }

    const now = Date.now();
    const userRequests = rateLimiter.get(apiKey) || [];
    
    // 过滤掉过期的请求
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: '请求过于频繁',
        message: `超过速率限制：${maxRequests}次/${windowMs/1000}秒`,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    // 记录本次请求
    validRequests.push(now);
    rateLimiter.set(apiKey, validRequests);

    next();
  };
}

module.exports = {
  requireApiKey,
  requireAdmin,
  requireOwnership,
  rateLimit
};
