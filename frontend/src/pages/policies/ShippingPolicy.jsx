import { useConfig } from '../../context/ConfigContext';

const ShippingPolicy = () => {
    const { shipping = {}, storeName } = useConfig();

    // Generate shipping info from config
    const method = shipping?.method || 'flat';
    const flatRate = shipping?.flatRate ? (shipping.flatRate / 100) : 50;
    const freeThreshold = shipping?.freeThreshold ? (shipping.freeThreshold / 100) : 0;

    return (
        <div className="container-custom py-12 max-w-4xl mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    {storeName} is committed to delivering your orders quickly and safely.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipping Rates</h2>
                {method === 'free' ? (
                    <p className="mb-4">
                        We offer <strong>free shipping</strong> on all orders! No minimum purchase required.
                    </p>
                ) : method === 'flat' ? (
                    <div className="mb-4">
                        <p className="mb-2">
                            Standard shipping rate: <strong>₹{flatRate}</strong> per order.
                        </p>
                        {freeThreshold > 0 && (
                            <p className="text-emerald-600 font-medium">
                                🎉 Free shipping on orders above ₹{freeThreshold}!
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="mb-4">
                        Shipping costs are calculated based on your order value and delivery location.
                        The exact amount will be displayed at checkout.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Delivery Time</h2>
                <p className="mb-4">
                    Estimated delivery time is <strong>3-7 business days</strong> for most locations.
                    Delivery to remote areas may take an additional 2-3 business days.
                </p>
                <p className="mb-4">
                    Please note that delivery times are estimates and may vary based on:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Your delivery location</li>
                    <li>Product availability</li>
                    <li>Public holidays</li>
                    <li>Weather conditions</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Order Processing</h2>
                <p className="mb-4">
                    Orders are typically processed within 1-2 business days. You will receive an email confirmation with tracking information once your order has been shipped.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Tracking Your Order</h2>
                <p className="mb-4">
                    Once your order is shipped, you will receive tracking information via email. You can also track your order by logging into your account and viewing your order history.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipping Restrictions</h2>
                <p className="mb-4">
                    We currently ship to addresses within India. For international shipping inquiries, please contact our customer support team.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Damaged or Lost Packages</h2>
                <p className="mb-4">
                    If your package arrives damaged or is lost in transit, please contact us within 48 hours of the expected delivery date. We will work with our shipping partner to resolve the issue promptly.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about shipping, please contact our customer support team.
                </p>
            </div>
        </div>
    );
};

export default ShippingPolicy;
