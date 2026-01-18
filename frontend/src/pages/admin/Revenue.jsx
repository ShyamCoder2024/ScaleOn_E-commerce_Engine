import { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, ShoppingCart,
    Calendar, CalendarDays, Filter, X, Download, FileText, CheckCircle, Clock, XCircle, RefreshCw
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Utility Functions ---

const formatCurrency = (amount) => `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateLong = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

// --- Sub-Components ---

const MetricCard = ({ title, value, subtext, trend, icon: Icon, iconColor = 'text-gray-500', bgColor = 'bg-gray-50' }) => (
    <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className={`p-1.5 sm:p-2 ${bgColor} rounded-lg border border-gray-100 ${iconColor}`}>
                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            {trend !== undefined && trend !== null && (
                <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                    {trend >= 0 ? <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> : <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>

        <div>
            <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</p>
            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight truncate">{value}</h3>
            {subtext && <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{subtext}</p>}
        </div>
    </div>
);

const StatusCard = ({ title, count, percentage, icon: Icon, color }) => {
    const colors = {
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        yellow: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200'
    };

    return (
        <div className={`rounded-lg p-2 sm:p-3 border ${colors[color]} flex items-center gap-2 sm:gap-3`}>
            <Icon size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium truncate">{title}</p>
                <p className="text-sm sm:text-lg font-bold">{count} <span className="text-[9px] sm:text-xs font-normal">({percentage}%)</span></p>
            </div>
        </div>
    );
};

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
        <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-xl w-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Select Date Range</h4>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500" />
                    </button>
                )}
            </div>
            <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Start Date</label>
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => setLocalStart(e.target.value)}
                            className="w-full px-2.5 sm:px-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">End Date</label>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => setLocalEnd(e.target.value)}
                            className="w-full px-2.5 sm:px-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                </div>
                <button
                    onClick={handleApply}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-black transition-colors shadow-sm"
                >
                    Apply Date Range
                </button>
            </div>
        </div>
    );
};

// Responsive Chart Component
const CleanChart = ({ data, height = 280 }) => {
    const safeData = (data && data.length > 0) ? data : [
        { label: 'Start', value: 0 },
        { label: 'End', value: 0 }
    ];

    const padding = { top: 20, right: 15, bottom: 35, left: 50 };
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

    const showLabelEvery = Math.max(1, Math.ceil(safeData.length / 5));

    return (
        <div className="w-full overflow-x-auto -mx-2 px-2">
            <div className="min-w-[280px]">
                <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const yVal = getY(maxValue * t);
                        return (
                            <g key={t}>
                                <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} stroke="#f1f5f9" strokeWidth="1" />
                                <text x={padding.left - 6} y={yVal + 4} textAnchor="end" className="text-[9px] sm:text-[10px] fill-gray-400 font-medium">
                                    {(maxValue * t / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </text>
                            </g>
                        )
                    })}

                    <path d={areaD} fill="url(#areaGradient)" />

                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                        </linearGradient>
                    </defs>

                    <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {safeData.map((d, i) => (
                        <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r="3"
                            className="fill-white stroke-blue-600 stroke-2 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        />
                    ))}

                    {safeData.map((d, i) => {
                        if (i % showLabelEvery !== 0 && i !== safeData.length - 1) return null;
                        return (
                            <text key={i} x={getX(i)} y={chartHeight - 8} textAnchor="middle" className="text-[8px] sm:text-[10px] font-medium fill-gray-400">
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
    const { config } = useConfig();
    const storeName = config?.store?.name || 'Store';

    const [loading, setLoading] = useState(true);
    const [dateRangeStr, setDateRangeStr] = useState('30D');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfMonths, setPdfMonths] = useState(1);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [allOrders, setAllOrders] = useState([]);

    const [stats, setStats] = useState({
        totalRevenue: 0, netProfit: 0, avgOrderValue: 0, ordersCount: 0,
        chartData: [], growth: null,
        statusBreakdown: { completed: 0, processing: 0, cancelled: 0, refunded: 0, pending: 0 }
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
            const res = await orderAPI.getAdminOrders({ limit: 10000 });
            const orders = res.data.data?.orders || [];
            setAllOrders(orders);

            // Calculate current period stats
            const currentPeriodOrders = orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= activeRange.start && d <= activeRange.end;
            });

            // Orders excluding cancelled/refunded for revenue
            const revenueOrders = currentPeriodOrders.filter(o => !['cancelled', 'refunded'].includes(o.status));

            const totalRevenue = revenueOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            const count = revenueOrders.length;
            const aov = count > 0 ? totalRevenue / count : 0;
            const net = totalRevenue * 0.40;

            // Status breakdown for ALL orders in period
            const statusBreakdown = {
                completed: currentPeriodOrders.filter(o => o.status === 'delivered').length,
                processing: currentPeriodOrders.filter(o => ['processing', 'shipped'].includes(o.status)).length,
                cancelled: currentPeriodOrders.filter(o => o.status === 'cancelled').length,
                refunded: currentPeriodOrders.filter(o => o.status === 'refunded').length,
                pending: currentPeriodOrders.filter(o => ['pending', 'payment_pending'].includes(o.status)).length
            };

            // Calculate growth vs previous period
            const periodDuration = activeRange.end - activeRange.start;
            const prevEnd = new Date(activeRange.start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - periodDuration);

            const prevPeriodOrders = orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= prevStart && d <= prevEnd && !['cancelled', 'refunded'].includes(o.status);
            });

            const prevRevenue = prevPeriodOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            let growth = null;
            if (prevRevenue > 0) {
                growth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
            } else if (totalRevenue > 0) {
                growth = 100;
            }

            // Chart data
            const durationDays = (activeRange.end - activeRange.start) / (1000 * 3600 * 24);
            let groupBy = 'day';
            if (durationDays > 60) groupBy = 'week';
            if (durationDays > 365) groupBy = 'month';

            const bucketMap = new Map();

            revenueOrders.forEach(o => {
                const d = new Date(o.createdAt);
                let key, label;

                if (groupBy === 'day') {
                    key = d.toISOString().split('T')[0];
                    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                } else if (groupBy === 'week') {
                    const firstDay = new Date(d);
                    firstDay.setDate(d.getDate() - d.getDay());
                    key = firstDay.toISOString().split('T')[0];
                    label = `${d.getDate()}/${d.getMonth() + 1}`;
                } else {
                    key = `${d.getFullYear()}-${d.getMonth()}`;
                    label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                }

                if (!bucketMap.has(key)) {
                    bucketMap.set(key, { value: 0, label });
                }
                bucketMap.get(key).value += (o.pricing?.total || 0);
            });

            let finalChartData = Array.from(bucketMap.values());

            if (finalChartData.length === 0) {
                finalChartData = [
                    { label: formatDate(activeRange.start), value: 0 },
                    { label: formatDate(activeRange.end), value: 0 }
                ];
            } else {
                const sortedKeys = Array.from(bucketMap.keys()).sort();
                finalChartData = sortedKeys.map(k => bucketMap.get(k));
            }

            setStats({
                totalRevenue, netProfit: net, avgOrderValue: aov, ordersCount: count,
                chartData: finalChartData, growth, statusBreakdown
            });

        } catch (err) {
            console.error(err);
            toast.error("Error loading analytics");
        } finally {
            setLoading(false);
        }
    };

    // PDF Generation
    const generatePDFReport = async () => {
        setGeneratingPDF(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();

            // Calculate date range for PDF
            const pdfEnd = new Date();
            const pdfStart = new Date();
            pdfStart.setMonth(pdfEnd.getMonth() - pdfMonths);

            // Filter orders for PDF
            const pdfOrders = allOrders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= pdfStart && d <= pdfEnd;
            });

            const revenueOrders = pdfOrders.filter(o => !['cancelled', 'refunded'].includes(o.status));
            const totalRevenue = revenueOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            const netProfit = totalRevenue * 0.40;
            const avgOrder = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

            // Previous period for growth
            const prevEnd = new Date(pdfStart.getTime() - 1);
            const prevStart = new Date(prevEnd);
            prevStart.setMonth(prevEnd.getMonth() - pdfMonths);

            const prevOrders = allOrders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= prevStart && d <= prevEnd && !['cancelled', 'refunded'].includes(o.status);
            });
            const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
            let growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);

            // Status breakdown
            const delivered = pdfOrders.filter(o => o.status === 'delivered').length;
            const processing = pdfOrders.filter(o => ['processing', 'shipped'].includes(o.status)).length;
            const cancelled = pdfOrders.filter(o => o.status === 'cancelled').length;
            const refunded = pdfOrders.filter(o => o.status === 'refunded').length;
            const pending = pdfOrders.filter(o => ['pending', 'payment_pending'].includes(o.status)).length;
            const totalOrders = pdfOrders.length;

            // Header
            pdf.setFillColor(17, 24, 39);
            pdf.rect(0, 0, pageWidth, 45, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text(storeName, pageWidth / 2, 18, { align: 'center' });

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Revenue Report', pageWidth / 2, 28, { align: 'center' });

            pdf.setFontSize(10);
            pdf.text(`${formatDateLong(pdfStart)} — ${formatDateLong(pdfEnd)}`, pageWidth / 2, 38, { align: 'center' });

            // Summary Section
            let yPos = 55;
            pdf.setTextColor(17, 24, 39);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Revenue Summary', 15, yPos);

            yPos += 10;
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            const summaryData = [
                ['Total Revenue', formatCurrency(totalRevenue)],
                ['Net Profit (40% margin)', formatCurrency(netProfit)],
                ['Average Order Value', formatCurrency(avgOrder)],
                ['Total Orders (Revenue)', revenueOrders.length.toString()],
                ['Growth vs Previous Period', `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`]
            ];

            pdf.autoTable({
                startY: yPos,
                head: [['Metric', 'Value']],
                body: summaryData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 4 },
                columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
                margin: { left: 15, right: 15 }
            });

            // Order Status Breakdown
            yPos = pdf.lastAutoTable.finalY + 15;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Order Status Breakdown', 15, yPos);

            yPos += 10;
            const statusData = [
                ['Delivered (Completed)', delivered.toString(), totalOrders > 0 ? `${((delivered / totalOrders) * 100).toFixed(1)}%` : '0%'],
                ['Processing / Shipped', processing.toString(), totalOrders > 0 ? `${((processing / totalOrders) * 100).toFixed(1)}%` : '0%'],
                ['Pending', pending.toString(), totalOrders > 0 ? `${((pending / totalOrders) * 100).toFixed(1)}%` : '0%'],
                ['Cancelled', cancelled.toString(), totalOrders > 0 ? `${((cancelled / totalOrders) * 100).toFixed(1)}%` : '0%'],
                ['Refunded', refunded.toString(), totalOrders > 0 ? `${((refunded / totalOrders) * 100).toFixed(1)}%` : '0%'],
                ['Total Orders', totalOrders.toString(), '100%']
            ];

            pdf.autoTable({
                startY: yPos,
                head: [['Status', 'Count', 'Percentage']],
                body: statusData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 4 },
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
                margin: { left: 15, right: 15 }
            });

            // Monthly Breakdown
            yPos = pdf.lastAutoTable.finalY + 15;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Monthly Breakdown', 15, yPos);

            yPos += 10;
            const monthlyMap = new Map();
            revenueOrders.forEach(o => {
                const d = new Date(o.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                if (!monthlyMap.has(key)) {
                    monthlyMap.set(key, { label, orders: 0, revenue: 0 });
                }
                monthlyMap.get(key).orders++;
                monthlyMap.get(key).revenue += (o.pricing?.total || 0);
            });

            const sortedMonths = Array.from(monthlyMap.keys()).sort().reverse();
            const monthlyData = sortedMonths.map(k => {
                const m = monthlyMap.get(k);
                return [m.label, m.orders.toString(), formatCurrency(m.revenue)];
            });

            if (monthlyData.length > 0) {
                pdf.autoTable({
                    startY: yPos,
                    head: [['Month', 'Orders', 'Revenue']],
                    body: monthlyData,
                    theme: 'striped',
                    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 10, cellPadding: 4 },
                    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
                    margin: { left: 15, right: 15 }
                });
            }

            // Footer
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save PDF
            const fileName = `${storeName.replace(/\s+/g, '_')}_Revenue_Report_${pdfMonths}M_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            toast.success('PDF downloaded successfully!');
            setShowPDFModal(false);
        } catch (err) {
            console.error('PDF generation error:', err);
            toast.error('Failed to generate PDF');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const rangeOptions = ['7D', '30D', '90D', '1Y', 'ALL'];
    const totalAllOrders = stats.statusBreakdown.completed + stats.statusBreakdown.processing + stats.statusBreakdown.cancelled + stats.statusBreakdown.refunded + stats.statusBreakdown.pending;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 sm:pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Revenue</h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                            {formatDate(activeRange.start)} — {formatDate(activeRange.end)}
                        </p>
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden sm:flex items-center gap-2 lg:gap-3 flex-wrap">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                            {rangeOptions.map(range => (
                                <button
                                    key={range}
                                    onClick={() => { setDateRangeStr(range); setShowCustomPicker(false); }}
                                    className={`px-2 lg:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${dateRangeStr === range ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {range}
                                </button>
                            ))}
                            <div className="w-px h-4 bg-gray-200 mx-1" />
                            <button
                                onClick={() => setShowCustomPicker(!showCustomPicker)}
                                className={`px-2 lg:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${dateRangeStr === 'CUSTOM' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <Calendar size={12} />
                                <span className="hidden lg:inline">Custom</span>
                            </button>
                        </div>

                        {/* Download PDF Button */}
                        <button
                            onClick={() => setShowPDFModal(true)}
                            className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Download size={14} />
                            <span className="hidden lg:inline">Download</span> PDF
                        </button>
                    </div>
                </div>

                {/* Custom Picker Dropdown (Desktop) */}
                {showCustomPicker && (
                    <div className="hidden sm:block relative z-50">
                        <div className="absolute top-0 right-0 w-72 lg:w-80">
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(stats.totalRevenue)}
                        icon={DollarSign}
                        trend={stats.growth}
                        iconColor="text-emerald-600"
                        bgColor="bg-emerald-50"
                    />
                    <MetricCard
                        title="Net Profit"
                        value={formatCurrency(stats.netProfit)}
                        subtext="Est. 40% Margin"
                        icon={TrendingUp}
                        iconColor="text-blue-600"
                        bgColor="bg-blue-50"
                    />
                    <MetricCard
                        title="Avg. Order"
                        value={formatCurrency(stats.avgOrderValue)}
                        icon={CreditCard}
                        iconColor="text-purple-600"
                        bgColor="bg-purple-50"
                    />
                    <MetricCard
                        title="Orders"
                        value={stats.ordersCount}
                        subtext="Revenue Orders"
                        icon={ShoppingCart}
                        iconColor="text-amber-600"
                        bgColor="bg-amber-50"
                    />
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Order Status Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        <StatusCard
                            title="Completed"
                            count={stats.statusBreakdown.completed}
                            percentage={totalAllOrders > 0 ? ((stats.statusBreakdown.completed / totalAllOrders) * 100).toFixed(1) : 0}
                            icon={CheckCircle}
                            color="green"
                        />
                        <StatusCard
                            title="Processing"
                            count={stats.statusBreakdown.processing}
                            percentage={totalAllOrders > 0 ? ((stats.statusBreakdown.processing / totalAllOrders) * 100).toFixed(1) : 0}
                            icon={RefreshCw}
                            color="blue"
                        />
                        <StatusCard
                            title="Pending"
                            count={stats.statusBreakdown.pending}
                            percentage={totalAllOrders > 0 ? ((stats.statusBreakdown.pending / totalAllOrders) * 100).toFixed(1) : 0}
                            icon={Clock}
                            color="yellow"
                        />
                        <StatusCard
                            title="Cancelled"
                            count={stats.statusBreakdown.cancelled}
                            percentage={totalAllOrders > 0 ? ((stats.statusBreakdown.cancelled / totalAllOrders) * 100).toFixed(1) : 0}
                            icon={XCircle}
                            color="red"
                        />
                        <StatusCard
                            title="Refunded"
                            count={stats.statusBreakdown.refunded}
                            percentage={totalAllOrders > 0 ? ((stats.statusBreakdown.refunded / totalAllOrders) * 100).toFixed(1) : 0}
                            icon={RefreshCw}
                            color="red"
                        />
                    </div>
                </div>

                {/* Chart Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Revenue Over Time</h3>
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6">
                        {loading ? (
                            <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <CleanChart data={stats.chartData} height={250} />
                        )}
                    </div>
                </div>

                {/* Mobile Floating Buttons */}
                <div className="fixed bottom-6 right-4 sm:hidden z-40 flex flex-col gap-3">
                    <button
                        onClick={() => setShowPDFModal(true)}
                        className="bg-blue-600 text-white p-3.5 rounded-full shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
                    >
                        <Download size={20} />
                    </button>
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="bg-gray-900 text-white p-3.5 rounded-full shadow-xl shadow-gray-900/30 active:scale-95 transition-transform"
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Mobile Filters Bottom Sheet */}
                {showMobileFilters && (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                            <h3 className="text-base font-bold text-gray-900 mb-4">Filter by Date</h3>

                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {rangeOptions.map(range => (
                                    <button
                                        key={range}
                                        onClick={() => {
                                            setDateRangeStr(range);
                                            setShowMobileFilters(false);
                                        }}
                                        className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${dateRangeStr === range
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>

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

                {/* PDF Download Modal */}
                {showPDFModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPDFModal(false)} />
                        <div className="relative bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-slide-up">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FileText size={20} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Download Report</h3>
                                </div>
                                <button onClick={() => setShowPDFModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-5">
                                Select the time period for your revenue report. The PDF will include revenue summary, order breakdown, and monthly statistics.
                            </p>

                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-medium text-gray-500 uppercase">Report Period</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1, 3, 6, 12].map(months => (
                                        <button
                                            key={months}
                                            onClick={() => setPdfMonths(months)}
                                            className={`py-3 rounded-xl text-sm font-semibold transition-all ${pdfMonths === months
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {months === 1 ? 'Last Month' : `Last ${months} Months`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={generatePDFReport}
                                disabled={generatingPDF}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generatingPDF ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AdminRevenue;
