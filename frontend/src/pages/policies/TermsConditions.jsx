import { useConfig } from '../../context/ConfigContext';

const TermsConditions = () => {
    const { policies = {}, storeName } = useConfig();
    const terms = policies?.terms || {
        minAge: 18,
        accountRequired: false,
        cancelBeforeShipping: true
    };

    return (
        <div className="container-custom py-12 max-w-4xl mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    Please read these terms and conditions carefully before using {storeName}.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Eligibility</h2>
                <p className="mb-4">
                    You must be at least <strong>{terms.minAge} years old</strong> to make purchases on this website.
                    By placing an order, you confirm that you meet this age requirement.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Account & Checkout</h2>
                {terms.accountRequired ? (
                    <p className="mb-4">
                        An account is required to complete checkout. Creating an account allows you to track orders, save addresses, and enjoy a faster checkout experience. You are responsible for maintaining the confidentiality of your account credentials.
                    </p>
                ) : (
                    <p className="mb-4">
                        Guest checkout is available for your convenience. However, creating an account allows you to track orders, save shipping addresses, view order history, and enjoy a faster checkout experience.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Order Cancellation</h2>
                {terms.cancelBeforeShipping ? (
                    <p className="mb-4">
                        Orders can be cancelled before they are shipped. To request a cancellation, please contact our customer support team as soon as possible. Once an order has been shipped, it cannot be cancelled, but you may initiate a return after delivery.
                    </p>
                ) : (
                    <p className="mb-4">
                        Orders cannot be cancelled once placed. Please review your order carefully before completing your purchase. If you wish to return an item after delivery, please refer to our Return Policy.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Pricing & Availability</h2>
                <p className="mb-4">
                    All prices are displayed in the store's currency and include applicable taxes unless otherwise stated. We reserve the right to modify prices at any time. Product availability is subject to change without notice.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Product Information</h2>
                <p className="mb-4">
                    We strive to display accurate product descriptions and images. However, we cannot guarantee that your device's display accurately reflects the actual colors of products. Minor variations in color, size, or appearance may occur.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
                <p className="mb-4">
                    All content on this website, including but not limited to text, images, logos, graphics, and software, is protected by copyright and other intellectual property rights. You may not reproduce, distribute, or use any content without prior written permission.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
                <p className="mb-4">
                    {storeName} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services or products. Our liability is limited to the amount you paid for the specific product or service in question.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Changes to Terms</h2>
                <p className="mb-4">
                    We reserve the right to update these terms and conditions at any time. Changes will be effective immediately upon posting. Your continued use of the website after changes constitutes acceptance of the new terms.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about these terms, please contact our customer support team.
                </p>
            </div>
        </div>
    );
};

export default TermsConditions;
