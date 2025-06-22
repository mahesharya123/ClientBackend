const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

router.post('/create-order', authMiddleware, async (req, res) => {
  const { amount, currency = "INR", bookingId } = req.body;

  try {
    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency,
      receipt: `receipt_${bookingId}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

module.exports = router; // ✅ This line is required!
