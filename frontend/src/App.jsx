import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Error Handling
import ErrorBoundary from './components/ErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'
import { PageLoader } from './components/LoadingSpinner'

// Layouts (keep eager for shell)
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'

// ALL pages lazy-loaded for optimal bundle splitting
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const Account = lazy(() => import('./pages/account/Account'))
const Orders = lazy(() => import('./pages/account/Orders'))
const OrderDetail = lazy(() => import('./pages/account/OrderDetail'))

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/ProductList'))
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm'))
const AdminOrders = lazy(() => import('./pages/admin/OrderList'))
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'))
const AdminCustomers = lazy(() => import('./pages/admin/CustomerList'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminCustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'))
const AdminFeatureCards = lazy(() => import('./pages/admin/FeatureCards'))
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'))

// Policy Pages (lazy loaded)
const ShippingPolicy = lazy(() => import('./pages/policies/ShippingPolicy'))
const ReturnPolicy = lazy(() => import('./pages/policies/ReturnPolicy'))
const PrivacyPolicy = lazy(() => import('./pages/policies/PrivacyPolicy'))
const TermsConditions = lazy(() => import('./pages/policies/TermsConditions'))

// Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ScrollToTop from './components/ScrollToTop'

function App() {
    return (
        <ErrorBoundary>
            <OfflineIndicator />
            <ScrollToTop />

            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:slug" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/account" element={<Account />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/orders/:id" element={<OrderDetail />} />
                        </Route>

                        {/* Policy Routes */}
                        <Route path="/shipping-policy" element={<ShippingPolicy />} />
                        <Route path="/return-policy" element={<ReturnPolicy />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsConditions />} />

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="products/new" element={<AdminProductForm />} />
                            <Route path="products/:id/edit" element={<AdminProductForm />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="orders/:id" element={<AdminOrderDetail />} />
                            <Route path="customers" element={<AdminCustomers />} />
                            <Route path="customers/:id" element={<AdminCustomerDetail />} />
                            <Route path="feature-cards" element={<AdminFeatureCards />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="revenue" element={<AdminRevenue />} />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
        </ErrorBoundary>
    )
}

export default App
