# ScaleOn Commerce Engine - Implementation Guide

## Project Phases Completed

### Phase 1: Foundation ✅

**Backend Setup:**
- Express.js server with modular structure
- MongoDB connection with Mongoose ODM
- JWT authentication with refresh tokens
- Rate limiting and security middleware

**Models Created (9 total):**
```
User.js         - Customer and admin accounts
Product.js      - Product catalog with variants
Category.js     - Hierarchical categories
Cart.js         - Shopping cart with items
Order.js        - Order management
Payment.js      - Payment records
StoreConfig.js  - Configuration storage
FeatureFlag.js  - Feature toggles
AuditLog.js     - Activity tracking
```

**Services Created (7 total):**
```
authService.js      - Authentication logic
configService.js    - Configuration access
productService.js   - Product operations
cartService.js      - Cart operations
orderService.js     - Order lifecycle
emailService.js     - Email notifications
inventoryService.js - Stock management
```

---

### Phase 2: Core Commerce ✅

**Frontend Pages:**
```
pages/
├── Home.jsx              - Landing page
├── Products.jsx          - Product listing with filters
├── ProductDetail.jsx     - Single product view
├── Cart.jsx              - Shopping cart
├── Checkout.jsx          - Multi-step checkout
└── auth/
    ├── Login.jsx
    ├── Register.jsx
    └── ForgotPassword.jsx
```

**Context Providers:**
```javascript
// AuthContext - User authentication state
const { user, isAuthenticated, login, logout } = useAuth();

// CartContext - Shopping cart state
const { cart, totals, addToCart, updateQuantity } = useCart();

// ConfigContext - Store configuration
const { config, formatPrice, isFeatureEnabled } = useConfig();
```

---

### Phase 3: Order Management ✅

**Order Workflow:**
```javascript
// Order creation
orderService.createOrder(userId, cartId, shippingAddress, paymentId, pricing)

// Status updates (admin only)
orderService.updateOrderStatus(orderId, newStatus, updatedBy, note)

// Cancellation (validates canCancel)
orderService.cancelOrder(orderId, cancelledBy, reason)

// Refunds (validates canRefund)
orderService.processRefund(orderId, amount, reason, processedBy)
```

**Inventory Management:**
```javascript
// On order creation
product.decrementInventory(quantity, variantSku)

// On cancellation/refund
product.restoreInventory(quantity, variantSku)
```

---

### Phase 4: Admin Panel ✅

**Admin Pages:**
```
pages/admin/
├── Dashboard.jsx       - Stats, recent orders, low stock
├── ProductList.jsx     - Product CRUD
├── ProductForm.jsx     - Create/edit product
├── OrderList.jsx       - Order management
├── AdminOrderDetail.jsx - Order detail with actions
├── CustomerList.jsx    - Customer management
└── Settings.jsx        - Store configuration
```

**Admin Routes Protection:**
```javascript
// AdminRoute component checks:
// 1. User is authenticated
// 2. User role is admin, staff, or super_admin
```

---

### Phase 5: Polish & Production ✅

**Error Handling:**
- `ErrorBoundary.jsx` - Catches React errors
- `NotFound.jsx` - 404 page
- `OfflineIndicator.jsx` - Network status
- Enhanced API error messages

**Performance:**
- React.lazy() for code splitting
- Suspense with loading fallback
- Lazy-loaded admin and auth pages

**Documentation:**
- README.md, DEPLOYMENT.md, ENVIRONMENT.md
- Docker and nginx configuration
- GitHub Actions CI/CD

---

## Code Patterns

### API Service Pattern

```javascript
// frontend/src/services/api.js
export const productAPI = {
    getProducts: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};
```

### Route Handler Pattern

```javascript
// backend/routes/productRoutes.js
router.get('/', asyncHandler(async (req, res) => {
    const products = await productService.getProducts(req.query);
    res.json({ success: true, data: products });
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.user._id);
    res.status(201).json({ success: true, data: { product } });
}));
```

### Service Pattern

```javascript
// backend/services/productService.js
class ProductService {
    async getProducts(options = {}) {
        // Business logic here
        // Access config via configService
        // Return clean data
    }
}
export default new ProductService();
```

### Model Method Pattern

```javascript
// backend/models/Order.js
orderSchema.methods.updateStatus = async function(newStatus, updatedBy, note) {
    // Validate transition
    // Update status
    // Add to history
    // Save
};

orderSchema.statics.getAdminStats = async function() {
    // Aggregation queries
};
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Component | PascalCase | `ProductCard.jsx` |
| Route file | camelCase + Routes | `productRoutes.js` |
| Service file | camelCase + Service | `orderService.js` |
| Model file | PascalCase | `Product.js` |
| Utility file | camelCase | `helpers.js` |
| Context | PascalCase + Context | `CartContext.jsx` |

---

## Import Order Convention

```javascript
// 1. React and hooks
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import toast from 'react-hot-toast';

// 3. Context and hooks
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// 4. Components
import ProductCard from '../components/ProductCard';

// 5. Services and utilities
import { productAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';

// 6. Icons (last)
import { ShoppingCart, Heart } from 'lucide-react';
```

---

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/routes/[domain]Routes.js`
2. Add service method in `backend/services/[domain]Service.js`
3. Add API method in `frontend/src/services/api.js`
4. Use in component

### Adding a New Feature Flag

1. Add default in `backend/config/defaults.json` under `features`
2. Check with `await configService.isFeatureEnabled('flagName')`
3. Add toggle in admin Settings page if needed

### Adding a New Admin Page

1. Create page in `frontend/src/pages/admin/`
2. Export from `frontend/src/pages/admin/index.js`
3. Add route in `frontend/src/App.jsx` under admin routes
4. Add sidebar link in `frontend/src/layouts/AdminLayout.jsx`

---

## Testing Data

**Seed Command:**
```bash
npm run seed
```

**Test Accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store.com | Admin@123456 |
| Customer | customer@test.com | Customer@123 |

**Sample Products:** 10 products across categories
**Sample Categories:** Electronics, Clothing, Books, Home & Garden
