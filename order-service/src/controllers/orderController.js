const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const logger = require('../utils/logger');
const { publishOrderCreated } = require('../config/kafka');

// Create order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { items, shippingAddress, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items required' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    const order = await Order.create({
      userId,
      total,
      shippingAddress,
      status: 'pending',
    });

    await OrderItem.bulkCreate(
      items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    // Fire-and-forget Kafka event
    publishOrderCreated(order, items);

    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    logger.info('Order created', { orderId: order.id, userId });
    res.status(201).json({ message: 'Order created', order: completeOrder });
  } catch (error) {
    logger.error('Create order error:', error.message);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where: { userId },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    logger.info('User orders retrieved', { userId, count: orders.length });
    res.json({
      orders,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get user orders error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    logger.info('Order retrieved', { orderId: req.params.orderId });
    res.json(order);
  } catch (error) {
    logger.error('Get order error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve order' });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const order = await Order.findByPk(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    await order.update({ status: 'cancelled' });
    
    const updatedOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    logger.info('Order cancelled', { orderId: order.id });
    res.json({ message: 'Order cancelled', order: updatedOrder });
  } catch (error) {
    logger.error('Cancel order error:', error.message);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};
