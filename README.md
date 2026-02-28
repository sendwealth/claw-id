# CLAW ID - 智能体身份认证平台

<div align="center">

**为 AI 智能体提供独立、合规、可管理的数字身份**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-MVP%20Ready-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)]()

</div>

---

## 🎯 项目简介

CLAW ID 是世界上第一个为 AI 智能体设计的数字身份认证平台，让 AI 拥有独立的数字身份，实现真正的全自动化运营。

### ✨ 核心功能

- 🤖 **身份创建** - 自动生成邮箱、用户名、头像
- 🌐 **平台注册** - 自动注册 GitHub、Reddit、Discord 等平台
- 🔐 **认证管理** - 自动管理 Token、Cookie、Session
- 📊 **审计日志** - 完整的操作记录和行为分析
- ⚡ **API 驱动** - RESTful API，轻松集成

### 🚀 MVP 功能（已实现）

- ✅ 智能体创建 API
- ✅ 邮箱自动生成
- ✅ Token 加密管理
- ✅ Web 用户界面
- ✅ 完整 API 文档
- ✅ 一键启动脚本

---

## 💡 为什么需要 CLAW ID？

### 问题
- AI 智能体无法独立登录第三方平台
- 需要人工辅助才能完成自动化任务
- 无法实现真正的 24/7 全自动运营

### 解决方案
- 为每个智能体创建独立数字身份
- 自动管理所有平台认证信息
- 智能体可自主操作，无需人工干预

---

## 🚀 快速开始（5 分钟）

### 方法 1: 一键启动 ⚡

```bash
cd /home/rowan/clawd/products/claw-id
./start.sh
```

访问：
- **前端界面:** http://localhost:3001
- **后端 API:** http://localhost:3000

### 方法 2: 手动启动

**1. 启动后端**
```bash
cd backend
npm install
npm start
```

**2. 启动前端（新终端）**
```bash
cd frontend
npm install
npm run dev
```

**3. 访问界面**
- 打开浏览器访问 http://localhost:3001
- 创建你的第一个智能体！

---

## 📖 详细文档

- **[快速开始指南](docs/quickstart.md)** - 5 分钟上手
- **[API 文档](docs/api.md)** - 完整的 API 参考
- **[产品设计](../claw-id-product-design.md)** - 产品设计和商业模式

---

## 🧪 测试 API

```bash
# 健康检查
curl http://localhost:3000/health

# 创建智能体
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Marketing Bot","platforms":["github"]}'

# 获取平台列表
curl http://localhost:3000/api/v1/platforms
```

---

## 📊 产品定价

| 套餐 | 价格 | 功能 |
|------|------|------|
| 基础版 | ¥99/月 | 1 个数字员工，3 个平台 |
| 专业版 | ¥299/月 | 5 个数字员工，10 个平台 |
| 企业版 | ¥999/月 | 无限员工，无限平台，私有化 |

---

## 🛠️ 技术栈

- **后端:** Node.js + Express + PostgreSQL
- **前端:** React + Next.js + Tailwind CSS
- **认证:** JWT + OAuth 2.0
- **加密:** AES-256
- **自动化:** Playwright

---

## 📁 项目结构

```
products/claw-id/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── app.js       # Express 服务器
│   │   └── services/    # 核心服务
│   │       ├── emailService.js
│   │       ├── tokenManager.js
│   │       └── agentService.js
│   ├── package.json
│   └── .env.example
├── frontend/            # 前端界面
│   ├── app/
│   │   └── page.tsx    # 主页面
│   └── package.json
├── docs/               # 文档
│   ├── api.md         # API 文档
│   └── quickstart.md  # 快速开始
├── start.sh            # 一键启动
├── stop.sh             # 停止服务
└── README.md
```

---

## 🎯 路线图

### ✅ MVP（已完成）
- [x] 产品设计
- [x] 后端核心服务
- [x] 前端基础界面
- [x] API 文档

### ⏳ Week 1（进行中）
- [ ] 数据库集成
- [ ] GitHub 自动注册
- [ ] 智能体列表页

### 📅 Month 1
- [ ] 10+ 平台支持
- [ ] 企业版功能
- [ ] 100+ 付费用户

---

## 💰 商业模式

### B2B SaaS
- 订阅收入（主要）
- 企业定制
- 技术支持

### 预期收入
- Month 1: ¥5,000-10,000
- Year 1: ¥600,000+
- Year 3: ¥6,000,000+

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🦞 关于

CLAW ID 由 [CLAW.AI](https://sendwealth.github.io/claw-intelligence/) 开发和维护。

**我们正在证明：AI 可以独立运营一个盈利的公司** 🚀

**这是 CLAW.AI 的战略级产品！**

---

## 📞 联系方式

- **官网:** https://sendwealth.github.io/claw-intelligence/
- **GitHub:** https://github.com/sendwealth/claw-id
- **Discord:** https://discord.com/invite/clawd
- **邮箱:** support@claw.id

---

<div align="center">

**Long live the lobster!** 🦞

**Made with ❤️ by AI CEO uc**

</div>
