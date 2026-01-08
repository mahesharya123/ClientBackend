const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail'); // ✅ Use your own utility

// ➤ Create booking (no email here)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests, totalPrice, paymentMethod } = req.body;

    if (!room || !checkInDate || !checkOutDate || !guests || !totalPrice || !paymentMethod) {
      return res.status(400).json({ error: 'Missing booking details' });
    }

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

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ➤ Admin: Get all bookings
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

// ➤ User: Get own bookings
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('room', 'roomType pricePerNight')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ➤ Payment Success: Update status + send email
    // update path if needed

router.patch('/:id/pay-success', authMiddleware, async (req, res) => {
  const { isPaid, status, paymentId, amountPaid} = req.body;

  try {
    // 1. Update Booking with isPaid and status
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isPaid, status },
      { new: true }
    ).populate('room').populate('user');

    if (!booking || !booking.user || !booking.user.email) {
      return res.status(404).json({ error: 'Booking or user email not found' });
    }

    const user = booking.user;

    // 2. Save payment record
    const payment = new Payment({
      user: user._id,
      booking: booking._id,
      razorpayPaymentId: paymentId,
      amountPaid: amountPaid, // in paise
      status: 'successful'
    });

    await payment.save();

    // 3. Send email with transaction details
    await sendEmail({
      to: user.email,
      subject: 'Booking Payment Successful',
      text: `Dear ${user.name},

Thank you for your payment.

Details:
- Booking ID: ${booking._id}
- Amount Paid: ₹${(amountPaid ).toFixed(2)}
- Transaction ID: ${paymentId}
- CheckIn Date : ${booking.checkInDate.toDateString()}
- CheckOut Date : ${booking.checkOutDate.toDateString()}
- Status: Confirmed

We look forward to hosting you!

Regards,
Coral Creek Resort`
    });

    return res.status(200).json(booking);
  } catch (err) {
    console.error('❌ Error in /pay-success route:', err);
    return res.status(500).json({ error: 'Failed to update booking payment status' });
  }
});

// ➤ Cancel Booking + send email
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!req.user.isAdmin && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    const user = await User.findById(booking.user);

    await sendEmail({
      to: user.email,
      subject: 'Booking Cancelled - Coral Creek Resort',
      text: `Hi ${user.name},\n\nYour booking for ${booking.room.roomType} from ${booking.checkInDate.toDateString()} to ${booking.checkOutDate.toDateString()} has been cancelled.\n\n50% refund will be processed within 7 days if applicable.`
    });

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    console.error('Cancel Booking Error:', err);
    res.status(500).json({ error: 'Server error while cancelling booking' });
  }
});

module.exports = router;
