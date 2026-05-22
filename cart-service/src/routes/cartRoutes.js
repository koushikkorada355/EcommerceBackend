const express = require('express');
const router = express.Router();
const {
  addToCart,
  removeFromCart,
  updateCart,
  getCart,
  clearCart
} = require('../controllers/cartController');

// Note: Authentication is now handled by API Gateway
// This service trusts the x-user-id header from the gateway

// GET /api/cart - Get user's cart
router.get('/', getCart);

// POST /api/cart - Add product to cart
router.post('/', addToCart);

// PUT /api/cart/:productId - Update product quantity in cart
router.put('/:productId', updateCart);

// DELETE /api/cart/:productId - Remove product from cart
router.delete('/:productId', removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', clearCart);

module.exports = router;
