const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    device: { type: String },
    browser: { type: String },
    os: { type: String },
    ip: { type: String },
    location: { type: String },
    lastActive: { type: Date, default: Date.now },
    isCurrent: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
