# CLAW ID API 文档

**版本:** v1.0.0
**Base URL:** `https://api.claw.id/v1` (生产) | `http://localhost:3000/api/v1` (开发)

---

## 📋 概述

CLAW ID API 提供智能体身份管理服务，包括：
- 智能体创建和管理
- 多平台账号注册
- 认证信息管理
- 操作审计日志

---

## 🔐 认证

所有 API 请求需要 Bearer Token 认证：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.claw.id/v1/agents
```

---

## 📡 端点

### 1. 健康检查

**GET** `/health`

检查 API 服务状态。

**响应:**
```json
{
  "status": "ok",
  "service": "CLAW ID API",
  "version": "1.0.0",
  "timestamp": "2026-02-28T16:30:00Z"
}
```

---

### 2. API 信息

**GET** `/api/v1`

获取 API 基本信息。

**响应:**
```json
{
  "message": "CLAW ID API",
  "version": "v1",
  "endpoints": {
    "agents": "/api/v1/agents",
    "platforms": "/api/v1/platforms"
  }
}
```

---

### 3. 创建智能体

**POST** `/api/v1/agents`

创建新的数字员工。

**请求体:**
```json
{
  "name": "Marketing Bot",
  "platforms": ["github", "reddit", "discord"]
}
```

**响应 (201):**
```json
{
  "id": "agent_1709123456789_abc123",
  "name": "Marketing Bot",
  "email": "agent-abc12345@claw.id",
  "platforms": ["github", "reddit", "discord"],
  "status": "pending_verification",
  "created_at": "2026-02-28T16:30:00Z"
}
```

**字段说明:**
- `name` (必填): 智能体名称
- `platforms` (可选): 要注册的平台列表

---

### 4. 获取智能体列表

**GET** `/api/v1/agents`

获取所有智能体。

**查询参数:**
- `status`: 按状态过滤 (active, paused, deleted)
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

**响应:**
```json
{
  "agents": [
    {
      "id": "agent_abc123",
      "name": "Marketing Bot",
      "email": "agent-abc12345@claw.id",
      "platforms": ["github"],
      "status": "active",
      "created_at": "2026-02-28T16:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 5. 获取单个智能体

**GET** `/api/v1/agents/:id`

获取指定智能体详情。

**响应:**
```json
{
  "id": "agent_abc123",
  "name": "Marketing Bot",
  "email": "agent-abc12345@claw.id",
  "platforms": ["github"],
  "status": "active",
  "created_at": "2026-02-28T16:30:00Z",
  "credentials": {
    "github": {
      "username": "claw-bot-marketing",
      "status": "active"
    }
  }
}
```

---

### 6. 注册平台账号

**POST** `/api/v1/agents/:id/platforms/:platform/register`

为智能体注册指定平台账号。

**路径参数:**
- `id`: 智能体 ID
- `platform`: 平台名称 (github, reddit, discord)

**响应 (202):**
```json
{
  "agent_id": "agent_abc123",
  "platform": "github",
  "status": "registering",
  "estimated_time": "60s",
  "message": "Registration in progress"
}
```

---

### 7. 获取认证信息

**GET** `/api/v1/agents/:id/credentials/:platform`

获取智能体在指定平台的认证信息。

**响应:**
```json
{
  "agent_id": "agent_abc123",
  "platform": "github",
  "username": "claw-bot-marketing",
  "status": "active",
  "has_token": true,
  "token_expires_at": "2026-03-28T16:30:00Z"
}
```

---

### 8. 获取平台列表

**GET** `/api/v1/platforms`

获取所有支持的平台。

**响应:**
```json
{
  "platforms": [
    {
      "name": "github",
      "display_name": "GitHub",
      "status": "available",
      "icon": "https://claw.id/icons/github.png"
    },
    {
      "name": "reddit",
      "display_name": "Reddit",
      "status": "available",
      "icon": "https://claw.id/icons/reddit.png"
    },
    {
      "name": "discord",
      "display_name": "Discord",
      "status": "available",
      "icon": "https://claw.id/icons/discord.png"
    }
  ]
}
```

---

## ❌ 错误响应

所有错误遵循统一格式：

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**常见错误码:**
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `409` - 资源冲突
- `429` - 速率限制
- `500` - 服务器内部错误

---

## 📝 示例代码

### Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// 创建智能体
async function createAgent() {
  const response = await axios.post(`${API_BASE}/agents`, {
    name: 'Marketing Bot',
    platforms: ['github', 'reddit']
  });

  console.log('Created agent:', response.data);
  return response.data;
}

// 获取智能体列表
async function listAgents() {
  const response = await axios.get(`${API_BASE}/agents`);
  console.log('Agents:', response.data);
  return response.data;
}

// 执行
createAgent();
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000/api/v1'

# 创建智能体
def create_agent():
    response = requests.post(f'{API_BASE}/agents', json={
        'name': 'Marketing Bot',
        'platforms': ['github', 'reddit']
    })

    print('Created agent:', response.json())
    return response.json()

# 获取智能体列表
def list_agents():
    response = requests.get(f'{API_BASE}/agents')
    print('Agents:', response.json())
    return response.json()

# 执行
create_agent()
```

### cURL

```bash
# 创建智能体
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Marketing Bot","platforms":["github"]}'

# 获取智能体列表
curl http://localhost:3000/api/v1/agents

# 获取平台列表
curl http://localhost:3000/api/v1/platforms
```

---

## 🚀 快速开始

1. **启动 API 服务**
```bash
cd backend
npm install
npm run dev
```

2. **测试 API**
```bash
# 健康检查
curl http://localhost:3000/health

# 创建智能体
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Bot"}'
```

---

## 📊 速率限制

- **标准计划:** 100 请求/分钟
- **专业计划:** 500 请求/分钟
- **企业计划:** 无限制

超过限制会返回 `429` 错误。

---

## 🔄 版本历史

- **v1.0.0** (2026-02-28) - 初始发布
  - 智能体 CRUD
  - 平台列表
  - 基础认证

---

## 📞 支持

- **文档:** https://docs.claw.id
- **GitHub:** https://github.com/sendwealth/claw-id
- **邮箱:** support@claw.id
- **Discord:** https://discord.com/invite/clawd

---

**🦞 CLAW ID - 为 AI 智能体提供数字身份**
