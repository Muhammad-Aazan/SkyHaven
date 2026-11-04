import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Folder, FileText, Star, Clock, Trash2,
  Upload, FolderPlus, ArrowRight, X
} from 'lucide-react';
import { useFiles, AppSection } from '../../context/FileContext';
import { formatBytes } from '../../utils/formatters';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    files,
    folders,
    setCurrentSection,
    setCurrentFolderId,
    setPreviewFile,
    setIsNewFolderOpen
  } = useFiles();

  const [query, setQuery] = useState('');

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredFolders = folders.filter(f =>
    !f.deletedAt && f.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFiles = files.filter(f =>
    !f.deletedAt && f.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectFolder = (id: string) => {
    setCurrentSection('my_files');
    setCurrentFolderId(id);
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectFile = (file: any) => {
    setPreviewFile(file);
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  const handleNavigateSection = (sec: AppSection) => {
    setCurrentSection(sec);
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCommandPaletteOpen(false)}
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-floating overflow-hidden z-10 transition-colors duration-200"
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a file name, folder, or shortcut..."
              autoFocus
              className="w-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="ml-3 px-2 py-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results Container */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-4">
            {/* Quick Actions if query is empty */}
            {!query && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick Navigation
                </p>
                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => handleNavigateSection('recent')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Recent Files</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleNavigateSection('starred')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>Starred Favorites</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { setIsCommandPaletteOpen(false); setIsNewFolderOpen(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Create New Folder</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleNavigateSection('trash')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Trash Vault</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Folders matches */}
            {filteredFolders.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Folders
                </p>
                <div className="space-y-0.5 mt-1">
                  {filteredFolders.slice(0, 5).map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{folder.itemCount} items</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files matches */}
            {filteredFiles.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Files
                </p>
                <div className="space-y-0.5 mt-1">
                  {filteredFiles.slice(0, 10).map(file => (
                    <button
                      key={file.id}
                      onClick={() => handleSelectFile(file)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatBytes(file.size)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query && filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No files or folders matching "{query}"
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
