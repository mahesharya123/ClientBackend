const express = require('express');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload'); // Multer middleware
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ➕ Create Room (Admin Only + Image Upload)
router.post('/', authMiddleware, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const { hotelName, roomType, pricePerNight, features, location, city } = req.body;

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

// FIXED: Correct uploads directory path
const projectRoot = process.cwd();
const UPLOADS_DIR = path.join(projectRoot, 'uploads');


// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}

// Utility function for safe file deletion
const safeDelete = (filePath) => {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return resolve(false);
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Deletion failed: ${filePath}`, err);
        resolve(false);
      } else {
        console.log(`Deleted: ${filePath}`);
        resolve(true);
      }
    });
  });
};
// Update the PUT route
// Update the PUT route for room updates
router.put('/:id', authMiddleware, adminOnly, upload.single('replacementImage'), async (req, res) => {
  try {
    const { replaceIndex, ...updateData } = req.body;
    const room = await Room.findById(req.params.id);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.images || room.images.length !== 4) {
      return res.status(400).json({ error: 'Room must have exactly 4 images' });
    }

    // Process replacement if requested
    if (replaceIndex !== undefined && req.file) {
      const index = parseInt(replaceIndex);
      
      // Validate index
      if (isNaN(index) || index < 0 || index >= room.images.length) {
        // Delete uploaded file if index is invalid
        const filePath = path.join(UPLOADS_DIR, req.file.filename);
        await safeDelete(filePath);
        return res.status(400).json({ error: 'Invalid image index' });
      }

      // Get current image path
      const oldImagePath = room.images[index];
      const oldFilename = oldImagePath.split('/uploads/').pop();
      
      // Update image at specific index
      const newImagePath = `/uploads/${req.file.filename}`;
      room.images[index] = newImagePath;

      // Delete old file after successful update
      const updatedRoom = await room.save();
      
      // Delete old image file
      if (oldFilename) {
        const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
        await safeDelete(oldFilePath);
      }

      return res.json(updatedRoom);
    }

    // Process other updates (non-image changes)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'replaceIndex') {
        room[key] = updateData[key];
      }
    });

    const updatedRoom = await room.save();
    res.json(updatedRoom);
    
  } catch (err) {
    // Clean up uploaded file if error occurred
    if (req.file) {
      const filePath = path.join(UPLOADS_DIR, req.file.filename);
      await safeDelete(filePath);
    }
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