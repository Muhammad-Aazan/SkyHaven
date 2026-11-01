import React, { useEffect, useRef } from 'react';
import {
  Eye, Download, Share2, Star, Edit2,
  FolderInput, Copy, Trash2, Info, RotateCcw
} from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useFiles } from '../../context/FileContext';

interface FileContextMenuProps {
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
  x: number;
  y: number;
  onClose: () => void;
  isTrashView?: boolean;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  item,
  type,
  x,
  y,
  onClose,
  isTrashView = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    toggleStar,
    trashItem,
    restoreItem,
    permanentlyDeleteItem,
    downloadFile,
    setPreviewFile,
    setShareTarget,
    setMoveTarget,
    setInspectedItem,
    renameItem
  } = useFiles();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu overflow offscreen
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const handleRename = () => {
    onClose();
    const newName = prompt(`Rename ${type}:`, item.name);
    if (newName && newName.trim() && newName !== item.name) {
      renameItem(item.id, type, newName.trim());
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-52 bg-white border border-slate-200 rounded-2xl shadow-floating py-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {isTrashView ? (
        <>
          <button
            onClick={() => { onClose(); restoreItem(item.id, type); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>Restore</span>
          </button>
          <button
            onClick={() => {
              onClose();
              if (confirm('Permanently delete this item? This action cannot be undone.')) {
                permanentlyDeleteItem(item.id, type);
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete Forever</span>
          </button>
        </>
      ) : (
        <>
          {type === 'file' && (
            <button
              onClick={() => { onClose(); setPreviewFile(item as FileItem); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => { onClose(); setShareTarget({ id: item.id, name: item.name, type }); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => { onClose(); toggleStar(item.id, type); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Star className={`w-4 h-4 ${item.starred ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
            <span>{item.starred ? 'Unstar' : 'Add to Starred'}</span>
          </button>

          {type === 'file' && (
            <button
              onClick={() => { onClose(); downloadFile(item.id); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={handleRename}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Rename</span>
          </button>

          <button
            onClick={() => { onClose(); setMoveTarget({ id: item.id, name: item.name, type, isCopy: false }); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <FolderInput className="w-4 h-4 text-slate-500" />
            <span>Move to...</span>
          </button>

          {type === 'file' && (
            <button
              onClick={() => { onClose(); setMoveTarget({ id: item.id, name: item.name, type, isCopy: true }); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Make a copy</span>
            </button>
          )}

          <button
            onClick={() => { onClose(); setInspectedItem(item); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>File details</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => { onClose(); trashItem(item.id, type); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Move to trash</span>
          </button>
        </>
      )}
    </div>
  );
};
