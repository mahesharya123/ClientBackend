const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const Room = require('../models/Room'); // Make sure Room model is imported
const Payment = require('../models/Payment')

router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log("Body:", req.body);
    console.log("User:", req.user);

   const { room, checkInDate, checkOutDate, guests, totalPrice, paymentMethod } = req.body;

if (!room || !checkInDate || !checkOutDate || !guests || !totalPrice || !paymentMethod) {
  return res.status(400).json({ error: 'Missing booking details' });
}

    // ✅ Check if room exists
    const existingRoom = await Room.findById(room);
    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const booking = await Booking.create({
      user: req.user.id,
  room,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
  paymentMethod
    });
           console.log("Incoming booking body:", req.body);

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Middleware to check if user is admin

// GET all bookings - Admin only
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('room', 'roomType pricePerNight')
      .sort({ createdAt: -1 });

    const payments = await Payment.find();

    const enrichedBookings = bookings.map(booking => {
      const payment = payments.find(p => p.booking.toString() === booking._id.toString());
      return {
        ...booking.toObject(),
        amountPaid: payment ? payment.amountPaid : 0
      };
    });

    res.json(enrichedBookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ error: 'Failed to fetch all bookings' });
  }
});


// 👤 Get Bookings for Logged-in User

router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId })
      .populate('room', 'roomType pricePerNight') // ✅ Only include selected fields
 // includes roomType, price, etc.
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


router.patch('/:id/pay-success', authMiddleware, async (req, res) => {
  const { isPaid, status } = req.body;
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isPaid, status},
      { new: true }
    );
    res.status(200).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking payment status" });
  }
});

module.exports = router;
