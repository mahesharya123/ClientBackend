const otpStore = new Map();
const { sendEmail } = require('../utils/sendEmail');

// generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Email OTP
const sendEmailOtpController = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + 2 * 60 * 1000 }); // 2 minutes

  try {
    await sendEmail({
      to: email,
      subject: 'Your Coral Creek Email OTP',
      text: `Your OTP is: ${otp}. It is valid for 2 minutes.`
    });
    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (err) {
    console.error('Email OTP Send Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify Email OTP
const verifyEmailOtpController = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'No OTP found for this email' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  otpStore.delete(email);
  res.status(200).json({ message: 'OTP verified successfully' });
};

module.exports = {
  sendEmailOtpController,
  verifyEmailOtpController,
};
