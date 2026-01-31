import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Mail, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const LiveChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    // Auto-fill name and email if user is logged in
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.name && user?.email) {
            setFormData(prev => ({
                ...prev,
                name: user.name,
                email: user.email
            }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/support/chat', formData);

            if (response.data.success) {
                toast.success('Message sent! We\'ll get back to you soon.');

                // Reset message field but keep name and email
                setFormData(prev => ({
                    ...prev,
                    message: ''
                }));

                // Close chat after 2 seconds
                setTimeout(() => setIsOpen(false), 2000);
            }
        } catch (error) {
            console.error('Support chat error:', error);
            toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 ${isOpen
                        ? 'bg-gray-700 hover:bg-gray-800'
                        : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform group-hover:rotate-90" />
                ) : (
                    <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-bounce" />
                )}

                {/* Notification Badge (Optional - remove if not needed) */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 sm:bottom-28 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">Customer Support</h3>
                                <p className="text-xs text-blue-100">We typically reply within 24 hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div className="p-5 bg-gray-50">
                        {/* Welcome Message */}
                        <div className="mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-700">
                                👋 Hi there! How can we help you today? Send us a message and we'll get back to you soon.
                            </p>
                        </div>

                        {/* Contact Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label htmlFor="chat-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="chat-name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="chat-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="chat-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="chat-message" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    id="chat-message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Tell us how we can help you..."
                                    rows="4"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            You'll receive a confirmation email
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default LiveChat;
