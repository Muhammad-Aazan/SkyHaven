const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { sendOtpEmail } = require('../config/mailer');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// Helper: sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Helper: generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: parse User-Agent loosely
const parseUA = (ua = '') => {
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown Browser';
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Unknown OS';
  return { browser, os };
};

// Helper: create session record
const createSession = async (userId, req, token) => {
  const { browser, os } = parseUA(req.headers['user-agent']);
  const ip = req.ip || req.connection?.remoteAddress || 'Unknown';

  // Mark previous sessions as not current
  await Session.updateMany({ userId }, { isCurrent: false });

  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
  await Session.create({
    userId,
    token: crypto.createHash('sha256').update(token).digest('hex'),
    device: 'Desktop',
    browser,
    os,
    ip,
    location: 'Unknown',
    lastActive: new Date(),
    isCurrent: true,
    expiresAt,
  });
};

// =========================================================================
// POST /api/v1/auth/signup
// =========================================================================
router.post('/signup', asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  email = email.trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing && existing.isEmailVerified) {
    return res.status(409).json({
      success: false,
      message: 'This email is already registered. Please log in or use Forgot Password.',
      alreadyExists: true,
    });
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '10')) * 60 * 1000);

  if (existing) {
    // Update unverified user
    existing.name = name;
    existing.password = password;
    existing.otp = otp;
    existing.otpExpires = otpExpires;
    existing.otpPurpose = 'verify';
    await existing.save();
  } else {
    await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
      otpPurpose: 'verify',
      status: 'pending',
    });
  }

  const mailResult = await sendOtpEmail(email, otp, 'verify');
  const isResend = Boolean(existing); // true if unverified account already existed

  res.status(200).json({
    success: true,
    otpResent: isResend,
    message: isResend
      ? `This email already has a pending verification. A new code has been sent to ${email}. Please check your inbox and spam folder.`
      : mailResult?.success === false 
        ? `Verification code generated. If you do not see it in your inbox, check Spam/Junk folder.`
        : `Verification code sent to ${email}. Please check your inbox and spam folder.`,
    data: {
      email,
      expiresInSeconds: (parseInt(process.env.OTP_EXPIRY_MINUTES || '10')) * 60,
      tempToken: jwt.sign({ email, purpose: 'pre_verify' }, process.env.JWT_SECRET, { expiresIn: '15m' }),
    },
  });
}));

// =========================================================================
// POST /api/v1/auth/send-otp
// =========================================================================
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const user = await User.findOne({ email }).select('+otp +otpExpires');
  if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
  user.otpPurpose = 'verify';
  await user.save();

  await sendOtpEmail(email, otp, 'verify');

  res.json({ success: true, message: `Verification code sent to ${email}`, data: { expiresIn: 600 } });
}));

// =========================================================================
// POST /api/v1/auth/verify-otp
// =========================================================================
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpires +otpPurpose');
  if (!user) return res.status(404).json({ success: false, message: 'No account found.' });

  if (!user.otp || !user.otpExpires) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this email.' });
  }
  if (new Date() > user.otpExpires) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
  }
  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid verification code.' });
  }

  const verificationToken = jwt.sign({ email, purpose: 'complete_signup' }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // Clear OTP
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'OTP verified.', data: { verified: true, verificationToken } });
}));

// =========================================================================
// POST /api/v1/auth/resend-otp
// =========================================================================
router.post('/resend-otp', asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+otp +otpExpires');
  if (!user) return res.status(404).json({ success: false, message: 'No account found.' });

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
  await user.save();

  await sendOtpEmail(email, otp, 'verify');

  res.json({ success: true, message: 'New OTP dispatched.', data: { cooldownSeconds: 45 } });
}));

// =========================================================================
// POST /api/v1/auth/complete-signup
// =========================================================================
router.post('/complete-signup', asyncHandler(async (req, res) => {
  const { name, email, verificationToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
  }

  if (decoded.email !== email || decoded.purpose !== 'complete_signup') {
    return res.status(400).json({ success: false, message: 'Token mismatch.' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.name = name;
  user.isEmailVerified = true;
  user.status = 'active';
  user.storageQuota = Math.max(25 * 1024 * 1024 * 1024, parseInt(process.env.FREE_QUOTA || '26843545600'));
  await user.save();

  // Create welcome notification
  try {
    await Notification.create({
      userId: user._id,
      title: 'Welcome to SkyHeaven!',
      message: 'Your personal vault with 25 GB free encrypted cloud storage is ready. You can safely upload, view, and share files.',
      type: 'system',
      read: false,
    });
  } catch (notifErr) {
    console.warn('Welcome notification error:', notifErr.message);
  }

  const token = signToken(user._id);
  await createSession(user._id, req, token);

  res.status(201).json({ success: true, message: 'Account created successfully.', data: { user: user.toPublic(), token } });
}));

// =========================================================================
// POST /api/v1/auth/login
// =========================================================================
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email first.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  await createSession(user._id, req, token);

  res.json({ success: true, message: 'Logged in successfully.', data: { user: user.toPublic(), token } });
}));

// =========================================================================
// POST /api/v1/auth/logout
// =========================================================================
router.post('/logout', protect, asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256')
    .update(req.headers.authorization.split(' ')[1])
    .digest('hex');

  await Session.deleteOne({ userId: req.user._id, token: tokenHash });

  res.json({ success: true, message: 'Logged out successfully.', data: { loggedOut: true } });
}));

// =========================================================================
// GET /api/v1/auth/me
// =========================================================================
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'User fetched.', data: req.user.toPublic() });
}));

// =========================================================================
// POST /api/v1/auth/forgot-password
// =========================================================================
router.post('/forgot-password', asyncHandler(async (req, res) => {
  let { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  email = email.trim().toLowerCase();

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email. Please check your email or sign up.' });
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
  user.otpPurpose = 'reset';
  await user.save();

  const mailResult = await sendOtpEmail(email, otp, 'reset');

  res.json({
    success: true,
    message: mailResult?.success === false
      ? 'Password reset code generated. If you do not see it in your inbox, check Spam/Junk folder.'
      : `Password reset code sent to ${email}. Please check your inbox or spam folder.`,
    data: { email, expiresIn: 600 },
  });
}));

// =========================================================================
// POST /api/v1/auth/reset-password
// =========================================================================
router.post('/reset-password', asyncHandler(async (req, res) => {
  let { email, otp, token, newPassword } = req.body;
  const resetCode = (otp || token || '').trim();

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, 6-digit reset code, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  email = email.trim().toLowerCase();

  const user = await User.findOne({ email }).select('+otp +otpExpires +otpPurpose');
  if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

  if (!user.otp || user.otpPurpose !== 'reset') {
    return res.status(400).json({ success: false, message: 'No password reset code was requested for this account.' });
  }
  if (new Date() > user.otpExpires) {
    return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new code.' });
  }
  if (user.otp !== resetCode) {
    return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
  }

  user.password = newPassword;
  user.isEmailVerified = true;
  user.status = 'active';
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  await user.save();

  // Revoke all existing sessions
  await Session.deleteMany({ userId: user._id });

  res.json({ success: true, message: 'Password updated successfully! You can now log in with your new password.', data: {} });
}));

module.exports = router;
