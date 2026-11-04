import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, X, CheckCircle2,
  AlertCircle, Upload, Loader2
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { formatBytes } from '../../utils/formatters';

export const UploadManager: React.FC = () => {
  const { uploads, cancelUpload, clearCompletedUploads } = useFiles();
  const [isMinimized, setIsMinimized] = useState(false);

  if (uploads.length === 0) return null;

  const inProgressCount = uploads.filter(u => u.status === 'uploading' || u.status === 'queued' || u.status === 'processing').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 sm:w-96 select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-floating overflow-hidden transition-colors duration-200"
      >
        {/* Dock Header */}
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-3.5 bg-slate-900 dark:bg-slate-850 text-white flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {inProgressCount > 0 ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold">
              {inProgressCount > 0
                ? `Uploading ${inProgressCount} ${inProgressCount === 1 ? 'file' : 'files'}...`
                : `${completedCount} ${completedCount === 1 ? 'upload' : 'uploads'} complete`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); clearCompletedUploads(); }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload Items List */}
        {!isMinimized && (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {uploads.map(item => (
              <div key={item.id} className="p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'completed' && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                        {item.progress}% • {item.speed}
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="p-0.5 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {item.status === 'uploading' && (
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'completed' && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatBytes(item.size)} • Encrypted & Stored
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
