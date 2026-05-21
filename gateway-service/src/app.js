const express = require('express');

const app = express();

// Middleware
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.json({
    message: 'Gateway Service is running',
    service: 'API Gateway',
    status: 'OK'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

module.exports = app;
