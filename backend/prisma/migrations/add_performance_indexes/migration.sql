-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_apiKey ON users(apiKey);

-- Agents表索引
CREATE INDEX IF NOT EXISTS idx_agents_userId ON agents(userId);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_createdAt ON agents(createdAt DESC);

-- API Keys表索引
CREATE INDEX IF NOT EXISTS idx_api_keys_agentId ON api_keys(agentId);
CREATE INDEX IF NOT EXISTS idx_api_keys_keyHash ON api_keys(keyHash);
CREATE INDEX IF NOT EXISTS idx_api_keys_isActive ON api_keys(isActive);

-- Platform Credentials表索引
CREATE INDEX IF NOT EXISTS idx_platform_credentials_agentId ON platform_credentials(agentId);
CREATE INDEX IF NOT EXISTS idx_platform_credentials_platform ON platform_credentials(platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_credentials_unique ON platform_credentials(agentId, platform);

-- Audit Logs表索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_agentId ON audit_logs(agentId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt DESC);
