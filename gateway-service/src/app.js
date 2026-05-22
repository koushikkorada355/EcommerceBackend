const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { authenticateToken } = require('./middleware/jwtAuth');

dotenv.config();

const app = express();

// LOCALHOST ADDRESSES FOR LOCAL DEVELOPMENT
const AUTH_URL = 'http://localhost:3001';
const PRODUCT_URL = 'http://localhost:3003';
const CART_URL = 'http://localhost:3002';
const ORDER_URL = 'http://localhost:3004';
const SEARCH_URL = 'http://localhost:3005';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ONE AUTHENTICATION METHOD - ALL ROUTES
app.use(authenticateToken);

// ===== HELPER FUNCTION TO FORWARD REQUESTS =====

async function forwardRequest(req, res, serviceUrl) {
  try {
    const url = `${serviceUrl}${req.path}`;
    
    // Request config
    const config = {
      method: req.method,
      url: url,
      headers: {
        ...req.headers,
        'x-user-id': req.userId || null,  // Add user ID if authenticated
        host: undefined  // Remove host to avoid conflicts
      },
      data: req.body,
      validateStatus: () => true  // Accept all status codes
    };

    logger.info(`Forward ${req.method} ${req.path} to ${serviceUrl}`);

    // Make request to microservice
    const response = await axios(config);

    // Send response back
    res.status(response.status);
    
    // Forward headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.send(response.data);

  } catch (error) {
    logger.error('Forward request error', { error: error.message });
    res.status(503).json({ 
      message: 'Service unavailable',
      error: error.message 
    });
  }
}

app.all('/api/auth*', (req, res) => forwardRequest(req, res, AUTH_URL));

app.all('/api/products*', (req, res) => forwardRequest(req, res, PRODUCT_URL));
app.all('/api/cart*', (req, res) => forwardRequest(req, res, CART_URL));
app.all('/api/orders*', (req, res) => forwardRequest(req, res, ORDER_URL));

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

