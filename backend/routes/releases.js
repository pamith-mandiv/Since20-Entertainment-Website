const express = require('express');
const path = require('path');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { verifyToken, requireAdmin, requireArtist } = require('../middleware/auth');

const router = express.Router();

// Define expected upload payload structure
const releaseUploadFields = upload.fields([
  { name: 'album_art', maxCount: 1 },
  { name: 'song_file', maxCount: 1 },
  { name: 'payment_receipt', maxCount: 1 } // Added payment receipt support
]);

/**
 * @route   POST /api/releases/upload
 * @desc    Upload a new song release (Artist only)
 * @access  Private (Artist)
 */
router.post('/upload', verifyToken, requireArtist, (req, res) => {
  releaseUploadFields(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const {
      song_name,
      artist_name,
      lyrics_writer,
      melody_composer,
      release_date,
      tiktok_cut_time,
      tiktok_release_date,
      youtube_channel,
      tiktok_link,
      facebook_link,
      instagram_link,
      production_year,
      additional_notes
    } = req.body;

    // Validate fields
    if (
      !song_name ||
      !artist_name ||
      !lyrics_writer ||
      !melody_composer ||
      !release_date ||
      !tiktok_cut_time ||
      !tiktok_release_date ||
      !youtube_channel ||
      !production_year
    ) {
      return res.status(400).json({ message: 'All release metadata fields are required.' });
    }

    if (!req.files || !req.files.album_art || !req.files.song_file) {
      return res.status(400).json({ message: 'Both album artwork and song track files are required.' });
    }

    // Get the base file paths securely using path.basename to prevent traversal
    const albumArtPath = `/uploads/artworks/${path.basename(req.files.album_art[0].filename)}`;
    const songFilePath = `/uploads/tracks/${path.basename(req.files.song_file[0].filename)}`;
    
    // Receipt is optional
    let receiptPath = null;
    if (req.files.payment_receipt) {
      receiptPath = `/uploads/receipts/${path.basename(req.files.payment_receipt[0].filename)}`;
    }

    try {
      // Save metadata and file links to DB
      const queryStr = `
        INSERT INTO releases (
          user_id, song_name, artist_name, album_art, song_file, payment_receipt,
          lyrics_writer, melody_composer, release_date, tiktok_cut_time,
          tiktok_release_date, tiktok_link, youtube_channel, facebook_link, instagram_link, production_year, status,
          additional_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `;

      const [result] = await db.query(queryStr, [
        req.user.id,
        song_name,
        artist_name,
        albumArtPath,
        songFilePath,
        receiptPath,
        lyrics_writer,
        melody_composer,
        release_date,
        tiktok_cut_time,
        tiktok_release_date,
        tiktok_link || '',
        youtube_channel,
        facebook_link || '',
        instagram_link || '',
        parseInt(production_year, 10),
        additional_notes || ''
      ]);

      // Create a default statistics entry for this release
      await db.query(
        'INSERT INTO stats (release_id, spotify_streams, apple_music_streams, monthly_listeners) VALUES (?, 0, 0, 0)',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Release uploaded successfully. It is currently PENDING review.',
        releaseId: result.insertId
      });
    } catch (dbErr) {
      console.error('Database error during release upload:', dbErr);
      res.status(500).json({ message: 'Database query failure. Please try again.' });
    }
  });
});

/**
 * @route   GET /api/releases/my
 * @desc    Get releases created by the logged-in artist
 * @access  Private (Artist)
 */
