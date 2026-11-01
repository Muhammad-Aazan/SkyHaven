import React, { useState } from 'react';
import {
  Folder, Star, MoreVertical, FileText, Download,
  Share2, Check, Eye
} from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useFiles } from '../../context/FileContext';
import { formatBytes, formatDate, getFileCategory } from '../../utils/formatters';
import { FileContextMenu } from './FileContextMenu';

export const FileList: React.FC = () => {
  const {
    folders,
    files,
    setCurrentFolderId,
    selectedIds,
    toggleSelectId,
    toggleStar,
    setPreviewFile,
    setShareTarget,
    downloadFile,
    currentSection
  } = useFiles();

  const [contextMenu, setContextMenu] = useState<{
    item: FileItem | FolderItem;
    type: 'file' | 'folder';
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => {
    e.preventDefault();
    setContextMenu({ item, type, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold select-none">
              <th className="py-3 px-4 w-10 text-center">
                <span className="sr-only">Select</span>
              </th>
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-4 hidden sm:table-cell">Modified</th>
              <th className="py-3 px-4 hidden md:table-cell">Size</th>
              <th className="py-3 px-4 hidden lg:table-cell">Kind</th>
              <th className="py-3 px-4 hidden xl:table-cell">Owner</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Folders */}
            {folders.map(folder => {
              const isSelected = selectedIds.includes(folder.id);
              return (
                <tr
                  key={folder.id}
                  onClick={() => toggleSelectId(folder.id)}
                  onDoubleClick={() => setCurrentFolderId(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                  className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSelectId(folder.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: folder.color || '#0061FE' }}
                      />
                      <span className="font-semibold text-slate-800 hover:text-blue-600 truncate max-w-xs md:max-w-md">
                        {folder.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                    {formatDate(folder.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                    {folder.itemCount} items
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden lg:table-cell">
                    Folder
                  </td>
                  <td className="py-3 px-4 text-slate-500 hidden xl:table-cell">
                    {folder.ownerName}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleStar(folder.id, 'folder')}
                        className="p-1 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100"
                      >
                        <Star className={`w-3.5 h-3.5 ${folder.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({ item: folder, type: 'folder', x: rect.left, y: rect.bottom });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Files */}
            {files.map(file => {
              const isSelected = selectedIds.includes(file.id);
              const category = getFileCategory(file.mimeType, file.extension);

              return (
                <tr
                  key={file.id}
                  onClick={() => toggleSelectId(file.id)}
                  onDoubleClick={() => setPreviewFile(file)}
                  onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                  className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSelectId(file.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 hover:text-blue-600 truncate max-w-xs md:max-w-md" title={file.name}>
                        {file.name}
                      </span>
                      {file.isShared && (
                        <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded-md border border-blue-200">
                          Shared
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                    {formatDate(file.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden lg:table-cell uppercase">
                    {file.extension}
                  </td>
                  <td className="py-3 px-4 text-slate-500 hidden xl:table-cell">
                    {file.ownerName}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShareTarget({ id: file.id, name: file.name, type: 'file' })}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Share"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadFile(file.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleStar(file.id, 'file')}
                        className="p-1 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100"
                      >
                        <Star className={`w-3.5 h-3.5 ${file.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({ item: file, type: 'file', x: rect.left, y: rect.bottom });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
