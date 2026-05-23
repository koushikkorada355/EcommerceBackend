const app = require('./src/app');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const { connectKafka } = require('./src/config/kafka');
require('dotenv').config();

const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Connect to Kafka
    await connectKafka();

    const server = app.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
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
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();