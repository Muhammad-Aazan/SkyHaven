const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { deleteFileByProvider } = require('../config/storage');

// =========================================================================
// GET /api/v1/trash
// =========================================================================
router.get('/', protect, asyncHandler(async (req, res) => {
  const [files, folders] = await Promise.all([
    File.find({ ownerId: req.user._id, deletedAt: { $ne: null } }),
    Folder.find({ ownerId: req.user._id, deletedAt: { $ne: null } }),
  ]);

  res.json({ success: true, message: 'Trash items.', data: { files, folders } });
}));

// =========================================================================
// POST /api/v1/trash/:itemId/restore
// =========================================================================
router.post('/:itemId/restore', protect, asyncHandler(async (req, res) => {
  const { itemType } = req.body;

  if (itemType === 'file') {
    const file = await File.findOneAndUpdate(
      { _id: req.params.itemId, ownerId: req.user._id },
      { deletedAt: null },
      { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: 'File not found in trash.' });
    await Activity.create({ userId: req.user._id, action: 'restore', targetType: 'file', targetName: file.name, ip: req.ip });
  } else {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.itemId, ownerId: req.user._id },
      { deletedAt: null },
      { new: true }
    );
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found in trash.' });

    // Restore all nested files
    await File.updateMany({ ownerId: req.user._id, parentFolderId: folder._id }, { deletedAt: null });
    await Activity.create({ userId: req.user._id, action: 'restore', targetType: 'folder', targetName: folder.name, ip: req.ip });
  }

  res.json({ success: true, message: 'Item restored.', data: { restored: true, itemId: req.params.itemId } });
}));

// =========================================================================
// DELETE /api/v1/trash/:itemId  — permanently delete one item
// =========================================================================
router.delete('/:itemId', protect, asyncHandler(async (req, res) => {
  const { itemType } = req.body;

  if (itemType === 'file') {
    const file = await File.findOne({ _id: req.params.itemId, ownerId: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    // Free storage
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });

    // Delete from corresponding cloud provider (ImageKit, Cloudinary, or Supabase)
    try { await deleteFileByProvider(file.storageKey, file.storageProvider, file.mimeType); } catch {}

    await file.deleteOne();
    await Activity.create({ userId: req.user._id, action: 'permanent_delete', targetType: 'file', targetName: file.name, ip: req.ip });
  } else {
    const folder = await Folder.findOne({ _id: req.params.itemId, ownerId: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    // Get and delete all files in folder
    const files = await File.find({ ownerId: req.user._id, parentFolderId: folder._id });
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    await Promise.all(files.map(f => deleteObject(f.storageKey).catch(() => {})));
    await File.deleteMany({ ownerId: req.user._id, parentFolderId: folder._id });

    if (totalSize > 0) await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -totalSize } });
    await folder.deleteOne();
    await Activity.create({ userId: req.user._id, action: 'permanent_delete', targetType: 'folder', targetName: folder.name, ip: req.ip });
  }

  res.json({ success: true, message: 'Item permanently deleted.', data: { permanentlyDeleted: true, itemId: req.params.itemId } });
}));

// =========================================================================
// DELETE /api/v1/trash  — empty all trash
// =========================================================================
router.delete('/', protect, asyncHandler(async (req, res) => {
  const [trashedFiles, trashedFolders] = await Promise.all([
    File.find({ ownerId: req.user._id, deletedAt: { $ne: null } }),
    Folder.find({ ownerId: req.user._id, deletedAt: { $ne: null } }),
  ]);

  const freedBytes = trashedFiles.reduce((acc, f) => acc + f.size, 0);

  // Delete from cloud providers
  await Promise.all(trashedFiles.map(f => deleteFileByProvider(f.storageKey, f.storageProvider, f.mimeType).catch(() => {})));

  await File.deleteMany({ ownerId: req.user._id, deletedAt: { $ne: null } });
  await Folder.deleteMany({ ownerId: req.user._id, deletedAt: { $ne: null } });

  if (freedBytes > 0) await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -freedBytes } });

  res.json({ success: true, message: 'Trash emptied.', data: { emptied: true, freedBytes } });
}));

// =========================================================================
// GET /api/v1/trash/:itemId  — deleted item details
// =========================================================================
router.get('/:itemId', protect, asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.itemId, ownerId: req.user._id });
  if (file) return res.json({ success: true, data: file });

  const folder = await Folder.findOne({ _id: req.params.itemId, ownerId: req.user._id });
  if (folder) return res.json({ success: true, data: folder });

  res.status(404).json({ success: false, message: 'Item not found.' });
}));

module.exports = router;
