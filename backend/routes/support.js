const express = require('express');
const mongoose = require('mongoose');
const SupportMessage = require('../models/SupportMessage');
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

    await SupportMessage.create({
      user_id: req.user.id,
      artist_name: artistName,
      message: message.trim()
    });

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
    const messages = await SupportMessage.find().sort({ created_at: -1 }).lean();
    const formatted = messages.map(m => ({
      ...m,
      id: m._id.toString()
    }));
    res.json(formatted);
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
    const messages = await SupportMessage.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    const formatted = messages.map(m => ({
      ...m,
      id: m._id.toString()
    }));
    res.json(formatted);
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
  const { id } = req.params;
  const { reply } = req.body;

  if (!reply || reply.trim() === '') {
    return res.status(400).json({ message: 'Reply message is required.' });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid support query ID.' });
  }

  try {
    const updated = await SupportMessage.findByIdAndUpdate(
      id,
      { admin_reply: reply.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Support query not found.' });
    }

    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('Error sending reply:', err);
    res.status(500).json({ message: 'Failed to send reply.' });
  }
});

module.exports = router;
