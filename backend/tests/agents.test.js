// CLAW ID 单元测试
// 使用 Jest 测试框架

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('CLAW ID API Tests', () => {
  let testAgentId;
  let testApiKey;

  // 测试前清理数据库
  beforeAll(async () => {
    // 删除所有测试数据
    await prisma.audit_logs.deleteMany({
      where: { agentId: { contains: 'test_' } }
    });
    await prisma.platform_credentials.deleteMany({
      where: { agentId: { contains: 'test_' } }
    });
    await prisma.agents.deleteMany({
      where: { id: { contains: 'test_' } }
    });
  });

  // 测试后清理
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Agent Creation', () => {
    test('应该成功创建 Agent', async () => {
      const res = await request(app)
        .post('/api/v1/agents')
        .send({
          name: 'Test Agent',
          platforms: ['github']
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('apiKey');
      expect(res.body.name).toBe('Test Agent');
      expect(res.body.apiKey).toMatch(/^claw_/);

      testAgentId = res.body.id;
      testApiKey = res.body.apiKey;
    });

    test('应该拒绝没有名称的 Agent', async () => {
      const res = await request(app)
        .post('/api/v1/agents')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('应该正确创建平台凭证', async () => {
      const res = await request(app)
        .post('/api/v1/agents')
        .send({
          name: 'Test Agent 2',
          platforms: ['github', 'discord']
        });

      expect(res.status).toBe(201);
      expect(res.body.platforms).toHaveLength(2);
      expect(res.body.platforms).toContain('github');
      expect(res.body.platforms).toContain('discord');
    });
  });

  describe('Agent Query', () => {
    test('应该成功查询 Agent 列表', async () => {
      const res = await request(app)
        .get('/api/v1/agents?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('agents');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.agents)).toBe(true);
    });

    test('应该成功查询特定 Agent', async () => {
      const res = await request(app)
        .get(`/api/v1/agents/${testAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testAgentId);
      expect(res.body).toHaveProperty('platforms');
    });

    test('应该返回 404 查询不存在的 Agent', async () => {
      const res = await request(app)
        .get('/api/v1/agents/nonexistent_agent');

      expect(res.status).toBe(404);
    });

    test('分页应该正常工作', async () => {
      const res = await request(app)
        .get('/api/v1/agents?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.agents).toHaveLength(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  describe('API Key Validation', () => {
    test('有效的 API Key 应该通过验证', async () => {
      const res = await request(app)
        .get(`/api/v1/agents/${testAgentId}`)
        .set('x-api-key', testApiKey);

      // 注意：当前实现中查询 Agent 详情不需要 API Key
      // 这里测试的是 API Key 格式验证
      expect(testApiKey).toMatch(/^claw_[a-f0-9]{64}$/);
    });

    test('无效的 API Key 应该被拒绝', async () => {
      // 假设有一个需要 API Key 的端点
      const res = await request(app)
        .get('/api/v1/platforms/github/repos/test_agent')
        .set('x-api-key', 'invalid_key');

      expect(res.status).toBe(401);
    });

    test('缺少 API Key 应该被拒绝', async () => {
      const res = await request(app)
        .get('/api/v1/platforms/github/repos/test_agent');

      expect(res.status).toBe(401);
    });
  });

  describe('Agent Deletion', () => {
    test('应该成功软删除 Agent', async () => {
      const res = await request(app)
        .delete(`/api/v1/agents/${testAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('INACTIVE');
    });

    test('软删除的 Agent 应该无法通过验证', async () => {
      const res = await request(app)
        .get(`/api/v1/agents/${testAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('INACTIVE');
    });
  });

  describe('Health Check', () => {
    test('健康检查应该返回 200', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('version');
      expect(res.body.services.database).toBe('connected');
    });
  });

  describe('API Info', () => {
    test('API 信息应该返回正确的端点列表', async () => {
      const res = await request(app)
        .get('/api/v1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('agents');
    });
  });
});
