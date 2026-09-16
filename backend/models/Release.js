const mongoose = require('mongoose');

const releaseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  song_name: { type: String, required: true, trim: true },
  artist_name: { type: String, required: true, trim: true },
  album_art: { type: String, required: true },
  song_file: { type: String, required: true },
  payment_receipt: { type: String, default: null },
  spotify_link: { type: String, default: null },
  apple_music_link: { type: String, default: null },
  youtube_link: { type: String, default: null },
  lyrics_writer: { type: String, required: true, trim: true },
  melody_composer: { type: String, required: true, trim: true },
  release_date: { type: Date, required: true },
  tiktok_cut_time: { type: String, default: '' },
  tiktok_release_date: { type: Date, default: null },
  tiktok_link: { type: String, default: '' },
  youtube_channel: { type: String, default: '' },
  facebook_link: { type: String, default: '' },
  instagram_link: { type: String, default: '' },
  production_year: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'released', 'correction', 'rejected'],
    default: 'pending'
  },
  correction_note: { type: String, default: '' },
  additional_notes: { type: String, default: '' },
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

module.exports = mongoose.model('Release', releaseSchema);
