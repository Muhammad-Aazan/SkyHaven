require('dotenv').config();

// ─── DNS Fix: Force IPv4 + use Google & Cloudflare DNS servers (IPv4 + IPv6) ───────────
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first'); // prefer IPv4 over IPv6
  dns.setServers([
    '8.8.8.8',             // Google Primary   (IPv4)
    '8.8.4.4',             // Google Secondary (IPv4)
    '1.1.1.1',             // Cloudflare Primary   (IPv4)
    '1.0.0.1',             // Cloudflare Secondary (IPv4)
    '2001:4860:4860::8888', // Google Primary   (IPv6)
    '2001:4860:4860::8844', // Google Secondary (IPv6)
  ]);
} catch (e) {
  console.warn('DNS server override warning:', e.message);
}
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error');

// Route imports
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const filesRoutes = require('./routes/files');
const foldersRoutes = require('./routes/folders');
const searchRoutes = require('./routes/search');
const trashRoutes = require('./routes/trash');
const storageRoutes = require('./routes/storage');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();

// ─── Connect Database ─────────────────────────────────────────────────────
connectDB();
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    await connectDB();
  }
  next();
});

// ─── Security Middleware ──────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser ───────────────────────────────────────────────────────────
// Stripe webhooks need raw body — must come before express.json()
app.use('/api/v1/storage/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 50,                  // 50 requests per minute (relaxed for testing)
  message: { success: false, message: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  message: { success: false, message: 'Rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', globalLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/files', filesRoutes);
app.use('/api/v1/folders', foldersRoutes);

// Search, starred, recent, dashboard, shares, public share
app.use('/api/v1', searchRoutes);

app.use('/api/v1/trash', trashRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1', notificationsRoutes); // exposes /api/v1/activity

// ─── Health check (public) ──────────────────────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (_) {}
  }
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DEGRADED';
  const err = connectDB.getLastError ? connectDB.getLastError() : null;
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime().toFixed(2) + 's',
      timestamp: new Date().toISOString(),
      services: {
        apiServer: 'UP (Node.js ' + process.version + ')',
        database: dbStatus + ' (MongoDB)' + (err ? ` [${err}]` : ''),
        storageEngine: 'UP (Cloudflare R2 S3)',
      },
    },
  });
});

// Admin routes (require auth + admin role)
app.use('/api/v1/admin', adminRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.all('*path', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
// On Vercel (serverless), export app directly — no app.listen needed.
// Locally we start the server as usual.
if (process.env.VERCEL !== '1') {
  const PORT = parseInt(process.env.PORT || '5000');
  app.listen(PORT, () => {
    console.log(`\n🚀 SkyHeaven API running on http://localhost:${PORT}`);
    console.log(`   ├─ Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ├─ API Base    : http://localhost:${PORT}/api/v1`);
    console.log(`   └─ Health      : http://localhost:${PORT}/api/v1/health\n`);
  });
}

module.exports = app;
