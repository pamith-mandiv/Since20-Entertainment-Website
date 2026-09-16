const mongoose = require('mongoose');

const portfolioCatalogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  song_title: { type: String, required: true, trim: true },
  artist_name: { type: String, required: true, trim: true },
  featuring_artists: { type: String, default: '', trim: true },
  album_art: { type: String, required: true },
  release_date: { type: Date, required: true },
  genre: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  streaming_links: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  order_index: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
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

module.exports = mongoose.model('PortfolioCatalog', portfolioCatalogSchema);
