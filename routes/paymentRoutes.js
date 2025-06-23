const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const crypto = require('crypto'); // For signature verification
const Payment = require('../models/Payment');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// 🆕 Webhook Route for Payment Verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString();

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(body);
    
    // Handle payment capture event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      // Create new payment record
      const newPayment = new Payment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        user: payment.notes.userId, // From create-order notes
        booking: payment.notes.bookingId, // From create-order notes
        status: 'captured'
      });

      await newPayment.save();
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ➕ Create Order Route
router.post('/create-order', authMiddleware, async (req, res) => {
  const { amount, currency = "INR", bookingId } = req.body;

  // Validate input
  if (!amount || !bookingId) {
    return res.status(400).json({ error: 'Amount and bookingId are required' });
  }

  // Convert to integer (Razorpay requires amount in smallest currency unit)
  const amountInt = parseInt(amount);
  if (isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ error: 'Invalid amount value' });
  }

  try {
    const options = {
      amount: amountInt,
      currency,
      receipt: `receipt_${bookingId}`,
      notes: { // 🆕 Add metadata for webhook
        userId: req.user.id,
        bookingId
      }
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: "Order creation failed", details: err.error?.description });
  }
});

// 👤 Get User Payments
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ user: userId })
      .populate('booking', 'room checkInDate checkOutDate')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    console.error('Error fetching user payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});


// Save Payment manually after success (if not using webhook)
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { razorpayPaymentId, amountPaid, booking, status } = req.body;

    const payment = new Payment({
      razorpayPaymentId,
      amountPaid,
      booking,
      status: status || 'successful',
      user: req.user.id
    });

    await payment.save();

    res.status(201).json({ message: 'Payment recorded', payment });
  } catch (err) {
    console.error("Manual payment save error:", err);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});







// Add this route in your payments router (e.g., routes/payments.js)
// you already have this
const adminCheckMiddleware = (req, res, next) => {
  // Basic admin check — you can customize based on your user schema
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

router.get('/', authMiddleware, adminCheckMiddleware, async (req, res) => {
  try {
    // Return all payments, populate booking & user info if needed
    const payments = await Payment.find()
      .populate('booking', 'room checkInDate checkOutDate')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching all payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});


module.exports = router;