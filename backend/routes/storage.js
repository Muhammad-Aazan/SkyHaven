const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

const PLANS = [
  {
    id: 'free',
    name: 'Sky Starter',
    quotaBytes: 25 * 1024 * 1024 * 1024,
    quotaLabel: '25 GB Total Free Storage',
    priceMonthly: 0,
    description: 'Generous 25 GB total capacity for every user. Free forever with zero egress fees.',
    features: [
      '25 GB total high-speed encrypted storage',
      '30-day version history',
      '5 GB maximum single file size',
      'Standard secure link sharing',
      'Zero credit card required'
    ],
  },
  {
    id: 'pro',
    name: 'Sky Professional',
    badge: 'Most Popular',
    isPopular: true,
    quotaBytes: 2 * 1024 * 1024 * 1024 * 1024,
    quotaLabel: '2 TB High-Speed Storage',
    priceMonthly: 12,
    description: 'Generous 2 TB capacity, 4K streaming previews, and advanced link controls.',
    features: [
      '2 TB high-speed Cloudflare R2 storage',
      '180-day version history',
      'Password & expiring share links',
      'Priority 10 Gbps global CDN routing',
      'Custom branding on shared links'
    ],
  },
  {
    id: 'business',
    name: 'Sky Enterprise',
    badge: 'Team Power',
    quotaBytes: 10 * 1024 * 1024 * 1024 * 1024,
    quotaLabel: '10 TB Collaborative Vault',
    priceMonthly: 29,
    description: 'For growing creative teams, engineering vaults, and granular controls.',
    features: [
      '10 TB pooled team storage',
      'Unlimited file versioning',
      'Audit log exports & SSO / SAML',
      'Granular editor/viewer permissions',
      'Dedicated 24/7 SLA support'
    ],
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

  const effectiveQuota = Math.max(user.storageQuota || 0, 25 * 1024 * 1024 * 1024);

  res.json({
    success: true,
    message: 'Storage usage.',
    data: {
      usedBytes: user.storageUsed,
      totalQuotaBytes: effectiveQuota,
      percentageUsed: effectiveQuota > 0 ? Math.min(100, (user.storageUsed / effectiveQuota) * 100) : 0,
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
// POST /api/v1/storage/plans/checkout (Stripe Checkout + Free Plan Downgrade)
// =========================================================================
router.post('/plans/checkout', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!['free', 'pro', 'business'].includes(planId)) {
    return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
  }

  const plan = PLANS.find(p => p.id === planId);
  const user = await User.findById(req.user._id);

  // 1. FREE PLAN: Switch / Downgrade directly
  if (planId === 'free') {
    const freeQuota = 25 * 1024 * 1024 * 1024; // 25 GB
    if (user.storageUsed > freeQuota) {
      return res.status(400).json({
        success: false,
        message: `Cannot switch to Starter: Your used storage (${(user.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB) exceeds the 25 GB limit. Please delete some files first.`,
      });
    }

    user.planId = 'free';
    user.storageQuota = freeQuota;
    await user.save();

    return res.json({
      success: true,
      message: 'Successfully switched to Sky Starter (25 GB Total Free Storage).',
      data: {
        plan,
        upgraded: false,
        user: user.toPublic(),
      },
    });
  }

  // 2. PAID PLANS (pro, business): Use Stripe if configured
  const stripeKey = STRIPE_SECRET;
  if (stripeKey) {
    try {
      const stripe = require('stripe')(stripeKey);
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || process.env.FRONTEND_URL || 'https://skyhaven-vert.vercel.app';

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: `${plan.quotaLabel} — SkyHeaven Cloud Storage Vault`,
              },
              unit_amount: plan.priceMonthly * 100, // in cents
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard?upgraded=${planId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?modal=plans`,
        client_reference_id: req.user._id.toString(),
        customer_email: req.user.email,
        metadata: {
          userId: req.user._id.toString(),
          planId: planId,
        },
      });

      return res.json({
        success: true,
        message: `Stripe checkout session initialized for ${plan.name}.`,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
          plan,
        },
      });
    } catch (stripeErr) {
      console.warn('⚠️ Stripe error, falling back to instant activation:', stripeErr.message);
    }
  }

  // 3. Fallback / Test activation if Stripe key is not provided in env
  const newQuota = planId === 'business'
    ? parseInt(process.env.BUSINESS_QUOTA || '10995116277760')
    : parseInt(process.env.PRO_QUOTA || '2199023255552');

  user.planId = planId;
  user.storageQuota = newQuota;
  await user.save();

  res.json({
    success: true,
    message: `Upgraded to ${plan.name}!`,
    data: {
      checkoutSessionId: 'cs_' + Date.now(),
      redirectUrl: `/dashboard?upgraded=${planId}`,
      plan,
      user: user.toPublic(),
    },
  });
}));

// =========================================================================
// POST /api/v1/storage/plans/verify-session  — Verify Stripe Checkout Session
// =========================================================================
router.post('/plans/verify-session', protect, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required' });
  }

  const stripeKey = STRIPE_SECRET;
  if (!stripeKey) {
    return res.status(500).json({ success: false, message: 'Stripe is not configured' });
  }

  try {
    const stripe = require('stripe')(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Checkout session not found' });
    }

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const planId = session.metadata?.planId || 'pro';
      const newQuota = planId === 'business'
        ? parseInt(process.env.BUSINESS_QUOTA || '10995116277760')
        : parseInt(process.env.PRO_QUOTA || '2199023255552');

      const user = await User.findById(req.user._id);
      if (user) {
        user.planId = planId;
        user.storageQuota = newQuota;
        await user.save();
      }

      return res.json({
        success: true,
        message: `Plan upgraded successfully to ${planId.toUpperCase()}!`,
        data: {
          user: user ? user.toPublic() : req.user,
          planId,
        },
      });
    }

    return res.json({
      success: false,
      message: `Payment status: ${session.payment_status}`,
    });
  } catch (err) {
    console.error('❌ [Stripe Verify Session Error]:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}));

// =========================================================================
// POST /api/v1/storage/webhooks/payment  — Stripe Webhook
// =========================================================================
router.post('/webhooks/payment', asyncHandler(async (req, res) => {
  const stripeKey = STRIPE_SECRET;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;

  if (stripeKey && webhookSecret && req.headers['stripe-signature']) {
    try {
      const stripe = require('stripe')(stripeKey);
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
    } catch (err) {
      console.error('❌ [Stripe Webhook Error]:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle successful checkout subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && planId) {
      const newQuota = planId === 'business'
        ? parseInt(process.env.BUSINESS_QUOTA || '10995116277760')
        : parseInt(process.env.PRO_QUOTA || '2199023255552');

      await User.findByIdAndUpdate(userId, { planId, storageQuota: newQuota });
      console.log(`✅ [Stripe Webhook] User ${userId} upgraded to ${planId}`);
    }
  }

  res.json({ success: true, received: true });
}));

module.exports = router;
