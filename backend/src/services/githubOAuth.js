// OAuth 集成服务 - GitHub
// 文件: src/services/githubOAuth.js

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class GitHubOAuthService {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
    this.prisma = null; // 将在初始化时设置
  }

  /**
   * 初始化 GitHub OAuth
   */
  initialize(prisma) {
    this.prisma = prisma;

    passport.use(new GitHubStrategy({
      clientID: this.clientId,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackUrl,
      scope: ['user:email', 'repo', 'read:user']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // 加密存储 token
        const encryptedAccessToken = this.encryptToken(accessToken);
        const encryptedRefreshToken = refreshToken ? this.encryptToken(refreshToken) : null;

        return done(null, {
          platform: 'github',
          platformUserId: profile.id,
          username: profile.username,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          profile: profile
        });
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  /**
   * 生成 OAuth 授权 URL
   */
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'user:email repo read:user',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * 为智能体保存 GitHub 凭证
   */
  async saveCredentials(agentId, oauthData, prisma = null) {
    try {
      const db = prisma || this.prisma;

      if (!db) {
        throw new Error('Prisma 客户端未初始化');
      }

      // 计算token过期时间（GitHub token通常不过期，但设为1年后）
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const credential = await db.platform_credentials.upsert({
        where: {
          agentId_platform: {
            agentId: agentId,
            platform: 'github'
          }
        },
        update: {
          platformUserId: oauthData.platformUserId,
          accessToken: oauthData.accessToken,
          refreshToken: oauthData.refreshToken,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date()
        },
        create: {
          id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: agentId,
          platform: 'github',
          platformUserId: oauthData.platformUserId,
          accessToken: oauthData.accessToken,
          refreshToken: oauthData.refreshToken,
          tokenExpiresAt: expiresAt,
          scopes: JSON.stringify(['user:email', 'repo', 'read:user']),
          metadata: JSON.stringify({
            username: oauthData.username,
            profileUrl: oauthData.profile.profileUrl
          }),
          updatedAt: new Date()
        }
      });

      // 记录审计日志
      await this.logAudit(agentId, 'github_connected', {
        username: oauthData.username
      }, db);

      return credential;
    } catch (error) {
      console.error('保存GitHub凭证失败:', error);
      throw error;
    }
  }

  /**
   * 获取智能体的 GitHub Token（解密）
   */
  async getToken(agentId, prisma = null) {
    try {
      const db = prisma || this.prisma;

      if (!db) {
        throw new Error('Prisma 客户端未初始化');
      }

      const credential = await db.platform_credentials.findUnique({
        where: {
          agentId_platform: {
            agentId: agentId,
            platform: 'github'
          }
        }
      });

      if (!credential) {
        throw new Error('未找到GitHub凭证');
      }

      // 检查是否过期
      if (credential.tokenExpiresAt && new Date() > credential.tokenExpiresAt) {
        // 尝试刷新token
        if (credential.refreshToken) {
          return await this.refreshToken(agentId);
        }
        throw new Error('Token已过期');
      }

      // 解析 metadata（从 JSON 字符串）
      let metadata = {};
      try {
        metadata = JSON.parse(credential.metadata || '{}');
      } catch (e) {
        console.error('解析 metadata 失败:', e);
      }

      return {
        accessToken: this.decryptToken(credential.accessToken),
        username: metadata.username
      };
    } catch (error) {
      console.error('获取GitHub Token失败:', error);
      throw error;
    }
  }

  /**
   * 刷新 Token（GitHub OAuth token通常不过期，但预留接口）
   */
  async refreshToken(agentId) {
    // GitHub的OAuth token通常不会过期
    // 这里预留接口，如果需要可以实现refresh逻辑
    console.log('GitHub token通常不需要刷新');
    return await this.getToken(agentId);
  }

  /**
   * 调用 GitHub API
   */
  async callApi(agentId, endpoint, options = {}, prisma = null) {
    try {
      const { accessToken } = await this.getToken(agentId, prisma);

      const response = await fetch(`https://api.github.com${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CLAW-ID',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API错误: ${error.message}`);
      }

      // 记录API调用
      await this.logAudit(agentId, 'api_call', {
        platform: 'github',
        endpoint: endpoint
      }, prisma);

      return await response.json();
    } catch (error) {
      console.error('GitHub API调用失败:', error);
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
  async logAudit(agentId, action, details = {}, prisma = null) {
    try {
      const db = prisma || this.prisma;

      if (!db) {
        console.error('Prisma 客户端未初始化，跳过审计日志');
        return;
      }

      await db.audit_logs.create({
        data: {
          agentId: agentId,
          action: action,
          platform: 'github',
          details: details
        }
      });
    } catch (error) {
      console.error('记录审计日志失败:', error);
    }
  }
}

module.exports = new GitHubOAuthService();
