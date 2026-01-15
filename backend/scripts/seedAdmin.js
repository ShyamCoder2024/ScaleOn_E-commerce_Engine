/**
 * Seed Admin Script
 * Creates the initial super admin user
 * Run with: npm run seed:admin
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, FeatureFlag, StoreConfig } from '../models/index.js';
import { USER_ROLES, CONFIG_TYPES } from '../config/constants.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce');
        console.log('✅ Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });

        if (existingAdmin) {
            console.log('ℹ️  Super admin already exists:', existingAdmin.email);
        } else {
            // Create super admin
            const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@store.com';
            const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';

            const admin = new User({
                email: adminEmail,
                password: adminPassword,
                role: USER_ROLES.SUPER_ADMIN,
                profile: {
                    firstName: 'Super',
                    lastName: 'Admin'
                },
                emailVerified: true,
                status: 'active'
            });

            await admin.save();
            console.log('✅ Super admin created:', adminEmail);
            console.log('   Password:', adminPassword);
            console.log('   ⚠️  Please change the password after first login!');
        }

        // Initialize default feature flags
        console.log('\n📋 Initializing feature flags...');
        const features = await FeatureFlag.initializeDefaults();
        console.log(`✅ ${Object.keys(features).length} feature flags initialized`);

        // Initialize default store config
        console.log('\n📋 Initializing store configuration...');

        const defaultConfigs = [
            { key: 'store.name', value: 'My Store', type: CONFIG_TYPES.BRANDING },
            { key: 'store.email', value: 'contact@store.com', type: CONFIG_TYPES.BRANDING },
            { key: 'business.currency', value: 'INR', type: CONFIG_TYPES.BUSINESS_RULE },
            { key: 'business.currencySymbol', value: '₹', type: CONFIG_TYPES.BUSINESS_RULE },
            { key: 'shipping.method', value: 'flat', type: CONFIG_TYPES.SHIPPING },
            { key: 'shipping.flatRate', value: 5000, type: CONFIG_TYPES.SHIPPING }, // ₹50 in paise
            { key: 'shipping.freeThreshold', value: 50000, type: CONFIG_TYPES.SHIPPING }, // ₹500 in paise
            { key: 'tax.enabled', value: false, type: CONFIG_TYPES.TAX },
            { key: 'payment.defaultProvider', value: 'cod', type: CONFIG_TYPES.PAYMENT }
        ];

        for (const config of defaultConfigs) {
            const existing = await StoreConfig.findOne({ key: config.key });
            if (!existing) {
                await StoreConfig.setValue(config.key, config.value, config.type);
                console.log(`  ✓ ${config.key}`);
            }
        }
        console.log('✅ Store configuration initialized');

        console.log('\n🎉 Seed completed successfully!');
        console.log('\nYou can now start the server with: npm run dev');

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📤 Database connection closed');
        process.exit(0);
    }
};

seedAdmin();
