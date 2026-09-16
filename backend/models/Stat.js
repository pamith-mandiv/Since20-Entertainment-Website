const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  release_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Release', required: true, unique: true },
  spotify_streams: { type: Number, default: 0 },
  apple_music_streams: { type: Number, default: 0 },
  monthly_listeners: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.release_id && ret.release_id._id) {
        ret.release_id = ret.release_id._id.toString();
      } else if (ret.release_id) {
        ret.release_id = ret.release_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.release_id && ret.release_id._id) {
        ret.release_id = ret.release_id._id.toString();
      } else if (ret.release_id) {
        ret.release_id = ret.release_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Stat', statSchema);
