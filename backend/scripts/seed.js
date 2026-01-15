/**
 * Full Seed Script
 * Creates sample data for development and testing
 * Run with: npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    User,
    Product,
    Category,
    FeatureFlag,
    StoreConfig
} from '../models/index.js';
import { USER_ROLES, PRODUCT_STATUS, CATEGORY_STATUS, CONFIG_TYPES } from '../config/constants.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce');
        console.log('✅ Connected to MongoDB');

        // ========================================
        // SEED ADMIN USER
        // ========================================
        console.log('\n👤 Seeding admin user...');

        let admin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });

        if (!admin) {
            admin = new User({
                email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@store.com',
                password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456',
                role: USER_ROLES.SUPER_ADMIN,
                profile: {
                    firstName: 'Super',
                    lastName: 'Admin'
                },
                emailVerified: true,
                status: 'active'
            });
            await admin.save();
            console.log('  ✓ Super admin created');
        } else {
            console.log('  ✓ Super admin already exists');
        }

        // ========================================
        // SEED FEATURE FLAGS
        // ========================================
        console.log('\n🚩 Seeding feature flags...');
        await FeatureFlag.initializeDefaults();
        console.log('  ✓ Feature flags initialized');

        // ========================================
        // SEED STORE CONFIG
        // ========================================
        console.log('\n⚙️  Seeding store configuration...');

        const defaultConfigs = [
            { key: 'store.name', value: 'Demo Store', type: CONFIG_TYPES.BRANDING },
            { key: 'store.description', value: 'Welcome to our demo store!', type: CONFIG_TYPES.BRANDING },
            { key: 'store.email', value: 'hello@demostore.com', type: CONFIG_TYPES.BRANDING },
            { key: 'business.currency', value: 'INR', type: CONFIG_TYPES.BUSINESS_RULE },
            { key: 'business.currencySymbol', value: '₹', type: CONFIG_TYPES.BUSINESS_RULE },
            { key: 'business.minOrderValue', value: 10000, type: CONFIG_TYPES.BUSINESS_RULE }, // ₹100
            { key: 'shipping.method', value: 'flat', type: CONFIG_TYPES.SHIPPING },
            { key: 'shipping.flatRate', value: 4900, type: CONFIG_TYPES.SHIPPING }, // ₹49
            { key: 'shipping.freeThreshold', value: 99900, type: CONFIG_TYPES.SHIPPING }, // ₹999
            { key: 'tax.enabled', value: true, type: CONFIG_TYPES.TAX },
            { key: 'tax.rate', value: 18, type: CONFIG_TYPES.TAX }, // 18% GST
            { key: 'payment.defaultProvider', value: 'cod', type: CONFIG_TYPES.PAYMENT }
        ];

        for (const config of defaultConfigs) {
            await StoreConfig.setValue(config.key, config.value, config.type);
        }
        console.log('  ✓ Store configuration set');

        // ========================================
        // SEED CATEGORIES
        // ========================================
        console.log('\n📁 Seeding categories...');

        const categoriesData = [
            { name: 'Electronics', description: 'Electronic devices and accessories' },
            { name: 'Clothing', description: 'Fashion and apparel' },
            { name: 'Home & Living', description: 'Home decor and essentials' },
            { name: 'Books', description: 'Books and publications' },
            { name: 'Sports', description: 'Sports and fitness equipment' }
        ];

        const categories = {};
        for (const catData of categoriesData) {
            let category = await Category.findOne({ name: catData.name });
            if (!category) {
                category = new Category({
                    ...catData,
                    status: CATEGORY_STATUS.ACTIVE
                });
                await category.save();
                console.log(`  ✓ ${catData.name}`);
            }
            categories[catData.name] = category;
        }

        // Add subcategories
        const subcategoriesData = [
            { name: 'Smartphones', parent: 'Electronics', description: 'Mobile phones' },
            { name: 'Laptops', parent: 'Electronics', description: 'Laptops and computers' },
            { name: 'T-Shirts', parent: 'Clothing', description: 'Casual t-shirts' },
            { name: 'Jeans', parent: 'Clothing', description: 'Denim jeans' },
        ];

        for (const subData of subcategoriesData) {
            const parent = categories[subData.parent];
            if (parent) {
                let subcategory = await Category.findOne({ name: subData.name });
                if (!subcategory) {
                    subcategory = new Category({
                        name: subData.name,
                        description: subData.description,
                        parent: parent._id,
                        status: CATEGORY_STATUS.ACTIVE
                    });
                    await subcategory.save();
                    console.log(`  ✓ ${subData.name} (under ${subData.parent})`);
                }
                categories[subData.name] = subcategory;
            }
        }

        // ========================================
        // SEED PRODUCTS
        // ========================================
        console.log('\n📦 Seeding products...');

        const productsData = [
            {
                name: 'Premium Wireless Headphones',
                description: 'High-quality wireless headphones with active noise cancellation. Features 30-hour battery life, premium sound quality, and comfortable over-ear design. Perfect for music lovers and professionals alike.',
                shortDescription: 'ANC headphones with 30hr battery',
                price: 799900, // ₹7,999
                compareAtPrice: 999900, // ₹9,999
                sku: 'ELEC-HP-001',
                category: 'Electronics',
                inventory: 50,
                isFeatured: true
            },
            {
                name: 'Smart Fitness Watch',
                description: 'Track your fitness goals with this advanced smart watch. Includes heart rate monitoring, GPS, sleep tracking, and 7-day battery life. Water resistant up to 50 meters.',
                shortDescription: 'Advanced fitness tracking smartwatch',
                price: 499900, // ₹4,999
                sku: 'ELEC-SW-001',
                category: 'Electronics',
                inventory: 30,
                isFeatured: true
            },
            {
                name: 'Classic Cotton T-Shirt',
                description: 'Comfortable 100% cotton t-shirt with a classic fit. Pre-shrunk fabric ensures lasting quality. Available in multiple colors.',
                shortDescription: '100% cotton classic fit',
                price: 79900, // ₹799
                compareAtPrice: 99900, // ₹999
                sku: 'CLO-TS-001',
                category: 'T-Shirts',
                inventory: 100,
                isFeatured: false
            },
            {
                name: 'Slim Fit Denim Jeans',
                description: 'Modern slim fit jeans made from premium stretch denim. Features a comfortable mid-rise waist and classic 5-pocket styling.',
                shortDescription: 'Premium stretch denim',
                price: 199900, // ₹1,999
                compareAtPrice: 249900, // ₹2,499
                sku: 'CLO-JN-001',
                category: 'Jeans',
                inventory: 75,
                isFeatured: true
            },
            {
                name: 'Minimalist Desk Lamp',
                description: 'Elegant LED desk lamp with adjustable brightness levels and color temperatures. USB charging port included. Perfect for home office or study.',
                shortDescription: 'Adjustable LED desk lamp',
                price: 149900, // ₹1,499
                sku: 'HOME-LP-001',
                category: 'Home & Living',
                inventory: 40,
                isFeatured: false
            },
            {
                name: 'Bestseller Novel Collection',
                description: 'A curated collection of 5 bestselling novels from renowned authors. Perfect gift for book lovers. Includes fiction from various genres.',
                shortDescription: '5 bestselling novels',
                price: 129900, // ₹1,299
                compareAtPrice: 199900, // ₹1,999
                sku: 'BOOK-COL-001',
                category: 'Books',
                inventory: 25,
                isFeatured: false
            },
            {
                name: 'Professional Yoga Mat',
                description: 'Extra thick 6mm yoga mat with non-slip surface. Eco-friendly TPE material. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.',
                shortDescription: 'Non-slip eco-friendly yoga mat',
                price: 99900, // ₹999
                sku: 'SPRT-YM-001',
                category: 'Sports',
                inventory: 60,
                isFeatured: true
            },
            {
                name: 'Portable Bluetooth Speaker',
                description: 'Compact and powerful Bluetooth speaker with 360° sound. 12-hour battery life, waterproof design, and built-in microphone for calls.',
                shortDescription: 'Waterproof portable speaker',
                price: 299900, // ₹2,999
                compareAtPrice: 399900, // ₹3,999
                sku: 'ELEC-SP-001',
                category: 'Electronics',
                inventory: 45,
                isFeatured: true
            }
        ];

        for (const prodData of productsData) {
            const existingProduct = await Product.findOne({ sku: prodData.sku });

            if (!existingProduct) {
                const category = categories[prodData.category];

                const product = new Product({
                    name: prodData.name,
                    description: prodData.description,
                    shortDescription: prodData.shortDescription,
                    price: prodData.price,
                    compareAtPrice: prodData.compareAtPrice,
                    sku: prodData.sku,
                    categories: category ? [category._id] : [],
                    inventory: prodData.inventory,
                    trackInventory: true,
                    isFeatured: prodData.isFeatured,
                    status: PRODUCT_STATUS.ACTIVE,
                    images: [
                        {
                            url: `https://placehold.co/600x600/e2e8f0/475569?text=${encodeURIComponent(prodData.name.split(' ')[0])}`,
                            alt: prodData.name,
                            isPrimary: true,
                            order: 0
                        }
                    ]
                });

                await product.save();
                console.log(`  ✓ ${prodData.name}`);

                // Update category product count
                if (category) {
                    await Category.updateProductCount(category._id);
                }
            }
        }

        // ========================================
        // SEED TEST CUSTOMER
        // ========================================
        console.log('\n👤 Seeding test customer...');

        let customer = await User.findOne({ email: 'customer@test.com' });

        if (!customer) {
            customer = new User({
                email: 'customer@test.com',
                password: 'Customer@123',
                role: USER_ROLES.CUSTOMER,
                profile: {
                    firstName: 'Test',
                    lastName: 'Customer',
                    phone: '+91 9876543210',
                    addresses: [
                        {
                            type: 'shipping',
                            firstName: 'Test',
                            lastName: 'Customer',
                            street: '123 Test Street',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            postalCode: '400001',
                            country: 'India',
                            isDefault: true
                        }
                    ]
                },
                emailVerified: true,
                status: 'active'
            });
            await customer.save();
            console.log('  ✓ Test customer created (customer@test.com / Customer@123)');
        } else {
            console.log('  ✓ Test customer already exists');
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Seed completed successfully!');
        console.log('='.repeat(50));

        const counts = {
            users: await User.countDocuments(),
            products: await Product.countDocuments(),
            categories: await Category.countDocuments()
        };

        console.log(`\n📊 Database Summary:`);
        console.log(`   Users: ${counts.users}`);
        console.log(`   Products: ${counts.products}`);
        console.log(`   Categories: ${counts.categories}`);

        console.log(`\n🔑 Login Credentials:`);
        console.log(`   Admin: admin@store.com / Admin@123456`);
        console.log(`   Customer: customer@test.com / Customer@123`);

        console.log(`\n🚀 Start the server with: npm run dev`);

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📤 Database connection closed');
        process.exit(0);
    }
};

seedDatabase();
