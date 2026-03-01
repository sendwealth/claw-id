#!/usr/bin/env node
/**
 * 完整自动化注册流程
 * 用法: node automate-registration.js <email> <username> [platforms]
 */

const GitHubRegistration = require('./src/services/githubRegistration');
const DiscordRegistration = require('./src/services/discordRegistration');
const EmailService = require('./src/services/emailService');
const fs = require('fs').promises;
const path = require('path');

class AutoRegistration {
  constructor() {
    this.results = [];
  }

  /**
   * 执行完整注册流程
   */
  async run(options) {
    console.log('🚀 启动全面自动化注册流程');
    console.log('配置:', options);

    const {
      email,
      username,
      platforms = ['github', 'discord'],
      password = this.generatePassword(),
      agentName = `Agent-${Date.now()}`
    } = options;

    // 创建 screenshots 目录
    await fs.mkdir('screenshots', { recursive: true });

    // 1. 生成智能体信息
    const agent = {
      name: agentName,
      email,
      username,
      password
    };

    console.log('\n📋 智能体信息:');
    console.log(`  姓名: ${agent.name}`);
    console.log(`  邮箱: ${agent.email}`);
    console.log(`  用户名: ${agent.username}`);
    console.log(`  密码: ${agent.password}\n`);

    // 2. 注册各个平台
    for (const platform of platforms) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🎯 开始注册 ${platform.toUpperCase()}`);
      console.log('='.repeat(50));

      let result;
      switch (platform) {
        case 'github':
          result = await GitHubRegistration.register(agent);
          break;
        case 'discord':
          result = await DiscordRegistration.register(agent);
          break;
        default:
          console.log(`⚠️  平台 ${platform} 暂不支持`);
          continue;
      }

      this.results.push({
        platform,
        ...result
      });

      // 等待一段时间，避免频率限制
      if (platforms.indexOf(platform) < platforms.length - 1) {
        console.log('\n⏳ 等待 10 秒后继续下一个平台...');
        await this.sleep(10000);
      }
    }

    // 3. 生成报告
    await this.generateReport(agent);

    // 4. 关闭浏览器
    await GitHubRegistration.close();
    await DiscordRegistration.close();

    console.log('\n✅ 全部注册流程完成！');
    console.log(`📊 结果已保存到: registration-report-${agent.username}.json`);

    return this.results;
  }

  /**
   * 生成密码
   */
  generatePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * 生成报告
   */
  async generateReport(agent) {
    const report = {
      agent: {
        name: agent.name,
        email: agent.email,
        username: agent.username,
        password: agent.password
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        success: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      }
    };

    const filename = `registration-report-${agent.username}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));

    console.log('\n📊 注册摘要:');
    console.log(`  总计: ${report.summary.total}`);
    console.log(`  成功: ${report.summary.success}`);
    console.log(`  失败: ${report.summary.failed}`);

    return report;
  }

  /**
   * 休眠
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node automate-registration.js <email> <username> [platforms]');
    console.log('示例: node automate-registration.js agent@example.com my-agent github,discord');
    process.exit(1);
  }

  const [email, username, platformsStr] = args;
  const platforms = platformsStr ? platformsStr.split(',') : ['github', 'discord'];

  const automation = new AutoRegistration();
  automation.run({
    email,
    username,
    platforms
  }).catch(console.error);
}

module.exports = AutoRegistration;
