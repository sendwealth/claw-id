// 创建系统用户
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSystemUser() {
  try {
    const user = await prisma.users.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        email: 'system@claw.id',
        name: 'System',
        passwordHash: '',  // 系统用户不需要密码
        apiKey: 'system_key',
        role: 'ADMIN',
        updatedAt: new Date()
      }
    });

    console.log('✅ System user created:', user);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSystemUser();
