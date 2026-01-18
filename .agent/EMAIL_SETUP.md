# ScaleOn Commerce Engine - Email Setup Guide

## Overview

The email notification system is **fully implemented**. It sends:
- ✅ **Order Confirmation** to customers after placing an order
- ✅ **New Order Alert** to admin when orders are received
- ✅ **Shipping Notification** when order is shipped
- ✅ **Delivery Confirmation** when order is delivered
- ✅ **Cancellation Notice** when order is cancelled
- ✅ **Refund Notification** when refund is processed
- ✅ **Low Stock Alert** to admin for inventory management

---

## Required Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourstore.com
EMAIL_FROM_NAME=Your Store Name

# Admin email for notifications
DEFAULT_ADMIN_EMAIL=admin@yourstore.com
```

---

## Option 1: Gmail Setup (Recommended for Small Stores)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

### Step 2: Create App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other" as the device (name it "ScaleOn Store")
4. Copy the 16-character password

### Step 3: Configure .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password (no spaces needed)
EMAIL_FROM=your-gmail@gmail.com
EMAIL_FROM_NAME=Your Store Name
DEFAULT_ADMIN_EMAIL=your-gmail@gmail.com
```

---

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account
1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your sender email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Create a new API key with "Mail Send" permission
3. Copy the API key

### Step 3: Configure .env
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your API key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Store Name
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
```

---

## Option 3: Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Store Name
```

---

## Testing the Email System

### Method 1: Place a Test Order
1. Register as a customer
2. Add items to cart
3. Complete checkout
4. Check both customer email and admin email

### Method 2: Check Console Logs
Without SMTP configured, emails are logged to console:
```
📧 Email would be sent to: customer@example.com
Subject: Order Confirmed - ORD-20260118-ABC123
```

---

## Email Templates

All email templates are in `backend/services/emailService.js`:

| Method | Purpose |
|--------|---------|
| `sendOrderConfirmation()` | Customer order confirmation with items, totals, and shipping address |
| `sendAdminNewOrderNotification()` | New order alert to admin |
| `sendOrderShipped()` | Shipping notification with tracking info |
| `sendPasswordResetEmail()` | Password reset link |
| `sendVerificationEmail()` | Email verification link |

---

## Customizing Email Templates

Edit `backend/services/emailService.js` to customize:
- Logo and branding colors
- Email copy and messaging
- Footer and contact information

---

## Troubleshooting

### Emails Not Sending?
1. Check console for errors
2. Verify SMTP credentials are correct
3. For Gmail: Ensure App Password is used (not regular password)
4. Check spam folder

### Gmail "Less Secure Apps" Error?
Don't enable less secure apps. Use App Password instead (see Option 1).

### SendGrid Emails Going to Spam?
1. Verify your sending domain
2. Set up proper SPF/DKIM records
3. Use consistent "From" address

---

## Production Recommendations

| Sending Volume | Recommended Provider |
|----------------|---------------------|
| < 100 emails/day | Gmail (free) |
| 100-10,000/month | SendGrid Free Tier |
| 10,000+/month | SendGrid/Mailgun Paid |

---

## Related Files

| File | Purpose |
|------|---------|
| `backend/services/emailService.js` | Email templates and sending logic |
| `backend/services/notificationService.js` | Order notification orchestration |
| `backend/services/orderWorkflowService.js` | Triggers notifications on order events |
