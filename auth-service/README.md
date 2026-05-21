# Auth Service Documentation

## Overview
The Auth Service handles user authentication, including registration, login, JWT token generation, and token refresh functionality.

## Setup

### Prerequisites
- Docker and Docker Compose
- MongoDB

### Installation
All dependencies are installed automatically through Docker. The service uses:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token generation and verification
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Environment Variables
Create a `.env` file in the `auth-service` directory:

```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://mongo:27017/ecommerce_auth
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## API Endpoints

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login User
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Refresh Token
**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Verify Token
**Endpoint:** `GET /api/auth/verify`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Token is valid",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "iat": 1705316400,
    "exp": 1705317300
  }
}
```

## Usage with Docker

### Build and run the service
```bash
docker-compose up --build
```

### The auth service will be available at
```
http://localhost:3001
```

### Health check
```bash
curl http://localhost:3001/health
```

## Features

✅ **User Registration** - Create new user accounts with hashed passwords  
✅ **User Login** - Authenticate users with email/password  
✅ **JWT Tokens** - Access and refresh token generation  
✅ **Password Hashing** - Secure password storage with bcrypt  
✅ **Token Verification** - Validate JWT tokens  
✅ **Protected Routes** - JWT middleware for route protection  
✅ **MongoDB Integration** - User data persistence  
✅ **CORS Support** - Cross-origin requests handling  

## Error Responses

### 400 Bad Request
```json
{
  "message": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid email or password"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Security Notes

⚠️ **Important:** Change the JWT secrets in production!  
Make sure to keep `.env` files out of version control (they're in `.gitignore`).
