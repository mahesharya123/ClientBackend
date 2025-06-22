// routes/availabilityRoutes.js

const express = require('express');
const Room = require('../models/Room');
const router = express.Router();

// POST /api/rooms/check-availability
router.post('/check-availability', async (req, res) => {
  try {
    const { roomType } = req.body;

    if (!roomType) {
      return res.status(400).json({ message: 'roomType is required.' });
    }

    const room = await Room.findOne({
      roomType,
      isAvailable: true,
    });

    if (!room) {
      return res.json({ isAvailable: false, message: `${roomType} is not available.` });
    }

    return res.json({
      isAvailable: true,
      roomId: room._id,
      roomType: room.roomType,
    });
  } catch (err) {
    console.error('Error checking room availability:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
