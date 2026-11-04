const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin', 'enterprise'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    planId: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
    storageQuota: { type: Number, default: 25 * 1024 * 1024 * 1024 }, // 25 GB Basic
    storageUsed: { type: Number, default: 0 },
    isOnboarded: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },

    // OTP fields
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpPurpose: { type: String, select: false },
    pendingEmail: { type: String, select: false },

    // Password reset token
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },

    // Misc
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password with hash
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Serialize (strip sensitive fields for API response)
userSchema.methods.toPublic = function () {
  return {
    id: this._id || this.id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    planId: this.planId,
    storageQuota: Math.max(this.storageQuota || 0, 25 * 1024 * 1024 * 1024),
    storageUsed: this.storageUsed,
    isOnboarded: this.isOnboarded ?? false,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
