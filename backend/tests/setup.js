// Jest 测试环境设置

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.ENCRYPTION_KEY = '29964c6a58709a3960174c61b0fe9deab5d49b05c9b2abea7ba548db9d31b39b';
process.env.PORT = '3001';  // 使用不同端口避免冲突

// 全局超时设置
jest.setTimeout(10000);

// 全局清理
afterAll(async () => {
  // 给数据库连接一些时间关闭
  await new Promise(resolve => setTimeout(resolve, 500));
});
