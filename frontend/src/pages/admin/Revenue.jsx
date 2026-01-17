
import { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, TrendingUp, ArrowUpRight,
    ArrowDownRight, CreditCard,
    Calendar, CalendarDays, Filter, X
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

// --- Utility Functions ---

const formatCurrency = (amount) => `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// --- Sub-Components ---

const MetricCard = ({ title, value, subtext, trend, icon: Icon }) => (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
                <Icon size={18} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                    {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>

        <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    const [localStart, setLocalStart] = useState(startDate ? new Date(startDate).toISOString().split('T')[0] : '');
    const [localEnd, setLocalEnd] = useState(endDate ? new Date(endDate).toISOString().split('T')[0] : '');

    const handleApply = () => {
        if (localStart && localEnd) {
            onChange(new Date(localStart), new Date(localEnd));
            if (onClose) onClose();
        } else {
            toast.error('Please select both start and end dates');
        }
    };

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xl w-full">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Select Date Range</h4>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={18} className="text-gray-500" />
                    </button>
                )}
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => setLocalStart(e.target.value)}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase">End Date</label>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => setLocalEnd(e.target.value)}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                </div>
                <button
                    onClick={handleApply}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition-colors shadow-sm"
                >
                    Apply Date Range
                </button>
            </div>
        </div>
    );
};

// Responsive Chart Component
const CleanChart = ({ data, height = 300 }) => {
    const safeData = (data && data.length > 0) ? data : [
        { label: 'Start', value: 0 },
        { label: 'End', value: 0 }
    ];

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 800;
    const chartHeight = height;
    let maxValue = Math.max(...safeData.map(d => d.value)) || 1000;
    maxValue = maxValue * 1.1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeightInner = chartHeight - padding.top - padding.bottom;

    const getX = (index) => padding.left + (index / (safeData.length - 1 || 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeightInner - (value / maxValue) * chartHeightInner;

    let pathD = `M ${getX(0)} ${getY(safeData[0].value)}`;
    let areaD = `M ${getX(0)} ${chartHeight - padding.bottom} L ${getX(0)} ${getY(safeData[0].value)}`;

    for (let i = 0; i < safeData.length - 1; i++) {
        const x_end = getX(i + 1);
        const y_end = getY(safeData[i + 1].value);
        pathD += ` L ${x_end} ${y_end}`;
        areaD += ` L ${x_end} ${y_end}`;
    }

    areaD += ` L ${getX(safeData.length - 1)} ${chartHeight - padding.bottom} Z`;

    // Calculate which labels to show based on data density
    const showLabelEvery = Math.max(1, Math.ceil(safeData.length / 6));

    return (
        <div className="w-full overflow-x-auto -mx-2 px-2">
            <div className="min-w-[320px]">
                <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                    {/* Horizontal Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const yVal = getY(maxValue * t);
                        return (
                            <g key={t}>
                                <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} stroke="#f1f5f9" strokeWidth="1" />
                                <text x={padding.left - 8} y={yVal + 4} textAnchor="end" className="text-[10px] sm:text-[11px] fill-gray-400 font-medium">
                                    {formatCurrency(maxValue * t).replace('₹', '')}
                                </text>
                            </g>
                        )
                    })}

                    {/* Area Fill */}
                    <path d={areaD} fill="url(#areaGradient)" />

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Main Line */}
                    <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points */}
                    {safeData.map((d, i) => (
                        <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r="4"
                            className="fill-white stroke-blue-600 stroke-2 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        />
                    ))}

                    {/* X-Axis Labels */}
                    {safeData.map((d, i) => {
                        if (i % showLabelEvery !== 0 && i !== safeData.length - 1) return null;
                        return (
                            <text key={i} x={getX(i)} y={chartHeight - 10} textAnchor="middle" className="text-[9px] sm:text-[11px] font-medium fill-gray-400">
                                {d.label}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const AdminRevenue = () => {
    const [loading, setLoading] = useState(true);
    const [dateRangeStr, setDateRangeStr] = useState('30D');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0, netProfit: 0, avgOrderValue: 0, ordersCount: 0,
        chartData: [], growth: 0
    });

    const activeRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);

        switch (dateRangeStr) {
            case '7D': start.setDate(end.getDate() - 7); break;
            case '30D': start.setDate(end.getDate() - 30); break;
            case '90D': start.setDate(end.getDate() - 90); break;
            case '1Y': start.setFullYear(end.getFullYear() - 1); break;
            case 'ALL': start.setFullYear(2020); break;
            case 'CUSTOM':
                if (customRange.start && customRange.end) {
                    return { start: customRange.start, end: customRange.end };
                }
                start.setDate(end.getDate() - 30);
                break;
            default: start.setDate(end.getDate() - 30);
        }
        return { start, end };
    }, [dateRangeStr, customRange]);

    useEffect(() => {
        fetchData();
    }, [activeRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getAdminOrders({ limit: 5000 });
            const orders = res.data.data?.orders || [];

            const validOrders = orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= activeRange.start && d <= activeRange.end && !['cancelled', 'refunded'].includes(o.status);
            });

            const totalRevenue = validOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            const count = validOrders.length;
            const aov = count > 0 ? totalRevenue / count : 0;
            const net = totalRevenue * 0.40;

            const durationDays = (activeRange.end - activeRange.start) / (1000 * 3600 * 24);
            let groupBy = 'day';
            if (durationDays > 60) groupBy = 'week';
            if (durationDays > 365) groupBy = 'month';

            const bucketMap = new Map();

            validOrders.forEach(o => {
                const d = new Date(o.createdAt);
                let key, label, fullDate;

                if (groupBy === 'day') {
                    key = d.toISOString().split('T')[0];
                    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    fullDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
                } else if (groupBy === 'week') {
                    const firstDay = new Date(d);
                    firstDay.setDate(d.getDate() - d.getDay());
                    key = firstDay.toISOString().split('T')[0];
                    label = `${d.getDate()}/${d.getMonth() + 1}`;
                    fullDate = `Week of ${firstDay.toLocaleDateString()}`;
                } else {
                    key = `${d.getFullYear()}-${d.getMonth()}`;
                    label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                    fullDate = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                }

                if (!bucketMap.has(key)) {
                    bucketMap.set(key, { value: 0, label, fullDate });
                }
                bucketMap.get(key).value += (o.pricing?.total || 0);
            });

            let finalChartData = Array.from(bucketMap.values());

            if (finalChartData.length === 0) {
                finalChartData = [
                    { label: formatDate(activeRange.start), value: 0, fullDate: 'Start of Period' },
                    { label: formatDate(activeRange.end), value: 0, fullDate: 'End of Period' }
                ];
            } else {
                const sortedKeys = Array.from(bucketMap.keys()).sort();
                finalChartData = sortedKeys.map(k => bucketMap.get(k));
            }

            setStats({
                totalRevenue, netProfit: net, avgOrderValue: aov, ordersCount: count, chartData: finalChartData
            });

        } catch (err) {
            console.error(err);
            toast.error("Error loading analytics");
        } finally {
            setLoading(false);
        }
    };

    const rangeOptions = ['7D', '30D', '90D', '1Y', 'ALL'];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 sm:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Revenue</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {formatDate(activeRange.start)} — {formatDate(activeRange.end)}
                        </p>
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                            {rangeOptions.map(range => (
                                <button
                                    key={range}
                                    onClick={() => { setDateRangeStr(range); setShowCustomPicker(false); }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${dateRangeStr === range ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {range}
                                </button>
                            ))}
                            <div className="w-px h-4 bg-gray-200 mx-1" />
                            <button
                                onClick={() => setShowCustomPicker(!showCustomPicker)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${dateRangeStr === 'CUSTOM' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <Calendar size={14} />
                                Custom
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom Picker Dropdown (Desktop) */}
                {showCustomPicker && (
                    <div className="hidden sm:block relative z-50">
                        <div className="absolute top-0 right-0 w-80">
                            <DateRangePicker
                                startDate={activeRange.start}
                                endDate={activeRange.end}
                                onChange={(s, e) => {
                                    setCustomRange({ start: s, end: e });
                                    setDateRangeStr('CUSTOM');
                                    setShowCustomPicker(false);
                                }}
                                onClose={() => setShowCustomPicker(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(stats.totalRevenue)}
                        icon={DollarSign}
                        trend={12.5}
                    />
                    <MetricCard
                        title="Net Profit"
                        value={formatCurrency(stats.netProfit)}
                        subtext="Est. 40% Margin"
                        icon={TrendingUp}
                        trend={8.2}
                    />
                    <MetricCard
                        title="Avg. Order"
                        value={formatCurrency(stats.avgOrderValue)}
                        icon={CreditCard}
                    />
                    <MetricCard
                        title="Orders"
                        value={stats.ordersCount}
                        icon={CalendarDays}
                    />
                </div>

                {/* Chart Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Revenue Over Time</h3>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <CleanChart data={stats.chartData} height={280} />
                        )}
                    </div>
                </div>

                {/* Mobile Floating Filter Button */}
                <div className="fixed bottom-6 right-6 sm:hidden z-40">
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="bg-gray-900 text-white p-4 rounded-full shadow-xl shadow-gray-900/30 active:scale-95 transition-transform"
                    >
                        <Filter size={22} />
                    </button>
                </div>

                {/* Mobile Filters Bottom Sheet */}
                {showMobileFilters && (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        {/* Sheet */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter by Date</h3>

                            {/* Quick Range Pills */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {rangeOptions.map(range => (
                                    <button
                                        key={range}
                                        onClick={() => {
                                            setDateRangeStr(range);
                                            setShowMobileFilters(false);
                                        }}
                                        className={`py-3 rounded-xl text-sm font-semibold transition-colors ${dateRangeStr === range
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Picker */}
                            <DateRangePicker
                                startDate={activeRange.start}
                                endDate={activeRange.end}
                                onChange={(s, e) => {
                                    setCustomRange({ start: s, end: e });
                                    setDateRangeStr('CUSTOM');
                                    setShowMobileFilters(false);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AdminRevenue;
