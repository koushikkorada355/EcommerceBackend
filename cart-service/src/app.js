const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cartRoutes = require('./routes/cartRoutes');
const logger = require('./utils/logger');
const { initRedis } = require('./config/redis');

dotenv.config();

const app = express();

// Initialize Redis
initRedis();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { method: req.method, path: req.path });
  next();
});

// Routes
app.use('/api/cart', cartRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Cart Service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
