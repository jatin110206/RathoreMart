const Order     = require('../model/order');
const Product   = require('../model/product');
const sendEmail = require('../utils/sendMail');
const mongoose  = require('mongoose');

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items provided' });
        }

        let itemsPrice = 0;
        const verifiedItems = [];

        for (const item of orderItems) {
            // Try to look up product in DB (only if item.product is a valid ObjectId)
            let dbProduct = null;
            if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
                dbProduct = await Product.findById(item.product);
            }

            if (dbProduct) {
                // ── Backend product found — use DB price (secure) ──
                if (dbProduct.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for "${dbProduct.name}". Available: ${dbProduct.stock}`
                    });
                }
                const linePrice = dbProduct.price * item.quantity;
                itemsPrice += linePrice;
                const imgUrl = (typeof dbProduct.images?.[0] === 'string'
                    ? dbProduct.images[0]
                    : dbProduct.images?.[0]?.url) || item.image || '';
                verifiedItems.push({
                    product:  dbProduct._id,
                    name:     dbProduct.name,
                    image:    imgUrl,
                    price:    dbProduct.price,
                    quantity: item.quantity
                });
                // Reduce stock
                await Product.findByIdAndUpdate(dbProduct._id, {
                    $inc: { stock: -item.quantity }
                });
            } else {
                // ── Mock / frontend-only product — trust client price for demo ──
                const price     = Number(item.price) || 0;
                const linePrice = price * item.quantity;
                itemsPrice += linePrice;
                verifiedItems.push({
                    // Generate a valid ObjectId so Mongoose doesn't throw a cast error
                    product:  new mongoose.Types.ObjectId(),
                    name:     item.name    || 'Product',
                    image:    item.image   || '',
                    price,
                    quantity: item.quantity
                });
            }
        }

        const shippingPrice = itemsPrice >= 999 ? 0 : 99;
        const taxPrice      = Math.round(itemsPrice * 0.18);
        const totalPrice    = itemsPrice + shippingPrice + taxPrice;

        // Normalise address fields with safe fallbacks — frontend sends addressLine1/pincode
        const addr = shippingAddress || {};
        const normalisedAddress = {
            fullName:     (addr.fullName || addr.name || req.user?.name || 'Customer').trim(),
            address:      (addr.address || addr.addressLine1 || 'Not specified').trim(),
            addressLine1: (addr.addressLine1 || addr.address || 'Not specified').trim(),
            city:         (addr.city || 'Not specified').trim() || 'Not specified',
            state:        (addr.state || 'Not specified').trim() || 'Not specified',
            postalCode:   (addr.postalCode || addr.pincode || '').trim(),
            pincode:      (addr.pincode || addr.postalCode || '').trim(),
            country:      (addr.country || 'India').trim(),
            phone:        (addr.phone || '').trim(),
        };

        const order = await Order.create({
            user: req.user._id,
            orderItems: verifiedItems,
            shippingAddress: normalisedAddress,
            paymentMethod: (paymentMethod || 'cod').toString(),
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice
        });

        // ── Send confirmation email (non-blocking, guarded) ────────────────────────
        if (req.user && req.user.email) {
            try {
                const itemsList = verifiedItems
                    .map(i => `  • ${i.name}  x${i.quantity}  —  ₹${(i.price * i.quantity).toLocaleString('en-IN')}`)
                    .join('\n');

                const deliveryAddr = normalisedAddress
                    ? `${normalisedAddress.addressLine1 || normalisedAddress.address || ''}, ${normalisedAddress.city || ''}, ${normalisedAddress.state || ''} - ${normalisedAddress.pincode || normalisedAddress.postalCode || ''}`
                    : 'N/A';

                sendEmail(
                    req.user.email,
                    `rathoreMart — Order Confirmed 🎉`,
                    `Hi ${req.user.name || 'Customer'},

Your order has been placed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━
Order ID : ${order._id}
Date     : ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

Items:
${itemsList}

Subtotal  : ₹${itemsPrice.toLocaleString('en-IN')}
Shipping  : ${shippingPrice === 0 ? 'Free' : '₹' + shippingPrice}
GST (18%) : ₹${taxPrice.toLocaleString('en-IN')}
─────────────────────────
TOTAL     : ₹${totalPrice.toLocaleString('en-IN')}

Delivering to:
${deliveryAddr}

Payment : ${paymentMethod}
━━━━━━━━━━━━━━━━━━━━━━━━

We'll send you another email when your order is shipped.

Thank you for shopping with rathoreMart! 🛍️
Team rathoreMart`
                ).catch(e => console.warn('[EMAIL NOTICE]', e.message));
            } catch (mailErr) {
                console.warn('[EMAIL ERROR]', mailErr.message);
            }
        }

        return res.status(201).json({ success: true, order });

    } catch (error) {
        console.error('createOrder error:', error);
        const isValidation = error.name === 'ValidationError';
        res.status(isValidation ? 400 : 500).json({
            message: error.message || 'Server error',
            detail: error.message
        });
    }
};

// ─── GET MY ORDERS (logged-in user) ──────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order
            .find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const order = await Order
            .findById(req.params.id)
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isOwner = order.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── MARK ORDER AS PAID ───────────────────────────────────────────────────────
const markOrderAsPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.isPaid) return res.status(400).json({ message: 'Order is already paid' });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        order.isPaid        = true;
        order.paidAt        = new Date();
        order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'completed' };

        const updatedOrder = await order.save();
        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE ORDER STATUS (Admin) ──────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
            for (const item of order.orderItems) {
                if (mongoose.Types.ObjectId.isValid(item.product)) {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
                }
            }
        }

        order.orderStatus = status;
        if (status === 'Delivered') order.deliveredAt = new Date();
        const updatedOrder = await order.save();
        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET ALL ORDERS (Admin) ───────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.orderStatus = status;
        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Order.countDocuments(filter)
        ]);

        const totalRevenue = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), totalRevenue: totalRevenue[0]?.total || 0, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CANCEL ORDER ─────────────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isOwner = order.user.toString() === req.user._id.toString();
        if (!isOwner) return res.status(403).json({ message: 'Not authorized' });
        if (order.orderStatus !== 'Processing') {
            return res.status(400).json({ message: `Cannot cancel an order that is already "${order.orderStatus}"` });
        }

        for (const item of order.orderItems) {
            if (mongoose.Types.ObjectId.isValid(item.product)) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
        }

        order.orderStatus = 'Cancelled';
        await order.save();
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createOrder, getMyOrders, getOrderById, markOrderAsPaid, updateOrderStatus, getAllOrders, cancelOrder };
