import React, { useState, useEffect } from 'react';
import {
  Download, Lock, CheckCircle2, FileText,
  Calendar, Shield, ExternalLink, ArrowRight, AlertCircle, Copy, Check, Eye
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { publicShareApi } from '../api/client';

interface PublicSharePageProps {
  shareToken: string;
  onGoToDashboard: () => void;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({ shareToken, onGoToDashboard }) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const [shareData, setShareData] = useState<any>(null);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Load public share data
  useEffect(() => {
    let isMounted = true;
    const fetchShare = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await publicShareApi.getPublicShare(shareToken);
        if (!isMounted) return;
        const data = res.data;
        setShareData(data.share);
        setTargetItem(data.target);
        setOwnerData(data.owner);
        setDownloadUrl(data.downloadUrl || null);
        setIsUnlocked(!!data.isUnlocked);
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Share link not found or has expired.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchShare();
    return () => { isMounted = false; };
  }, [shareToken]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPasswordError('Please enter the access password');
      return;
    }
    setIsUnlocking(true);
    setPasswordError('');
    try {
      const res = await publicShareApi.unlockPublicShare(shareToken, password);
      const data = res.data;
      setTargetItem(data.target);
      setDownloadUrl(data.downloadUrl || null);
      setIsUnlocked(true);
      if (data.owner) setOwnerData(data.owner);
    } catch (err: any) {
      setPasswordError(err.message || 'Invalid access password');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      publicShareApi.recordDownload(shareToken).catch(() => {});
    } catch {
      // non-blocking
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = targetItem?.name || shareData?.targetName || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const itemName = targetItem?.name || shareData?.targetName || 'Shared File';
  const ownerName = ownerData?.name || 'SkyHeaven Member';
  const fileSize = targetItem?.size || 0;
  const mimeType = targetItem?.mimeType || 'application/octet-stream';
  const isImage = mimeType.startsWith('image/');
  const expiryFormatted = shareData?.expiresAt
    ? new Date(shareData.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Never expires';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="SkyHeaven" className="h-11 w-auto object-contain" />
        </div>

        <button
          onClick={onGoToDashboard}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <span>Open SkyHeaven App</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        {isLoading ? (
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-floating">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">Accessing Shared Item...</h3>
            <p className="text-xs text-slate-400 mt-1">Verifying encrypted token signature</p>
          </div>
        ) : errorMessage ? (
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-floating">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Share Link Unavailable</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">{errorMessage}</p>
            <button
              onClick={onGoToDashboard}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Go to SkyHeaven Dashboard
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-floating overflow-hidden">
            {/* Card Banner */}
            <div className="p-6 bg-slate-900 text-white text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-md">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold truncate px-2">{itemName}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Shared by <span className="text-slate-200 font-semibold">{ownerName}</span>
              </p>
            </div>

            <div className="p-6">
              {!isUnlocked ? (
                /* Password Gate */
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-2">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">This link is password-protected</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Please enter the security password to unlock and access</p>
                  </div>

                  {passwordError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 text-center">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <input
                      type="password"
                      placeholder="Enter security password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUnlocking}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {isUnlocking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Unlock & Access File</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Unlocked Details & Download */
                <div className="space-y-5">
                  {/* Image Preview if applicable */}
                  {isImage && downloadUrl && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 max-h-56 flex items-center justify-center">
                      <img
                        src={downloadUrl}
                        alt={itemName}
                        className="max-h-56 w-auto object-contain"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">File Size</span>
                      <span className="font-semibold text-slate-800">{formatBytes(fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">File Type</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{mimeType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Link Expiry</span>
                      <span className="font-semibold text-emerald-600">{expiryFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleDownload}
                      disabled={!downloadUrl}
                      className="flex-1 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download file ({formatBytes(fileSize)})</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="p-3 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                      title="Copy link"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Protected by SkyHeaven Multi-Tier Cloud Protocol</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SkyHeaven Inc. Cascading Multi-Tier Cloud Storage.
      </footer>
    </div>
  );
};
