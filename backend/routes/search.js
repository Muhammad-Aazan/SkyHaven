const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Folder = require('../models/Folder');
const Share = require('../models/Share');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { sendShareInvitationEmail } = require('../config/mailer');
const { getDownloadSignedUrl } = require('../config/storage');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// =========================================================================
// GET /api/v1/search?q=<query>&type=<fileType>
// =========================================================================
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  if (!q) return res.json({ success: true, data: { files: [], folders: [], total: 0 } });

  const regex = new RegExp(q, 'i');
  const baseQuery = { ownerId: req.user._id, deletedAt: null };

  const fileFilter = { ...baseQuery, name: regex };
  if (type && type !== 'all') {
    fileFilter.extension = type;
  }

  const [files, folders] = await Promise.all([
    File.find(fileFilter).limit(50),
    Folder.find({ ...baseQuery, name: regex }).limit(20),
  ]);

  res.json({
    success: true,
    message: 'Search results.',
    data: { files, folders, total: files.length + folders.length },
  });
}));

// =========================================================================
// GET /api/v1/recent
// =========================================================================
router.get('/recent', protect, asyncHandler(async (req, res) => {
  const files = await File.find({ ownerId: req.user._id, deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(15);

  res.json({ success: true, message: 'Recent files.', data: files });
}));

// =========================================================================
// GET /api/v1/starred
// =========================================================================
router.get('/starred', protect, asyncHandler(async (req, res) => {
  const [files, folders] = await Promise.all([
    File.find({ ownerId: req.user._id, starred: true, deletedAt: null }),
    Folder.find({ ownerId: req.user._id, starred: true, deletedAt: null }),
  ]);

  res.json({ success: true, message: 'Starred items.', data: { files, folders } });
}));

// =========================================================================
// GET /api/v1/dashboard/summary
// =========================================================================
router.get('/dashboard/summary', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const [fileCount, folderCount, starredFilesCount, starredFoldersCount, recentFiles] = await Promise.all([
    File.countDocuments({ ownerId: user._id, deletedAt: null }),
    Folder.countDocuments({ ownerId: user._id, deletedAt: null }),
    File.countDocuments({ ownerId: user._id, starred: true, deletedAt: null }),
    Folder.countDocuments({ ownerId: user._id, starred: true, deletedAt: null }),
    File.find({ ownerId: user._id, deletedAt: null }).sort({ updatedAt: -1 }).limit(6),
  ]);

  res.json({
    success: true,
    message: 'Dashboard summary.',
    data: {
      user: user.toPublic(),
      totalFiles: fileCount,
      totalFolders: folderCount,
      starredCount: starredFilesCount + starredFoldersCount,
      storageUsedBytes: user.storageUsed,
      storageQuotaBytes: user.storageQuota,
      recentFiles,
    },
  });
}));

