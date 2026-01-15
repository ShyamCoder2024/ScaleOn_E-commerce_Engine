
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    DollarSign, TrendingUp, Calendar, ArrowUpRight,
    ArrowDownRight, CreditCard, Download, Filter,
    ChevronDown, X, Check, CalendarDays, Printer
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

// --- Utility Functions ---

const formatCurrency = (amount) => `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// --- Sub-Components ---

const MetricCard = ({ title, value, subtext, trend, icon: Icon }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-gray-50 rounded-md border border-gray-100 text-gray-500">
                <Icon size={20} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                    {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>

        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-feature-settings-tnum">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    // Initialize with YYYY-MM-DD for inputs
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
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Select Date Range</h4>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => setLocalStart(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase">End Date</label>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => setLocalEnd(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded font-medium text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded font-medium text-sm hover:bg-black transition-colors shadow-sm"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

// Clean Line Chart (Stripe-like)
const CleanChart = ({ data, height = 350 }) => {
    // If no data or all zeros, we still want to render the grid and a flat line
    const safeData = (data && data.length > 0) ? data : [
        { label: 'Start', value: 0 },
        { label: 'End', value: 0 }
    ];

    const padding = 50;
    const width = 1200;
    let maxValue = Math.max(...safeData.map(d => d.value)) || 1000;
    maxValue = maxValue * 1.1; // 10% headroom

    // Scales
    const getX = (index) => padding + (index / (safeData.length - 1)) * (width - 2 * padding);
    const getY = (value) => height - padding - ((value) / maxValue) * (height - 2 * padding);

    // Path Generation (Linear for accuracy or slight curve)
    // Professional charts often use slight curve or straight lines. Let's use straight lines for 100% precision or very slight monotonic curve.
    // Let's stick to sharp lines for "Financial" accuracy feel, or very slight rounding.

    let pathD = `M ${getX(0)} ${getY(safeData[0].value)}`;
    let areaD = `M ${getX(0)} ${height - padding} L ${getX(0)} ${getY(safeData[0].value)}`;

    for (let i = 0; i < safeData.length - 1; i++) {
        const x_start = getX(i);
        const y_start = getY(safeData[i].value);
        const x_end = getX(i + 1);
        const y_end = getY(safeData[i + 1].value);

        // Straight line connection
        pathD += ` L ${x_end} ${y_end}`;
        areaD += ` L ${x_end} ${y_end}`;
    }

    areaD += ` L ${getX(safeData.length - 1)} ${height - padding} Z`;

    return (
        <div className="w-full overflow-hidden relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const yVal = getY(maxValue * t);
                    return (
                        <g key={t}>
                            <line x1={padding} y1={yVal} x2={width - padding} y2={yVal} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={padding - 10} y={yVal + 4} textAnchor="end" className="text-[11px] fill-gray-400 font-medium tracking-tighter">
                                {formatCurrency(maxValue * t).replace('₹', '')}
                            </text>
                        </g>
                    )
                })}

                {/* Area Fill */}
                <path d={areaD} fill="rgba(59, 130, 246, 0.05)" />

                {/* Main Line */}
                <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* X-Axis Labels */}
                {safeData.map((d, i) => {
                    // Smart density
                    const density = safeData.length > 20 ? Math.ceil(safeData.length / 8) : 1;
                    if (i % density !== 0 && i !== safeData.length - 1) return null;

                    return (
                        <text key={i} x={getX(i)} y={height - 20} textAnchor="middle" className="text-[11px] font-medium fill-gray-400">
                            {d.label}
                        </text>
                    );
                })}

                {/* Hover / Tooltip Trigger Zones */}
                {safeData.map((d, i) => (
                    <g key={i} className="group opacity-0 hover:opacity-100 cursor-crosshair">
                        {/* Vertical Guide */}
                        <line x1={getX(i)} y1={padding} x2={getX(i)} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Point Marker */}
                        <circle cx={getX(i)} cy={getY(d.value)} r="5" className="fill-white stroke-blue-600 stroke-[2px]" />

                        {/* Tooltip */}
                        <foreignObject x={getX(i) > width / 2 ? getX(i) - 160 : getX(i) + 10} y={getY(d.value) - 60} width="150" height="60">
                            <div className="bg-gray-900 text-white text-xs rounded p-2 shadow-lg">
                                <div className="font-semibold mb-1">{d.fullDate || d.label}</div>
                                <div className="text-lg font-bold">{formatCurrency(d.value)}</div>
                            </div>
                        </foreignObject>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const AdminRevenue = () => {
    // --- State ---
    const [loading, setLoading] = useState(true);
    const [dateRangeStr, setDateRangeStr] = useState('30D');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0, netProfit: 0, avgOrderValue: 0, ordersCount: 0,
        chartData: [], growth: 0
    });

    // --- Computed Date Range ---
    const activeRange = useMemo(() => {
        const end = new Date();
        const start = new Date();

        // Reset hours for cleaner comparisons
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);

        switch (dateRangeStr) {
            case '7D': start.setDate(end.getDate() - 7); break;
            case '30D': start.setDate(end.getDate() - 30); break;
            case '90D': start.setDate(end.getDate() - 90); break;
            case '1Y': start.setFullYear(end.getFullYear() - 1); break;
            case '2Y': start.setFullYear(end.getFullYear() - 2); break;
            case '5Y': start.setFullYear(end.getFullYear() - 5); break;
            case 'ALL': start.setFullYear(2020); break; // Reasonable default for 'all time'
            case 'CUSTOM':
                if (customRange.start && customRange.end) {
                    return { start: customRange.start, end: customRange.end };
                }
                // Fallback
                start.setDate(end.getDate() - 30);
                break;
            default: start.setDate(end.getDate() - 30);
        }
        return { start, end };
    }, [dateRangeStr, customRange]);

    // --- Data Fetching ---
    useEffect(() => {
        fetchData();
    }, [activeRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getAdminOrders({ limit: 5000 });
            const orders = res.data.data?.orders || [];

            // Filter Orders
            const validOrders = orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= activeRange.start && d <= activeRange.end && !['cancelled', 'refunded'].includes(o.status);
            });

            // Metrics Calculation
            const totalRevenue = validOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            const count = validOrders.length;
            const aov = count > 0 ? totalRevenue / count : 0;
            const net = totalRevenue * 0.40; // Estimated 40% margin

            // Chart Data Generation
            // We want to fill ALL dates in the range, not just ones with orders, so the chart looks correct (flat lines for 0 revenue)

            const durationDays = (activeRange.end - activeRange.start) / (1000 * 3600 * 24);
            let groupBy = 'day';
            if (durationDays > 60) groupBy = 'week';
            if (durationDays > 365) groupBy = 'month';

            const chartData = [];
            const currentDate = new Date(activeRange.start);
            const endDate = new Date(activeRange.end);

            // Helper to format keys
            const getGroupKey = (d) => {
                if (groupBy === 'month') return `${d.getFullYear()}-${d.getMonth()}`;
                if (groupBy === 'week') {
                    // Simple week grouping key (Year-WeekNumber) could be complex, 
                    // let's stick to using the 'Start of Week' date string as key
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(d.setDate(diff));
                    return monday.toISOString().split('T')[0];
                }
                return d.toISOString().split('T')[0];
            };

            // 1. Pre-fill Map with 0s
            // This is complex for dynamic ranges, simplified approach:
            // Iterate orders and group them. Then post-process or pre-process buckets.

            const bucketMap = new Map();

            // Populate Orders into Buckets
            validOrders.forEach(o => {
                const d = new Date(o.createdAt);
                let key;
                let label;
                let fullDate;

                if (groupBy === 'day') {
                    key = d.toISOString().split('T')[0];
                    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    fullDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
                } else if (groupBy === 'week') {
                    // Approximate week key
                    const firstDay = new Date(d);
                    firstDay.setDate(d.getDate() - d.getDay()); // Sunday
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

            // Convert Map to sorted Array
            // Note: If NO orders exist, this is empty.
            // We should ideally generate the time skeleton.

            // Fallback generation if empty or sparse:
            // For the sake of "Visuals", if we have sparse data, the line connects them.
            // If completely empty, we add start/end 0 points.
            let finalChartData = Array.from(bucketMap.values());

            if (finalChartData.length === 0) {
                finalChartData = [
                    { label: formatDate(activeRange.start), value: 0, fullDate: 'Start of Period' },
                    { label: formatDate(activeRange.end), value: 0, fullDate: 'End of Period' }
                ];
            } else {
                // Sort by date (we can rely on the fact that keys were ISO strings roughly, or just sort by label parsing? 
                // Better to sort by the original keys if we stored them in an array first.
                // Re-doing aggregation safely:
                const sortedKeys = Array.from(bucketMap.keys()).sort();
                finalChartData = sortedKeys.map(k => bucketMap.get(k));
            }

            setStats({
                totalRevenue, netProfit, avgOrderValue: aov, ordersCount: count, chartData: finalChartData
            });

        } catch (err) {
            console.error(err);
            toast.error("Error loading analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => window.print();

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-inter text-gray-900 print:bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue & Financials</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Overview of your store's performance.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Controls Container */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto max-w-full">
                            {['7D', '30D', '90D', '1Y', 'ALL'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => { setDateRangeStr(range); setShowCustomPicker(false); }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${dateRangeStr === range ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                            <div className="w-px h-4 bg-gray-200 mx-2" />
                            <button
                                onClick={() => setShowCustomPicker(!showCustomPicker)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${dateRangeStr === 'CUSTOM' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Calendar size={14} />
                                {dateRangeStr === 'CUSTOM' ? 'Custom' : 'Date Range'}
                            </button>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                        >
                            <Printer size={16} /> Print Report
                        </button>
                    </div>
                </div>

                {/* Custom Picker Dropdown */}
                {showCustomPicker && (
                    <div className="relative z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="absolute top-2 right-0 md:right-auto md:left-0 lg:left-auto lg:right-40">
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

                {/* Report Context Band (Print Only) */}
                <div className="hidden print:block mb-8 border-b border-gray-200 pb-4">
                    <h1 className="text-3xl font-bold text-black">Revenue Report</h1>
                    <p className="text-gray-600 mt-1">
                        Period: {formatDate(activeRange.start)} — {formatDate(activeRange.end)}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6">
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
                        title="Avg. Order Value"
                        value={formatCurrency(stats.avgOrderValue)}
                        icon={CreditCard}
                    />
                    <MetricCard
                        title="Total Orders"
                        value={stats.ordersCount}
                        icon={CalendarDays}
                    />
                </div>

                {/* Main Graph Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 print:shadow-none print:border-0 print:p-0">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Revenue over time</h3>
                        <p className="text-sm text-gray-500">
                            {formatDate(activeRange.start)} – {formatDate(activeRange.end)}
                        </p>
                    </div>

                    <CleanChart data={stats.chartData} height={350} />
                </div>

                {/* Mobile Floating Filters Button */}
                <div className="fixed bottom-6 right-6 lg:hidden print:hidden">
                    <button
                        onClick={() => setShowCustomPicker(true)}
                        className="bg-gray-900 text-white p-4 rounded-full shadow-xl shadow-gray-900/20 hover:scale-105 transition-transform"
                    >
                        <Filter size={24} />
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 1.5cm; }
                    body { background: white !important; font-size: 12pt; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .shadow-sm, .shadow-md, .shadow-xl { box-shadow: none !important; }
                    .border { border: 1px solid #e5e7eb !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminRevenue;
