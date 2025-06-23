const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  mobile: String,
  otp: String,
  type: { type: String, enum: ['email', 'mobile'] },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes expiry
});

module.exports = mongoose.model('OTP', otpSchema);
