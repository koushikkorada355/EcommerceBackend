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

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      logger.warn('Profile fetch attempted without userId');
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Profile retrieved', { userId });
    res.json({ user: user.toJSON() });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    const { firstName, lastName, phone, dateOfBirth, gender, bio, profilePicture } = req.body;

    if (!userId) {
      logger.warn('Profile update attempted without userId');
      return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        bio: bio || undefined,
        profilePicture: profilePicture || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      logger.warn('Profile not found for update', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Profile updated', { userId });
    res.json({ message: 'Profile updated successfully', user: updatedUser.toJSON() });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add address
exports.addAddress = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    const { label, street, city, state, postalCode, country } = req.body;

    if (!userId) {
      logger.warn('Add address attempted without userId');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!label || !street || !city || !state || !postalCode || !country) {
      logger.warn('Add address with missing fields', { userId });
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for address addition', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    user.addresses.push({ label, street, city, state, postalCode, country });
    await user.save();

    logger.info('Address added', { userId, label });
    res.status(201).json({ message: 'Address added successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Add address error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { label, street, city, state, postalCode, country, isDefault } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for address update', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      logger.warn('Address not found', { userId, addressId });
      return res.status(404).json({ message: 'Address not found' });
    }

    Object.assign(address, { label, street, city, state, postalCode, country, isDefault });
    await user.save();

    logger.info('Address updated', { userId, addressId });
    res.json({ message: 'Address updated successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Update address error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for address deletion', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    user.addresses.id(addressId).deleteOne();
    await user.save();

    logger.info('Address deleted', { userId, addressId });
    res.json({ message: 'Address deleted successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Delete address error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for address retrieval', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Addresses retrieved', { userId, count: user.addresses.length });
    res.json({ addresses: user.addresses });
  } catch (error) {
    logger.error('Get addresses error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      logger.warn('Add to wishlist without productId', { userId });
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for wishlist action', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    const exists = user.wishlist.some((item) => item.productId.toString() === productId);
    if (exists) {
      logger.warn('Product already in wishlist', { userId, productId });
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push({ productId });
    await user.save();

    logger.info('Product added to wishlist', { userId, productId });
    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    logger.error('Add to wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for wishlist removal', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    user.wishlist = user.wishlist.filter((item) => item.productId.toString() !== productId);
    await user.save();

    logger.info('Product removed from wishlist', { userId, productId });
    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    logger.error('Remove from wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Profile not found for wishlist retrieval', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Wishlist retrieved', { userId, count: user.wishlist.length });
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    logger.error('Get wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
