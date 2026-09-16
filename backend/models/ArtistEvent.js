const mongoose = require('mongoose');

const artistEventSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  event_type: {
    type: String,
    enum: ['concert', 'live_show', 'press_conference', 'media', 'tour'],
    default: 'concert'
  },
  event_date: { type: Date, required: true },
  event_time: { type: String, default: null, trim: true },
  venue: { type: String, default: null, trim: true },
  city: { type: String, default: null, trim: true },
  description: { type: String, default: null, trim: true },
  ticket_link: { type: String, default: null, trim: true },
  poster_image: { type: String, default: null },
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

module.exports = mongoose.model('ArtistEvent', artistEventSchema);
