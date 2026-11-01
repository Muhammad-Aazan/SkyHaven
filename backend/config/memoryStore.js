// In-memory Mock Data Store for fallback mode when MongoDB is offline
const crypto = require('crypto');

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.folders = new Map();
    this.shares = new Map();
    this.notifications = new Map();
    this.activities = [];
    this.sessions = new Map();

    this.seed();
  }

  seed() {
    const defaultUser = {
      _id: 'usr_basic_01',
      id: 'usr_basic_01',
      name: 'Sky Member',
      email: 'member@skyhaven.io',
      password: 'password123',
      avatar: null,
      role: 'user',
      isEmailVerified: true,
      planId: 'free',
      storageQuota: 5 * 1024 * 1024 * 1024,
      storageUsed: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }
}

module.exports = new MemoryStore();
