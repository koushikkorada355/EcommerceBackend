const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Simple JWT Authentication - ONE METHOD FOR ALL ROUTES
 * Public routes: login, register, products (GET only)
 * Protected routes: cart, orders, profile updates
 */
const authenticateToken = (req, res, next) => {
  // PUBLIC ROUTES - NO TOKEN NEEDED
  const publicRoutes = [
    'POST /api/auth/register',
    'POST /api/auth/login',
    'POST /api/auth/refresh-token',
    'GET /api/products',
    'GET /api/search'
  ];

  // Check if route is public
  const routeKey = `${req.method} ${req.path}`;
  const isPublicRoute = publicRoutes.some(route => {
    const [method, path] = route.split(' ');
    return req.method === method && req.path.includes(path);
  });

  // If public route, skip authentication
  if (isPublicRoute) {
    return next();
  }

  // PROTECTED ROUTES - TOKEN REQUIRED
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get "Bearer token"

  if (!token) {
    logger.warn('No token provided', { path: req.path, method: req.method });
    return res.status(401).json({ message: 'Token required', error: 'no_token' });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      logger.warn('Invalid token', { error: err.message });
      return res.status(403).json({ message: 'Invalid token', error: 'invalid_token' });
    }

    // Attach user data to request
    req.user = user;
    req.userId = user.userId || user.id;
    
    logger.info('User authenticated', { userId: req.userId });
    next();
  });
};

module.exports = { authenticateToken };

