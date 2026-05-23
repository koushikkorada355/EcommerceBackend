const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Create Redis client using ioredis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnection attempt #${times}`);
    return delay;
  },
  enableReadyCheck: true,
  enableOfflineQueue: true
});

redis.on('error', (err) => {
  logger.error('Redis client error', { error: err.message });
});

redis.on('connect', () => {
  logger.info('Redis connected for rate limiting');
});

redis.on('ready', () => {
  logger.info('Redis ready for rate limiting');
});

// Custom store for express-rate-limit using ioredis
class IORedisStore {
  constructor(options = {}) {
    this.client = options.client || redis;
    this.prefix = options.prefix || 'rl:';
  }

  async incr(key) {
    const redisKey = `${this.prefix}${key}`;
    const current = await this.client.incr(redisKey);
    // Set expiration on first increment
    if (current === 1) {
      await this.client.expire(redisKey, Math.ceil(this.windowMs / 1000));
    }
    return current;
  }

  async decrement(key) {
    const redisKey = `${this.prefix}${key}`;
    await this.client.decr(redisKey);
  }

  async resetKey(key) {
    const redisKey = `${this.prefix}${key}`;
    await this.client.del(redisKey);
  }

  async resetAll() {
    const pattern = `${this.prefix}*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

// Global rate limiter - applies to all routes
// 100 requests per 15 minutes per IP address
const globalLimiter = rateLimit({
  store: new IORedisStore({
    client: redis,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Strict rate limiter for auth endpoints
// 5 requests per 15 minutes per IP address
const authLimiter = rateLimit({
  store: new IORedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  redis
};