router.get('/my', verifyToken, requireArtist, async (req, res) => {
  try {
    // Return releases with stats
    const [rows] = await db.query(
      `SELECT r.*, s.spotify_streams, s.apple_music_streams, s.monthly_listeners
       FROM releases r
       LEFT JOIN stats s ON r.id = s.release_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching artist releases:', err);
    res.status(500).json({ message: 'Failed to fetch your releases.' });
  }
});

/**
 * @route   GET /api/releases/artists/all
 * @desc    Get all artists profiles (Admin only)
 * @access  Private (Admin)
 */
router.get('/artists/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, artist_name, phone, country, created_at FROM users WHERE role = 'artist' ORDER BY name ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching artists listings:', err);
    res.status(500).json({ message: 'Failed to fetch artists roster.' });
  }
});

/**
 * @route   GET /api/releases/all
 * @desc    Get all releases (Admin only)
 * @access  Private (Admin)
 */
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Return all releases with statistics and submitter information
    const [rows] = await db.query(
      `SELECT r.*, u.name as artist_user_name, u.email as artist_user_email, u.phone as artist_user_phone, u.artist_name as artist_stage_name, s.spotify_streams, s.apple_music_streams, s.monthly_listeners
       FROM releases r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN stats s ON r.id = s.release_id
       ORDER BY r.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching admin releases:', err);
    res.status(500).json({ message: 'Failed to fetch all releases.' });
  }
});

/**
 * @route   PUT /api/releases/approve/:id
 * @desc    Approve a release (Admin only)
 * @access  Private (Admin)
 */
router.put('/approve/:id', verifyToken, requireAdmin, async (req, res) => {
  const releaseId = parseInt(req.params.id, 10);
  if (!releaseId) return res.status(400).json({ message: 'Invalid release ID.' });

  try {
    const [result] = await db.query("UPDATE releases SET status = 'approved' WHERE id = ?", [releaseId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Release not found.' });
    res.json({ message: 'Release approved. It is now awaiting distribution.' });
  } catch (err) {
    console.error('Error approving release:', err);
    res.status(500).json({ message: 'Failed to approve release.' });
  }
});

/**
 * @route   PUT /api/releases/distribute/:id
 * @desc    Mark a release as distributed and add links (Admin only)
 * @access  Private (Admin)
 */
router.put('/distribute/:id', verifyToken, requireAdmin, async (req, res) => {
  const releaseId = parseInt(req.params.id, 10);
  const { spotify_link, apple_music_link, youtube_link } = req.body;

  if (!releaseId) return res.status(400).json({ message: 'Invalid release ID.' });

  try {
    const [result] = await db.query(
      "UPDATE releases SET status = 'released', spotify_link = ?, apple_music_link = ?, youtube_link = ? WHERE id = ?",
      [spotify_link || null, apple_music_link || null, youtube_link || null, releaseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Release not found.' });
    }

    await db.query(
      `UPDATE stats 
       SET spotify_streams = ?, apple_music_streams = ?, monthly_listeners = ? 
       WHERE release_id = ?`,
      [
        Math.floor(Math.random() * 85000) + 1500,
        Math.floor(Math.random() * 45000) + 800,
        Math.floor(Math.random() * 12000) + 300,
        releaseId
      ]
    );

    res.json({ message: 'Release successfully marked as distributed.' });
  } catch (err) {
    console.error('Error distributing release:', err);
    res.status(500).json({ message: 'Failed to distribute release.' });
  }
});

/**
 * @route   PUT /api/releases/correction/:id
 * @desc    Request correction for a release (Admin only)
 * @access  Private (Admin)
 */
router.put('/correction/:id', verifyToken, requireAdmin, async (req, res) => {
  const releaseId = parseInt(req.params.id, 10);
  const { correction_note } = req.body;
  if (!releaseId) return res.status(400).json({ message: 'Invalid release ID.' });

  try {
    const [result] = await db.query(
      "UPDATE releases SET status = 'correction', correction_note = ? WHERE id = ?",
      [correction_note || '', releaseId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Release not found.' });
    res.json({ message: 'Correction request sent to artist.' });
  } catch (err) {
    console.error('Error requesting correction:', err);
    res.status(500).json({ message: 'Failed to request correction.' });
  }
});

/**
 * @route   PUT /api/releases/reject/:id
 * @desc    Reject a release (Admin only)
 * @access  Private (Admin)
 */
router.put('/reject/:id', verifyToken, requireAdmin, async (req, res) => {
  const releaseId = parseInt(req.params.id, 10);
  if (!releaseId) return res.status(400).json({ message: 'Invalid release ID.' });

  try {
    const [result] = await db.query("UPDATE releases SET status = 'rejected' WHERE id = ?", [releaseId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Release not found.' });
    res.json({ message: 'Release rejected.' });
  } catch (err) {
    console.error('Error rejecting release:', err);
    res.status(500).json({ message: 'Failed to reject release.' });
  }
});

/**
 * @route   PUT /api/releases/update/:id
 * @desc    Update a release submission (Artist only)
 * @access  Private (Artist)
 */
router.put('/update/:id', verifyToken, requireArtist, (req, res) => {
  releaseUploadFields(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const releaseId = parseInt(req.params.id, 10);
    if (!releaseId) return res.status(400).json({ message: 'Invalid release ID.' });

    // Ensure the release belongs to the user and is in 'correction' status
    const [existing] = await db.query('SELECT * FROM releases WHERE id = ? AND user_id = ? AND status = ?', [releaseId, req.user.id, 'correction']);
    if (existing.length === 0) {
      return res.status(403).json({ message: 'Release not found or not eligible for editing.' });
    }

    const {
      song_name,
      artist_name,
      lyrics_writer,
      melody_composer,
      release_date,
      tiktok_cut_time,
      tiktok_release_date,
      youtube_channel,
      tiktok_link,
      facebook_link,
      instagram_link,
      production_year,
      additional_notes
    } = req.body;

    if (
      !song_name || !artist_name || !lyrics_writer || !melody_composer || 
      !release_date || !tiktok_cut_time || !tiktok_release_date || 
      !youtube_channel || !production_year
    ) {
      return res.status(400).json({ message: 'All release metadata fields are required.' });
    }

    let albumArtPath = existing[0].album_art;
    let songFilePath = existing[0].song_file;
    let receiptPath = existing[0].payment_receipt;

    if (req.files && req.files.album_art) {
      albumArtPath = `/uploads/artworks/${path.basename(req.files.album_art[0].filename)}`;
    }
    if (req.files && req.files.song_file) {
      songFilePath = `/uploads/tracks/${path.basename(req.files.song_file[0].filename)}`;
    }
    if (req.files && req.files.payment_receipt) {
      receiptPath = `/uploads/receipts/${path.basename(req.files.payment_receipt[0].filename)}`;
    }

    try {
      const queryStr = `
        UPDATE releases SET 
          song_name = ?, artist_name = ?, album_art = ?, song_file = ?, payment_receipt = ?,
          lyrics_writer = ?, melody_composer = ?, release_date = ?, tiktok_cut_time = ?,
          tiktok_release_date = ?, tiktok_link = ?, youtube_channel = ?, facebook_link = ?, 
          instagram_link = ?, production_year = ?, status = 'pending', correction_note = '',
          additional_notes = ?
        WHERE id = ? AND user_id = ?
      `;

      await db.query(queryStr, [
        song_name, artist_name, albumArtPath, songFilePath, receiptPath,
        lyrics_writer, melody_composer, release_date, tiktok_cut_time,
        tiktok_release_date, tiktok_link || '', youtube_channel, facebook_link || '',
        instagram_link || '', parseInt(production_year, 10), additional_notes || '',
        releaseId, req.user.id
      ]);

      res.status(200).json({
        message: 'Release updated successfully. It is currently PENDING review.',
        releaseId
      });
    } catch (dbErr) {
      console.error('Database error during release update:', dbErr);
      res.status(500).json({ message: 'Database query failure. Please try again.' });
    }
  });
});

module.exports = router;
