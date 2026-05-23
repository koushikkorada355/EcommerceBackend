const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { authenticateToken } = require('./middleware/jwtAuth');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();

// Service URLs
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
const PRODUCT_URL = process.env.PRODUCT_URL || 'http://localhost:3003';
const CART_URL = process.env.CART_URL || 'http://localhost:3002';
const ORDER_URL = process.env.ORDER_URL || 'http://localhost:3004';
const SEARCH_URL = process.env.SEARCH_URL || 'http://localhost:3005';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use(authenticateToken);

// Proxy options
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.path} to ${target}`);
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.userId || req.user.id);
    }
  },
  onError: (err, req, res) => {
    logger.error('Proxy error', { error: err.message });
    res.status(503).json({ message: 'Service unavailable' });
  },
});

// Proxy middleware for each service
app.use('/api/auth', authLimiter, createProxyMiddleware(proxyOptions(AUTH_URL)));
app.use('/api/products', createProxyMiddleware(proxyOptions(PRODUCT_URL)));
app.use('/api/cart', createProxyMiddleware(proxyOptions(CART_URL)));
app.use('/api/orders', createProxyMiddleware(proxyOptions(ORDER_URL)));
app.use('/api/search', createProxyMiddleware(proxyOptions(SEARCH_URL)));

// 404 - Not found
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error', { error: err.message });
  res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports = app;

