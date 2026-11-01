const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendOtpEmail } = require('../config/mailer');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// =========================================================================
// GET /api/v1/users/me
// =========================================================================
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Profile fetched.', data: req.user.toPublic() });
}));

const { uploadImage } = require('../config/imagekit');

// =========================================================================
// PATCH /api/v1/users/me  — update name / avatar
// =========================================================================
router.patch('/me', protect, asyncHandler(async (req, res) => {
  const { name, avatar, isOnboarded } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (isOnboarded !== undefined) updates.isOnboarded = Boolean(isOnboarded);

  if (avatar !== undefined) {
    if (avatar && avatar.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadImage(avatar, `avatar_${req.user._id}.png`, '/skyhaven/avatars');
        updates.avatar = uploadRes.url;
      } catch (e) {
        console.warn('ImageKit upload fallback:', e.message);
        updates.avatar = avatar;
      }
    } else {
      updates.avatar = avatar;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', data: user.toPublic() });
}));

// =========================================================================
// PATCH /api/v1/users/me/avatar
// =========================================================================
router.patch('/me/avatar', protect, asyncHandler(async (req, res) => {
  let { avatar } = req.body;
  if (!avatar) return res.status(400).json({ success: false, message: 'Avatar image required.' });

  if (avatar.startsWith('data:image/')) {
    try {
      const uploadRes = await uploadImage(avatar, `avatar_${req.user._id}.png`, '/skyhaven/avatars');
      avatar = uploadRes.url;
    } catch (e) {
      console.warn('ImageKit upload fallback:', e.message);
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
  res.json({ success: true, message: 'Avatar updated.', data: { avatar: user.avatar } });
}));

// =========================================================================
// PATCH /api/v1/users/me/email  — request email change, sends OTP
// =========================================================================
router.patch('/me/email', protect, asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ success: false, message: 'New email required.' });

  const existing = await User.findOne({ email: newEmail });
  if (existing) return res.status(409).json({ success: false, message: 'Email already in use.' });

  const otp = generateOtp();
  const user = await User.findById(req.user._id).select('+otp +otpExpires +pendingEmail');
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
  user.otpPurpose = 'email_change';
  user.pendingEmail = newEmail;
  await user.save();

  await sendOtpEmail(newEmail, otp, 'email_change');

  res.json({ success: true, message: `Verification code sent to ${newEmail}`, data: {} });
}));

// =========================================================================
// POST /api/v1/users/me/email/verify  — confirm new email with OTP
// =========================================================================
router.post('/me/email/verify', protect, asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id).select('+otp +otpExpires +otpPurpose +pendingEmail');

  if (!user.otp || user.otpPurpose !== 'email_change') {
    return res.status(400).json({ success: false, message: 'No email change was requested.' });
  }
  if (new Date() > user.otpExpires) {
    return res.status(400).json({ success: false, message: 'Code expired.' });
  }
  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid code.' });
  }

  user.email = user.pendingEmail;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  user.pendingEmail = undefined;
  await user.save();

  res.json({ success: true, message: 'Email updated.', data: { user: user.toPublic() } });
}));

// =========================================================================
// PATCH /api/v1/users/me/password  — change password
// =========================================================================
router.patch('/me/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully.', data: {} });
}));

// =========================================================================
// GET /api/v1/users/me/sessions
// =========================================================================
router.get('/me/sessions', protect, asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256')
    .update(req.headers.authorization.split(' ')[1])
    .digest('hex');

  const sessions = await Session.find({ userId: req.user._id }).sort({ lastActive: -1 });

  const result = sessions.map(s => ({
    sessionId: s._id,
    device: s.device || 'Unknown Device',
    browser: s.browser || 'Unknown Browser',
    os: s.os || 'Unknown OS',
    ip: s.ip || 'Unknown',
    location: s.location || 'Unknown',
    lastActive: s.lastActive,
    isCurrent: s.token === tokenHash,
  }));

  res.json({ success: true, message: 'Sessions fetched.', data: result });
}));

// =========================================================================
// DELETE /api/v1/users/me/sessions/:sessionId
// =========================================================================
router.delete('/me/sessions/:sessionId', protect, asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

  await session.deleteOne();

  res.json({ success: true, message: 'Session revoked.', data: { revokedSessionId: req.params.sessionId } });
}));

module.exports = router;
