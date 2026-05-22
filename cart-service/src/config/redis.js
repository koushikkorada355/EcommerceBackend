const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const initRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message, code: err.code });
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    logger.info('Redis client initialized');
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis
};
