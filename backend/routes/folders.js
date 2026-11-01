const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const File = require('../models/File');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const logActivity = async (userId, action, targetType, targetName, req) => {
  try { await Activity.create({ userId, action, targetType, targetName, ip: req?.ip }); } catch {}
};

const serializeFolder = (folder) => ({
  id: folder._id,
  name: folder.name,
  parentFolderId: folder.parentFolderId,
  ownerId: folder.ownerId,
  ownerName: folder._ownerName || '',
  starred: folder.starred,
  color: folder.color,
  itemCount: folder._itemCount || 0,
  sizeBytes: folder._sizeBytes || 0,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
  deletedAt: folder.deletedAt,
});

// =========================================================================
// POST /api/v1/folders
// =========================================================================
router.post('/', protect, asyncHandler(async (req, res) => {
  const { name, parentFolderId, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Folder name is required.' });

  const folder = await Folder.create({
    name,
    parentFolderId: parentFolderId || null,
    ownerId: req.user._id,
    color: color || '#0061FE',
  });

  const result = serializeFolder(folder);
  result.ownerName = req.user.name;
  res.status(201).json({ success: true, message: 'Folder created.', data: result });
}));

// =========================================================================
// GET /api/v1/folders?parent=root|<folderId>
// =========================================================================
router.get('/', protect, asyncHandler(async (req, res) => {
  const { parent } = req.query;
  const parentFolderId = (parent === 'root' || !parent) ? null : parent;

  const folders = await Folder.find({
    ownerId: req.user._id,
    parentFolderId,
    deletedAt: null,
  }).sort({ createdAt: -1 });

  // Get item counts for each folder
  const results = await Promise.all(folders.map(async (f) => {
    const [fileCount, subfolderCount] = await Promise.all([
      File.countDocuments({ ownerId: req.user._id, parentFolderId: f._id, deletedAt: null }),
      Folder.countDocuments({ ownerId: req.user._id, parentFolderId: f._id, deletedAt: null }),
    ]);
    const result = serializeFolder(f);
    result.ownerName = req.user.name;
    result.itemCount = fileCount + subfolderCount;
    return result;
  }));

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ success: true, message: 'Folders fetched.', data: results });
}));

// =========================================================================
// GET /api/v1/folders/:folderId
// =========================================================================
router.get('/:folderId', protect, asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  const [fileCount, subfolderCount] = await Promise.all([
    File.countDocuments({ ownerId: req.user._id, parentFolderId: folder._id, deletedAt: null }),
    Folder.countDocuments({ ownerId: req.user._id, parentFolderId: folder._id, deletedAt: null }),
  ]);

  const result = serializeFolder(folder);
  result.ownerName = req.user.name;
  result.itemCount = fileCount + subfolderCount;
  res.json({ success: true, message: 'Folder details.', data: result });
}));

// =========================================================================
// PATCH /api/v1/folders/:folderId  — rename
// =========================================================================
router.patch('/:folderId', protect, asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  if (name) folder.name = name;
  if (color) folder.color = color;
  await folder.save();

  if (name) await logActivity(req.user._id, 'rename', 'folder', name, req);

  const result = serializeFolder(folder);
  result.ownerName = req.user.name;
  res.json({ success: true, message: 'Folder updated.', data: result });
}));

// =========================================================================
// DELETE /api/v1/folders/:folderId  — move to trash
// =========================================================================
router.delete('/:folderId', protect, asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  const now = new Date();

  // Trash folder and all subfolders/files recursively
  const trashFolderRecursive = async (folderId) => {
    await Folder.updateMany(
      { ownerId: req.user._id, parentFolderId: folderId, deletedAt: null },
      { deletedAt: now }
    );
    await File.updateMany(
      { ownerId: req.user._id, parentFolderId: folderId, deletedAt: null },
      { deletedAt: now }
    );
    const subfolders = await Folder.find({ parentFolderId: folderId, deletedAt: null });
    await Promise.all(subfolders.map(sf => trashFolderRecursive(sf._id)));
  };

  folder.deletedAt = now;
  await folder.save();
  await trashFolderRecursive(folder._id);

  await logActivity(req.user._id, 'delete', 'folder', folder.name, req);

  res.json({ success: true, message: 'Folder moved to trash.', data: { folderId: req.params.folderId, trashed: true } });
}));

// =========================================================================
// POST /api/v1/folders/:folderId/move
// =========================================================================
router.post('/:folderId/move', protect, asyncHandler(async (req, res) => {
  const { targetFolderId } = req.body;
  if (req.params.folderId === targetFolderId) {
    return res.status(400).json({ success: false, message: 'Cannot move a folder into itself.' });
  }

  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  folder.parentFolderId = targetFolderId || null;
  await folder.save();

  await logActivity(req.user._id, 'move', 'folder', folder.name, req);

  res.json({ success: true, message: 'Folder moved.', data: { folderId: req.params.folderId, targetFolderId } });
}));

// =========================================================================
// GET /api/v1/folders/:folderId/contents
// =========================================================================
router.get('/:folderId/contents', protect, asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  const [subfolders, files] = await Promise.all([
    Folder.find({ ownerId: req.user._id, parentFolderId: folder._id, deletedAt: null }),
    File.find({ ownerId: req.user._id, parentFolderId: folder._id, deletedAt: null }),
  ]);

  res.json({
    success: true,
    message: 'Folder contents.',
    data: {
      folder: serializeFolder(folder),
      subfolders: subfolders.map(serializeFolder),
      files: files.map(f => ({ id: f._id, name: f.name, extension: f.extension, size: f.size, mimeType: f.mimeType })),
    },
  });
}));

// =========================================================================
// PATCH /api/v1/folders/:folderId/star
// =========================================================================
router.patch('/:folderId/star', protect, asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.folderId, ownerId: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  folder.starred = !folder.starred;
  await folder.save();

  res.json({ success: true, message: `Folder ${folder.starred ? 'starred' : 'unstarred'}.`, data: { folderId: req.params.folderId, starred: folder.starred } });
}));

module.exports = router;
