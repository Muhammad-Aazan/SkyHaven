import React, { useState } from 'react';
import {
  Search, Bell, Upload, FolderPlus, CheckCircle2,
  ChevronDown, User as UserIcon, Shield, LogOut,
  Sparkles, Check, HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { notificationsApi } from '../../api/client';
import { NotificationItem } from '../../types';
import { formatDate } from '../../utils/formatters';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenPlans: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile, onOpenPlans }) => {
  const { user, logout } = useAuth();
  const {
    setIsCommandPaletteOpen,
    setIsNewFolderOpen,
    queueFilesForUpload,
    setCurrentSection
  } = useFiles();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFetchNotifications = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      const list = (res.data as NotificationItem[]) || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: NotificationItem) => !n.read).length);
    } catch {
      // fallback
    }
  };

  React.useEffect(() => {
    handleFetchNotifications();
  }, [user?.id]);

  const toggleNotifications = () => {
    if (!isNotifOpen) handleFetchNotifications();
    setIsNotifOpen(!isNotifOpen);
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      queueFilesForUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Hidden file input for global upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadChange}
        multiple
        className="hidden"
      />

      {/* Search Bar / Command Palette Trigger */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-[#64748B] group-hover:text-[#0F172A] font-normal text-xs">Search your files and folders</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-[#64748B] bg-white border border-[#CBD5E1] rounded-md shadow-xs">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Action Buttons & User Menu */}
      <div className="flex items-center gap-2.5 ml-4">
        {/* Upload Button (Figma: Upload files) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.98] rounded-xl shadow-xs transition-all"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload files</span>
        </button>

        {/* New Folder Button */}
        <button
          onClick={() => setIsNewFolderOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.98] rounded-xl border border-slate-200 transition-all"
          title="Create New Folder"
        >
          <FolderPlus className="w-4 h-4 text-slate-600" />
          <span className="hidden md:inline">New Folder</span>
        </button>

        {/* Upgrade Plan Pill */}
        <button
          onClick={onOpenPlans}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>{user?.planId === 'business' ? 'Business Vault' : user?.planId === 'pro' ? 'Pro 2 TB' : 'Upgrade'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-floating z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'SH'}
              </div>
            )}
            <span className="hidden md:inline text-xs font-semibold text-slate-700">{user?.name || 'Account'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-floating z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md border border-blue-200">
                  <HardDrive className="w-3 h-3" />
                  <span>{user?.planId === 'business' ? 'ENTERPRISE' : user?.planId === 'pro' ? 'PRO' : 'BASIC (FREE)'} Storage</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setIsUserMenuOpen(false); onOpenProfile(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Account & Profile</span>
                </button>
                <button
                  onClick={() => { setIsUserMenuOpen(false); onOpenPlans(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Storage & Billing Plans</span>
                </button>
                <button
                  onClick={() => { setIsUserMenuOpen(false); setCurrentSection('admin'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Admin Security Console</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => { setIsUserMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
