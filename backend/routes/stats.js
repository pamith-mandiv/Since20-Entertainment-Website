const express = require('express');
const db = require('../config/db');

const router = express.Router();

/**
 * @route   GET /api/stats/spotify/:trackId
 * @desc    Fetch Spotify streams & monthly listeners
 * @access  Public
 */
router.get('/spotify/:trackId', async (req, res) => {
  const trackId = req.params.trackId;

  // Real Integration Checklist:
  // 1. If Spotify Developer credentials (client_id, client_secret) are configured in .env:
  //    - Send OAuth client credentials request to https://accounts.spotify.com/api/token to get an access token.
  //    - Send GET request to https://api.spotify.com/v1/tracks/{trackId} to fetch details.
  //    - Note: Spotify Web API does NOT expose public playcounts/streams via standard API (only visible to owner in Spotify for Artists dashboard).
  //    - Therefore, playcounts are either fetched via a scraper, or mock values must be stored in our internal stats table.

  try {
    // Attempt to pull stats recorded internally in our database
    const [rows] = await db.query('SELECT * FROM stats WHERE release_id = ?', [trackId]);
    
    if (rows && rows.length > 0) {
      return res.json({
        platform: 'Spotify',
        trackId,
        streams: rows[0].spotify_streams || 0,
        monthlyListeners: rows[0].monthly_listeners || 0,
        integrationType: 'Simulated (Spotify API ready)'
      });
    }

    // Default mock stats if database entry missing
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
  const trackId = req.params.trackId;

  // Real Integration Checklist:
  // 1. Generate an Apple Music JWT developer token using your private key (.p8 file) and Team ID.
  // 2. Fetch catalog details using GET https://api.music.apple.com/v1/catalog/{storefront}/songs/{trackId}
  // 3. To fetch stream numbers (requires Apple Music Partner/Reporting API credentials):
  //    - Poll report endpoints or read stored database sync states.

  try {
    const [rows] = await db.query('SELECT * FROM stats WHERE release_id = ?', [trackId]);
    
    if (rows && rows.length > 0) {
      return res.json({
        platform: 'Apple Music',
        trackId,
        streams: rows[0].apple_music_streams || 0,
        listeners: Math.floor((rows[0].apple_music_streams || 0) * 0.75),
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
