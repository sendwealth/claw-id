// GitHub 注册服务 - 全面自动化版
// 文件: src/services/githubRegistration.js

const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');

class GitHubRegistration {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  /**
   * 注册 GitHub 账号
   * @param {Object} agent - 智能体信息
   * @param {string} agent.email - 邮箱
   * @param {string} agent.username - 用户名
   * @param {string} agent.password - 密码
   * @returns {Object} 注册结果
   */
  async register(agent) {
    console.log(`🐙 开始为智能体注册 GitHub 账号: ${agent.username}`);

    try {
      // 启动浏览器
      this.browser = await chromium.launch({
        headless: false, // 初期使用有界面模式，方便调试和人工辅助
        slowMo: 50,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });

      const page = await this.context.newPage();

      // 1. 访问 GitHub 注册页
      console.log('📍 访问 GitHub 注册页...');
      await page.goto('https://github.com/signup', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // 2. 等待并填写邮箱
      console.log('📝 填写注册表单...');
      
      // GitHub 使用 React，需要等待元素渲染
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.fill('#email', agent.email);
      await page.waitForTimeout(1000);

      // 3. 点击继续按钮
      await this.clickContinueButton(page);
      await page.waitForTimeout(2000);

      // 4. 填写密码
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.fill('#password', agent.password);
      await page.waitForTimeout(1000);

      // 5. 点击继续按钮
      await this.clickContinueButton(page);
      await page.waitForTimeout(2000);

      // 6. 填写用户名
      await page.waitForSelector('#login', { timeout: 10000 });
      await page.fill('#login', agent.username);
      await page.waitForTimeout(1000);

      // 7. 点击继续按钮
      await this.clickContinueButton(page);
      await page.waitForTimeout(2000);

      // 8. 处理验证码/人机验证
      console.log('🤖 等待人机验证...');
      await page.waitForTimeout(5000);

      // 9. 检查是否有验证码需要处理
      const hasCaptcha = await page.$('iframe[src*="captcha"]');
      if (hasCaptcha) {
        console.log('⚠️  检测到验证码，等待人工处理...');
        // 等待人工处理验证码（最多5分钟）
        await page.waitForTimeout(300000);
      }

      // 10. 检查是否需要邮箱验证
      const currentUrl = page.url();
      console.log(`📍 当前 URL: ${currentUrl}`);

      // 11. 保存 Cookie 和 Session
      const cookies = await this.context.cookies();
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });

      // 12. 截图（用于调试）
      await page.screenshot({ 
        path: `screenshots/github-register-${agent.username}.png`,
        fullPage: true 
      });

      console.log('✅ GitHub 注册流程完成');

      return {
        success: true,
        username: agent.username,
        email: agent.email,
        cookies: cookies,
        localStorage: localStorage,
        url: currentUrl,
        needsEmailVerification: currentUrl.includes('verify'),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ GitHub 注册失败:', error.message);
      
      // 截图保存错误状态
      if (this.browser) {
        const page = await this.context.newPage();
        await page.screenshot({ 
          path: `screenshots/github-error-${agent.username}.png`,
          fullPage: true 
        });
      }

      return {
        success: false,
        error: error.message,
        username: agent.username,
        email: agent.email,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 点击继续按钮
   */
  async clickContinueButton(page) {
    const selectors = [
      'button[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Create account")',
      'button.btn-primary'
    ];

    for (const selector of selectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          const isVisible = await button.isVisible();
          if (isVisible) {
            await button.click();
            return true;
          }
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    return false;
  }

  /**
   * 验证邮箱
   * @param {string} verificationCode - 验证码（从邮箱中提取）
   */
  async verifyEmail(agent, verificationCode) {
    console.log('📧 开始验证邮箱...');

    try {
      const page = await this.context.newPage();
      
      // 访问验证链接或输入验证码
      if (verificationCode.startsWith('http')) {
        await page.goto(verificationCode, { waitUntil: 'networkidle' });
      } else {
        // 输入验证码
        await page.goto('https://github.com/verify', { waitUntil: 'networkidle' });
        await page.fill('input[name="verification_code"]', verificationCode);
        await page.click('button[type="submit"]');
      }

      await page.waitForTimeout(5000);
      
      console.log('✅ 邮箱验证完成');
      return { success: true };

    } catch (error) {
      console.error('❌ 邮箱验证失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建 Personal Access Token
   */
  async createToken(agent) {
    console.log('🔑 创建 Personal Access Token...');

    try {
      const page = await this.context.newPage();
      
      // 访问 Token 设置页面
      await page.goto('https://github.com/settings/tokens/new', {
        waitUntil: 'networkidle'
      });

      // 填写 Token 信息
      await page.fill('#token_description', `CLAW ID - ${agent.name}`);
      
      // 选择权限（repo, user, email）
      await page.check('input[value="repo"]');
      await page.check('input[value="user"]');
      await page.check('input[value="email"]');

      // 点击生成
      await page.click('button[type="submit"]');

      // 获取 Token
      await page.waitForSelector('#new-oauth-token', { timeout: 10000 });
      const token = await page.$eval('#new-oauth-token', el => el.textContent);

      console.log('✅ Token 创建成功');
      return { success: true, token };

    } catch (error) {
      console.error('❌ Token 创建失败:', error.message);
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

module.exports = new GitHubRegistration();
