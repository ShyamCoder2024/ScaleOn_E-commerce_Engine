import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send, ChevronDown } from 'lucide-react';

const FooterSection = ({ title, children, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border-b border-gray-800 md:border-none last:border-0 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-4 md:py-0 md:cursor-default group"
            >
                <h4 className="text-base md:text-lg font-bold text-white md:mb-6">
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
        <footer className="bg-[#0f1115] text-gray-400 pt-10 md:pt-16 pb-8 border-t border-gray-800">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">

                    {/* Brand & Contact */}
                    <div className="lg:col-span-4 space-y-6">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                                {storeName}
                            </h3>
                            <p className="text-gray-500 leading-relaxed text-sm max-w-sm">
                                {config.store?.description || 'Your premium destination for quality products. Style, quality, and exception service.'}
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                <span>123 Fashion Street, New York, NY 10001</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-primary-500 shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-primary-500 shrink-0" />
                                <span>support@{storeName.toLowerCase()}.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-8">
                        <FooterSection title="Shop">
                            <li><Link to="/products" className="text-sm hover:text-white transition-colors">All Products</Link></li>
                            <li><Link to="/products?sort=-createdAt" className="text-sm hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link to="/products?sort=-salesCount" className="text-sm hover:text-white transition-colors">Best Sellers</Link></li>
                            <li><Link to="/wishlist" className="text-sm hover:text-white transition-colors">My Wishlist</Link></li>
                            <li><Link to="/cart" className="text-sm hover:text-white transition-colors">My Cart</Link></li>
                        </FooterSection>

                        <FooterSection title="Support">
                            <li><Link to="/account" className="text-sm hover:text-white transition-colors">My Account</Link></li>
                            <li><Link to="/orders" className="text-sm hover:text-white transition-colors">Track Order</Link></li>
                            <li><Link to="/shipping-policy" className="text-sm hover:text-white transition-colors">Shipping Policy</Link></li>
                            <li><Link to="/return-policy" className="text-sm hover:text-white transition-colors">Returns & Exchanges</Link></li>
                            <li><Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-sm hover:text-white transition-colors">Terms & Conditions</Link></li>
                        </FooterSection>
                    </div>

                    {/* Newsletter - Simplified */}
                    <div className="lg:col-span-3 mt-4 lg:mt-0">
                        <h4 className="text-base md:text-lg font-bold text-white mb-4">Stay Connected</h4>
                        <p className="text-gray-500 mb-4 text-sm">Subscribe to receive updates, access to exclusive deals, and more.</p>

                        <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-gray-900 border border-gray-800 text-white pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm placeholder:text-gray-600"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 text-primary-500 hover:text-primary-400 p-1 rounded-md transition-colors"
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
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-gray-600 text-xs">
                        © {currentYear} {storeName}. All rights reserved.
                    </p>

                    <div className="flex items-center gap-3 opacity-50 grayscale">
                        {['VISA', 'MC', 'PAYPAL', 'AMEX'].map((pm, i) => (
                            <div key={i} className="text-[10px] font-bold tracking-wider text-gray-500">
                                {pm}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
