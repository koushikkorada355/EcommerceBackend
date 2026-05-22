const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Note: JWT authentication is now handled by API Gateway
// This service trusts the x-user-id header from the gateway for protected operations

// Auth routes - Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify', authController.verifyToken);

// Profile routes - Gateway will handle authentication
router.get('/profile/:userId', authController.getProfile);
router.put('/profile/:userId', authController.updateProfile);

// Address routes - Gateway will handle authentication
router.get('/:userId/addresses', authController.getAddresses);
router.post('/:userId/addresses', authController.addAddress);
router.put('/:userId/addresses/:addressId', authController.updateAddress);
router.delete('/:userId/addresses/:addressId', authController.deleteAddress);

// Wishlist routes - Gateway will handle authentication
router.get('/:userId/wishlist', authController.getWishlist);
router.post('/:userId/wishlist', authController.addToWishlist);
router.delete('/:userId/wishlist/:productId', authController.removeFromWishlist);

module.exports = router;
