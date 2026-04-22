const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,       // Must be true for SameSite='none'
      sameSite: 'none',   // Allows the cookie to cross the two Vercel domains
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    // Inside login() AND completeScreening(), update the res.json block:
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isScreened: user.isScreened,
      votedPolls: user.votedPolls,
      profile: user.profile,
      token, // <-- ADD THIS LINE IN BOTH FUNCTIONS
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete screening (update user profile)
// @route   POST /api/auth/screening
// @access  Private/Voter
const completeScreening = async (req, res) => {
  try {
    // 1. Removed department and employeeId from destructuring
    const { name, age } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isScreened) {
      return res.status(400).json({ message: 'User already completed screening' });
    }

    // 2. Only save name and age to the profile
    user.profile.name = name;
    user.profile.age = age;
    user.isScreened = true;

    await user.save();

    // Generate new token with elevated privileges
    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Inside login() AND completeScreening(), update the res.json block:
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isScreened: user.isScreened,
      votedPolls: user.votedPolls,
      profile: user.profile,
      token, // <-- ADD THIS LINE IN BOTH FUNCTIONS
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  login,
  completeScreening,
  getMe,
  logout,
};
