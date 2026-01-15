import { useState, useEffect } from 'react';
import {
    Save, Store, CreditCard, Truck,
    ToggleLeft, ToggleRight, Settings2, ShieldCheck,
    UploadCloud, AlertCircle
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

const SettingsPage = () => {
    const { refetchConfig } = useConfig();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('store');

    const [config, setConfig] = useState({
        store: { name: '', logo: '', description: '', email: '', phone: '', currency: 'INR', currencySymbol: '₹' },
        business: { minOrderValue: 0, maxOrderQuantity: 10 },
        shipping: { method: 'flat', flatRate: 0, freeThreshold: 0 },
        tax: { enabled: false, rate: 0 },
        payment: { providers: { cod: { enabled: true }, razorpay: { enabled: false }, stripe: { enabled: false } } }
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

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await configAPI.updateConfig({
                configs: [
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
                    { key: 'payment.providers.stripe.enabled', value: config.payment?.providers?.stripe?.enabled ?? false, type: 'payment' }
                ]
            });
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

    const tabs = [
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'shipping', label: 'Shipping & Tax', icon: Truck },
        { id: 'payment', label: 'Payment Methods', icon: CreditCard },
        { id: 'features', label: 'Feature Flags', icon: Settings2 }
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
                    <nav className="grid grid-cols-2 lg:flex lg:flex-col gap-2" aria-label="Tabs">
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
