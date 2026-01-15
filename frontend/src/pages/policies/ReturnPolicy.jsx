import React from 'react';

const ReturnPolicy = () => {
    return (
        <div className="container-custom py-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Return Policy</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    We want you to be completely satisfied with your purchase. If you're not happy, we're here to help.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Returns</h2>
                <p className="mb-4">
                    You have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. Your item must be in the original packaging.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Refunds</h2>
                <p className="mb-4">
                    Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.
                </p>
                <p className="mb-4">
                    If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of days, depending on your card issuer's policies.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Shipping</h2>
                <p className="mb-4">
                    You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                <p className="mb-4">
                    If you have any questions on how to return your item to us, contact us at support@scaleon.com.
                </p>
            </div>
        </div>
    );
};

export default ReturnPolicy;
