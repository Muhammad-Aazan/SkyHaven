const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    starred: { type: Boolean, default: false },
    color: { type: String, default: '#0061FE' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

folderSchema.index({ ownerId: 1, parentFolderId: 1, deletedAt: 1 });
folderSchema.index({ ownerId: 1, starred: 1 });

module.exports = mongoose.model('Folder', folderSchema);
