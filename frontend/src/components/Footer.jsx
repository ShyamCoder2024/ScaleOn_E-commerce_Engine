import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send, ChevronDown } from 'lucide-react';

const FooterSection = ({ title, children, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border-b border-gray-800/50 md:border-none last:border-0 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-4 md:py-0 md:cursor-default group"
            >
                <h4 className="text-lg font-bold text-white group-hover:text-primary-400 md:group-hover:text-white transition-colors">
                    {title}
                </h4>
                <ChevronDown
                    size={20}
                    className={`text-gray-500 md:hidden transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:mb-0'}`}>
                <ul className="space-y-3 pt-2 md:pt-6">
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
        <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 pt-12 md:pt-20 pb-8 border-t border-gray-800">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">

                    {/* Brand & Contact - Takes up 4 cols on massive screens */}
                    <div className="lg:col-span-4 space-y-6">
                        <div>
                            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 inline-block">
                                {storeName}
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm max-w-sm">
                                {config.store?.description || 'Your premium destination for quality products. We believe in style, quality, and exceptional customer service.'}
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-start gap-3 text-gray-400 group">
                                <MapPin size={18} className="text-primary-500 mt-0.5 shrink-0 group-hover:text-primary-400 transition-colors" />
                                <span className="text-sm group-hover:text-gray-300 transition-colors">123 Fashion Street, New York, NY 10001</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 group">
                                <Phone size={18} className="text-primary-500 shrink-0 group-hover:text-primary-400 transition-colors" />
                                <span className="text-sm group-hover:text-gray-300 transition-colors">+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 group">
                                <Mail size={18} className="text-primary-500 shrink-0 group-hover:text-primary-400 transition-colors" />
                                <span className="text-sm group-hover:text-gray-300 transition-colors">support@{storeName.toLowerCase()}.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links Sections - 2 Cols each */}
                    <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-8 lg:gap-4">
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

                    {/* Newsletter - 4 Cols */}
                    <div className="lg:col-span-4 mt-8 lg:mt-0">
                        <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                            <h4 className="text-lg font-bold text-white mb-2">Stay Connected</h4>
                            <p className="text-gray-400 mb-4 text-sm">Subscribe to our newsletter for exclusive deals and updates.</p>

                            <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-gray-900/80 border border-gray-700 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-600 font-medium sm:text-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-2 bottom-2 bg-primary-600 text-white px-3 rounded-lg hover:bg-primary-500 transition-all shadow-lg hover:shadow-primary-600/30 active:scale-95 flex items-center justify-center"
                                        aria-label="Subscribe"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>

                            <div className="flex items-center gap-3">
                                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                    <a
                                        key={idx}
                                        href="#"
                                        className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-600/30"
                                    >
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800/80 pt-8 flex flex-col-reverse md:flex-row justify-between items-center gap-4 md:gap-6 text-center md:text-left">
                    <p className="text-gray-500 text-xs sm:text-sm">
                        © {currentYear} {storeName}. All rights reserved.
                    </p>

                    {/* Payment Badges - Minimalist */}
                    <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                        {['VISA', 'MC', 'PAYPAL', 'AMEX'].map((pm, i) => (
                            <div key={i} className="h-6 bg-white/5 rounded px-2 flex items-center justify-center border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-default text-[10px] font-bold tracking-wider text-gray-400">
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
