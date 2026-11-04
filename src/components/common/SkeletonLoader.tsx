import React from 'react';

interface SkeletonProps {
  viewMode?: 'grid' | 'list';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2 py-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
              <div className="space-y-1.5">
                <div className="w-40 h-3.5 bg-slate-100 rounded" />
                <div className="w-20 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-3 bg-slate-100 rounded hidden sm:block" />
              <div className="w-20 h-3 bg-slate-100 rounded hidden md:block" />
              <div className="w-5 h-5 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-pulse py-2">
      {/* Folders skeleton */}
      <div>
        <div className="w-24 h-4 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50" />
                <div className="space-y-2">
                  <div className="w-28 h-3.5 bg-slate-100 rounded" />
                  <div className="w-14 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-4 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Files skeleton */}
      <div>
        <div className="w-20 h-4 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="p-3.5 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between aspect-square"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100" />
                <div className="w-4 h-4 bg-slate-100 rounded" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-1/2 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
