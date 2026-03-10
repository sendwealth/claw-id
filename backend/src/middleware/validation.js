const validator = require('validator');

/**
 * 输入验证中间件
 */
class InputValidator {
  /**
   * 验证邮箱
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('邮箱不能为空');
    }

    const trimmed = email.trim().toLowerCase();
    
    // 长度检查
    if (trimmed.length > 255) {
      throw new Error('邮箱长度不能超过255字符');
    }

    // 格式检查
    if (!validator.isEmail(trimmed)) {
      throw new Error('邮箱格式不正确');
    }

    // 不允许一次性邮箱（简单检查）
    const disposableDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com'];
    const domain = trimmed.split('@')[1];
    if (disposableDomains.includes(domain)) {
      throw new Error('不支持一次性邮箱');
    }

    return trimmed;
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('密码不能为空');
    }

    // 长度检查
    if (password.length < 8) {
      throw new Error('密码至少需要8个字符');
    }
    if (password.length > 128) {
      throw new Error('密码长度不能超过128字符');
    }

    // 复杂度检查
    if (!/[a-z]/.test(password)) {
      throw new Error('密码必须包含小写字母');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('密码必须包含大写字母');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('密码必须包含数字');
    }

    // 常见弱密码检查
    const weakPasswords = [
      'password', 'Password1', '12345678', 'qwerty123',
      'abc123456', 'Password123', 'Admin123'
    ];
    if (weakPasswords.includes(password)) {
      throw new Error('密码过于简单，请使用更强的密码');
    }

    return password;
  }

  /**
   * 验证名称
   */
  static validateName(name) {
    if (!name || typeof name !== 'string') {
      return null; // 名称可选
    }

    const trimmed = name.trim();
    
    // 长度检查
    if (trimmed.length === 0) {
      return null;
    }
    if (trimmed.length > 100) {
      throw new Error('名称长度不能超过100字符');
    }

    // 不允许HTML标签
    if (/<[^>]*>/.test(trimmed)) {
      throw new Error('名称不能包含HTML标签');
    }

    // 不允许特殊控制字符
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
      throw new Error('名称包含非法字符');
    }

    // 转义HTML实体
    return validator.escape(trimmed);
  }

  /**
   * 验证Agent名称
   */
  static validateAgentName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Agent名称不能为空');
    }

    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
      throw new Error('Agent名称不能为空');
    }
    if (trimmed.length > 100) {
      throw new Error('Agent名称长度不能超过100字符');
    }

    // 不允许HTML标签
    if (/<[^>]*>/.test(trimmed)) {
      throw new Error('Agent名称不能包含HTML标签');
    }

    return validator.escape(trimmed);
  }

  /**
   * 验证分页参数
   */
  static validatePagination(page, limit) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
    return { page: p, limit: l };
  }

  /**
   * 验证状态
   */
  static validateStatus(status) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`无效的状态，只允许: ${validStatuses.join(', ')}`);
    }
    return status;
  }

  /**
   * 验证平台
   */
  static validatePlatform(platform) {
    const validPlatforms = ['github', 'discord', 'twitter', 'telegram', 'slack'];
    if (platform && !validPlatforms.includes(platform.toLowerCase())) {
      throw new Error(`无效的平台，只支持: ${validPlatforms.join(', ')}`);
    }
    return platform?.toLowerCase();
  }
}

/**
 * 清理对象中的敏感字段
 */
function sanitizeUser(user) {
  if (!user) return null;
  
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * 请求验证中间件工厂
 */
function validateRequest(validators) {
  return async (req, res, next) => {
    try {
      for (const [field, validator] of Object.entries(validators)) {
        if (req.body[field] !== undefined) {
          req.body[field] = validator(req.body[field]);
        }
      }
      next();
    } catch (error) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  };
}

module.exports = {
  InputValidator,
  sanitizeUser,
  validateRequest
};
