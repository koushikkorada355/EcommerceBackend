const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrder);
router.patch('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;
