# ScaleOn Commerce Engine (SCE)

A modern, full-stack e-commerce platform built with React, Node.js, Express, and MongoDB.

![ScaleOn Commerce](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### Customer Features
- 🛍️ Product browsing with filters, search, and pagination
- 🛒 Shopping cart with real-time updates
- 💳 Multiple payment methods (COD, Razorpay, Stripe)
- 📦 Order tracking and history
- 👤 User accounts with address management

### Admin Features
- 📊 Dashboard with stats and analytics
- 📦 Product management (CRUD)
- 📋 Order management with status updates
- 👥 Customer management
- ⚙️ Store configuration and feature flags

### Technical Highlights
- 🔐 JWT authentication with refresh tokens
- 🛡️ Security (Helmet, CORS, rate limiting)
- 📧 Email notifications (nodemailer)
- 💾 MongoDB with Mongoose ODM
- ⚡ React with lazy loading and code splitting
- 🎨 Tailwind CSS for styling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Module_E-Com
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

5. **Seed the database**
```bash
npm run seed
```

6. **Start development servers**
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store.com | Admin@123456 |
| Customer | customer@test.com | Customer@123 |

## 📁 Project Structure

```
Module_E-Com/
├── backend/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Seed and utility scripts
│   ├── services/        # Business logic services
│   └── server.js        # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── layouts/     # Layout components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── index.html
├── .env.example         # Environment template
├── package.json         # Root package.json
└── README.md
```

## 🔧 Environment Variables

See `.env.example` for all available options:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key | For payments |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `SMTP_HOST` | Email SMTP host | For emails |

## 📜 Available Scripts

### Root Level
```bash
npm run dev          # Start both frontend and backend in dev mode
npm run dev:backend  # Start only backend
npm run dev:frontend # Start only frontend
npm run seed         # Seed database with sample data
npm run build        # Build frontend for production
```

### Backend
```bash
cd backend
npm run dev      # Start with nodemon
npm start        # Start production server
```

### Frontend
```bash
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| POST | /api/products | Create (admin) |
| PUT | /api/products/:id | Update (admin) |
| DELETE | /api/products/:id | Delete (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | User orders |
| GET | /api/orders/:id | Order details |
| POST | /api/orders/:id/cancel | Cancel order |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/customers | List customers |
| GET | /api/orders/admin/all | All orders |

## 🚢 Deployment

### Docker
```bash
docker-compose up -d
```

### Production Build
```bash
npm run build
cd backend && npm start
```

### Environment
Set `NODE_ENV=production` and ensure all required environment variables are set.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
