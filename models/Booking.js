const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
 
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  guests: {
    type: Number,
    required: true
  },
   
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending'
  },
paymentMethod: {
  type: String,
  enum: ['Pay Full Amount', 'Pay Half Amount'], // ✅ Corrected
  default: 'Pay Full Amount'
},

  isPaid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
