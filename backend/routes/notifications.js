const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// =========================================================================
// GET /api/v1/notifications
// =========================================================================
router.get('/', protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const result = notifications.map(n => ({
    id: n._id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actionUrl: n.actionUrl,
  }));
  res.json({ success: true, message: 'Notifications fetched.', data: result });
}));

// =========================================================================
// PATCH /api/v1/notifications/:id/read
// =========================================================================
router.patch('/:id/read', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, message: 'Marked as read.', data: { id: notif._id, read: true } });
}));

// =========================================================================
// PATCH /api/v1/notifications/read-all
// =========================================================================
router.patch('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read.', data: { allRead: true } });
}));

// =========================================================================
// GET /api/v1/activity
// =========================================================================
router.get('/activity', protect, asyncHandler(async (req, res) => {
  const activities = await Activity.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(100);
  const result = activities.map(a => ({
    id: a._id,
    action: a.action,
    targetType: a.targetType,
    targetName: a.targetName,
    user: req.user.name,
    timestamp: a.timestamp,
    ip: a.ip,
  }));
  res.json({ success: true, message: 'Activity log.', data: result });
}));

// =========================================================================
// POST /api/v1/notifications/preferences
// =========================================================================
router.post('/preferences', protect, asyncHandler(async (req, res) => {
  const { emailAlerts, securityAlerts, weeklyDigest } = req.body;
  // In production: save to User model or a Preferences model
  res.json({ success: true, message: 'Preferences saved.', data: { saved: true, preferences: { emailAlerts, securityAlerts, weeklyDigest } } });
}));

module.exports = router;
