const logger = require('../utils/logger');

/**
 * 自定义应用错误
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Prisma错误映射
 */
function handlePrismaError(error) {
  let statusCode = 500;
  let code = 'DATABASE_ERROR';
  let message = '数据库操作失败';

  switch (error.code) {
    case 'P2002':
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      const field = error.meta?.target?.[0] || '资源';
      message = `${field}已存在`;
      break;
    
    case 'P2025':
      statusCode = 404;
      code = 'NOT_FOUND';
      message = '请求的资源不存在';
      break;
    
    case 'P2003':
      statusCode = 400;
      code = 'FOREIGN_KEY_ERROR';
      message = '关联的资源不存在';
      break;
    
    case 'P2014':
      statusCode = 400;
      code = 'RELATION_ERROR';
      message = '操作违反了关系约束';
      break;
    
    case 'P2006':
      statusCode = 503;
      code = 'DATABASE_UNAVAILABLE';
      message = '数据库连接失败，请稍后重试';
      break;
  }

  return new AppError(message, statusCode, code);
}

/**
 * JWT错误处理
 */
function handleJWTError(error) {
  let message = '认证失败';
  let code = 'AUTH_ERROR';

  if (error.name === 'TokenExpiredError') {
    message = '登录已过期，请重新登录';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'JsonWebTokenError') {
    message = '无效的认证令牌';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'NotBeforeError') {
    message = '令牌尚未生效';
    code = 'TOKEN_NOT_ACTIVE';
  }

  return new AppError(message, 401, code);
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  let error = err;

  // 记录错误
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
    body: req.body,
    query: req.query,
    ip: req.ip
  });

  // Prisma错误
  if (err.code && err.code.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // JWT错误
  if (err.name && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
    error = handleJWTError(err);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400, 'VALIDATION_ERROR');
  }

  // 速率限制错误
  if (err.status === 429) {
    error = new AppError('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // 构造响应
  const response = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message || '服务器内部错误',
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // 开发环境返回堆栈
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error;
  }

  res.status(error.statusCode || 500).json(response);
}

/**
 * 404处理
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `找不到路径 ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};
