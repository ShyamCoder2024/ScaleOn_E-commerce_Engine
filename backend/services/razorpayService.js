import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
    constructor() {
        this.razorpay = null;
        this.initialized = false;
    }

    // Lazy initialization - called on first use to ensure env vars are loaded
    ensureInitialized() {
        if (this.initialized) return;
        this.initialized = true;

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret && keyId !== 'your_razorpay_key_id') {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
            console.log('✅ Razorpay initialized');
        } else {
            console.log('⚠️ Razorpay not configured - missing API keys');
        }
    }

    isConfigured() {
        this.ensureInitialized();
        return this.razorpay !== null;
    }

    getKeyId() {
        return process.env.RAZORPAY_KEY_ID;
    }

    /**
     * Create Razorpay order
     * @param {number} amount - Amount in paise
     * @param {string} currency - Currency code (INR)
     * @param {string} receipt - Order receipt/ID
     * @returns {Promise<Object>} Razorpay order
     */
    async createOrder(amount, currency = 'INR', receipt) {
        this.ensureInitialized();
        if (!this.razorpay) {
            throw new Error('Razorpay is not configured');
        }

        const options = {
            amount: amount, // Amount in paise
            currency,
            receipt,
            payment_capture: 1 // Auto capture
        };

        try {
            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay order creation failed:', error);
            throw new Error(`Failed to create Razorpay order: ${error.message}`);
        }
    }

    /**
     * Verify payment signature
     * @param {string} orderId - Razorpay order ID
     * @param {string} paymentId - Razorpay payment ID
     * @param {string} signature - Razorpay signature
     * @returns {boolean} Whether signature is valid
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay secret not configured');
        }

        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Verify webhook signature
     * @param {string} body - Raw request body
     * @param {string} signature - Webhook signature
     * @returns {boolean} Whether signature is valid
     */
    verifyWebhookSignature(body, signature) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.warn('Razorpay webhook secret not configured');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Fetch payment details from Razorpay
     * @param {string} paymentId - Razorpay payment ID
     * @returns {Promise<Object>} Payment details
     */
    async fetchPayment(paymentId) {
        if (!this.razorpay) {
            throw new Error('Razorpay is not configured');
        }

        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            console.error('Failed to fetch payment:', error);
            throw new Error(`Failed to fetch payment: ${error.message}`);
        }
    }

    /**
     * Initiate refund
     * @param {string} paymentId - Razorpay payment ID
     * @param {number} amount - Refund amount in paise
     * @returns {Promise<Object>} Refund details
     */
    async createRefund(paymentId, amount) {
        if (!this.razorpay) {
            throw new Error('Razorpay is not configured');
        }

        try {
            const refund = await this.razorpay.payments.refund(paymentId, {
                amount
            });
            return refund;
        } catch (error) {
            console.error('Refund failed:', error);
            throw new Error(`Failed to create refund: ${error.message}`);
        }
    }
}

// Export singleton instance
export default new RazorpayService();
