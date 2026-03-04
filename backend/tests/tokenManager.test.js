// Token Manager 单元测试

const tokenManager = require('../src/services/tokenManager');

describe('TokenManager', () => {
  describe('API Key Generation', () => {
    test('应该生成正确格式的 API Key', () => {
      const agentId = 'test_agent_123';
      const { apiKey, keyHash } = tokenManager.generateApiKey(agentId);

      expect(apiKey).toMatch(/^claw_[a-f0-9]{64}$/);
      expect(keyHash).toBeDefined();
      expect(keyHash).not.toBe(apiKey);  // 哈希应该与原文不同
    });

    test('每次生成的 API Key 应该不同', () => {
      const agentId = 'test_agent_123';
      const key1 = tokenManager.generateApiKey(agentId);
      const key2 = tokenManager.generateApiKey(agentId);

      expect(key1.apiKey).not.toBe(key2.apiKey);
    });
  });

  describe('Encryption', () => {
    test('应该正确加密和解密文本', () => {
      const plaintext = 'my_secret_token_12345';
      const encrypted = tokenManager.encrypt(plaintext);
      const decrypted = tokenManager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    test('加密结果应该包含 IV', () => {
      const plaintext = 'test_token';
      const encrypted = tokenManager.encrypt(plaintext);

      expect(encrypted).toContain(':');  // IV 和密文用 : 分隔
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(2);
    });

    test('每次加密的结果应该不同（随机 IV）', () => {
      const plaintext = 'test_token';
      const encrypted1 = tokenManager.encrypt(plaintext);
      const encrypted2 = tokenManager.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
