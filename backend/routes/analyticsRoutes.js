const express = require('express');
const router  = express.Router();

const {
    getDashboardStats,
    getRevenueChart,
    getOrderStatusBreakdown,
    getTopProducts,
    getTopCategories,
    getUserGrowth,
    getLowStockProducts,
    getRecentOrders
} = require('../controlers/analyticsController');

const { protect } = require('../middleware/authMiddleware');
const { admin }   = require('../middleware/adminMiddleware');

// All analytics routes are admin-only
router.use(protect, admin);

router.get('/dashboard',        getDashboardStats);        // Overview KPIs
router.get('/revenue',          getRevenueChart);          // Revenue chart  ?months=6
router.get('/order-status',     getOrderStatusBreakdown);  // Order status pie
router.get('/top-products',     getTopProducts);           // Top sellers     ?limit=5
router.get('/top-categories',   getTopCategories);         // Top categories
router.get('/user-growth',      getUserGrowth);            // User growth chart ?months=6
router.get('/low-stock',        getLowStockProducts);      // Low stock alerts  ?threshold=5
router.get('/recent-orders',    getRecentOrders);          // Recent orders     ?limit=10

module.exports = router;
