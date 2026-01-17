import { useConfig } from '../../context/ConfigContext';

const ReturnPolicy = () => {
    const { policies = {}, storeName } = useConfig();
    const returnPolicy = policies?.return || {
        allowed: true,
        windowDays: 7,
        exchangeAllowed: true,
        exchangeWindowDays: 7,
        shippingCost: 'customer',
        refundMethod: 'original',
        condition: 'unused'
    };

    const conditionText = returnPolicy.condition === 'unused'
        ? 'unused and in their original packaging with all tags attached'
        : 'in any condition';

    const shippingCostText = {
        'customer': 'You will be responsible for paying for your own shipping costs for returning your item',
        'store': 'We will provide a prepaid return label',
        'free': 'Free return shipping is included'
    }[returnPolicy.shippingCost] || 'You will be responsible for paying for your own shipping costs';

    const refundMethodText = returnPolicy.refundMethod === 'original'
        ? 'your original method of payment'
        : 'store credit';

    if (!returnPolicy.allowed) {
        return (
            <div className="container-custom py-12 max-w-4xl mx-auto px-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Return Policy</h1>
                <div className="prose prose-blue max-w-none text-gray-600">
                    <p className="text-lg">
                        {storeName} does not accept returns or exchanges at this time. All sales are final.
                        Please review your order carefully before completing your purchase.
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                    <p>
                        If you have any questions about our policy, please contact our customer support team.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-12 max-w-4xl mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Return Policy</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    We want you to be completely satisfied with your purchase. If you're not happy, we're here to help.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Returns</h2>
                <p className="mb-4">
                    You have <strong>{returnPolicy.windowDays} calendar days</strong> to return an item from the date you received it.
                    To be eligible for a return, your item must be {conditionText}.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Refunds</h2>
                <p className="mb-4">
                    Once we receive your item, we will inspect it and notify you that we have received your returned item.
                    We will immediately notify you on the status of your refund after inspecting the item.
                </p>
                <p className="mb-4">
                    If your return is approved, we will initiate a refund to {refundMethodText}. You will receive the credit within 5-7 business days, depending on your card issuer's policies.
                </p>

                {returnPolicy.exchangeAllowed && (
                    <>
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Exchanges</h2>
                        <p className="mb-4">
                            We offer exchanges within <strong>{returnPolicy.exchangeWindowDays} days</strong> of delivery.
                            If you would like to exchange your item for a different size or color, please contact our customer support team.
                        </p>
                    </>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipping</h2>
                <p className="mb-4">
                    {shippingCostText}. Shipping costs are non-refundable.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">How to Initiate a Return</h2>
                <ol className="list-decimal list-inside mb-4 space-y-2">
                    <li>Contact our customer support with your order number</li>
                    <li>Receive return authorization and instructions</li>
                    <li>Ship the item back to us</li>
                    <li>Receive your refund once the return is processed</li>
                </ol>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                <p className="mb-4">
                    If you have any questions on how to return your item to us, contact our customer support team.
                </p>
            </div>
        </div>
    );
};

export default ReturnPolicy;
