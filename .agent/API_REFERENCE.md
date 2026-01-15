# ScaleOn Commerce Engine - API Reference

## Base URL
```
Development: http://localhost:5001/api
Production: https://your-domain.com/api
```

## Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login user |
| POST | `/logout` | Yes | Logout user |
| GET | `/me` | Yes | Get current user |
| POST | `/refresh` | No | Refresh access token |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password with token |
| PUT | `/profile` | Yes | Update user profile |
| POST | `/change-password` | Yes | Change password |
| POST | `/addresses` | Yes | Add address |
| DELETE | `/addresses/:id` | Yes | Delete address |

### Request/Response Examples

**POST /auth/login**
```json
// Request
{ "email": "user@example.com", "password": "Password123!" }

// Response
{
    "success": true,
    "data": {
        "user": { "email": "...", "profile": {...} },
        "accessToken": "jwt...",
        "refreshToken": "jwt..."
    }
}
```

---

## Product Routes (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List products with filters |
| GET | `/featured` | No | Get featured products |
| GET | `/search` | No | Search products |
| GET | `/slug/:slug` | No | Get product by slug |
| GET | `/:id` | No | Get product by ID |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Soft delete product |

### Query Parameters for GET /products

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |
| `category` | string | Category slug filter |
| `status` | string | Product status filter |
| `minPrice` | number | Minimum price (paise) |
| `maxPrice` | number | Maximum price (paise) |
| `sort` | string | Sort field (-price, name, etc.) |
| `search` | string | Search in name/description |

---

## Category Routes (`/api/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List root categories |
| GET | `/tree` | No | Get category tree |
| GET | `/slug/:slug` | No | Get by slug |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

---

## Cart Routes (`/api/cart`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes* | Get cart with totals |
| GET | `/summary` | Yes* | Get cart summary |
| POST | `/add` | Yes* | Add item to cart |
| PUT | `/items/:itemId` | Yes* | Update item quantity |
| DELETE | `/items/:itemId` | Yes* | Remove item |
| DELETE | `/` | Yes* | Clear cart |
| POST | `/discount` | Yes* | Apply discount code |
| DELETE | `/discount` | Yes* | Remove discount |
| POST | `/validate` | Yes* | Validate cart for checkout |

*Also works with session ID for guest carts

### Cart Response Structure
```json
{
    "success": true,
    "data": {
        "cart": {
            "items": [
                {
                    "_id": "...",
                    "product": {...},
                    "quantity": 2,
                    "priceAtAdd": 99900
                }
            ]
        },
        "itemCount": 2,
        "subtotal": 199800,
        "discountAmount": 0,
        "shippingCost": 5000,
        "taxAmount": 0,
        "total": 204800
    }
}
```

---

## Order Routes (`/api/orders`)

### Customer Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's orders |
| GET | `/:id` | Yes | Get order by ID |
| GET | `/order/:orderId` | Yes | Get by order ID string |
| POST | `/:id/cancel` | Yes | Cancel order |

### Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/all` | Admin | Get all orders |
| GET | `/admin/stats` | Admin | Get order statistics |
| PUT | `/:id/status` | Admin | Update order status |
| PUT | `/:id/tracking` | Admin | Add tracking info |
| POST | `/:id/notes` | Admin | Add admin note |
| POST | `/:id/deliver` | Admin | Mark as delivered |
| POST | `/:id/refund` | Admin | Process refund |

### Order Status Values
```javascript
ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
}
```

---

## Payment Routes (`/api/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/methods` | No | Get available payment methods |
| POST | `/checkout` | Yes | Initiate checkout |
| POST | `/:paymentId/verify` | Yes | Verify payment |
| GET | `/:paymentId/status` | Yes | Get payment status |
| POST | `/webhook/razorpay` | No | Razorpay webhook |
| POST | `/webhook/stripe` | No | Stripe webhook |

### POST /payments/checkout
```json
// Request
{
    "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400001",
        "phone": "+91 9876543210"
    },
    "paymentMethod": "cod",
    "shippingMethod": "standard"
}

// Response (COD)
{
    "success": true,
    "data": {
        "order": {...}
    }
}

// Response (Online Payment)
{
    "success": true,
    "data": {
        "paymentId": "...",
        "gatewayOrderId": "...",
        "amount": 204800
    }
}
```

---

## Config Routes (`/api/config`)

### Public Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public` | No | Get public config |
| GET | `/branding` | No | Get branding settings |
| GET | `/features` | No | Get feature flags |

### Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin` | Admin | Get full config |
| GET | `/admin/features` | Admin | Get detailed features |
| PUT | `/admin/features/:name` | Admin | Toggle feature |
| POST | `/admin/batch` | Admin | Update multiple configs |

---

## Admin Routes (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Admin | Dashboard stats |
| GET | `/analytics` | Admin | Analytics data |
| GET | `/customers` | Admin | List customers |
| GET | `/customers/:id` | Admin | Customer details |
| PUT | `/customers/:id/status` | Admin | Block/unblock customer |
| GET | `/users` | SuperAdmin | List admin users |
| POST | `/users` | SuperAdmin | Create admin user |
| GET | `/audit-logs` | Admin | Get audit logs |

### Dashboard Response
```json
{
    "success": true,
    "data": {
        "orders": {
            "totalOrders": 150,
            "totalRevenue": 15000000,
            "statusCounts": {...}
        },
        "products": {
            "total": 50,
            "active": 45,
            "draft": 5
        },
        "recentOrders": [...],
        "lowStockProducts": [...]
    }
}
```

---

## Error Responses

All errors follow this format:
```json
{
    "success": false,
    "error": {
        "message": "Error description",
        "statusCode": 400
    }
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Login required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 422 | Validation Error |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |
