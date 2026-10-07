const Order   = require('../model/order');
const Product = require('../model/product');
const User    = require('../model/user');

// ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────────
// Total revenue, orders, users, products + % change vs last month
const getDashboardStats = async (req, res) => {
    try {
        const now       = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Run all queries in parallel
        const [
            totalRevenue,
            thisMonthRevenue,
            lastMonthRevenue,
            totalOrders,
            thisMonthOrders,
            lastMonthOrders,
            totalUsers,
            thisMonthUsers,
            lastMonthUsers,
            totalProducts,
            lowStockProducts,
            pendingOrders
        ] = await Promise.all([
            // Revenue
            Order.aggregate([
                { $match: { isPaid: true } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Order.aggregate([
                { $match: { isPaid: true, createdAt: { $gte: thisMonth } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Order.aggregate([
                { $match: { isPaid: true, createdAt: { $gte: lastMonth, $lt: thisMonth } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),

            // Orders
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: thisMonth } }),
            Order.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),

            // Users
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: thisMonth } }),
            User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),

            // Products
            Product.countDocuments(),
            Product.countDocuments({ stock: { $lte: 5 } }),  // low stock alert
            Order.countDocuments({ orderStatus: 'Processing' })
        ]);

        const calcChange = (current, previous) => {
            if (!previous || previous === 0) return current > 0 ? 100 : 0;
            return (((current - previous) / previous) * 100).toFixed(1);
        };

        const tRevenue     = totalRevenue[0]?.total      || 0;
        const tMRevenue    = thisMonthRevenue[0]?.total   || 0;
        const lMRevenue    = lastMonthRevenue[0]?.total   || 0;

        res.json({
            success: true,
            stats: {
                revenue: {
                    total:         tRevenue,
                    thisMonth:     tMRevenue,
                    change:        calcChange(tMRevenue, lMRevenue)
                },
                orders: {
                    total:         totalOrders,
                    thisMonth:     thisMonthOrders,
                    pending:       pendingOrders,
                    change:        calcChange(thisMonthOrders, lastMonthOrders)
                },
                users: {
                    total:         totalUsers,
                    thisMonth:     thisMonthUsers,
                    change:        calcChange(thisMonthUsers, lastMonthUsers)
                },
                products: {
                    total:         totalProducts,
                    lowStock:      lowStockProducts
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── REVENUE CHART (last N months) ───────────────────────────────────────────
const getRevenueChart = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (months - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const data = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year:  { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalPrice' },
                    orders:  { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const chart = data.map(d => ({
            month:   `${monthNames[d._id.month - 1]} ${d._id.year}`,
            revenue: d.revenue,
            orders:  d.orders
        }));

        res.json({ success: true, chart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── ORDER STATUS BREAKDOWN ───────────────────────────────────────────────────
const getOrderStatusBreakdown = async (req, res) => {
    try {
        const data = await Order.aggregate([
            {
                $group: {
                    _id:   '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const breakdown = data.map(d => ({
            status: d._id,
            count:  d.count
        }));

        res.json({ success: true, breakdown });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── TOP SELLING PRODUCTS ─────────────────────────────────────────────────────
const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const data = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id:         '$orderItems.product',
                    name:        { $first: '$orderItems.name' },
                    image:       { $first: '$orderItems.image' },
                    totalSold:   { $sum: '$orderItems.quantity' },
                    totalRevenue:{ $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        res.json({ success: true, topProducts: data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── TOP CATEGORIES ───────────────────────────────────────────────────────────
const getTopCategories = async (req, res) => {
    try {
        const data = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from:         'products',
                    localField:   'orderItems.product',
                    foreignField: '_id',
                    as:           'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id:         '$productInfo.category',
                    totalSold:   { $sum: '$orderItems.quantity' },
                    totalRevenue:{ $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json({ success: true, categories: data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── USER GROWTH (last N months) ─────────────────────────────────────────────
const getUserGrowth = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (months - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const data = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year:  { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const chart = data.map(d => ({
            month:    `${monthNames[d._id.month - 1]} ${d._id.year}`,
            newUsers: d.newUsers
        }));

        res.json({ success: true, chart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── LOW STOCK ALERTS ─────────────────────────────────────────────────────────
const getLowStockProducts = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 5;

        const products = await Product
            .find({ stock: { $lte: threshold } })
            .select('name category stock images price')
            .sort({ stock: 1 });

        res.json({ success: true, count: products.length, products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── RECENT ORDERS ────────────────────────────────────────────────────────────
const getRecentOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const orders = await Order
            .find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('user totalPrice orderStatus isPaid createdAt');

        res.json({ success: true, orders });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueChart,
    getOrderStatusBreakdown,
    getTopProducts,
    getTopCategories,
    getUserGrowth,
    getLowStockProducts,
    getRecentOrders
};
