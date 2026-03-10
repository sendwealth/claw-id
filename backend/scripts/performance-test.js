const http = require('http');
const { performance } = require('perf_hooks');

class PerformanceTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = [];
  }

  async testEndpoint(path, iterations = 100) {
    const times = [];

    console.log(`  Testing ${path} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await new Promise((resolve, reject) => {
        http.get(`${this.baseUrl}${path}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const end = performance.now();
            times.push(end - start);
            resolve();
          });
        }).on('error', (error) => {
          // Don't fail on errors, just record the time
          const end = performance.now();
          times.push(end - start);
          resolve();
        });
      });

      // Show progress every 10 iterations
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`    Progress: ${i + 1}/${iterations}\r`);
      }
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const sorted = times.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(times.length * 0.95)];
    const p99 = sorted[Math.floor(times.length * 0.99)];

    return { 
      path, 
      avg: avg.toFixed(2), 
      min: min.toFixed(2), 
      max: max.toFixed(2), 
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      iterations 
    };
  }

  async runAllTests() {
    console.log('🏃 开始性能测试...\n');
    console.log(`Base URL: ${this.baseUrl}\n`);

    const endpoints = [
      '/health',
      '/api/v1',
      // Note: These require authentication, will return 401 but we can measure response time
      // '/api/auth/me',
      // '/api/v1/agents'
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint);
      this.results.push(result);
      
      console.log(`\n${endpoint}:`);
      console.log(`  平均: ${result.avg}ms`);
      console.log(`  最小: ${result.min}ms`);
      console.log(`  最大: ${result.max}ms`);
      console.log(`  P95:  ${result.p95}ms`);
      console.log(`  P99:  ${result.p99}ms`);
    }

    console.log('\n✅ 性能测试完成\n');
    
    // Summary
    console.log('📊 性能总结:');
    console.log('━'.repeat(60));
    
    for (const result of this.results) {
      console.log(`${result.path}`);
      console.log(`  响应时间: ${result.avg}ms (平均), ${result.p95}ms (P95)`);
      
      // Performance rating
      const avgTime = parseFloat(result.avg);
      if (avgTime < 50) {
        console.log(`  性能评级: ⭐⭐⭐⭐⭐ 优秀 (<50ms)`);
      } else if (avgTime < 100) {
        console.log(`  性能评级: ⭐⭐⭐⭐ 良好 (50-100ms)`);
      } else if (avgTime < 200) {
        console.log(`  性能评级: ⭐⭐⭐ 一般 (100-200ms)`);
      } else {
        console.log(`  性能评级: ⭐⭐ 需要优化 (>200ms)`);
      }
      console.log('');
    }
    
    console.log('━'.repeat(60));
    console.log('\n💡 优化建议:');
    console.log('  - Redis缓存: 减少数据库查询');
    console.log('  - 响应压缩: 减少传输数据量');
    console.log('  - 连接池: 提高数据库并发能力');
    console.log('  - 索引优化: 加速查询速度\n');
  }
}

// Run tests
const test = new PerformanceTest();
test.runAllTests().catch(error => {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
});
