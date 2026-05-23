const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Setup relationships
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Order Service running' });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
