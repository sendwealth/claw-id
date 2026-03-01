# 测试脚本 - GitHub OAuth 集成

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testGitHubOAuth() {
  console.log('🧪 测试 GitHub OAuth 集成\n');

  try {
    // 1. 检查服务状态
    console.log('1️⃣ 检查服务状态...');
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('✅ 服务状态:', healthData.status);
    console.log('   版本:', healthData.version);
    console.log('   GitHub:', healthData.services.github);
    console.log();

    // 2. 获取 API 信息
    console.log('2️⃣ 获取 API 信息...');
    const apiInfo = await fetch(`${BASE_URL}/api/v1`);
    const apiData = await apiInfo.json();
    console.log('✅ API 名称:', apiData.name);
    console.log('   描述:', apiData.description);
    console.log();

    // 3. 获取支持的平台
    console.log('3️⃣ 获取支持的平台...');
    const platforms = await fetch(`${BASE_URL}/api/v1/platforms`);
    const platformsData = await platforms.json();
    console.log('✅ 支持的平台:');
    platformsData.platforms.forEach(p => {
      console.log(`   - ${p.name} (${p.type}) - ${p.status}`);
    });
    console.log();

    // 4. 测试 GitHub OAuth URL 生成
    console.log('4️⃣ 测试 GitHub OAuth URL 生成...');
    const authRes = await fetch(`${BASE_URL}/auth/github?agentId=test-agent-123`);
    const authData = await authRes.json();
    console.log('✅ OAuth URL 已生成');
    console.log('   State:', authData.state);
    console.log('   URL:', authData.authUrl.substring(0, 80) + '...');
    console.log();

    console.log('✅ 所有测试通过！\n');
    console.log('📝 下一步：');
    console.log('   1. 访问上面的 OAuth URL 完成 GitHub 授权');
    console.log('   2. 测试 GitHub API 调用');
    console.log('   3. 测试 Discord Bot 集成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 请确保：');
    console.log('   1. 服务已启动 (npm start)');
    console.log('   2. 数据库已配置');
    console.log('   3. 环境变量已设置');
  }
}

// 运行测试
testGitHubOAuth();
