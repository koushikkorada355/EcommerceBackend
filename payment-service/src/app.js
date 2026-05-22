const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { method: req.method, path: req.path });
  next();
});

// Routes - To be implemented
// app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ status: 'Payment Service is running' });
});

// Not found handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, { method: req.method, path: req.path });
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
