import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import https from 'https';

// Load environment variables
dotenv.config({ path: '../.env' });
dotenv.config();

// Import models
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

// Set DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// ============================================
// CATEGORIES
// ============================================
const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and electronic devices', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800' },
    { name: 'Fashion', slug: 'fashion', description: 'Trendy clothing and accessories', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800' },
    { name: 'Home & Living', slug: 'home-living', description: 'Beautiful furniture and home decor', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800' },
    { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports equipment and fitness gear', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' },
    { name: 'Books', slug: 'books', description: 'Books across all genres', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800' },
    { name: 'Beauty', slug: 'beauty', description: 'Skincare, makeup and beauty products', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800' },
];

// ============================================
// PRODUCTS - 60 Real Products with High-Quality Images
// ============================================
const products = [
    // ELECTRONICS (15 products)
    {
        name: 'Apple iPhone 15 Pro Max',
        slug: 'apple-iphone-15-pro-max',
        description: 'The most powerful iPhone ever with A17 Pro chip, 48MP camera system, and titanium design. Features USB-C, Action button, and the longest battery life ever in an iPhone. 256GB storage with Natural Titanium finish and stunning 6.7" Super Retina XDR Display.',
        shortDescription: '256GB, Natural Titanium, 6.7" Super Retina XDR Display',
        price: 15999900,
        compareAtPrice: 16999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', alt: 'iPhone 15 Pro Max', isPrimary: true }],
        inventory: 25,
        isFeatured: true
    },
    {
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        description: 'Galaxy AI is here. Circle to Search, Live Translate, and the ultimate S Pen experience. 200MP camera with Nightography, 5000mAh battery, and Titanium Gray finish. 512GB storage with AI-powered features.',
        shortDescription: '512GB, Titanium Gray, AI-Powered Smartphone',
        price: 13499900,
        compareAtPrice: 14499900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true }],
        inventory: 30,
        isFeatured: true
    },
    {
        name: 'MacBook Pro 16" M3 Max',
        slug: 'macbook-pro-16-m3-max',
        description: 'The most powerful MacBook Pro ever. M3 Max chip with 14-core CPU and 30-core GPU. Liquid Retina XDR display with ProMotion technology. 36GB RAM, 1TB SSD in stunning Space Black.',
        shortDescription: '36GB RAM, 1TB SSD, Space Black',
        price: 34999900,
        compareAtPrice: 36999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: 'MacBook Pro 16', isPrimary: true }],
        inventory: 15,
        isFeatured: true
    },
    {
        name: 'Sony WH-1000XM5 Headphones',
        slug: 'sony-wh-1000xm5',
        description: 'Premium wireless headphones with best-in-class noise cancellation. 30-hour battery, multipoint connection, and crystal-clear hands-free calling. Industry-leading active noise cancellation technology.',
        shortDescription: 'Industry-Leading Noise Cancellation, 30hr Battery',
        price: 2999900,
        compareAtPrice: 3499900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Sony WH-1000XM5', isPrimary: true }],
        inventory: 50,
        isFeatured: true
    },
    {
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        description: 'The most capable Apple Watch yet. S9 chip, Double Tap gesture, brighter display, and advanced health features including blood oxygen monitoring. 45mm GPS + Cellular in Midnight Aluminum.',
        shortDescription: '45mm GPS + Cellular, Midnight Aluminum',
        price: 5499900,
        compareAtPrice: 5999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800', alt: 'Apple Watch Series 9', isPrimary: true }],
        inventory: 40,
        isFeatured: false
    },
    {
        name: 'iPad Pro 12.9" M2',
        slug: 'ipad-pro-12-m2',
        description: 'Supercharged by M2 chip. 12.9-inch Liquid Retina XDR display, Apple Pencil hover, and ProRes video recording. The ultimate iPad experience with 256GB WiFi in Space Gray.',
        shortDescription: '256GB WiFi, Space Gray, Liquid Retina XDR',
        price: 11299900,
        compareAtPrice: 12499900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', alt: 'iPad Pro', isPrimary: true }],
        inventory: 20,
        isFeatured: false
    },
    {
        name: 'Sony PlayStation 5 Console',
        slug: 'sony-playstation-5',
        description: 'Experience lightning-fast loading with ultra-high speed SSD. Stunning 4K gaming, ray tracing, and 3D audio. Includes DualSense controller. Digital Edition with 825GB SSD.',
        shortDescription: 'Digital Edition, 825GB SSD, White',
        price: 4499900,
        compareAtPrice: 4999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800', alt: 'PlayStation 5', isPrimary: true }],
        inventory: 35,
        isFeatured: true
    },
    {
        name: 'DJI Mini 4 Pro Drone',
        slug: 'dji-mini-4-pro-drone',
        description: 'Ultralight sub-249g drone with 1/1.3-inch CMOS sensor. Omnidirectional obstacle sensing, ActiveTrack 360°, and incredible range up to 20km. 4K/60fps HDR Video with 34-min Flight Time.',
        shortDescription: '4K/60fps HDR Video, 34-min Flight Time',
        price: 9499900,
        compareAtPrice: 10499900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800', alt: 'DJI Mini 4 Pro', isPrimary: true }],
        inventory: 15,
        isFeatured: false
    },
    {
        name: 'Samsung 65" OLED 4K Smart TV',
        slug: 'samsung-65-oled-4k-tv',
        description: 'Self-lit OLED pixels deliver perfect blacks and vibrant colors. Object Tracking Sound+, Gaming Hub, and SmartThings integration. Neural Quantum Processor 4K with Dolby Atmos.',
        shortDescription: 'Neural Quantum Processor 4K, Dolby Atmos',
        price: 17999900,
        compareAtPrice: 19999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', alt: 'Samsung OLED TV', isPrimary: true }],
        inventory: 10,
        isFeatured: true
    },
    {
        name: 'Canon EOS R6 Mark II',
        slug: 'canon-eos-r6-mark-ii',
        description: '24.2MP full-frame sensor, 40fps continuous shooting, 4K 60p video, In-body image stabilization up to 8 stops. Professional hybrid mirrorless camera.',
        shortDescription: '24.2MP Full-Frame Mirrorless Camera',
        price: 24999900,
        compareAtPrice: 27999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', alt: 'Canon EOS R6', isPrimary: true }],
        inventory: 12,
        isFeatured: false
    },
    {
        name: 'Bose SoundLink Revolve+ II',
        slug: 'bose-soundlink-revolve-plus-ii',
        description: 'True 360° sound with deep bass. 17-hour battery, IP55 water-resistant, and built-in microphone for calls. Pair two for stereo sound. Portable Bluetooth Speaker.',
        shortDescription: 'Portable Bluetooth Speaker, 360° Sound',
        price: 2499900,
        compareAtPrice: 2999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', alt: 'Bose Speaker', isPrimary: true }],
        inventory: 45,
        isFeatured: false
    },
    {
        name: 'LG 27" UltraGear Gaming Monitor',
        slug: 'lg-27-ultragear-gaming-monitor',
        description: '27-inch QHD (2560x1440) IPS display with 165Hz refresh rate and 1ms response time. NVIDIA G-Sync compatible for tear-free gaming. HDR10 support.',
        shortDescription: 'QHD IPS, 165Hz, 1ms, HDR10, G-Sync',
        price: 3499900,
        compareAtPrice: 3999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', alt: 'LG Gaming Monitor', isPrimary: true }],
        inventory: 25,
        isFeatured: false
    },
    {
        name: 'GoPro HERO12 Black',
        slug: 'gopro-hero12-black',
        description: 'The most powerful HERO ever. 5.3K60 video, 27MP photos, Emmy Award-winning HyperSmooth 6.0 stabilization, and HDR in all modes. Ultra HD action camera.',
        shortDescription: '5.3K60 Ultra HD Video, HyperSmooth 6.0',
        price: 4499900,
        compareAtPrice: 4999900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800', alt: 'GoPro HERO12', isPrimary: true }],
        inventory: 30,
        isFeatured: false
    },
    {
        name: 'Apple AirPods Pro (2nd Gen)',
        slug: 'apple-airpods-pro-2nd-gen',
        description: '2x more Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio with dynamic head tracking. Up to 6 hours listening time. USB-C Charging case.',
        shortDescription: 'Active Noise Cancellation, USB-C Charging',
        price: 2499900,
        compareAtPrice: 2699900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800', alt: 'AirPods Pro', isPrimary: true }],
        inventory: 60,
        isFeatured: true
    },
    {
        name: 'Kindle Paperwhite Signature Edition',
        slug: 'kindle-paperwhite-signature',
        description: 'Our best Kindle for reading. 6.8" glare-free display, adjustable warm light, weeks of battery life, and wireless charging. IPX8 waterproof. 32GB storage.',
        shortDescription: '32GB, 6.8" Display, Wireless Charging',
        price: 1899900,
        compareAtPrice: 2199900,
        category: 'electronics',
        images: [{ url: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=800', alt: 'Kindle Paperwhite', isPrimary: true }],
        inventory: 40,
        isFeatured: false
    },

    // FASHION (12 products)
    {
        name: 'Classic Leather Jacket',
        slug: 'classic-leather-jacket',
        description: 'Timeless genuine leather jacket with premium quality finish. YKK zippers, quilted lining, and multiple pockets. Perfect for all seasons. Slim fit design in Black.',
        shortDescription: 'Genuine Leather, Black, Slim Fit',
        price: 1299900,
        compareAtPrice: 1599900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', alt: 'Leather Jacket', isPrimary: true }],
        inventory: 35,
        isFeatured: true
    },
    {
        name: 'Cashmere Wool Sweater',
        slug: 'cashmere-wool-sweater',
        description: '100% pure Mongolian cashmere sweater. Incredibly soft, lightweight, and warm. Classic crew neck design for versatile styling. Premium quality Navy Blue.',
        shortDescription: 'Premium Cashmere, Navy Blue, Crew Neck',
        price: 899900,
        compareAtPrice: 1099900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', alt: 'Cashmere Sweater', isPrimary: true }],
        inventory: 40,
        isFeatured: false
    },
    {
        name: 'Designer Denim Jeans',
        slug: 'designer-denim-jeans',
        description: 'Japanese selvedge denim with authentic fade potential. 14oz weight, copper rivets, and leather patch. Made for years of wear. Premium slim fit.',
        shortDescription: 'Premium Selvedge Denim, Slim Fit',
        price: 699900,
        compareAtPrice: 849900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', alt: 'Denim Jeans', isPrimary: true }],
        inventory: 55,
        isFeatured: false
    },
    {
        name: 'Floral Maxi Dress',
        slug: 'floral-maxi-dress',
        description: 'Beautiful bohemian maxi dress with intricate floral print. Lightweight chiffon fabric, adjustable straps, and flattering A-line silhouette. Perfect for summer.',
        shortDescription: 'Bohemian Style, Flowy Chiffon',
        price: 449900,
        compareAtPrice: 549900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', alt: 'Floral Maxi Dress', isPrimary: true }],
        inventory: 30,
        isFeatured: true
    },
    {
        name: 'Luxury Silk Tie Collection',
        slug: 'luxury-silk-tie-collection',
        description: 'Premium handcrafted silk ties in classic patterns. Perfect for business meetings and formal occasions. Gift box included. Set of 5 ties.',
        shortDescription: '100% Mulberry Silk, Set of 5',
        price: 499900,
        compareAtPrice: 649900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=800', alt: 'Silk Ties', isPrimary: true }],
        inventory: 25,
        isFeatured: false
    },
    {
        name: 'Ray-Ban Aviator Classic',
        slug: 'ray-ban-aviator-classic',
        description: 'The iconic Ray-Ban Aviator. Polarized G-15 lenses, gold metal frame, and 100% UV protection. Timeless style since 1937. Original classic design.',
        shortDescription: 'Gold Frame, Green G-15 Lens',
        price: 1699900,
        compareAtPrice: 1899900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', alt: 'Ray-Ban Aviator', isPrimary: true }],
        inventory: 45,
        isFeatured: true
    },
    {
        name: 'Nike Air Jordan 1 Retro High',
        slug: 'nike-air-jordan-1-retro-high',
        description: 'The legendary Air Jordan 1 in the iconic Chicago colorway. Premium leather upper, Air-Sole cushioning, and rubber outsole. A cultural icon.',
        shortDescription: 'Chicago Colorway, Leather Upper',
        price: 1699900,
        compareAtPrice: 1899900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800', alt: 'Air Jordan 1', isPrimary: true }],
        inventory: 20,
        isFeatured: true
    },
    {
        name: 'Designer Leather Handbag',
        slug: 'designer-leather-handbag',
        description: 'Handcrafted Italian leather handbag with gold-tone hardware. Multiple compartments, adjustable strap, and signature lining. Medium size in Cognac Brown.',
        shortDescription: 'Italian Leather, Cognac Brown, Medium',
        price: 1899900,
        compareAtPrice: 2299900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', alt: 'Leather Handbag', isPrimary: true }],
        inventory: 18,
        isFeatured: false
    },
    {
        name: 'Casio G-Shock GA-2100',
        slug: 'casio-g-shock-ga-2100',
        description: 'The CasiOak with carbon core guard structure. 200m water resistance, LED light, world time, and 3-year battery life. Octagonal design in Black.',
        shortDescription: 'Carbon Core Guard, Black, Octagonal',
        price: 1199900,
        compareAtPrice: 1399900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', alt: 'G-Shock Watch', isPrimary: true }],
        inventory: 35,
        isFeatured: false
    },
    {
        name: 'Premium Cotton Polo Collection',
        slug: 'premium-cotton-polo-collection',
        description: 'Premium pique cotton polo shirts in classic colors. Ribbed collar and cuffs, two-button placket, and breathable fabric. Set of 3 multi-color.',
        shortDescription: 'Set of 3, Pique Cotton, Multi-color',
        price: 349900,
        compareAtPrice: 449900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=800', alt: 'Cotton Polos', isPrimary: true }],
        inventory: 60,
        isFeatured: false
    },
    {
        name: 'Adidas Ultraboost 23',
        slug: 'adidas-ultraboost-23',
        description: 'BOOST midsole for endless energy return. Primeknit+ upper for adaptive fit and comfort. Continental rubber outsole for grip. Core Black running shoes.',
        shortDescription: 'Running Shoes, Core Black, Boost Midsole',
        price: 1799900,
        compareAtPrice: 1999900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', alt: 'Adidas Ultraboost', isPrimary: true }],
        inventory: 40,
        isFeatured: true
    },
    {
        name: 'Linen Summer Blazer',
        slug: 'linen-summer-blazer',
        description: 'Lightweight pure linen blazer perfect for summer. Half-canvas construction, natural texture, and breathable comfort. Unstructured design in Beige.',
        shortDescription: 'Pure Linen, Beige, Unstructured',
        price: 799900,
        compareAtPrice: 999900,
        category: 'fashion',
        images: [{ url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', alt: 'Linen Blazer', isPrimary: true }],
        inventory: 25,
        isFeatured: false
    },

    // HOME & LIVING (10 products)
    {
        name: 'Modern Velvet Sofa',
        slug: 'modern-velvet-sofa',
        description: 'Stunning mid-century modern velvet sofa. Solid hardwood frame, high-resilience foam cushions, and gold-tone metal legs. 3-Seater statement piece in Emerald Green.',
        shortDescription: '3-Seater, Emerald Green, Hardwood Frame',
        price: 6999900,
        compareAtPrice: 7999900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', alt: 'Velvet Sofa', isPrimary: true }],
        inventory: 8,
        isFeatured: true
    },
    {
        name: 'Scandinavian Dining Table Set',
        slug: 'scandinavian-dining-table-set',
        description: 'Minimalist Scandinavian dining set in solid white oak. Table with extension leaf plus 6 matching chairs. Seats up to 8. 6-Seater with 6 Chairs.',
        shortDescription: 'Oak Wood, 6-Seater with 6 Chairs',
        price: 8999900,
        compareAtPrice: 10999900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800', alt: 'Dining Table Set', isPrimary: true }],
        inventory: 5,
        isFeatured: false
    },
    {
        name: 'Luxury Egyptian Cotton Bedding Set',
        slug: 'egyptian-cotton-bedding-set',
        description: '100% long-staple Egyptian cotton. Includes 1 duvet cover, 1 fitted sheet, 1 flat sheet, and 4 pillowcases. Silky smooth finish. 1000 Thread Count King Size.',
        shortDescription: '1000 Thread Count, King Size, White',
        price: 1299900,
        compareAtPrice: 1599900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', alt: 'Luxury Bedding', isPrimary: true }],
        inventory: 20,
        isFeatured: true
    },
    {
        name: 'Handwoven Persian Rug',
        slug: 'handwoven-persian-rug',
        description: 'Authentic hand-knotted Persian rug with classic medallion design. New Zealand wool pile, cotton foundation. Heirloom quality. 8x10 ft Traditional Red.',
        shortDescription: '8x10 ft, Traditional Medallion, Red',
        price: 4999900,
        compareAtPrice: 5999900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800', alt: 'Persian Rug', isPrimary: true }],
        inventory: 6,
        isFeatured: false
    },
    {
        name: 'Smart Home Speaker System',
        slug: 'smart-home-speaker-system',
        description: 'Premium smart speaker with 360° sound. Voice control for music, smart home devices, and more. Multi-room audio capability. Voice controlled.',
        shortDescription: 'Multi-room Audio, Voice Control',
        price: 2499900,
        compareAtPrice: 2999900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800', alt: 'Smart Speaker', isPrimary: true }],
        inventory: 30,
        isFeatured: false
    },
    {
        name: 'Mid-Century Coffee Table',
        slug: 'mid-century-coffee-table',
        description: 'Elegant mid-century modern coffee table. Solid walnut wood top with natural grain, tapered brass legs. Timeless oval design.',
        shortDescription: 'Walnut Wood, Oval Shape, Brass Legs',
        price: 1899900,
        compareAtPrice: 2299900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800', alt: 'Coffee Table', isPrimary: true }],
        inventory: 12,
        isFeatured: true
    },
    {
        name: 'Aromatherapy Diffuser Set',
        slug: 'aromatherapy-diffuser-set',
        description: 'Elegant ceramic ultrasonic diffuser with 8 pure essential oils. 7 LED color options, auto shut-off, whisper-quiet operation.',
        shortDescription: 'Ceramic Diffuser + 8 Essential Oils',
        price: 349900,
        compareAtPrice: 449900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', alt: 'Aromatherapy Diffuser', isPrimary: true }],
        inventory: 50,
        isFeatured: false
    },
    {
        name: 'Dyson V15 Detect Vacuum',
        slug: 'dyson-v15-detect-vacuum',
        description: 'The most powerful Dyson cordless vacuum. Laser reveals microscopic dust, piezo sensor measures particles, LCD shows real-time data. Cordless with Laser Dust Detection.',
        shortDescription: 'Cordless, Laser Dust Detection',
        price: 6499900,
        compareAtPrice: 7299900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800', alt: 'Dyson Vacuum', isPrimary: true }],
        inventory: 18,
        isFeatured: true
    },
    {
        name: 'Japanese Ceramic Dinner Set',
        slug: 'japanese-ceramic-dinner-set',
        description: 'Handcrafted Japanese ceramics with beautiful matte glaze. Includes dinner plates, side plates, bowls, and mugs for 6. Microwave safe. 24-Piece Matte Black.',
        shortDescription: 'Artisan Made, 24-Piece, Matte Black',
        price: 1199900,
        compareAtPrice: 1499900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800', alt: 'Ceramic Dinner Set', isPrimary: true }],
        inventory: 15,
        isFeatured: false
    },
    {
        name: 'Indoor Herb Garden Kit',
        slug: 'indoor-herb-garden-kit',
        description: 'Grow fresh herbs year-round. Automatic LED grow lights, self-watering system, includes basil, mint, parsley and more seed pods. Hydroponic 12 Pods system.',
        shortDescription: 'Hydroponic, LED Grow Light, 12 Pods',
        price: 799900,
        compareAtPrice: 999900,
        category: 'home-living',
        images: [{ url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800', alt: 'Herb Garden', isPrimary: true }],
        inventory: 25,
        isFeatured: false
    },

    // SPORTS & FITNESS (10 products)
    {
        name: 'Peloton Bike+',
        slug: 'peloton-bike-plus',
        description: 'The ultimate home fitness bike. 24" rotating HD touchscreen, auto-resistance, Apple GymKit compatible. Thousands of live and on-demand classes. Smart Exercise Bike.',
        shortDescription: 'Smart Exercise Bike, 24" Rotating Screen',
        price: 24999900,
        compareAtPrice: 27999900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800', alt: 'Peloton Bike', isPrimary: true }],
        inventory: 8,
        isFeatured: true
    },
    {
        name: 'Adjustable Dumbbell Set',
        slug: 'adjustable-dumbbell-set',
        description: 'Space-saving adjustable dumbbells replacing 15 sets. Quick dial adjustment, 2.5 lb increments. Premium steel construction. Pair, 5-52.5 lbs Each.',
        shortDescription: 'Pair, 5-52.5 lbs Each, Quick Adjust',
        price: 4999900,
        compareAtPrice: 5999900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800', alt: 'Adjustable Dumbbells', isPrimary: true }],
        inventory: 20,
        isFeatured: true
    },
    {
        name: 'Premium Yoga Mat',
        slug: 'premium-yoga-mat',
        description: 'Professional-grade yoga mat made from natural tree rubber. Superior grip, optimal cushioning, eco-friendly, and includes carrying strap. 6mm Non-Slip.',
        shortDescription: 'Natural Rubber, 6mm, Non-Slip',
        price: 599900,
        compareAtPrice: 749900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', alt: 'Yoga Mat', isPrimary: true }],
        inventory: 60,
        isFeatured: false
    },
    {
        name: 'Wilson Pro Tennis Racket',
        slug: 'wilson-pro-tennis-racket',
        description: 'Tour-level precision racket used by pros. Premium layup for stability, Countervail technology, and classic feel. Pro Staff 97, 315g, Graphite Frame. Unstrung.',
        shortDescription: 'Pro Staff 97, 315g, Graphite Frame',
        price: 2299900,
        compareAtPrice: 2699900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1617083934555-ac7d4bd96827?w=800', alt: 'Tennis Racket', isPrimary: true }],
        inventory: 25,
        isFeatured: false
    },
    {
        name: 'TaylorMade Stealth 2 Driver',
        slug: 'taylormade-stealth-2-driver',
        description: 'Revolutionary 60X Carbon Twist Face for explosive distance. Nanotexture cover for optimal spin, aerodynamic design for faster clubhead speed. 10.5°, Regular Flex, Right-Handed.',
        shortDescription: '10.5°, Regular Flex, Right-Handed',
        price: 5499900,
        compareAtPrice: 5999900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800', alt: 'Golf Driver', isPrimary: true }],
        inventory: 15,
        isFeatured: true
    },
    {
        name: 'Garmin Forerunner 965',
        slug: 'garmin-forerunner-965',
        description: 'Elite GPS running watch with bright AMOLED display. Training status, race predictor, real-time stamina, and multi-sport modes. 23-day battery life.',
        shortDescription: 'Premium GPS Running Watch, AMOLED Display',
        price: 5999900,
        compareAtPrice: 6499900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800', alt: 'Garmin Watch', isPrimary: true }],
        inventory: 22,
        isFeatured: true
    },
    {
        name: 'Resistance Bands Set Pro',
        slug: 'resistance-bands-set-pro',
        description: 'Complete resistance training kit. 5 stackable bands up to 150lbs, 2 cushioned handles, 2 ankle straps, door anchor, and carrying bag. 11-Piece Set.',
        shortDescription: '11-Piece Set, 5 Bands up to 150lbs',
        price: 169900,
        compareAtPrice: 229900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800', alt: 'Resistance Bands', isPrimary: true }],
        inventory: 80,
        isFeatured: false
    },
    {
        name: 'Foam Roller Recovery Set',
        slug: 'foam-roller-recovery-set',
        description: 'Complete muscle recovery kit with 3 different density rollers for varying intensity. Includes digital guide with 30+ exercises. 3-Piece Multiple Densities.',
        shortDescription: '3-Piece, Multiple Densities, Guide Included',
        price: 249900,
        compareAtPrice: 329900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', alt: 'Foam Rollers', isPrimary: true }],
        inventory: 55,
        isFeatured: false
    },
    {
        name: 'Hydration Backpack 2L',
        slug: 'hydration-backpack-2l',
        description: 'Ultralight trail running hydration vest with 2L bladder. Breathable mesh, multiple storage pockets, adjustable straps. Only 250g. Trail Running Vest.',
        shortDescription: 'Trail Running Vest, 2L Bladder, Lightweight',
        price: 499900,
        compareAtPrice: 649900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', alt: 'Hydration Pack', isPrimary: true }],
        inventory: 35,
        isFeatured: false
    },
    {
        name: 'Boxing Gloves Pro',
        slug: 'boxing-gloves-pro',
        description: 'Professional boxing gloves made with premium leather. Multi-layer foam padding, moisture-wicking lining, secure velcro closure. 16oz Genuine Leather Red.',
        shortDescription: '16oz, Genuine Leather, Red',
        price: 799900,
        compareAtPrice: 999900,
        category: 'sports-fitness',
        images: [{ url: 'https://images.unsplash.com/photo-1509255929945-586a420363cf?w=800', alt: 'Boxing Gloves', isPrimary: true }],
        inventory: 30,
        isFeatured: false
    },

    // BOOKS (8 products)
    {
        name: 'Atomic Habits by James Clear',
        slug: 'atomic-habits-james-clear',
        description: 'The #1 New York Times bestseller. Learn how tiny changes can transform your life with the proven system for building good habits and breaking bad ones. Hardcover edition.',
        shortDescription: 'Hardcover, New York Times Bestseller',
        price: 54900,
        compareAtPrice: 69900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', alt: 'Atomic Habits Book', isPrimary: true }],
        inventory: 100,
        isFeatured: true
    },
    {
        name: 'The Psychology of Money',
        slug: 'psychology-of-money',
        description: 'Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money. By Morgan Housel. Paperback.',
        shortDescription: 'Morgan Housel, Paperback, Financial Wisdom',
        price: 39900,
        compareAtPrice: 49900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800', alt: 'Psychology of Money', isPrimary: true }],
        inventory: 85,
        isFeatured: true
    },
    {
        name: 'Sapiens: A Brief History of Humankind',
        slug: 'sapiens-yuval-harari',
        description: 'International bestseller exploring how Homo sapiens came to dominate the world. A groundbreaking narrative of humanity evolution. By Yuval Noah Harari. Paperback Edition.',
        shortDescription: 'Yuval Noah Harari, Paperback Edition',
        price: 49900,
        compareAtPrice: 59900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', alt: 'Sapiens Book', isPrimary: true }],
        inventory: 75,
        isFeatured: false
    },
    {
        name: 'Think and Grow Rich',
        slug: 'think-and-grow-rich',
        description: 'The original prosperity classic. This book teaches the secret to wealth through a combination of mindset and practical steps. By Napoleon Hill. 75th Anniversary Edition.',
        shortDescription: 'Napoleon Hill, 75th Anniversary Edition',
        price: 34900,
        compareAtPrice: 44900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800', alt: 'Think and Grow Rich', isPrimary: true }],
        inventory: 90,
        isFeatured: false
    },
    {
        name: 'The Lean Startup',
        slug: 'lean-startup-eric-ries',
        description: 'How Today Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses. Required reading for startup founders. By Eric Ries. Business Innovation Guide.',
        shortDescription: 'Eric Ries, Business Innovation Guide',
        price: 44900,
        compareAtPrice: 54900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800', alt: 'Lean Startup', isPrimary: true }],
        inventory: 65,
        isFeatured: true
    },
    {
        name: 'Deep Work by Cal Newport',
        slug: 'deep-work-cal-newport',
        description: 'Rules for Focused Success in a Distracted World. Learn how to master concentration and produce work of great value. Hardcover edition.',
        shortDescription: 'Rules for Focused Success, Hardcover',
        price: 49900,
        compareAtPrice: 64900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', alt: 'Deep Work Book', isPrimary: true }],
        inventory: 70,
        isFeatured: false
    },
    {
        name: 'The 4-Hour Work Week',
        slug: '4-hour-work-week-ferriss',
        description: 'Escape the 9-5, Live Anywhere, and Join the New Rich. A revolutionary approach to work-life balance and lifestyle design. By Tim Ferriss.',
        shortDescription: 'Tim Ferriss, Escape 9-5 Blueprint',
        price: 44900,
        compareAtPrice: 54900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?w=800', alt: '4-Hour Work Week', isPrimary: true }],
        inventory: 80,
        isFeatured: false
    },
    {
        name: 'Educated by Tara Westover',
        slug: 'educated-tara-westover',
        description: 'An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge. Sunday Times Bestseller.',
        shortDescription: 'Memoir, Sunday Times Bestseller',
        price: 39900,
        compareAtPrice: 49900,
        category: 'books',
        images: [{ url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800', alt: 'Educated Book', isPrimary: true }],
        inventory: 60,
        isFeatured: false
    },

    // BEAUTY (5 products)
    {
        name: 'La Mer Crème de la Mer',
        slug: 'la-mer-creme-de-la-mer',
        description: 'The legendary moisturizer that started it all. Miracle Broth helps heal dryness and deliver lasting radiance. Ultra-rich, velvety texture. Luxury Moisturizer 60ml.',
        shortDescription: 'Luxury Moisturizer, 60ml',
        price: 4299900,
        compareAtPrice: 4799900,
        category: 'beauty',
        images: [{ url: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800', alt: 'La Mer Cream', isPrimary: true }],
        inventory: 25,
        isFeatured: true
    },
    {
        name: 'Dyson Airwrap Complete',
        slug: 'dyson-airwrap-complete',
        description: 'Revolutionary styling tool using Coanda airflow. Curl, wave, smooth, and dry with no extreme heat. Complete with 6 attachments. Multi-Styler.',
        shortDescription: 'Multi-Styler, 6 Attachments',
        price: 5499900,
        compareAtPrice: 5999900,
        category: 'beauty',
        images: [{ url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800', alt: 'Dyson Airwrap', isPrimary: true }],
        inventory: 15,
        isFeatured: true
    },
    {
        name: 'Charlotte Tilbury Pillow Talk Set',
        slug: 'charlotte-tilbury-pillow-talk',
        description: 'The iconic Pillow Talk lipstick and matching lip liner. The nude-pink shade that started a revolution. Perfect for every skin tone. Lipstick and Liner Duo.',
        shortDescription: 'Lipstick & Liner Duo, Nude Pink',
        price: 449900,
        compareAtPrice: 549900,
        category: 'beauty',
        images: [{ url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800', alt: 'Pillow Talk Lipstick', isPrimary: true }],
        inventory: 40,
        isFeatured: false
    },
    {
        name: 'SK-II Facial Treatment Essence',
        slug: 'sk-ii-facial-treatment-essence',
        description: 'The iconic essence with over 90% PITERA. Transforms skin texture, clarity, and radiance. The secret to crystal clear skin. Pitera Essence 230ml.',
        shortDescription: 'Pitera Essence, 230ml',
        price: 2399900,
        compareAtPrice: 2699900,
        category: 'beauty',
        images: [{ url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800', alt: 'SK-II Essence', isPrimary: true }],
        inventory: 20,
        isFeatured: true
    },
    {
        name: 'Tom Ford Oud Wood Parfum',
        slug: 'tom-ford-oud-wood',
        description: 'Rare, exotic oud wood blended with sandalwood, rosewood, and cardamom. A modern take on a timeless scent. Long-lasting luxury. Eau de Parfum 100ml Unisex.',
        shortDescription: 'Eau de Parfum, 100ml, Unisex',
        price: 3599900,
        compareAtPrice: 3999900,
        category: 'beauty',
        images: [{ url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', alt: 'Tom Ford Perfume', isPrimary: true }],
        inventory: 18,
        isFeatured: false
    },
];

// ============================================
// HTTPS GET Helper for DNS resolution
// ============================================
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function resolveSRVviaGoogle(hostname) {
    console.log(`🔍 Resolving SRV via Google DNS: _mongodb._tcp.${hostname}`);
    const data = await httpsGet(`https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`);

    if (data.Answer && data.Answer.length > 0) {
        return data.Answer.map(a => {
            const parts = a.data.split(' ');
            return {
                port: parseInt(parts[2]),
                name: parts[3].replace(/\.$/, '')
            };
        });
    }
    throw new Error('No SRV records found');
}

// ============================================
// Database Connection
// ============================================
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scaleon_commerce';

    console.log('🔄 Connecting to MongoDB...');

    if (mongoUri.startsWith('mongodb+srv://')) {
        try {
            const srvUrl = new URL(mongoUri.replace('mongodb+srv://', 'https://'));
            const hostname = srvUrl.hostname;
            const username = srvUrl.username;
            const password = srvUrl.password;
            const dbName = srvUrl.pathname.slice(1).split('?')[0] || 'scaleon_commerce';

            const srvRecords = await resolveSRVviaGoogle(hostname);
            console.log(`✅ Found ${srvRecords.length} MongoDB hosts`);

            const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
            const standardUri = `mongodb://${username}:${password}@${hosts}/${dbName}?ssl=true&authSource=admin`;

            await mongoose.connect(standardUri);
            console.log('✅ MongoDB Connected via manual SRV resolution');
            return;
        } catch (srvError) {
            console.log('⚠️ SRV resolution failed, trying direct connection...');
        }
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
};

// ============================================
// Seed Function
// ============================================
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('\n🌱 Starting database seeding...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Product.deleteMany({});
        await Category.deleteMany({});

        // Create categories
        console.log('📁 Creating categories...');
        const createdCategories = {};
        for (const cat of categories) {
            const category = await Category.create({
                ...cat,
                isActive: true,
                position: categories.indexOf(cat)
            });
            createdCategories[cat.slug] = category._id;
            console.log(`   ✓ ${cat.name}`);
        }

        // Create products
        console.log('\n📦 Creating products...');
        let count = 0;
        for (const prod of products) {
            const categoryId = createdCategories[prod.category];
            await Product.create({
                name: prod.name,
                slug: prod.slug,
                description: prod.description,
                shortDescription: prod.shortDescription,
                price: prod.price,
                compareAtPrice: prod.compareAtPrice,
                categories: [categoryId],
                images: prod.images,
                inventory: prod.inventory,
                isFeatured: prod.isFeatured || false,
                status: 'active',
                trackInventory: true,
                lowStockThreshold: 5
            });
            count++;
            process.stdout.write(`   ✓ ${count}/${products.length} - ${prod.name.slice(0, 40)}...\r`);
        }

        console.log(`\n\n✅ Successfully seeded ${count} products!`);
        console.log(`✅ Created ${categories.length} categories!`);

        // Check for admin user
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('\n👤 Creating admin user...');
            await User.create({
                email: 'admin@store.com',
                password: 'Admin@123456',
                role: 'admin',
                status: 'active',
                profile: {
                    firstName: 'Store',
                    lastName: 'Admin'
                }
            });
            console.log('   ✓ Admin user created (admin@store.com / Admin@123456)');
        } else {
            console.log('\n👤 Admin user already exists');
        }

        console.log('\n🎉 Database seeding complete!\n');

    } catch (error) {
        console.error('❌ Seeding error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

// Run seed
seedDatabase();
