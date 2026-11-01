import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Share2, Link2, Copy, Check, Lock,
  Calendar, Shield, UserPlus, Trash2, Eye, Edit3, AlertCircle
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { sharesApi } from '../../api/client';

export const ShareModal: React.FC = () => {
  const { shareTarget, setShareTarget } = useFiles();
  const [tab, setTab] = useState<'link' | 'invite'>('link');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [isCopied, setIsCopied] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [shareLink, setShareLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Automatically fetch existing public link or generate one on open
  useEffect(() => {
    let isMounted = true;
    if (!shareTarget) return;

    const initShare = async () => {
      try {
        const res = await sharesApi.getSentShares();
        const existing = (res.data || []).find(
          (s: any) => s.targetId === shareTarget.id && s.isPublic
        );
        if (existing && isMounted) {
          setShareLink(`${baseOrigin}/share/${existing.shareToken}`);
          if (existing.isPasswordProtected) setIsPasswordProtected(true);
        } else {
          // Pre-generate a public link
          const newShare = await sharesApi.createShare({
            targetId: shareTarget.id,
            targetType: shareTarget.type,
            role: 'viewer',
            isPublic: true,
            expiresInDays: 7
          });
          const token = newShare.data?.shareToken;
          if (token && isMounted) {
            setShareLink(`${baseOrigin}/share/${token}`);
          }
        }
      } catch (err) {
        console.warn('Share auto-init:', err);
      }
    };

    initShare();
    return () => { isMounted = false; };
  }, [shareTarget?.id]);

  if (!shareTarget) return null;

  const generatedLink = shareLink || `${baseOrigin}/share/sh_${shareTarget.id.substring(0, 8)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await sharesApi.createShare({
        targetId: shareTarget.id,
        targetType: shareTarget.type,
        recipientEmail: tab === 'invite' ? recipientEmail.trim() : undefined,
        role,
        isPublic: tab === 'link',
        password: isPasswordProtected ? password : undefined,
        expiresInDays: expiryDays > 0 ? expiryDays : undefined
      });
      const token = res.data?.shareToken;
      if (token) {
        setShareLink(`${baseOrigin}/share/${token}`);
      }
      setSuccessMsg(tab === 'invite' ? `Invitation sent via email to ${recipientEmail}` : 'Share link & security policies saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (tab === 'invite') setRecipientEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update share policy. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShareTarget(null)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-floating overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Share "{shareTarget.name}"</h3>
                <p className="text-xs text-slate-400 capitalize">{shareTarget.type} permissions & links</p>
              </div>
            </div>
            <button
              onClick={() => setShareTarget(null)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-5 pt-2">
            <button
              onClick={() => setTab('link')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                tab === 'link'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Shareable Link</span>
            </button>
            <button
              onClick={() => setTab('invite')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                tab === 'invite'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite by Email</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {tab === 'link' ? (
              <>
                {/* Link URL Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Public Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-600 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Password Protection */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Password Protection</p>
                        <p className="text-[11px] text-slate-400">Require passphrase before download</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPasswordProtected}
                      onChange={(e) => setIsPasswordProtected(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {isPasswordProtected && (
                    <input
                      type="password"
                      placeholder="Enter access password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </div>

                {/* Expiry Selector */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Link Expiration</p>
                      <p className="text-[11px] text-slate-400">Auto-revoke link after period</p>
                    </div>
                  </div>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={0}>Never Expire</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Collaborator Email
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none"
                    >
                      <option value="viewer">Can View</option>
                      <option value="editor">Can Edit</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-700">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Invited team members can access file history, collaborate, and leave annotations directly from their dashboard.
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
            <button
              onClick={() => setShareTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCreateShare}
              disabled={isLoading || (tab === 'invite' && !recipientEmail)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{tab === 'invite' ? 'Send Invitation' : 'Save & Update Policy'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
