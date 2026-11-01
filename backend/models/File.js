const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    size: { type: Number, required: true },
    checksum: { type: String },
    storageKey: { type: String },
    uploadedBy: { type: String },
    downloadUrl: { type: String },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    extension: { type: String, lowercase: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, required: true, default: 0 },
    storageKey: { type: String, required: true },
    storageProvider: { type: String, enum: ['imagekit', 'cloudinary', 'supabase'], default: 'imagekit' },
    parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    starred: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    shareCount: { type: Number, default: 0 },

    versions: { type: [versionSchema], default: [] },
    currentVersion: { type: Number, default: 1 },

    thumbnailUrl: { type: String },
    previewUrl: { type: String },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fileSchema.index({ ownerId: 1, parentFolderId: 1, deletedAt: 1 });
fileSchema.index({ ownerId: 1, starred: 1 });
fileSchema.index({ ownerId: 1, name: 'text' });
fileSchema.index({ deletedAt: 1 });

fileSchema.methods.toPublic = function (owner) {
  return {
    id: this._id || this.id,
    name: this.name,
    extension: this.extension,
    mimeType: this.mimeType,
    size: this.size,
    storageKey: this.storageKey,
    storageProvider: this.storageProvider || 'imagekit',
    parentFolderId: this.parentFolderId,
    ownerId: this.ownerId,
    ownerName: owner?.name || '',
    ownerEmail: owner?.email || '',
    starred: this.starred,
    isShared: this.isShared,
    shareCount: this.shareCount,
    versions: (this.versions || []).map(v => ({
      id: v._id || v.id,
      versionNumber: v.versionNumber,
      size: v.size,
      checksum: v.checksum,
      uploadedAt: v.uploadedAt,
      uploadedBy: v.uploadedBy,
      downloadUrl: v.downloadUrl,
    })),
    currentVersion: this.currentVersion,
    thumbnailUrl: this.thumbnailUrl,
    previewUrl: this.previewUrl,
    downloadUrl: null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    deletedAt: this.deletedAt,
  };
};

module.exports = mongoose.model('File', fileSchema);
