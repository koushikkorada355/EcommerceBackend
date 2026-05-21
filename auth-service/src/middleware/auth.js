const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication attempt without token', { ip: req.ip });
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token verification failed', { error: err.message, ip: req.ip });
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    logger.info('User authenticated', { userId: user.userId });
    next();
  });
};

module.exports = { authenticateToken };
