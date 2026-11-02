const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 first + set Google & Cloudflare DNS (IPv4 + IPv6) for MongoDB SRV lookup
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers([
    '8.8.8.8',             // Google Primary (IPv4)
    '8.8.4.4',             // Google Secondary (IPv4)
    '1.1.1.1',             // Cloudflare Primary (IPv4)
    '1.0.0.1',             // Cloudflare Secondary (IPv4)
    '2001:4860:4860::8888', // Google Primary (IPv6)
    '2001:4860:4860::8844', // Google Secondary (IPv6)
  ]);
} catch (e) {
  // Ignore in sandboxed runtimes
}

let lastError = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return true;
  }
  if (!process.env.MONGODB_URI) {
    lastError = 'MONGODB_URI environment variable missing';
    return false;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    lastError = null;
    return true;
  } catch (error) {
    lastError = error.message;
    console.error('❌ MongoDB Atlas connection error:', error.message);
    return false;
  }
};

connectDB.getLastError = () => lastError;

module.exports = connectDB;
