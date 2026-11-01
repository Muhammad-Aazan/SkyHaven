import React from 'react';
import {
  Folder, FileText, Image as ImageIcon, Video,
  Clock, Star, Users, ArrowRight, ExternalLink
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';

// Helper: pick icon + color based on file type
const fileIconProps = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return { icon: ImageIcon, bg: 'bg-blue-50', color: 'text-blue-500' };
  if (mimeType?.startsWith('video/')) return { icon: Video, bg: 'bg-purple-50', color: 'text-purple-500' };
  return { icon: FileText, bg: 'bg-red-50', color: 'text-red-500' };
};

interface WorkspaceOverviewProps {
  onOpenPlans: () => void;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({ onOpenPlans }) => {
  const { user } = useAuth();
  const { files, storageStats, setCurrentSection } = useFiles();

  const usedBytes = storageStats?.usedBytes ?? user?.storageUsed ?? 0;
  const totalBytes = storageStats?.totalQuotaBytes ?? user?.storageQuota ?? (5 * 1024 * 1024 * 1024);
  const percentUsed = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;
  const remainingSpace = formatBytes(Math.max(0, totalBytes - usedBytes));

  const planBadge = user?.planId === 'business'
    ? 'Sky Enterprise'
    : user?.planId === 'pro'
    ? 'Sky Professional'
    : 'Basic (Starter)';

  const starredFiles = files.filter(f => f.starred).slice(0, 3);
  const recentFiles = files.slice(0, 4);

  // Real counts from actual files
  const imageCount = files.filter(f => f.mimeType?.startsWith('image/')).length;
  const videoCount = files.filter(f => f.mimeType?.startsWith('video/')).length;
  const docCount   = files.filter(f => !f.mimeType?.startsWith('image/') && !f.mimeType?.startsWith('video/')).length;
  const totalCount = files.length;

  return (
    <div className="space-y-8 mb-8">
      {/* 1. Header Greeting (Figma: Good morning, Maya / Date subtitle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Tuesday, October 27 · A little space to make great things.
          </p>
        </div>
      </div>

      {/* 2. Top Summary Grid: Your Storage & Your Library at a glance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Your Storage Card (Figma Layout) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[#0F172A]">Your storage</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#0061FE] rounded-md text-[11px] font-semibold border border-blue-200/60">
                {planBadge}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-normal text-[#0F172A]">
                {formatBytes(usedBytes)}
              </span>
              <span className="text-xs text-[#64748B]">of {formatBytes(totalBytes)} used</span>
            </div>

            <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden my-3">
              <div
                className="bg-[#0061FE] h-full rounded-full transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <p className="text-[11px] text-[#64748B]">
              {percentUsed}% used · {remainingSpace} available
            </p>
          </div>

          <button
            onClick={onOpenPlans}
            className="text-xs font-semibold text-[#0061FE] hover:underline flex items-center gap-1 pt-4 border-t border-[#F1F5F9] mt-4"
          >
            <span>Manage →</span>
          </button>
        </div>

        {/* Your library at a glance (Figma 4-stat grid) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-subtle flex flex-col justify-between">
          <span className="text-sm font-semibold text-[#0F172A] mb-4">Your library at a glance</span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0061FE] flex items-center justify-center mb-3">
                <ImageIcon className="w-4 h-4" />
              </div>
              <p className="text-xl font-semibold text-[#0F172A]">{imageCount}</p>
              <p className="text-xs text-[#64748B]">Images</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Video className="w-4 h-4" />
              </div>
              <p className="text-xl font-semibold text-[#0F172A]">{videoCount}</p>
              <p className="text-xs text-[#64748B]">Videos</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xl font-semibold text-[#0F172A]">{docCount}</p>
              <p className="text-xs text-[#64748B]">Documents</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Folder className="w-4 h-4" />
              </div>
              <p className="text-xl font-semibold text-[#0F172A]">{totalCount}</p>
              <p className="text-xs text-[#64748B]">Total Files</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Starred for a reason (Figma Section) */}
      {starredFiles.length > 0 && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-[#0F172A]">Starred, for a reason</h2>
          <button
            onClick={() => setCurrentSection('starred')}
            className="text-xs font-semibold text-[#0061FE] hover:underline"
          >
            View all →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {starredFiles.map(file => {
            const { icon: Icon, bg, color } = fileIconProps(file.mimeType);
            return (
              <div key={file.id} className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-subtle hover:border-[#0061FE] transition-all flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#0F172A] truncate">{file.name}</p>
                  <p className="text-[11px] text-[#64748B]">{formatBytes(file.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
