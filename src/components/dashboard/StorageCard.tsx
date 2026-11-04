import React, { useState } from 'react';
import {
  HardDrive, Sparkles, FileText, Image as ImageIcon,
  Video, Archive, MoreHorizontal, ArrowUpRight,
  TrendingUp, Trash2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';

interface StorageCardProps {
  onOpenPlans: () => void;
}

export const StorageCard: React.FC<StorageCardProps> = ({ onOpenPlans }) => {
  const { storageStats, setCurrentSection } = useFiles();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: string; gb: number } | null>(null);

  const usedBytes = storageStats?.usedBytes ?? user?.storageUsed ?? 0;
  const totalBytes = storageStats?.totalQuotaBytes ?? user?.storageQuota ?? (25 * 1024 * 1024 * 1024);
  const percentUsed = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;
  const remainingBytes = Math.max(0, totalBytes - usedBytes);

  const breakdown = storageStats?.breakdown ?? {
    documents: 0,
    images: 0,
    videos: 0,
    audio: 0,
    archives: 0,
    others: 0
  };

  const planLabel = user?.planId === 'business'
    ? 'Enterprise Vault 10 TB'
    : user?.planId === 'pro'
    ? 'Pro Vault 2 TB'
    : 'Basic Vault 25 GB';

  const categories = [
    { id: 'images', label: 'Images & Photos', bytes: breakdown.images, color: 'bg-emerald-500', hex: '#10B981', icon: ImageIcon },
    { id: 'videos', label: 'Videos & 4K Media', bytes: breakdown.videos, color: 'bg-purple-500', hex: '#8B5CF6', icon: Video },
    { id: 'docs', label: 'Documents & PDFs', bytes: breakdown.documents, color: 'bg-blue-500', hex: '#0061FE', icon: FileText },
    { id: 'archives', label: 'Archives & ZIPs', bytes: breakdown.archives, color: 'bg-orange-500', hex: '#F97316', icon: Archive },
    { id: 'others', label: 'Audio & Code', bytes: (breakdown.others || 0) + (breakdown.audio || 0), color: 'bg-slate-400', hex: '#94A3B8', icon: MoreHorizontal }
  ];

  // 7-day upload ingress traffic points (GB)
  const activityData = [
    { day: 'Mon', gb: 0 },
    { day: 'Tue', gb: 0 },
    { day: 'Wed', gb: 0 },
    { day: 'Thu', gb: 0 },
    { day: 'Fri', gb: 0 },
    { day: 'Sat', gb: 0 },
    { day: 'Sun', gb: usedBytes > 0 ? parseFloat((usedBytes / (1024 * 1024 * 1024)).toFixed(2)) : 0 }
  ];

  // Calculate SVG curve path coordinates
  const maxGb = 35;
  const chartWidth = 320;
  const chartHeight = 90;
  const paddingX = 20;
  const paddingY = 15;

  const points = activityData.map((d, i) => {
    const x = paddingX + (i / (activityData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.gb / maxGb) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Smooth bezier curve string
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  // SVG Radial Circle metrics
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-subtle mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SECTION 1: Radial Gauge & Quota Overview (5 cols) */}
        <div className="lg:col-span-5 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
          {/* Radial Donut Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
              {/* Track */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="8"
                fill="none"
              />
              {/* Active Segment */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="url(#storageGradient)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0061FE" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                {percentUsed}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Used</span>
            </div>
          </div>

          {/* Text details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{planLabel}</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-md border border-emerald-200">
                Encrypted
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {formatBytes(usedBytes)} <span className="text-xs text-slate-400 font-semibold font-sans">/ {formatBytes(totalBytes)}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatBytes(remainingBytes)} free available space
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={onOpenPlans}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Upgrade Plan</span>
              </button>
              <button
                onClick={() => setCurrentSection('trash')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-rose-600 text-xs font-medium border border-slate-200 rounded-lg hover:bg-rose-50/50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Trash</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Smooth 7-Day Ingress Trend Curve (4 cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Weekly Ingress Activity</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +18.4% sync
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            {hoveredDay ? (
              <span className="font-bold text-blue-600">{hoveredDay.day}: {hoveredDay.gb} GB synced</span>
            ) : (
              usedBytes > 0 ? `${formatBytes(usedBytes)} synced across secure storage` : '0 B synced · Ready for first upload'
            )}
          </p>

          {/* SVG Area Curve */}
          <div className="relative w-full h-[90px] overflow-hidden select-none">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0061FE" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0061FE" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#F1F5F9" strokeWidth="1" />
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />

              {/* Area Fill */}
              <path d={areaD} fill="url(#areaGradient)" />

              {/* Curve Stroke */}
              <path d={pathD} fill="none" stroke="#0061FE" strokeWidth="2.5" strokeLinecap="round" />

              {/* Interactive Data Dots */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredDay?.day === pt.day ? 5 : 3}
                  className="fill-white stroke-blue-600 stroke-2 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredDay({ day: pt.day, gb: pt.gb })}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between px-2 text-[10px] font-semibold text-slate-400 mt-1">
            {activityData.map(d => (
              <span key={d.day}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* SECTION 3: Category Quick Badges (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-xs font-bold text-slate-800 block mb-1">
            Partition Breakdown
          </span>
          <div className="space-y-1.5">
            {categories.slice(0, 4).map(cat => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setActiveCategory(cat.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-default ${
                    activeCategory === cat.id ? 'bg-slate-100 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span className="text-xs font-medium text-slate-700">{cat.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{formatBytes(cat.bytes)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
