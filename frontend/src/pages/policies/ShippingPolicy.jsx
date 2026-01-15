import React from 'react';

const ShippingPolicy = () => {
    return (
        <div className="container-custom py-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    At ScaleOn, we want to ensure your products arrive safely and on time. This policy outlines our shipping practices and what you can expect when ordering from us.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Processing Time</h2>
                <p className="mb-4">
                    All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipping Rates & Delivery Estimates</h2>
                <p className="mb-4">
                    Shipping charges for your order will be calculated and displayed at checkout.
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li><strong>Standard Shipping:</strong> 3-5 business days - Free for orders over $50</li>
                    <li><strong>Expedited Shipping:</strong> 2 business days - $12.95</li>
                    <li><strong>Overnight Shipping:</strong> 1 business day - $24.95</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipment Confirmation & Order Tracking</h2>
                <p className="mb-4">
                    You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Customs, Duties and Taxes</h2>
                <p className="mb-4">
                    ScaleOn is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Damages</h2>
                <p className="mb-4">
                    ScaleOn is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.
                </p>
            </div>
        </div>
    );
};

export default ShippingPolicy;
