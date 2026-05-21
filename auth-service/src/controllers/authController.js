const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT tokens
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );

  return { accessToken, refreshToken };
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      logger.warn('Registration attempt with missing fields', { email });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({ email, password, firstName, lastName });
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);

    logger.info('User registered successfully', { userId: user._id, email });
    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Register error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', { email });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt with disabled account', { email });
      return res.status(403).json({ message: 'User account is disabled' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with wrong password', { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);

    logger.info('User logged in successfully', { userId: user._id, email });
    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Token refresh attempt without refresh token');
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Token refresh attempt with invalid token', { error: err.message });
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        decoded.userId,
        decoded.email
      );

      logger.info('Token refreshed successfully', { userId: decoded.userId });
      res.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    logger.error('Refresh token error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Token verification attempt without token');
      return res.status(400).json({ message: 'Token is required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed', { error: err.message });
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      logger.info('Token verified successfully', { userId: decoded.userId });
      res.json({
        message: 'Token is valid',
        user: decoded,
      });
    });
  } catch (error) {
    logger.error('Verify token error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
