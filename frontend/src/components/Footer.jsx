import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send, ChevronDown, CreditCard } from 'lucide-react';

const FooterSection = ({ title, children, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border-b border-gray-800 md:border-none last:border-0 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-4 md:py-0 md:cursor-default group"
            >
                <h4 className="text-base md:text-lg font-heading font-bold text-white md:mb-6 tracking-wide">
                    {title}
                </h4>
                <ChevronDown
                    size={18}
                    className={`text-gray-500 md:hidden transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100 mb-6' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:mb-0'}`}>
                <ul className="space-y-3">
                    {children}
                </ul>
            </div>
        </div>
    );
};

const Footer = () => {
    const { config, storeName } = useConfig();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-gray-400 pt-16 md:pt-24 pb-12 border-t border-gray-900">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-16">

                    {/* Brand & Contact */}
                    <div className="lg:col-span-4 space-y-6">
                        <div>
                            <Link to="/" className="inline-block">
                                <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {storeName}
                                </h3>
                            </Link>
                            <p className="text-gray-500 leading-relaxed text-sm max-w-sm">
                                {config.store?.description || 'Your premium destination for quality products. Style, quality, and exception service redefined.'}
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3 text-sm group">
                                <div className="p-2 rounded-lg bg-gray-900 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                    <MapPin size={18} className="shrink-0" />
                                </div>
                                <span className="mt-1.5">123 Fashion Street, New York, NY 10001</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm group">
                                <div className="p-2 rounded-lg bg-gray-900 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                    <Phone size={18} className="shrink-0" />
                                </div>
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm group">
                                <div className="p-2 rounded-lg bg-gray-900 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                    <Mail size={18} className="shrink-0" />
                                </div>
                                <span>support@{storeName.toLowerCase().replace(/\s+/g, '')}.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-10">
                        <FooterSection title="Shop">
                            <li><Link to="/products" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">All Products</Link></li>
                            <li><Link to="/products?sort=-createdAt" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">New Arrivals</Link></li>
                            <li><Link to="/products?sort=-salesCount" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Best Sellers</Link></li>
                            <li><Link to="/wishlist" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">My Wishlist</Link></li>
                            <li><Link to="/cart" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">My Cart</Link></li>
                        </FooterSection>

                        <FooterSection title="Support">
                            <li><Link to="/account" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">My Account</Link></li>
                            <li><Link to="/orders" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Track Order</Link></li>
                            <li><Link to="/shipping-policy" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Shipping Policy</Link></li>
                            <li><Link to="/return-policy" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Returns & Exchanges</Link></li>
                            <li><Link to="/privacy-policy" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block">Terms & Conditions</Link></li>
                        </FooterSection>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-3 mt-4 lg:mt-0">
                        <h4 className="text-base md:text-lg font-heading font-bold text-white mb-6">Stay Connected</h4>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">Subscribe to our newsletter for exclusive deals, new arrivals, and style inspiration.</p>

                        <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative group">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-gray-900 border border-gray-800 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm placeholder:text-gray-600 group-hover:border-gray-700"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary-600 text-white hover:bg-primary-500 p-2 rounded-lg transition-colors shadow-lg shadow-primary-900/20"
                                    aria-label="Subscribe"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all duration-300"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col-reverse md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <p className="text-gray-600 text-xs">
                        © {currentYear} {storeName}. All rights reserved.
                    </p>

                    <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((pm, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-gray-900 px-3 py-1.5 rounded border border-gray-800">
                                <CreditCard size={14} className="text-gray-400" />
                                <span className="text-[10px] font-bold tracking-wider text-gray-400">
                                    {pm.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
