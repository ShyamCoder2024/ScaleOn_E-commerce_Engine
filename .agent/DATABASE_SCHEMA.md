# ScaleOn Commerce Engine - Database Schema

## Overview

Database: **MongoDB** with **Mongoose ODM**
Location: `backend/models/`

---

## Models Summary

| Model | File | Purpose |
|-------|------|---------|
| User | `User.js` | Customers and admin accounts |
| Product | `Product.js` | Product catalog |
| Category | `Category.js` | Product categories |
| Cart | `Cart.js` | Shopping carts |
| Order | `Order.js` | Orders |
| Payment | `Payment.js` | Payment records |
| StoreConfig | `StoreConfig.js` | Configuration storage |
| FeatureFlag | `FeatureFlag.js` | Feature toggles |
| AuditLog | `AuditLog.js` | Activity logging |

---

## User Model

```javascript
{
    email: String,          // Unique, indexed
    password: String,       // Hashed with bcrypt
    role: String,           // 'customer' | 'staff' | 'admin' | 'super_admin'
    status: String,         // 'active' | 'pending' | 'blocked'
    
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        avatar: String,
        addresses: [{
            type: String,       // 'shipping' | 'billing'
            firstName: String,
            lastName: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            phone: String,
            isDefault: Boolean
        }]
    },
    
    security: {
        emailVerified: Boolean,
        emailVerifyToken: String,
        passwordResetToken: String,
        passwordResetExpires: Date,
        lastLogin: Date,
        loginAttempts: Number,
        lockUntil: Date
    },
    
    refreshToken: String,
    
    timestamps: true        // createdAt, updatedAt
}
```

**Key Methods:**
- `user.comparePassword(password)` - Verify password
- `user.generateAuthTokens()` - Create JWT tokens
- `User.findByCredentials(email, password)` - Static login

---

## Product Model

```javascript
{
    name: String,
    slug: String,           // Unique, URL-safe
    sku: String,            // Unique identifier
    
    description: {
        short: String,
        long: String
    },
    
    price: Number,          // In paise (smallest unit)
    compareAtPrice: Number, // Original price for sales
    cost: Number,           // Cost price (admin only)
    
    images: [{
        url: String,
        alt: String,
        position: Number
    }],
    
    category: ObjectId,     // Reference to Category
    status: String,         // 'draft' | 'active' | 'archived'
    
    // Inventory
    trackInventory: Boolean,
    inventory: Number,
    lowStockThreshold: Number,
    
    // Variants (if enabled)
    hasVariants: Boolean,
    variants: [{
        sku: String,
        name: String,
        options: Map,
        price: Number,
        inventory: Number
    }],
    
    // Shipping
    weight: Number,
    
    // SEO
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    
    // Soft delete
    deletedAt: Date,
    
    timestamps: true
}
```

**Key Methods:**
- `product.decrementInventory(qty, variantSku)` - Reduce stock
- `product.restoreInventory(qty, variantSku)` - Restore stock
- `product.isAvailable(qty)` - Check availability
- `Product.search(query, options)` - Full-text search

**Virtuals:**
- `primaryImage` - First image URL
- `isLowStock` - Below threshold check
- `isOutOfStock` - Zero inventory check

---

## Category Model

```javascript
{
    name: String,
    slug: String,           // Unique
    description: String,
    image: String,
    parent: ObjectId,       // Self-reference for hierarchy
    position: Number,       // Sort order
    isActive: Boolean,
    
    seo: {
        title: String,
        description: String
    },
    
    timestamps: true
}
```

**Virtuals:**
- `children` - Subcategories (populated)

**Statics:**
- `Category.getTree()` - Hierarchical category tree

---

## Cart Model

```javascript
{
    user: ObjectId,         // Reference to User (optional)
    sessionId: String,      // For guest carts
    
    items: [{
        product: ObjectId,
        productName: String,
        productSlug: String,
        quantity: Number,
        priceAtAdd: Number, // Price when added
        variant: {
            sku: String,
            name: String,
            options: Map
        },
        image: String
    }],
    
    discountCode: String,
    discountAmount: Number,
    
    expiresAt: Date,        // TTL for guest carts
    
    timestamps: true
}
```

**Key Methods:**
- `cart.addItem(productId, quantity, variant)` - Add to cart
- `cart.updateItemQuantity(itemId, quantity)` - Update qty
- `cart.removeItem(itemId)` - Remove item
- `cart.clearCart()` - Empty cart
- `cart.validateForCheckout()` - Check all items valid
- `cart.mergeWith(otherCart)` - Merge guest cart

**Virtuals:**
- `itemCount` - Total item quantity

---

## Order Model

