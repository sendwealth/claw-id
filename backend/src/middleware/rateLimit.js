/**
 * Rate Limiting Middleware
 * CLAW ID API - Request rate limiting
 */

const rateLimit = require('express-rate-limit');

// 通用限制：每15分钟100次请求
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { 
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`[Rate Limit] IP ${req.ip} exceeded general limit`);
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// 认证限制：每小时5次登录尝试
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per hour
  message: { 
    error: '登录尝试次数过多，请1小时后再试',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    console.log(`[Rate Limit] IP ${req.ip} exceeded auth limit`);
    res.status(429).json({
      error: '登录尝试次数过多，请1小时后再试',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour'
    });
  }
});

// API限制：每分钟60次请求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: { 
    error: 'API调用频率超限',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[Rate Limit] IP ${req.ip} exceeded API limit`);
    res.status(429).json({
      error: 'API调用频率超限',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    });
  }
});

// 严格限制：用于敏感操作（如密钥重新生成）
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: { 
    error: '操作过于频繁，请稍后再试',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[Rate Limit] IP ${req.ip} exceeded strict limit`);
    res.status(429).json({
      error: '操作过于频繁，请稍后再试',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter
};
