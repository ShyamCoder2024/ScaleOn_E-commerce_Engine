import { useState, useEffect } from 'react';
import { Plus, Trash2, Image, ExternalLink, AlertCircle, Upload, X, Link2 } from 'lucide-react';
import { featureCardsAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import toast from 'react-hot-toast';

const FeatureCards = () => {
    const { isFeatureEnabled } = useConfig();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCard, setNewCard] = useState({ image: '', title: '', link: '' });
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState('');

    const featureEnabled = isFeatureEnabled('featureCards');

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await featureCardsAPI.getAdminCards();
            setCards(response.data.data.cards || []);
        } catch (err) {
            console.error('Failed to fetch feature cards:', err);
            toast.error('Failed to load feature cards');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async () => {
        if (!newCard.image) {
            toast.error('Please enter an image URL');
            return;
        }

        setSaving(true);
        try {
            const response = await featureCardsAPI.add(newCard);
            setCards(response.data.data.cards);
            setNewCard({ image: '', title: '', link: '' });
            setImagePreview('');
            setShowAddModal(false);
            toast.success('Feature card added!');
        } catch (err) {
            console.error('Failed to add card:', err);
            toast.error('Failed to add feature card');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCard = async (id) => {
        if (!confirm('Delete this feature card?')) return;

        try {
            const response = await featureCardsAPI.remove(id);
            setCards(response.data.data.cards);
            toast.success('Feature card deleted');
        } catch (err) {
            console.error('Failed to delete card:', err);
            toast.error('Failed to delete feature card');
        }
    };

    const handleImageUrlChange = (url) => {
        setNewCard(prev => ({ ...prev, image: url }));
        setImagePreview(url);
    };

    const openModal = () => {
        setNewCard({ image: '', title: '', link: '' });
        setImagePreview('');
        setShowAddModal(true);
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
                    <div className="h-10 bg-slate-200 rounded-xl w-32 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-video bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feature Cards</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Manage promotional banners for your homepage carousel
                    </p>
                </div>
                <button
                    onClick={openModal}
                    disabled={!featureEnabled}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <Plus size={18} />
                    Add Card
                </button>
            </div>

            {/* Feature Disabled Warning */}
            {!featureEnabled && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-amber-100/50 rounded-full shrink-0">
                        <AlertCircle className="text-amber-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900">Feature Cards Disabled</h3>
                        <p className="text-sm text-amber-800 mt-1">
                            Go to Settings → Feature Toggles to enable this section.
                        </p>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No feature cards yet</h3>
                    <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">
                        Add promotional banners like discount posters, new collection announcements, or seasonal offers.
                    </p>
                    <button
                        onClick={openModal}
                        disabled={!featureEnabled}
                        className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add Your First Card
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <div
                            key={card.id}
                            className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Image */}
                            <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                <img
                                    src={card.image}
                                    alt={card.title || `Banner ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/800x450?text=Image+Error';
                                    }}
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Badge */}
                                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold px-2 py-1 rounded-lg">
                                    POS {index + 1}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 truncate text-lg mb-1">
                                    {card.title || 'Untitled Banner'}
                                </h3>
                                {card.link ? (
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium truncate">
                                        <Link2 size={14} />
                                        {card.link}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No link attached</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Card Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Add Feature Card</h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Image URL Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Banner Image URL <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={newCard.image}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />


                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                            onLoad={(e) => {
                                                e.target.style.display = 'block';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Title <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCard.title}
                                    onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Summer Sale"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>

                            {/* Link Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Link <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCard.link}
                                    onChange={(e) => setNewCard(prev => ({ ...prev, link: e.target.value }))}
                                    placeholder="/products/category-name"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewCard({ image: '', title: '', link: '' });
                                    setImagePreview('');
                                }}
                                className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCard}
                                disabled={saving || !newCard.image}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {saving ? 'Adding...' : 'Add Card'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeatureCards;
