# Environment Variables Documentation

This document describes all environment variables used by the ScaleOn Commerce Engine.

## Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `5001` | Yes |
| `NODE_ENV` | Environment (development/production) | `development` | No |

## Database

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | - | Yes |

**Example:**
```
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/scaleon

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scaleon
```

## Authentication

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret for signing access tokens | - | Yes (production) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - | Yes (production) |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` | No |

**Security Note:** Use strong, random secrets in production. Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Password Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` | No |

Higher values = more secure but slower. 12 is recommended for production.

## Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Time window (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

## Email (SMTP)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server host | - | For emails |
| `SMTP_PORT` | SMTP server port | `587` | For emails |
| `SMTP_SECURE` | Use TLS | `false` | No |
| `SMTP_USER` | SMTP username | - | For emails |
| `SMTP_PASS` | SMTP password | - | For emails |
| `EMAIL_FROM` | From email address | - | For emails |
| `EMAIL_FROM_NAME` | From name | - | For emails |

**Gmail Configuration:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Note: Gmail requires an App Password (not your regular password). Enable 2FA first.

## Payment Gateways

### Razorpay
| Variable | Description | Required |
|----------|-------------|----------|
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | For Razorpay |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | For Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret | For Razorpay webhooks |

### Stripe
| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe Secret Key | For Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | For Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret | For Stripe webhooks |

## File Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | Local upload directory | `uploads` | No |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - | For Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - | For Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | - | For Cloudinary |

## Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed CORS origins | `*` | Production |
| `SESSION_SECRET` | Session signing secret | - | For sessions |
| `ENCRYPTION_KEY` | Data encryption key | - | For encryption |

## Default Admin

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEFAULT_ADMIN_EMAIL` | Initial admin email | `admin@store.com` | No |
| `DEFAULT_ADMIN_PASSWORD` | Initial admin password | `Admin@123456` | No |

**Important:** Change these immediately after first deployment!

---

## Quick Setup

1. Copy the example file:
```bash
cp .env.example .env
```

2. Set required variables:
```bash
# Minimum required for development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/scaleon
JWT_SECRET=your-development-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

3. For production, ensure all security-related variables are set with strong values.
