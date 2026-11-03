// SkyHeaven API Client — Real backend only, no mock fallback
import {
  User, UserSession, StoragePlan, StorageStats, FileItem,
  FolderItem, ShareItem, NotificationItem, ActivityItem,
  AdminUserRecord, SecurityReport, ApiResponse, FileVersion
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('onrender'))
  ? import.meta.env.VITE_API_URL
  : '/api/v1';

// Low-level fetch wrapper — no mock, real errors propagate
async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('skyhaven_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.ok) {
    const json = await res.json() as ApiResponse<T>;
    // Auto-persist JWT token returned by backend
    if ((json?.data as any)?.token && typeof (json.data as any).token === 'string') {
      localStorage.setItem('skyhaven_token', (json.data as any).token);
    }
    return json;
  }

  // Non-2xx: parse real error message from backend and throw
  const err = await res.json().catch(() => ({ message: res.statusText }));
  const apiError = new Error(err.message || 'API request failed');
  (apiError as any).status = res.status;
  (apiError as any).alreadyExists = err.alreadyExists;
  (apiError as any).data = err.data;
  throw apiError;
}

// =========================================================================
// GROUP A: Authentication & Email OTP — 10 APIs
// =========================================================================
export const authApi = {
  // 1. POST /signup
  async signup(data: { name: string; email: string; password: string }) {
    return apiRequest('/auth/signup', 'POST', data);
  },

  // 2. POST /send-otp
  async sendOtp(email: string) {
    return apiRequest('/auth/send-otp', 'POST', { email });
  },

  // 3. POST /verify-otp
  async verifyOtp(email: string, otp: string) {
    return apiRequest('/auth/verify-otp', 'POST', { email, otp });
  },

  // 4. POST /resend-otp
  async resendOtp(email: string) {
    return apiRequest('/auth/resend-otp', 'POST', { email });
  },

  // 5. POST /complete-signup
  async completeSignup(data: { name: string; email: string; verificationToken: string }) {
    return apiRequest('/auth/complete-signup', 'POST', data);
  },

  // 6. POST /login
  async login(credentials: { email: string; password: string }) {
    return apiRequest('/auth/login', 'POST', credentials);
  },

  // 7. POST /logout
  async logout() {
    try {
      await apiRequest('/auth/logout', 'POST', {});
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('skyhaven_token');
    return { success: true, data: { loggedOut: true } };
  },

  // 8. GET /me
  async getMe() {
    return apiRequest('/auth/me', 'GET');
  },

  // 9. POST /forgot-password
  async forgotPassword(email: string) {
    return apiRequest('/auth/forgot-password', 'POST', { email });
  },

  // 10. POST /reset-password
  async resetPassword(data: { email: string; otp?: string; token?: string; newPassword: string }) {
    return apiRequest('/auth/reset-password', 'POST', data);
  }
};

// =========================================================================
// GROUP B: User Profile & Settings — 8 APIs
// =========================================================================
export const usersApi = {
  // 11. GET /me (Profile fetch)
  async getProfile() {
    return apiRequest('/users/me', 'GET');
  },

  // 12. PATCH /me (Update name & profile)
  async updateProfile(updates: Partial<Pick<User, 'name' | 'avatar' | 'isOnboarded'>>) {
    return apiRequest('/users/me', 'PATCH', updates);
  },

  // 13. PATCH /me/avatar (Profile picture update)
  async updateAvatar(avatarUrl: string) {
    return apiRequest('/users/me/avatar', 'PATCH', { avatar: avatarUrl });
  },

  // 14. PATCH /me/email (Email change request)
  async requestEmailChange(newEmail: string) {
    return apiRequest('/users/me/email', 'PATCH', { newEmail });
  },

  // 15. POST /me/email/verify (New email verify)
  async verifyNewEmail(otp: string) {
    return apiRequest('/users/me/email/verify', 'POST', { otp });
  },

  // 16. PATCH /me/password (Password change)
  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    return apiRequest('/users/me/password', 'PATCH', passwords);
  },

  // 17. GET /me/sessions (Active sessions list)
  async getSessions() {
    return apiRequest('/users/me/sessions', 'GET');
  },

  // 18. DELETE /me/sessions/:sessionId (Revoke session)
  async revokeSession(sessionId: string) {
    return apiRequest(`/users/me/sessions/${sessionId}`, 'DELETE');
  }
};

