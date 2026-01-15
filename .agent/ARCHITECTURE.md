# ScaleOn Commerce Engine - Architecture Guide

## Design Philosophy

This application follows **three core architectural principles** that MUST be maintained:

### 1. Configuration-Driven Architecture

All business rules, feature toggles, and operational parameters are stored centrally—NOT hardcoded.

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Flow                        │
├─────────────────────────────────────────────────────────────┤
│  defaults.json  ──►  StoreConfig DB  ──►  ConfigService     │
│     (fallback)         (overrides)        (cached access)   │
└─────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `backend/config/defaults.json` - Default values for all config
- `backend/services/configService.js` - Central config access
- `backend/models/StoreConfig.js` - Database storage for overrides
- `backend/models/FeatureFlag.js` - Feature toggle storage

**Usage Pattern:**
```javascript
// ✅ CORRECT - Use configService
const shipping = await configService.calculateShipping(subtotal);
const taxEnabled = await configService.isFeatureEnabled('tax');

// ❌ WRONG - Never hardcode
const shipping = 50; // NEVER DO THIS
```

### 2. Server-Controlled State

All state transitions (orders, payments, inventory) are controlled ONLY by backend services.

```
┌─────────────────────────────────────────────────────────────┐
│                   State Management Flow                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend  ──►  API Route  ──►  Service  ──►  Model         │
│  (request)     (validate)      (logic)      (persist)       │
│                                    │                         │
│                              AuditLog                        │
└─────────────────────────────────────────────────────────────┘
```

**Order Status Flow:**
```
pending → processing → shipped → delivered
    │         │
    └─────────┴──► cancelled (if allowed)
                       │
                       └──► refunded (if paid)
```

**Key Validations:**
- `order.canCancel` - Checks if order can be cancelled
- `order.canRefund` - Checks if refund is allowed
- `order.updateStatus()` - Validates status transitions

### 3. Thin Frontend

The React frontend is ONLY responsible for:
- Displaying data from API
- Collecting user input
- Navigation and UI state

**Frontend does NOT:**
- Calculate prices, totals, tax, or shipping
- Validate business rules
- Make direct database operations

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Data Flow                        │
├─────────────────────────────────────────────────────────────┤
│  API Response  ──►  Context  ──►  Component  ──►  Display   │
│  (all data)        (store)       (render)        (UI)       │
└─────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   React     │  │   Context   │  │   API       │          │
│  │   Pages     │◄─┤   Providers │◄─┤   Service   │          │
│  └─────────────┘  └─────────────┘  └──────┬──────┘          │
└───────────────────────────────────────────┼─────────────────┘
                                            │ HTTP
┌───────────────────────────────────────────┼─────────────────┐
│                        SERVER             ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Routes    │──┤  Middleware │──┤  Services   │          │
│  │   (API)     │  │  (Auth/Val) │  │  (Logic)    │          │
│  └─────────────┘  └─────────────┘  └──────┬──────┘          │
│                                           │                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────▼──────┐          │
│  │   Config    │  │   Models    │◄─┤  MongoDB    │          │
│  │   Service   │  │  (Mongoose) │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Backend Layer Structure

| Layer | Purpose | Location |
|-------|---------|----------|
| Routes | HTTP endpoints, request/response | `backend/routes/` |
| Middleware | Auth, validation, error handling | `backend/middleware/` |
| Services | Business logic, orchestration | `backend/services/` |
| Models | Data schema, DB operations | `backend/models/` |
| Config | Constants, defaults, settings | `backend/config/` |

### Frontend Layer Structure

| Layer | Purpose | Location |
|-------|---------|----------|
| Pages | Route components, page layout | `frontend/src/pages/` |
| Components | Reusable UI elements | `frontend/src/components/` |
| Context | Global state (Auth, Cart, Config) | `frontend/src/context/` |
| Services | API client, HTTP calls | `frontend/src/services/` |
| Utils | Helpers, security, formatting | `frontend/src/utils/` |

---

## Authentication Architecture

