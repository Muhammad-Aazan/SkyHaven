import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Folder, MoreVertical, Star, FileText, Image as ImageIcon,
  Video, Music, Code, Archive, FileSpreadsheet, Check
} from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useFiles } from '../../context/FileContext';
import { formatBytes, formatDate, getFileCategory, getFileColor } from '../../utils/formatters';
import { FileContextMenu } from './FileContextMenu';

export const FileGrid: React.FC = () => {
  const {
    folders,
    files,
    setCurrentFolderId,
    selectedIds,
    toggleSelectId,
    toggleStar,
    setPreviewFile,
    currentSection
  } = useFiles();

  const [contextMenu, setContextMenu] = useState<{
    item: FileItem | FolderItem;
    type: 'file' | 'folder';
    x: number;
    y: number;
  } | null>(null);

  const handleFolderContextMenu = (e: React.MouseEvent, folder: FolderItem) => {
    e.preventDefault();
    setContextMenu({ item: folder, type: 'folder', x: e.clientX, y: e.clientY });
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ item: file, type: 'file', x: e.clientX, y: e.clientY });
  };

  const renderFileIcon = (file: FileItem) => {
    const category = getFileCategory(file.mimeType, file.extension);
    const color = getFileColor(category);

    if (file.thumbnailUrl) {
      return (
        <img
          src={file.thumbnailUrl}
          alt={file.name}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }

    switch (category) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-emerald-500" />;
      case 'video':
        return <Video className="w-8 h-8 text-purple-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-amber-500" />;
      case 'code':
        return <Code className="w-8 h-8 text-indigo-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-8 h-8 text-teal-500" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-orange-500" />;
      default:
        return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Folders Section */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Folders ({folders.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map(folder => {
              const isSelected = selectedIds.includes(folder.id);
              return (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                  onClick={(e) => {
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      toggleSelectId(folder.id);
                    }
                  }}
                  onDoubleClick={() => setCurrentFolderId(folder.id)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: `${folder.color || '#0061FE'}15`, color: folder.color || '#0061FE' }}
                    >
                      <Folder className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(folder.id, 'folder'); }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${folder.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({ item: folder, type: 'folder', x: rect.left, y: rect.bottom });
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h5 className="font-semibold text-sm text-slate-800 truncate mb-1" title={folder.name}>
                    {folder.name}
                  </h5>

                  <p className="text-xs text-slate-400">
                    {folder.itemCount} files
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Files Section */}
      {files.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Files ({files.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {files.map(file => {
              const isSelected = selectedIds.includes(file.id);
              return (
                <motion.div
                  key={file.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  onContextMenu={(e) => handleFileContextMenu(e, file)}
                  onClick={(e) => {
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      toggleSelectId(file.id);
                    } else {
                      toggleSelectId(file.id);
                    }
                  }}
                  onDoubleClick={() => setPreviewFile(file)}
                  className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-subtle'
                  }`}
                >
                  {/* Select Checkbox Indicator */}
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleSelectId(file.id); }}
                    className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 bg-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Star & Menu Shortcuts */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(file.id, 'file'); }}
                      className="p-1 bg-white/90 hover:bg-white rounded-md shadow-xs text-slate-400 hover:text-amber-500"
                    >
                      <Star className={`w-3.5 h-3.5 ${file.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({ item: file, type: 'file', x: rect.left, y: rect.bottom });
                      }}
                      className="p-1 bg-white/90 hover:bg-white rounded-md shadow-xs text-slate-400 hover:text-slate-700"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail / File Icon Canvas */}
                  <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2.5 relative group-hover:bg-slate-100/80 transition-colors">
                    {renderFileIcon(file)}
                  </div>

                  {/* Name & Metadata */}
                  <div className="px-0.5">
                    <p className="font-semibold text-xs text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatDate(file.updatedAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popover Context Menu */}
      {contextMenu && (
        <FileContextMenu
          item={contextMenu.item}
          type={contextMenu.type}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          isTrashView={currentSection === 'trash'}
        />
      )}
    </div>
  );
};
