const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read database environment variables
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'since20_db',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

let pool = null;
let isFallback = false;
let memoryDb = { 
  users: [], 
  releases: [], 
  stats: [],
  support_messages: [],
  artist_portfolios: [],
  portfolio_catalog: [],
  artist_events: []
};
const fallbackFile = path.join(__dirname, '../database_fallback.json');

// Initialize in-memory database fallback from file if it exists
if (fs.existsSync(fallbackFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
    memoryDb = {
      users: data.users || [],
      releases: data.releases || [],
      stats: data.stats || [],
      support_messages: data.support_messages || [],
      artist_portfolios: data.artist_portfolios || [],
      portfolio_catalog: data.portfolio_catalog || [],
      artist_events: data.artist_events || []
    };
  } catch (err) {
    console.error('Failed to parse database fallback file, starting fresh:', err);
  }
}

// Seed the default Admin User if not already present
const defaultAdminEmail = 'pamithkumaranayaka@gmail.com';
const defaultAdminPass = '$2a$10$uOpLOnmOuXBfWumR1sjr3Ox49DMyPQEQrzwLm0hJuzoU7AM1XZwW.'; // bcrypt hash for '45973568'
const adminExists = memoryDb.users.some(u => u.email === defaultAdminEmail);
if (!adminExists) {
  memoryDb.users.push({
    id: 999,
    name: 'Pamith Mandiv',
    email: defaultAdminEmail,
    password: defaultAdminPass,
    role: 'admin',
    phone: '+94 77 123 4567',
    artist_name: 'SINCE\'20 Admin',
    country: 'Sri Lanka',
    created_at: new Date().toISOString()
  });
  saveFallbackDb();
} else {
  // Update the fallback hash in case it was wrong
  const adminIdx = memoryDb.users.findIndex(u => u.email === defaultAdminEmail);
  if (adminIdx !== -1) {
    memoryDb.users[adminIdx].password = defaultAdminPass;
    saveFallbackDb();
  }
}

function saveFallbackDb() {
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify(memoryDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database fallback file:', err);
  }
}

// Helper to check and initialize connection
async function initDb() {
  try {
    // Attempt to connect without database to create it if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });
    // Test the connection and initialize schema
    const conn = await pool.getConnection();
    
    try {
      const schemaFile = path.join(__dirname, '../schema.sql');
      if (fs.existsSync(schemaFile)) {
        const schemaSql = fs.readFileSync(schemaFile, 'utf8');
        await conn.query(schemaSql);
      }
      
      // Seed or update the default Admin User in actual MySQL DB
      const [existing] = await conn.query('SELECT * FROM users WHERE email = ?', [defaultAdminEmail]);
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO users (id, name, email, password, role, phone, artist_name, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [999, 'Pamith Mandiv', defaultAdminEmail, defaultAdminPass, 'admin', '+94 77 123 4567', 'SINCE\'20 Admin', 'Sri Lanka']
        );
      } else {
        // Ensure the password hash is up to date if it was previously incorrect
        await conn.query('UPDATE users SET password = ? WHERE email = ?', [defaultAdminPass, defaultAdminEmail]);
      }
    } catch (schemaErr) {
      console.error('Error executing schema or seeding admin:', schemaErr);
    }

    conn.release();
    console.log('Successfully connected to MySQL database:', dbConfig.database);
    isFallback = false;
  } catch (err) {
    console.warn('\n=========================================');
    console.warn('WARNING: Failed to connect to MySQL database.');
    console.warn(`Error: ${err.message}`);
    console.warn('FALLBACK: Switching to in-memory JSON file database storage.');
    console.warn(`Data will be persisted in: ${fallbackFile}`);
    console.warn('=========================================\n');
    isFallback = true;
  }
}

let initPromise = initDb();

async function ensureDbReady() {
  if (!initPromise) {
    initPromise = initDb();
  }
  await initPromise;
}

