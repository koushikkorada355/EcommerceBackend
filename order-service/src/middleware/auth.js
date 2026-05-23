const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    req.userId = userId;
    req.userRole = userRole || 'user';
    next();
  } catch (error) {
    logger.warn('Auth extraction failed:', error.message);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { verifyToken };
