# SkyHeaven Backend API 🚀

SkyHeaven Cloud Storage ka complete backend Node.js, Express, MongoDB (Mongoose), JWT, aur Cloudflare R2 (S3-compatible) storage ke saath taiyar hai.

---

## 📁 Architecture Overview

```
SkyHeaven/
├── backend/
│   ├── config/
│   │   ├── db.js             # MongoDB connection logic (Graceful fallback)
│   │   ├── mailer.js         # Nodemailer OTP email dispatch (HTML template & dev logging)
│   │   └── storage.js        # AWS S3 / Cloudflare R2 presigned URLs & object operations
│   ├── middleware/
│   │   ├── auth.js           # JWT verification & role authorization (adminOnly)
│   │   └── error.js          # Centralized error handler & asyncHandler wrapper
│   ├── models/
│   │   ├── User.js           # Users, credentials, OTP, roles, plans, storage usage
│   │   ├── File.js           # Files metadata, versions history, trash, star, shares
│   │   ├── Folder.js         # Nested folder hierarchy, color coding, star
│   │   ├── Share.js          # Share tokens, password-protected & expiring links
│   │   ├── Notification.js   # User alerts & notifications
│   │   ├── Activity.js       # Audit trail & logs
│   │   └── Session.js        # Active sessions & device tracking
│   ├── routes/
│   │   ├── auth.js           # APIs 1-10 (Signup, OTP, Login, Logout, Reset)
│   │   ├── users.js          # APIs 11-18 (Profile, Avatar, Email change, Sessions)
│   │   ├── files.js          # APIs 19-31 (Upload initiate/complete, Versions, Move, Copy, Trash)
│   │   ├── folders.js        # APIs 32-38 (CRUD, Nesting, Recursive trash, Move)
│   │   ├── search.js         # APIs 39-53 (Search, Recent, Starred, Shares, Public link)
│   │   ├── trash.js          # APIs 54-58 (Trash list, Restore, Permanent delete, Empty)
│   │   ├── storage.js        # APIs 59-63 (Storage usage breakdown, Plans, Checkout)
│   │   ├── notifications.js  # APIs 64-68 (Notifications, Activity, Preferences)
│   │   └── admin.js          # APIs 69-75 (Admin users, Reports, Health, Session revocation)
│   ├── .env                  # Local dev config
│   ├── .env.example          # Environment variables template
│   ├── server.js             # Main server entry point (CORS, Rate Limiting, Helmet)
│   └── package.json
```

---

## 🛠️ Kaise Run Karein (How to Run)

### 1. Backend Start Karein:
```powershell
cd c:\Users\progr\Desktop\SkyHeaven\backend
npm run dev
# ya
node server.js
```
Server start ho jayega: **`http://localhost:5000`**

### 2. Frontend Start Karein:
```powershell
cd c:\Users\progr\Desktop\SkyHeaven
npm run dev
```
Frontend environment variable (`.env` file) already backend se mapped hai:
```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## ⚡ Supported Endpoints (Groups A to J - 75 Endpoints)

| Group | Functionality | Key Routes |
|---|---|---|
| **A: Auth** | Email OTP, Signup, Login, Password Reset | `/api/v1/auth/*` |
| **B: Users** | Profile, Avatar, Email change, Device Sessions | `/api/v1/users/*` |
| **C: Files** | Direct S3 Upload (Presigned URL), Versions, Copy, Move | `/api/v1/files/*` |
| **D: Folders** | Create, Hierarchy, Color, Recursive Delete | `/api/v1/folders/*` |
| **E: Search & Org** | Full search, Starred items, Recent files, Dashboard stats | `/api/v1/search`, `/api/v1/starred`, `/api/v1/recent` |
| **F: Sharing** | Public/Private links, Password protection, Expiry | `/api/v1/shares/*`, `/api/v1/public/share/:token` |
| **G: Trash** | Soft-delete, Restore, Permanent wipe & R2 cleanup | `/api/v1/trash/*` |
| **H: Storage Plans**| Quota tracker, Category breakdown, Plan upgrade | `/api/v1/storage/*` |
| **I: Notifications**| Activity logs, Realtime alerts, Notification preferences | `/api/v1/notifications/*`, `/api/v1/activity` |
| **J: Admin & Health**| System health, User management, Quota metrics, Security logs | `/api/v1/health`, `/api/v1/admin/*` |

---

## 🔑 Production Setup Tips

1. **MongoDB**: Local MongoDB install karein ya **MongoDB Atlas** ka connection string `.env` me dalein:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skyhaven
   ```
2. **Cloudflare R2**: Cloudflare dashboard se R2 bucket create karke credentials `.env` me configure karein:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=your_bucket_name
   ```
3. **Nodemailer**: Real OTP emails bhejne ke liye Gmail App Password ya SendGrid SMTP credentials dalein.
