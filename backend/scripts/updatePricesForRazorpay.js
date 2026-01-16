/**
 * Script to update all product prices to be under ₹25,000 for Razorpay test mode
 * Run with: node scripts/updatePricesForRazorpay.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

// Product schema (simplified for this script)
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    compareAtPrice: Number
});

const Product = mongoose.model('Product', productSchema);

// Maximum price in paise (₹25,000 = 2,500,000 paise)
// We'll set max to ₹24,999 = 2,499,900 paise to be safe
const MAX_PRICE_PAISE = 2499900;
const MIN_PRICE_PAISE = 99900; // ₹999

async function updatePrices() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all products with price >= MAX_PRICE_PAISE
        const expensiveProducts = await Product.find({
            price: { $gte: MAX_PRICE_PAISE }
        });

        console.log(`📦 Found ${expensiveProducts.length} products with price >= ₹25,000`);

        if (expensiveProducts.length === 0) {
            console.log('✅ All products are already under ₹25,000');
            await mongoose.disconnect();
            return;
        }

        // Update each product with a random price between ₹999 and ₹24,999
        let updated = 0;
        for (const product of expensiveProducts) {
            const newPrice = Math.floor(Math.random() * (MAX_PRICE_PAISE - MIN_PRICE_PAISE)) + MIN_PRICE_PAISE;
            const oldPrice = product.price;

            // Update price
            product.price = newPrice;

            // If there was a compareAtPrice, make it slightly higher than new price
            if (product.compareAtPrice && product.compareAtPrice > 0) {
                product.compareAtPrice = Math.floor(newPrice * 1.2); // 20% higher
            }

            await product.save();

            console.log(`  ✓ ${product.name}: ₹${(oldPrice / 100).toFixed(2)} → ₹${(newPrice / 100).toFixed(2)}`);
            updated++;
        }

        console.log(`\n✅ Successfully updated ${updated} products`);
        console.log('📊 All products now priced under ₹25,000 for Razorpay testing');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

updatePrices();
