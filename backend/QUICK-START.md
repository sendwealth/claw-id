# 快速开始 - 自动化注册

## 🎯 方案2：从注册开始全面自动化

### 前置要求

1. **安装依赖**
```bash
cd /home/rowan/clawd/products/claw-id/backend
npm install playwright
npx playwright install chromium
```

2. **准备邮箱**
   - 需要真实的邮箱地址（用于接收验证码）
   - 支持 Gmail, Outlook, 自建邮箱等

3. **创建截图目录**
```bash
mkdir -p screenshots
```

---

## 🚀 使用方法

### 方式 1：命令行直接运行

```bash
# 注册 GitHub + Discord
node automate-registration.js your-email@example.com your-username

# 只注册 GitHub
node automate-registration.js your-email@example.com your-username github

# 注册多个平台
node automate-registration.js your-email@example.com your-username github,discord,reddit
```

### 方式 2：Node.js 脚本调用

```javascript
const AutoRegistration = require('./automate-registration');

const automation = new AutoRegistration();

automation.run({
  email: 'agent@yourdomain.com',
  username: 'claw-agent-001',
  platforms: ['github', 'discord'],
  agentName: 'Marketing Bot'
}).then(results => {
  console.log('注册结果:', results);
});
```

---

## 📋 执行流程

1. **启动浏览器** - Playwright 自动打开 Chromium
2. **填写注册表单** - 自动填写邮箱、用户名、密码
3. **人工辅助** - 遇到验证码时暂停，等待人工处理
4. **邮箱验证** - 需要手动检查邮箱并输入验证码
5. **保存凭证** - 自动保存 Cookie、Token 到本地
6. **生成报告** - 创建 JSON 报告文件

---

## ⚙️ 当前支持的平台

| 平台 | 状态 | 功能 |
|------|------|------|
| GitHub | ✅ | 注册、邮箱验证、Token 创建 |
| Discord | ✅ | 注册、邮箱验证 |
| Reddit | 🚧 | 开发中 |
| Twitter | 🚧 | 计划中 |

---

## 🔧 人工辅助环节

**需要人工处理的场景：**
- ✅ 验证码（CAPTCHA）
- ✅ 邮箱验证码输入
- ✅ 手机号验证（如果有）

**自动化环节：**
- ✅ 打开浏览器
- ✅ 填写表单
- ✅ 点击按钮
- ✅ 保存 Cookie
- ✅ 生成报告

---

## 📧 关于邮箱

### 选项 1：使用现有邮箱
- Gmail: yourname+agent1@gmail.com
- Outlook: yourname+agent1@outlook.com

### 选项 2：域名邮箱（推荐）
- 需要拥有域名
- 配置 MX 记录
- 使用 Mail-in-a-Box 或 Google Workspace

### 选项 3：临时邮箱服务
- TempMail API
- 10 Minute Mail
- 适合测试，不适合生产

---

## 🎯 下一步

**Master，请告诉我：**

1. **邮箱信息**
   - 你提供的是什么邮箱？
   - 邮箱地址是什么？
   - 我能通过 API 访问邮件吗？

2. **要注册的平台**
   - GitHub（必须）
   - Discord（可选）
   - 其他平台？

3. **智能体信息**
   - 用户名建议？
   - 智能体名称？

**准备好后，我立即开始执行！** 🚀
