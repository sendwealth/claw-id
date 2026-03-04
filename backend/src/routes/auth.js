// 认证路由 - OAuth & API Keys
// 文件: src/routes/auth.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const githubOAuth = require('../services/githubOAuth');
const apiKeyManager = require('../services/apiKeyManager');
const { validateApiKey } = require('../middleware/auth');

// 直接创建 prisma 客户端实例
const prisma = new PrismaClient();

/**
 * GET /auth/github
 * 发起 GitHub OAuth 认证
 */
router.get('/github', (req, res) => {
  const { agentId } = req.query;

  console.log('[OAuth] 收到请求, agentId:', agentId);

  if (!agentId) {
    return res.status(400).json({
      error: '缺少agentId参数',
      message: '请在URL中提供 ?agentId=xxx'
    });
  }

  // 将 agentId 编码到 state 中（格式：agentId:randomState）
  const randomState = require('crypto').randomBytes(16).toString('hex');
  const state = `${agentId}:${randomState}`;

  console.log('[OAuth] 生成的 state:', state);

  const authUrl = githubOAuth.getAuthUrl(state);

  console.log('[OAuth] 生成的 authUrl:', authUrl);

  res.json({
    authUrl: authUrl,
    state: state
  });
});

/**
 * GET /auth/github/callback
 * GitHub OAuth 回调
 */
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/error', session: false }),
  async (req, res) => {
    try {
      const { state } = req.query;

      if (!state) {
        return res.status(400).json({
          error: '缺少state参数'
        });
      }

      // 从 state 中解析 agentId（格式：agentId:randomState）
      const [agentId] = state.split(':');

      if (!agentId) {
        return res.status(400).json({
          error: '无效的state参数',
          message: '无法解析agentId'
        });
      }

      // 保存凭证（使用独立的 prisma 实例）
      console.log('[OAuth回调] agentId:', agentId);
      console.log('[OAuth回调] req.user:', req.user);
      console.log('[OAuth回调] prisma:', typeof prisma, prisma ? Object.keys(prisma).slice(0, 5) : 'null');

      const credential = await githubOAuth.saveCredentials(agentId, req.user, prisma);

      res.json({
        success: true,
        platform: 'github',
        username: req.user.username,
        message: 'GitHub账号连接成功'
      });
    } catch (error) {
      console.error('GitHub OAuth回调失败:', error);
      res.status(500).json({
        error: '认证失败',
        message: error.message
      });
    }
  }
);

/**
 * POST /auth/discord/bot
 * 添加 Discord Bot
 */
router.post('/discord/bot', validateApiKey, async (req, res) => {
  try {
    const { agentId, botToken, clientId } = req.body;

    if (!agentId || !botToken || !clientId) {
      return res.status(400).json({
        error: '缺少必需参数',
        message: '需要提供 agentId, botToken, clientId'
      });
    }

    // 验证所有权
    // TODO: 检查agentId是否属于当前用户

    const discordBot = require('../services/discordBot');
    const bot = await discordBot.createBot(agentId, botToken, clientId);

    res.json({
      success: true,
      bot: bot,
      message: 'Discord Bot添加成功'
    });
  } catch (error) {
    console.error('添加Discord Bot失败:', error);
    res.status(500).json({
      error: '添加失败',
      message: error.message
    });
  }
});

/**
 * GET /auth/discord/invite-url
 * 获取 Discord Bot 邀请链接
 */
router.get('/discord/invite-url', (req, res) => {
  const { clientId, permissions } = req.query;
  
  if (!clientId) {
    return res.status(400).json({
      error: '缺少clientId参数'
    });
  }

  const discordBot = require('../services/discordBot');
  const inviteUrl = discordBot.getInviteUrl(clientId, permissions || 2048);

  res.json({
    inviteUrl: inviteUrl
  });
});

/**
 * POST /auth/api-keys
 * 创建新的 API Key
 */
router.post('/api-keys', validateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKey = await apiKeyManager.createApiKey(userId);

    res.json({
      success: true,
      apiKey: apiKey,
      message: 'API Key创建成功（请妥善保存，仅显示一次）'
    });
  } catch (error) {
    console.error('创建API Key失败:', error);
    res.status(500).json({
      error: '创建失败',
      message: error.message
    });
  }
});

/**
 * POST /auth/api-keys/regenerate
 * 重新生成 API Key
 */
router.post('/api-keys/regenerate', validateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const newApiKey = await apiKeyManager.regenerateApiKey(userId);

    res.json({
      success: true,
      apiKey: newApiKey,
      message: 'API Key已重新生成（旧Key已失效）'
    });
  } catch (error) {
    console.error('重新生成API Key失败:', error);
    res.status(500).json({
      error: '重新生成失败',
      message: error.message
    });
  }
});

/**
 * DELETE /auth/api-keys
 * 删除 API Key
 */
router.delete('/api-keys', validateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    await apiKeyManager.deleteApiKey(userId);

    res.json({
      success: true,
      message: 'API Key已删除'
    });
  } catch (error) {
    console.error('删除API Key失败:', error);
    res.status(500).json({
      error: '删除失败',
      message: error.message
    });
  }
});

module.exports = router;
