const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '../uploads');
const artworkDir = path.join(uploadDir, 'artworks');
const trackDir = path.join(uploadDir, 'tracks');
const receiptDir = path.join(uploadDir, 'receipts');
const avatarDir = path.join(uploadDir, 'avatars');
const bannerDir = path.join(uploadDir, 'banners');

[uploadDir, artworkDir, trackDir, receiptDir, avatarDir, bannerDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'album_art') {
      cb(null, artworkDir);
    } else if (file.fieldname === 'song_file') {
      cb(null, trackDir);
    } else if (file.fieldname === 'payment_receipt') {
      cb(null, receiptDir);
    } else if (file.fieldname === 'profile_picture') {
      cb(null, avatarDir);
    } else if (file.fieldname === 'banner_image') {
      cb(null, bannerDir);
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${fileHash}${ext}`);
  }
});

// Custom file filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'album_art' || file.fieldname === 'profile_picture' || file.fieldname === 'banner_image') {
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG files are allowed.'), false);
    }
  } else if (file.fieldname === 'song_file') {
    if (ext === '.wav') {
      cb(null, true);
    } else {
      cb(new Error('Only WAV audio files are allowed for song files.'), false);
    }
  } else if (file.fieldname === 'payment_receipt') {
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Payment receipt must be in JPG, PNG, or PDF format.'), false);
    }
  } else {
    cb(new Error('Unexpected upload field.'), false);
  }
};

// Initialize multer with storage and limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: (req, file) => {
      if (file.fieldname === 'album_art' || file.fieldname === 'profile_picture' || file.fieldname === 'banner_image') {
        return 5 * 1024 * 1024; // 5MB
      }
      if (file.fieldname === 'song_file') {
        return 50 * 1024 * 1024; // 50MB
      }
      if (file.fieldname === 'payment_receipt') {
        return 5 * 1024 * 1024; // 5MB
      }
      return 1 * 1024 * 1024;
    }
  }
});

module.exports = upload;
