const express = require('express');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload'); // Multer middleware

const router = express.Router();

// ➕ Create Room (Admin Only + Image Upload)
router.post('/', authMiddleware, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const { hotelName, roomType, pricePerNight, features, location,city } = req.body;

    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

    const room = await Room.create({
      hotelName,
      roomType,
      pricePerNight,
      location,
      city,
      features: features?.split(',').map(f => f.trim()) || [],
      images: imagePaths
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room', details: err.message });
  }
});

// 📥 Get All Rooms (Public)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();

    const BASE_URL = `${req.protocol}://${req.get('host')}`;

    const updatedRooms = rooms.map((room) => ({
      ...room._doc,
      images: room.images.map(img => `${BASE_URL}${img}`),
    }));

    res.status(200).json({ rooms: updatedRooms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
  }
});



// 📥 Get Single Room by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const BASE_URL = `${req.protocol}://${req.get('host')}`;

    // Replace relative image paths with full URLs
    const updatedRoom = {
      ...room._doc,
      images: room.images.map(img => `${BASE_URL}${img}`)
    };

    res.json(updatedRoom);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };
   if (typeof updateData.features === 'string') {
  updateData.features = updateData.features.split(',').map(f => f.trim());
}


    const room = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room', details: err.message });
  }
});


// ❌ Delete Room (Admin Only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room', details: err.message });
  }
});

module.exports = router;
