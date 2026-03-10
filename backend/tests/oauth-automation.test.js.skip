// OAuth 自动化测试脚本
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const TEST_AGENT_ID = 'agent_1772538930237_187df71f';

class OAuthTester {
  constructor() {
    this.results = [];
  }

  log(test, status, message) {
    this.results.push({ test, status, message });
    console.log(`[${status === '✅' ? 'PASS' : 'FAIL'}] ${test}: ${message}`);
  }

  async testHealthCheck() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      
      if (data.status === 'ok') {
        this.log('健康检查', '✅', '服务运行正常');
        return true;
      } else {
        this.log('健康检查', '❌', '服务状态异常');
        return false;
      }
    } catch (err) {
      this.log('健康检查', '❌', `服务无法访问: ${err.message}`);
      return false;
    }
  }

  async testAuthUrlGeneration() {
    try {
      const res = await fetch(`${BASE_URL}/auth/github?agentId=${TEST_AGENT_ID}`);
      const data = await res.json();

      // 验证返回的 URL
      if (!data.authUrl) {
        this.log('授权 URL 生成', '❌', '未返回 authUrl');
        return false;
      }

      // 验证 URL 格式
      const url = new URL(data.authUrl);
      if (url.hostname !== 'github.com') {
        this.log('授权 URL 生成', '❌', 'URL 域名错误');
        return false;
      }

      // 验证 state 参数包含 agentId
      const state = url.searchParams.get('state');
      if (!state || !state.includes(TEST_AGENT_ID)) {
        this.log('授权 URL 生成', '❌', 'state 参数缺少 agentId');
        return false;
      }

      this.log('授权 URL 生成', '✅', `URL 格式正确，state: ${state}`);
      return true;
    } catch (err) {
      this.log('授权 URL 生成', '❌', `错误: ${err.message}`);
      return false;
    }
  }

  async testDatabaseUpsert() {
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // 模拟 OAuth 数据
      const mockOAuthData = {
        platformUserId: 'test_user_' + Date.now(),
        accessToken: 'test_token_encrypted',
        refreshToken: null,
        username: 'test_user',
        profile: {
          profileUrl: 'https://github.com/test_user'
        }
      };

      const result = await prisma.platform_credentials.upsert({
        where: {
          agentId_platform: {
            agentId: TEST_AGENT_ID,
            platform: 'github'
          }
        },
        update: {
          platformUserId: mockOAuthData.platformUserId,
          accessToken: mockOAuthData.accessToken,
          refreshToken: mockOAuthData.refreshToken,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date()
        },
        create: {
          id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: TEST_AGENT_ID,
          platform: 'github',
          platformUserId: mockOAuthData.platformUserId,
          accessToken: mockOAuthData.accessToken,
          refreshToken: mockOAuthData.refreshToken,
          tokenExpiresAt: expiresAt,
          scopes: JSON.stringify(['user:email', 'repo', 'read:user']),
          metadata: JSON.stringify({
            username: mockOAuthData.username,
            profileUrl: mockOAuthData.profile.profileUrl
          }),
          updatedAt: new Date()
        }
      });

      if (result && result.id) {
        this.log('数据库 Upsert', '✅', `成功保存凭证，ID: ${result.id}`);
        return true;
      } else {
        this.log('数据库 Upsert', '❌', '保存失败，无返回结果');
        return false;
      }
    } catch (err) {
      this.log('数据库 Upsert', '❌', `错误: ${err.message}`);
      return false;
    }
  }

  async testTokenEncryption() {
    try {
      const testToken = 'ghp_test_token_123456';
      const key = process.env.ENCRYPTION_KEY;

      if (!key) {
        this.log('Token 加密', '❌', 'ENCRYPTION_KEY 未设置');
        return false;
      }

      // 加密
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
      let encrypted = cipher.update(testToken, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const encryptedToken = iv.toString('hex') + ':' + encrypted;

      // 解密
      const [ivHex, encryptedData] = encryptedToken.split(':');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      if (decrypted === testToken) {
        this.log('Token 加密/解密', '✅', '加密解密功能正常');
        return true;
      } else {
        this.log('Token 加密/解密', '❌', '解密结果不匹配');
        return false;
      }
    } catch (err) {
      this.log('Token 加密/解密', '❌', `错误: ${err.message}`);
      return false;
    }
  }

  async testCredentialRetrieval() {
    try {
      const credential = await prisma.platform_credentials.findUnique({
        where: {
          agentId_platform: {
            agentId: TEST_AGENT_ID,
            platform: 'github'
          }
        }
      });

      if (credential) {
        this.log('凭证查询', '✅', `成功查询到凭证，platformUserId: ${credential.platformUserId}`);
        return true;
      } else {
        this.log('凭证查询', '❌', '未找到凭证记录');
        return false;
      }
    } catch (err) {
      this.log('凭证查询', '❌', `错误: ${err.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🧪 开始 OAuth 自动化测试...\n');
    console.log('=' .repeat(60));

    await this.testHealthCheck();
    await this.testAuthUrlGeneration();
    await this.testDatabaseUpsert();
    await this.testTokenEncryption();
    await this.testCredentialRetrieval();

    console.log('=' .repeat(60));
    console.log('\n📊 测试报告:\n');

    const passed = this.results.filter(r => r.status === '✅').length;
    const total = this.results.length;

    this.results.forEach(r => {
      console.log(`${r.status} ${r.test}: ${r.message}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${total - passed}`);
    console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);

    if (passed === total) {
      console.log('\n✅ 所有测试通过！OAuth 功能正常。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能。');
    }

    await prisma.$disconnect();
  }
}

// 运行测试
const tester = new OAuthTester();
tester.runAllTests().catch(console.error);
