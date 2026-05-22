# Cart Service

A microservice for managing shopping cart operations in an e-commerce application. Uses Redis for fast, in-memory cart storage.

## Features

- Add products to cart
- Remove products from cart
- Update product quantities
- Get complete cart
- Clear entire cart
- JWT token authentication
- Redis-based persistence
- Automatic cart expiration (7 days)

## Prerequisites

- Node.js >= 14
- Redis >= 6.0
- JWT Secret Key

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3004
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

## Running the Service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Get Cart
```
GET /api/cart
```

Response:
```json
{
  "cart": [
    {
      "productId": "123",
      "quantity": 2,
      "price": 99.99,
      "name": "Product Name",
      "image": "image-url",
      "totalPrice": 199.98
    }
  ],
  "totalItems": 2,
  "totalPrice": 199.98
}
```

### Add to Cart
```
POST /api/cart
```

Request body:
```json
{
  "productId": "123",
  "quantity": 2,
  "price": 99.99,
  "name": "Product Name",
  "image": "image-url"
}
```

### Update Cart Item
```
PUT /api/cart/:productId
```

Request body:
```json
{
  "quantity": 3
}
```

### Remove from Cart
```
DELETE /api/cart/:productId
```

### Clear Cart
```
DELETE /api/cart
```

## Data Structure

Cart items are stored in Redis as hashes:
- Key: `cart:{userId}`
- Field: `{productId}`
- Value: JSON object containing product details and quantity

## Expiration

Cart data expires after 7 days of inactivity.

## Docker

Build image:
```bash
docker build -t cart-service .
```

Run container:
```bash
docker run -p 3004:3004 --env-file .env cart-service
```

## Error Handling

- 400: Bad Request (missing/invalid parameters)
- 401: Unauthorized (missing/invalid token)
- 404: Not Found (product not in cart)
- 500: Server Error

## Logging

Logs are written to:
- `combined.log` - All logs
- `error.log` - Error logs only
- Console output in development

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "UP",
  "service": "Cart Service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
