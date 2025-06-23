// backend/routes/authRoute.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/Otp');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSMS');

const router = express.Router();

// Send Email OTP
// In-memory storage for OTPs (for demo; use Redis in production)
const emailOtpMap = new Map();
const mobileOtpMap = new Map();
const {
  sendEmailOtpController,
  verifyEmailOtpController,
} = require('../controllers/emailOtpController'); 

router.post('/send-email-otp', sendEmailOtpController);
router.post('/verify-email-otp', verifyEmailOtpController);

// POST /api/auth/send-email-otp
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  emailOtpMap.set(email, otp);

  try {
    await sendEmail({
      to: email,
      subject: 'Your Coral Creek Email OTP',
      text: `Your email verification OTP is: ${otp}`
    });

    res.status(200).json({ message: 'Email OTP sent' });
  } catch (err) {
    console.error('Email OTP Error:', err);
    res.status(500).json({ error: 'Failed to send email OTP' });
  }
});

// POST /api/auth/send-mobile-otp (Mock implementation)
router.post('/send-mobile-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  mobileOtpMap.set(mobile, otp);

  // In production, integrate Twilio or SMS gateway here.
  console.log(`Mock OTP for mobile ${mobile}: ${otp}`);

  res.status(200).json({ message: 'Mobile OTP sent (mock)' });
});
// Register User with OTP Verification

router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password, confirmPassword, emailVerified } = req.body;

    if (!name || !mobile || !email || !password || !confirmPassword)
      return res.status(400).json({ error: "All fields are required" });

    if (!emailVerified)
      return res.status(400).json({ error: "Please verify your email before registering" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      isVerified: true   // ✅ mark email as verified in DB
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route (No Change)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'User not found. Please Sign up.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
