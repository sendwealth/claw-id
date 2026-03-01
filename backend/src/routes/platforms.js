// 平台集成路由
// 文件: src/routes/platforms.js

const express = require('express');
const router = express.Router();
const githubOAuth = require('../services/githubOAuth');
const discordBot = require('../services/discordBot');
const { requireApiKey } = require('../middleware/auth');

/**
 * GET /api/v1/platforms
 * 获取支持的平台列表
 */
router.get('/', (req, res) => {
  res.json({
    platforms: [
      {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        features: ['repo_access', 'user_info', 'issues', 'pull_requests'],
        status: 'active'
      },
      {
        id: 'discord',
        name: 'Discord',
        type: 'bot',
        features: ['guilds', 'messages', 'channels'],
        status: 'active'
      },
      {
        id: 'reddit',
        name: 'Reddit',
        type: 'oauth',
        features: ['submit', 'read', 'history'],
        status: 'coming_soon'
      },
      {
        id: 'twitter',
        name: 'Twitter/X',
        type: 'oauth2',
        features: ['tweet', 'dm', 'follow'],
        status: 'coming_soon'
      }
    ]
  });
});

/**
 * GET /api/v1/platforms/:platform/status/:agentId
 * 获取智能体在某个平台的连接状态
 */
router.get('/:platform/status/:agentId', requireApiKey, async (req, res) => {
  try {
    const { platform, agentId } = req.params;
    const prisma = require('../app').prisma;

    const credential = await prisma.platformCredential.findUnique({
      where: {
        agentId_platform: {
          agentId: agentId,
          platform: platform
        }
      }
    });

    res.json({
      connected: !!credential,
      platform: platform,
      connectedAt: credential?.createdAt,
      metadata: credential?.metadata
    });
  } catch (error) {
    console.error('获取平台状态失败:', error);
    res.status(500).json({
      error: '查询失败',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/platforms/:platform/disconnect/:agentId
 * 断开平台连接
 */
router.delete('/:platform/disconnect/:agentId', requireApiKey, async (req, res) => {
  try {
    const { platform, agentId } = req.params;
    const prisma = require('../app').prisma;

    await prisma.platformCredential.delete({
      where: {
        agentId_platform: {
          agentId: agentId,
          platform: platform
        }
      }
    });

    // 如果是Discord，销毁bot实例
    if (platform === 'discord') {
      await discordBot.destroyBot(agentId);
    }

    res.json({
      success: true,
      message: `${platform}已断开连接`
    });
  } catch (error) {
    console.error('断开平台连接失败:', error);
    res.status(500).json({
      error: '断开失败',
      message: error.message
    });
  }
});

// ========== GitHub API ==========

/**
 * GET /api/v1/platforms/github/repos/:agentId
 * 获取 GitHub 仓库列表
 */
router.get('/github/repos/:agentId', requireApiKey, async (req, res) => {
  try {
    const { agentId } = req.params;
    const repos = await githubOAuth.callApi(agentId, '/user/repos');
    
    res.json({
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url
      }))
    });
  } catch (error) {
    console.error('获取GitHub仓库失败:', error);
    res.status(500).json({
      error: '获取失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/platforms/github/issues/:agentId
 * 创建 GitHub Issue
 */
router.post('/github/issues/:agentId', requireApiKey, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { owner, repo, title, body } = req.body;

    const issue = await githubOAuth.callApi(
      agentId,
      `/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({ title, body })
      }
    );

    res.json({
      success: true,
      issue: {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      }
    });
  } catch (error) {
    console.error('创建GitHub Issue失败:', error);
    res.status(500).json({
      error: '创建失败',
      message: error.message
    });
  }
});

// ========== Discord API ==========

/**
 * GET /api/v1/platforms/discord/guilds/:agentId
 * 获取 Discord 服务器列表
 */
router.get('/discord/guilds/:agentId', requireApiKey, async (req, res) => {
  try {
    const { agentId } = req.params;
    const guilds = await discordBot.getGuilds(agentId);

    res.json({
      guilds: guilds
    });
  } catch (error) {
    console.error('获取Discord服务器失败:', error);
    res.status(500).json({
      error: '获取失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/platforms/discord/messages/:agentId
 * 发送 Discord 消息
 */
router.post('/discord/messages/:agentId', requireApiKey, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { channelId, content } = req.body;

    const message = await discordBot.sendMessage(agentId, channelId, content);

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('发送Discord消息失败:', error);
    res.status(500).json({
      error: '发送失败',
      message: error.message
    });
  }
});

module.exports = router;
