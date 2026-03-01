// API Key 管理服务
// 文件: src/services/apiKeyManager.js

const crypto = require('crypto');
const bcrypt = require('bcrypt');

class ApiKeyManager {
  constructor() {
    this.prisma = null;
    this.SALT_ROUNDS = 10;
  }

  /**
   * 初始化服务
   */
  initialize(prisma) {
    this.prisma = prisma;
  }

  /**
   * 生成 API Key
   */
  generateApiKey() {
    // 生成随机 API Key
    const prefix = 'claw';
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${key}`;
  }

  /**
   * 为用户创建 API Key
   */
  async createApiKey(userId) {
    try {
      const apiKey = this.generateApiKey();
      const hashedKey = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

      // 更新用户的 API Key
      await this.prisma.user.update({
        where: { id: userId },
        data: { apiKey: hashedKey }
      });

      // 返回明文 key（仅此一次）
      return apiKey;
    } catch (error) {
      console.error('创建API Key失败:', error);
      throw error;
    }
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey) {
    try {
      // 查找所有用户（优化：可以建立索引）
      const users = await this.prisma.user.findMany({
        select: { id: true, apiKey: true, email: true, role: true }
      });

      for (const user of users) {
        const isValid = await bcrypt.compare(apiKey, user.apiKey);
        if (isValid) {
          return {
            valid: true,
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            }
          };
        }
      }

      return { valid: false };
    } catch (error) {
      console.error('验证API Key失败:', error);
      throw error;
    }
  }

  /**
   * 重新生成 API Key（使旧的失效）
   */
  async regenerateApiKey(userId) {
    try {
      const newApiKey = await this.createApiKey(userId);

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          agentId: null, // 用户级别的操作
          action: 'api_key_regenerated',
          details: { userId: userId }
        }
      });

      return newApiKey;
    } catch (error) {
      console.error('重新生成API Key失败:', error);
      throw error;
    }
  }

  /**
   * 删除 API Key
   */
  async deleteApiKey(userId) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { apiKey: null }
      });

      return { success: true };
    } catch (error) {
      console.error('删除API Key失败:', error);
      throw error;
    }
  }
}

module.exports = new ApiKeyManager();
