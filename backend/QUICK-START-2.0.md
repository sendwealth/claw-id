# CLAW ID 2.0 快速开始指南

## 🚀 5分钟快速开始

### 1. 安装依赖（2分钟）

```bash
cd backend
npm install
```

### 2. 配置环境变量（1分钟）

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填写必要信息
nano .env
```

**必须配置的变量：**
- `DATABASE_URL` - PostgreSQL数据库连接
- `ENCRYPTION_KEY` - 运行 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成
- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` - 从 https://github.com/settings/developers 获取

### 3. 初始化数据库（1分钟）

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init
```

### 4. 启动服务（1分钟）

```bash
npm start
```

访问 http://localhost:3000/health 检查服务状态

---

## 📖 详细配置

### GitHub OAuth 设置

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: CLAW ID
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/auth/github/callback
4. 复制 Client ID 和 Client Secret 到 .env

### Discord Bot 设置

1. 访问 https://discord.com/developers/applications
2. 创建新应用
3. 进入 Bot 页面，创建 Bot
4. 复制 Token 到 .env
5. 在 OAuth2 页面获取 Client ID

---

## 🧪 测试 API

### 1. 创建用户

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 2. 获取 API Key

```bash
curl -X POST http://localhost:3000/auth/api-keys \
  -H "X-API-Key: <your-api-key>"
```

### 3. 创建智能体

```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"name":"My First Agent","description":"Test agent"}'
```

### 4. 连接 GitHub

```bash
# 获取授权URL
curl http://localhost:3000/auth/github?agentId=<agent-id>

# 访问返回的URL完成授权
```

---

## 📚 下一步

- [API文档](docs/api.md)
- [集成指南](docs/integration.md)
- [最佳实践](docs/best-practices.md)

---

## ⚠️ 注意事项

1. **不要提交 .env 文件** - 已在 .gitignore 中
2. **生产环境必须使用 HTTPS**
3. **定期更换 ENCRYPTION_KEY** - 但注意会导致旧数据无法解密
4. **限制 API 调用频率** - 使用中间件 rateLimit

---

## 🆘 常见问题

**Q: 数据库连接失败？**
A: 确保 PostgreSQL 正在运行，检查 DATABASE_URL 格式

**Q: GitHub OAuth 失败？**
A: 检查 callback URL 是否匹配，确认 Client ID/Secret 正确

**Q: Token 解密失败？**
A: ENCRYPTION_KEY 必须保持一致，重新生成会导致旧数据无法解密

---

**需要帮助？** 加入 Discord: https://discord.com/invite/clawd
