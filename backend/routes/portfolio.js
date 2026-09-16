const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ArtistPortfolio = require('../models/ArtistPortfolio');
const PortfolioCatalog = require('../models/PortfolioCatalog');
const ArtistEvent = require('../models/ArtistEvent');
const User = require('../models/User');
const { verifyToken, requireArtist } = require('../middleware/auth');

// ─── Allowed image MIME types ────────────────────────────────────────────────
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// ─── Secure Multer for portfolio uploads (images only) ───────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `portfolio-${fileHash}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, or WebP image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
});

// ─── Slug validation helper ───────────────────────────────────────────────────
function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]?$/i.test(slug);
}

// ─── Helper to ensure an artist has an active portfolio record ────────────────
async function ensurePortfolio(userId) {
  let portfolio = await ArtistPortfolio.findOne({ user_id: userId });
  if (portfolio) {
    return portfolio;
  }

  const user = await User.findById(userId);
  let baseSlug = ((user && (user.artist_name || user.name)) || `artist-${userId}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `artist-${userId}`;

  // Check if slug taken
  const slugTaken = await ArtistPortfolio.findOne({ slug: baseSlug });
  if (slugTaken) {
    baseSlug = `${baseSlug}-${userId.toString().slice(-4)}`;
  }

  const defaultDisplayName = (user && (user.artist_name || user.name)) || 'Artist';
  const defaultEmail = (user && user.email) || '';

  portfolio = await ArtistPortfolio.create({
    user_id: userId,
    slug: baseSlug,
    display_name: defaultDisplayName,
    roles: [],
    bio: '',
    location: '',
    email: defaultEmail,
    website: ''
  });

  return portfolio;
}

// ─── Private Routes (must be registered BEFORE /:slug) ───────────────────────

// GET /api/portfolio/my/data - Private endpoint
router.get('/my/data', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioDoc = await ensurePortfolio(userId);
    const portfolio = portfolioDoc.toObject();

    const catalogDocs = await PortfolioCatalog.find({ user_id: userId }).sort({ order_index: 1 }).lean();
    const catalog = catalogDocs.map(item => ({
      ...item,
      id: item._id.toString()
    }));

    const eventDocs = await ArtistEvent.find({ user_id: userId }).sort({ event_date: 1 }).lean();
    const events = eventDocs.map(ev => ({
      ...ev,
      id: ev._id.toString()
    }));

    res.json({
      portfolio,
      catalog,
      events
    });
  } catch (err) {
    console.error('Error fetching private portfolio:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/portfolio/my/events
router.get('/my/events', verifyToken, requireArtist, async (req, res) => {
  try {
    const events = await ArtistEvent.find({ user_id: req.user.id }).sort({ event_date: 1 }).lean();
    const formatted = events.map(ev => ({
      ...ev,
      id: ev._id.toString()
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/portfolio/my/basic - Upsert basic profile
router.post('/my/basic', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    let { display_name, slug, roles, bio, location, email, website } = req.body;

    const cleanSlug = (slug || '').trim().toLowerCase();
    if (!cleanSlug || !isValidSlug(cleanSlug)) {
      return res.status(400).json({ message: 'Slug must be 3–60 lowercase letters, numbers, or hyphens.' });
    }

    if (display_name && display_name.length > 100) return res.status(400).json({ message: 'Display name too long.' });
    if (bio && bio.length > 1000) return res.status(400).json({ message: 'Bio too long (max 1000 chars).' });
    if (location && location.length > 100) return res.status(400).json({ message: 'Location too long.' });
    if (website && website.length > 200) return res.status(400).json({ message: 'Website URL too long.' });

    // Check slug uniqueness (excluding current user)
    const slugCheck = await ArtistPortfolio.findOne({
      slug: cleanSlug,
      user_id: { $ne: userId }
    });
    if (slugCheck) {
      return res.status(409).json({ message: 'This slug is already taken. Please choose another.' });
    }

    const rolesArr = Array.isArray(roles) ? roles.slice(0, 10) : [];

    await ArtistPortfolio.findOneAndUpdate(
      { user_id: userId },
      {
        slug: cleanSlug,
        display_name: display_name || '',
        roles: rolesArr,
        bio: bio || '',
        location: location || '',
        email: email || '',
        website: website || '',
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error saving portfolio basic info:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// POST /api/portfolio/my/images - Update images
router.post('/my/images', verifyToken, requireArtist, upload.fields([{ name: 'profile_picture', maxCount: 1 }, { name: 'cover_picture', maxCount: 1 }]), async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await ensurePortfolio(userId);

    let profilePic = portfolio.profile_picture;
    let coverPic = portfolio.cover_picture;

    if (req.files && req.files['profile_picture']) {
      profilePic = '/uploads/' + req.files['profile_picture'][0].filename;
    }
    if (req.files && req.files['cover_picture']) {
      coverPic = '/uploads/' + req.files['cover_picture'][0].filename;
    }

    portfolio.profile_picture = profilePic;
    portfolio.cover_picture = coverPic;
    portfolio.updated_at = new Date();
    await portfolio.save();

    res.json({ message: 'Images updated successfully', profile_picture: profilePic, cover_picture: coverPic });
  } catch (err) {
    console.error('Error updating images:', err);
    res.status(500).json({ message: 'Failed to update images' });
  }
});

// POST /api/portfolio/my/images/remove
router.post('/my/images/remove', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await ensurePortfolio(userId);
    const { type } = req.body;

    if (type !== 'profile_picture' && type !== 'cover_picture') {
      return res.status(400).json({ message: 'Invalid image type' });
    }

    portfolio[type] = null;
    portfolio.updated_at = new Date();
    await portfolio.save();

    res.json({ message: `${type === 'profile_picture' ? 'Profile picture' : 'Cover photo'} removed successfully` });
  } catch (err) {
    console.error('Error removing image:', err);
    res.status(500).json({ message: 'Failed to remove image' });
  }
});

// POST /api/portfolio/my/socials
router.post('/my/socials', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await ensurePortfolio(userId);
    const { links } = req.body;

    if (!Array.isArray(links) || links.length > 20) {
      return res.status(400).json({ message: 'Invalid social links data.' });
    }

    portfolio.social_links = links;
    portfolio.updated_at = new Date();
    await portfolio.save();

    res.json({ message: 'Social links updated' });
  } catch (err) {
    console.error('Error saving socials:', err);
    res.status(500).json({ message: 'Failed to save social links' });
  }
});

// POST /api/portfolio/my/theme
router.post('/my/theme', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await ensurePortfolio(userId);
    const { theme_options, selected_animation, animation_enabled } = req.body;

    if (theme_options !== undefined) {
      portfolio.theme_options = theme_options;
    }
    if (selected_animation !== undefined) {
      portfolio.selected_animation = selected_animation;
    }
    if (animation_enabled !== undefined) {
      portfolio.animation_enabled = Boolean(animation_enabled);
    }

    portfolio.updated_at = new Date();
    await portfolio.save();

    res.json({ message: 'Theme updated' });
  } catch (err) {
    console.error('Error saving theme:', err);
    res.status(500).json({ message: 'Failed to save theme' });
  }
});

// POST /api/portfolio/my/catalog
router.post('/my/catalog', verifyToken, requireArtist, upload.single('album_art'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { song_title, artist_name, featuring_artists, release_date, genre, description, streaming_links } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Album art is required' });
    }

    if (!song_title || song_title.length > 200) return res.status(400).json({ message: 'Song title is required (max 200 chars).' });
    if (!artist_name || artist_name.length > 200) return res.status(400).json({ message: 'Artist name is required (max 200 chars).' });

    const album_art = '/uploads/' + req.file.filename;

    const catalogItems = await PortfolioCatalog.find({ user_id: userId }).select('order_index').lean();
    const nextOrder = catalogItems.length > 0 ? Math.max(...catalogItems.map(c => c.order_index || 0)) + 1 : 0;

    let parsedStreamingLinks = {};
    if (typeof streaming_links === 'string') {
      try {
        parsedStreamingLinks = JSON.parse(streaming_links);
      } catch (e) {
        parsedStreamingLinks = {};
      }
    } else if (streaming_links && typeof streaming_links === 'object') {
      parsedStreamingLinks = streaming_links;
    }

    await PortfolioCatalog.create({
      user_id: userId,
      song_title: song_title.trim(),
      artist_name: artist_name.trim(),
      featuring_artists: (featuring_artists || '').trim(),
      album_art,
      release_date: new Date(release_date),
      genre: (genre || '').trim(),
      description: (description || '').trim(),
      streaming_links: parsedStreamingLinks,
      order_index: nextOrder
    });

    res.json({ message: 'Catalog item added' });
  } catch (err) {
    console.error('Error adding catalog item:', err);
    res.status(500).json({ message: 'Failed to add catalog item' });
  }
});

// PUT /api/portfolio/my/catalog/reorder
router.put('/my/catalog/reorder', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderUpdates } = req.body;

    if (!Array.isArray(orderUpdates) || orderUpdates.length > 200) {
      return res.status(400).json({ message: 'Invalid reorder data.' });
    }

    const bulkOps = orderUpdates
      .filter(item => item.id && mongoose.Types.ObjectId.isValid(item.id))
      .map(item => ({
        updateOne: {
          filter: { _id: item.id, user_id: userId },
          update: { $set: { order_index: item.order_index } }
        }
      }));

    if (bulkOps.length > 0) {
      await PortfolioCatalog.bulkWrite(bulkOps);
    }

    res.json({ message: 'Catalog reordered' });
  } catch (err) {
    console.error('Error reordering catalog:', err);
    res.status(500).json({ message: 'Failed to reorder catalog' });
  }
});

// DELETE /api/portfolio/my/catalog/:id
router.delete('/my/catalog/:id', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    await PortfolioCatalog.findOneAndDelete({ _id: id, user_id: userId });
    res.json({ message: 'Catalog item removed' });
  } catch (err) {
    console.error('Error deleting catalog item:', err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// POST /api/portfolio/my/feature
router.post('/my/feature', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const { release_ids } = req.body;

    if (!Array.isArray(release_ids) || release_ids.length > 3) {
      return res.status(400).json({ message: 'You can feature a maximum of 3 releases.' });
    }

    const portfolio = await ensurePortfolio(userId);
    const themeOptions = { ...(portfolio.theme_options || {}) };
    themeOptions.featured_releases = release_ids;

    portfolio.theme_options = themeOptions;
    portfolio.updated_at = new Date();
    await portfolio.save();

    res.json({ message: 'Featured releases updated successfully' });
  } catch (err) {
    console.error('Error updating featured releases:', err);
    res.status(500).json({ message: 'Failed to update featured releases' });
  }
});

// POST /api/portfolio/my/events
router.post('/my/events', verifyToken, requireArtist, upload.single('poster_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, event_type, event_date, event_time, venue, city, description, ticket_link } = req.body;

    if (!title || !event_type || !event_date) {
      return res.status(400).json({ message: 'Title, type and date are required' });
    }
    if (title.length > 200) return res.status(400).json({ message: 'Title too long.' });

    const poster_image = req.file ? '/uploads/' + req.file.filename : null;

    const event = await ArtistEvent.create({
      user_id: userId,
      title: title.trim(),
      event_type,
      event_date: new Date(event_date),
      event_time: (event_time || '').trim() || null,
      venue: (venue || '').trim() || null,
      city: (city || '').trim() || null,
      description: (description || '').trim() || null,
      ticket_link: (ticket_link || '').trim() || null,
      poster_image
    });

    res.status(201).json({ message: 'Event created', id: event._id.toString(), poster_image });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PUT /api/portfolio/my/events/:id
router.put('/my/events/:id', verifyToken, requireArtist, upload.single('poster_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, event_type, event_date, event_time, venue, city, description, ticket_link, remove_poster } = req.body;

    if (!title || !event_type || !event_date) {
      return res.status(400).json({ message: 'Title, type and date are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const existing = await ArtistEvent.findOne({ _id: id, user_id: userId });
    if (!existing) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let poster_image = existing.poster_image;
    if (req.file) {
      poster_image = '/uploads/' + req.file.filename;
    } else if (remove_poster === 'true' || remove_poster === true) {
      poster_image = null;
    }

    existing.title = title.trim();
    existing.event_type = event_type;
    existing.event_date = new Date(event_date);
    existing.event_time = (event_time || '').trim() || null;
    existing.venue = (venue || '').trim() || null;
    existing.city = (city || '').trim() || null;
    existing.description = (description || '').trim() || null;
    existing.ticket_link = (ticket_link || '').trim() || null;
    existing.poster_image = poster_image;

    await existing.save();

    res.json({ message: 'Event updated', poster_image });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/portfolio/my/events/:id
router.delete('/my/events/:id', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    await ArtistEvent.findOneAndDelete({ _id: id, user_id: userId });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// ─── PUBLIC Route — MUST be registered LAST to avoid shadowing /my/* routes ──

// GET /api/portfolio/:slug - Public endpoint
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = (slug || '').trim().toLowerCase();

    if (!cleanSlug || !isValidSlug(cleanSlug)) {
      return res.status(400).json({ message: 'Invalid portfolio URL.' });
    }

    let portfolio = await ArtistPortfolio.findOne({ slug: cleanSlug });

    // Fallback: Check if cleanSlug matches any user's artist_name or name
    if (!portfolio) {
      const allUsers = await User.find().select('name artist_name');
      const normalizedQuery = cleanSlug.replace(/[^a-z0-9]/g, '');
      const matchedUser = allUsers.find(u => {
        const normName = (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normArtist = (u.artist_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (normName && normName === normalizedQuery) || (normArtist && normArtist === normalizedQuery);
      });

      if (matchedUser) {
        portfolio = await ensurePortfolio(matchedUser._id);
      }
    }

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const portfolioObj = portfolio.toObject();

    // Get catalog
    const catalogDocs = await PortfolioCatalog.find({ user_id: portfolio.user_id }).sort({ order_index: 1 }).lean();
    const catalog = catalogDocs.map(item => ({
      ...item,
      id: item._id.toString()
    }));

    // Get events
    const eventDocs = await ArtistEvent.find({ user_id: portfolio.user_id }).sort({ event_date: 1 }).lean();
    const events = eventDocs.map(ev => ({
      ...ev,
      id: ev._id.toString()
    }));

    res.json({
      portfolio: portfolioObj,
      catalog,
      events
    });
  } catch (err) {
    console.error('Error fetching public portfolio:', err);
    res.status(500).json({ message: 'Error loading portfolio' });
  }
});

module.exports = router;
