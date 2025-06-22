const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelName: {
    type: String,
    required: true,
  },
  roomType: {
    type: String,
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  features: {
    type: [String], // array of strings
    default: [],
  },
  images: {
    type: [String], // array of image URLs or file paths
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Room', roomSchema);
