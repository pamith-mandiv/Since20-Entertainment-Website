const mongoose = require('mongoose');

const artistPortfolioSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  display_name: { type: String, default: '', trim: true },
  roles: { type: [String], default: [] },
  bio: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true },
  website: { type: String, default: '', trim: true },
  profile_picture: { type: String, default: null },
  cover_picture: { type: String, default: null },
  theme_options: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  social_links: { type: [mongoose.Schema.Types.Mixed], default: () => [] },
  featured_release_id: { type: String, default: null },
  selected_animation: { type: String, default: 'animation1' },
  animation_enabled: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.user_id && ret.user_id._id) {
        ret.user_id = ret.user_id._id.toString();
      } else if (ret.user_id) {
        ret.user_id = ret.user_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.user_id && ret.user_id._id) {
        ret.user_id = ret.user_id._id.toString();
      } else if (ret.user_id) {
        ret.user_id = ret.user_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('ArtistPortfolio', artistPortfolioSchema);
