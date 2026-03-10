/**
 * Agent Routes - API endpoints for agent management
 * Part of CLAW ID backend system
 * Enhanced with API Key management, search, and filtering
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const emailService = require('../services/emailService');
const tokenManager = require('../services/tokenManager');
const { registerApiKey, revokeApiKey, hashApiKey } = require('../middleware/auth');
const { authenticateJWT } = require('../middleware/jwt');
const { preventConcurrency } = require('../middleware/concurrency');
const { InputValidator } = require('../middleware/validation');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

/**
 * Generate a unique API key ID
 */
function generateApiKeyId() {
  return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

// ===========================================
// Agent CRUD Operations
// ===========================================

/**
 * @swagger
 * /api/v1/agents:
 *   post:
 *     summary: 创建Agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       400:
 *         description: 输入验证失败
 *       401:
 *         description: 未授权
 */
/**
 * POST /api/agents
 * Create a new agent with email and tokens
 * 
 * Request body:
 * {
 *   "name": "Agent Name",
 *   "platforms": ["platform1", "platform2"]
 * }
 * 
 * Response:
 * {
 *   "id": "agent_xxx",
 *   "name": "Agent Name",
 *   "email": "agent-xxx@claw.id",
 *   "apiKey": "claw_xxx",
 *   "createdAt": "2026-02-28T..."
 * }
 */
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const { name, platforms } = req.body;
    const userId = req.userId; // Get from JWT token

    // Validate required fields using InputValidator
    const validatedName = InputValidator.validateAgentName(name);

    // Validate platforms if provided
    if (platforms && Array.isArray(platforms)) {
      for (const platform of platforms) {
        InputValidator.validatePlatform(platform);
      }
    }

    // Debug: 检查 prisma 是否存在
    console.log('[Debug] req.prisma:', !!req.prisma);
    console.log('[Debug] req.prisma.agents:', !!req.prisma?.agents);
    console.log('[Debug] userId:', userId);

    // Generate agent ID
    const agentId = emailService.generateAgentId();

    // Generate email address
    const email = emailService.generateEmail(agentId);

    // Generate API key
    const { apiKey, keyHash } = tokenManager.generateApiKey(agentId);

    // Store in database with real userId from JWT
    const agent = await req.prisma.agents.create({
      data: {
        id: agentId,
        userId: userId,  // Use real userId from JWT authentication
        name: validatedName,
        description: null,
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    // 如果指定了平台，创建空的凭证记录
    if (platforms && platforms.length > 0) {
      for (const platform of platforms) {
        await req.prisma.platform_credentials.create({
          data: {
            id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agentId: agentId,
            platform: platform.toLowerCase(),
            accessToken: '',  // 待OAuth后填充
            scopes: '[]',
            updatedAt: new Date()
          }
        });
      }
    }

    // 创建初始 API Key 记录
    await req.prisma.api_keys.create({
      data: {
        id: generateApiKeyId(),
        agentId: agentId,
        keyHash: keyHash,
        keyPrefix: apiKey.substring(0, 12), // "claw_abc123..."
        name: 'Default Key',
        isActive: true
      }
    });

    // 记录审计日志
    await req.prisma.audit_logs.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: agentId,
        action: 'agent_created',
        details: JSON.stringify({ name: validatedName, platforms, userId })
      }
    });

    // 注册 API Key（用于后续验证）
    registerApiKey(apiKey, agentId);

    logger.info('Agent created successfully', {
      agentId: agentId,
      userId: userId,
      name: validatedName,
      ip: req.ip
    });

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      email: email,
      platforms: platforms || [],
      apiKey: apiKey,  // 仅返回一次
      createdAt: agent.createdAt
    });

  } catch (error) {
    logger.error('Agent creation failed', {
      userId: req.userId,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents:
 *   get:
 *     summary: 获取Agent列表
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: 未授权
 */
/**
 * GET /api/agents
 * List all agents with search, filtering, and pagination
 * 
 * Query parameters:
 * - status: Filter by status (ACTIVE/INACTIVE)
 * - platform: Filter by platform (github/discord)
 * - search: Search in name and description
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const { status, platform, search, page = 1, limit = 10 } = req.query;
    
    // Validate pagination
    const { page: validPage, limit: validLimit } = InputValidator.validatePagination(page, limit);
    const skip = (validPage - 1) * validLimit;
    
    // Validate status if provided
    const validStatus = InputValidator.validateStatus(status);
    
    // Validate platform if provided
    const validPlatform = InputValidator.validatePlatform(platform);

    // Try cache first (only if no filters)
    if (!validStatus && !validPlatform && !search) {
      const cacheKey = `agents:${req.userId}:${validPage}:${validLimit}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        logger.debug('Agents list served from cache', {
          userId: req.userId,
          page: validPage
        });
        return res.status(200).json(cached);
      }
    }

    // 构建查询条件
    const where = { 
      userId: req.userId // 只返回当前用户的agents
    };

    // 按状态过滤
    if (validStatus) {
      where.status = validStatus;
    }

    // 按平台过滤
    if (validPlatform) {
      where.platform_credentials = {
        some: { platform: validPlatform }
      };
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // 并行执行查询和计数
    const [agents, total] = await Promise.all([
      req.prisma.agents.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' }, // 使用索引
        select: { // 只查询需要的字段，优化性能
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          platform_credentials: {
            select: {
              platform: true,
              platformUserId: true
            }
          },
          _count: {
            select: { 
              platform_credentials: true,
              api_keys: true 
            }
          }
        }
      }),
      req.prisma.agents.count({ where })
    ]);

    const result = {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        email: emailService.generateEmail(agent.id),
        status: agent.status,
        platforms: agent.platform_credentials.map(c => c.platform),
        platformCount: agent._count.platform_credentials,
        apiKeyCount: agent._count.api_keys,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      })),
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit)
      },
      filters: {
        status: validStatus || null,
        platform: validPlatform || null,
        search: search || null
      }
    };

    // Cache for 2 minutes (only if no filters)
    if (!validStatus && !validPlatform && !search) {
      const cacheKey = `agents:${req.userId}:${validPage}:${validLimit}`;
      await cache.set(cacheKey, result, 120);
    }

    res.status(200).json(result);

  } catch (error) {
    logger.error('Agent listing failed', {
      userId: req.userId,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

/**
 * GET /api/agents/:id
 * Retrieve agent information by ID
 */
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;

    const agent = await req.prisma.agents.findFirst({
      where: { 
        id,
        userId: req.userId // 确保只能访问自己的agents
      },
      include: {
        platform_credentials: {
          select: {
            platform: true,
            platformUserId: true,
            scopes: true,
            createdAt: true
            // 不返回 accessToken（安全）
          }
        },
        api_keys: {
          select: {
            id: true,
            keyPrefix: true,
            name: true,
            lastUsedAt: true,
            isActive: true,
            createdAt: true
            // 不返回 keyHash（安全）
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Agent not found'
      });
    }

    // 生成邮箱（根据ID）
    const email = emailService.generateEmail(agent.id);

    res.status(200).json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      email: email,
      status: agent.status,
      platforms: agent.platform_credentials.map(c => ({
        platform: c.platform,
        connected: !!c.platformUserId,
        scopes: JSON.parse(c.scopes)
      })),
      apiKeys: agent.api_keys.map(k => ({
        id: k.id,
        prefix: k.keyPrefix,
        name: k.name,
        lastUsedAt: k.lastUsedAt,
        isActive: k.isActive,
        createdAt: k.createdAt
      })),
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    });

  } catch (error) {
    logger.error('Agent retrieval failed', {
      userId: req.userId,
      agentId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

/**
 * DELETE /api/agents/:id
 * Deactivate or delete an agent
 */
router.delete('/:id', 
  authenticateJWT, 
  preventConcurrency('agent'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      // 检查 agent 是否存在且属于当前用户
      const agent = await req.prisma.agents.findFirst({
        where: { 
          id,
          userId: req.userId 
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Agent not found'
        });
      }

      if (permanent === 'true') {
        // 永久删除（级联删除所有相关数据）
        await req.prisma.agents.delete({
          where: { id }
        });

        logger.info('Agent permanently deleted', {
          agentId: id,
          userId: req.userId,
          ip: req.ip
        });

        res.status(200).json({
          id,
          message: 'Agent permanently deleted'
        });
      } else {
        // 软删除（标记为 INACTIVE）
        await req.prisma.agents.update({
          where: { id },
          data: {
            status: 'INACTIVE',
            updatedAt: new Date()
          }
        });

        // 停用所有 API Keys
        await req.prisma.api_keys.updateMany({
          where: { agentId: id },
          data: { isActive: false }
        });

        // 记录审计日志
        await req.prisma.audit_logs.create({
          data: {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agentId: id,
            action: 'agent_deactivated'
          }
        });

        logger.info('Agent deactivated', {
          agentId: id,
          userId: req.userId,
          ip: req.ip
        });

        res.status(200).json({
          id,
          message: 'Agent deactivated',
          status: 'INACTIVE'
        });
      }

    } catch (error) {
      logger.error('Agent deletion failed', {
        userId: req.userId,
        agentId: req.params.id,
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
);

// ===========================================
// API Key Management
// ===========================================

/**
 * GET /api/agents/:id/keys
 * Get all API keys for an agent (without sensitive information)
 */
router.get('/:id/keys', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 验证 agent 所有权
    const agent = await req.prisma.agents.findFirst({
      where: { 
        id,
        userId: req.userId 
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Agent not found'
      });
    }

    // 获取所有 API Keys（不包含敏感的 keyHash）
    const keys = await req.prisma.api_keys.findMany({
      where: { agentId: id },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        lastUsedAt: true,
        isActive: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      agentId: id,
      agentName: agent.name,
      keys: keys.map(key => ({
        id: key.id,
        prefix: key.keyPrefix + '...',
        name: key.name,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt
      })),
      total: keys.length,
      active: keys.filter(k => k.isActive).length
    });

  } catch (error) {
    logger.error('API keys listing failed', {
      userId: req.userId,
      agentId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

/**
 * DELETE /api/agents/:id/keys/:keyId
 * Delete a specific API key
 */
router.delete('/:id/keys/:keyId', 
  authenticateJWT, 
  preventConcurrency('api_key'),
  async (req, res, next) => {
    try {
      const { id, keyId } = req.params;

      // 验证 agent 所有权
      const agent = await req.prisma.agents.findFirst({
        where: { 
          id,
          userId: req.userId 
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Agent not found'
        });
      }

      // 查找 API Key
      const apiKey = await req.prisma.api_keys.findFirst({
        where: { 
          id: keyId,
          agentId: id 
        }
      });

      if (!apiKey) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'API Key not found'
        });
      }

      // 删除 API Key
      await req.prisma.api_keys.delete({
        where: { id: keyId }
      });

      // 从内存中撤销
      // 注意：需要从 keyHash 反推完整的 key 才能撤销，这里简化处理
      // 生产环境应该维护 keyHash -> apiKey 的映射

      // 记录审计日志
      await req.prisma.audit_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: id,
          action: 'api_key_deleted',
          details: JSON.stringify({ keyId, keyPrefix: apiKey.keyPrefix })
        }
      });

      logger.info('API key deleted', {
        agentId: id,
        keyId: keyId,
        userId: req.userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'API Key deleted successfully',
        keyId: keyId
      });

    } catch (error) {
      logger.error('API key deletion failed', {
        userId: req.userId,
        agentId: req.params.id,
        keyId: req.params.keyId,
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
);

/**
 * POST /api/agents/:id/keys/regenerate
 * Regenerate API key (old key becomes invalid)
 */
router.post('/:id/keys/regenerate', 
  authenticateJWT, 
  preventConcurrency('api_key'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name = 'Regenerated Key', revokeOld = false } = req.body;

      // 验证 agent 所有权
      const agent = await req.prisma.agents.findFirst({
        where: { 
          id,
          userId: req.userId 
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Agent not found'
        });
      }

      // 检查 agent 状态
      if (agent.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Cannot regenerate keys for inactive agent'
        });
      }

      // 生成新的 API Key
      const { apiKey, keyHash } = tokenManager.generateApiKey(id);
      const keyPrefix = apiKey.substring(0, 12);

      // 如果指定，撤销旧的 keys
      if (revokeOld) {
        await req.prisma.api_keys.updateMany({
          where: { 
            agentId: id,
            isActive: true 
          },
          data: { isActive: false }
        });
      }

      // 创建新的 API Key 记录
      const newKey = await req.prisma.api_keys.create({
        data: {
          id: generateApiKeyId(),
          agentId: id,
          keyHash: keyHash,
          keyPrefix: keyPrefix,
          name: name,
          isActive: true
        }
      });

      // 注册到内存（用于快速验证）
      registerApiKey(apiKey, id);

      // 记录审计日志
      await req.prisma.audit_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: id,
          action: 'api_key_regenerated',
          details: JSON.stringify({ 
            keyId: newKey.id, 
            keyPrefix,
            revokedOld: revokeOld 
          })
        }
      });

      logger.info('API key regenerated', {
        agentId: id,
        keyId: newKey.id,
        userId: req.userId,
        revokedOld: revokeOld,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: revokeOld 
          ? 'API Key regenerated. Old keys have been revoked.' 
          : 'API Key regenerated. Old keys remain active.',
        apiKey: {
          id: newKey.id,
          key: apiKey, // 仅返回一次！
          prefix: keyPrefix + '...',
          name: newKey.name,
          createdAt: newKey.createdAt
        },
        warning: 'Store the API key securely. It will not be shown again.'
      });

    } catch (error) {
      logger.error('API key regeneration failed', {
        userId: req.userId,
        agentId: req.params.id,
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
);

/**
 * POST /api/agents/:id/keys
 * Create a new API key for an agent (additional key)
 */
router.post('/:id/keys', 
  authenticateJWT, 
  preventConcurrency('api_key'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name = 'Additional Key' } = req.body;

      // 验证 agent 所有权
      const agent = await req.prisma.agents.findFirst({
        where: { 
          id,
          userId: req.userId 
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Agent not found'
        });
      }

      // 检查 agent 状态
      if (agent.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Cannot create keys for inactive agent'
        });
      }

      // 检查密钥数量限制（可选）
      const existingKeys = await req.prisma.api_keys.count({
        where: { agentId: id, isActive: true }
      });

      if (existingKeys >= 10) {
        return res.status(400).json({
          error: 'LIMIT_EXCEEDED',
          message: 'Maximum 10 active API keys per agent'
        });
      }

      // 生成新的 API Key
      const { apiKey, keyHash } = tokenManager.generateApiKey(id);
      const keyPrefix = apiKey.substring(0, 12);

      // 创建新的 API Key 记录
      const newKey = await req.prisma.api_keys.create({
        data: {
          id: generateApiKeyId(),
          agentId: id,
          keyHash: keyHash,
          keyPrefix: keyPrefix,
          name: name,
          isActive: true
        }
      });

      // 注册到内存
      registerApiKey(apiKey, id);

      // 记录审计日志
      await req.prisma.audit_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: id,
          action: 'api_key_created',
          details: JSON.stringify({ keyId: newKey.id, keyPrefix, name })
        }
      });

      logger.info('API key created', {
        agentId: id,
        keyId: newKey.id,
        userId: req.userId,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'API Key created successfully',
        apiKey: {
          id: newKey.id,
          key: apiKey, // 仅返回一次！
          prefix: keyPrefix + '...',
          name: newKey.name,
          createdAt: newKey.createdAt
        },
        warning: 'Store the API key securely. It will not be shown again.'
      });

    } catch (error) {
      logger.error('API key creation failed', {
        userId: req.userId,
        agentId: req.params.id,
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
);

module.exports = router;
