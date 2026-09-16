require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Database connection
const { connectDB } = require('./config/db');

// Routes imports
const authRoutes = require('./routes/auth');
const releaseRoutes = require('./routes/releases');
const statsRoutes = require('./routes/stats');
const supportRoutes = require('./routes/support');
const contactRoutes = require('./routes/contact');
const portfolioRoutes = require('./routes/portfolio');

const app = express();
// Initialize database connection
connectDB();

const PORT = process.env.PORT || 5001;
const HOST = '127.0.0.1'; // MUST listen on localhost/127.0.0.1 for security compliance

// 1. Basic Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow loading images/audio from frontend
}));

// 2. Strict CORS Configuration (No wildcard '*')
const allowedOrigins = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:5174', 'http://127.0.0.1:5174',
  'http://localhost:5175', 'http://127.0.0.1:5175',
  'http://localhost:5176', 'http://127.0.0.1:5176'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy block: Origin not allowed'), false);
  },
  credentials: true
}));

// 3. API Request rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// Parse JSON and URL-encoded request bodies (2MB limit prevents DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Ensure upload folders exist
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// 4. Secure static serving (strictly path sandboxed)
app.use('/uploads', express.static(uploadsPath, {
  fallthrough: false,
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 5. Global Error Handling Middleware (Fail Close & No Error Leakage)
app.use((err, req, res, next) => {
  console.error('SERVER EXCEPTION:', err.stack || err.message);

  // Multer/file upload errors — safe to surface
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Please upload a smaller file.' });
  }
  if (err.message && err.message.startsWith('Only ')) {
    return res.status(400).json({ message: err.message });
  }

  // Never leak internal error details to clients in production
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'An unexpected server error occurred.' : (err.message || 'An unexpected server error occurred.')
  });
});

// Start listening only on loopback IP (security standard)
app.listen(PORT, HOST, () => {
  console.log(`SINCE'20 Backend server running securely at http://${HOST}:${PORT}`);
  console.log(`Serving static files from: ${uploadsPath}`);
});
