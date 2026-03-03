/**
 * Agent Routes - API endpoints for agent management
 * Part of CLAW ID backend system
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const tokenManager = require('../services/tokenManager');
const { registerApiKey } = require('../middleware/auth');

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
router.post('/', async (req, res) => {
  try {
    const { name, platforms } = req.body;

    // Debug: 检查 prisma 是否存在
    console.log('[Debug] req.prisma:', !!req.prisma);
    console.log('[Debug] req.prisma.agents:', !!req.prisma?.agents);

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Agent name is required and must be a string'
      });
    }

    // Generate agent ID
    const agentId = emailService.generateAgentId();

    // Generate email address
    const email = emailService.generateEmail(agentId);

    // Generate API key
    const { apiKey, keyHash } = tokenManager.generateApiKey(agentId);

    // Store in database
    const agent = await req.prisma.agents.create({
      data: {
        id: agentId,
        userId: 'system',  // TODO: 使用真实用户ID（认证后）
        name: name.trim(),
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
            platform: platform,
            accessToken: '',  // 待OAuth后填充
            scopes: '[]',
            updatedAt: new Date()
          }
        });
      }
    }

    // 记录审计日志
    await req.prisma.audit_logs.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: agentId,
        action: 'agent_created',
        details: JSON.stringify({ name, platforms })
      }
    });

    // 注册 API Key（用于后续验证）
    registerApiKey(apiKey, agentId);

    console.log(`[Agent Created] ID: ${agentId}, Name: ${name}`);

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      email: email,
      platforms: platforms || [],
      apiKey: apiKey,  // 仅返回一次
      createdAt: agent.createdAt
    });

  } catch (error) {
    console.error('[Agent Creation Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create agent'
    });
  }
});

/**
 * GET /api/agents/:id
 * Retrieve agent information by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await req.prisma.agents.findUnique({
      where: { id },
      include: {
        platform_credentials: {
          select: {
            platform: true,
            platformUserId: true,
            scopes: true,
            createdAt: true
            // 不返回 accessToken（安全）
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
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
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    });

  } catch (error) {
    console.error('[Agent Retrieval Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve agent'
    });
  }
});

/**
 * GET /api/agents
 * List all agents (with pagination support)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 构建查询条件
    const where = {};
    if (status) {
      where.status = status;
    }

    const [agents, total] = await Promise.all([
      req.prisma.agents.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { platform_credentials: true }
          }
        }
      }),
      req.prisma.agents.count({ where })
    ]);

    res.status(200).json({
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: emailService.generateEmail(agent.id),
        status: agent.status,
        platformCount: agent._count.platform_credentials,
        createdAt: agent.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[Agent Listing Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list agents'
    });
  }
});

/**
 * DELETE /api/agents/:id
 * Deactivate or delete an agent
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    // 检查 agent 是否存在
    const agent = await req.prisma.agents.findUnique({
      where: { id }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Agent not found'
      });
    }

    if (permanent === 'true') {
      // 永久删除（级联删除所有相关数据）
      await req.prisma.agents.delete({
        where: { id }
      });

      console.log(`[Agent Deleted] ID: ${id}`);

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

      // 记录审计日志
      await req.prisma.audit_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: id,
          action: 'agent_deactivated'
        }
      });

      console.log(`[Agent Deactivated] ID: ${id}`);

      res.status(200).json({
        id,
        message: 'Agent deactivated',
        status: 'INACTIVE'
      });
    }

  } catch (error) {
    console.error('[Agent Deletion Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete agent'
    });
  }
});

module.exports = router;
