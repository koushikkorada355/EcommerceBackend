const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const CART_PREFIX = 'cart:';
const CART_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { productId, quantity, price, name, image } = req.body;

    // Validation
    if (!productId || !quantity || !price) {
      return res.status(400).json({
        error: 'Missing required fields: productId, quantity, price'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const redis = getRedisClient();
    const cartKey = `${CART_PREFIX}${userId}`;

    // Get product from cart
    const cartData = await redis.hGetAll(cartKey);
    const product = cartData[productId];

    let cartItem;
    if (product) {
      // Product exists, update quantity
      cartItem = JSON.parse(product);
      cartItem.quantity += quantity;
      cartItem.totalPrice = cartItem.quantity * cartItem.price;
    } else {
      // New product
      cartItem = {
        productId,
        quantity,
        price,
        name: name || 'Product',
        image: image || '',
        totalPrice: quantity * price
      };
    }

    // Save to Redis
    await redis.hSet(cartKey, productId, JSON.stringify(cartItem));
    await redis.expire(cartKey, CART_EXPIRATION);

    logger.info('Product added to cart', {
      userId,
      productId,
      quantity
    });

    res.status(200).json({
      message: 'Product added to cart',
      cartItem
    });
  } catch (error) {
    logger.error('Error adding to cart:', { error: error.message });
    res.status(500).json({ error: 'Failed to add product to cart' });
  }
};

// Remove product from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const redis = getRedisClient();
    const cartKey = `${CART_PREFIX}${userId}`;

    // Check if product exists
    const product = await redis.hGet(cartKey, productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    // Remove product
    await redis.hDel(cartKey, productId);

    logger.info('Product removed from cart', {
      userId,
      productId
    });

    res.status(200).json({
      message: 'Product removed from cart'
    });
  } catch (error) {
    logger.error('Error removing from cart:', { error: error.message });
    res.status(500).json({ error: 'Failed to remove product from cart' });
  }
};

// Update cart quantity
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantity must be a positive number'
      });
    }

    const redis = getRedisClient();
    const cartKey = `${CART_PREFIX}${userId}`;

    // Get product
    const product = await redis.hGet(cartKey, productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    // Update quantity
    const cartItem = JSON.parse(product);
    cartItem.quantity = quantity;
    cartItem.totalPrice = quantity * cartItem.price;

    await redis.hSet(cartKey, productId, JSON.stringify(cartItem));
    await redis.expire(cartKey, CART_EXPIRATION);

    logger.info('Cart updated', {
      userId,
      productId,
      quantity
    });

    res.status(200).json({
      message: 'Cart updated',
      cartItem
    });
  } catch (error) {
    logger.error('Error updating cart:', { error: error.message });
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const redis = getRedisClient();
    const cartKey = `${CART_PREFIX}${userId}`;

    const cartData = await redis.hGetAll(cartKey);

    if (Object.keys(cartData).length === 0) {
      return res.status(200).json({
        cart: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    // Parse cart items and calculate totals
    const cart = Object.values(cartData).map(item => JSON.parse(item));
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    res.status(200).json({
      cart,
      totalItems,
      totalPrice: parseFloat(totalPrice.toFixed(2))
    });
  } catch (error) {
    logger.error('Error fetching cart:', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const redis = getRedisClient();
    const cartKey = `${CART_PREFIX}${userId}`;

    await redis.del(cartKey);

    logger.info('Cart cleared', { userId });

    res.status(200).json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing cart:', { error: error.message });
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  updateCart,
  getCart,
  clearCart
};
