const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireArtist } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// ─── Allowed image MIME types ────────────────────────────────────────────────
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS  = ['.jpg', '.jpeg', '.png', '.webp'];

// ─── Secure Multer for portfolio uploads (images only) ───────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    // Use crypto random name to prevent path-traversal and enumeration
    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `portfolio-${fileHash}${ext}`);
  }
});

// File filter: images only, validated by both MIME type AND extension
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
// Slugs must be alphanumeric + hyphens, 1–60 chars
function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]?$/i.test(slug);
}

// ─── Helper to ensure an artist has an active portfolio record ────────────────
async function ensurePortfolio(userId) {
  const [existing] = await db.query('SELECT * FROM artist_portfolios WHERE user_id = ?', [userId]);
  if (existing && existing.length > 0) {
    return existing[0];
  }
  const [userRows] = await db.query('SELECT name, artist_name, email FROM users WHERE id = ?', [userId]);
  const user = userRows && userRows[0] ? userRows[0] : {};
  let baseSlug = (user.artist_name || user.name || `artist-${userId}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `artist-${userId}`;

  // Check if slug taken
  const [slugTaken] = await db.query('SELECT id FROM artist_portfolios WHERE slug = ?', [baseSlug]);
  if (slugTaken && slugTaken.length > 0) {
    baseSlug = `${baseSlug}-${userId}`;
  }

  const defaultDisplayName = user.artist_name || user.name || 'Artist';
  const defaultEmail = user.email || '';

  await db.query(
    'INSERT INTO artist_portfolios (user_id, slug, display_name, roles, bio, location, email, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, baseSlug, defaultDisplayName, '[]', '', '', defaultEmail, '']
  );

  const [created] = await db.query('SELECT * FROM artist_portfolios WHERE user_id = ?', [userId]);
  return created && created.length > 0 ? created[0] : null;
}

// ─── Private Routes (must be registered BEFORE /:slug) ───────────────────────

// GET /api/portfolio/my/data - Private endpoint
router.get('/my/data', verifyToken, requireArtist, async (req, res) => {
  try {
    const userId = req.user.id;
    let portfolio = await ensurePortfolio(userId);

    if (portfolio) {
      if (typeof portfolio.roles === 'string') portfolio.roles = JSON.parse(portfolio.roles || '[]');
      if (typeof portfolio.theme_options === 'string') portfolio.theme_options = JSON.parse(portfolio.theme_options || '{}');
      if (typeof portfolio.social_links === 'string') portfolio.social_links = JSON.parse(portfolio.social_links || '[]');
    }

    const [catalog] = await db.query('SELECT * FROM portfolio_catalog WHERE user_id = ? ORDER BY order_index ASC', [userId]);
    const parsedCatalog = catalog.map(item => {
      if (typeof item.streaming_links === 'string') {
        item.streaming_links = JSON.parse(item.streaming_links || '{}');
      }
      return item;
    });

    const [events] = await db.query(
      'SELECT * FROM artist_events WHERE user_id = ? ORDER BY event_date ASC',
      [userId]
    );

    res.json({
      portfolio,
      catalog: parsedCatalog,
      events: events || []
    });
  } catch (err) {
    console.error('Error fetching private portfolio:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/portfolio/my/events
router.get('/my/events', verifyToken, requireArtist, async (req, res) => {
  try {
    const [events] = await db.query(
      'SELECT * FROM artist_events WHERE user_id = ? ORDER BY event_date ASC',
      [req.user.id]
    );
    res.json(events || []);
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

    // Validate slug format
    if (!slug || !isValidSlug(slug)) {
      return res.status(400).json({ message: 'Slug must be 3–60 lowercase letters, numbers, or hyphens.' });
    }

    // Enforce input length limits
    if (display_name && display_name.length > 100) return res.status(400).json({ message: 'Display name too long.' });
    if (bio && bio.length > 1000) return res.status(400).json({ message: 'Bio too long (max 1000 chars).' });
    if (location && location.length > 100) return res.status(400).json({ message: 'Location too long.' });
    if (website && website.length > 200) return res.status(400).json({ message: 'Website URL too long.' });

    const [existing] = await db.query('SELECT id FROM artist_portfolios WHERE user_id = ?', [userId]);

    // Check slug uniqueness (excluding current user)
    const [slugCheck] = await db.query(
      'SELECT id FROM artist_portfolios WHERE slug = ? AND user_id != ?',
      [slug, userId]
    );
    if (slugCheck && slugCheck.length > 0) {
      return res.status(409).json({ message: 'This slug is already taken. Please choose another.' });
    }

    const rolesStr = JSON.stringify(Array.isArray(roles) ? roles.slice(0, 10) : []);

    if (existing && existing.length > 0) {
      await db.query(
        'UPDATE artist_portfolios SET slug = ?, display_name = ?, roles = ?, bio = ?, location = ?, email = ?, website = ? WHERE user_id = ?',
        [slug, display_name, rolesStr, bio, location, email, website, userId]
      );
    } else {
      await db.query(
        'INSERT INTO artist_portfolios (user_id, slug, display_name, roles, bio, location, email, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, slug, display_name, rolesStr, bio, location, email, website]
      );
    }

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
    await ensurePortfolio(userId);

    const [existing] = await db.query('SELECT profile_picture, cover_picture FROM artist_portfolios WHERE user_id = ?', [userId]);

    let profilePic = existing && existing.length > 0 ? existing[0].profile_picture : null;
    let coverPic = existing && existing.length > 0 ? existing[0].cover_picture : null;

    if (req.files && req.files['profile_picture']) {
      profilePic = '/uploads/' + req.files['profile_picture'][0].filename;
    }
    if (req.files && req.files['cover_picture']) {
      coverPic = '/uploads/' + req.files['cover_picture'][0].filename;
    }

    await db.query('UPDATE artist_portfolios SET profile_picture = ?, cover_picture = ? WHERE user_id = ?', [profilePic, coverPic, userId]);

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
    await ensurePortfolio(userId);
    const { type } = req.body; // 'profile_picture' or 'cover_picture'

    // Strict whitelist check — prevents SQL column injection
    if (type !== 'profile_picture' && type !== 'cover_picture') {
      return res.status(400).json({ message: 'Invalid image type' });
    }

    const column = type === 'profile_picture' ? 'profile_picture' : 'cover_picture';
    await db.query(`UPDATE artist_portfolios SET ${column} = NULL WHERE user_id = ?`, [userId]);
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
    await ensurePortfolio(userId);
    const { links } = req.body;

    if (!Array.isArray(links) || links.length > 20) {
      return res.status(400).json({ message: 'Invalid social links data.' });
    }

    await db.query('UPDATE artist_portfolios SET social_links = ? WHERE user_id = ?', [JSON.stringify(links), userId]);
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
    await ensurePortfolio(userId);
    const { theme_options, selected_animation, animation_enabled } = req.body;

    // Update theme_options JSON blob
    await db.query('UPDATE artist_portfolios SET theme_options = ? WHERE user_id = ?', [JSON.stringify(theme_options), userId]);

    // Update animation columns if provided
    if (selected_animation !== undefined) {
      await db.query('UPDATE artist_portfolios SET selected_animation = ? WHERE user_id = ?', [selected_animation, userId]);
    }
    if (animation_enabled !== undefined) {
      await db.query('UPDATE artist_portfolios SET animation_enabled = ? WHERE user_id = ?', [animation_enabled ? 1 : 0, userId]);
    }

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

    // get max order index
    const [catalog] = await db.query('SELECT order_index FROM portfolio_catalog WHERE user_id = ?', [userId]);
    const nextOrder = catalog.length > 0 ? Math.max(...catalog.map(c => c.order_index)) + 1 : 0;

    await db.query(
      'INSERT INTO portfolio_catalog (user_id, song_title, artist_name, featuring_artists, album_art, release_date, genre, description, streaming_links, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, song_title, artist_name, featuring_artists, album_art, release_date, genre, description, streaming_links || '{}', nextOrder]
    );

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
    const { orderUpdates } = req.body; // array of { id, order_index }

    if (!Array.isArray(orderUpdates) || orderUpdates.length > 200) {
      return res.status(400).json({ message: 'Invalid reorder data.' });
    }

    for (const item of orderUpdates) {
      if (typeof item.id !== 'number' && typeof item.id !== 'string') continue;
      await db.query('UPDATE portfolio_catalog SET order_index = ? WHERE id = ? AND user_id = ?', [item.order_index, item.id, userId]);
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

    await db.query('DELETE FROM portfolio_catalog WHERE id = ? AND user_id = ?', [id, userId]);
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
    const { release_ids } = req.body; // Array of up to 3 pinned release IDs

    if (!Array.isArray(release_ids) || release_ids.length > 3) {
      return res.status(400).json({ message: 'You can feature a maximum of 3 releases.' });
    }

    // Get existing theme options
    const [portfolios] = await db.query('SELECT theme_options FROM artist_portfolios WHERE user_id = ?', [userId]);
    let themeOptions = {};
    if (portfolios && portfolios.length > 0) {
      themeOptions = typeof portfolios[0].theme_options === 'string'
        ? JSON.parse(portfolios[0].theme_options || '{}')
        : (portfolios[0].theme_options || {});
    }

    themeOptions.featured_releases = release_ids;

    await db.query('UPDATE artist_portfolios SET theme_options = ? WHERE user_id = ?', [JSON.stringify(themeOptions), userId]);
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

    let formattedDate = event_date;
    if (formattedDate && formattedDate.length === 10) {
      formattedDate += ' 00:00:00';
    }

    const [result] = await db.query(
      'INSERT INTO artist_events (user_id, title, event_type, event_date, event_time, venue, city, description, ticket_link, poster_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, title, event_type, formattedDate, event_time || null, venue || null, city || null, description || null, ticket_link || null, poster_image]
    );

    res.status(201).json({ message: 'Event created', id: result.insertId, poster_image });
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

    // Get current poster_image
    const [existing] = await db.query('SELECT poster_image FROM artist_events WHERE id = ? AND user_id = ?', [id, userId]);
    let poster_image = (existing && existing.length > 0) ? existing[0].poster_image : null;

    if (req.file) {
      poster_image = '/uploads/' + req.file.filename;
    } else if (remove_poster === 'true' || remove_poster === true) {
      poster_image = null;
    }

    let formattedDate = event_date;
    if (formattedDate && formattedDate.length === 10) {
      formattedDate += ' 00:00:00';
    }

    await db.query(
      'UPDATE artist_events SET title = ?, event_type = ?, event_date = ?, event_time = ?, venue = ?, city = ?, description = ?, ticket_link = ?, poster_image = ? WHERE id = ? AND user_id = ?',
      [title, event_type, formattedDate, event_time || null, venue || null, city || null, description || null, ticket_link || null, poster_image, id, userId]
    );

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

    await db.query('DELETE FROM artist_events WHERE id = ? AND user_id = ?', [id, userId]);
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

    // Validate slug format before hitting the database
    if (!cleanSlug || !isValidSlug(cleanSlug)) {
      return res.status(400).json({ message: 'Invalid portfolio URL.' });
    }

    let [portfolios] = await db.query('SELECT * FROM artist_portfolios WHERE LOWER(slug) = LOWER(?)', [cleanSlug]);

    // Fallback: Check if cleanSlug matches any user's artist_name or name
    if (!portfolios || portfolios.length === 0) {
      const [allUsers] = await db.query('SELECT id, name, artist_name FROM users');
      const normalizedQuery = cleanSlug.replace(/[^a-z0-9]/g, '');
      const matchedUser = allUsers.find(u => {
        const normName = (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normArtist = (u.artist_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (normName && normName === normalizedQuery) || (normArtist && normArtist === normalizedQuery);
      });

      if (matchedUser) {
        await ensurePortfolio(matchedUser.id);
        const [found] = await db.query('SELECT * FROM artist_portfolios WHERE user_id = ?', [matchedUser.id]);
        if (found && found.length > 0) {
          portfolios = found;
        }
      }
    }

    if (!portfolios || portfolios.length === 0) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const portfolio = portfolios[0];

    // Parse JSON fields
    if (typeof portfolio.roles === 'string') portfolio.roles = JSON.parse(portfolio.roles || '[]');
    if (typeof portfolio.theme_options === 'string') portfolio.theme_options = JSON.parse(portfolio.theme_options || '{}');
    if (typeof portfolio.social_links === 'string') portfolio.social_links = JSON.parse(portfolio.social_links || '[]');

    // Get catalog
    const [catalog] = await db.query('SELECT * FROM portfolio_catalog WHERE user_id = ? ORDER BY order_index ASC', [portfolio.user_id]);

    // Parse catalog JSON
    const parsedCatalog = catalog.map(item => {
      if (typeof item.streaming_links === 'string') {
        item.streaming_links = JSON.parse(item.streaming_links || '{}');
      }
      return item;
    });

    // Get events
    const [events] = await db.query(
      'SELECT * FROM artist_events WHERE user_id = ? ORDER BY event_date ASC',
      [portfolio.user_id]
    );

    res.json({
      portfolio,
      catalog: parsedCatalog,
      events: events || []
    });
  } catch (err) {
    console.error('Error fetching public portfolio:', err);
    res.status(500).json({ message: 'Error loading portfolio' });
  }
});

module.exports = router;
