import { useConfig } from '../../context/ConfigContext';

const PrivacyPolicy = () => {
    const { policies = {}, storeName } = useConfig();
    const privacy = policies?.privacy || {
        collectEmail: true,
        collectPhone: true,
        shareData: false,
        useCookies: true,
        storePayment: false
    };

    return (
        <div className="container-custom py-12 max-w-4xl mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

            <div className="prose prose-blue max-w-none text-gray-600">
                <p className="lead text-lg mb-8">
                    At {storeName}, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
                <p className="mb-4">
                    When you make a purchase or create an account, we collect the following information:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Name and shipping address</li>
                    {privacy.collectEmail && <li>Email address (for order confirmations and updates)</li>}
                    {privacy.collectPhone && <li>Phone number (for delivery updates and customer support)</li>}
                    <li>Order history and preferences</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
                <p className="mb-4">
                    Your personal information is used to:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Process and fulfill your orders</li>
                    <li>Send order confirmations and shipping updates</li>
                    <li>Provide customer support</li>
                    <li>Improve our services and user experience</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Data Sharing</h2>
                {privacy.shareData ? (
                    <p className="mb-4">
                        We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, or serving our users. These partners are bound by confidentiality agreements and may only use your data in connection with the services they perform for us.
                    </p>
                ) : (
                    <p className="mb-4">
                        We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data remains private and is only used to fulfill your orders and provide customer service.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Cookies</h2>
                {privacy.useCookies ? (
                    <p className="mb-4">
                        This website uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. Cookies are small files stored on your device that help us remember your preferences. By using our site, you consent to our use of cookies.
                    </p>
                ) : (
                    <p className="mb-4">
                        This website does not use tracking cookies. We respect your privacy and do not track your browsing behavior.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Payment Security</h2>
                {privacy.storePayment ? (
                    <p className="mb-4">
                        For your convenience, we offer the option to securely store payment information using industry-standard encryption. Your saved payment methods can be managed in your account settings. All transactions are processed through secure, PCI-compliant payment gateways.
                    </p>
                ) : (
                    <p className="mb-4">
                        We do not store your payment card information on our servers. All payment processing is handled securely by our PCI-compliant payment partners. Your financial information is never accessible to us.
                    </p>
                )}

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
                <p className="mb-4">
                    You have the right to:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Access the personal data we hold about you</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data (subject to legal requirements)</li>
                    <li>Opt out of marketing communications</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about our privacy practices, please contact our customer support team.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
