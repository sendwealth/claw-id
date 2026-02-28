# CLAW ID API - 快速开始

## 安装

```bash
cd backend
npm install
```

## 配置

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

## 启动

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 测试

```bash
# 健康检查
curl http://localhost:3000/health

# API 信息
curl http://localhost:3000/api/v1

# 创建智能体
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Bot","platforms":["github"]}'

# 获取智能体列表
curl http://localhost:3000/api/v1/agents

# 获取平台列表
curl http://localhost:3000/api/v1/platforms
```

## 当前状态

✅ 基础 API 框架已完成
⏳ 数据库集成进行中
⏳ 认证系统开发中
⏳ 平台注册功能开发中

## 下一步

1. 连接 PostgreSQL 数据库
2. 实现智能体持久化存储
3. 实现邮箱生成服务
4. 实现 GitHub 自动注册

---

*更新时间: 2026-02-28 16:25*
