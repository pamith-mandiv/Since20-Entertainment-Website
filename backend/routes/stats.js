const express = require('express');
const mongoose = require('mongoose');
const Stat = require('../models/Stat');

const router = express.Router();

/**
 * @route   GET /api/stats/spotify/:trackId
 * @desc    Fetch Spotify streams & monthly listeners
 * @access  Public
 */
router.get('/spotify/:trackId', async (req, res) => {
  const { trackId } = req.params;

  try {
    let stat = null;
    if (mongoose.Types.ObjectId.isValid(trackId)) {
      stat = await Stat.findOne({ release_id: trackId });
    }

    if (stat) {
      return res.json({
        platform: 'Spotify',
        trackId,
        streams: stat.spotify_streams || 0,
        monthlyListeners: stat.monthly_listeners || 0,
        integrationType: 'Simulated (Spotify API ready)'
      });
    }

    res.json({
      platform: 'Spotify',
      trackId,
      streams: 8520,
      monthlyListeners: 1420,
      integrationType: 'Mock'
    });
  } catch (err) {
    console.error('Spotify stats fetch error:', err);
    res.status(500).json({ message: 'Failed to retrieve Spotify statistics.' });
  }
});

/**
 * @route   GET /api/stats/apple/:trackId
 * @desc    Fetch Apple Music catalog play counts
 * @access  Public
 */
router.get('/apple/:trackId', async (req, res) => {
  const { trackId } = req.params;

  try {
    let stat = null;
    if (mongoose.Types.ObjectId.isValid(trackId)) {
      stat = await Stat.findOne({ release_id: trackId });
    }

    if (stat) {
      return res.json({
        platform: 'Apple Music',
        trackId,
        streams: stat.apple_music_streams || 0,
        listeners: Math.floor((stat.apple_music_streams || 0) * 0.75),
        integrationType: 'Simulated (Apple Music API ready)'
      });
    }

    res.json({
      platform: 'Apple Music',
      trackId,
      streams: 4120,
      listeners: 2980,
      integrationType: 'Mock'
    });
  } catch (err) {
    console.error('Apple Music stats fetch error:', err);
    res.status(500).json({ message: 'Failed to retrieve Apple Music statistics.' });
  }
});

module.exports = router;
