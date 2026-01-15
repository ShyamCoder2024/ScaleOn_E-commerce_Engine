# ScaleOn Commerce Engine - Frontend Guide

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool |
| React Router 6 | Routing |
| TailwindCSS | Styling |
| Lucide React | Icons |
| React Hot Toast | Notifications |
| Axios | HTTP client |

---

## Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.jsx
│   ├── LoadingSpinner.jsx
│   ├── OfflineIndicator.jsx
│   ├── ProductCard.jsx
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
│
├── context/             # React Context providers
│   ├── AuthContext.jsx  # User auth state
│   ├── CartContext.jsx  # Shopping cart state
│   └── ConfigContext.jsx # Store configuration
│
├── layouts/             # Page layouts
│   ├── MainLayout.jsx   # Customer pages
│   └── AdminLayout.jsx  # Admin panel
│
├── pages/               # Route components
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── NotFound.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── account/
│   │   ├── Account.jsx
│   │   ├── Orders.jsx
│   │   └── OrderDetail.jsx
│   └── admin/
│       ├── Dashboard.jsx
│       ├── ProductList.jsx
│       ├── ProductForm.jsx
│       ├── OrderList.jsx
│       ├── AdminOrderDetail.jsx
│       ├── CustomerList.jsx
│       ├── Settings.jsx
│       └── index.js
│
├── services/            # API client
│   └── api.js           # Axios instance + all API methods
│
├── utils/               # Helper functions
│   ├── helpers.js       # Formatting, parsing
│   └── security.js      # Sanitization, validation
│
├── App.jsx              # Root component with routes
├── main.jsx             # Entry point
└── index.css            # Global styles + Tailwind
```

---

## Context Usage

### AuthContext

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
    const { 
        user,           // Current user object or null
        isAuthenticated, // Boolean
        isAdmin,        // Boolean
        loading,        // Initial loading state
        login,          // async (email, password) => result
        logout,         // async () => void
        register,       // async (data) => result
        updateProfile   // async (data) => result
    } = useAuth();
}
```

### CartContext

```javascript
import { useCart } from '../context/CartContext';

function MyComponent() {
    const {
        cart,           // { items: [...] }
        totals,         // { subtotal, shipping, tax, discount, total }
        loading,        // Boolean
        addToCart,      // async (productId, quantity, variant) => result
        updateQuantity, // async (itemId, quantity) => result
        removeItem,     // async (itemId) => result
        clearCart,      // async () => result
        applyDiscount,  // async (code) => result
        removeDiscount  // async () => result
    } = useCart();
}
```

### ConfigContext

```javascript
import { useConfig } from '../context/ConfigContext';

function MyComponent() {
    const {
        config,          // Full config object
        loading,         // Boolean
        formatPrice,     // (amount) => "₹1,234.00"
        isFeatureEnabled // (featureName) => boolean
    } = useConfig();
}
```

---

## Routing

### Public Routes (MainLayout)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page |
| `/products` | Products | Product listing |
| `/products/:slug` | ProductDetail | Single product |
| `/cart` | Cart | Shopping cart |
| `/login` | Login | User login |
| `/register` | Register | User registration |
| `/forgot-password` | ForgotPassword | Password reset |

### Protected Routes (MainLayout + ProtectedRoute)

| Path | Component | Description |
|------|-----------|-------------|
| `/checkout` | Checkout | Checkout flow |
| `/account` | Account | User profile |
| `/orders` | Orders | Order history |
| `/orders/:id` | OrderDetail | Order details |

### Admin Routes (AdminLayout + AdminRoute)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | Dashboard | Admin dashboard |
| `/admin/products` | ProductList | Product management |
| `/admin/products/new` | ProductForm | Create product |
| `/admin/products/:id/edit` | ProductForm | Edit product |
| `/admin/orders` | OrderList | Order management |
| `/admin/orders/:id` | AdminOrderDetail | Order details |
| `/admin/customers` | CustomerList | Customer management |
| `/admin/settings` | Settings | Store settings |

---

## Component Patterns

### Page Component Template

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const MyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const response = await productAPI.getById(id);
            setData(response.data.data);
        } catch (err) {
            toast.error('Failed to load data');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {/* Page content */}
        </div>
    );
};

export default MyPage;
```

### Loading State Pattern

```jsx
if (loading) {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
        </div>
    );
}
```

### Error Handling Pattern

```jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await productAPI.create(formData);
        toast.success('Product created');
        navigate('/admin/products');
    } catch (err) {
        // Error toast is shown by API interceptor
        // Additional error handling if needed
    } finally {
        setLoading(false);
    }
};
```

---

## Styling Guide

### TailwindCSS Classes Used

```
// Layout
container-custom    - Custom container max-width
card               - White card with shadow

// Buttons
btn-primary        - Blue primary button
btn-secondary      - Gray secondary button

// Forms
input-field        - Styled input field

// Colors (from tailwind.config.js)
primary-50 to primary-900
```

### Responsive Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Common Patterns

```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Flex with responsive
<div className="flex flex-col md:flex-row items-center gap-4">

// Hide/show on breakpoint
<span className="hidden md:inline">Desktop Text</span>
<span className="md:hidden">Mobile Text</span>
```

---

## API Usage

### Making API Calls

```javascript
import { productAPI, orderAPI, cartAPI } from '../services/api';

// GET request
const response = await productAPI.getProducts({ page: 1, limit: 12 });
const products = response.data.data.products;

// POST request
const result = await cartAPI.addItem(productId, quantity);
if (result.data.success) {
    // Handle success
}

// Error handling is automatic via interceptor
// Errors show toast and are re-thrown
```

### API Services Available

```javascript
authAPI     // Authentication
productAPI  // Products
categoryAPI // Categories
cartAPI     // Shopping cart
orderAPI    // Orders
paymentAPI  // Payments
configAPI   // Configuration
adminAPI    // Admin operations
```

---

## State Management Rules

### DO:
- Use Context for global state (auth, cart, config)
- Use local state for UI-only state (modals, form inputs)
- Fetch data in useEffect
- Handle loading and error states

### DON'T:
- Calculate prices/totals in frontend
- Store sensitive data in localStorage
- Make direct state mutations
- Skip error handling

---

## Adding New Features

### New Page Checklist

1. Create page component in `pages/`
2. Add route in `App.jsx`
3. Add navigation link if needed
4. Handle loading and error states
5. Use proper Context hooks

### New Component Checklist

1. Create component in `components/`
2. Accept props with defaults
3. Handle edge cases (null, empty)
4. Add loading state if async
5. Use semantic HTML
