const Redis = require('ioredis');
const logger = require('./logger');

class CacheService {
  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.enabled = true;
      logger.info('Redis cache enabled');
    } else {
      this.enabled = false;
      logger.info('Redis cache disabled, using in-memory cache');
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.enabled) return;
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  async del(key) {
    if (!this.enabled) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache del error', { key, error: error.message });
    }
  }

  async flush() {
    if (!this.enabled) return;
    
    try {
      await this.redis.flushall();
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
    }
  }
}

module.exports = new CacheService();
