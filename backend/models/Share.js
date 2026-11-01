const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ['file', 'folder'], required: true },
    targetName: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, lowercase: true },
    role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
    shareToken: { type: String, unique: true, required: true },
    isPublic: { type: Boolean, default: false },
    isPasswordProtected: { type: Boolean, default: false },
    password: { type: String, select: false },
    expiresAt: { type: Date, default: null },
    viewsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shareSchema.index({ ownerId: 1 });
shareSchema.index({ targetId: 1 });

module.exports = mongoose.model('Share', shareSchema);
