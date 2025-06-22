const User = require('../models/User');

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error: Admin check failed' });
  }
};

module.exports = adminOnly;
