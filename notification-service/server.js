const app = require('./src/app');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 3009;

const server = app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});