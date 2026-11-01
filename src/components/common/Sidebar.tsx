import React from 'react';
import {
  Folder, Clock, Star, Users, Link2, Trash2,
  HardDrive, Settings, ShieldAlert, ChevronRight, ExternalLink
} from 'lucide-react';
import { useFiles, AppSection } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';

interface SidebarProps {
  onOpenPlans: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenPlans, className = '' }) => {
  const { currentSection, setCurrentSection, setCurrentFolderId, storageStats } = useFiles();
  const { user } = useAuth();

  const navItems: { id: AppSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'my_files', label: 'My files', icon: Folder },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared_with_me', label: 'Shared with me', icon: Users },
    { id: 'shared_by_me', label: 'Shared by me', icon: Link2 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'admin', label: 'Storage & Admin', icon: HardDrive }
  ];

  const handleNavClick = (section: AppSection) => {
    setCurrentSection(section);
    if (section === 'my_files') {
      setCurrentFolderId(null);
    }
  };

  const usedBytes = storageStats?.usedBytes ?? user?.storageUsed ?? 0;
  const totalBytes = storageStats?.totalQuotaBytes ?? user?.storageQuota ?? (5 * 1024 * 1024 * 1024);
  const percentUsed = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;

  const planLabel = user?.planId === 'business'
    ? 'Sky Enterprise'
    : user?.planId === 'pro'
    ? 'Sky Professional'
    : 'Basic (Starter)';

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MC';

  return (
    <aside className={`w-64 bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none ${className}`}>
      <div>
        {/* SkyHeaven Official Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <img src="/logo.png" alt="SkyHeaven" className="h-11 w-auto max-w-[190px] object-contain" />
        </div>

        {/* Workspace Pill (Figma: Studio workspace / Personal Pro) */}
        <div className="p-3 mx-3 mt-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between shadow-subtle cursor-pointer hover:border-[#0061FE] transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0061FE] text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A] leading-tight">Studio workspace</p>
              <p className="text-[10px] text-[#64748B]">{planLabel}</p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
        </div>

        {/* Primary Navigation List (Figma Exact Item Names & Sizing) */}
        <nav className="p-3 space-y-0.5 mt-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#0061FE] font-semibold shadow-subtle border border-[#E2E8F0]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0061FE]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Figma Storage Card & User Card */}
      <div className="p-3 space-y-3">
        {/* Storage Widget (Figma: Your storage 64% / Upgrade plan) */}
        <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0F172A]">Your storage</span>
            <span className="font-semibold text-[#64748B]">{percentUsed}%</span>
          </div>

          <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0061FE] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <p className="text-[11px] text-[#64748B]">
            {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
          </p>

          <button
            onClick={onOpenPlans}
            className="text-xs font-semibold text-[#0061FE] hover:underline flex items-center gap-1 pt-1"
          >
            <span>Upgrade plan</span>
            <span className="text-[10px]">↗</span>
          </button>
        </div>

        {/* User Profile Card (Figma: Maya Chen / maya@studio.co) */}
        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0061FE] text-xs font-bold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] truncate leading-tight">
                {user?.name || 'SkyHeaven Member'}
              </p>
              <p className="text-[10px] text-[#64748B] truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
