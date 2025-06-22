const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const Payment = require('../models/Payment'); // ✅ Import your Payment model

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});
router.post('/create-order', authMiddleware, async (req, res) => {
  const { amount, currency = "INR", bookingId } = req.body;

  try {
    const options = {
      amount: amount, // 👈 This must be a valid integer > 0
      currency,
      receipt: `receipt_${bookingId}`
    };

    console.log('Creating Razorpay Order with amount (paise):', amount);

    const order = await razorpay.orders.create(options); // 💥 Throws if amount is 0 or undefined
    res.status(200).json(order);
  } catch (err) {
    console.error(err); // 👈 Check your Render logs now
    res.status(500).json({ error: "Order creation failed" });
  }
});


// ✅ Get Payments for Logged-in User
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

module.exports = router;
