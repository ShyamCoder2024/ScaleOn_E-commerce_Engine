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

        // Optimizing Razorpay Overlay for Mobile
        // Strategy: Use MutationObserver to detect when Razorpay appends its container to the body.
        // This is robust against network delays or library quirks.
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if the node itself is the container or contains it
                        const container = node.classList.contains('razorpay-container') ? node : node.querySelector('.razorpay-container');

                        if (container) {
                            // Force immediate styling
                            container.classList.add('razorpay-mobile-fix');

                            // Also force style properties directly to be safe against inline rewrites
                            container.style.setProperty('position', 'fixed', 'important');
                            container.style.setProperty('top', '0', 'important');
                            container.style.setProperty('left', '0', 'important');
                            container.style.setProperty('width', '100vw', 'important');
                            container.style.setProperty('height', '100dvh', 'important');
                            container.style.setProperty('z-index', '2147483647', 'important');
                            container.style.setProperty('display', 'block', 'important');

                            // Disconnect observer once found to save resources
                            // But wait a bit to ensure it doesn't get overwritten immediately
                            setTimeout(() => observer.disconnect(), 2000);
                        }
                    }
                });
            });
        });

        // Start observing the document body for added nodes
        observer.observe(document.body, { childList: true, subtree: true });

        // Backup constraint: Check manually after a delay just in case
        setTimeout(() => {
            const container = document.querySelector('.razorpay-container');
            if (container) {
                container.classList.add('razorpay-mobile-fix');
            }
        }, 1000);
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
        <div className="bg-gray-50/50 min-h-screen pb-12">
            <div className="container-custom py-4 sm:py-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to="/cart"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Cart
                    </Link>

                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Shield size={14} className="text-emerald-500" />
                        <span className="text-emerald-600">Secure Checkout</span>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 sm:mb-12">
                    <div className="flex items-center justify-center relative">
                        {/* Connecting Line */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-1 bg-gray-200 rounded-full -z-10" />

                        <div className="flex items-center gap-12 sm:gap-24">
                            {steps.map((s) => {
                                const isActive = step >= s.id;
                                const isCurrent = step === s.id;
                                return (
                                    <div key={s.id} className="flex flex-col items-center gap-3 bg-gray-50 px-4">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-blue-500/30 scale-110'
                                                : 'bg-white text-gray-400 border border-gray-200'
                                            }
                                        `}>
                                            {step > s.id ? <Check size={22} strokeWidth={3} /> : <s.icon size={22} />}
                                        </div>
                                        <span className={`text-sm font-bold tracking-wide ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {s.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Main Form Area */}
                    <div className="lg:col-span-8">
                        {/* Validation Issues - Clean Alert */}
                        {!validation.valid && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-600">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-rose-900">Please review your cart</h3>
                                    <ul className="mt-1 text-sm text-rose-700 space-y-1">
                                        {validation.errors?.map((error, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <span className="w-1 h-1 bg-rose-500 rounded-full" />
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/cart" className="text-sm font-semibold text-rose-600 hover:text-rose-700 mt-2 inline-block">
                                        Fix issues in cart →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Shipping Address */}
                        {step === 1 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2.5">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs shadow-sm shadow-blue-200">1</span>
                                        Shipping Details
                                    </h2>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-100">Step 1 of 2</span>
                                </div>

                                <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">First Name</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.firstName}
                                            onChange={(e) => handleAddressChange('firstName', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Last Name</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.lastName}
                                            onChange={(e) => handleAddressChange('lastName', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={shippingAddress.email}
                                            onChange={(e) => handleAddressChange('email', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="john.doe@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Street Address</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="House no., Building, Area"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">City</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="City"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">State</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.state}
                                            onChange={(e) => handleAddressChange('state', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="State"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">PIN Code</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.postalCode}
                                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                            placeholder="000000"
                                            maxLength={6}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Phone</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">+91</span>
                                            <input
                                                type="tel"
                                                value={shippingAddress.phone}
                                                onChange={(e) => handleAddressChange('phone', e.target.value)}
                                                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:shadow-sm"
                                                placeholder="98765 43210"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2 pt-4">
                                        <button
                                            onClick={handleContinue}
                                            className="w-full btn-primary py-3.5 text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all rounded-xl"
                                        >
                                            Continue to Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2.5">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs shadow-sm shadow-blue-200">2</span>
                                        Payment Method
                                    </h2>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-100">Step 2 of 2</span>
                                </div>

                                <div className="p-5">
                                    {/* Shipping Summary Card */}
                                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {shippingAddress.firstName} {shippingAddress.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                                                    {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all whitespace-nowrap"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-0.5">Select Payment Method</h3>

                                    <div className="grid gap-3 mb-6">
                                        {paymentMethods.map(method => (
                                            <label
                                                key={method.id}
                                                className={`
                                                    relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                                                    ${selectedPayment === method.id
                                                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20'
                                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value={method.id}
                                                    checked={selectedPayment === method.id}
                                                    onChange={() => setSelectedPayment(method.id)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center justify-between pointer-events-none">
                                                        <span className={`font-bold text-sm ${selectedPayment === method.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            {method.name}
                                                        </span>
                                                        {method.extraCharge > 0 && (
                                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                                +{formatPrice(method.extraCharge)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs mt-0.5 ${selectedPayment === method.id ? 'text-blue-700' : 'text-gray-500'} group-hover:text-gray-600`}>
                                                        {method.description}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}

                                        {paymentMethods.length === 0 && (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                <p className="text-xs text-gray-500 font-medium">No payment methods available right now.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 text-sm transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={loading || !validation.valid}
                                            className="flex-1 btn-primary py-3.5 text-base font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-xl"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-medium">Pay</span>
                                                    {formatPrice(totals.total)}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                                Order Summary
                            </h3>

                            {/* Items List */}
                            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {cart.items?.map(item => (
                                    <div key={item._id} className="flex gap-4 group">
                                        <div className="w-16 h-16 bg-gray-50 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                                            <img
                                                src={item.image || item.product?.primaryImage || 'https://placehold.co/100x100/e2e8f0/475569'}
                                                alt={item.productName}
                                                className="w-full h-full object-contain p-1 mix-blend-multiply group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate mb-1">{item.productName}</p>
                                            <p className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded-md">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatPrice((item.priceAtAdd || item.product?.price || 0) * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span className="font-medium">Subtotal</span>
                                    <span className="font-bold text-gray-900">{formatPrice(totals.subtotal)}</span>
                                </div>
                                {totals.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span className="font-medium">Discount</span>
                                        <span className="font-bold">-{formatPrice(totals.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span className="font-medium">Shipping</span>
                                    <span className="font-bold text-gray-900">{totals.shippingCost > 0 ? formatPrice(totals.shippingCost) : 'Free'}</span>
                                </div>
                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span className="font-medium">Tax</span>
                                        <span className="font-bold text-gray-900">{formatPrice(totals.taxAmount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-900/10 pt-4 mt-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-base font-bold text-gray-900">Total to Pay</span>
                                        <span className="text-2xl font-bold text-blue-600 tracking-tight">{formatPrice(totals.total)}</span>
                                    </div>
                                    <p className="text-right text-xs text-gray-400 mt-1 font-medium">Includes all taxes</p>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 flex justify-center gap-4 text-slate-300">
                            <Shield size={24} />
                            <div className="h-6 w-px bg-slate-200" />
                            <CreditCard size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
