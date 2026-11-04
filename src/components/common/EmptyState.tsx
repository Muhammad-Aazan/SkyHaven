import React from 'react';
import { FolderOpen, Star, Trash2, Search, Upload } from 'lucide-react';
import { useFiles } from '../../context/FileContext';

interface EmptyStateProps {
  type: 'folder' | 'starred' | 'trash' | 'search' | 'recent' | 'shared';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const { queueFilesForUpload, setIsNewFolderOpen } = useFiles();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const config = {
    folder: {
      icon: FolderOpen,
      title: 'This folder is empty',
      description: 'Drag and drop files anywhere on screen, or use the buttons below to get started.',
      showActions: true
    },
    starred: {
      icon: Star,
      title: 'No starred items yet',
      description: 'Star files and folders you access frequently for fast one-click access.',
      showActions: false
    },
    trash: {
      icon: Trash2,
      title: 'Trash is completely empty',
      description: 'Items moved to trash will stay here for 30 days before permanent deletion.',
      showActions: false
    },
    search: {
      icon: Search,
      title: 'No files match your search',
      description: 'Check your spelling or filter criteria and try searching again.',
      showActions: false
    },
    recent: {
      icon: FolderOpen,
      title: 'No recent activity',
      description: 'Files you upload, open, or edit will show up here automatically.',
      showActions: true
    },
    shared: {
      icon: FolderOpen,
      title: 'No shared links',
      description: 'Create shareable links for any file or folder with password protection and expiry.',
      showActions: false
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && queueFilesForUpload(e.target.files)}
        multiple
        className="hidden"
      />
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-subtle">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{config.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {config.description}
      </p>

      {config.showActions && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload files</span>
          </button>
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
          >
            <span>New Folder</span>
          </button>
        </div>
      )}
    </div>
  );
};
