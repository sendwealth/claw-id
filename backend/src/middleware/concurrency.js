/**
 * 简单的并发锁（用于防止并发冲突）
 */
class ConcurrencyLock {
  constructor() {
    this.locks = new Map();
  }

  async acquire(key, timeout = 5000) {
    const start = Date.now();
    
    while (this.locks.has(key)) {
      if (Date.now() - start > timeout) {
        throw new Error('操作超时，请稍后重试');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.locks.set(key, true);
  }

  release(key) {
    this.locks.delete(key);
  }
}

const lock = new ConcurrencyLock();

/**
 * 并发控制中间件
 */
function preventConcurrency(resourceType) {
  return async (req, res, next) => {
    const resourceId = req.params.id || req.userId;
    const lockKey = `${resourceType}:${resourceId}`;
    
    try {
      await lock.acquire(lockKey);
      res.on('finish', () => lock.release(lockKey));
      next();
    } catch (error) {
      res.status(409).json({
        error: 'CONCURRENT_OPERATION',
        message: error.message
      });
    }
  };
}

module.exports = {
  preventConcurrency,
  ConcurrencyLock
};
