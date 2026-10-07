const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // not required — mock products won't have a real ObjectId
    name:     { type: String,  required: true },
    image:    { type: String,  default: '' },
    price:    { type: Number,  required: true },
    quantity: { type: Number,  required: true, min: 1 }
});

const shippingAddressSchema = new mongoose.Schema({
    fullName:    { type: String, default: 'Customer' },
    // Support both field names the frontend might send
    address:     { type: String, default: '' },
    addressLine1:{ type: String, default: '' },
    city:        { type: String, default: 'Not specified' },
    state:       { type: String, default: 'Not specified' },
    postalCode:  { type: String, default: '' },
    pincode:     { type: String, default: '' },
    country:     { type: String, default: 'India' },
    phone:       { type: String, default: '' }
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderItems:      [orderItemSchema],
        shippingAddress: shippingAddressSchema,

        paymentMethod: {
            type: String,
            default: 'cod'
        },
        paymentResult: {
            razorpay_order_id:   { type: String },
            razorpay_payment_id: { type: String },
            razorpay_signature:  { type: String },
            status:              { type: String }
        },

        itemsPrice:    { type: Number, required: true, default: 0 },
        shippingPrice: { type: Number, required: true, default: 0 },
        taxPrice:      { type: Number, required: true, default: 0 },
        totalPrice:    { type: Number, required: true, default: 0 },

        isPaid:   { type: Boolean, default: false },
        paidAt:   { type: Date },

        orderStatus: {
            type: String,
            enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Processing'
        },
        deliveredAt: { type: Date }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
