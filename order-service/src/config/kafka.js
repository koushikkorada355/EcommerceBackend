const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'order-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

const connectKafka = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Kafka connection failed:', error.message);
    process.exit(1);
  }
};

const publishOrderCreated = (order, items) => {
  // Fire-and-forget - no await
  producer.send({
    topic: process.env.KAFKA_TOPIC || 'order-created',
    messages: [
      {
        value: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          total: order.total,
          status: order.status,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          createdAt: order.createdAt,
        }),
      },
    ],
  }).then(() => {
    logger.info('Order created event published:', { orderId: order.id });
  }).catch(err => {
    logger.error('Failed to publish order event:', err.message);
  });
};

module.exports = { connectKafka, publishOrderCreated, producer };
