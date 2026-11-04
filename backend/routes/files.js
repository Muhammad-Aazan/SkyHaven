const express = require('express');
const router = express.Router();
const multer = require('multer');
const File = require('../models/File');
const Share = require('../models/Share');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { uploadWithCascadingFallback, deleteFileByProvider, getDownloadSignedUrl } = require('../config/storage');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

// Use memory storage for multer so we can stream buffer directly to ImageKit -> Cloudinary -> Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// Helper: log activity
const logActivity = async (userId, action, targetType, targetName, req) => {
  try {
    await Activity.create({
      userId,
      action,
      targetType,
      targetName,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch {/* non-blocking */}
};

// Helper: serialize file for API response
const serializeFile = async (file, ownerUser) => {
  const owner = ownerUser || await User.findById(file.ownerId);
  return {
    id: file._id,
    name: file.name,
    extension: file.extension,
    mimeType: file.mimeType,
    size: file.size,
    storageKey: file.storageKey,
    storageProvider: file.storageProvider || 'imagekit',
    parentFolderId: file.parentFolderId,
    ownerId: file.ownerId,
    ownerName: owner?.name || '',
    ownerEmail: owner?.email || '',
    starred: file.starred,
    isShared: file.isShared,
    shareCount: file.shareCount,
    versions: file.versions.map(v => ({
      id: v._id,
      versionNumber: v.versionNumber,
      size: v.size,
      checksum: v.checksum,
      uploadedAt: v.uploadedAt,
      uploadedBy: v.uploadedBy,
    })),
    currentVersion: file.currentVersion,
    thumbnailUrl: file.thumbnailUrl,
    previewUrl: file.previewUrl,
    downloadUrl: null,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    deletedAt: file.deletedAt,
  };
};

// =========================================================================
// GET /api/v1/files?folder=root|<folderId>
// =========================================================================
router.get('/', protect, asyncHandler(async (req, res) => {
  const { folder } = req.query;
  const parentFolderId = (folder === 'root' || !folder) ? null : folder;

  const files = await File.find({
    ownerId: req.user._id,
    parentFolderId: parentFolderId,
    deletedAt: null,
  }).sort({ createdAt: -1 });

  const serialized = await Promise.all(files.map(f => serializeFile(f, req.user)));
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ success: true, message: 'Files fetched.', data: serialized });
}));

// =========================================================================
// POST /api/v1/files/upload  (DIRECT MULTI-TIER CASCADING UPLOAD)
// Form data: file (binary), parentFolderId (optional)
// =========================================================================
router.post('/upload', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided in form-data.' });
  }

  const { originalname, size, mimetype, buffer } = req.file;
  const parentFolderId = req.body.parentFolderId === 'root' || !req.body.parentFolderId ? null : req.body.parentFolderId;

  // Check user storage quota (minimum 25 GB for all users)
  const user = await User.findById(req.user._id);
  const effectiveQuota = Math.max(user.storageQuota || 0, 25 * 1024 * 1024 * 1024);
  if (user.storageUsed + size > effectiveQuota) {
    return res.status(413).json({ success: false, message: 'Storage quota exceeded (25 GB). Please upgrade plan.' });
  }

  // CASCADING MULTI-TIER UPLOAD: ImageKit -> Cloudinary -> Supabase
  const uploadResult = await uploadWithCascadingFallback(buffer, originalname, mimetype, req.user._id.toString());

  const ext = originalname.includes('.') ? originalname.split('.').pop().toLowerCase() : 'dat';

  const newFile = await File.create({
    name: originalname,
    extension: ext,
    mimeType: mimetype,
    size: size,
    storageKey: uploadResult.storageKey || uploadResult.url,
    storageProvider: uploadResult.provider, // 'imagekit' | 'cloudinary' | 'supabase'
    parentFolderId: parentFolderId,
    ownerId: req.user._id,
    previewUrl: uploadResult.previewUrl || uploadResult.url,
    thumbnailUrl: uploadResult.thumbnailUrl || (mimetype.startsWith('image/') ? uploadResult.url : null),
    versions: [{
      versionNumber: 1,
      size,
      checksum: 'sha256-' + uuidv4().substring(0, 12),
      uploadedBy: req.user.name,
      storageKey: uploadResult.storageKey,
      downloadUrl: uploadResult.url,
    }],
    currentVersion: 1,
  });

  // Update user storage
  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: size } });

  // Log activity
  await logActivity(req.user._id, 'upload', 'file', originalname, req);

  const serialized = await serializeFile(newFile, req.user);
  res.status(201).json({
    success: true,
    message: `File uploaded successfully to ${uploadResult.provider.toUpperCase()}!`,
    data: serialized,
  });
}));

