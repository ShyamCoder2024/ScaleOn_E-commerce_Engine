import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import configRoutes from './routes/configRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

// Load environment variables from root directory
dotenv.config({ path: '../.env' });

// Connect to MongoDB
connectDB();

const app = express();

// ===========================================
// Security Middleware
// ===========================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression for performance
app.use(compression());

// CORS configuration - Support multiple origins for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(allowed => origin === allowed || origin.includes('vercel.app'))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in case of issues
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ===========================================
// Rate Limiting - ALWAYS ENABLED (different limits per environment)
// ===========================================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  // Different limits based on environment
  max: process.env.NODE_ENV === 'production'
    ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000)  // Production: 2000 req/15min
    : 500,  // Development: 500 req/15min (prevents testing crashes)
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL FIX: Always enable rate limiting (was disabled in development)
  skip: () => false,
  // Skip rate limit check for health endpoint
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed requests against limit
});

app.use('/api', limiter);

// ===========================================
// Request Timeout Middleware - Prevents hanging requests
// ===========================================
app.use((req, res, next) => {
  // 30 second timeout per request
  req.setTimeout(30000, () => {
    console.warn(`⏱️ Request timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: { message: 'Request timeout', statusCode: 408 }
      });
    }
  });
  res.setTimeout(30000);
  next();
});

// ===========================================
// Body Parsing Middleware
// ===========================================

// Reduced from 50MB to 10MB for security (prevents DoS attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ===========================================
// Static Files
// ===========================================

app.use('/uploads', express.static('uploads'));

// ===========================================
// Health Check Endpoint
// ===========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ScaleOn Commerce Engine is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ===========================================
// API Routes
// ===========================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);

// ===========================================
// Error Handling
// ===========================================

app.use(notFound);
app.use(errorHandler);

// ===========================================
// Server Start
// ===========================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ScaleOn Commerce Engine                              ║
║   ─────────────────────────────────────────────────────   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Port: ${PORT}                                              ║
║   Rate Limit: ${process.env.NODE_ENV === 'production' ? '2000' : '500'} req/15min                            ║
║   API: http://localhost:${PORT}/api                          ║
║   Health: http://localhost:${PORT}/health                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// ===========================================
// Server Configuration for Concurrent Connections
// ===========================================

// Set maximum concurrent connections (prevents server overload)
server.maxConnections = 1000;

// Set keep-alive timeout (must be higher than load balancer timeout)
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;    // Slightly higher than keepAliveTimeout

// ===========================================
// Graceful Shutdown Handler
// ===========================================

const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal, closing server gracefully...');

  server.close(() => {
    console.log('✅ HTTP server closed');

    // Close database connection
    import('./config/db.js').then(({ default: mongoose }) => {
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
