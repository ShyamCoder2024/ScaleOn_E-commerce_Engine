// Re-writing AdminLayout completely to ensure imports are correct as I might have missed improving imports in replace_file_content
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Image,
    ChevronRight,
    ExternalLink // Added ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const { storeName } = useConfig();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Products', icon: Package, path: '/admin/products' },
        { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
        { name: 'Customers', icon: Users, path: '/admin/customers' },
        { name: 'Feature Cards', icon: Image, path: '/admin/feature-cards' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Mobile sidebar backdrop with fade/blur */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-2xl lg:shadow-none
            `}>
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
                    <Link to="/admin" className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            {storeName?.[0] || 'S'}
                        </div>
                        {storeName || 'Store'} <span className="text-slate-500 font-normal">Admin</span>
                    </Link>
                    <button
                        className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)] scrollbar-hide">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                                    ${active
                                        ? 'bg-blue-600/10 text-blue-400 shadow-sm ring-1 ring-blue-600/20'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={`transition-colors ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                                    <span className="font-medium text-sm">{item.name}</span>
                                </div>
                                {active && <ChevronRight size={16} className="text-blue-400" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info / Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800">
                            {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate">
                                {user?.profile?.firstName || 'Admin'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={`
                lg:pl-72 min-h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                ${sidebarOpen ? 'blur-sm lg:blur-none opacity-50 lg:opacity-100 pointer-events-none lg:pointer-events-auto' : ''}
            `}>
                {/* Top Navbar */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 supports-[backdrop-filter]:bg-white/60">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                        <button
                            className="lg:hidden p-2.5 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors active:scale-95"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open Sidebar"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex-1" /> {/* Spacer */}

                        <div className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 group px-3 py-1.5 rounded-lg hover:bg-blue-50"
                            >
                                View Store
                                <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
