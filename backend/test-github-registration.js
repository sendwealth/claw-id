#!/usr/bin/env node
/**
 * 测试 GitHub 注册功能
 * 用法: node test-github-registration.js <email> <username>
 */

const GitHubRegistration = require('./src/services/githubRegistration');

async function test() {
  const email = process.argv[2];
  const username = process.argv[3];

  if (!email || !username) {
    console.log('❌ 请提供邮箱和用户名');
    console.log('用法: node test-github-registration.js your-email@example.com your-username');
    process.exit(1);
  }

  console.log('🧪 测试 GitHub 注册功能');
  console.log(`邮箱: ${email}`);
  console.log(`用户名: ${username}\n`);

  const agent = {
    name: `Test Agent - ${username}`,
    email,
    username,
    password: 'TestPass123!@#'
  };

  try {
    const result = await GitHubRegistration.register(agent);
    
    console.log('\n📊 注册结果:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ 注册成功！');
      console.log('📸 截图已保存到 screenshots/ 目录');
      
      if (result.needsEmailVerification) {
        console.log('⚠️  需要邮箱验证');
        console.log('请检查邮箱并运行验证流程');
      }
    } else {
      console.log('\n❌ 注册失败');
      console.log('错误:', result.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await GitHubRegistration.close();
  }
}

test();
