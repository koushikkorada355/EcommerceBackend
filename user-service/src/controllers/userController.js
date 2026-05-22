const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      logger.warn('Profile fetch attempted without userId');
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Profile retrieved', { userId });
    res.json({ userProfile });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    const { phone, dateOfBirth, gender, bio, profilePicture } = req.body;

    if (!userId) {
      logger.warn('Profile update attempted without userId');
      return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        bio: bio || undefined,
        profilePicture: profilePicture || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      logger.warn('Profile not found for update', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Profile updated', { userId });
    res.json({ message: 'Profile updated successfully', userProfile: updatedProfile });
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

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for address addition', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.addresses.push({ label, street, city, state, postalCode, country });
    await userProfile.save();

    logger.info('Address added', { userId, label });
    res.status(201).json({ message: 'Address added successfully', userProfile });
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

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for address update', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    const address = userProfile.addresses.id(addressId);
    if (!address) {
      logger.warn('Address not found', { userId, addressId });
      return res.status(404).json({ message: 'Address not found' });
    }

    Object.assign(address, { label, street, city, state, postalCode, country, isDefault });
    await userProfile.save();

    logger.info('Address updated', { userId, addressId });
    res.json({ message: 'Address updated successfully', userProfile });
  } catch (error) {
    logger.error('Update address error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for address deletion', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.addresses.id(addressId).deleteOne();
    await userProfile.save();

    logger.info('Address deleted', { userId, addressId });
    res.json({ message: 'Address deleted successfully', userProfile });
  } catch (error) {
    logger.error('Delete address error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for address retrieval', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Addresses retrieved', { userId, count: userProfile.addresses.length });
    res.json({ addresses: userProfile.addresses });
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

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for wishlist action', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    const exists = userProfile.wishlist.some((item) => item.productId.toString() === productId);
    if (exists) {
      logger.warn('Product already in wishlist', { userId, productId });
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    userProfile.wishlist.push({ productId });
    await userProfile.save();

    logger.info('Product added to wishlist', { userId, productId });
    res.json({ message: 'Added to wishlist', wishlist: userProfile.wishlist });
  } catch (error) {
    logger.error('Add to wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for wishlist removal', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.wishlist = userProfile.wishlist.filter((item) => item.productId.toString() !== productId);
    await userProfile.save();

    logger.info('Product removed from wishlist', { userId, productId });
    res.json({ message: 'Removed from wishlist', wishlist: userProfile.wishlist });
  } catch (error) {
    logger.error('Remove from wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      logger.warn('Profile not found for wishlist retrieval', { userId });
      return res.status(404).json({ message: 'User profile not found' });
    }

    logger.info('Wishlist retrieved', { userId, count: userProfile.wishlist.length });
    res.json({ wishlist: userProfile.wishlist });
  } catch (error) {
    logger.error('Get wishlist error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create user profile (called after registration)
exports.createProfile = async (req, res) => {
  try {
    const { userId, email, firstName, lastName } = req.body;

    if (!userId || !email || !firstName || !lastName) {
      logger.warn('Create profile with missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingProfile = await UserProfile.findOne({ userId });
    if (existingProfile) {
      logger.warn('Profile already exists', { userId });
      return res.status(409).json({ message: 'Profile already exists' });
    }

    const newProfile = new UserProfile({ userId, email, firstName, lastName });
    await newProfile.save();

    logger.info('User profile created', { userId });
    res.status(201).json({ message: 'Profile created successfully', userProfile: newProfile });
  } catch (error) {
    logger.error('Create profile error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
