// API Key 验证中间件
// 文件: src/middleware/auth.js

const crypto = require('crypto');

/**
 * 验证 API Key
 * 用法: router.get('/protected', validateApiKey, handler)
 */
async function validateApiKey(req, res, next) {
  try {
    // 从 header 获取 API Key
    const apiKey = req.headers['x-api-key'] ||
                   req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '缺少 API Key'
      });
    }

    // 验证格式
    if (!apiKey.startsWith('claw_')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '无效的 API Key 格式'
      });
    }

    // 哈希 API Key（用于数据库查询）
    const keyHash = hashApiKey(apiKey);

    // 在实际实现中，我们需要查询 users 表的 apiKey 字段
    // 但当前设计中，API Key 是与 agent 关联的
    // 这里简化处理：从 API Key 中提取 agent ID

    // 临时方案：将 API Key 存储在内存中（生产环境应使用数据库）
    // 这里我们需要一个全局的 API Key 映射

    // 由于我们没有在 agents 表中存储 apiKeyHash，暂时使用简化方案
    // 将 API Key 存储在全局 Map 中

    if (!global.apiKeyMap) {
      global.apiKeyMap = new Map();
    }

    const agentInfo = global.apiKeyMap.get(apiKey);

    if (!agentInfo) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API Key 不存在或已过期'
      });
    }

    // 检查 agent 状态
    const agent = await req.app.prisma.agents.findUnique({
      where: { id: agentInfo.agentId }
    });

    if (!agent || agent.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Agent 不存在或已停用'
      });
    }

    // 将 agent 信息附加到 request
    req.agent = agent;
    req.apiKey = apiKey;

    next();

  } catch (error) {
    console.error('[API Key Validation Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'API Key 验证失败'
    });
  }
}

/**
 * 哈希 API Key（用于安全存储）
 */
function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * 注册 API Key（创建 agent 时调用）
 */
function registerApiKey(apiKey, agentId) {
  if (!global.apiKeyMap) {
    global.apiKeyMap = new Map();
  }

  global.apiKeyMap.set(apiKey, {
    agentId,
    createdAt: new Date()
  });
}

/**
 * 撤销 API Key
 */
function revokeApiKey(apiKey) {
  if (global.apiKeyMap) {
    global.apiKeyMap.delete(apiKey);
  }
}

module.exports = {
  validateApiKey,
  registerApiKey,
  revokeApiKey,
  hashApiKey
};
