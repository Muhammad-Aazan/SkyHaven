// Skyhaven Cloud Storage - Complete Type System (APIs 1-75)

export type UserRole = 'user' | 'admin' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  planId: 'free' | 'pro' | 'business';
  storageQuota: number; // in bytes
  storageUsed: number;  // in bytes
  isOnboarded?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface StoragePlan {
  id: 'free' | 'pro' | 'business';
  name: string;
  badge?: string;
  quotaBytes: number;
  quotaLabel: string;
  priceMonthly: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface StorageUsageBreakdown {
  documents: number;
  images: number;
  videos: number;
  audio: number;
  archives: number;
  others: number;
}

export interface StorageStats {
  usedBytes: number;
  totalQuotaBytes: number;
  percentageUsed: number;
  breakdown: StorageUsageBreakdown;
  fileCount: number;
  folderCount: number;
}

export interface FileVersion {
  id: string;
  versionNumber: number;
  size: number;
  checksum: string;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl?: string;
}

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  storageKey: string;
  parentFolderId: string | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  starred: boolean;
  isShared: boolean;
  shareCount: number;
  versions: FileVersion[];
  currentVersion: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null; // null if active, ISO date if in trash
}

export interface FolderItem {
  id: string;
  name: string;
  parentFolderId: string | null;
  ownerId: string;
  ownerName: string;
  starred: boolean;
  color?: string; // hex color for folder badge
  itemCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ShareItem {
  id: string;
  targetId: string; // fileId or folderId
  targetType: 'file' | 'folder';
  targetName: string;
  ownerId: string;
  ownerName: string;
  recipientEmail?: string;
  role: 'viewer' | 'editor';
  shareToken: string;
  isPublic: boolean;
  isPasswordProtected: boolean;
  password?: string;
  expiresAt?: string | null;
  createdAt: string;
  viewsCount: number;
  downloadsCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'share' | 'upload' | 'security' | 'storage' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ActivityItem {
  id: string;
  action: 'upload' | 'download' | 'share' | 'rename' | 'move' | 'delete' | 'restore' | 'permanent_delete' | 'version_add';
  targetType: 'file' | 'folder';
  targetName: string;
  user: string;
  timestamp: string;
  ip?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  parentFolderId: string | null;
  progress: number; // 0 - 100
  speed: string;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  planId: string;
  storageUsed: number;
  storageQuota: number;
  filesCount: number;
  lastLogin: string;
  createdAt: string;
}

export interface SecurityReport {
  id: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userEmail: string;
  ip: string;
  timestamp: string;
  resolved: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}
