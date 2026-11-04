import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, FolderInput, Copy, Check, ChevronRight } from 'lucide-react';
import { useFiles } from '../../context/FileContext';

export const MoveCopyModal: React.FC = () => {
  const { moveTarget, setMoveTarget, folders, moveItem, copyItem } = useFiles();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!moveTarget) return null;

  const isCopy = !!moveTarget.isCopy;
  const availableFolders = folders.filter(f => !f.deletedAt && f.id !== moveTarget.id);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (isCopy) {
        await copyItem(moveTarget.id, selectedFolderId);
      } else {
        await moveItem(moveTarget.id, moveTarget.type, selectedFolderId);
      }
      setMoveTarget(null);
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
          onClick={() => setMoveTarget(null)}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-floating overflow-hidden z-10 transition-colors duration-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isCopy ? <Copy className="w-5 h-5" /> : <FolderInput className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isCopy ? 'Copy' : 'Move'} "{moveTarget.name}"
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Choose destination folder</p>
              </div>
            </div>
            <button
              onClick={() => setMoveTarget(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Folder Tree List */}
          <div className="p-4 max-h-72 overflow-y-auto space-y-1 text-xs">
            {/* Root Option */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                selectedFolderId === null
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>My Files (Root Folder)</span>
              </div>
              {selectedFolderId === null && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </button>

            {/* Subfolders */}
            {availableFolders.map(folder => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className="w-4 h-4 shrink-0" style={{ color: folder.color || '#0061FE' }} />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-end gap-2">
            <button
              onClick={() => setMoveTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{isCopy ? 'Copy to Folder' : 'Move to Folder'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
