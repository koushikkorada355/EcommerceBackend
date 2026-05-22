const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { uploadSingleImage, uploadMultipleImages } = require('../middleware/upload');

// Product CRUD - Order matters! Specific routes first
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getByCategory);
router.get('/:id', productController.getProduct);
router.get('/', productController.getAllProducts);
router.post('/', uploadMultipleImages, uploadSingleImage, productController.createProduct);
router.put('/:id', productController.updateProduct);
router.put('/:id/images', uploadMultipleImages, uploadSingleImage, productController.updateProductImages);
router.delete('/:id', productController.deleteProduct);

// Reviews
router.post('/:productId/reviews', productController.addReview);

module.exports = router;
