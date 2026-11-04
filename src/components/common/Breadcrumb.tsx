import React from 'react';
import {
  Folder, ChevronRight, LayoutGrid, List,
  ArrowUpDown, CheckSquare, Square, Trash2,
  Star, Download
} from 'lucide-react';
import { useFiles, ViewMode, SortField } from '../../context/FileContext';

export const Breadcrumb: React.FC = () => {
  const {
    breadcrumbs,
    setCurrentFolderId,
    viewMode,
    setViewMode,
    sortField,
    sortOrder,
    setSorting,
    selectedIds,
    selectAll,
    clearSelection,
    files,
    folders,
    trashItem
  } = useFiles();

  const totalItems = files.length + folders.length;
  const isAllSelected = totalItems > 0 && selectedIds.length === totalItems;

  const handleBatchDelete = async () => {
    if (confirm(`Move ${selectedIds.length} items to trash?`)) {
      for (const id of selectedIds) {
        const isFile = files.some(f => f.id === id);
        await trashItem(id, isFile ? 'file' : 'folder');
      }
      clearSelection();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id || 'root'}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />}
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`text-sm md:text-base font-semibold transition-colors flex items-center gap-1.5 ${
                  isLast ? 'text-slate-900 dark:text-white cursor-default' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                disabled={isLast}
              >
                {idx === 0 && <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                <span>{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Controls & Batch Actions */}
      <div className="flex items-center gap-2.5">
        {/* Multi-selection Bar */}
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl animate-in fade-in duration-150">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
            <div className="h-4 w-px bg-blue-200 dark:bg-blue-800 mx-1" />
            <button
              onClick={handleBatchDelete}
              className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          totalItems > 0 && (
            <button
              onClick={selectAll}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Select all</span>
            </button>
          )
        )}

        {/* Sort Selector */}
        <div className="relative">
          <select
            value={`${sortField}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_') as [SortField, 'asc' | 'desc'];
              setSorting(field, order);
            }}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
          >
            <option value="updatedAt_desc" className="dark:bg-slate-850">Modified (Newest)</option>
            <option value="updatedAt_asc" className="dark:bg-slate-850">Modified (Oldest)</option>
            <option value="name_asc" className="dark:bg-slate-850">Name (A to Z)</option>
            <option value="name_desc" className="dark:bg-slate-850">Name (Z to A)</option>
            <option value="size_desc" className="dark:bg-slate-850">Size (Largest)</option>
            <option value="size_asc" className="dark:bg-slate-850">Size (Smallest)</option>
          </select>
          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* View Switcher (Grid / List) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
