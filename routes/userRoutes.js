const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
// PATCH /api/users/update-mobile
router.patch('/update-mobile', authMiddleware, async (req, res) => {
  try {
    console.log('req.user:', req.user); // check what's available
    console.log('req.body.mobile:', req.body.mobile); // ensure input is coming

    const updated = await User.findByIdAndUpdate(req.user.id, {
      mobile: req.body.mobile
    }, { new: true });

    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({ user: updated });
  } catch (err) {
    console.error('Update Mobile Error:', err);
    res.status(500).json({ error: 'Server error while updating mobile' });
  }
});


// POST /api/users/reset-password
// POST /api/users/reset-password
router.post('/reset-password', authMiddleware, async (req, res) => {
  const { current, newPass } = req.body;

  if (!current || !newPass) {
    return res.status(400).json({ error: 'Both current and new password are required' });
  }

  if (!/(?=.*[!@#$%^&*])(?=.{8,})/.test(newPass)) {
    return res.status(400).json({ error: 'Password must be 8+ characters with a special character' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    user.password = await bcrypt.hash(newPass, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Password Reset Error:', err);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
});


// DELETE /api/users/delete
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
