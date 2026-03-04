# OAuth 测试指南

## 测试前准备

1. **确认后端运行**
```bash
cd ~/clawd/products/claw-id
./scripts/quick-start.sh status
```

2. **创建测试 Agent**
```bash
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"OAuth Test","platforms":["github"]}'
```

记录返回的：
- `id` (agent_id)
- `apiKey` (用于后续 API 调用)

---

## GitHub OAuth 测试流程

### 步骤 1: 获取授权 URL

```bash
AGENT_ID="agent_xxx"  # 替换为实际的 agent ID

curl "http://localhost:3000/auth/github?action=authorize&agentId=$AGENT_ID"
```

**预期响应**:
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?client_id=...",
  "state": "..."
}
```

### 步骤 2: 用户授权

1. 复制 `authUrl` 到浏览器
2. 登录 GitHub
3. 点击"Authorize"授权
4. 自动跳转到 callback URL

### 步骤 3: 验证 Token 保存

```bash
# 查询 agent 详情，检查是否已连接
curl "http://localhost:3000/api/v1/agents/$AGENT_ID"
```

**预期响应**:
```json
{
  "platforms": [
    {
      "platform": "github",
      "connected": true,  // ✅ 应该为 true
      "scopes": ["user:email", "repo", "read:user"]
    }
  ]
}
```

### 步骤 4: 测试 API 调用

```bash
API_KEY="claw_xxx"  # 替换为实际的 API Key

# 获取 GitHub 仓库列表
curl "http://localhost:3000/api/v1/platforms/github/repos/$AGENT_ID" \
  -H "x-api-key: $API_KEY"
```

**预期响应**:
```json
[
  {
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "private": false
  }
]
```

---

## 测试检查清单

- [ ] 后端服务运行正常
- [ ] 创建测试 Agent 成功
- [ ] 获取授权 URL 成功
- [ ] 浏览器授权成功
- [ ] Token 正确保存
- [ ] API 调用成功
- [ ] 审计日志记录

---

## 常见问题

### 1. Callback URL 不匹配
**错误**: "Redirect URI mismatch"

**解决**:
```bash
# 检查 .env 中的 GITHUB_CALLBACK_URL
cd ~/clawd/products/claw-id/backend
grep GITHUB_CALLBACK_URL .env

# 应该是:
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"
```

### 2. Token 未保存
**错误**: Agent 详情中 `connected: false`

**解决**:
```bash
# 检查后端日志
tail -50 ~/clawd/memory/claw-id-*.log | grep -i "oauth\|token"
```

### 3. API 调用失败
**错误**: "Cannot read properties of undefined"

**解决**:
```bash
# 检查平台凭证
curl "http://localhost:3000/api/v1/agents/$AGENT_ID"
# 确认 platforms[0].connected === true
```

---

## 测试脚本

创建自动化测试脚本：

```bash
#!/bin/bash
# oauth-test.sh

AGENT_ID=$1
API_KEY=$2

if [ -z "$AGENT_ID" ] || [ -z "$API_KEY" ]; then
  echo "用法: ./oauth-test.sh <agent_id> <api_key>"
  exit 1
fi

echo "🧪 测试 OAuth 流程..."

# 1. 获取授权 URL
echo "\n1️⃣ 获取授权 URL"
AUTH_URL=$(curl -s "http://localhost:3000/auth/github?action=authorize&agentId=$AGENT_ID" | jq -r '.authUrl')
echo "授权 URL: $AUTH_URL"

# 2. 等待用户授权
echo "\n2️⃣ 请在浏览器中访问上述 URL 并授权"
read -p "授权完成后按 Enter 继续..."

# 3. 验证连接
echo "\n3️⃣ 验证连接状态"
CONNECTED=$(curl -s "http://localhost:3000/api/v1/agents/$AGENT_ID" | jq -r '.platforms[0].connected')

if [ "$CONNECTED" == "true" ]; then
  echo "✅ GitHub 已连接"

  # 4. 测试 API
  echo "\n4️⃣ 测试 API 调用"
  curl -s "http://localhost:3000/api/v1/platforms/github/repos/$AGENT_ID" \
    -H "x-api-key: $API_KEY" | jq .

  echo "\n✅ 测试完成"
else
  echo "❌ GitHub 未连接，请检查授权流程"
fi
```

---

## 测试报告模板

```markdown
# OAuth 测试报告

**日期**: 2026-03-04
**测试人**: uc
**Agent ID**: agent_xxx

## 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 获取授权 URL | ✅/❌ | |
| 用户授权 | ✅/❌ | |
| Token 保存 | ✅/❌ | |
| API 调用 | ✅/❌ | |

## 问题和解决方案

1. **问题**: ...
   **解决**: ...

## 结论

OAuth 流程 [正常/异常]，CLAW ID 完成度 [98%→100%]
```

---

**创建时间**: 2026-03-03 20:05
**下次更新**: 测试完成后
