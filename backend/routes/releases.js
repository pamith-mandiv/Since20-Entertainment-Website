const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Release = require('../models/Release');
const Stat = require('../models/Stat');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { verifyToken, requireAdmin, requireArtist } = require('../middleware/auth');

const router = express.Router();

const releaseUploadFields = upload.fields([
  { name: 'album_art', maxCount: 1 },
  { name: 'song_file', maxCount: 1 },
  { name: 'payment_receipt', maxCount: 1 }
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

    const albumArtPath = `/uploads/artworks/${path.basename(req.files.album_art[0].filename)}`;
    const songFilePath = `/uploads/tracks/${path.basename(req.files.song_file[0].filename)}`;

    let receiptPath = null;
    if (req.files.payment_receipt) {
      receiptPath = `/uploads/receipts/${path.basename(req.files.payment_receipt[0].filename)}`;
    }

    try {
      const newRelease = await Release.create({
        user_id: req.user.id,
        song_name: song_name.trim(),
        artist_name: artist_name.trim(),
        album_art: albumArtPath,
        song_file: songFilePath,
        payment_receipt: receiptPath,
        lyrics_writer: lyrics_writer.trim(),
        melody_composer: melody_composer.trim(),
        release_date: new Date(release_date),
        tiktok_cut_time: tiktok_cut_time.trim(),
        tiktok_release_date: new Date(tiktok_release_date),
        tiktok_link: (tiktok_link || '').trim(),
        youtube_channel: (youtube_channel || '').trim(),
        facebook_link: (facebook_link || '').trim(),
        instagram_link: (instagram_link || '').trim(),
        production_year: parseInt(production_year, 10),
        status: 'pending',
        additional_notes: (additional_notes || '').trim()
      });

      // Initialize stats document for this release
      await Stat.create({
        release_id: newRelease._id,
        spotify_streams: 0,
        apple_music_streams: 0,
        monthly_listeners: 0
      });

      res.status(201).json({
        message: 'Release uploaded successfully. It is currently PENDING review.',
        releaseId: newRelease._id.toString()
      });
    } catch (dbErr) {
      console.error('Error during release upload:', dbErr);
      res.status(500).json({ message: 'Database failure. Please try again.' });
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
    const releases = await Release.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    const releaseIds = releases.map(r => r._id);
    const stats = await Stat.find({ release_id: { $in: releaseIds } }).lean();

    const statsMap = new Map();
    stats.forEach(s => {
      statsMap.set(s.release_id.toString(), s);
    });

    const enriched = releases.map(r => {
      const s = statsMap.get(r._id.toString()) || { spotify_streams: 0, apple_music_streams: 0, monthly_listeners: 0 };
      return {
        ...r,
        id: r._id.toString(),
        spotify_streams: s.spotify_streams,
        apple_music_streams: s.apple_music_streams,
        monthly_listeners: s.monthly_listeners
      };
    });

    res.json(enriched);
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
    const artists = await User.find({ role: 'artist' })
      .select('name email artist_name phone country created_at')
      .sort({ name: 1 })
      .lean();

    const formatted = artists.map(a => ({
      ...a,
      id: a._id.toString()
    }));

    res.json(formatted);
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
    const releases = await Release.find()
      .populate('user_id', 'name email phone artist_name')
      .sort({ created_at: -1 })
      .lean();

    const releaseIds = releases.map(r => r._id);
    const stats = await Stat.find({ release_id: { $in: releaseIds } }).lean();

    const statsMap = new Map();
    stats.forEach(s => {
      statsMap.set(s.release_id.toString(), s);
    });

    const enriched = releases.map(r => {
      const s = statsMap.get(r._id.toString()) || { spotify_streams: 0, apple_music_streams: 0, monthly_listeners: 0 };
      const user = r.user_id || {};
      return {
        ...r,
        id: r._id.toString(),
        user_id: user._id ? user._id.toString() : r.user_id,
        artist_user_name: user.name || '',
        artist_user_email: user.email || '',
        artist_user_phone: user.phone || '',
        artist_stage_name: user.artist_name || '',
        spotify_streams: s.spotify_streams,
        apple_music_streams: s.apple_music_streams,
        monthly_listeners: s.monthly_listeners
      };
    });

    res.json(enriched);
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
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid release ID.' });
  }

  try {
    const release = await Release.findByIdAndUpdate(id, { status: 'approved' });
    if (!release) return res.status(404).json({ message: 'Release not found.' });
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
  const { id } = req.params;
  const { spotify_link, apple_music_link, youtube_link } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid release ID.' });
  }

  try {
    const release = await Release.findByIdAndUpdate(
      id,
      {
        status: 'released',
        spotify_link: spotify_link || null,
        apple_music_link: apple_music_link || null,
        youtube_link: youtube_link || null
      }
    );

    if (!release) {
      return res.status(404).json({ message: 'Release not found.' });
    }

    await Stat.findOneAndUpdate(
      { release_id: id },
      {
        spotify_streams: Math.floor(Math.random() * 85000) + 1500,
        apple_music_streams: Math.floor(Math.random() * 45000) + 800,
        monthly_listeners: Math.floor(Math.random() * 12000) + 300,
        last_updated: new Date()
      },
      { upsert: true, new: true }
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
  const { id } = req.params;
  const { correction_note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid release ID.' });
  }

  try {
    const release = await Release.findByIdAndUpdate(
      id,
      { status: 'correction', correction_note: correction_note || '' }
    );

    if (!release) return res.status(404).json({ message: 'Release not found.' });
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
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid release ID.' });
  }

  try {
    const release = await Release.findByIdAndUpdate(id, { status: 'rejected' });
    if (!release) return res.status(404).json({ message: 'Release not found.' });
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

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid release ID.' });
    }

    const existing = await Release.findOne({ _id: id, user_id: req.user.id, status: 'correction' });
    if (!existing) {
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

    let albumArtPath = existing.album_art;
    let songFilePath = existing.song_file;
    let receiptPath = existing.payment_receipt;

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
      existing.song_name = song_name.trim();
      existing.artist_name = artist_name.trim();
      existing.album_art = albumArtPath;
      existing.song_file = songFilePath;
      existing.payment_receipt = receiptPath;
      existing.lyrics_writer = lyrics_writer.trim();
      existing.melody_composer = melody_composer.trim();
      existing.release_date = new Date(release_date);
      existing.tiktok_cut_time = (tiktok_cut_time || '').trim();
      existing.tiktok_release_date = new Date(tiktok_release_date);
      existing.tiktok_link = (tiktok_link || '').trim();
      existing.youtube_channel = (youtube_channel || '').trim();
      existing.facebook_link = (facebook_link || '').trim();
      existing.instagram_link = (instagram_link || '').trim();
      existing.production_year = parseInt(production_year, 10);
      existing.status = 'pending';
      existing.correction_note = '';
      existing.additional_notes = (additional_notes || '').trim();

      await existing.save();

      res.status(200).json({
        message: 'Release updated successfully. It is currently PENDING review.',
        releaseId: id
      });
    } catch (dbErr) {
      console.error('Error during release update:', dbErr);
      res.status(500).json({ message: 'Database failure. Please try again.' });
    }
  });
});

module.exports = router;