// =========================================================================
// SHARES
// POST /api/v1/shares
// =========================================================================
router.post('/shares', protect, asyncHandler(async (req, res) => {
  const { targetId, targetType, recipientEmail, role, isPublic, password, expiresInDays } = req.body;

  // Get target name
  let targetName = '';
  if (targetType === 'file') {
    const f = await File.findById(targetId);
    targetName = f?.name || 'Untitled';
    if (f) { f.isShared = true; f.shareCount += 1; await f.save(); }
  } else {
    const f = await Folder.findById(targetId);
    targetName = f?.name || 'Untitled Folder';
  }

  const shareToken = uuidv4().replace(/-/g, '').substring(0, 12);
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

  const share = await Share.create({
    targetId,
    targetType,
    targetName,
    ownerId: req.user._id,
    recipientEmail: recipientEmail ? recipientEmail.toLowerCase().trim() : undefined,
    role: role || 'viewer',
    shareToken,
    isPublic: !!isPublic,
    isPasswordProtected: !!password,
    password: hashedPassword,
    expiresAt,
  });

  await Activity.create({ userId: req.user._id, action: 'share', targetType, targetName, ip: req.ip });

  // If invited by email, dispatch branded email & in-app notification
  if (recipientEmail) {
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${frontendBase}/share/${shareToken}`;

    // Send email invitation asynchronously
    sendShareInvitationEmail({
      to: recipientEmail.trim(),
      senderName: req.user.name || 'SkyHeaven Member',
      senderEmail: req.user.email,
      targetName,
      targetType,
      shareUrl,
      role: role || 'viewer',
      isPasswordProtected: !!password,
      expiresAt,
    }).catch(err => {
      console.error('❌ [SHARE INVITATION EMAIL ERROR]:', err.message);
    });

    // In-app notification if user has an account
    try {
      const recipientUser = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
      if (recipientUser) {
        await Notification.create({
          userId: recipientUser._id,
          title: `Shared ${targetType}: ${targetName}`,
          message: `${req.user.name || 'Someone'} shared a ${targetType} "${targetName}" with you.`,
          type: 'share',
          actionUrl: `/share/${shareToken}`,
        });
      }
    } catch (notifErr) {
      console.warn('Notification create warning:', notifErr.message);
    }
  }

  const result = { ...share.toObject(), id: share._id, password: undefined };
  res.status(201).json({ success: true, message: 'Share created.', data: result });
}));

// =========================================================================
// GET /api/v1/shares  — current user's sent shares
// =========================================================================
router.get('/shares', protect, asyncHandler(async (req, res) => {
  const shares = await Share.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  const result = shares.map(s => ({ ...s.toObject(), id: s._id, password: undefined }));
  res.json({ success: true, message: 'Shares fetched.', data: result });
}));

// =========================================================================
// GET /api/v1/shares/with-me  — files shared with me
// =========================================================================
router.get('/shares/with-me', protect, asyncHandler(async (req, res) => {
  const userEmail = (req.user.email || '').toLowerCase().trim();
  const shares = await Share.find({ recipientEmail: userEmail })
    .sort({ createdAt: -1 });

  const validShares = shares.filter(s => !s.expiresAt || new Date() <= s.expiresAt);

  const files = await Promise.all(
    validShares.filter(s => s.targetType === 'file').map(async s => {
      const f = await File.findOne({ _id: s.targetId, deletedAt: null });
      if (!f) return null;
      const owner = await User.findById(f.ownerId);
      return f.toPublic ? f.toPublic(owner) : {
        id: f._id.toString(),
        name: f.name,
        extension: f.extension,
        mimeType: f.mimeType,
        size: f.size,
        storageKey: f.storageKey,
        storageProvider: f.storageProvider || 'imagekit',
        parentFolderId: f.parentFolderId,
        ownerId: f.ownerId,
        ownerName: owner?.name || '',
        ownerEmail: owner?.email || '',
        starred: !!f.starred,
        isShared: true,
        shareCount: f.shareCount,
        versions: f.versions || [],
        currentVersion: f.currentVersion || 1,
        thumbnailUrl: f.thumbnailUrl,
        previewUrl: f.previewUrl,
        downloadUrl: null,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        deletedAt: null
      };
    })
  );

  res.json({ success: true, message: 'Shared with you.', data: files.filter(Boolean) });
}));

// =========================================================================
// GET /api/v1/shares/:shareId
// =========================================================================
router.get('/shares/:shareId', protect, asyncHandler(async (req, res) => {
  const share = await Share.findOne({
    $or: [{ _id: req.params.shareId }, { shareToken: req.params.shareId }],
    ownerId: req.user._id,
  });
  if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });

  // Check expiry
  if (share.expiresAt && new Date() > share.expiresAt) {
    return res.status(410).json({ success: false, message: 'This share link has expired.' });
  }

  res.json({ success: true, message: 'Share details.', data: { ...share.toObject(), id: share._id, password: undefined } });
}));

// =========================================================================
// PATCH /api/v1/shares/:shareId  — update role
// =========================================================================
router.patch('/shares/:shareId', protect, asyncHandler(async (req, res) => {
  const { role } = req.body;
  const share = await Share.findOneAndUpdate(
    { _id: req.params.shareId, ownerId: req.user._id },
    { role },
    { new: true }
  );
  if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });
  res.json({ success: true, message: 'Share updated.', data: { ...share.toObject(), id: share._id, password: undefined } });
}));

// =========================================================================
// DELETE /api/v1/shares/:shareId  — revoke share
// =========================================================================
router.delete('/shares/:shareId', protect, asyncHandler(async (req, res) => {
  const share = await Share.findOneAndDelete({ _id: req.params.shareId, ownerId: req.user._id });
  if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });
  res.json({ success: true, message: 'Share revoked.', data: { revoked: true, shareId: req.params.shareId } });
}));

// =========================================================================
// PATCH /api/v1/shares/:shareId/link  — update link settings
// =========================================================================
router.patch('/shares/:shareId/link', protect, asyncHandler(async (req, res) => {
  const { password, expiresAt } = req.body;
  const updates = { expiresAt: expiresAt !== undefined ? expiresAt : undefined };

  if (password !== undefined) {
    updates.isPasswordProtected = !!password;
    updates.password = password ? await bcrypt.hash(password, 10) : undefined;
  }

  const share = await Share.findOneAndUpdate(
    { _id: req.params.shareId, ownerId: req.user._id },
    updates,
    { new: true }
  );
  if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });
  res.json({ success: true, message: 'Link settings updated.', data: { ...share.toObject(), id: share._id, password: undefined } });
}));

// =========================================================================
// POST /api/v1/shares/:shareId/accept  — accept invitation
// =========================================================================
router.post('/shares/:shareId/accept', protect, asyncHandler(async (req, res) => {
  const share = await Share.findById(req.params.shareId);
  if (!share) return res.status(404).json({ success: false, message: 'Invitation not found.' });
  res.json({ success: true, message: 'Invitation accepted. File has been added to Shared with Me.', data: {} });
}));

// =========================================================================
// Public share page — GET /api/v1/public/share/:shareToken
// =========================================================================
router.get('/public/share/:shareToken', asyncHandler(async (req, res) => {
  const share = await Share.findOne({ shareToken: req.params.shareToken });
  if (!share) {
    return res.status(404).json({ success: false, message: 'Share link not found or has been revoked.' });
  }
  if (share.expiresAt && new Date() > share.expiresAt) {
    return res.status(410).json({ success: false, message: 'This share link has expired.' });
  }

  share.viewsCount = (share.viewsCount || 0) + 1;
  await share.save();

  let target = null;
  let owner = null;
  if (share.ownerId) {
    owner = await User.findById(share.ownerId).select('name email avatar');
  }

  if (share.targetType === 'file') {
    target = await File.findOne({ _id: share.targetId, deletedAt: null });
  } else {
    target = await Folder.findOne({ _id: share.targetId, deletedAt: null });
  }

  if (!target) {
    return res.status(404).json({ success: false, message: 'The shared file or folder is no longer available.' });
  }

  // If password protected, do not disclose download/preview URL yet
  if (share.isPasswordProtected) {
    return res.json({
      success: true,
      message: 'Password required to access this file.',
      data: {
        share: {
          id: share._id,
          shareToken: share.shareToken,
          targetName: share.targetName || target.name,
          targetType: share.targetType,
          isPasswordProtected: true,
          expiresAt: share.expiresAt,
          viewsCount: share.viewsCount,
          downloadsCount: share.downloadsCount || 0,
        },
        target: {
          id: target._id.toString(),
          name: target.name,
          extension: target.extension,
          mimeType: target.mimeType,
          size: target.size,
          createdAt: target.createdAt,
        },
        owner: {
          name: owner?.name || 'SkyHeaven Member',
          email: owner?.email || '',
        },
        isUnlocked: false,
      },
    });
  }

  // Not password protected: provide download/preview URL
  let downloadUrl = null;
  if (share.targetType === 'file' && target) {
    downloadUrl = target.previewUrl || await getDownloadSignedUrl(target.storageKey);
  }

  const targetData = target.toPublic ? target.toPublic(owner) : {
    id: target._id.toString(),
    name: target.name,
    extension: target.extension,
    mimeType: target.mimeType,
    size: target.size,
    previewUrl: target.previewUrl,
    thumbnailUrl: target.thumbnailUrl,
    createdAt: target.createdAt,
  };

  res.json({
    success: true,
    message: 'Public share loaded.',
    data: {
      share: {
        id: share._id,
        shareToken: share.shareToken,
        targetName: share.targetName || target.name,
        targetType: share.targetType,
        isPasswordProtected: false,
        expiresAt: share.expiresAt,
        viewsCount: share.viewsCount,
        downloadsCount: share.downloadsCount || 0,
      },
      target: targetData,
      owner: {
        name: owner?.name || 'SkyHeaven Member',
        email: owner?.email || '',
      },
      downloadUrl,
      isUnlocked: true,
    },
  });
}));

// =========================================================================
// Public share unlock — POST /api/v1/public/share/:shareToken/unlock
// =========================================================================
router.post('/public/share/:shareToken/unlock', asyncHandler(async (req, res) => {
  const { password } = req.body;
  const share = await Share.findOne({ shareToken: req.params.shareToken }).select('+password');
  if (!share) return res.status(404).json({ success: false, message: 'Share link not found.' });

  if (share.expiresAt && new Date() > share.expiresAt) {
    return res.status(410).json({ success: false, message: 'This share link has expired.' });
  }

  if (share.isPasswordProtected) {
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to access this file.' });
    }
    const isMatch = await bcrypt.compare(password, share.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check and try again.' });
    }
  }

  let target = null;
  let owner = null;
  if (share.ownerId) {
    owner = await User.findById(share.ownerId).select('name email avatar');
  }

  if (share.targetType === 'file') {
    target = await File.findOne({ _id: share.targetId, deletedAt: null });
  } else {
    target = await Folder.findOne({ _id: share.targetId, deletedAt: null });
  }

  if (!target) {
    return res.status(404).json({ success: false, message: 'The shared file or folder is no longer available.' });
  }

  let downloadUrl = null;
  if (share.targetType === 'file' && target) {
    downloadUrl = target.previewUrl || await getDownloadSignedUrl(target.storageKey);
  }

  const targetData = target.toPublic ? target.toPublic(owner) : {
    id: target._id.toString(),
    name: target.name,
    extension: target.extension,
    mimeType: target.mimeType,
    size: target.size,
    previewUrl: target.previewUrl,
    thumbnailUrl: target.thumbnailUrl,
    createdAt: target.createdAt,
  };

  res.json({
    success: true,
    message: 'Unlocked successfully.',
    data: {
      share: {
        id: share._id,
        shareToken: share.shareToken,
        targetName: share.targetName || target.name,
        targetType: share.targetType,
        isPasswordProtected: true,
        expiresAt: share.expiresAt,
        viewsCount: share.viewsCount,
        downloadsCount: share.downloadsCount || 0,
      },
      target: targetData,
      owner: {
        name: owner?.name || 'SkyHeaven Member',
        email: owner?.email || '',
      },
      downloadUrl,
      isUnlocked: true,
    },
  });
}));

// =========================================================================
// Public share track download — POST /api/v1/public/share/:shareToken/download
// =========================================================================
router.post('/public/share/:shareToken/download', asyncHandler(async (req, res) => {
  const share = await Share.findOne({ shareToken: req.params.shareToken });
  if (!share) return res.status(404).json({ success: false, message: 'Share link not found.' });

  share.downloadsCount = (share.downloadsCount || 0) + 1;
  await share.save();

  res.json({
    success: true,
    message: 'Download counted.',
    data: { downloadsCount: share.downloadsCount },
  });
}));

module.exports = router;
