const User = require('../models/User'); // import user model

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Try again.' });
    }

    const token = generateToken(user._id); // your JWT method
    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
