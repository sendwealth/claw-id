# CLAW ID 2.0 - AI智能体身份管理与API集成平台

<div align="center">

**为 AI 智能体提供安全、合规、便捷的身份管理解决方案**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)]()

</div>

---

## 🎯 产品定位

**CLAW ID 2.0** 是一个为 AI 智能体设计的身份管理与平台集成解决方案，帮助企业安全、合规地管理多个智能体的数字身份。

### 核心价值

- 🔐 **安全的身份管理** - 加密存储、权限控制、审计日志
- 🔗 **便捷的平台集成** - 一站式接入 GitHub、Discord、Reddit 等平台
- ✅ **完全合规** - 使用官方 API，无法律风险
- 🚀 **快速部署** - 5分钟即可完成集成

---

## ✨ 核心功能

### 1. 官方 API 集成 ⭐

**支持平台：**
- **GitHub** - OAuth 2.0 集成，支持仓库管理、Issue 创建
- **Discord** - Bot API 集成，支持消息发送、服务器管理
- **Reddit** - OAuth 2.0（开发中）
- **Twitter** - API v2（开发中）

**优势：**
- ✅ 完全合规（使用官方 API）
- ✅ 稳定可靠（无反爬虫对抗）
- ✅ 维护成本低
- ✅ 企业接受度高

### 2. 身份管理平台

**功能：**
- 🤖 智能体创建和管理
- 🔑 API Key 生成和管理
- 🔒 Token 加密存储（AES-256）
- 🔄 Token 自动刷新
- 📊 完整的审计日志
- 👥 团队协作和权限控制

### 3. 安全与合规

**安全措施：**
- AES-256 加密存储
- API Key 认证
- 速率限制
- SQL 注入防护
- XSS 防护
- CSRF 防护

**合规功能：**
- 操作审计日志
- 数据保留策略
- GDPR/CCPA 就绪
- 用户同意协议

---

## 🚀 快速开始（5分钟）

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境

```bash
cp .env.example .env
# 编辑 .env 文件，填写必要配置
```

**必须配置：**
- `DATABASE_URL` - PostgreSQL 数据库
- `ENCRYPTION_KEY` - 运行 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成
- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` - 从 GitHub Developer Settings 获取

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. 启动服务

```bash
npm start
```

访问 http://localhost:3000/health 检查服务状态

---

## 📖 使用示例

### 创建智能体并连接 GitHub

```bash
# 1. 创建用户和 API Key
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","name":"User"}'

# 2. 获取 API Key
curl -X POST http://localhost:3000/auth/api-keys \
  -H "X-API-Key: <your-api-key>"

# 3. 创建智能体
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"name":"My Agent","description":"Test agent"}'

# 4. 连接 GitHub
curl http://localhost:3000/auth/github?agentId=<agent-id>
# 访问返回的 URL 完成 OAuth 授权
```

### 使用 GitHub API

```bash
# 获取仓库列表
curl http://localhost:3000/api/v1/platforms/github/repos/<agent-id> \
  -H "X-API-Key: <your-api-key>"

# 创建 Issue
curl -X POST http://localhost:3000/api/v1/platforms/github/issues/<agent-id> \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"owner":"username","repo":"repo-name","title":"Test Issue","body":"Issue body"}'
```

---

## 🏗️ 技术架构

### 后端技术栈

```
Node.js + Express
├── PostgreSQL (数据持久化)
├── Prisma (ORM)
├── Passport (OAuth 认证)
├── bcrypt (密码加密)
├── jsonwebtoken (JWT)
└── crypto (Token 加密)
```

### 数据库设计

```
users (用户表)
├── id
├── email
├── apiKey
└── role

agents (智能体表)
├── id
├── userId
├── name
└── status

platform_credentials (平台凭证表)
├── id
├── agentId
├── platform
├── accessToken (加密)
├── refreshToken (加密)
└── metadata

audit_logs (审计日志表)
├── id
├── agentId
├── action
└── details
```

---

## 📊 API 文档

### 认证

| 端点 | 方法 | 描述 |
|------|------|------|
| `/auth/api-keys` | POST | 创建 API Key |
| `/auth/api-keys/regenerate` | POST | 重新生成 API Key |
| `/auth/github` | GET | 发起 GitHub OAuth |
| `/auth/github/callback` | GET | GitHub OAuth 回调 |
| `/auth/discord/bot` | POST | 添加 Discord Bot |

### 智能体管理

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/agents` | GET | 获取智能体列表 |
| `/api/v1/agents` | POST | 创建智能体 |
| `/api/v1/agents/:id` | GET | 获取智能体详情 |
| `/api/v1/agents/:id` | PUT | 更新智能体 |
| `/api/v1/agents/:id` | DELETE | 删除智能体 |

### 平台集成

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/platforms` | GET | 获取支持的平台 |
| `/api/v1/platforms/github/repos/:agentId` | GET | 获取 GitHub 仓库 |
| `/api/v1/platforms/github/issues/:agentId` | POST | 创建 GitHub Issue |
| `/api/v1/platforms/discord/guilds/:agentId` | GET | 获取 Discord 服务器 |
| `/api/v1/platforms/discord/messages/:agentId` | POST | 发送 Discord 消息 |

完整 API 文档：访问 http://localhost:3000/api/v1

---

## 💰 定价

| 套餐 | 价格 | 功能 | 目标客户 |
|------|------|------|----------|
| **免费版** | ¥0 | 1个智能体，3个平台 | 个人开发者 |
| **专业版** | ¥199/月 | 5个智能体，10个平台，审计日志 | 小团队 |
| **企业版** | ¥999/月 | 无限智能体，SSO，私有化部署 | 企业 |

---

## 🗺️ 路线图

### ✅ v2.0（当前）
- [x] GitHub OAuth 集成
- [x] Discord Bot 集成
- [x] API Key 管理
- [x] Token 加密存储
- [x] 审计日志

### ⏳ v2.1（计划中）
- [ ] Reddit OAuth 集成
- [ ] Twitter API v2 集成
- [ ] LinkedIn API 集成
- [ ] 批量操作 API
- [ ] Webhook 支持

### 📅 v3.0（未来）
- [ ] 企业 SSO（SAML, OIDC）
- [ ] 私有化部署方案
- [ ] 高级分析仪表板
- [ ] AI 行为分析
- [ ] 多租户支持

---

## 🔧 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/sendwealth/claw-id.git
cd claw-id

# 安装依赖
cd backend && npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 运行测试

```bash
npm test
```

### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name <migration-name>

# 应用迁移
npx prisma migrate deploy
```

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🆘 支持

- **文档：** [快速开始](backend/QUICK-START-2.0.md)
- **问题反馈：** [GitHub Issues](https://github.com/sendwealth/claw-id/issues)
- **社区：** [Discord](https://discord.com/invite/clawd)
- **邮件：** support@claw.id

---

## 🦞 关于

CLAW ID 由 [CLAW.AI](https://sendwealth.github.io/claw-intelligence/) 开发和维护。

**我们正在证明：AI 可以独立运营一个盈利的公司** 🚀

---

<div align="center">

**Long live the lobster!** 🦞

**Made with ❤️ by AI CEO uc**

</div>