```javascript
{
    orderId: String,        // Auto-generated: ORD-XXXXXXXX-XXXXXX
    user: ObjectId,
    
    items: [{
        product: ObjectId,
        productName: String,
        quantity: Number,
        price: Number,
        subtotal: Number,
        variant: Object,
        image: String
    }],
    
    pricing: {
        subtotal: Number,
        discountCode: String,
        discountAmount: Number,
        shippingCost: Number,
        taxAmount: Number,
        total: Number
    },
    
    shippingAddress: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    
    status: String,         // pending|processing|shipped|delivered|cancelled|refunded
    
    payment: ObjectId,      // Reference to Payment
    
    shipping: {
        method: String,
        trackingNumber: String,
        trackingUrl: String,
        carrier: String,
        shippedAt: Date,
        deliveredAt: Date
    },
    
    statusHistory: [{
        status: String,
        note: String,
        updatedBy: ObjectId,
        timestamp: Date
    }],
    
    adminNotes: [{
        note: String,
        addedBy: ObjectId,
        timestamp: Date
    }],
    
    timestamps: true
}
```

**Key Methods:**
- `order.updateStatus(status, updatedBy, note)` - Change status
- `order.addTracking(trackingNumber, trackingUrl)` - Add shipping info
- `order.addAdminNote(note, addedBy)` - Add internal note
- `Order.createFromCart(cart, user, address, pricing, paymentId)` - Create order

**Virtuals:**
- `canCancel` - Whether order can be cancelled
- `canRefund` - Whether refund is allowed

---

## Payment Model

```javascript
{
    order: ObjectId,
    user: ObjectId,
    
    method: String,         // cod|razorpay|stripe
    provider: String,       // Payment gateway
    
    amount: Number,
    currency: String,
    
    status: String,         // pending|processing|completed|failed|refunded
    
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    
    metadata: Object,       // Gateway-specific data
    
    refunds: [{
        amount: Number,
        reason: String,
        refundId: String,
        refundedAt: Date,
        refundedBy: ObjectId
    }],
    
    timestamps: true
}
```

**Key Methods:**
- `payment.verify(signature)` - Verify gateway signature
- `payment.markCompleted(details)` - Mark as paid
- `payment.processRefund(amount, reason)` - Process refund

---

## StoreConfig Model

```javascript
{
    key: String,            // Unique, e.g., 'shipping.flatRate'
    value: Mixed,           // Any type
    type: String,           // branding|business_rule|shipping|tax|payment
    description: String,
    lastUpdatedBy: ObjectId,
    
    timestamps: true
}
```

**Statics:**
- `StoreConfig.getValue(key)` - Get single value
- `StoreConfig.setValue(key, value, type, updatedBy)` - Set value
- `StoreConfig.getAllAsObject()` - Get all as nested object

---

## FeatureFlag Model

```javascript
{
    name: String,           // Unique, e.g., 'inventory'
    enabled: Boolean,
    description: String,
    dependencies: [String], // Other features required
    rolloutPercentage: Number, // For gradual rollout
    lastUpdatedBy: ObjectId,
    
    timestamps: true
}
```

**Statics:**
- `FeatureFlag.isEnabled(name)` - Check if enabled
- `FeatureFlag.getAllFeatures()` - Get all flags
- `FeatureFlag.initializeDefaults()` - Create defaults

---

## AuditLog Model

```javascript
{
    action: String,         // e.g., 'order.create', 'product.update'
    actor: ObjectId,        // User who performed action
    actorEmail: String,
    
    resourceType: String,   // 'order' | 'product' | 'user' | etc.
    resourceId: ObjectId,
    resourceName: String,   // Human-readable identifier
    
    details: Object,        // Action-specific data
    
    ipAddress: String,
    userAgent: String,
    
    timestamp: Date
}
```

**Statics:**
- `AuditLog.log(data)` - Create log entry
- `AuditLog.search(query, options)` - Search logs
- `AuditLog.getRecentActivity(options)` - Get recent items

---

## Indexes

```javascript
// User
{ email: 1 }                    // Unique
{ role: 1, status: 1 }          // Admin queries

// Product
{ slug: 1 }                     // Unique
{ category: 1, status: 1 }      // Listing
{ name: 'text', description.short: 'text' } // Search

// Category
{ slug: 1 }                     // Unique
{ parent: 1 }                   // Tree queries

// Cart
{ user: 1 }                     // User lookup
{ sessionId: 1 }                // Guest lookup
{ expiresAt: 1 }                // TTL

// Order
{ orderId: 1 }                  // Unique
{ user: 1, createdAt: -1 }      // User orders
{ status: 1, createdAt: -1 }    // Admin filters

// AuditLog
{ timestamp: -1 }               // Recent first
{ actor: 1 }                    // By user
{ resourceType: 1, resourceId: 1 } // By resource
```

---

## Relationships

```
User ─────────────────┬──────────────────┬─────────────────┐
                      │                  │                 │
                      ▼                  ▼                 ▼
                    Cart              Order             AuditLog
                      │                  │
                      │                  │
              ┌───────┴───────┐   ┌──────┴──────┐
              ▼               ▼   ▼              ▼
           Product         Product           Payment
              │
              │
              ▼
           Category
              │
              ▼
         Category (parent)
```
