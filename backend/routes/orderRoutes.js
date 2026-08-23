const express = require('express');
const router  = express.Router();

const {
    createOrder,
    getMyOrders,
    getOrderById,
    markOrderAsPaid,
    updateOrderStatus,
    getAllOrders,
    cancelOrder
} = require('../controlers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { admin }   = require('../middleware/adminMiddleware');

// ─── User Routes ─────────────────────────────────────────────────────────────
router.post('/',                    protect, createOrder);       // Place order
router.get('/my-orders',            protect, getMyOrders);       // My orders
router.get('/:id',                  protect, getOrderById);      // Single order
router.put('/:id/pay',              protect, markOrderAsPaid);   // Mark as paid
router.put('/:id/cancel',           protect, cancelOrder);       // Cancel order

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/',                     protect, admin, getAllOrders);           // All orders
router.put('/:id/status',           protect, admin, updateOrderStatus);     // Update status

module.exports = router;
