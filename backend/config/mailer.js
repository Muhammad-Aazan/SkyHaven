const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const port = parseInt(process.env.SMTP_PORT || '465');
  const isSecure = port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
};

/**
 * Send a File/Folder Share Invitation email
 */
const sendShareInvitationEmail = async ({
  to,
  senderName,
  senderEmail,
  targetName,
  targetType = 'file',
  shareUrl,
  role = 'viewer',
  isPasswordProtected = false,
  expiresAt = null,
}) => {
  const roleLabel = role === 'editor' ? 'Editor (Can Edit & Manage)' : 'Viewer (Can View & Download)';
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #131b2e; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0061FE 0%, #3B82F6 50%, #8B5CF6 100%); padding: 36px 32px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500; }
        .body { padding: 32px; }
        .intro { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
        .card { background: #0b1120; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .file-name { font-size: 16px; font-weight: 700; color: #f8fafc; word-break: break-all; }
        .file-meta { font-size: 12px; color: #64748b; margin-top: 6px; }
        .meta-row { display: flex; justify-content: space-between; font-size: 12px; padding: 8px 0; border-top: 1px solid #1e293b; }
        .meta-label { color: #64748b; }
        .meta-value { color: #cbd5e1; font-weight: 600; }
        .btn-container { text-align: center; margin: 28px 0 20px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); }
        .direct-link { font-size: 11px; color: #64748b; word-break: break-all; text-align: center; line-height: 1.5; margin-top: 16px; }
        .direct-link a { color: #60a5fa; text-decoration: none; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; border-radius: 8px; padding: 10px 14px; font-size: 12px; margin-top: 16px; }
        .footer { border-top: 1px solid #1e293b; padding: 20px 32px; color: #64748b; font-size: 11px; text-align: center; line-height: 1.5; }
        .brand { font-weight: 700; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>☁ SkyHeaven</h1>
          <p>Shared ${targetType === 'file' ? 'File' : 'Folder'}</p>
        </div>
        <div class="body">
          <p class="intro">
            <strong style="color: #f1f5f9;">${senderName}</strong> (${senderEmail}) shared a ${targetType} with you on <strong>SkyHeaven</strong>.
          </p>
          <div class="card">
            <div class="file-name">📄 ${targetName}</div>
            <div class="file-meta">Shared with permissions: <strong>${roleLabel}</strong></div>
            ${formattedExpiry ? `
            <div class="meta-row" style="margin-top: 12px;">
              <span class="meta-label">Access Expires:</span>
              <span class="meta-value">${formattedExpiry}</span>
            </div>` : ''}
            ${isPasswordProtected ? `
            <div class="badge-warning">
              🔒 <strong>Password Protected:</strong> This item requires a passphrase set by the sender to unlock and download.
            </div>` : ''}
          </div>
          <div class="btn-container">
            <a href="${shareUrl}" class="btn">View & Download ${targetType === 'file' ? 'File' : 'Folder'}</a>
          </div>
          <p class="direct-link">
            Or paste this link into your browser:<br>
            <a href="${shareUrl}">${shareUrl}</a>
          </p>
        </div>
        <div class="footer">
          <span class="brand">SkyHeaven Cloud Storage</span><br>
          Cascading Multi-Tier Cloud Vault (ImageKit • Cloudinary • Supabase)<br>
          © ${new Date().getFullYear()} SkyHeaven Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const sender = process.env.SMTP_FROM || `"SkyHeaven" <${process.env.SMTP_USER}>`;

  try {
    const info = await getTransporter().sendMail({
      from: sender,
      to,
      subject: `${senderName} shared "${targetName}" with you on SkyHeaven`,
      text: `${senderName} (${senderEmail}) shared a ${targetType} "${targetName}" with you on SkyHeaven. Access it here: ${shareUrl}`,
      html,
    });
    console.log(`✅ [SHARE EMAIL SENT] Successfully delivered invitation to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [SHARE EMAIL FAILED] SMTP error delivering to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send an OTP email
 */
const sendOtpEmail = async (to, otp, type = 'verify') => {
  const subjects = {
    verify: `${otp} is your SkyHeaven verification code`,
    reset: `${otp} is your SkyHeaven password reset code`,
    email_change: `${otp} is your SkyHeaven email change code`,
  };

  const titles = {
    verify: 'Email Verification',
    reset: 'Password Reset',
    email_change: 'Confirm New Email',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 480px; margin: 0 auto; background: #131b2e; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0061FE 0%, #3B82F6 50%, #8B5CF6 100%); padding: 36px 32px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; }
        .body { padding: 36px 32px; }
        .body p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 18px; }
        .otp-box { background: #0b1120; border: 1.5px solid #2563eb; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 14px; color: #60a5fa; font-family: 'SF Mono', Consolas, Monaco, monospace; text-indent: 14px; }
        .expire { color: #f59e0b; font-size: 12px; font-weight: 600; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .footer { border-top: 1px solid #1e293b; padding: 20px 32px; color: #64748b; font-size: 11px; text-align: center; line-height: 1.5; }
        .brand { font-weight: 700; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>☁ SkyHeaven</h1>
          <p>${titles[type] || 'Verification'}</p>
        </div>
        <div class="body">
          <p style="color: #e2e8f0; font-size: 15px; font-weight: 600;">Hello,</p>
          <p>Please use the following one-time verification code to continue with your SkyHeaven account:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expire">⏱ Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</div>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email. Never share your verification code with anyone.</p>
        </div>
        <div class="footer">
          <span class="brand">SkyHeaven Cloud Storage</span><br>
          Cascading Multi-Tier Cloud Vault (ImageKit • Cloudinary • Supabase)<br>
          © ${new Date().getFullYear()} SkyHeaven Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const sender = process.env.SMTP_FROM || `"SkyHeaven" <${process.env.SMTP_USER}>`;

  try {
    const info = await getTransporter().sendMail({
      from: sender,
      to,
      subject: subjects[type] || `Your SkyHeaven Verification Code: ${otp}`,
      text: `Your SkyHeaven verification code is: ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you did not request this, please ignore this email.`,
      html,
      headers: {
        'X-Mailer': 'SkyHeaven Mailer',
        'X-Priority': '1',
        'Importance': 'high',
        'Precedence': 'transactional',
      },
      priority: 'high',
    });
    console.log(`✅ [EMAIL SENT] OTP successfully delivered to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [EMAIL FAILED] SMTP error delivering to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOtpEmail, sendShareInvitationEmail };
