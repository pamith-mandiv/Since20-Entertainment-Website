const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function isValidPassword(password) {
  return password && password.length >= 8 && password.length <= 128;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new artist account (Artist only)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { name, email, password, phone, artistName, country } = req.body;

  if (!name || !email || !password || !phone || !artistName || !country) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Restrict registration of the admin email address
  if (cleanEmail === 'pamithkumaranayaka@gmail.com') {
    return res.status(400).json({ message: 'This email is reserved and cannot be registered.' });
  }

  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'artist',
      phone: phone.trim(),
      artist_name: artistName.trim(),
      country: country.trim()
    });

    res.status(201).json({ message: 'Account registered successfully. You can now log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role, // "artist" or "admin"
      artist_name: user.artist_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        artist_name: user.artist_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
