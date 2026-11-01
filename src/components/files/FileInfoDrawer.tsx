import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Folder, Calendar, HardDrive,
  Hash, History, Download, Trash2, Share2, Plus
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { formatBytes, formatFullDateTime, getFileCategory } from '../../utils/formatters';
import { FileItem, FolderItem } from '../../types';

export const FileInfoDrawer: React.FC = () => {
  const { inspectedItem, setInspectedItem, trashItem, downloadFile, setShareTarget } = useFiles();

  if (!inspectedItem) return null;

  const isFile = 'extension' in inspectedItem;
  const file = isFile ? (inspectedItem as FileItem) : null;
  const folder = !isFile ? (inspectedItem as FolderItem) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-40 flex">
        {/* Backdrop for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setInspectedItem(null)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs md:hidden"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-84 sm:w-96 bg-white border-l border-slate-200 h-full shadow-floating flex flex-col justify-between overflow-y-auto"
        >
          {/* Top Bar */}
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Item Details
              </h4>
              <button
                onClick={() => setInspectedItem(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Icon / Preview */}
            <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50">
              {file?.thumbnailUrl ? (
                <img
                  src={file.thumbnailUrl}
                  alt={file.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200 shadow-md mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                  {isFile ? <FileText className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
                </div>
              )}
              <h3 className="font-bold text-sm text-slate-800 break-all px-2 mb-1">
                {inspectedItem.name}
              </h3>
              <p className="text-xs text-slate-400">
                {isFile ? formatBytes(file?.size || 0) : `${folder?.itemCount} items`}
              </p>
            </div>

            {/* Metadata Fields */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" /> Type
                </span>
                <span className="font-semibold text-slate-800 uppercase">
                  {isFile ? file?.extension : 'Folder'}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Created
                </span>
                <span className="font-medium text-slate-700 text-right">
                  {formatFullDateTime(inspectedItem.createdAt)}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Modified
                </span>
                <span className="font-medium text-slate-700 text-right">
                  {formatFullDateTime(inspectedItem.updatedAt)}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400">Owner</span>
                <span className="font-semibold text-slate-800">{inspectedItem.ownerName}</span>
              </div>

              {file && (
                <div className="pt-2">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Hash className="w-3.5 h-3.5" /> Checksum (SHA-256)
                  </span>
                  <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 break-all">
                    sha256-a9f830d927fe19bc44120aef2450
                  </p>
                </div>
              )}

              {/* Version History (for files) */}
              {file && file.versions && file.versions.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-blue-600" /> Version History ({file.versions.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {file.versions.map(ver => (
                      <div
                        key={ver.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">
                            Version {ver.versionNumber} {ver.versionNumber === file.currentVersion ? '(Current)' : ''}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatBytes(ver.size)} • {ver.uploadedBy}
                          </p>
                        </div>
                        <button
                          onClick={() => downloadFile(file.id)}
                          className="p-1 text-slate-400 hover:text-blue-600"
                          title="Download this version"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <button
              onClick={() => {
                setShareTarget({ id: inspectedItem.id, name: inspectedItem.name, type: isFile ? 'file' : 'folder' });
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share</span>
            </button>
            <button
              onClick={() => {
                trashItem(inspectedItem.id, isFile ? 'file' : 'folder');
                setInspectedItem(null);
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
              title="Move to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
