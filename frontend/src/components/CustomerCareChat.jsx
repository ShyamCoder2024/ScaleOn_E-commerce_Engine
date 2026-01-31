import { useState } from 'react';
import { Send, Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CustomerCareChat = ({ userName, userEmail }) => {
    const [formData, setFormData] = useState({
        name: userName || '',
        email: userEmail || '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

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
                setMessageSent(true);

                // Reset message field
                setFormData(prev => ({
                    ...prev,
                    message: ''
                }));

                // Hide success message after 5 seconds
                setTimeout(() => setMessageSent(false), 5000);
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <MessageCircle className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Live Support Chat</h3>
                    <p className="text-sm text-gray-600">Send us a message and we'll respond within 24 hours</p>
                </div>
            </div>

            {messageSent && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                    <p className="text-sm text-green-800 font-medium">
                        Message sent successfully! Check your email for confirmation.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="support-name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            id="support-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="support-email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Email
                        </label>
                        <input
                            id="support-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="support-message" className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Message
                    </label>
                    <textarea
                        id="support-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        rows="6"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm"
                        disabled={isSubmitting}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Please provide as much detail as possible so we can assist you better.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Send Message
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CustomerCareChat;