// Generic query wrapper matching the promise-based query syntax
async function query(sql, params = []) {
  await ensureDbReady();
  if (!isFallback && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return [rows];
    } catch (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
        console.warn('Database connection lost. Re-initializing...');
        initPromise = initDb();
        await initPromise;
        if (!isFallback && pool) {
          const [rows] = await pool.query(sql, params);
          return [rows];
        }
      }
      throw err;
    }
  }

  // Handle queries using simulated SQL parser (fallback mode)
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  
  if (normalizedSql.startsWith('SELECT * FROM users WHERE email = ?')) {
    const email = params[0];
    const user = memoryDb.users.find(u => u.email === email);
    return [user ? [user] : []];
  }

  if (normalizedSql.startsWith('SELECT * FROM users WHERE id = ?')) {
    const id = params[0];
    const user = memoryDb.users.find(u => u.id === id);
    return [user ? [user] : []];
  }

  if (normalizedSql.startsWith('SELECT id, name, email, artist_name, phone, country, created_at FROM users WHERE role = ?')) {
    const role = params[0] || 'artist';
    const artists = memoryDb.users.filter(u => u.role === role);
    return [artists];
  }

  if (normalizedSql.startsWith('INSERT INTO users')) {
    const newUser = {
      id: memoryDb.users.length + 1,
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'artist',
      phone: params[4],
      artist_name: params[5],
      country: params[6],
      created_at: new Date().toISOString()
    };
    memoryDb.users.push(newUser);
    saveFallbackDb();
    return [{ insertId: newUser.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('INSERT INTO releases')) {
    const newRelease = {
      id: memoryDb.releases.length + 1,
      user_id: params[0],
      song_name: params[1],
      artist_name: params[2],
      album_art: params[3],
      song_file: params[4],
      payment_receipt: params[5] || null,
      spotify_link: null,
      apple_music_link: null,
      lyrics_writer: params[6],
      melody_composer: params[7],
      release_date: params[8],
      tiktok_cut_time: params[9],
      tiktok_release_date: params[10],
      tiktok_link: params[11],
      youtube_channel: params[12],
      facebook_link: params[13],
      instagram_link: params[14],
      production_year: params[15],
      status: 'pending',
      additional_notes: params[16] || params[17] || '',
      created_at: new Date().toISOString()
    };
    memoryDb.releases.push(newRelease);
    
    // Auto-create blank stats
    memoryDb.stats.push({
      id: memoryDb.stats.length + 1,
      release_id: newRelease.id,
      spotify_streams: 0,
      apple_music_streams: 0,
      monthly_listeners: 0
    });

    saveFallbackDb();
    return [{ insertId: newRelease.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('SELECT r.*, s.spotify_streams')) {
    // Artist releases with stats query
    const userId = params[0];
    const userReleases = memoryDb.releases.filter(r => r.user_id === userId);
    const enriched = userReleases.map(r => {
      const s = memoryDb.stats.find(st => st.release_id === r.id) || { spotify_streams: 0, apple_music_streams: 0, monthly_listeners: 0 };
      return { ...r, ...s };
    });
    return [enriched];
  }

  if (normalizedSql.startsWith('SELECT r.*, s.spotify_streams, s.apple_music_streams, s.monthly_listeners FROM releases r LEFT JOIN stats s ON r.id = s.release_id ORDER BY r.created_at')) {
    // Admin list all releases
    const enriched = memoryDb.releases.map(r => {
      const s = memoryDb.stats.find(st => st.release_id === r.id) || { spotify_streams: 0, apple_music_streams: 0, monthly_listeners: 0 };
      return { ...r, ...s };
    });
    return [enriched];
  }

  if (normalizedSql.startsWith('SELECT r.*, u.name as artist_user_name')) {
    // Full release details with submitter name
    const id = params[0];
    const release = memoryDb.releases.find(r => r.id === id);
    if (!release) return [[]];
    const user = memoryDb.users.find(u => u.id === release.user_id) || {};
    return [[{
      ...release,
      artist_user_name: user.name,
      artist_user_email: user.email
    }]];
  }

  if (normalizedSql.startsWith("UPDATE releases SET status = 'released', spotify_link = ?, apple_music_link = ?, youtube_link = ? WHERE id = ?")) {
    const spotify_link = params[0];
    const apple_music_link = params[1];
    const youtube_link = params[2];
    const id = params[3];
    
    const index = memoryDb.releases.findIndex(r => r.id === id);
    if (index !== -1) {
      memoryDb.releases[index].status = 'released';
      memoryDb.releases[index].spotify_link = spotify_link;
      memoryDb.releases[index].apple_music_link = apple_music_link;
      memoryDb.releases[index].youtube_link = youtube_link;
      
      const statsIndex = memoryDb.stats.findIndex(st => st.release_id === id);
      if (statsIndex !== -1) {
        memoryDb.stats[statsIndex].spotify_streams = Math.floor(Math.random() * 50000) + 1200;
        memoryDb.stats[statsIndex].apple_music_streams = Math.floor(Math.random() * 25000) + 600;
        memoryDb.stats[statsIndex].monthly_listeners = Math.floor(Math.random() * 15000) + 300;
      }
      
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith("UPDATE releases SET status = 'correction', correction_note = ? WHERE id = ?")) {
    const note = params[0];
    const id = params[1];
    const index = memoryDb.releases.findIndex(r => r.id === id);
    if (index !== -1) {
      memoryDb.releases[index].status = 'correction';
      memoryDb.releases[index].correction_note = note;
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith("UPDATE releases SET status = ? WHERE id = ?")) {
    const status = params[0];
    const id = params[1];
    const index = memoryDb.releases.findIndex(r => r.id === id);
    if (index !== -1) {
      memoryDb.releases[index].status = status;
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('SELECT * FROM stats WHERE release_id = ?')) {
    const releaseId = params[0];
    const stat = memoryDb.stats.find(s => s.release_id === releaseId);
    return [stat ? [stat] : []];
  }

  // Support messages handlers
  if (normalizedSql.startsWith('INSERT INTO support_messages')) {
    const newMessage = {
      id: memoryDb.support_messages.length + 1,
      user_id: params[0],
      artist_name: params[1],
      message: params[2],
      admin_reply: null,
      created_at: new Date().toISOString()
    };
    memoryDb.support_messages.push(newMessage);
    saveFallbackDb();
    return [{ insertId: newMessage.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('SELECT * FROM support_messages')) {
    // Sort support messages descending by creation
    const sorted = [...memoryDb.support_messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return [sorted];
  }

  if (normalizedSql.startsWith('SELECT * FROM support_messages WHERE user_id = ?')) {
    const userId = params[0];
    const userMsgs = memoryDb.support_messages.filter(m => m.user_id === userId);
    return [userMsgs];
  }

  if (normalizedSql.startsWith('UPDATE support_messages SET admin_reply = ? WHERE id = ?')) {
    const reply = params[0];
    const id = params[1];
    const index = memoryDb.support_messages.findIndex(m => m.id === id);
    if (index !== -1) {
      memoryDb.support_messages[index].admin_reply = reply;
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // Portfolio handlers
  if (normalizedSql.startsWith('SELECT * FROM artist_portfolios WHERE slug = ?') || normalizedSql.startsWith('SELECT * FROM artist_portfolios WHERE LOWER(slug) = LOWER(?)')) {
    const slug = (params[0] || '').toLowerCase().trim();
    const portfolio = memoryDb.artist_portfolios.find(p => (p.slug || '').toLowerCase().trim() === slug);
    return [portfolio ? [portfolio] : []];
  }

  if (normalizedSql.startsWith('SELECT * FROM artist_portfolios WHERE user_id = ?')) {
    const userId = params[0];
    const portfolio = memoryDb.artist_portfolios.find(p => p.user_id === userId);
    return [portfolio ? [portfolio] : []];
  }

  if (normalizedSql.startsWith('SELECT id FROM artist_portfolios WHERE slug = ? AND user_id != ?') || normalizedSql.startsWith('SELECT id FROM artist_portfolios WHERE LOWER(slug) = LOWER(?) AND user_id != ?')) {
    const slug = (params[0] || '').toLowerCase().trim();
    const userId = params[1];
    const match = memoryDb.artist_portfolios.find(p => (p.slug || '').toLowerCase().trim() === slug && p.user_id !== userId);
    return [match ? [{ id: match.id }] : []];
  }

  if (normalizedSql.startsWith('INSERT INTO artist_portfolios (user_id, slug, display_name, roles, bio, location, email, website)')) {
    // Basic setup
    const newPortfolio = {
      id: memoryDb.artist_portfolios.length + 1,
      user_id: params[0],
      slug: params[1],
      display_name: params[2],
      roles: params[3], // stored as JSON string
      bio: params[4],
      location: params[5],
      email: params[6],
      website: params[7],
      profile_picture: null,
      cover_picture: null,
      theme_options: null,
      social_links: null,
      featured_release_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryDb.artist_portfolios.push(newPortfolio);
    saveFallbackDb();
    return [{ insertId: newPortfolio.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET slug = ?, display_name = ?, roles = ?, bio = ?, location = ?, email = ?, website = ? WHERE user_id = ?')) {
    const userId = params[7];
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      memoryDb.artist_portfolios[index] = {
        ...memoryDb.artist_portfolios[index],
        slug: params[0],
        display_name: params[1],
        roles: params[2],
        bio: params[3],
        location: params[4],
        email: params[5],
        website: params[6],
        updated_at: new Date().toISOString()
      };
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET display_name = ?, roles = ?, bio = ?, location = ?, email = ?, website = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[6]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index] = {
        ...memoryDb.artist_portfolios[index],
        display_name: params[0],
        roles: params[1],
        bio: params[2],
        location: params[3],
        email: params[4],
        website: params[5],
        updated_at: new Date().toISOString()
      };
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET profile_picture = ?, cover_picture = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[2]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].profile_picture = params[0];
      memoryDb.artist_portfolios[index].cover_picture = params[1];
      memoryDb.artist_portfolios[index].updated_at = new Date().toISOString();
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET social_links = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[1]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].social_links = params[0];
      memoryDb.artist_portfolios[index].updated_at = new Date().toISOString();
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET theme_options = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[1]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].theme_options = params[0];
      memoryDb.artist_portfolios[index].updated_at = new Date().toISOString();
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET featured_release_id = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[1]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].featured_release_id = params[0];
      memoryDb.artist_portfolios[index].updated_at = new Date().toISOString();
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('SELECT * FROM portfolio_catalog WHERE user_id = ? ORDER BY order_index ASC')) {
    const userId = params[0];
    const catalog = memoryDb.portfolio_catalog.filter(c => c.user_id === userId).sort((a, b) => a.order_index - b.order_index);
    return [catalog];
  }

  if (normalizedSql.startsWith('INSERT INTO portfolio_catalog')) {
    const newItem = {
      id: memoryDb.portfolio_catalog.length + 1,
      user_id: params[0],
      song_title: params[1],
      artist_name: params[2],
      featuring_artists: params[3],
      album_art: params[4],
      release_date: params[5],
      genre: params[6],
      description: params[7],
      streaming_links: params[8],
      order_index: params[9] || 0,
      created_at: new Date().toISOString()
    };
    memoryDb.portfolio_catalog.push(newItem);
    saveFallbackDb();
    return [{ insertId: newItem.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('UPDATE portfolio_catalog SET order_index = ? WHERE id = ? AND user_id = ?')) {
    const index = memoryDb.portfolio_catalog.findIndex(c => c.id === params[1] && c.user_id === params[2]);
    if (index !== -1) {
      memoryDb.portfolio_catalog[index].order_index = params[0];
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('DELETE FROM portfolio_catalog WHERE id = ? AND user_id = ?')) {
    const initialLength = memoryDb.portfolio_catalog.length;
    memoryDb.portfolio_catalog = memoryDb.portfolio_catalog.filter(c => !(c.id === params[0] && c.user_id === params[1]));
    if (memoryDb.portfolio_catalog.length < initialLength) {
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET selected_animation = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[1]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].selected_animation = params[0];
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_portfolios SET animation_enabled = ? WHERE user_id = ?')) {
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === params[1]);
    if (index !== -1) {
      memoryDb.artist_portfolios[index].animation_enabled = params[0];
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('SELECT * FROM artist_events WHERE user_id = ? ORDER BY event_date ASC')) {
    const userId = params[0];
    const userEvents = (memoryDb.artist_events || []).filter(e => e.user_id === userId).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    return [userEvents];
  }

  if (normalizedSql.startsWith('INSERT INTO artist_events')) {
    const newEvent = {
      id: (memoryDb.artist_events || []).length + 1,
      user_id: params[0],
      title: params[1],
      event_type: params[2],
      event_date: params[3],
      event_time: params[4] || null,
      venue: params[5] || null,
      city: params[6] || null,
      description: params[7] || null,
      ticket_link: params[8] || null,
      poster_image: params[9] || null,
      created_at: new Date().toISOString()
    };
    if (!memoryDb.artist_events) memoryDb.artist_events = [];
    memoryDb.artist_events.push(newEvent);
    saveFallbackDb();
    return [{ insertId: newEvent.id, affectedRows: 1 }];
  }

  if (normalizedSql.startsWith('UPDATE artist_events SET title = ?, event_type = ?, event_date = ?, event_time = ?, venue = ?, city = ?, description = ?, ticket_link = ?, poster_image = ?')) {
    const index = (memoryDb.artist_events || []).findIndex(e => e.id === parseInt(params[9]) && e.user_id === params[10]);
    if (index !== -1) {
      memoryDb.artist_events[index] = {
        ...memoryDb.artist_events[index],
        title: params[0],
        event_type: params[1],
        event_date: params[2],
        event_time: params[3] || null,
        venue: params[4] || null,
        city: params[5] || null,
        description: params[6] || null,
        ticket_link: params[7] || null,
        poster_image: params[8] || null,
      };
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('DELETE FROM artist_events WHERE id = ? AND user_id = ?')) {
    const initialLength = (memoryDb.artist_events || []).length;
    memoryDb.artist_events = (memoryDb.artist_events || []).filter(e => !(e.id === params[0] && e.user_id === params[1]));
    if (memoryDb.artist_events.length < initialLength) {
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  if (normalizedSql.startsWith('SELECT id FROM artist_portfolios WHERE user_id = ?')) {
    const userId = params[0];
    const portfolio = memoryDb.artist_portfolios.find(p => p.user_id === userId);
    return [portfolio ? [{ id: portfolio.id }] : []];
  }

  if (normalizedSql.startsWith('SELECT profile_picture, cover_picture FROM artist_portfolios WHERE user_id = ?')) {
    const userId = params[0];
    const portfolio = memoryDb.artist_portfolios.find(p => p.user_id === userId);
    return [portfolio ? [{ profile_picture: portfolio.profile_picture, cover_picture: portfolio.cover_picture }] : []];
  }

  if (normalizedSql.startsWith('SELECT order_index FROM portfolio_catalog WHERE user_id = ?')) {
    const userId = params[0];
    const catalog = memoryDb.portfolio_catalog.filter(c => c.user_id === userId);
    return [catalog.map(c => ({ order_index: c.order_index }))];
  }

  if (normalizedSql.startsWith('SELECT theme_options FROM artist_portfolios WHERE user_id = ?')) {
    const userId = params[0];
    const portfolio = memoryDb.artist_portfolios.find(p => p.user_id === userId);
    return [portfolio ? [{ theme_options: portfolio.theme_options }] : []];
  }

  if (normalizedSql.startsWith('SELECT poster_image FROM artist_events WHERE id = ? AND user_id = ?')) {
    const id = parseInt(params[0]);
    const userId = params[1];
    const event = (memoryDb.artist_events || []).find(e => e.id === id && e.user_id === userId);
    return [event ? [{ poster_image: event.poster_image }] : []];
  }

  if (normalizedSql.match(/^UPDATE artist_portfolios SET (profile_picture|cover_picture) = NULL WHERE user_id = \?/)) {
    const userId = params[0];
    const index = memoryDb.artist_portfolios.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      // Determine which column to null
      if (normalizedSql.includes('profile_picture')) {
        memoryDb.artist_portfolios[index].profile_picture = null;
      } else {
        memoryDb.artist_portfolios[index].cover_picture = null;
      }
      saveFallbackDb();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // Catch-all mock return
  console.log(`Mock DB Query: ${normalizedSql}`);
  return [[]];
}

module.exports = {
  query,
  execute: query,
  checkConnection: async () => !isFallback
};
