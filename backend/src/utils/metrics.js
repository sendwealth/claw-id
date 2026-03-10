const client = require('prom-client');

// 创建Registry
const register = new client.Registry();

// 默认指标
client.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register]
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeUsers,
  dbQueryDuration
};
