// Discord 注册服务 - 快速实现版
// 文件: src/services/discordRegistration.js

const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');

class DiscordRegistration {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  /**
   * 注册 Discord 账号
   * @param {Object} agent - 智能体信息
   * @param {string} agent.email - 邮箱
   * @param {string} agent.username - 用户名
   * @param {string} agent.password - 密码
   * @returns {Object} 注册结果
   */
  async register(agent) {
    console.log(`🎭 开始为智能体注册 Discord 账号: ${agent.username}`);

    try {
      // 启动浏览器
      this.browser = await chromium.launch({
        headless: false, // 初期使用有界面模式，方便调试
        slowMo: 100
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await this.context.newPage();

      // 1. 访问 Discord 注册页
      console.log('📍 访问 Discord 注册页...');
      await page.goto('https://discord.com/register', {
        waitUntil: 'networkidle'
      });

      // 2. 填写注册表单
      console.log('📝 填写注册表单...');

      // 等待表单加载
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });

      // 填写邮箱
      await page.fill('input[name="email"]', agent.email);
      await page.waitForTimeout(500);

      // 填写用户名（Discord 可能使用不同的选择器）
      const usernameSelector = await this.findInputSelector(page, ['username', 'global_name', 'display_name']);
      if (usernameSelector) {
        await page.fill(usernameSelector, agent.username);
        await page.waitForTimeout(500);
      }

      // 填写密码
      await page.fill('input[name="password"]', agent.password);
      await page.waitForTimeout(500);

      // 填写生日（Discord 要求）
      const birthdaySelectors = [
        'select[name="month"]',
        'select[name="day"]',
        'select[name="year"]',
        'input[name="date_of_birth"]'
      ];

      for (const selector of birthdaySelectors) {
        const exists = await page.$(selector);
        if (exists) {
          if (selector.includes('month')) {
            await page.selectOption(selector, '1'); // 1月
          } else if (selector.includes('day')) {
            await page.selectOption(selector, '15'); // 15日
          } else if (selector.includes('year')) {
            await page.selectOption(selector, '1995'); // 1995年
          } else if (selector.includes('date_of_birth')) {
            await page.fill(selector, '1995-01-15');
          }
          await page.waitForTimeout(300);
        }
      }

      // 3. 点击注册按钮
      console.log('🔘 点击注册按钮...');
      const submitButton = await this.findButton(page, ['Continue', 'Register', 'Sign Up', 'submit']);
      if (submitButton) {
        await submitButton.click();
      }

      // 4. 等待验证流程
      console.log('⏳ 等待验证流程...');
      await page.waitForTimeout(3000);

      // 5. 检查是否需要验证邮箱
      const currentUrl = page.url();
      console.log(`📍 当前 URL: ${currentUrl}`);

      // 6. 保存 Cookie 和 Session
      const cookies = await this.context.cookies();
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });

      // 7. 截图（用于调试）
      await page.screenshot({ path: `screenshots/discord-register-${agent.username}.png` });

      console.log('✅ Discord 注册流程完成');

      return {
        success: true,
        username: agent.username,
        email: agent.email,
        cookies: cookies,
        localStorage: localStorage,
        url: currentUrl,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Discord 注册失败:', error.message);
      return {
        success: false,
        error: error.message,
        username: agent.username,
        email: agent.email,
        timestamp: new Date().toISOString()
      };
    } finally {
      // 保持浏览器打开，方便后续操作
      // if (this.browser) {
      //   await this.browser.close();
      // }
    }
  }

  /**
   * 查找输入框选择器
   */
  async findInputSelector(page, possibleNames) {
    for (const name of possibleNames) {
      const selector = `input[name="${name}"]`;
      const exists = await page.$(selector);
      if (exists) return selector;
    }
    return null;
  }

  /**
   * 查找按钮
   */
  async findButton(page, possibleTexts) {
    for (const text of possibleTexts) {
      // 尝试不同的按钮选择器
      const selectors = [
        `button:has-text("${text}")`,
        `button[type="submit"]`,
        `input[type="submit"]`,
        `button:has-text("Continue")`
      ];

      for (const selector of selectors) {
        const button = await page.$(selector);
        if (button) return button;
      }
    }
    return null;
  }

  /**
   * 验证邮箱（需要访问邮箱服务）
   */
  async verifyEmail(agent, verificationLink) {
    console.log('📧 开始验证邮箱...');

    try {
      const page = await this.context.newPage();
      await page.goto(verificationLink, { waitUntil: 'networkidle' });

      // 等待验证完成
      await page.waitForTimeout(5000);

      console.log('✅ 邮箱验证完成');
      return { success: true };

    } catch (error) {
      console.error('❌ 邮箱验证失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 发布消息到 Discord 频道
   */
  async postMessage(channelUrl, message) {
    console.log(`💬 发布消息到 Discord: ${channelUrl}`);

    try {
      const page = await this.context.newPage();
      await page.goto(channelUrl, { waitUntil: 'networkidle' });

      // 等待聊天输入框
      await page.waitForSelector('[data-slate-editor="true"]', { timeout: 10000 });

      // 输入消息
      await page.click('[data-slate-editor="true"]');
      await page.type('[data-slate-editor="true"]', message);

      // 发送
      await page.keyboard.press('Enter');

      console.log('✅ 消息发布成功');
      return { success: true };

    } catch (error) {
      console.error('❌ 消息发布失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}

module.exports = new DiscordRegistration();