// =========================================================================
// GROUP C: Files & Uploads — 13 APIs
// =========================================================================
export const filesApi = {
  // 19. GET / (User files list)
  async getFiles(parentFolderId: string | null = null) {
    return apiRequest(`/files?folder=${parentFolderId || 'root'}`, 'GET');
  },

  // 20. POST /upload (Direct Cascading Multi-tier Upload)
  async uploadFile(file: File, parentFolderId?: string | null): Promise<ApiResponse<FileItem>> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentFolderId && parentFolderId !== 'root') {
      formData.append('parentFolderId', parentFolderId);
    }

    const token = localStorage.getItem('skyhaven_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  },

  // 20b. POST /upload/initiate
  async initiateUpload(meta: { name: string; size: number; mimeType: string; parentFolderId?: string | null }) {
    return apiRequest('/files/upload/initiate', 'POST', meta);
  },

  // 21. POST /upload/complete
  async completeUpload(data: {
    fileId: string;
    name: string;
    size: number;
    mimeType: string;
    parentFolderId?: string | null;
    storageKey: string;
    previewUrl?: string;
  }) {
    return apiRequest('/files/upload/complete', 'POST', data);
  },

  // 22. GET /:fileId (File details)
  async getFileDetails(fileId: string) {
    return apiRequest(`/files/${fileId}`, 'GET');
  },

  // 23. PATCH /:fileId (Rename file / metadata)
  async renameFile(fileId: string, newName: string) {
    return apiRequest(`/files/${fileId}`, 'PATCH', { name: newName });
  },

  // 24. DELETE /:fileId (Send file to trash)
  async trashFile(fileId: string) {
    return apiRequest(`/files/${fileId}`, 'DELETE');
  },

  // 25. GET /:fileId/download
  async getDownloadUrl(fileId: string) {
    return apiRequest(`/files/${fileId}/download`, 'GET');
  },

  // 26. GET /:fileId/preview
  async getPreviewUrl(fileId: string) {
    return apiRequest(`/files/${fileId}/preview`, 'GET');
  },

  // 27. GET /:fileId/versions
  async getVersions(fileId: string) {
    return apiRequest(`/files/${fileId}/versions`, 'GET');
  },

  // 28. POST /:fileId/versions
  async initiateNewVersion(fileId: string, size: number) {
    return apiRequest(`/files/${fileId}/versions`, 'POST', { size });
  },

  // 29. POST /:fileId/versions/complete
  async completeNewVersion(fileId: string, versionData: Partial<FileVersion>) {
    return apiRequest(`/files/${fileId}/versions/complete`, 'POST', versionData);
  },

  // 30. POST /:fileId/copy
  async copyFile(fileId: string, targetFolderId: string | null = null) {
    return apiRequest(`/files/${fileId}/copy`, 'POST', { targetFolderId });
  },

  // 31. POST /:fileId/move
  async moveFile(fileId: string, targetFolderId: string | null) {
    return apiRequest(`/files/${fileId}/move`, 'POST', { targetFolderId });
  }
};

// =========================================================================
// GROUP D: Folders — 7 APIs
// =========================================================================
export const foldersApi = {
  // 32. POST / (Folder create)
  async createFolder(name: string, parentFolderId: string | null = null, color: string = '#0061FE') {
    return apiRequest('/folders', 'POST', { name, parentFolderId, color });
  },

  // 33. GET / (Folders list)
  async getFolders(parentFolderId: string | null = null) {
    return apiRequest(`/folders?parent=${parentFolderId || 'root'}`, 'GET');
  },

  // 34. GET /:folderId
  async getFolderDetails(folderId: string) {
    return apiRequest(`/folders/${folderId}`, 'GET');
  },

  // 35. PATCH /:folderId (Rename)
  async renameFolder(folderId: string, name: string) {
    return apiRequest(`/folders/${folderId}`, 'PATCH', { name });
  },

  // 36. DELETE /:folderId (Trash folder)
  async trashFolder(folderId: string) {
    return apiRequest(`/folders/${folderId}`, 'DELETE');
  },

  // 37. POST /:folderId/move
  async moveFolder(folderId: string, targetFolderId: string | null) {
    return apiRequest(`/folders/${folderId}/move`, 'POST', { targetFolderId });
  },

  // 38. GET /:folderId/contents
  async getFolderContents(folderId: string) {
    return apiRequest(`/folders/${folderId}/contents`, 'GET');
  }
};

