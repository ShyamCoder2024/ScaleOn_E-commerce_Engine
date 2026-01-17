import { useState, useEffect } from 'react';
import {
    Save, CreditCard, ToggleLeft, ToggleRight,
    Store, Truck, Settings2, AlertCircle, FileText, Eye
} from 'lucide-react';
import { configAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

const FeatureToggle = ({ name, description, enabled, onToggle, loading }) => (
    <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-xl transition-colors hover:border-slate-200">
        <div className="flex-1 pr-4">
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
        <button
            onClick={onToggle}
            disabled={loading}
            className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-opacity disabled:opacity-50"
        >
            {enabled ? (
                <ToggleRight className="w-12 h-12 text-blue-600 transition-colors" />
            ) : (
                <ToggleLeft className="w-12 h-12 text-slate-300 transition-colors hover:text-slate-400" />
            )}
        </button>
    </div>
);

// Policy Toggle Component
const PolicyToggle = ({ label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <div className="flex-1 pr-4">
            <p className="font-medium text-slate-900">{label}</p>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        <button onClick={() => onChange(!enabled)} type="button">
            {enabled ? (
                <ToggleRight className="w-10 h-10 text-blue-600" />
            ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
            )}
        </button>
    </div>
);

// Policy generation functions
const generateReturnPolicyText = (policy, storeName = 'our store') => {
    if (!policy?.allowed) {
        return `${storeName} does not accept returns or exchanges at this time. All sales are final. Please review your order carefully before completing your purchase.`;
    }

    const conditionText = policy.condition === 'unused'
        ? 'unused and in their original packaging with all tags attached'
        : 'in any condition';

    const shippingCostText = {
        'customer': 'The customer is responsible for return shipping costs',
        'store': 'We will provide a prepaid return label',
        'free': 'Free return shipping is included'
    }[policy.shippingCost] || 'The customer is responsible for return shipping costs';

    const refundMethodText = policy.refundMethod === 'original'
        ? 'your original payment method'
        : 'store credit';

    let text = `**Returns**\n\nWe accept returns within ${policy.windowDays} days of delivery. Items must be ${conditionText}.\n\n${shippingCostText}. Once we receive and inspect your return, refunds will be processed to ${refundMethodText} within 5-7 business days.`;

    if (policy.exchangeAllowed) {
        text += `\n\n**Exchanges**\n\nExchanges are available within ${policy.exchangeWindowDays} days of delivery. To request an exchange, please contact our customer support team.`;
    }

    text += `\n\n**How to Initiate a Return**\n\n1. Contact our customer support with your order number\n2. Receive return authorization and instructions\n3. Ship the item back to us\n4. Receive your refund once the return is processed`;

    return text;
};

const generatePrivacyPolicyText = (policy, storeName = 'our store') => {
    let text = `**Information We Collect**\n\n`;

    const collectedItems = [];
    if (policy?.collectEmail) collectedItems.push('email addresses');
    if (policy?.collectPhone) collectedItems.push('phone numbers');
    collectedItems.push('shipping addresses', 'order history');

    text += `We collect ${collectedItems.join(', ')} to process your orders and provide customer support.\n\n`;

    text += `**How We Use Your Information**\n\n`;
    text += `Your personal information is used to:\n- Process and fulfill your orders\n- Send order confirmations and shipping updates\n- Provide customer support\n- Improve our services\n\n`;

    text += `**Data Sharing**\n\n`;
    if (policy?.shareData) {
        text += `We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, or serving our users.\n\n`;
    } else {
        text += `We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.\n\n`;
    }

    text += `**Cookies**\n\n`;
    if (policy?.useCookies) {
        text += `This website uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. By using our site, you consent to our use of cookies.\n\n`;
    } else {
        text += `This website does not use tracking cookies.\n\n`;
    }

    text += `**Payment Security**\n\n`;
    if (policy?.storePayment) {
        text += `For your convenience, we securely store payment information using industry-standard encryption. You can manage your saved payment methods in your account settings.`;
    } else {
        text += `We do not store your payment card information. All payment processing is handled securely by our payment partners.`;
    }

    return text;
};

const generateTermsText = (policy, storeName = 'our store') => {
    let text = `**Eligibility**\n\n`;
    text += `You must be at least ${policy?.minAge || 18} years old to make purchases on this website.\n\n`;

    text += `**Account Requirements**\n\n`;
    if (policy?.accountRequired) {
        text += `An account is required to complete checkout. Creating an account allows you to track orders, save addresses, and enjoy a faster checkout experience.\n\n`;
    } else {
        text += `Guest checkout is available. However, creating an account allows you to track orders, save addresses, and enjoy a faster checkout experience.\n\n`;
    }

    text += `**Order Cancellation**\n\n`;
    if (policy?.cancelBeforeShipping) {
        text += `Orders can be cancelled before they are shipped. Once an order has been shipped, it cannot be cancelled, but you may initiate a return.\n\n`;
    } else {
        text += `Orders cannot be cancelled once placed. Please review your order carefully before completing your purchase.\n\n`;
    }

    text += `**Pricing and Availability**\n\n`;
    text += `All prices are displayed in the store's currency and include applicable taxes unless otherwise stated. Product availability is subject to change without notice.\n\n`;

    text += `**Intellectual Property**\n\n`;
    text += `All content on this website, including images, text, and logos, is protected by copyright and other intellectual property rights.`;

    return text;
};

const SettingsPage = () => {
    const { refetchConfig } = useConfig();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('store');
    const [policySubTab, setPolicySubTab] = useState('return');
    const [showPreview, setShowPreview] = useState(false);

    const [config, setConfig] = useState({
        store: { name: '', logo: '', description: '', email: '', phone: '', currency: 'INR', currencySymbol: '₹' },
        business: { minOrderValue: 0, maxOrderQuantity: 10 },
        shipping: { method: 'flat', flatRate: 0, freeThreshold: 0 },
        tax: { enabled: false, rate: 0 },
        payment: { providers: { cod: { enabled: true }, razorpay: { enabled: false }, stripe: { enabled: false } } },
        policies: {
            return: { allowed: true, windowDays: 7, exchangeAllowed: true, exchangeWindowDays: 7, shippingCost: 'customer', refundMethod: 'original', condition: 'unused' },
            privacy: { collectEmail: true, collectPhone: true, shareData: false, useCookies: true, storePayment: false },
            terms: { minAge: 18, accountRequired: false, cancelBeforeShipping: true }
        }
    });

    const [features, setFeatures] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [configRes, featuresRes] = await Promise.all([
                configAPI.getConfig(),
                configAPI.getAdminFeatures()
            ]);

            if (configRes.data.data?.config) {
                setConfig(prev => ({ ...prev, ...configRes.data.data.config }));
            }

            if (featuresRes.data.data?.features) {
                setFeatures(featuresRes.data.data.features);
            } else if (featuresRes.data.data) {
                setFeatures(featuresRes.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (section, field, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleNestedChange = (section, nested, field, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [nested]: { ...prev[section]?.[nested], [field]: value }
            }
        }));
    };

    const handlePolicyChange = (policyType, field, value) => {
        setConfig(prev => ({
            ...prev,
            policies: {
                ...prev.policies,
                [policyType]: { ...prev.policies?.[policyType], [field]: value }
            }
        }));
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const configs = [
                { key: 'store.name', value: config.store?.name || '', type: 'branding' },
                { key: 'store.logo', value: config.store?.logo || '', type: 'branding' },
                { key: 'store.email', value: config.store?.email || '', type: 'branding' },
                { key: 'store.phone', value: config.store?.phone || '', type: 'branding' },
                { key: 'business.currency', value: config.business?.currency || 'INR', type: 'business_rule' },
                { key: 'business.minOrderValue', value: config.business?.minOrderValue || 0, type: 'business_rule' },
                { key: 'business.maxQuantityPerItem', value: config.business?.maxQuantityPerItem || 10, type: 'business_rule' },
                { key: 'shipping.method', value: config.shipping?.method || 'flat', type: 'shipping' },
                { key: 'shipping.flatRate', value: config.shipping?.flatRate || 0, type: 'shipping' },
                { key: 'shipping.freeThreshold', value: config.shipping?.freeThreshold || 0, type: 'shipping' },
                { key: 'tax.enabled', value: config.tax?.enabled ?? false, type: 'tax' },
                { key: 'tax.rate', value: parseFloat(config.tax?.rate) || 0, type: 'tax' },
                { key: 'payment.providers.cod.enabled', value: config.payment?.providers?.cod?.enabled ?? true, type: 'payment' },
                { key: 'payment.providers.razorpay.enabled', value: config.payment?.providers?.razorpay?.enabled ?? false, type: 'payment' },
                { key: 'payment.providers.stripe.enabled', value: config.payment?.providers?.stripe?.enabled ?? false, type: 'payment' },
                // Policy configs
                { key: 'policies.return', value: config.policies?.return || {}, type: 'policy' },
                { key: 'policies.privacy', value: config.policies?.privacy || {}, type: 'policy' },
                { key: 'policies.terms', value: config.policies?.terms || {}, type: 'policy' }
            ];

            await configAPI.updateConfig({ configs });
            toast.success('Settings saved successfully');
            refetchConfig();
        } catch (err) {
            console.error('Failed to save config:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleFeatureToggle = async (featureName) => {
        const currentState = features[featureName]?.enabled || false;
        try {
            await configAPI.toggleFeature(featureName, !currentState);
            setFeatures(prev => ({
                ...prev,
                [featureName]: { ...prev[featureName], enabled: !currentState }
            }));
            await refetchConfig();
            toast.success(`${featureName} ${!currentState ? 'enabled' : 'disabled'}`);
        } catch (err) {
            toast.error('Failed to toggle feature');
        }
    };

    const getPreviewText = () => {
        const storeName = config.store?.name || 'Our Store';
        switch (policySubTab) {
            case 'return':
                return generateReturnPolicyText(config.policies?.return, storeName);
            case 'privacy':
                return generatePrivacyPolicyText(config.policies?.privacy, storeName);
            case 'terms':
                return generateTermsText(config.policies?.terms, storeName);
            default:
                return '';
        }
    };

    const tabs = [
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'shipping', label: 'Shipping & Tax', icon: Truck },
        { id: 'payment', label: 'Payment Methods', icon: CreditCard },
        { id: 'policies', label: 'Policies', icon: FileText },
        { id: 'features', label: 'Feature Flags', icon: Settings2 }
    ];

    const policyTabs = [
        { id: 'return', label: 'Return Policy' },
        { id: 'privacy', label: 'Privacy Policy' },
        { id: 'terms', label: 'Terms & Conditions' }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage global store configuration</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 font-semibold transition-all active:scale-95"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar / Mobile Tabs */}
                <div className="lg:w-64 shrink-0">
                    <nav className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-0'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 lg:border-transparent hover:text-slate-900'
                                    }
                                `}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                                <span className="truncate">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {activeTab === 'store' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Brand Identity</h2>
                                    <p className="text-sm text-slate-500 mb-6">Upload your store's logo and branding assets</p>
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                                            <ImageUpload
                                                value={config.store?.logo || ''}
                                                onChange={(url) => handleConfigChange('store', 'logo', url)}
                                                folder="logos"
                                                label="Store Logo"
                                                placeholder="Upload Logo"
                                                maxSize={2}
                                                showUrlInput={true}
                                            />
                                            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                                                <AlertCircle size={14} />
                                                <span>Recommended: 200x80px PNG with transparent background</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Store Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Store Name</label>
                                            <input
                                                type="text"
                                                value={config.store?.name || ''}
                                                onChange={(e) => handleConfigChange('store', 'name', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                                placeholder="e.g. My Awesome Store"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Currency</label>
                                            <select
                                                value={config.store?.currency || 'INR'}
                                                onChange={(e) => handleConfigChange('store', 'currency', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                            >
                                                <option value="INR">Indian Rupee (₹)</option>
                                                <option value="USD">US Dollar ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Support Email</label>
                                            <input
                                                type="email"
                                                value={config.store?.email || ''}
                                                onChange={(e) => handleConfigChange('store', 'email', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="support@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Support Phone</label>
                                            <input
                                                type="tel"
                                                value={config.store?.phone || ''}
                                                onChange={(e) => handleConfigChange('store', 'phone', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Business Rules</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Min Order Value</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                <input
                                                    type="number"
                                                    value={config.business?.minOrderValue || 0}
                                                    onChange={(e) => handleConfigChange('business', 'minOrderValue', parseInt(e.target.value) || 0)}
                                                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Max Qty Per Item</label>
                                            <input
                                                type="number"
                                                value={config.business?.maxOrderQuantity || 10}
                                                onChange={(e) => handleConfigChange('business', 'maxOrderQuantity', parseInt(e.target.value) || 10)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Shipping Configuration</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Shipping Method</label>
                                            <select
                                                value={config.shipping?.method || 'flat'}
                                                onChange={(e) => handleConfigChange('shipping', 'method', e.target.value)}
                                                className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            >
                                                <option value="free">Free Shipping (All Orders)</option>
                                                <option value="flat">Flat Rate Shipping</option>
                                                <option value="tiered">Tiered Pricing (Weight/Value)</option>
                                            </select>
                                        </div>

                                        {config.shipping?.method === 'flat' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Flat Rate Amount</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                        <input
                                                            type="number"
                                                            value={config.shipping?.flatRate ? config.shipping.flatRate / 100 : 0}
                                                            onChange={(e) => handleConfigChange('shipping', 'flatRate', Math.round(parseFloat(e.target.value) * 100) || 0)}
                                                            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Free Shipping Above</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                        <input
                                                            type="number"
                                                            value={config.shipping?.freeThreshold ? config.shipping.freeThreshold / 100 : 0}
                                                            onChange={(e) => handleConfigChange('shipping', 'freeThreshold', Math.round(parseFloat(e.target.value) * 100) || 0)}
                                                            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                            min="0"
                                                            placeholder="0 = disabled"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500">Leave 0 to disable free shipping threshold</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">Tax Settings</h2>
                                            <p className="text-sm text-slate-500">Enable tax calculation at checkout</p>
                                        </div>
                                        <button
                                            onClick={() => handleConfigChange('tax', 'enabled', !config.tax?.enabled)}
                                            className="ml-4"
                                        >
                                            {config.tax?.enabled ? (
                                                <ToggleRight className="w-10 h-10 text-blue-600" />
                                            ) : (
                                                <ToggleLeft className="w-10 h-10 text-slate-300" />
                                            )}
                                        </button>
                                    </div>

                                    {config.tax?.enabled && (
                                        <div className="max-w-xs animate-in fade-in slide-in-from-top-1">
                                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tax Rate (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={config.tax?.rate || 0}
                                                    onChange={(e) => handleConfigChange('tax', 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">Payment Gateways</h2>
                                <p className="text-sm text-slate-500 mb-6">Manage how customers pay for orders</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                                                💵
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">Cash on Delivery</p>
                                                <p className="text-sm text-slate-500">Pay when order arrives</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleNestedChange('payment', 'providers', 'cod', { enabled: !config.payment?.providers?.cod?.enabled })}
                                        >
                                            {config.payment?.providers?.cod?.enabled ? (
                                                <ToggleRight className="w-12 h-12 text-blue-600" />
                                            ) : (
                                                <ToggleLeft className="w-12 h-12 text-slate-300" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors opacity-90">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#0c243b] rounded-xl flex items-center justify-center shadow-inner">
                                                <span className="text-lg font-bold text-blue-400">R</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 flex items-center gap-2">
                                                    Razorpay
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold rounded-full">Setup Required</span>
                                                </p>
                                                <p className="text-sm text-slate-500">Cards, UPI, Netbanking</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleNestedChange('payment', 'providers', 'razorpay', { enabled: !config.payment?.providers?.razorpay?.enabled })}
                                        >
                                            {config.payment?.providers?.razorpay?.enabled ? (
                                                <ToggleRight className="w-12 h-12 text-blue-600" />
                                            ) : (
                                                <ToggleLeft className="w-12 h-12 text-slate-300" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors opacity-90">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center shadow-inner">
                                                <span className="text-lg font-bold text-white">S</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 flex items-center gap-2">
                                                    Stripe
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold rounded-full">Setup Required</span>
                                                </p>
                                                <p className="text-sm text-slate-500">International Payments</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleNestedChange('payment', 'providers', 'stripe', { enabled: !config.payment?.providers?.stripe?.enabled })}
                                        >
                                            {config.payment?.providers?.stripe?.enabled ? (
                                                <ToggleRight className="w-12 h-12 text-blue-600" />
                                            ) : (
                                                <ToggleLeft className="w-12 h-12 text-slate-300" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'policies' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Store Policies</h2>
                                    <p className="text-sm text-slate-500">Configure your store's legal policies. Text is auto-generated from your settings.</p>
                                </div>

                                {/* Policy Sub-Tabs */}
                                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                                    {policyTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setPolicySubTab(tab.id); setShowPreview(false); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${policySubTab === tab.id
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Return Policy Form */}
                                {policySubTab === 'return' && !showPreview && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <PolicyToggle
                                            label="Accept Returns"
                                            description="Allow customers to return purchased items"
                                            enabled={config.policies?.return?.allowed}
                                            onChange={(val) => handlePolicyChange('return', 'allowed', val)}
                                        />

                                        {config.policies?.return?.allowed && (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-semibold text-slate-700">Return Window (Days)</label>
                                                        <input
                                                            type="number"
                                                            value={config.policies?.return?.windowDays || 7}
                                                            onChange={(e) => handlePolicyChange('return', 'windowDays', parseInt(e.target.value) || 7)}
                                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                            min="1"
                                                            max="365"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-semibold text-slate-700">Item Condition Required</label>
                                                        <select
                                                            value={config.policies?.return?.condition || 'unused'}
                                                            onChange={(e) => handlePolicyChange('return', 'condition', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                        >
                                                            <option value="unused">Unused / Original Packaging</option>
                                                            <option value="any">Any Condition</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <PolicyToggle
                                                    label="Allow Exchanges"
                                                    description="Let customers exchange items for different sizes/colors"
                                                    enabled={config.policies?.return?.exchangeAllowed}
                                                    onChange={(val) => handlePolicyChange('return', 'exchangeAllowed', val)}
                                                />

                                                {config.policies?.return?.exchangeAllowed && (
                                                    <div className="space-y-1.5 max-w-xs">
                                                        <label className="text-sm font-semibold text-slate-700">Exchange Window (Days)</label>
                                                        <input
                                                            type="number"
                                                            value={config.policies?.return?.exchangeWindowDays || 7}
                                                            onChange={(e) => handlePolicyChange('return', 'exchangeWindowDays', parseInt(e.target.value) || 7)}
                                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                            min="1"
                                                            max="365"
                                                        />
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-semibold text-slate-700">Return Shipping Cost</label>
                                                        <select
                                                            value={config.policies?.return?.shippingCost || 'customer'}
                                                            onChange={(e) => handlePolicyChange('return', 'shippingCost', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                        >
                                                            <option value="customer">Customer Pays</option>
                                                            <option value="store">Store Pays</option>
                                                            <option value="free">Free Returns</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-semibold text-slate-700">Refund Method</label>
                                                        <select
                                                            value={config.policies?.return?.refundMethod || 'original'}
                                                            onChange={(e) => handlePolicyChange('return', 'refundMethod', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                        >
                                                            <option value="original">Original Payment Method</option>
                                                            <option value="credit">Store Credit</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Privacy Policy Form */}
                                {policySubTab === 'privacy' && !showPreview && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <PolicyToggle
                                            label="Collect Email Addresses"
                                            description="Required for order confirmations and updates"
                                            enabled={config.policies?.privacy?.collectEmail}
                                            onChange={(val) => handlePolicyChange('privacy', 'collectEmail', val)}
                                        />
                                        <PolicyToggle
                                            label="Collect Phone Numbers"
                                            description="For delivery updates and customer support"
                                            enabled={config.policies?.privacy?.collectPhone}
                                            onChange={(val) => handlePolicyChange('privacy', 'collectPhone', val)}
                                        />
                                        <PolicyToggle
                                            label="Share Data with Third Parties"
                                            description="Share customer data with analytics and marketing partners"
                                            enabled={config.policies?.privacy?.shareData}
                                            onChange={(val) => handlePolicyChange('privacy', 'shareData', val)}
                                        />
                                        <PolicyToggle
                                            label="Use Cookies"
                                            description="For analytics, session management, and personalization"
                                            enabled={config.policies?.privacy?.useCookies}
                                            onChange={(val) => handlePolicyChange('privacy', 'useCookies', val)}
                                        />
                                        <PolicyToggle
                                            label="Store Payment Information"
                                            description="Save cards for faster checkout (requires PCI compliance)"
                                            enabled={config.policies?.privacy?.storePayment}
                                            onChange={(val) => handlePolicyChange('privacy', 'storePayment', val)}
                                        />
                                    </div>
                                )}

                                {/* Terms & Conditions Form */}
                                {policySubTab === 'terms' && !showPreview && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="space-y-1.5 max-w-xs">
                                            <label className="text-sm font-semibold text-slate-700">Minimum Age to Purchase</label>
                                            <input
                                                type="number"
                                                value={config.policies?.terms?.minAge || 18}
                                                onChange={(e) => handlePolicyChange('terms', 'minAge', parseInt(e.target.value) || 18)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                min="13"
                                                max="21"
                                            />
                                            <p className="text-xs text-slate-500">Must be at least 13</p>
                                        </div>
                                        <PolicyToggle
                                            label="Require Account for Checkout"
                                            description="Customers must create an account to place orders"
                                            enabled={config.policies?.terms?.accountRequired}
                                            onChange={(val) => handlePolicyChange('terms', 'accountRequired', val)}
                                        />
                                        <PolicyToggle
                                            label="Allow Order Cancellation"
                                            description="Let customers cancel orders before shipping"
                                            enabled={config.policies?.terms?.cancelBeforeShipping}
                                            onChange={(val) => handlePolicyChange('terms', 'cancelBeforeShipping', val)}
                                        />
                                    </div>
                                )}

                                {/* Preview */}
                                {showPreview && (
                                    <div className="animate-in fade-in">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">
                                                {policyTabs.find(t => t.id === policySubTab)?.label} Preview
                                            </h3>
                                            <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap">
                                                {getPreviewText()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        <Eye size={18} />
                                        {showPreview ? 'Edit Policy' : 'Preview Generated Text'}
                                    </button>
                                    <button
                                        onClick={handleSaveConfig}
                                        disabled={saving}
                                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-70 transition-colors"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Saving...' : 'Save Policy'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Feature Flags</h2>
                                    <p className="text-sm text-slate-500">Toggle experimental or optional features on/off</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(features).map(([key, feature]) => (
                                        <FeatureToggle
                                            key={key}
                                            name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                            description={feature.description || 'Controls visibility of this feature'}
                                            enabled={feature.enabled}
                                            onToggle={() => handleFeatureToggle(key)}
                                            loading={saving}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