### JWT Token Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────►│  Server  │────►│  Tokens  │
│  Request │     │  Verify  │     │  Issued  │
└──────────┘     └──────────┘     └────┬─────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  │
              ┌──────────┐      ┌──────────┐              │
              │  Access  │      │  Refresh │              │
              │  Token   │      │  Token   │              │
              │  (15m)   │      │  (7d)    │              │
              └────┬─────┘      └────┬─────┘              │
                   │                 │                    │
                   ▼                 ▼                    │
              ┌──────────┐      ┌──────────┐              │
              │  API     │      │  Refresh │──────────────┘
              │  Calls   │      │  Expired │
              └──────────┘      │  Token   │
                                └──────────┘
```

### User Roles

```javascript
USER_ROLES = {
    CUSTOMER: 'customer',    // Regular shoppers
    STAFF: 'staff',          // Limited admin access
    ADMIN: 'admin',          // Full admin access
    SUPER_ADMIN: 'super_admin' // System configuration
}
```

---

## Data Flow Examples

### Checkout Flow

```
1. User clicks "Place Order"
   │
2. Frontend calls paymentAPI.checkout({shippingAddress, paymentMethod})
   │
3. Backend validates:
   ├── Cart exists and has items
   ├── All products available
   ├── Prices haven't changed
   └── User authenticated
   │
4. Payment Service:
   ├── COD → Creates order immediately
   └── Online → Creates payment, returns gateway URL
   │
5. Order Service:
   ├── Creates order from cart
   ├── Decrements inventory (if enabled)
   ├── Clears cart
   ├── Sends confirmation email
   └── Logs to AuditLog
   │
6. Frontend receives order and redirects to order detail
```

### Cart Totals Flow

```
Frontend                    Backend
   │                           │
   │  cartAPI.getCart()        │
   │ ─────────────────────────►│
   │                           ├── Get cart from DB
   │                           ├── Populate products
   │                           ├── configService.calculateShipping()
   │                           ├── configService.calculateTax()
   │                           │
   │  {cart, totals}           │
   │ ◄─────────────────────────│
   │                           │
   ├── setCart(data.cart)      │
   ├── setTotals(data.totals)  │
   │                           │
   └── Render UI               │
```

---

## Feature Flags

Features can be toggled via `FeatureFlag` model or admin UI:

| Flag | Default | Purpose |
|------|---------|---------|
| `inventory` | true | Track product stock |
| `discounts` | true | Allow discount codes |
| `variants` | false | Product variants support |
| `reviews` | false | Product reviews |
| `wishlist` | false | User wishlists |
| `guestCheckout` | false | Checkout without login |
| `emailNotifications` | true | Order emails |
| `adminNotifications` | true | New order admin emails |

**Check in code:**
```javascript
const enabled = await configService.isFeatureEnabled('inventory');
```

---

## Error Handling

### Backend Error Pattern

```javascript
// In route handlers
throw createError.badRequest('Invalid input');
throw createError.notFound('Order not found');
throw createError.forbidden('Access denied');

// Caught by errorHandler middleware, returns:
{
    success: false,
    error: {
        message: 'Invalid input',
        statusCode: 400
    }
}
```

### Frontend Error Pattern

```javascript
// API interceptor handles errors globally
// User-friendly messages via toast notifications
// ErrorBoundary catches React errors
```

---

## Security Measures

| Measure | Implementation |
|---------|----------------|
| Authentication | JWT with httpOnly cookies option |
| Password | bcrypt with 12 salt rounds |
| Rate Limiting | express-rate-limit per IP |
| Input Validation | Joi schemas in middleware |
| XSS Prevention | DOMPurify in frontend |
| CORS | Configured origins |
| Helmet | Security headers |

---

## Caching Strategy

| Data | Cache Duration | Invalidation |
|------|---------------|--------------|
| Config | 5 minutes | On update via admin |
| Features | 5 minutes | On toggle |
| Product list | No cache | Real-time |
| Cart | No cache | Real-time |
