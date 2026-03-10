/**
 * JWT Authentication Middleware
 * CLAW ID API - JWT token verification
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'claw-id-dev-secret-change-in-production';

/**
 * JWT 认证中间件
 * 验证 Authorization: Bearer <token> 格式的 JWT
 */
function authenticateJWT(req, res, next) {
  try {
    // 从 header 获取 token
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '缺少认证令牌',
        code: 'MISSING_TOKEN'
      });
    }

    // 提取 Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '认证令牌格式错误',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = parts[1];

    // 验证 JWT
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: '认证令牌已过期',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: '无效的认证令牌',
          code: 'INVALID_TOKEN'
        });
      }

      // 将用户信息附加到 request
      req.userId = decoded.userId || decoded.id;
      req.user = decoded;
      
      next();
    });

  } catch (error) {
    console.error('[JWT Auth Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '认证失败'
    });
  }
}

/**
 * 可选的 JWT 认证（不强制要求）
 * 如果提供了 token 则验证，否则继续
 */
function optionalJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return next();
  }

  return authenticateJWT(req, res, next);
}

/**
 * 生成 JWT Token
 */
function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证并解码 JWT（不作为中间件）
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateJWT,
  optionalJWT,
  generateToken,
  verifyToken
};
