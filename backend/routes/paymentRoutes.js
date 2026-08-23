const express = require('express');
const router  = express.Router();

const {
    createRazorpayOrder,
    verifyPayment,
    getRazorpayKey
} = require('../controlers/paymentController');

const { protect } = require('../middleware/authMiddleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/key', protect, getRazorpayKey);                 // Get Razorpay public key

// ─── Protected (logged-in users) ─────────────────────────────────────────────
router.post('/create-order', protect, createRazorpayOrder);  // Create Razorpay order
router.post('/verify',       protect, verifyPayment);        // Verify & confirm payment

module.exports = router;
