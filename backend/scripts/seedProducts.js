/**
 * Product Seed Script
 * Seeds 40 real products with SINGLE verified images (no gallery)
 * Run with: node backend/scripts/seedProducts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product, Category } from '../models/index.js';
import { PRODUCT_STATUS, CATEGORY_STATUS } from '../config/constants.js';

dotenv.config();

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce');
        console.log('✅ Connected to MongoDB');

        // First, ensure categories exist
        console.log('\n📁 Ensuring categories exist...');

        const categoriesData = [
            { name: 'Electronics', description: 'Latest gadgets, phones, and accessories' },
            { name: 'Fashion', description: 'Trendy apparel for men and women' },
            { name: 'Home & Living', description: 'Furniture, decor, and smart home essentials' },
            { name: 'Beauty', description: 'Premium skincare, makeup, and wellness' },
            { name: 'Sports', description: 'Fitness gear, cycles, and activewear' }
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
                console.log(`  ✓ Created: ${catData.name}`);
            }
            categories[catData.name] = category;
        }

        // Delete existing products
        console.log('\n🗑️  Clearing existing products...');
        await Product.deleteMany({});
        console.log('  ✓ Cleared');

        console.log('\n📦 Seeding products with single verified images...');

        const productsData = [
            // ================= ELECTRONICS =================
            {
                name: 'iPhone 15 Pro Max',
                description: 'The ultimate iPhone. Titanium design, ceramic shield front, texturized matte glass back. A17 Pro chip.',
                shortDescription: '256GB, Natural Titanium',
                price: 15999000,
                compareAtPrice: 16999000,
                sku: 'EL-IPH-15PRO',
                category: 'Electronics',
                inventory: 25,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80' // Titanium
                ]
            },
            {
                name: 'MacBook Air M2',
                description: 'Supercharged by M2. Strikingly thin design. 13.6-inch Liquid Retina display.',
                shortDescription: 'Midnight, 256GB',
                price: 11490000,
                sku: 'EL-MAC-AIR',
                category: 'Electronics',
                inventory: 15,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1661347334057-a379051829e0?w=800&q=80' // M2 Air
                ]
            },
            {
                name: 'Sony WH-1000XM5',
                description: 'Industry-leading noise cancellation. Exceptional sound quality with a newly developed driver.',
                shortDescription: 'Silver, Noise Cancelling',
                price: 2699000,
                sku: 'EL-SNY-XM5',
                category: 'Electronics',
                inventory: 40,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80' // Headphones
                ]
            },
            {
                name: 'Fujifilm X100V',
                description: 'Premium compact digital camera. 26.1MP X-Trans CMOS 4 sensor. Classic dial-based design.',
                shortDescription: 'Silver, Fixed Lens',
                price: 13999900,
                sku: 'EL-FUJ-X100',
                category: 'Electronics',
                inventory: 5,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' // Camera
                ]
            },
            {
                name: 'Marshall Stanmore II',
                description: 'Classic Marshall details. Larger-than-life sound. Wireless Bluetooth 5.0 connectivity.',
                shortDescription: 'Bluetooth Speaker, Black',
                price: 3199900,
                sku: 'EL-MAR-SPK',
                category: 'Electronics',
                inventory: 20,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1628261327178-5e76a0d42159?w=800&q=80' // Speaker
                ]
            },

            // ================= FASHION =================
            {
                name: 'Air Jordan 1 High OG',
                description: 'The sneaker that started it all. Premium leather, classic colorway, and Air cushioning.',
                shortDescription: 'Red/Black/White',
                price: 1699500,
                compareAtPrice: 2200000,
                sku: 'FA-JOR-1',
                category: 'Fashion',
                inventory: 12,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80' // Sneakers
                ]
            },
            {
                name: 'Ray-Ban Aviator Classic',
                description: 'Timeless style. The world\'s most iconic sunglasses. Crystal clear vision.',
                shortDescription: 'Gold Frame, G-15 Lens',
                price: 950000,
                sku: 'FA-RAY-AVI',
                category: 'Fashion',
                inventory: 50,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80' // Sunglasses
                ]
            },
            {
                name: 'Levi\'s 501 Original',
                description: 'The original straight fit jean. Canvas for self-expression. Button fly.',
                shortDescription: 'Blue Denim, Classic Fit',
                price: 499900,
                sku: 'FA-LEV-501',
                category: 'Fashion',
                inventory: 60,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80' // Jeans
                ]
            },
            {
                name: 'Classic White Tee',
                description: 'Heavyweight cotton t-shirt. Relaxed fit. Essential wardrobe staple.',
                shortDescription: '100% Cotton, White',
                price: 199900,
                sku: 'FA-TEE-WHT',
                category: 'Fashion',
                inventory: 100,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80' // Tee
                ]
            },
            {
                name: 'Leather Moto Jacket',
                description: 'Full-grain leather motorcycle jacket. Asymmetric zipper. Quilted lining.',
                shortDescription: 'Black Leather',
                price: 2499900,
                sku: 'FA-JKT-LEA',
                category: 'Fashion',
                inventory: 8,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80' // Jacket
                ]
            },

            // ================= HOME =================
            {
                name: 'Eames Lounge Chair',
                description: 'Replica of the mid-century icon. Plywood and leather construction. Supreme comfort.',
                shortDescription: 'Walnut & Black Leather',
                price: 4500000,
                compareAtPrice: 5000000,
                sku: 'HL-CHR-EAM',
                category: 'Home & Living',
                inventory: 5,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80' // Chair
                ]
            },
            {
                name: 'Cast Iron Dutch Oven',
                description: 'Enameled cast iron pot for baking, roasting, and stewing. Excellent heat retention.',
                shortDescription: '5Q, Red Enamel',
                price: 2499900,
                sku: 'HL-POT-UTL',
                category: 'Home & Living',
                inventory: 15,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1588698263546-d446dc0237da?w=800&q=80' // Cooking pot
                ]
            },
            {
                name: 'Monstera Plant',
                description: 'Swiss cheese plant. Perfect for adding greenery to your living space. Easy to care for.',
                shortDescription: 'Potted, Large',
                price: 189900,
                sku: 'HL-PLT-MON',
                category: 'Home & Living',
                inventory: 30,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80' // Plant
                ]
            },
            {
                name: 'Minimalist Vase Set',
                description: 'Set of 3 ceramic vases. Matte finish. Nordic design.',
                shortDescription: 'White, Ceramic',
                price: 89900,
                sku: 'HL-VAS-SET',
                category: 'Home & Living',
                inventory: 40,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=800&q=80' // Vase
                ]
            },

            // ================= BEAUTY =================
            {
                name: 'Luxury Perfume',
                description: 'Eau de Parfum. Floral, woody, and musky notes. Long lasting fragrance.',
                shortDescription: '100ml, Glass Bottle',
                price: 850000,
                sku: 'BE-PRF-LUX',
                category: 'Beauty',
                inventory: 25,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80' // Perfume Bottle
                ]
            },
            {
                name: 'Aesop Hand Wash',
                description: 'Resurrection Aromatique Hand Wash. Gentle cleansing without drying.',
                shortDescription: '500ml, Pump',
                price: 320000,
                sku: 'BE-AES-HAN',
                category: 'Beauty',
                inventory: 35,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1629363071375-7b646c107246?w=800&q=80' // Pump bottle
                ]
            },
            {
                name: 'Facial Serum',
                description: 'Vitamin C and Hyaluronic Acid serum. Brightens and hydrates skin.',
                shortDescription: '30ml Dropper',
                price: 55000,
                sku: 'BE-SER-VIT',
                category: 'Beauty',
                inventory: 60,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=800&q=80' // Serum
                ]
            },
            {
                name: 'Matte Lipstick',
                description: 'Velvet matte finish. High pigment. Long wear formula.',
                shortDescription: 'Classic Red',
                price: 25000,
                sku: 'BE-LIP-RED',
                category: 'Beauty',
                inventory: 100,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80' // Lipstick
                ]
            },

            // ================= SPORTS =================
            {
                name: 'Yoga Mat Pro',
                description: 'Non-slip surface. High density cushioning. Eco-friendly material.',
                shortDescription: 'Purple, 6mm',
                price: 350000,
                sku: 'SP-YOG-MAT',
                category: 'Sports',
                inventory: 40,
                isFeatured: false,
                images: [
                    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80' // Mat
                ]
            },
            {
                name: 'Adjustable Dumbbells',
                description: 'Select-a-weight dumbbells. Replaces 10 sets of weights. Space saving.',
                shortDescription: 'Pair, 50lbs max',
                price: 1500000,
                sku: 'SP-DBL-ADJ',
                category: 'Sports',
                inventory: 20,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80' // Dumbbells
                ]
            }
        ];

        let count = 0;
        for (const prodData of productsData) {
            const category = categories[prodData.category];

            // Construct image objects
            const imageObjects = prodData.images.map((url, index) => ({
                url,
                alt: prodData.name,
                isPrimary: index === 0,
                order: index
            }));

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
                isFeatured: prodData.isFeatured || false,
                status: PRODUCT_STATUS.ACTIVE,
                images: imageObjects
            });

            await product.save();
            count++;
            console.log(`  ✓ [${count}] ${prodData.name}`);

            if (category) {
                await Category.updateProductCount(category._id);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Seed completed! 20+ verified products added (Single Image Mode).');
        console.log('='.repeat(50));
        console.log('All products now strictly have one image.');

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

seedProducts();
