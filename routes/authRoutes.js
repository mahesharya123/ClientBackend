// backend/routes/authRoute.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/Otp');
const { sendEmail } = require('../utils/sendEmail');


const router = express.Router();

// Send Email OTP
// In-memory storage for OTPs (for demo; use Redis in production)


const emailOtpMap = new Map();
const mobileOtpMap = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [email, otpData] of emailOtpMap.entries()) {
    if (otpData.expiresAt < now) {
      emailOtpMap.delete(email);
    }
  }
}, 5 * 60 * 1000); // cleanup every 5 minutes
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

    // ✅ Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email already registered" });

    // ✅ Check for existing mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile)
      return res.status(400).json({ error: "Mobile number already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      isVerified: true
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





// FORGOT PASSWORD - Send OTP to email
// FORGOT PASSWORD - Send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'User not found. Please register first.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    emailOtpMap.set(email, { otp, expiresAt });

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - Coral Creek',
      text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: 'OTP sent to your registered email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// RESET PASSWORD - Verify OTP and update password
  // RESET PASSWORD - Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword)
      return res.status(400).json({ error: 'All fields are required' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'Passwords do not match' });

    const otpData = emailOtpMap.get(email);

    if (!otpData)
      return res.status(400).json({ error: 'OTP not found. Please request again.' });

    if (Date.now() > otpData.expiresAt)
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });

    if (otpData.otp !== otp)
      return res.status(400).json({ error: 'Invalid OTP' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // clear OTP after successful reset
    emailOtpMap.delete(email);

    res.status(200).json({ message: 'Password reset successful. Please login again.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
