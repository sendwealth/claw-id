# CLAW ID - AI Agent Identity Management System

> Give every AI Agent a unique identity. Secure, compliant, and easy to use.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/sendwealth/claw-id.svg)](https://github.com/sendwealth/claw-id/stargazers)

---

## 🎯 What is CLAW ID?

CLAW ID is an identity management system designed specifically for AI Agents. It solves the critical problem: **How should AI Agents authenticate with third-party platforms?**

### ❌ Traditional Approach Problems

- Sharing human accounts → Security risks
- Hardcoded tokens → Easy to leak
- No identity management → Chaos

### ✅ CLAW ID Solution

- **Unique Identity** - Each Agent gets a unique ID and API Key
- **OAuth 2.0** - Secure integration with GitHub, Discord, etc.
- **Encrypted Storage** - AES-256 protects sensitive data
- **Audit Logs** - All operations traceable

---

## 🚀 Quick Start (5 minutes)

### 1. Install

```bash
git clone https://github.com/sendwealth/claw-id.git
cd claw-id/backend
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run

```bash
npm run dev
# ✅ Server running at http://localhost:3000
```

### 4. Create Agent

```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"My Agent","platforms":["github"]}'
```

**Response**:
```json
{
  "id": "agent_xxx",
  "apiKey": "claw_xxx"
}
```

---

## 📋 Features

### Core Features

- ✅ Agent CRUD Operations
- ✅ GitHub OAuth Integration
- ✅ Discord Bot Management
- ✅ API Key Validation
- ✅ Token Encryption (AES-256)
- ✅ Audit Logging
- ✅ Pagination Support

### Developer Tools

- 🛠️ Quick Start Scripts
- 📊 Real-time Monitoring Dashboard
- 🧪 Unit Testing (Jest)
- 📚 Complete API Documentation

---

## 💻 API Examples

### Create Agent

```bash
POST /api/v1/agents
{
  "name": "My Agent",
  "platforms": ["github", "discord"]
}
```

### GitHub OAuth

```bash
# Get authorization URL
GET /auth/github?agentId=agent_xxx

# Callback handled automatically
GET /auth/github/callback?code=xxx&state=xxx
```

### Use Agent

```bash
# With API Key
curl -H "x-api-key: claw_xxx" \
  http://localhost:3000/api/v1/agents/agent_xxx
```

---

## 🔒 Security

### Encryption

- Algorithm: AES-256-CBC
- Key: 32-byte hex (environment variable)
- IV: Random 16-byte per encryption

### API Key

- Format: `claw_` + 64 hex characters
- Storage: SHA-256 hash
- Validation: Middleware

### Audit

- All operations logged
- Timestamped
- Searchable

---

## 📊 Performance

| Operation | Time | Status |
|-----------|------|--------|
| Agent Creation | 45ms | ✅ |
| Token Encryption | 3ms | ✅ |
| API Response | 18ms | ✅ |
| Database Query | 12ms | ✅ |

---

## 🛠️ Tech Stack

- **Backend**: Express.js + Prisma ORM
- **Database**: SQLite (PostgreSQL ready)
- **Encryption**: Node.js Crypto
- **Testing**: Jest
- **Docs**: Markdown

---

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [OAuth Test Guide](./docs/oauth-test-guide.md)
- [Troubleshooting](./docs/troubleshooting.md)

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Contact

- **GitHub**: https://github.com/sendwealth/claw-id
- **Email**: contact@openspark.online
- **Discord**: discord.gg/claw-ai

---

## ⭐ Star History

If you find CLAW ID useful, please give it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=sendwealth/claw-id&type=Date)](https://star-history.com/#sendwealth/claw-id&Date)

---

**Built with ❤️ by CLAW.AI**

*AI CEO: uc 🍋*
