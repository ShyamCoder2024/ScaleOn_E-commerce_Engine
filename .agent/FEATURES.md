# E-Commerce Platform - Complete Features Documentation

> **Last Updated:** January 28, 2026  
> **Version:** 1.0  
> **Purpose:** Comprehensive reference of ALL implemented features for efficient troubleshooting and development

---

## Table of Contents

1. [Intelligent Product Discovery](#intelligent-product-discovery)
2. [Category Management System](#category-management-system)
3. [Product Management](#product-management)
4. [User Authentication & Authorization](#user-authentication--authorization)
5. [Shopping Cart & Checkout](#shopping-cart--checkout)
6. [Order Management](#order-management)
7. [Payment Integration](#payment-integration)
8. [Admin Dashboard](#admin-dashboard)
9. [Performance & Optimization](#performance--optimization)
10. [UI/UX Features](#uiux-features)
11. [Configuration System](#configuration-system)
12. [Security Features](#security-features)

---

## 1. Intelligent Product Discovery

**Status:** ✅ Fully Implemented (Jan 28, 2026)  
**Commits:** `b459d5c`, `947c217`

### 1.1 Automatic Price Drop Detection

**What It Does:**
- Automatically detects when product prices are reduced
- Shows products with price drops in "🔥 Hot Deals & Price Drops" section
- Adds visual fire emoji badge to product cards
- Tracks complete price history (last 10 changes)

**How It Works:**
```javascript
// Backend: Product model pre-save middleware
- Compares current price with previous price on save
- Sets hasPriceDrop = true if price decreased
- Logs change to priceHistory array
- Updates lastPriceChange timestamp
```

**Files:**
- Backend: `backend/models/Product.js` (fields: `originalPrice`, `priceHistory`, `hasPriceDrop`, `lastPriceChange`)
- Backend: `backend/routes/productRoutes.js` (`GET /api/products/price-drops`)
- Backend: `backend/services/productService.js` (`getPriceDrops()`)
- Frontend: `frontend/src/services/api.js` (`productAPI.getPriceDrops()`)
- Frontend: `frontend/src/pages/Home.jsx` (Hot Deals section)
- Frontend: `frontend/src/components/ProductCard.jsx` (🔥 Price Drop badge)

**Admin Experience:**
1. Admin creates product at $100
2. Admin reduces price to $80
3. System automatically:
   - Sets `hasPriceDrop = true`
   - Shows in "Hot Deals" section
   - Adds 🔥 badge to product card
   - No manual work needed!

**Database Indexes:**
```javascript
{ hasPriceDrop: 1, lastPriceChange: -1, status: 1 }  // For efficient queries
```

---

### 1.2 Smart New Arrivals

**What It Does:**
- Only shows products created within last 30 days
- Updates automatically as products age
- Adds ✨ sparkle emoji to section title

**How It Works:**
```javascript
// Backend static method
getNewArrivals(limit = 8, daysBack = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);
    
    return Product.find({
        status: 'active',
        createdAt: { $gte: dateThreshold }
    }).sort({ createdAt: -1 }).limit(limit);
}
```

**Files:**
- Backend: `backend/models/Product.js` (`getNewArrivals()` static method)
- Backend: `backend/routes/productRoutes.js` (`GET /api/products/new-arrivals`)
- Frontend: `frontend/src/pages/Home.jsx` (✨ New Arrivals section)

**Database Indexes:**
```javascript
{ createdAt: -1, status: 1 }  // For efficient date filtering
```

---

### 1.3 Multi-Signal Featured Collection

**What It Does:**
- Automatically curates featured products using 3 signals:
  1. Products with price drops (4 products)
  2. Top-selling products (2 products)
  3. Manually featured by admin (4 products)
- Deduplicates to prevent same product appearing twice
- Zero admin effort for most products

**Algorithm:**
```javascript
getFeatured(limit = 8) {
    // 1. Price drops (highest priority)
    const priceDrops = await find({ hasPriceDrop: true }).limit(4);
    
    // 2. Top sellers (social proof)
    const topSellers = await find().sort({ salesCount: -1 }).limit(2);
    
    // 3. Manual featured (admin control)
    const manual = await find({ isFeatured: true }).limit(4);
    
    // Combine and deduplicate
    return [...priceDrops, ...topSellers, ...manual]
        .filter(unique)
        .slice(0, limit);
}
```

**Files:**
- Backend: `backend/models/Product.js` (`getFeatured()` enhanced)
- Frontend: `frontend/src/pages/Home.jsx` (uses for "Hot Deals" section)

---

## 2. Category Management System

**Status:** ✅ Fully Implemented (Jan 27, 2026)  
**Commit:** `35a4544`

### 2.1 Hierarchical Categories

**What It Does:**
- Unlimited nested category levels (parent-child relationships)
- Automatic product counting at each level
- Breadcrumb navigation
- SEO-friendly slugs

**Features:**
- **Tree Structure:** Categories can have parent categories
- **Auto Product Count:** Updates when products added/removed
- **Image Support:** Category images with URL/upload
- **Status Management:** Active/Inactive categories
- **Metadata:** Title, description for SEO

**Files:**
- Backend: `backend/models/Category.js` (hierarchical model)
- Backend: `backend/routes/categoryRoutes.js` (CRUD endpoints)
- Backend: `backend/services/categoryService.js` (business logic)
- Frontend: `frontend/src/pages/admin/Categories.jsx` (admin UI)
- Frontend: `frontend/src/pages/admin/CategoryForm.jsx` (create/edit)
- Frontend: `frontend/src/pages/Categories.jsx` (public view)

**Database Schema:**
```javascript
{
    name: String,           // "Electronics"
    slug: String,           // "electronics" (auto-generated)
    parent: ObjectId,       // Reference to parent category
    description: String,
    image: String,
    productCount: Number,   // Auto-maintained
    isActive: Boolean,
    metadata: {
        title: String,      // SEO title
        description: String // SEO description
    }
}
```

**API Endpoints:**
- `GET /api/categories` - List all categories (tree structure)
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)
- `GET /api/categories/:id/products` - Get products in category

---

### 2.2 Category Grid Display

**What It Does:**
- Beautiful grid layout on home page
- Shows category image, name, product count
- Responsive design (mobile-first)
- Animated hover effects

**Files:**
- Frontend: `frontend/src/components/CategoryGrid.jsx`
- Frontend: `frontend/src/pages/Home.jsx` (uses CategoryGrid)

---

## 3. Product Management

**Status:** ✅ Fully Implemented

### 3.1 Product CRUD

**Features:**
- Complete product lifecycle (create, read, update, delete)
- Soft delete (archive instead of permanent delete)
- Product duplication
- Bulk status updates
- Image management (multiple images, primary image selection)
- Inventory tracking
- Variant support (size, color, etc.)

**Files:**
- Backend: `backend/models/Product.js`
- Backend: `backend/routes/productRoutes.js`
- Backend: `backend/services/productService.js`
- Frontend: `frontend/src/pages/admin/ProductList.jsx`
- Frontend: `frontend/src/pages/admin/ProductForm.jsx`

**Database Schema:**
```javascript
{
    name: String,
    slug: String,              // Auto-generated from name
    description: String,
    shortDescription: String,
    sku: String,               // Stock Keeping Unit
    price: Number,
    compareAtPrice: Number,    // Original price for discount display
    originalPrice: Number,     // First price ever set (intelligent)
    cost: Number,              // Cost price (admin only)
    categories: [ObjectId],    // Multiple categories
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }],
    primaryImage: String,      // Quick access
    status: String,            // active, draft, archived
    isFeatured: Boolean,
    inventory: Number,
    trackInventory: Boolean,
    lowStockThreshold: Number,
    hasVariants: Boolean,
    variants: [{
        name: String,
        sku: String,
        price: Number,
        inventory: Number,
        isAvailable: Boolean,
        options: Object        // { color: 'Red', size: 'L' }
    }],
    metadata: {
        title: String,         // SEO
        description: String,   // SEO
        keywords: [String]     // SEO
    },
    salesCount: Number,        // Track popularity
    viewCount: Number,         // Track views
    // Intelligent fields
    priceHistory: [{
        price: Number,
        compareAtPrice: Number,
        changedAt: Date,
        changedBy: ObjectId
    }],
    hasPriceDrop: Boolean,
    lastPriceChange: Date
}
```

**API Endpoints:**
- `GET /api/products` - List products (public, with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/price-drops` - Get products with price drops (intelligent)
- `GET /api/products/new-arrivals` - Get new products (intelligent)
- `GET /api/products/slug/:slug` - Get by slug
- `GET /api/products/:id` - Get by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Soft delete (admin)
- `POST /api/products/:id/restore` - Restore archived product (admin)
- `POST /api/products/:id/duplicate` - Duplicate product (admin)
- `POST /api/products/bulk/status` - Bulk update status (admin)

---

### 3.2 Product Display

**Features:**
- Grid and list view modes
- Lazy loading images
- Hover effects (second image on hover)
- Wishlist integration
- Quick add to cart
- Quantity controls on card
- Price comparison display
- Discount badges
- Price drop badges (🔥 intelligent)
- Out of stock overlay
- Rating display (mock for now)

**Files:**
- Frontend: `frontend/src/components/ProductCard.jsx`
- Frontend: `frontend/src/pages/Products.jsx`
- Frontend: `frontend/src/pages/ProductDetail.jsx`

---

## 4. User Authentication & Authorization

**Status:** ✅ Fully Implemented

### 4.1 Email/Password Authentication

**Features:**
- User registration with email verification
- Login with JWT tokens
- Forgot password flow
- Email templates (welcome, password reset)
- Session management
- Token refresh

**Files:**
- Backend: `backend/models/User.js`
- Backend: `backend/routes/authRoutes.js`
- Backend: `backend/services/authService.js`
- Backend: `backend/middleware/auth.js`
- Frontend: `frontend/src/pages/Login.jsx`
- Frontend: `frontend/src/pages/Register.jsx`
- Frontend: `frontend/src/pages/ForgotPassword.jsx`
- Frontend: `frontend/src/context/AuthContext.jsx`

**User Roles:**
- `customer` - Regular users
- `admin` - Full access to admin panel

**JWT Structure:**
```javascript
{
    userId: ObjectId,
    email: String,
    role: String,
    iat: Number,    // Issued at
    exp: Number     // Expiration (30 days)
}
```

---

### 4.2 Social Authentication (OAuth)

**Status:** ✅ Implemented  
**Providers:** Google, Apple

**Features:**
- One-click login with Google
- One-click login with Apple
- Automatic account creation
- Profile picture sync
- Email verification bypass

**Files:**
- Backend: `backend/routes/authRoutes.js` (OAuth routes)
- Backend: `backend/services/authService.js` (OAuth verification)
- Frontend: `frontend/src/components/SocialAuthButtons.jsx`
- Setup Guide: `docs/OAUTH_SETUP.md`

**OAuth Flow:**
1. User clicks "Continue with Google/Apple"
2. OAuth popup opens
3. User authorizes
4. Frontend receives token
5. Backend verifies token with Google/Apple
6. Creates/updates user account
7. Returns JWT token

**Database Schema Addition:**
```javascript
{
    authProvider: String,      // 'email', 'google', 'apple'
    socialId: String,          // ID from OAuth provider
    picture: String            // Profile picture URL
}
```

---

## 5. Shopping Cart & Checkout

**Status:** ✅ Fully Implemented

### 5.1 Shopping Cart

**Features:**
- Add/remove products
- Update quantities
- Persistent cart (saved to database for logged-in users)
- Guest cart (localStorage for visitors)
- Auto-sync between devices
- Price calculations
- Discount calculations
- Stock validation
- Empty cart handling

**Files:**
- Backend: `backend/models/Cart.js`
- Backend: `backend/routes/cartRoutes.js`
- Backend: `backend/services/cartService.js`
- Frontend: `frontend/src/context/CartContext.jsx`
- Frontend: `frontend/src/pages/Cart.jsx`
- Frontend: `frontend/src/components/ProductCard.jsx` (add to cart)

**Database Schema:**
```javascript
{
    user: ObjectId,       // null for guest carts
    sessionId: String,    // For guest cart tracking
    items: [{
        product: ObjectId,
        variant: ObjectId,  // If product has variants
        quantity: Number,
        price: Number,      // Snapshot at time of add
        discount: Number
    }],
    totals: {
        subtotal: Number,
        discount: Number,
        shipping: Number,
        tax: Number,
        total: Number
    },
    expiresAt: Date       // Auto-delete old guest carts
}
```

**Cart Context Features:**
- Global cart state management
- Optimistic UI updates
- Debounced quantity changes (250ms)
- Error handling
- Loading states

---

### 5.2 Checkout Process

**Features:**
- Multi-step checkout flow
- Shipping address management
- Billing address (same as shipping or different)
- Order summary
- Coupon/discount code support (model ready)
- Payment method selection
- Order confirmation

**Files:**
- Frontend: `frontend/src/pages/Checkout.jsx`
- Backend: `backend/routes/orderRoutes.js`
- Backend: `backend/services/orderService.js`

**Checkout Steps:**
1. Cart review
2. Shipping information
3. Payment details
4. Order confirmation

---

## 6. Order Management

**Status:** ✅ Fully Implemented

### 6.1 Customer Order Management

**Features:**
- View order history
- Order detail view
- Track order status
- Download invoice (PDF)
- Order summary
- Payment status
- Shipping status

**Files:**
- Frontend: `frontend/src/pages/account/Orders.jsx`
- Frontend: `frontend/src/pages/account/OrderDetail.jsx`
- Backend: `backend/routes/orderRoutes.js`

**Order Statuses:**
- `pending` - Order placed, payment pending
- `processing` - Payment received, preparing order
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled
- `refunded` - Order refunded

---

### 6.2 Admin Order Management

**Features:**
- View all orders
- Filter by status, date, customer
- Update order status
- Process refunds
- View customer details
- Print invoices
- Sales analytics

**Files:**
- Frontend: `frontend/src/pages/admin/OrderList.jsx`
- Frontend: `frontend/src/pages/admin/AdminOrderDetail.jsx`
- Backend: `backend/services/orderService.js`

**Database Schema:**
```javascript
{
    orderNumber: String,      // Auto-generated (ORD-XXXXXX)
    user: ObjectId,
    items: [{
        product: ObjectId,
        variant: ObjectId,
        name: String,         // Snapshot
        price: Number,        // Snapshot
        quantity: Number,
        image: String         // Snapshot
    }],
    shippingAddress: {
        name: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    billingAddress: Object,   // Same structure
    totals: {
        subtotal: Number,
        discount: Number,
        shipping: Number,
        tax: Number,
        total: Number
    },
    paymentMethod: String,
    paymentStatus: String,
    paymentId: String,        // Razorpay payment ID
    status: String,
    statusHistory: [{
        status: String,
        timestamp: Date,
        note: String,
        updatedBy: ObjectId
    }],
    notes: String,
    trackingNumber: String
}
```

---

## 7. Payment Integration

**Status:** ✅ Fully Implemented  
**Provider:** Razorpay

### 7.1 Razorpay Integration

**Features:**
- Complete payment gateway integration
- Multiple payment methods (cards, UPI, wallets, net banking)
- Mobile-optimized payment window
- Payment verification
- Webhook support for payment updates
- Refund support
- Test mode & production mode

**Files:**
- Backend: `backend/services/paymentService.js`
- Backend: `backend/routes/paymentRoutes.js`
- Frontend: `frontend/src/pages/Checkout.jsx` (payment UI)
- Config: `.env` (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

**Payment Flow:**
1. Customer completes checkout
2. Backend creates Razorpay order
3. Frontend opens Razorpay payment modal
4. Customer completes payment
5. Razorpay sends response
6. Backend verifies payment signature
7. Order status updated
8. Customer receives confirmation

**API Endpoints:**
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Handle webhooks
- `POST /api/payments/refund` - Process refund

---

## 8. Admin Dashboard

**Status:** ✅ Fully Implemented

### 8.1 Dashboard Overview

**Features:**
- Sales overview (today, week, month)
- Revenue charts
- Recent orders
- Low stock alerts
- Customer statistics
- Quick actions

**Files:**
- Frontend: `frontend/src/pages/admin/Dashboard.jsx`
- Frontend: `frontend/src/pages/admin/Revenue.jsx` (detailed analytics)

**Metrics Displayed:**
- Total revenue
- Total orders
- Total customers
- Average order value
- Revenue trends (chart)
- Top-selling products
- Recent activity

---

### 8.2 Customer Management

**Features:**
- View all customers
- Customer details
- Order history per customer
- Customer search
- Customer statistics (lifetime value, order count)

**Files:**
- Frontend: `frontend/src/pages/admin/CustomerList.jsx`
- Frontend: `frontend/src/pages/admin/CustomerDetail.jsx`
- Backend: `backend/routes/userRoutes.js`

---

### 8.3 Admin Layout

**Features:**
- Responsive sidebar navigation
- Fixed sidebar with scrollable content
- Logout button always visible (bottom of sidebar)
- Mobile-optimized navigation
- Breadcrumbs
- Quick stats header

**Files:**
- Frontend: `frontend/src/pages/admin/AdminLayout.jsx`
- CSS: `frontend/src/styles/AdminLayout.css`
- CSS: `frontend/src/styles/AdminResponsive.css`

---

## 9. Performance & Optimization

**Status:** ✅ Implemented

### 9.1 Frontend Optimizations

**Features:**
- **Code Splitting:** Lazy loading of routes
- **Image Optimization:** Lazy loading, WebP support
- **API Deduplication:** Prevents duplicate API calls within 1 second
- **Request Throttling:** Prevents spam requests
- **Debounced Inputs:** Quantity changes, search
- **Memoization:** React.memo on ProductCard and other components
- **Bundle Optimization:** Vite build optimization

**Files:**
- `frontend/src/services/api.js` (deduplication, throttling)
- `frontend/src/components/ProductCard.jsx` (React.memo)
- `frontend/vite.config.js` (build optimization)

**Deduplication Logic:**
```javascript
const deduplicatedGet = (url, config) => {
    const cacheKey = url + JSON.stringify(config?.params || {});
    
    // Check if request made in last 1 second
    if (requestCache.has(cacheKey)) {
        const cached = requestCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 1000) {
            return cached.promise;  // Return same promise
        }
    }
    
    // Make new request
    const promise = api.get(url, config);
    requestCache.set(cacheKey, { promise, timestamp: Date.now() });
    return promise;
};
```

---

### 9.2 Backend Optimizations

**Features:**
- **Database Indexes:** Strategic indexes on frequently queried fields
- **Connection Pooling:** MongoDB connection pool (10 connections)
- **Rate Limiting:** API rate limiting (500 req/15min, 100 req/15min for search)
- **Request Timeouts:** 30s timeout on all requests
- **Pagination:** All list endpoints support pagination
- **Field Selection:** Minimal field selection for list views
- **Caching Ready:** Structure supports Redis caching

**Files:**
- `backend/config/database.js` (connection pooling)
- `backend/middleware/rateLimiter.js`
- `backend/middleware/errorHandler.js` (timeout)

**Database Indexes:**
```javascript
// Product indexes
{ slug: 1 }                                          // Unique
{ status: 1, isFeatured: -1 }                       // Featured products
{ status: 1, createdAt: -1 }                        // New products
{ hasPriceDrop: 1, lastPriceChange: -1, status: 1 } // Price drops (intelligent)
{ createdAt: -1, status: 1 }                        // New arrivals (intelligent)

// Category indexes
{ slug: 1 }                                          // Unique
{ parent: 1, isActive: 1 }                          // Hierarchy

// Order indexes
{ orderNumber: 1 }                                   // Unique
{ user: 1, createdAt: -1 }                          // User orders
{ status: 1, createdAt: -1 }                        // Admin filtering
```

---

## 10. UI/UX Features

**Status:** ✅ Implemented

### 10.1 Design System

**Features:**
- **Modern Aesthetic:** Premium, state-of-the-art design
- **Color Palette:** Curated HSL colors
- **Typography:** Google Fonts (Inter, Outfit)
- **Glassmorphism:** Backdrop blur effects
- **Micro-animations:** Smooth transitions
- **Dark Mode Ready:** CSS variables prepared
- **Responsive Grid:** Mobile-first design

**Files:**
- `frontend/src/index.css` (global styles, CSS variables)
- `frontend/tailwind.config.js` (Tailwind configuration)

**Color System:**
```css
:root {
    --primary-50: hsl(215, 100%, 97%);
    --primary-100: hsl(215, 96%, 93%);
    --primary-200: hsl(213, 97%, 87%);
    --primary-300: hsl(212, 96%, 78%);
    --primary-400: hsl(213, 94%, 68%);
    --primary-500: hsl(217, 91%, 60%);  /* Base */
    --primary-600: hsl(221, 83%, 53%);
    --primary-700: hsl(224, 76%, 48%);
    --primary-800: hsl(226, 71%, 40%);
    --primary-900: hsl(224, 64%, 33%);
}
```

---

### 10.2 Mobile Optimization

**Features:**
- **Mobile-First:** All components designed for mobile first
- **Touch Optimized:** 44px minimum touch targets
- **Responsive Images:** Appropriate sizes for screens
- **Mobile Navigation:** Hamburger menu, slide-out sidebar
- **Gesture Support:** Swipe gestures where applicable
- **PWA Ready:** Service worker configuration

**Breakpoints:**
```javascript
sm: '640px'   // Small devices
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
2xl: '1536px' // Large screens
```

---

### 10.3 Error Handling & User Feedback

**Features:**
- **Error Boundary:** Catches React errors
- **Toast Notifications:** Success/error messages
- **Loading States:** Shimmer skeletons
- **Empty States:** Engaging empty state designs
- **404 Page:** Custom not found page
- **Form Validation:** Real-time validation
- **Auth Prompts:** Guest user prompts for actions

**Files:**
- `frontend/src/components/ErrorBoundary.jsx`
- `frontend/src/components/AuthPromptModal.jsx`
- `frontend/src/pages/NotFound.jsx`

---

## 11. Configuration System

**Status:** ✅ Implemented

### 11.1 Feature Flags

**Purpose:** Enable/disable features without code changes

**Features:**
- **Dynamic Configuration:** Enable/disable features
- **Feature Flags:** Inventory, variants, wishlist, reviews, rewards, featureCards
- **Admin Control:** Future admin UI for toggling
- **Default Values:** Sensible defaults
- **Context Provider:** Global access in React

**Files:**
- Backend: `backend/models/Config.js`
- Backend: `backend/services/configService.js`
- Frontend: `frontend/src/context/ConfigContext.jsx`

**Available Feature Flags:**
```javascript
{
    inventory: true,       // Track inventory
    variants: true,        // Product variants
    wishlist: true,        // Wishlist feature
    reviews: false,        // Product reviews (not implemented yet)
    rewards: false,        // Loyalty rewards (not implemented yet)
    featureCards: true     // Home page feature cards
}
```

**Usage Example:**
```javascript
// Frontend
const { isFeatureEnabled } = useConfig();

if (isFeatureEnabled('wishlist')) {
    // Show wishlist button
}

// Backend
const wishlistEnabled = await configService.isFeatureEnabled('wishlist');
```

---

### 11.2 Environment Configuration

**Files:**
- Backend: `.env` (not in repo)
- Frontend: `.env` (not in repo)
- `backend/.env.example`
- `frontend/.env.example`
- `docs/ENVIRONMENT.md`

**Backend Environment Variables:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# Email (Nodemailer)
EMAIL_FROM=noreply@example.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment (Razorpay)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

**Frontend Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id
```

---

## 12. Security Features

**Status:** ✅ Implemented

### 12.1 Authentication Security

**Features:**
- **JWT Tokens:** Secure, stateless authentication
- **Password Hashing:** bcrypt with salt rounds
- **Token Expiration:** 30-day expiration
- **Role-Based Access:** User and admin roles
- **Protected Routes:** Middleware for admin routes
- **CSRF Protection:** Token-based
- **XSS Prevention:** Input sanitization

**Files:**
- `backend/middleware/auth.js` (protect, adminOnly)
- `backend/models/User.js` (password hashing)
- `backend/services/authService.js`

**Password Hashing:**
```javascript
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
```

---

### 12.2 API Security

**Features:**
- **Rate Limiting:** Prevents brute force and DDoS
- **CORS:** Configured for specific origins
- **Helmet:** Security headers
- **Input Validation:** Express-validator
- **Request Timeouts:** 30s timeout
- **Error Logging:** Structured logging
- **Audit Trail:** Track admin actions

**Rate Limits:**
```javascript
// General API: 500 requests per 15 minutes
// Search API: 100 requests per 15 minutes
// Auth endpoints: 10 requests per 15 minutes
```

**Files:**
- `backend/middleware/rateLimiter.js`
- `backend/middleware/validation.js`
- `backend/middleware/errorHandler.js`
- `backend/models/AuditLog.js`

---

### 12.3 Data Validation

**Features:**
- **Input Sanitization:** Prevent injection attacks
- **Schema Validation:** Mongoose schemas enforce data types
- **Express Validation:** Route-level validation
- **File Upload Validation:** Type and size limits
- **MongoDB ObjectId Validation:** Prevent invalid IDs

**Validators:**
```javascript
// Product validator
productValidator = [
    body('name').trim().notEmpty().isLength({ min: 3, max: 200 }),
    body('price').isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('categories').optional().isArray(),
    // ... more validations
];

// MongoDB ID validator
mongoIdValidator = (paramName) => [
    param(paramName).isMongoId().withMessage('Invalid ID format')
];
```

**Files:**
- `backend/middleware/validation.js`

---

## Additional Documentation

### Setup Guides
- **Deployment:** `docs/DEPLOYMENT.md`
- **Docker Setup:** `docs/DOCKER_SETUP.md`
- **Environment:** `docs/ENVIRONMENT.md`
- **OAuth Setup:** `docs/OAUTH_SETUP.md`
- **Email Setup:** `.agent/EMAIL_SETUP.md`

### Architecture Docs
- **Architecture:** `.agent/ARCHITECTURE.md`
- **Database Schema:** `.agent/DATABASE_SCHEMA.md`
- **API Reference:** `.agent/API_REFERENCE.md`
- **Frontend Guide:** `.agent/FRONTEND_GUIDE.md`

### Development Docs
- **Implementation Guide:** `.agent/IMPLEMENTATION.md`
- **Changelog:** `.agent/CHANGELOG.md`
- **Audit Report:** `.agent/AUDIT_REPORT.md`
- **Pre-Sale Checklist:** `.agent/PRE_SALE_CHECKLIST.md`

---

## Quick Reference: Common Tasks

### Adding a New Feature

1. **Backend:**
   - Define model in `backend/models/`
   - Create service in `backend/services/`
   - Add routes in `backend/routes/`
   - Add validation in `backend/middleware/validation.js`
   - Update API reference doc

2. **Frontend:**
   - Create page/component in `frontend/src/pages` or `frontend/src/components`
   - Add API method in `frontend/src/services/api.js`
   - Add route in `frontend/src/App.jsx`
   - Update this features doc

3. **Testing:**
   - Manual testing first
   - Check mobile responsiveness
   - Verify error handling
   - Test edge cases

4. **Documentation:**
   - Add to this FEATURES.md
   - Update relevant .agent docs
   - Add environment variables if needed
   - Update setup guides if needed

---

### Debugging Issues

**White Screen:**
1. Check browser console for errors
2. Check API calls in Network tab
3. Verify environment variables
4. Check backend is running
5. Verify database connection

**API Errors:**
1. Check backend logs
2. Verify route exists
3. Check authentication token
4. Verify request payload
5. Check validation errors

**Performance Issues:**
1. Check database indexes
2. Verify pagination is used
3. Check for N+1 queries
4. Review image sizes
5. Check bundle size

---

## Tech Stack Summary

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password:** bcrypt
- **Validation:** express-validator
- **Email:** Nodemailer
- **Payment:** Razorpay
- **Security:** Helmet, CORS, Rate Limiting

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF, html2canvas
- **Forms:** Native React (no library)

### DevOps
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway
- **Database:** MongoDB Atlas
- **Version Control:** Git, GitHub
- **Container:** Docker (optional)

---

## Version History

### v1.0 (Current)
- ✅ Intelligent Product Discovery
- ✅ Category Management
- ✅ Complete E-commerce Flow
- ✅ Admin Dashboard
- ✅ Social Auth (Google, Apple)
- ✅ Payment Integration (Razorpay)
- ✅ Mobile Optimization
- ✅ Performance Optimization

### Future Considerations
- Product Reviews & Ratings
- Loyalty Rewards Program
- Advanced Analytics Dashboard
- Email Marketing Integration
- SMS Notifications
- Multi-currency Support
- Multi-language Support
- Advanced Search (Elasticsearch)

---

**Document Version:** 1.0  
**Last Updated:** January 28, 2026  
**Maintained By:** Development Team  
**Purpose:** Single source of truth for all application features
