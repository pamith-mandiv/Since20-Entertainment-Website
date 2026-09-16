const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
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

  // Restrict registration of the admin email address
  if (email.toLowerCase() === 'pamithkumaranayaka@gmail.com') {
    return res.status(400).json({ message: 'This email is reserved and cannot be registered.' });
  }

  try {
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (name, email, password, role, phone, artist_name, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'artist', phone, artistName, country]
    );

    res.status(201).json({ message: 'Account registered successfully. You can now log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token (Single entrance portal)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Removed selection role switch from body parameters

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Get user from database
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token containing their actual database role
    const payload = {
      id: user.id,
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
        id: user.id,
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
