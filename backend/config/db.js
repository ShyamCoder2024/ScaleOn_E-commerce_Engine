import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Set Google DNS resolvers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Resolve MongoDB SRV record using Google DNS API as fallback
 */
async function resolveSRV(hostname) {
    try {
        // First try native DNS
        return new Promise((resolve, reject) => {
            dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, addresses) => {
                if (err) reject(err);
                else resolve(addresses);
            });
        });
    } catch (error) {
        console.log('Native DNS failed, trying Google DNS API...');
        // Fallback to Google DNS-over-HTTPS
        const response = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`);
        const data = await response.json();
        if (data.Answer) {
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
        throw new Error('Could not resolve SRV record');
    }
}

/**
 * Build standard connection string from SRV record
 */
function buildStandardUri(srvRecords, originalUri) {
    const uri = new URL(originalUri.replace('mongodb+srv://', 'mongodb://'));
    const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

    // Extract database name from path or default
    const dbName = uri.pathname.slice(1) || 'scaleon_commerce';

    return `mongodb://${uri.username}:${uri.password}@${hosts}/${dbName}?ssl=true&replicaSet=atlas-${Date.now()}-shard-0&authSource=admin`;
}

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce';

    try {
        // If it's an SRV connection and we're having issues, try to resolve manually
        if (mongoUri.startsWith('mongodb+srv://')) {
            console.log('🔄 Attempting MongoDB connection...');
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        // If SRV lookup failed, try manual resolution
        if (error.message.includes('ENOTFOUND') && mongoUri.startsWith('mongodb+srv://')) {
            console.log('🔄 SRV lookup failed. Trying manual resolution...');

            try {
                const url = new URL(mongoUri.replace('mongodb+srv://', 'https://'));
                const srvRecords = await resolveSRV(url.hostname);

                if (srvRecords && srvRecords.length > 0) {
                    console.log('✅ Manually resolved SRV records:', srvRecords.length, 'hosts');
                    const standardUri = buildStandardUri(srvRecords, mongoUri);

                    const conn = await mongoose.connect(standardUri, {
                        serverSelectionTimeoutMS: 15000,
                        socketTimeoutMS: 45000,
                        family: 4,
                    });

                    console.log(`✅ MongoDB Connected (via manual SRV): ${conn.connection.host}`);
                    return;
                }
            } catch (fallbackError) {
                console.error('❌ Manual SRV resolution also failed:', fallbackError.message);
            }
        }

        process.exit(1);
    }
};

export default connectDB;
