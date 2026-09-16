const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artist_name: { type: String, required: true },
  message: { type: String, required: true },
  admin_reply: { type: String, default: null },
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

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
