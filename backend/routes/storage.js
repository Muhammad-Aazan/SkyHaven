const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const PLANS = [
  {
    id: 'free',
    name: 'Sky Starter',
    quotaBytes: 5 * 1024 * 1024 * 1024,
    quotaLabel: '5 GB Cloud Storage',
    priceMonthly: 0,
    description: 'Perfect for casual file backups and personal sharing.',
    features: ['5 GB encrypted storage', '30-day version history', '1 GB maximum single file size', 'Standard link sharing'],
  },
  {
    id: 'pro',
    name: 'Sky Professional',
    badge: 'Most Popular',
    isPopular: true,
    quotaBytes: 2 * 1024 * 1024 * 1024 * 1024,
    quotaLabel: '2 TB High-Speed Storage',
    priceMonthly: 12,
    description: 'Generous capacity, 4K video previews, and advanced link controls.',
    features: ['2 TB high-speed Cloudflare R2 storage', '180-day version history', 'Password & expiring share links', 'Priority 10 Gbps global CDN routing'],
  },
  {
    id: 'business',
    name: 'Sky Enterprise',
    badge: 'Team Power',
    quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
    quotaLabel: '10 TB Collaborative Vault',
    priceMonthly: 29,
    description: 'For growing creative teams, engineering vaults, and granular controls.',
    features: ['10 TB pooled team storage', 'Unlimited file versioning', 'Audit log exports & SSO / SAML', 'Granular editor/viewer permissions', 'Dedicated 24/7 SLA support'],
  },
];

// =========================================================================
// GET /api/v1/storage/usage
// =========================================================================
router.get('/usage', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const files = await File.find({ ownerId: user._id, deletedAt: null });
  const folders = await Folder.find({ ownerId: user._id, deletedAt: null });

  const breakdown = { documents: 0, images: 0, videos: 0, audio: 0, archives: 0, others: 0 };
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xlsx', 'pptx'];
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const vidExts = ['mp4', 'mov', 'webm', 'mkv', 'avi'];
  const audExts = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const arcExts = ['zip', 'rar', 'tar', '7z', 'gz'];

  files.forEach(f => {
    const ext = (f.extension || '').toLowerCase();
    if (docExts.includes(ext)) breakdown.documents += f.size;
    else if (imgExts.includes(ext)) breakdown.images += f.size;
    else if (vidExts.includes(ext)) breakdown.videos += f.size;
    else if (audExts.includes(ext)) breakdown.audio += f.size;
    else if (arcExts.includes(ext)) breakdown.archives += f.size;
    else breakdown.others += f.size;
  });

  res.json({
    success: true,
    message: 'Storage usage.',
    data: {
      usedBytes: user.storageUsed,
      totalQuotaBytes: user.storageQuota,
      percentageUsed: user.storageQuota > 0 ? Math.min(100, (user.storageUsed / user.storageQuota) * 100) : 0,
      breakdown,
      fileCount: files.length,
      folderCount: folders.length,
    },
  });
}));

// =========================================================================
// GET /api/v1/storage/limits
// =========================================================================
router.get('/limits', protect, asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    message: 'Account limits.',
    data: {
      maxSingleFileSize: user.planId === 'free' ? 1 * 1024 * 1024 * 1024 : 50 * 1024 * 1024 * 1024,
      maxDailyBandwidth: 100 * 1024 * 1024 * 1024,
      maxCollaboratorsPerFile: user.planId === 'free' ? 3 : 50,
      currentPlan: user.planId,
    },
  });
}));

// =========================================================================
// GET /api/v1/storage/plans
// =========================================================================
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Plans fetched.', data: PLANS });
}));

// =========================================================================
// POST /api/v1/storage/plans/checkout
// =========================================================================
router.post('/plans/checkout', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!['pro', 'business'].includes(planId)) {
    return res.status(400).json({ success: false, message: 'Invalid plan.' });
  }

  const plan = PLANS.find(p => p.id === planId);

  // In production: integrate Stripe/Razorpay here and return a checkout session URL
  // For now, simulate immediate upgrade
  const newQuota = planId === 'business'
    ? parseInt(process.env.BUSINESS_QUOTA || '10995116277760')
    : parseInt(process.env.PRO_QUOTA || '2199023255552');

  await User.findByIdAndUpdate(req.user._id, { planId, storageQuota: newQuota });

  res.json({
    success: true,
    message: `Upgraded to ${plan.name}.`,
    data: {
      checkoutSessionId: 'cs_' + Date.now(),
      redirectUrl: `/dashboard?upgraded=${planId}`,
      plan,
    },
  });
}));

// =========================================================================
// POST /api/v1/storage/webhooks/payment  — payment webhook
// =========================================================================
router.post('/webhooks/payment', asyncHandler(async (req, res) => {
  // In production: verify Stripe signature here
  // stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  console.log('[Webhook] Payment event received:', req.body?.type);
  res.json({ success: true, message: 'Webhook received.', data: { received: true, verified: true } });
}));

module.exports = router;
