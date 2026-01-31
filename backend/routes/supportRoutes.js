/**
 * Support Routes
 * Handles customer support chat messages
 */

import express from 'express';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/support/chat
 * Send customer support message to admin email
 */
router.post('/chat', async (req, res, next) => {
    try {
        const { name, email, message, productId, productName } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Compose email to admin
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@yourstore.com';

        let emailSubject = `🔔 Customer Support: Message from ${name}`;
        let emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
    <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            🔔 New Customer Support Message
        </h2>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">Customer Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; background-color: #f3f4f6; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 8px; background-color: #f3f4f6;">${name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Email:</td>
                    <td style="padding: 8px;"><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></td>
                </tr>
                ${productName ? `
                <tr>
                    <td style="padding: 8px; background-color: #f3f4f6; font-weight: bold;">Product:</td>
                    <td style="padding: 8px; background-color: #f3f4f6;">${productName}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">Message:</h3>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;">
                <p style="color: #1f2937; line-height: 1.6; margin: 0;">${message}</p>
            </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Reply directly to this email to respond to the customer.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
            This message was sent from your ScaleOn E-commerce Store Live Chat
        </p>
    </div>
</div>
        `;

        // Send email to admin
        await emailService.sendEmail({
            to: adminEmail,
            subject: emailSubject,
            html: emailBody,
            replyTo: email // Admin can reply directly to customer
        });

        // Send confirmation email to customer
        const customerEmailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
    <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Hi ${name},
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We've received your message and our support team will get back to you as soon as possible. 
            We typically respond within 24 hours.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; margin-bottom: 5px;"><strong>Your Message:</strong></p>
            <p style="color: #1f2937; margin: 0;">${message}</p>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            If you have any additional information to add, feel free to reply to this email.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6;">
            Best regards,<br>
            <strong>ScaleOn Support Team</strong>
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
            This is an automated confirmation email from ScaleOn E-commerce Store
        </p>
    </div>
</div>
        `;

        await emailService.sendEmail({
            to: email,
            subject: 'We received your message - ScaleOn Support',
            html: customerEmailBody
        });

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!'
        });
    } catch (error) {
        console.error('Support chat error:', error);
        next(error);
    }
});

export default router;