// =========================================================================
// POST /api/v1/files/upload/initiate (Legacy fallback endpoint)
// =========================================================================
router.post('/upload/initiate', protect, asyncHandler(async (req, res) => {
  const { name, size, mimeType } = req.body;
  const fileId = 'file_' + uuidv4().replace(/-/g, '').substring(0, 16);
  res.json({
    success: true,
    message: 'Initiated direct upload pipeline.',
    data: {
      fileId,
      uploadUrl: '/api/v1/files/upload',
      directUpload: true,
    },
  });
}));

// =========================================================================
// POST /api/v1/files/upload/complete (Legacy fallback)
// =========================================================================
router.post('/upload/complete', protect, asyncHandler(async (req, res) => {
  const { name, size, mimeType, parentFolderId, storageKey, previewUrl, thumbnailUrl } = req.body;
  const ext = name?.split('.').pop()?.toLowerCase() || 'dat';

  const newFile = await File.create({
    name,
    extension: ext,
    mimeType,
    size,
    storageKey: storageKey || `legacy_${Date.now()}`,
    storageProvider: 'supabase',
    parentFolderId: parentFolderId || null,
    ownerId: req.user._id,
    previewUrl,
    thumbnailUrl,
    versions: [{
      versionNumber: 1,
      size,
      checksum: 'sha256-' + uuidv4().replace(/-/g, '').substring(0, 12),
      uploadedBy: req.user.name,
    }],
    currentVersion: 1,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: size } });
  await logActivity(req.user._id, 'upload', 'file', name, req);

  const serialized = await serializeFile(newFile, req.user);
  res.status(201).json({ success: true, message: 'File saved.', data: serialized });
}));

// =========================================================================
// GET /api/v1/files/:fileId
// =========================================================================
router.get('/:fileId', protect, asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  const serialized = await serializeFile(file, req.user);
  res.json({ success: true, message: 'File details.', data: serialized });
}));

// =========================================================================
// PATCH /api/v1/files/:fileId  — rename
// =========================================================================
router.patch('/:fileId', protect, asyncHandler(async (req, res) => {
  const { name } = req.body;
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  if (name) {
    file.name = name;
    file.extension = name.includes('.') ? name.split('.').pop().toLowerCase() : file.extension;
  }
  await file.save();

  await logActivity(req.user._id, 'rename', 'file', name, req);

  const serialized = await serializeFile(file, req.user);
  res.json({ success: true, message: 'File renamed.', data: serialized });
}));

// =========================================================================
// DELETE /api/v1/files/:fileId  — move to trash
// =========================================================================
router.delete('/:fileId', protect, asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  file.deletedAt = new Date();
  await file.save();

  await logActivity(req.user._id, 'delete', 'file', file.name, req);

  res.json({ success: true, message: 'File moved to trash.', data: { fileId: req.params.fileId, trashed: true } });
}));

// Helper: check access to file (owned or shared)
const getFileWithAccessCheck = async (fileId, user) => {
  let file = await File.findOne({ _id: fileId, ownerId: user._id, deletedAt: null });
  if (file) return file;

  const userEmail = (user.email || '').toLowerCase().trim();
  const share = await Share.findOne({
    targetId: fileId,
    $or: [
      { recipientEmail: userEmail },
      { isPublic: true },
    ],
  });

  if (share && (!share.expiresAt || new Date() <= share.expiresAt)) {
    return File.findOne({ _id: fileId, deletedAt: null });
  }

  return null;
};

