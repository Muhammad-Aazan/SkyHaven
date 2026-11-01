const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['upload', 'download', 'share', 'rename', 'move', 'delete', 'restore', 'permanent_delete', 'version_add'],
      required: true,
    },
    targetType: { type: String, enum: ['file', 'folder'], required: true },
    targetName: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