// =========================================================================
// GROUP E: Search & Organization — 6 APIs
// =========================================================================
export const searchApi = {
  // 39. GET /search
  async search(query: string, filterType?: string) {
    return apiRequest(`/search?q=${encodeURIComponent(query)}&type=${filterType || ''}`, 'GET');
  },

  // 40. GET /recent
  async getRecent() {
    return apiRequest('/recent', 'GET');
  },

  // 41. GET /starred
  async getStarred() {
    return apiRequest('/starred', 'GET');
  },

  // 42. PATCH /files/:fileId/star
  async toggleFileStar(fileId: string) {
    return apiRequest(`/files/${fileId}/star`, 'PATCH');
  },

  // 43. PATCH /folders/:folderId/star
  async toggleFolderStar(folderId: string) {
    return apiRequest(`/folders/${folderId}/star`, 'PATCH');
  },

  // 44. GET /dashboard/summary
  async getDashboardSummary() {
    return apiRequest('/dashboard/summary', 'GET');
  }
};

// =========================================================================
// GROUP F: Sharing & Permissions — 9 APIs
// =========================================================================
export const sharesApi = {
  // 45. POST / (Share create)
  async createShare(data: {
    targetId: string;
    targetType: 'file' | 'folder';
    recipientEmail?: string;
    role: 'viewer' | 'editor';
    isPublic?: boolean;
    password?: string;
    expiresInDays?: number;
  }) {
    return apiRequest('/shares', 'POST', data);
  },

  // 46. GET / (Sent shares)
  async getSentShares() {
    return apiRequest('/shares', 'GET');
  },

  // 47. GET /with-me
  async getSharedWithMe() {
    return apiRequest('/shares/with-me', 'GET');
  },

  // 48. GET /:shareId
  async getShareDetails(shareId: string) {
    return apiRequest(`/shares/${shareId}`, 'GET');
  },

  // 49. PATCH /:shareId
  async updateSharePermission(shareId: string, role: 'viewer' | 'editor') {
    return apiRequest(`/shares/${shareId}`, 'PATCH', { role });
  },

  // 50. DELETE /:shareId
  async revokeShare(shareId: string) {
    return apiRequest(`/shares/${shareId}`, 'DELETE');
  },

  // 51. POST /:shareId/link
  async createShareableLink(targetId: string, targetType: 'file' | 'folder') {
    return apiRequest(`/shares/${targetId}/link`, 'POST', { targetType });
  },

  // 52. PATCH /:shareId/link
  async updateLinkSettings(shareId: string, updates: { password?: string; expiresAt?: string | null }) {
    return apiRequest(`/shares/${shareId}/link`, 'PATCH', updates);
  },

  // 53. POST /:shareId/accept
  async acceptInvitation(shareId: string) {
    return apiRequest(`/shares/${shareId}/accept`, 'POST', {});
  }
};

// =========================================================================
// Public Share API (Unauthenticated / Public Token Access)
// =========================================================================
export const publicShareApi = {
  async getPublicShare(shareToken: string) {
    return apiRequest(`/public/share/${shareToken}`, 'GET');
  },

  async unlockPublicShare(shareToken: string, password: string) {
    return apiRequest(`/public/share/${shareToken}/unlock`, 'POST', { password });
  },

  async recordDownload(shareToken: string) {
    return apiRequest(`/public/share/${shareToken}/download`, 'POST', {});
  }
};

