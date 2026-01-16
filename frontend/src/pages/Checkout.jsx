import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    MapPin,
    CreditCard,
    Truck,
    Check,
    AlertCircle,
    Shield
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { paymentAPI, cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, totals, clearCart } = useCart();
    const { user } = useAuth();
    const { formatPrice } = useConfig();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [validation, setValidation] = useState({ valid: true, errors: [] });

    const [shippingAddress, setShippingAddress] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: user?.profile?.phone || '',
    });

    const [selectedPayment, setSelectedPayment] = useState('cod');

    useEffect(() => {
        validateCart();
        fetchPaymentMethods();
        loadDefaultAddress();
    }, []);

    const validateCart = async () => {
        try {
            const response = await cartAPI.validate();
            setValidation(response.data.data);
        } catch (err) {
            console.error('Cart validation failed:', err);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await paymentAPI.getMethods();
            const methods = response.data.data.methods || [];
            setPaymentMethods(methods);
            if (methods.length > 0) {
                setSelectedPayment(methods[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        }
    };

    const loadDefaultAddress = () => {
        const defaultAddress = user?.profile?.addresses?.find(a => a.isDefault && a.type === 'shipping')
            || user?.profile?.addresses?.find(a => a.isDefault)
            || user?.profile?.addresses?.[0];
        if (defaultAddress) {
            setShippingAddress({
                firstName: defaultAddress.firstName || user?.profile?.firstName || '',
                lastName: defaultAddress.lastName || user?.profile?.lastName || '',
                email: user?.email || '',
                street: defaultAddress.street || '',
                city: defaultAddress.city || '',
                state: defaultAddress.state || '',
                postalCode: defaultAddress.postalCode || '',
                country: defaultAddress.country || 'India',
                phone: defaultAddress.phone || user?.profile?.phone || '',
            });
        }
    };

    const handleAddressChange = (field, value) => {
        setShippingAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateAddress = () => {
        const required = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'postalCode', 'phone'];
        const missing = required.filter(field => !shippingAddress[field]?.trim());

        if (missing.length > 0) {
            toast.error(`Please fill in all required fields: ${missing.join(', ')}`);
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shippingAddress.email)) {
            toast.error('Please enter a valid email address');
            return false;
        }

        if (!/^\d{6}$/.test(shippingAddress.postalCode)) {
            toast.error('Please enter a valid 6-digit PIN code');
            return false;
        }

        return true;
    };

    const handleContinue = () => {
        if (step === 1 && validateAddress()) {
            setStep(2);
        }
    };

    const handlePlaceOrder = async () => {
        console.log('handlePlaceOrder called', { validation, selectedPayment });

        if (!validation.valid) {
            toast.error('Please resolve cart issues before proceeding');
            return;
        }

        setLoading(true);
        console.log('Starting checkout with payment method:', selectedPayment);

        try {
            const response = await paymentAPI.checkout({
                shippingAddress,
                paymentMethod: selectedPayment,
                shippingMethod: 'standard'
            });

            console.log('Checkout response:', response.data);
            const data = response.data.data;

            if (!data.requiresPayment) {
                // COD order placed successfully
                await clearCart();
                navigate(`/orders/${data.order._id}`, {
                    state: { orderSuccess: true }
                });
                toast.success('Order placed successfully!');
                return;
            }

            // Handle Razorpay payment
            if (data.paymentMethod === 'razorpay' && data.gatewayData) {
                console.log('Initiating Razorpay payment with data:', data.gatewayData);
                await handleRazorpayPayment(data);
            } else {
                console.error('No gateway data received for Razorpay');
                toast.error('Payment gateway not configured properly. Please try again.');
            }

        } catch (err) {
            console.error('Checkout failed:', err);
            console.error('Error response data:', err.response?.data);

            // Extract specific error message
            let errorMessage = 'Checkout failed. Please try again.';

            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                // Handle validation errors
                const validationErrors = err.response.data.errors.map(e => e.message || e.field).join(', ');
                errorMessage = `Validation error: ${validationErrors}`;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Handle Razorpay payment
    const handleRazorpayPayment = async (paymentData) => {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            toast.error('Failed to load payment gateway. Please try again.');
            return;
        }

        const { gatewayData, paymentId, orderId } = paymentData;

        const options = {
            key: gatewayData.razorpayKeyId,
            amount: gatewayData.amount,
            currency: gatewayData.currency,
            name: gatewayData.name,
            description: gatewayData.description,
            order_id: gatewayData.razorpayOrderId,
            prefill: gatewayData.prefill,
            theme: {
                color: '#2563eb'
            },
            handler: async function (response) {
                // Payment successful - verify with backend
                try {
                    setLoading(true);
                    const verifyResponse = await paymentAPI.verify(paymentId, {
                        providerPaymentId: response.razorpay_payment_id,
                        providerOrderId: response.razorpay_order_id,
                        signature: response.razorpay_signature
                    });

                    if (verifyResponse.data.success) {
                        await clearCart();
                        navigate(`/orders/${orderId}`, {
                            state: { orderSuccess: true, paymentSuccess: true }
                        });
                        toast.success('Payment successful! Order placed.');
                    }
                } catch (err) {
                    console.error('Payment verification failed:', err);
                    toast.error('Payment verification failed. Please contact support.');
                } finally {
                    setLoading(false);
                }
            },
            modal: {
                ondismiss: function () {
                    toast.error('Payment cancelled');
                    setLoading(false);
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
            toast.error(`Payment failed: ${response.error.description}`);
            setLoading(false);
        });
        razorpay.open();
    };

    if (!cart.items || cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    const steps = [
        { id: 1, name: 'Shipping', icon: Truck },
        { id: 2, name: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container-custom py-8">
                {/* Back Button */}
                <Link
                    to="/cart"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Cart
                </Link>

                {/* Steps */}
                <div className="flex items-center justify-center mb-8">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center">
                            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-primary-600' : 'text-gray-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > s.id
                                    ? 'bg-primary-600 text-white'
                                    : step === s.id
                                        ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                                        : 'bg-gray-100'
                                    }`}>
                                    {step > s.id ? <Check size={20} /> : <s.icon size={20} />}
                                </div>
                                <span className="font-medium hidden sm:inline">{s.name}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.id ? 'bg-primary-600' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Validation Errors */}
                        {!validation.valid && (
                            <div className="card p-4 mb-6 border-red-200 bg-red-50">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h3 className="font-medium text-red-800">Cart issues found</h3>
                                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                            {validation.errors?.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                        <Link to="/cart" className="text-sm text-red-600 hover:underline mt-2 inline-block">
                                            Return to cart →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Shipping Address */}
                        {step === 1 && (
                            <div className="card p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                        <MapPin className="text-primary-600" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.firstName}
                                            onChange={(e) => handleAddressChange('firstName', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.lastName}
                                            onChange={(e) => handleAddressChange('lastName', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={shippingAddress.email}
                                            onChange={(e) => handleAddressChange('email', e.target.value)}
                                            className="input-field"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="input-field"
                                            placeholder="House no., Building, Street, Area"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.state}
                                            onChange={(e) => handleAddressChange('state', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            PIN Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.postalCode}
                                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                            className="input-field"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={shippingAddress.phone}
                                            onChange={(e) => handleAddressChange('phone', e.target.value)}
                                            className="input-field"
                                            placeholder="+91 XXXXX XXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleContinue}
                                        className="btn-primary px-8 py-3"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <div className="card p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                        <CreditCard className="text-primary-600" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                                </div>

                                {/* Shipping Address Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {shippingAddress.firstName} {shippingAddress.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {shippingAddress.street}<br />
                                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                                                Phone: {shippingAddress.phone}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-primary-600 text-sm hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="space-y-3">
                                    {paymentMethods.map(method => (
                                        <label
                                            key={method.id}
                                            className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedPayment === method.id
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={method.id}
                                                checked={selectedPayment === method.id}
                                                onChange={() => setSelectedPayment(method.id)}
                                                className="w-5 h-5 text-primary-600"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{method.name}</p>
                                                <p className="text-sm text-gray-500">{method.description}</p>
                                            </div>
                                            {method.extraCharge > 0 && (
                                                <span className="text-sm text-gray-500">
                                                    +{formatPrice(method.extraCharge)}
                                                </span>
                                            )}
                                        </label>
                                    ))}

                                    {paymentMethods.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No payment methods available.</p>
                                            <p className="text-sm">Please try again later.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="btn-secondary px-6 py-3"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading || !validation.valid}
                                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={20} />
                                                Place Order - {formatPrice(totals.total)}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                            {/* Items */}
                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                {cart.items?.map(item => (
                                    <div key={item._id} className="flex gap-3">
                                        <img
                                            src={item.image || item.product?.primaryImage || 'https://placehold.co/100x100/e2e8f0/475569'}
                                            alt={item.productName}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 truncate">{item.productName}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-medium">{formatPrice((item.priceAtAdd || item.product?.price || 0) * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(totals.subtotal)}</span>
                                </div>
                                {totals.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatPrice(totals.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping</span>
                                    <span>{totals.shippingCost > 0 ? formatPrice(totals.shippingCost) : 'Free'}</span>
                                </div>
                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Tax</span>
                                        <span>{formatPrice(totals.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{formatPrice(totals.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
