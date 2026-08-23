/**
 * seed.js — Khareedlo Dummy Data Seeder
 *
 * Usage:
 *   node seed.js          → Insert seed data (safe, skips if already exists)
 *   node seed.js --fresh  → Wipe everything and re-seed from scratch
 *   node seed.js --clear  → Only clear the DB, no seeding
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

dotenv.config();

const User    = require('./model/user');
const Product = require('./model/product');
const Order   = require('./model/order');

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const users = [
    { name: 'Jatin Admin',   email: 'admin@khareedlo.com', password: 'admin123', role: 'admin', verified: true },
    { name: 'Rahul Sharma',  email: 'rahul@example.com',   password: 'user123',  role: 'user',  verified: true },
    { name: 'Priya Patel',   email: 'priya@example.com',   password: 'user123',  role: 'user',  verified: true },
    { name: 'Arjun Mehta',   email: 'arjun@example.com',   password: 'user123',  role: 'user',  verified: true },
    { name: 'Sneha Gupta',   email: 'sneha@example.com',   password: 'user123',  role: 'user',  verified: true }
];

const productData = [
    // Electronics
    { name: 'Sony WH-1000XM5 Wireless Headphones',  description: 'Industry-leading noise canceling headphones. Up to 30 hours battery.', price: 24990, category: 'Electronics',     stock: 45,  rating: 4.8, numReviews: 124,  images: [{ public_id: 'seed/p1',  url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }] },
    { name: 'Apple iPad Air (5th Gen) 256GB',        description: 'Supercharged by M1 chip. 10.9-inch Liquid Retina display.',            price: 74900, category: 'Electronics',     stock: 20,  rating: 4.9, numReviews: 89,   images: [{ public_id: 'seed/p2',  url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400' }] },
    { name: 'OnePlus Nord CE 3 Lite 5G',             description: '108MP camera, 5000mAh battery, 67W SUPERVOOC charging.',              price: 19999, category: 'Electronics',     stock: 60,  rating: 4.3, numReviews: 312,  images: [{ public_id: 'seed/p3',  url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' }] },
    { name: 'boAt Rockerz 450 Bluetooth Headphone',  description: '15 hours music, 40mm drivers, foldable design.',                      price: 1299,  category: 'Electronics',     stock: 150, rating: 4.1, numReviews: 5620, images: [{ public_id: 'seed/p4',  url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400' }] },
    // Clothing
    { name: 'Allen Solly Men Regular Fit Shirt',     description: 'Classic regular fit cotton-blend shirt for office or casual wear.',    price: 1299,  category: 'Clothing',         stock: 200, rating: 4.2, numReviews: 890,  images: [{ public_id: 'seed/p5',  url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' }] },
    { name: "Levi's 511 Slim Fit Jeans",             description: 'Slimmest fit that still allows movement. Sits below waist.',          price: 3599,  category: 'Clothing',         stock: 85,  rating: 4.5, numReviews: 2340, images: [{ public_id: 'seed/p6',  url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }] },
    { name: 'Nike Air Max 270 Running Shoes',        description: 'Max Air unit in heel for all-day comfort. Breathable mesh upper.',    price: 12995, category: 'Clothing',         stock: 40,  rating: 4.7, numReviews: 1560, images: [{ public_id: 'seed/p7',  url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }] },
    { name: "H&M Women's Oversized Hoodie",          description: 'Relaxed-fit hoodie in soft cotton-blend with kangaroo pocket.',       price: 2499,  category: 'Clothing',         stock: 3,   rating: 4.4, numReviews: 445,  images: [{ public_id: 'seed/p8',  url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400' }] },
    // Home & Kitchen
    { name: 'Instant Pot Duo 7-in-1 Pressure Cooker', description: 'Pressure cooker, slow cooker, rice cooker, steamer, saute & more.', price: 8999,  category: 'Home & Kitchen',   stock: 35,  rating: 4.6, numReviews: 3200, images: [{ public_id: 'seed/p9',  url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400' }] },
    { name: 'Philips Air Fryer HD9200',              description: 'Fry, bake, grill with up to 90% less fat. Rapid air technology.',    price: 6995,  category: 'Home & Kitchen',   stock: 28,  rating: 4.5, numReviews: 1870, images: [{ public_id: 'seed/p10', url: 'https://images.unsplash.com/photo-1648146007050-7ac8f0a3e08e?w=400' }] },
    { name: 'IKEA LACK Side Table',                  description: 'Sturdy side table in white. Easy to clean with a damp cloth.',       price: 1799,  category: 'Home & Kitchen',   stock: 2,   rating: 4.0, numReviews: 678,  images: [{ public_id: 'seed/p11', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' }] },
    // Books
    { name: 'Atomic Habits by James Clear',          description: '#1 NYT bestseller. Build good habits & break bad ones.',             price: 499,   category: 'Books',            stock: 300, rating: 4.9, numReviews: 12400, images: [{ public_id: 'seed/p12', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' }] },
    { name: 'Rich Dad Poor Dad by Robert Kiyosaki',  description: 'What the rich teach their kids about money.',                        price: 349,   category: 'Books',            stock: 250, rating: 4.7, numReviews: 8900, images: [{ public_id: 'seed/p13', url: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400' }] },
    // Sports
    { name: 'Yonex Arcsaber 71 Badminton Racket',    description: 'Graphite shaft for power & control. Isometric head shape.',          price: 2699,  category: 'Sports',           stock: 55,  rating: 4.4, numReviews: 760,  images: [{ public_id: 'seed/p14', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400' }] },
    { name: 'Boldfit Gym Gloves for Men & Women',    description: 'Full palm protection, wrist support, anti-slip grip.',               price: 499,   category: 'Sports',           stock: 4,   rating: 4.2, numReviews: 3450, images: [{ public_id: 'seed/p15', url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400' }] }
];

const shippingAddresses = [
    { fullName: 'Rahul Sharma', address: '12 MG Road',        city: 'Bengaluru', postalCode: '560001', state: 'Karnataka',   country: 'India', phone: '9876543210' },
    { fullName: 'Priya Patel',  address: '45 Linking Road',   city: 'Mumbai',    postalCode: '400050', state: 'Maharashtra', country: 'India', phone: '9876543211' },
    { fullName: 'Arjun Mehta',  address: '8 Connaught Place', city: 'New Delhi', postalCode: '110001', state: 'Delhi',       country: 'India', phone: '9876543212' },
    { fullName: 'Sneha Gupta',  address: '3 Park Street',     city: 'Kolkata',   postalCode: '700016', state: 'West Bengal', country: 'India', phone: '9876543213' }
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
};

const buildOrders = (createdUsers, createdProducts) => {
    const regularUsers = createdUsers.filter(u => u.role === 'user');
    const statuses     = ['Processing', 'Processing', 'Shipped', 'Delivered', 'Delivered', 'Delivered', 'Cancelled'];
    const methods      = ['razorpay', 'razorpay', 'cod'];
    const orders       = [];

    for (let i = 0; i < 30; i++) {
        const user    = getRandom(regularUsers);
        const status  = getRandom(statuses);
        const method  = getRandom(methods);
        const isPaid  = method === 'razorpay' || status === 'Delivered';
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = getPastDate(daysAgo);

        // Pick 1–3 random products
        const numItems = Math.floor(Math.random() * 3) + 1;
        const picked   = [...createdProducts].sort(() => 0.5 - Math.random()).slice(0, numItems);

        const orderItems = [];
        let itemsPrice   = 0;

        for (const product of picked) {
            const qty = Math.floor(Math.random() * 3) + 1;
            orderItems.push({
                product:  product._id,
                name:     product.name,
                image:    product.images[0]?.url || '',
                price:    product.price,
                quantity: qty
            });
            itemsPrice += product.price * qty;
        }

        const shippingPrice = itemsPrice > 500 ? 0 : 50;
        const taxPrice      = Math.round(itemsPrice * 0.18);
        const totalPrice    = itemsPrice + shippingPrice + taxPrice;

        const order = {
            user:            user._id,
            orderItems,
            shippingAddress: getRandom(shippingAddresses),
            paymentMethod:   method,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid,
            paidAt:          isPaid ? createdAt : undefined,
            orderStatus:     status,
            deliveredAt:     status === 'Delivered' ? getPastDate(daysAgo - 3) : undefined,
            createdAt,
            updatedAt:       createdAt
        };

        if (isPaid) {
            order.paymentResult = {
                razorpay_order_id:   `order_seed_${i}`,
                razorpay_payment_id: `pay_seed_${i}`,
                razorpay_signature:  'seed_sig',
                status:              'completed'
            };
        }

        orders.push(order);
    }

    return orders;
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('\n🔌 Connected to MongoDB\n');

        const args    = process.argv.slice(2);
        const isFresh = args.includes('--fresh');
        const isClear = args.includes('--clear');

        if (isFresh || isClear) {
            await Promise.all([
                User.deleteMany({}),
                Product.deleteMany({}),
                Order.deleteMany({})
            ]);
            console.log('🗑️  Cleared: Users, Products, Orders');
            if (isClear) {
                console.log('\n✅ DB cleared. Exiting.\n');
                process.exit(0);
            }
        }

        // Seed users
        console.log('👤 Seeding users...');
        const createdUsers = [];
        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                console.log(`   ⏭  Skipped (exists): ${u.email}`);
                createdUsers.push(exists);
                continue;
            }
            const salt    = await bcrypt.genSalt(10);
            const hashed  = await bcrypt.hash(u.password, salt);
            const newUser = await User.create({ ...u, password: hashed });
            createdUsers.push(newUser);
            console.log(`   ✅ Created: ${u.name} [${u.role}]`);
        }

        // Seed products
        console.log('\n📦 Seeding products...');
        const admin           = createdUsers.find(u => u.role === 'admin');
        const createdProducts = [];
        for (const p of productData) {
            const exists = await Product.findOne({ name: p.name });
            if (exists) {
                console.log(`   ⏭  Skipped (exists): ${p.name}`);
                createdProducts.push(exists);
                continue;
            }
            const newProduct = await Product.create({ ...p, createdBy: admin._id });
            createdProducts.push(newProduct);
            console.log(`   ✅ Created: ${p.name} — ₹${p.price}`);
        }

        // Seed orders
        console.log('\n🛒 Seeding orders...');
        const existingOrders = await Order.countDocuments();
        if (existingOrders > 0 && !isFresh) {
            console.log(`   ⏭  Skipped: ${existingOrders} orders already exist (run with --fresh to reseed)`);
        } else {
            const orders = buildOrders(createdUsers, createdProducts);
            await Order.insertMany(orders, { timestamps: false });
            console.log(`   ✅ Created: ${orders.length} orders`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌱 Seeding complete!\n');
        console.log('🔑 Login credentials:');
        console.log('   Admin → admin@khareedlo.com / admin123');
        console.log('   User  → rahul@example.com   / user123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
