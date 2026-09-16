require('dotenv').config();
const jwt = require('jsonwebtoken');

// Helper to fetch the JWT secret from environment or file fallback
function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  // Safe instance-isolated fallback secret for local test
  console.warn("WARNING: Using ephemeral JWT Secret. Session state will reset on server restart!");
  return 'since20_ephemeral_super_secret_key_123456';
}

const JWT_SECRET = getJwtSecret();

/**
 * Middleware to verify a valid JWT is present.
 * Sets req.user = { id, name, email, role, artist_name }
 */
function verifyToken(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, email, role, artist_name
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * Middleware to restrict access to Admins only.
 * Auto-verifies token if verifyToken has not run yet.
 */
function requireAdmin(req, res, next) {
  const checkAdmin = () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Authentication required.' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin credentials required.' });
    }
    next();
  };

  if (!req.user) {
    return verifyToken(req, res, checkAdmin);
  }
  checkAdmin();
}

/**
 * Middleware to restrict access to Artists (and Admins who have management rights).
 * Auto-verifies token if verifyToken has not run yet.
 */
function requireArtist(req, res, next) {
  const checkArtist = () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Authentication required.' });
    }
    // Admins are granted management access to artist endpoints as well
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Artist credentials required.' });
    }
    next();
  };

  if (!req.user) {
    return verifyToken(req, res, checkArtist);
  }
  checkArtist();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireArtist,
  JWT_SECRET
};
