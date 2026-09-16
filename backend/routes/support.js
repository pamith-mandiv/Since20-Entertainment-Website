const express = require('express');
const db = require('../config/db');
const { verifyToken, requireAdmin, requireArtist } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/support/message
 * @desc    Submit a support query / chat request (Artist only)
 * @access  Private (Artist)
 */
router.post('/message', verifyToken, requireArtist, async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Support message body is required.' });
  }

  try {
    const artistName = req.user.artist_name || req.user.name;
    
    await db.query(
      'INSERT INTO support_messages (user_id, artist_name, message) VALUES (?, ?, ?)',
      [req.user.id, artistName, message.trim()]
    );

    res.status(201).json({ message: 'Support message sent to administrator.' });
  } catch (err) {
    console.error('Error posting support message:', err);
    res.status(500).json({ message: 'Failed to send support query.' });
  }
});

/**
 * @route   GET /api/support/all
 * @desc    Get all support queries (Admin only)
 * @access  Private (Admin)
 */
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM support_messages ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching support messages:', err);
    res.status(500).json({ message: 'Failed to retrieve support queries.' });
  }
});

/**
 * @route   GET /api/support/my
 * @desc    Get user's support queries (Artist only)
 * @access  Private (Artist)
 */
router.get('/my', verifyToken, requireArtist, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching my support messages:', err);
    res.status(500).json({ message: 'Failed to retrieve your support queries.' });
  }
});

/**
 * @route   PUT /api/support/reply/:id
 * @desc    Reply to a support query (Admin only)
 * @access  Private (Admin)
 */
router.put('/reply/:id', verifyToken, requireAdmin, async (req, res) => {
  const { reply } = req.body;
  if (!reply || reply.trim() === '') {
    return res.status(400).json({ message: 'Reply message is required.' });
  }

  try {
    await db.query(
      'UPDATE support_messages SET admin_reply = ? WHERE id = ?',
      [reply.trim(), req.params.id]
    );
    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('Error sending reply:', err);
    res.status(500).json({ message: 'Failed to send reply.' });
  }
});

module.exports = router;