// =========================================================================
// GET /api/v1/files/:fileId/download
// =========================================================================
router.get('/:fileId/download', protect, asyncHandler(async (req, res) => {
  const file = await getFileWithAccessCheck(req.params.fileId, req.user);
  if (!file) return res.status(404).json({ success: false, message: 'File not found or access denied.' });

  const downloadUrl = file.previewUrl || await getDownloadSignedUrl(file.storageKey);
  await logActivity(req.user._id, 'download', 'file', file.name, req);

  res.json({
    success: true,
    message: 'Download URL generated.',
    data: {
      downloadUrl,
      filename: file.name,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    },
  });
}));

// =========================================================================
// GET /api/v1/files/:fileId/preview
// =========================================================================
router.get('/:fileId/preview', protect, asyncHandler(async (req, res) => {
  const file = await getFileWithAccessCheck(req.params.fileId, req.user);
  if (!file) return res.status(404).json({ success: false, message: 'File not found or access denied.' });

  const previewUrl = file.previewUrl || await getDownloadSignedUrl(file.storageKey);

  res.json({
    success: true,
    message: 'Preview URL.',
    data: { previewUrl, mimeType: file.mimeType, size: file.size, name: file.name },
  });
}));

// =========================================================================
// GET /api/v1/files/:fileId/versions
// =========================================================================
router.get('/:fileId/versions', protect, asyncHandler(async (req, res) => {
  const file = await getFileWithAccessCheck(req.params.fileId, req.user);
  if (!file) return res.status(404).json({ success: false, message: 'File not found or access denied.' });

  res.json({ success: true, message: 'Versions fetched.', data: file.versions });
}));

// =========================================================================
// POST /api/v1/files/:fileId/copy
// =========================================================================
router.post('/:fileId/copy', protect, asyncHandler(async (req, res) => {
  const { targetFolderId } = req.body;
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  const user = await User.findById(req.user._id);
  if (user.storageUsed + file.size > user.storageQuota) {
    return res.status(413).json({ success: false, message: 'Storage quota exceeded.' });
  }

  const copy = await File.create({
    name: `Copy of ${file.name}`,
    extension: file.extension,
    mimeType: file.mimeType,
    size: file.size,
    storageKey: file.storageKey,
    storageProvider: file.storageProvider,
    parentFolderId: targetFolderId || null,
    ownerId: req.user._id,
    previewUrl: file.previewUrl,
    thumbnailUrl: file.thumbnailUrl,
    versions: [{
      versionNumber: 1,
      size: file.size,
      checksum: 'sha256-copy',
      uploadedBy: req.user.name,
    }],
    currentVersion: 1,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: file.size } });

  const serialized = await serializeFile(copy, req.user);
  res.status(201).json({ success: true, message: 'File copied.', data: serialized });
}));

// =========================================================================
// POST /api/v1/files/:fileId/move
// =========================================================================
router.post('/:fileId/move', protect, asyncHandler(async (req, res) => {
  const { targetFolderId } = req.body;
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  file.parentFolderId = targetFolderId || null;
  await file.save();

  await logActivity(req.user._id, 'move', 'file', file.name, req);

  res.json({ success: true, message: 'File moved.', data: { fileId: req.params.fileId, targetFolderId } });
}));

// =========================================================================
// PATCH /api/v1/files/:fileId/star  — toggle star
// =========================================================================
router.patch('/:fileId/star', protect, asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.fileId, ownerId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  file.starred = !file.starred;
  await file.save();

  res.json({ success: true, message: `File ${file.starred ? 'starred' : 'unstarred'}.`, data: { fileId: req.params.fileId, starred: file.starred } });
}));

module.exports = router;
