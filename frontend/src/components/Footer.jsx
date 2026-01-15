import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, CreditCard, Send } from 'lucide-react';

const Footer = () => {
    const { config, storeName } = useConfig();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Contact */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-6">{storeName}</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            {config.store?.description || 'Your premium destination for quality products. We believe in style, quality, and exceptional customer service.'}
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-400">
                                <MapPin size={18} className="text-primary-500" />
                                <span>123 Fashion Street, New York, NY 10001</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Phone size={18} className="text-primary-500" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Mail size={18} className="text-primary-500" />
                                <span>support@{storeName.toLowerCase()}.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6">Shop</h4>
                        <ul className="space-y-4">
                            <li><Link to="/products" className="hover:text-primary-400 transition-colors">All Products</Link></li>
                            <li><Link to="/products?sort=-createdAt" className="hover:text-primary-400 transition-colors">New Arrivals</Link></li>
                            <li><Link to="/products?sort=-salesCount" className="hover:text-primary-400 transition-colors">Best Sellers</Link></li>
                            <li><Link to="/wishlist" className="hover:text-primary-400 transition-colors">My Wishlist</Link></li>
                            <li><Link to="/cart" className="hover:text-primary-400 transition-colors">My Cart</Link></li>
                        </ul>
                    </div>

                    {/* Support & Policies */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6">Support</h4>
                        <ul className="space-y-4">
                            <li><Link to="/account" className="hover:text-primary-400 transition-colors">My Account</Link></li>
                            <li><Link to="/orders" className="hover:text-primary-400 transition-colors">Track Order</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-primary-400 transition-colors">Shipping Policy</Link></li>
                            <li><Link to="/return-policy" className="hover:text-primary-400 transition-colors">Returns & Exchanges</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6">Stay Connected</h4>
                        <p className="text-gray-400 mb-6">Subscribe to our newsletter for exclusive deals and updates.</p>

                        <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 bg-primary-600 text-white px-3 rounded-lg hover:bg-primary-500 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} {storeName}. All rights reserved.
                    </p>

                    {/* Payment Badges (Visual Representation) */}
                    <div className="flex items-center gap-3 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="h-8 bg-white/10 rounded px-2 flex items-center" title="Visa">
                            <span className="font-bold text-white text-xs italic tracking-widest">VISA</span>
                        </div>
                        <div className="h-8 bg-white/10 rounded px-2 flex items-center" title="Mastercard">
                            <div className="flex -space-x-1">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            </div>
                        </div>
                        <div className="h-8 bg-white/10 rounded px-2 flex items-center" title="PayPal">
                            <span className="font-bold text-blue-400 text-xs italic">PayPal</span>
                        </div>
                        <div className="h-8 bg-white/10 rounded px-2 flex items-center" title="Apple Pay">
                            <span className="font-bold text-white text-xs">Pay</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
