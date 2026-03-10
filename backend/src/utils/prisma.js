const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 慢查询监控中间件
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  if (duration > 100) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
      args: JSON.stringify(params.args).substring(0, 200)
    });
  }

  return result;
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