// =========================================================================
// GROUP G: Trash & Recovery — 5 APIs
// =========================================================================
export const trashApi = {
  // 54. GET / (Trash items list)
  async getTrashItems() {
    return apiRequest('/trash', 'GET');
  },

  // 55. POST /:itemId/restore
  async restoreItem(itemId: string, itemType: 'file' | 'folder') {
    return apiRequest(`/trash/${itemId}/restore`, 'POST', { itemType });
  },

  // 56. DELETE /:itemId (Permanently delete one)
  async permanentlyDeleteItem(itemId: string, itemType: 'file' | 'folder') {
    return apiRequest(`/trash/${itemId}`, 'DELETE', { itemType });
  },

  // 57. DELETE / (Empty trash)
  async emptyTrash() {
    return apiRequest('/trash', 'DELETE');
  },

  // 58. GET /:itemId (Deleted item details)
  async getDeletedItemDetails(itemId: string) {
    return apiRequest(`/trash/${itemId}`, 'GET');
  }
};

// =========================================================================
// GROUP H: Storage & Plans — 5 APIs
// =========================================================================
export const storageApi = {
  // 59. GET /usage
  async getUsage(): Promise<ApiResponse<StorageStats>> {
    return apiRequest('/storage/usage', 'GET');
  },

  // 60. GET /limits
  async getLimits() {
    return apiRequest('/storage/limits', 'GET');
  },

  // 61. GET /plans
  async getPlans() {
    return apiRequest('/storage/plans', 'GET');
  },

  // 62. POST /plans/checkout
  async startCheckout(planId: 'pro' | 'business') {
    return apiRequest('/storage/plans/checkout', 'POST', { planId });
  },

  // 63. POST /webhooks/payment
  async processPaymentWebhook(payload: any) {
    return apiRequest('/storage/webhooks/payment', 'POST', payload);
  }
};

// =========================================================================
// GROUP I: Notifications & Activity — 5 APIs
// =========================================================================
export const notificationsApi = {
  // 64. GET /notifications
  async getNotifications() {
    return apiRequest('/notifications', 'GET');
  },

  // 65. PATCH /notifications/:id/read
  async markAsRead(id: string) {
    return apiRequest(`/notifications/${id}/read`, 'PATCH');
  },

  // 66. PATCH /notifications/read-all
  async markAllAsRead() {
    return apiRequest('/notifications/read-all', 'PATCH');
  },

  // 67. GET /activity
  async getActivity() {
    return apiRequest('/activity', 'GET');
  },

  // 68. POST /notifications/preferences
  async savePreferences(prefs: { emailAlerts: boolean; securityAlerts: boolean; weeklyDigest: boolean }) {
    return apiRequest('/notifications/preferences', 'POST', prefs);
  }
};

// =========================================================================
// GROUP J: Admin, Health & Security — 7 APIs
// =========================================================================
export const adminApi = {
  // 69. GET /health
  async getHealth() {
    return apiRequest('/health', 'GET');
  },

  // 70. GET /admin/users
  async getUsers(): Promise<ApiResponse<AdminUserRecord[]>> {
    return apiRequest('/admin/users', 'GET');
  },

  // 71. GET /admin/users/:userId
  async getUserDetails(userId: string) {
    return apiRequest(`/admin/users/${userId}`, 'GET');
  },

  // 72. PATCH /admin/users/:userId/status
  async toggleUserStatus(userId: string, status: 'active' | 'suspended') {
    return apiRequest(`/admin/users/${userId}/status`, 'PATCH', { status });
  },

  // 73. GET /admin/reports/storage
  async getStorageReports() {
    return apiRequest('/admin/reports/storage', 'GET');
  },

  // 74. GET /admin/reports/security
  async getSecurityReports(): Promise<ApiResponse<SecurityReport[]>> {
    return apiRequest('/admin/reports/security', 'GET');
  },

  // 75. POST /admin/users/:userId/revoke-sessions
  async revokeAllUserSessions(userId: string) {
    return apiRequest(`/admin/users/${userId}/revoke-sessions`, 'POST', {});
  }
};
