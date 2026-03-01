// Discord Bot 集成服务
// 文件: src/services/discordBot.js

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const crypto = require('crypto');

class DiscordBotService {
  constructor() {
    this.prisma = null;
    this.bots = new Map(); // 存储活跃的bot实例
  }

  /**
   * 初始化服务
   */
  initialize(prisma) {
    this.prisma = prisma;
  }

  /**
   * 创建新的 Discord Bot
   */
  async createBot(agentId, botToken, clientId) {
    try {
      // 验证 bot token
      const bot = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      await bot.login(botToken);
      
      // 获取 bot 信息
      const botInfo = bot.user;

      // 加密存储 token
      const encryptedToken = this.encryptToken(botToken);

      // 保存到数据库
      const credential = await this.prisma.platformCredential.upsert({
        where: {
          agentId_platform: {
            agentId: agentId,
            platform: 'discord'
          }
        },
        update: {
          accessToken: encryptedToken,
          platformUserId: clientId,
          metadata: {
            username: botInfo.username,
            discriminator: botInfo.discriminator,
            avatar: botInfo.avatar
          }
        },
        create: {
          agentId: agentId,
          platform: 'discord',
          platformUserId: clientId,
          accessToken: encryptedToken,
          scopes: ['bot', 'applications.commands'],
          metadata: {
            username: botInfo.username,
            discriminator: botInfo.discriminator,
            avatar: botInfo.avatar
          }
        }
      });

      // 存储 bot 实例
      this.bots.set(agentId, bot);

      // 记录审计日志
      await this.logAudit(agentId, 'discord_bot_created', {
        username: botInfo.username
      });

      // 关闭临时连接
      await bot.destroy();

      return {
        id: credential.id,
        username: botInfo.username,
        discriminator: botInfo.discriminator,
        avatar: botInfo.avatar
      };
    } catch (error) {
      console.error('创建Discord Bot失败:', error);
      throw error;
    }
  }

  /**
   * 生成 Bot 邀请链接
   */
  getInviteUrl(clientId, permissions = 2048) {
    const params = new URLSearchParams({
      client_id: clientId,
      permissions: permissions,
      scope: 'bot applications.commands'
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * 获取智能体的 Discord Bot
   */
  async getBot(agentId) {
    try {
      // 如果已经在内存中，直接返回
      if (this.bots.has(agentId)) {
        return this.bots.get(agentId);
      }

      // 从数据库获取
      const credential = await this.prisma.platformCredential.findUnique({
        where: {
          agentId_platform: {
            agentId: agentId,
            platform: 'discord'
          }
        }
      });

      if (!credential) {
        throw new Error('未找到Discord Bot凭证');
      }

      // 解密 token
      const botToken = this.decryptToken(credential.accessToken);

      // 创建新的 bot 实例
      const bot = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      await bot.login(botToken);

      // 缓存
      this.bots.set(agentId, bot);

      return bot;
    } catch (error) {
      console.error('获取Discord Bot失败:', error);
      throw error;
    }
  }

  /**
   * 发送消息到频道
   */
  async sendMessage(agentId, channelId, content) {
    try {
      const bot = await this.getBot(agentId);
      const channel = await bot.channels.fetch(channelId);

      if (!channel) {
        throw new Error('频道不存在');
      }

      const message = await channel.send(content);

      // 记录审计日志
      await this.logAudit(agentId, 'discord_message_sent', {
        channelId: channelId,
        messageId: message.id
      });

      return {
        id: message.id,
        content: message.content,
        channelId: channelId
      };
    } catch (error) {
      console.error('发送Discord消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Bot 所在的服务器列表
   */
  async getGuilds(agentId) {
    try {
      const bot = await this.getBot(agentId);
      const guilds = bot.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount
      }));

      return guilds;
    } catch (error) {
      console.error('获取Discord服务器列表失败:', error);
      throw error;
    }
  }

  /**
   * 加密 Token
   */
  encryptToken(token) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY未设置');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密 Token
   */
  decryptToken(encryptedToken) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY未设置');
    }

    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 记录审计日志
   */
  async logAudit(agentId, action, details = {}) {
    try {
      await this.prisma.auditLog.create({
        data: {
          agentId: agentId,
          action: action,
          platform: 'discord',
          details: details
        }
      });
    } catch (error) {
      console.error('记录审计日志失败:', error);
    }
  }

  /**
   * 销毁 Bot 实例
   */
  async destroyBot(agentId) {
    if (this.bots.has(agentId)) {
      const bot = this.bots.get(agentId);
      await bot.destroy();
      this.bots.delete(agentId);
    }
  }
}

module.exports = new DiscordBotService();
