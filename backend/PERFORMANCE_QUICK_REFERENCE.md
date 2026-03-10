# 性能优化快速参考

## 🚀 快速开始

### 1. 启用Redis缓存 (可选)

```bash
# 编辑 .env 文件
echo "REDIS_URL=redis://localhost:6379" >> .env

# 重启服务
pm2 restart claw-id
```

不配置Redis时,系统会自动使用内存缓存。

### 2. 运行性能测试

```bash
cd /home/rowan/clawd/products/claw-id/backend

# 完整性能测试 (100次迭代)
node scripts/performance-test.js

# 缓存功能测试
node scripts/cache-test.js
```

### 3. 查看性能日志

```bash
# 实时日志
pm2 logs claw-id

# 查看慢查询 (>100ms)
pm2 logs claw-id | grep "Slow"

# 查看缓存状态
pm2 logs claw-id | grep -i "cache"
```

## 📊 缓存使用示例

### 在代码中使用缓存

```javascript
const cache = require('./utils/cache');

// 设置缓存
await cache.set('my-key', { data: 'value' }, 300); // TTL: 5分钟

// 获取缓存
const data = await cache.get('my-key');

// 删除缓存
await cache.del('my-key');

// 清空所有缓存
await cache.flush();
```

### 缓存键命名规范

```javascript
// 用户数据
`user:${userId}`

// Agent列表
`agents:${userId}:${page}:${limit}`

// Agent详情
`agent:${agentId}`

// 平台凭证
`credentials:${agentId}:${platform}`
```

## 🔍 性能监控

### 关键指标

1. **响应时间** < 50ms (目标)
2. **慢查询** > 100ms (会记录日志)
3. **缓存命中率** 监控缓存效果
4. **内存使用** 关注内存泄漏

### 监控命令

```bash
# PM2监控面板
pm2 monit

# 查看进程状态
pm2 status claw-id

# 查看内存使用
pm2 describe claw-id | grep memory
```

## 🛠️ 故障排查

### Redis连接失败

```bash
# 检查Redis服务
redis-cli ping

# 查看Redis日志
tail -f /var/log/redis/redis-server.log

# 临时禁用Redis (使用内存缓存)
# 注释掉 .env 中的 REDIS_URL
```

### 缓存未生效

```javascript
// 检查缓存是否启用
const cache = require('./utils/cache');
console.log('Cache enabled:', cache.enabled);

// 测试缓存
await cache.set('test', 'value', 60);
const result = await cache.get('test');
console.log('Cache test:', result);
```

### 性能下降

1. 检查慢查询日志
2. 验证缓存命中率
3. 检查数据库索引
4. 监控系统资源

## 📝 维护清单

### 每日检查
- [ ] 服务运行状态 (`pm2 status`)
- [ ] 错误日志 (`pm2 logs claw-id --err`)
- [ ] 响应时间监控

### 每周检查
- [ ] 性能测试 (`node scripts/performance-test.js`)
- [ ] 慢查询分析
- [ ] 缓存效果评估

### 每月检查
- [ ] 数据库优化 (索引、查询)
- [ ] 依赖更新 (`npm outdated`)
- [ ] 性能基准对比

## 🔗 相关文档

- [性能优化完整报告](./PERFORMANCE_OPTIMIZATION.md)
- [API文档](./README.md)
- [部署指南](./DEPLOYMENT.md)

---

*最后更新: 2026-03-10*
