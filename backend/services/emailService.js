import nodemailer from 'nodemailer';
import configService from './configService.js';

/**
 * Email Service
 * Handles all transactional email sending
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    if (this.initialized) return;

    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only create transporter if SMTP is configured
    if (smtpConfig.auth.user && smtpConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(smtpConfig);
      this.initialized = true;
      console.log('✅ Email service initialized');
    } else {
      console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASS in .env');
    }
  }

  /**
   * Get store name from config
   */
  async getStoreName() {
    try {
      return await configService.get('store.name', 'Store');
    } catch {
      return 'Store';
    }
  }

  /**
   * Get email from address
   */
  getFromAddress() {
    const fromName = process.env.EMAIL_FROM_NAME || 'Store';
    const fromEmail = process.env.EMAIL_FROM || 'noreply@store.com';
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * Send email - main method
   * Accepts either (to, subject, html) or ({ to, subject, html, text })
   */
  async sendEmail(toOrOptions, subject = null, html = null, text = null) {
    await this.initialize();

    let mailOptions;

    if (typeof toOrOptions === 'object' && toOrOptions.to) {
      // Object format
      mailOptions = {
        from: this.getFromAddress(),
        to: toOrOptions.to,
        subject: toOrOptions.subject,
        html: toOrOptions.html,
        text: toOrOptions.text || this.htmlToText(toOrOptions.html)
      };
    } else {
      // Legacy format
      mailOptions = {
        from: this.getFromAddress(),
        to: toOrOptions,
        subject,
        html,
        text: text || this.htmlToText(html)
      };
    }

    if (!this.transporter) {
      console.log('📧 Email would be sent to:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      return { messageId: 'dev-mode', success: true };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<script[^>]*>.*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, token, name = 'User') {
    const storeName = await this.getStoreName();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937;">Welcome to ${storeName}!</h1>
            <p>Hi ${name},</p>
            <p>Thank you for creating an account. Please verify your email:</p>
            <p style="margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
          </div>
        `;

    return this.sendEmail(email, `Verify your email - ${storeName}`, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token, name = 'User') {
    const storeName = await this.getStoreName();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937;">Reset Your Password</h1>
            <p>Hi ${name},</p>
            <p>Click the button below to reset your password:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Reset Password
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
          </div>
        `;

    return this.sendEmail(email, `Reset your password - ${storeName}`, html);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(email, data) {
    const storeName = await this.getStoreName();

    const itemsHtml = data.items.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
          </tr>
        `).join('');

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #10b981; border-radius: 50%; padding: 16px; width: 32px; height: 32px;">
                <span style="color: white; font-size: 24px;">✓</span>
              </div>
            </div>
            <h1 style="color: #1f2937; text-align: center;">Order Confirmed!</h1>
            <p style="color: #6b7280; text-align: center;">Order #${data.orderId}</p>
            
            <p>Hi ${data.customerName},</p>
            <p>Thank you for your order! We'll notify you when it ships.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px;">Order Summary</h3>
              <table width="100%" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left;">Item</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right;">Subtotal</td>
                    <td style="padding: 8px 12px; text-align: right;">₹${data.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right;">Shipping</td>
                    <td style="padding: 8px 12px; text-align: right;">${data.shipping > 0 ? '₹' + data.shipping.toFixed(2) : 'Free'}</td>
                  </tr>
                  ${data.tax > 0 ? `
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right;">Tax</td>
                    <td style="padding: 8px 12px; text-align: right;">₹${data.tax.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">₹${data.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px;">Shipping Address</h3>
              <p style="margin: 0; line-height: 1.6;">
                ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                ${data.shippingAddress.street}<br>
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
              </p>
            </div>

            ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
            
            <p style="margin-top: 30px;">Thank you for shopping with ${storeName}!</p>
          </div>
        `;

    return this.sendEmail(email, `Order Confirmed - ${data.orderId}`, html);
  }

  /**
   * Send order shipped email
   */
  async sendOrderShipped(email, data) {
    const storeName = await this.getStoreName();

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937;">Your Order is On Its Way! 🚚</h1>
            <p>Hi ${data.customerName},</p>
            <p>Great news! Your order <strong>${data.orderId}</strong> has been shipped.</p>
            
            ${data.trackingNumber ? `
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0 0 8px;">Tracking Number:</p>
              <p style="font-size: 18px; font-weight: 600; margin: 0;">${data.trackingNumber}</p>
              ${data.carrier ? `<p style="color: #6b7280; margin: 8px 0 0;">Carrier: ${data.carrier}</p>` : ''}
            </div>
            ${data.trackingUrl ? `
            <p style="margin: 20px 0;">
              <a href="${data.trackingUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Track Your Package
              </a>
            </p>
            ` : ''}
            ` : ''}
            
            ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
            
            <p style="margin-top: 30px;">Thank you for shopping with ${storeName}!</p>
          </div>
        `;

    return this.sendEmail(email, `Your order has been shipped - ${data.orderId}`, html);
  }

  /**
   * Send admin notification for new order
   */
  async sendAdminNewOrderNotification(data) {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    if (!adminEmail) {
      console.log('Admin email not configured, skipping notification');
      return { success: false };
    }

    const storeName = await this.getStoreName();

    const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937;">🎉 New Order Received!</h1>
            <p>You have a new order to process.</p>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>Order ID:</strong> ${data.orderId}</p>
              <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${data.customerName}</p>
              <p style="margin: 0 0 8px;"><strong>Email:</strong> ${data.customerEmail}</p>
              <p style="margin: 0 0 8px;"><strong>Items:</strong> ${data.itemCount}</p>
              <p style="margin: 0;"><strong>Total:</strong> ₹${data.total.toFixed(2)}</p>
            </div>
            <p>
              <a href="${process.env.FRONTEND_URL}/admin/orders" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Orders
              </a>
            </p>
          </div>
        `;

    return this.sendEmail(adminEmail, `New Order - ${data.orderId}`, html);
  }
}

export default new EmailService();
