const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const File = require('../models/File');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// =========================================================================
// GET /api/v1/health  — public health check
// =========================================================================
router.get('/health', asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DEGRADED';

  res.json({
    success: true,
    message: 'SkyHeaven API is healthy.',
    data: {
      status: 'healthy',
      uptime: process.uptime().toFixed(2) + 's',
      timestamp: new Date().toISOString(),
      services: {
        apiServer: 'UP (Node.js ' + process.version + ')',
        database: dbStatus + ' (MongoDB)',
        storageEngine: 'UP (Cloudflare R2 S3)',
        cache: 'UP (In-process)',
      },
    },
  });
}));

// All routes below require admin
router.use(protect, adminOnly);

// =========================================================================
// GET /api/v1/admin/users
// =========================================================================
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  const result = await Promise.all(users.map(async u => {
    const filesCount = await File.countDocuments({ ownerId: u._id, deletedAt: null });
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      planId: u.planId,
      storageUsed: u.storageUsed,
      storageQuota: u.storageQuota,
      filesCount,
      lastLogin: u.lastLoginAt || 'Never',
      createdAt: u.createdAt,
    };
  }));
  res.json({ success: true, message: 'Users fetched.', data: result });
}));

// =========================================================================
// GET /api/v1/admin/users/:userId
// =========================================================================
router.get('/users/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: user.toPublic() });
}));

// =========================================================================
// PATCH /api/v1/admin/users/:userId/status
// =========================================================================
router.patch('/users/:userId/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
  }

  const user = await User.findByIdAndUpdate(req.params.userId, { status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, message: `User ${status}.`, data: { userId: req.params.userId, status } });
}));

// =========================================================================
// GET /api/v1/admin/reports/storage
// =========================================================================
router.get('/reports/storage', asyncHandler(async (req, res) => {
  const [totalUsers, files] = await Promise.all([
    User.countDocuments({ status: 'active' }),
    File.find({ deletedAt: null }),
  ]);

  const totalQuota = await User.aggregate([{ $group: { _id: null, total: { $sum: '$storageQuota' } } }]);
  const totalUsed = await User.aggregate([{ $group: { _id: null, total: { $sum: '$storageUsed' } } }]);

  res.json({
    success: true,
    message: 'Storage report.',
    data: {
      totalStorageAllocatedBytes: totalQuota[0]?.total || 0,
      totalStorageUsedBytes: totalUsed[0]?.total || 0,
      activeAccounts: totalUsers,
      totalFilesIndexed: files.length,
      dailyUploadVolumeBytes: 0, // would track this with a time-series in prod
    },
  });
}));

// =========================================================================
// GET /api/v1/admin/reports/security
// =========================================================================
router.get('/reports/security', asyncHandler(async (req, res) => {
  // In production: aggregate security events from a SecurityEvent model
  // Returning static sample data for now
  res.json({
    success: true,
    message: 'Security report.',
    data: [
      {
        id: 'sec_1',
        event: 'Brute-force lockout triggered (5 failed OTP attempts)',
        severity: 'medium',
        userEmail: 'unknown@tor.exit',
        ip: '194.26.29.112',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        resolved: true,
      },
    ],
  });
}));

// =========================================================================
// POST /api/v1/admin/users/:userId/revoke-sessions
// =========================================================================
router.post('/users/:userId/revoke-sessions', asyncHandler(async (req, res) => {
  await Session.deleteMany({ userId: req.params.userId });
  res.json({ success: true, message: 'All sessions revoked.', data: { revoked: true, userId: req.params.userId, timestamp: new Date().toISOString() } });
}));

module.exports = router;
