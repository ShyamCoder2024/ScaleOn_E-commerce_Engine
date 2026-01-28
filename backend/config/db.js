import mongoose from 'mongoose';
import https from 'https';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Set Google DNS resolvers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Make HTTPS request (works on all Node versions)
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

/**
 * Resolve MongoDB SRV using Google DNS-over-HTTPS API
 */
async function resolveSRVviaGoogle(hostname) {
    console.log(`🔍 Resolving SRV via Google DNS: _mongodb._tcp.${hostname}`);
    const data = await httpsGet(`https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`);

    if (data.Answer && data.Answer.length > 0) {
        return data.Answer.map(a => {
            const parts = a.data.split(' ');
            return {
                priority: parseInt(parts[0]),
                weight: parseInt(parts[1]),
                port: parseInt(parts[2]),
                name: parts[3].replace(/\.$/, '')
            };
        });
    }
    throw new Error('No SRV records found');
}

/**
 * Resolve TXT record for authSource via Google DNS
 */
async function resolveTXTviaGoogle(hostname) {
    try {
        const data = await httpsGet(`https://dns.google/resolve?name=${hostname}&type=TXT`);
        if (data.Answer && data.Answer.length > 0) {
            const txt = data.Answer[0].data.replace(/"/g, '');
            const params = new URLSearchParams(txt);
            return params.get('authSource') || 'admin';
        }
    } catch (e) {
        console.log('TXT resolution failed, using default authSource=admin');
    }
    return 'admin';
}

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce';

        console.log(`🔄 Connecting to MongoDB...`);

        // ===========================================
        // ENTERPRISE-GRADE CONNECTION CONFIGURATION
        // ===========================================
        const conn = await mongoose.connect(mongoUri, {
            // Connection Pool Settings - CRITICAL FOR MULTI-USER SUPPORT
            minPoolSize: 5,          // Keep 5 connections always ready
            maxPoolSize: 50,         // Allow up to 50 concurrent connections
            maxIdleTimeMS: 30000,    // Recycle idle connections after 30s

            // Timeout Settings - More lenient for production stability
            serverSelectionTimeoutMS: 30000,   // 30s (was 5s - too aggressive)
            socketTimeoutMS: 45000,            // 45s for slow queries
            connectTimeoutMS: 10000,           // 10s for initial connection

            // Monitoring & Stability
            retryWrites: true,                 // Auto-retry write operations
            retryReads: true,                  // Auto-retry read operations  
            w: 'majority',                     // Write concern for durability
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Connection Pool: min=${5}, max=${50}`);

        setupConnectionHandlers();
        monitorConnectionPool();
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error(`💡 Tip: Check MongoDB connection string and network connectivity`);
        process.exit(1);
    }
};

function setupConnectionHandlers() {
    mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected - attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
        console.log('\n🛑 Shutting down gracefully...');
        try {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during shutdown:', err);
            process.exit(1);
        }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

/**
 * Monitor connection pool health
 * Logs pool statistics every 5 minutes in production
 */
function monitorConnectionPool() {
    // Only monitor in production to avoid console spam
    if (process.env.NODE_ENV !== 'production') return;

    setInterval(() => {
        const poolStats = mongoose.connection.db?.serverConfig?.s?.pool;
        if (poolStats) {
            console.log('📊 Connection Pool Stats:', {
                available: poolStats.availableConnections?.length || 0,
                inUse: poolStats.inUseConnections?.length || 0,
                total: poolStats.totalConnectionCount || 0
            });
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

export default connectDB;
