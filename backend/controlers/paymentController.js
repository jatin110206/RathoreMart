const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../model/order');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────────
// Call this before showing the Razorpay checkout modal on the frontend
const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order in our DB
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Only the owner can pay
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (order.isPaid) {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        // Razorpay expects amount in paise (1 INR = 100 paise)
        const options = {
            amount:   Math.round(order.totalPrice * 100),
            currency: 'INR',
            receipt:  `receipt_${order._id}`,
            notes: {
                orderId:  order._id.toString(),
                userId:   req.user._id.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount:          razorpayOrder.amount,
            currency:        razorpayOrder.currency,
            key:             process.env.RAZORPAY_KEY_ID  // send to frontend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating Razorpay order' });
    }
};

// ─── VERIFY PAYMENT & MARK ORDER AS PAID ─────────────────────────────────────
// Call this after Razorpay calls your success handler on the frontend
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId             // our internal order ID
        } = req.body;

        // 1. Verify signature (HMAC-SHA256)
        const body      = razorpay_order_id + '|' + razorpay_payment_id;
        const expected  = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
        }

        // 2. Mark order as paid in our DB
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.isPaid        = true;
        order.paidAt        = new Date();
        order.paymentResult = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: 'completed'
        };

        await order.save();

        res.json({
            success: true,
            message: 'Payment verified and order confirmed!',
            order
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying payment' });
    }
};

// ─── GET RAZORPAY KEY (for frontend) ─────────────────────────────────────────
const getRazorpayKey = async (req, res) => {
    res.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID
    });
};

module.exports = {
    createRazorpayOrder,
    verifyPayment,
    getRazorpayKey
};
