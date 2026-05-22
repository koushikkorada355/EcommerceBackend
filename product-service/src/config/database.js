const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully', { mongodbUri: process.env.MONGODB_URI });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

module.exports = connectDB;
