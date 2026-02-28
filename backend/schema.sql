# CLAW ID 数据库设计

**版本:** v1.0
**创建时间:** 2026-02-28
**数据库:** PostgreSQL

---

## 📊 数据表设计

### 1. agents（智能体表）

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_status ON agents(status);
```

**字段说明:**
- `id`: 唯一标识符
- `name`: 智能体名称
- `email`: 智能体邮箱
- `phone`: 绑定手机号（可选）
- `avatar_url`: 头像 URL
- `status`: 状态（active/paused/deleted）
- `metadata`: 扩展信息（JSON）

---

### 2. platform_credentials（平台认证表）

```sql
CREATE TABLE platform_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  username VARCHAR(255),
  email VARCHAR(255),
  password_hash TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  cookie_data TEXT,
  session_data TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, platform)
);

CREATE INDEX idx_platform_credentials_agent ON platform_credentials(agent_id);
CREATE INDEX idx_platform_credentials_platform ON platform_credentials(platform);
CREATE INDEX idx_platform_credentials_status ON platform_credentials(status);
```

**字段说明:**
- `platform`: 平台名称（github, reddit, discord 等）
- `username`: 平台用户名
- `access_token`: 访问令牌
- `refresh_token`: 刷新令牌
- `cookie_data`: Cookie 数据（加密）
- `session_data`: Session 数据（加密）

---

### 3. audit_logs（审计日志表）

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  platform VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  endpoint TEXT,
  params JSONB DEFAULT '{}',
  result VARCHAR(50) CHECK (result IN ('success', 'failed', 'pending')),
  error_message TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_agent ON audit_logs(agent_id);
CREATE INDEX idx_audit_logs_platform ON audit_logs(platform);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_result ON audit_logs(result);
```

**字段说明:**
- `action`: 操作类型（login, post, comment, etc.）
- `result`: 执行结果
- `duration_ms`: 执行时长（毫秒）

---

### 4. platform_configs（平台配置表）

```sql
CREATE TABLE platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  registration_url TEXT,
  api_base_url TEXT,
  oauth_config JSONB,
  rate_limits JSONB DEFAULT '{}',
  required_fields JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 初始化平台配置
INSERT INTO platform_configs (platform, display_name, registration_url) VALUES
('github', 'GitHub', 'https://github.com/signup'),
('reddit', 'Reddit', 'https://www.reddit.com/register/'),
('discord', 'Discord', 'https://discord.com/register'),
('twitter', 'Twitter/X', 'https://twitter.com/i/flow/signup');
```

---

### 5. subscriptions（订阅表）

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- 外部用户 ID
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'pro', 'enterprise')),
  agent_limit INTEGER DEFAULT 1,
  platform_limit INTEGER DEFAULT 3,
  current_agents INTEGER DEFAULT 0,
  current_platforms INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## 🔐 安全视图

### 1. 敏感信息脱敏视图

```sql
CREATE VIEW agents_safe AS
SELECT
  id,
  name,
  email,
  CASE
    WHEN phone IS NOT NULL THEN '***' || RIGHT(phone, 4)
    ELSE NULL
  END as phone_masked,
  avatar_url,
  status,
  created_at
FROM agents;
```

---

## 📈 统计视图

### 1. 智能体活跃度统计

```sql
CREATE VIEW agent_stats AS
SELECT
  a.id,
  a.name,
  a.status,
  COUNT(DISTINCT pc.platform) as platform_count,
  COUNT(al.id) as total_actions,
  COUNT(al.id) FILTER (WHERE al.created_at > NOW() - INTERVAL '24 hours') as actions_24h,
  MAX(al.created_at) as last_action_at
FROM agents a
LEFT JOIN platform_credentials pc ON a.id = pc.agent_id
LEFT JOIN audit_logs al ON a.id = al.agent_id
GROUP BY a.id, a.name, a.status;
```

---

## 🔄 触发器

### 1. 自动更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON platform_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 审计日志自动记录

```sql
CREATE OR REPLACE FUNCTION log_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (agent_id, platform, action, result)
  VALUES (
    NEW.agent_id,
    NEW.platform,
    'credential_update',
    'success'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_credential_changes AFTER INSERT OR UPDATE ON platform_credentials
  FOR EACH ROW EXECUTE FUNCTION log_action();
```

---

## 🧹 清理任务

### 1. 清理过期 Token

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE platform_credentials
  SET status = 'expired'
  WHERE token_expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 定时执行（需要 pg_cron 扩展）
-- SELECT cron.schedule('cleanup-tokens', '0 * * * *', 'SELECT cleanup_expired_tokens()');
```

---

## 📊 初始化脚本

```sql
-- 创建数据库
CREATE DATABASE claw_id;

-- 连接数据库
\c claw_id

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 执行所有 CREATE TABLE 语句
-- ...

-- 插入初始数据
INSERT INTO platform_configs (platform, display_name, registration_url, api_base_url) VALUES
('github', 'GitHub', 'https://github.com/signup', 'https://api.github.com'),
('reddit', 'Reddit', 'https://www.reddit.com/register/', 'https://oauth.reddit.com'),
('discord', 'Discord', 'https://discord.com/register', 'https://discord.com/api/v10');
```

---

## 🔧 索引优化

```sql
-- 复合索引（常用查询）
CREATE INDEX idx_audit_logs_agent_platform_time ON audit_logs(agent_id, platform, created_at DESC);

-- 部分索引（只索引活跃记录）
CREATE INDEX idx_active_credentials ON platform_credentials(agent_id, platform)
WHERE status = 'active';
```

---

**数据库设计完成！** ✅

下一步：实现后端 API

---

*创建时间: 2026-02-28*
*维护者: AI CEO uc*
