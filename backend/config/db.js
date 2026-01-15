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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce';

    console.log('🔄 Attempting MongoDB connection...');

    // If using SRV, try manual resolution FIRST since Render has DNS issues
    if (mongoUri.startsWith('mongodb+srv://')) {
        try {
            // Parse the SRV URI
            const srvUrl = new URL(mongoUri.replace('mongodb+srv://', 'https://'));
            const hostname = srvUrl.hostname;
            const username = srvUrl.username;
            const password = srvUrl.password;
            const dbName = srvUrl.pathname.slice(1).split('?')[0] || 'scaleon_commerce';

            console.log(`📡 Resolving SRV for: ${hostname}`);

            // Resolve SRV records via Google DNS
            const srvRecords = await resolveSRVviaGoogle(hostname);
            console.log(`✅ Found ${srvRecords.length} MongoDB hosts`);

            // Build hosts string
            const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

            // Get authSource from TXT record
            const authSource = await resolveTXTviaGoogle(hostname);

            // Build standard connection string
            const standardUri = `mongodb://${username}:${password}@${hosts}/${dbName}?ssl=true&authSource=${authSource}&retryWrites=true&w=majority`;

            console.log('🔗 Connecting with resolved hosts...');

            const conn = await mongoose.connect(standardUri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                family: 4,
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            setupConnectionHandlers();
            return;

        } catch (srvError) {
            console.error('❌ SRV resolution failed:', srvError.message);

            // Try direct connection as last resort
            console.log('🔄 Trying direct connection...');
            try {
                const conn = await mongoose.connect(mongoUri, {
                    serverSelectionTimeoutMS: 30000,
                    socketTimeoutMS: 45000,
                    family: 4,
                });
                console.log(`✅ MongoDB Connected (direct): ${conn.connection.host}`);
                setupConnectionHandlers();
                return;
            } catch (directError) {
                console.error('❌ Direct connection also failed:', directError.message);
                process.exit(1);
            }
        }
    } else {
        // Standard connection (non-SRV)
        try {
            const conn = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            setupConnectionHandlers();
        } catch (error) {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
            process.exit(1);
        }
    }
};

function setupConnectionHandlers() {
    mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    });
}

export default connectDB;
