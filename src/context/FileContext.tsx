import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FileItem, FolderItem, StorageStats, UploadItem, ShareItem } from '../types';
import { filesApi, foldersApi, searchApi, sharesApi, trashApi, storageApi } from '../api/client';
import { useAuth } from './AuthContext';

export type AppSection = 'my_files' | 'recent' | 'starred' | 'shared_with_me' | 'shared_by_me' | 'trash' | 'admin';
export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'updatedAt' | 'size' | 'extension';
export type SortOrder = 'asc' | 'desc';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FileContextType {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  breadcrumbs: BreadcrumbItem[];
  files: FileItem[];
  folders: FolderItem[];
  isLoading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  setSorting: (field: SortField, order: SortOrder) => void;
  selectedIds: string[];
  toggleSelectId: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  fileTypeFilter: string;
  setFileTypeFilter: (type: string) => void;

  // Storage Stats
  storageStats: StorageStats | null;
  refreshStorageStats: () => Promise<void>;

  // Upload Management
  uploads: UploadItem[];
  queueFilesForUpload: (fileList: FileList | File[]) => void;
  cancelUpload: (uploadId: string) => void;
  clearCompletedUploads: () => void;

  // File & Folder Actions
  createFolder: (name: string, color?: string) => Promise<void>;
  renameItem: (id: string, type: 'file' | 'folder', newName: string) => Promise<void>;
  trashItem: (id: string, type: 'file' | 'folder') => Promise<void>;
  restoreItem: (id: string, type: 'file' | 'folder') => Promise<void>;
  permanentlyDeleteItem: (id: string, type: 'file' | 'folder') => Promise<void>;
  emptyTrash: () => Promise<void>;
  toggleStar: (id: string, type: 'file' | 'folder') => Promise<void>;
  moveItem: (id: string, type: 'file' | 'folder', targetFolderId: string | null) => Promise<void>;
  copyItem: (id: string, targetFolderId: string | null) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;

  // Inspection Drawer & Modals
  inspectedItem: FileItem | FolderItem | null;
  setInspectedItem: (item: FileItem | FolderItem | null) => void;
  previewFile: FileItem | null;
  setPreviewFile: (file: FileItem | null) => void;
  shareTarget: { id: string; name: string; type: 'file' | 'folder' } | null;
  setShareTarget: (target: { id: string; name: string; type: 'file' | 'folder' } | null) => void;
  moveTarget: { id: string; name: string; type: 'file' | 'folder'; isCopy?: boolean } | null;
  setMoveTarget: (target: { id: string; name: string; type: 'file' | 'folder'; isCopy?: boolean } | null) => void;
  isNewFolderOpen: boolean;
  setIsNewFolderOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;

  // Refresh
  refreshData: (showLoader?: boolean) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [currentSection, setCurrentSection] = useState<AppSection>('my_files');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'My Files' }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Modals & Panels
  const [inspectedItem, setInspectedItem] = useState<FileItem | FolderItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; name: string; type: 'file' | 'folder'; isCopy?: boolean } | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const refreshStorageStats = useCallback(async () => {
    try {
      const res = await storageApi.getUsage();
      setStorageStats(res.data);
    } catch {
      // fallback
    }
  }, []);

  const refreshData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
    }
    setSelectedIds([]);
    try {
      if (searchQuery.trim().length > 0) {
        const res = await searchApi.search(searchQuery, fileTypeFilter !== 'all' ? fileTypeFilter : undefined);
        setFiles(res.data.files || []);
        setFolders(res.data.folders || []);
      } else if (currentSection === 'recent') {
        const res = await searchApi.getRecent();
        setFiles(res.data || []);
        setFolders([]);
      } else if (currentSection === 'starred') {
        const res = await searchApi.getStarred();
        setFiles(res.data.files || []);
        setFolders(res.data.folders || []);
      } else if (currentSection === 'shared_with_me') {
        const res = await sharesApi.getSharedWithMe();
        setFiles(res.data || []);
        setFolders([]);
      } else if (currentSection === 'shared_by_me') {
        const sharesRes = await sharesApi.getSentShares();
        const sentFiles = (sharesRes.data || []).map((s: ShareItem) => ({
          id: s.targetId,
          name: s.targetName,
          extension: s.targetName.split('.').pop() || 'dat',
          mimeType: 'application/octet-stream',
          size: 1024 * 1024 * 5,
          storageKey: 'shared/' + s.shareToken,
          parentFolderId: null,
          ownerId: s.ownerId,
          ownerName: s.ownerName,
          ownerEmail: '',
          starred: false,
          isShared: true,
          shareCount: s.viewsCount,
          versions: [],
          currentVersion: 1,
          createdAt: s.createdAt,
          updatedAt: s.createdAt
        })) as FileItem[];
        setFiles(sentFiles);
        setFolders([]);
      } else if (currentSection === 'trash') {
        const res = await trashApi.getTrashItems();
        setFiles(res.data.files || []);
        setFolders(res.data.folders || []);
      } else {
        // 'my_files'
        const [filesRes, foldersRes] = await Promise.all([
          filesApi.getFiles(currentFolderId),
          foldersApi.getFolders(currentFolderId)
        ]);
        setFiles(filesRes.data || []);
        setFolders(foldersRes.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentSection, currentFolderId, searchQuery, fileTypeFilter]);

  // Compute breadcrumbs
  useEffect(() => {
    if (currentFolderId === null) {
      setBreadcrumbs([{ id: null, name: currentSection === 'my_files' ? 'My Files' : currentSection.replace('_', ' ').toUpperCase() }]);
    } else {
      foldersApi.getFolderDetails(currentFolderId).then(res => {
        if (res.data) {
          setBreadcrumbs([
            { id: null, name: 'My Files' },
            { id: res.data.id, name: res.data.name }
          ]);
        }
      }).catch(() => {
        setBreadcrumbs([{ id: null, name: 'My Files' }]);
      });
    }
  }, [currentFolderId, currentSection]);

  useEffect(() => {
    refreshData(files.length === 0 && folders.length === 0);
    refreshStorageStats();
  }, [refreshData, refreshStorageStats]);

  const setSorting = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const all = [...folders.map(f => f.id), ...files.map(f => f.id)];
    setSelectedIds(all);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Upload processing simulation with real chunks & progress
  const queueFilesForUpload = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const newItems: UploadItem[] = filesArray.map(f => ({
      id: 'up_' + Math.random().toString(36).substring(4),
      file: f,
      name: f.name,
      size: f.size,
      mimeType: f.type || 'application/octet-stream',
      parentFolderId: currentFolderId,
      progress: 0,
      speed: '0 KB/s',
      status: 'queued'
    }));

    setUploads(prev => [...newItems, ...prev]);

    // Process each upload sequentially or in parallel
    newItems.forEach(item => {
      processUpload(item);
    });
  };

  const processUpload = async (item: UploadItem) => {
    try {
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'uploading', progress: 5, speed: 'Connecting...' } : u));

      const res = await filesApi.uploadFile(
        item.file,
        item.parentFolderId,
        (progress, speed) => {
          setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress, speed } : u));
        }
      );

      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: 100, status: 'completed', speed: 'Done' } : u));
      
      // Optimistically add newly uploaded file to list if relevant
      if (res.data && res.data.id) {
        setFiles(prev => [res.data, ...prev.filter(f => f.id !== res.data.id)]);
      }

      // Smooth background update without clearing the screen
      refreshData(false);
      refreshStorageStats();
      refreshUser();
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.id === item.id ? {
        ...u,
        status: 'error',
        error: err.message || 'Upload failed'
      } : u));
    }
  };

  const cancelUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const clearCompletedUploads = () => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'));
  };

  const createFolder = async (name: string, color?: string) => {
    await foldersApi.createFolder(name, currentFolderId, color || '#0061FE');
    await refreshData(false);
  };

  const renameItem = async (id: string, type: 'file' | 'folder', newName: string) => {
    if (type === 'file') {
      await filesApi.renameFile(id, newName);
    } else {
      await foldersApi.renameFolder(id, newName);
    }
    await refreshData(false);
  };

  const trashItem = async (id: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      await filesApi.trashFile(id);
    } else {
      await foldersApi.trashFolder(id);
    }
    await refreshData(false);
    await refreshStorageStats();
  };

  const restoreItem = async (id: string, type: 'file' | 'folder') => {
    await trashApi.restoreItem(id, type);
    await refreshData(false);
    await refreshStorageStats();
  };

  const permanentlyDeleteItem = async (id: string, type: 'file' | 'folder') => {
    await trashApi.permanentlyDeleteItem(id, type);
    await refreshData(false);
    await refreshStorageStats();
    await refreshUser();
  };

  const emptyTrash = async () => {
    await trashApi.emptyTrash();
    await refreshData(false);
    await refreshStorageStats();
    await refreshUser();
  };

  const toggleStar = async (id: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      await searchApi.toggleFileStar(id);
    } else {
      await searchApi.toggleFolderStar(id);
    }
    await refreshData(false);
  };

  const moveItem = async (id: string, type: 'file' | 'folder', targetFolderId: string | null) => {
    if (type === 'file') {
      await filesApi.moveFile(id, targetFolderId);
    } else {
      await foldersApi.moveFolder(id, targetFolderId);
    }
    await refreshData(false);
  };

  const copyItem = async (id: string, targetFolderId: string | null) => {
    await filesApi.copyFile(id, targetFolderId);
    await refreshData(false);
    await refreshStorageStats();
  };

  const downloadFile = async (fileId: string) => {
    const res = await filesApi.getDownloadUrl(fileId);
    const link = document.createElement('a');
    link.href = res.data.downloadUrl;
    link.download = res.data.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <FileContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        currentFolderId,
        setCurrentFolderId,
        breadcrumbs,
        files,
        folders,
        isLoading,
        viewMode,
        setViewMode,
        sortField,
        sortOrder,
        setSorting,
        selectedIds,
        toggleSelectId,
        selectAll,
        clearSelection,
        searchQuery,
        setSearchQuery,
        fileTypeFilter,
        setFileTypeFilter,
        storageStats,
        refreshStorageStats,
        uploads,
        queueFilesForUpload,
        cancelUpload,
        clearCompletedUploads,
        createFolder,
        renameItem,
        trashItem,
        restoreItem,
        permanentlyDeleteItem,
        emptyTrash,
        toggleStar,
        moveItem,
        copyItem,
        downloadFile,
        inspectedItem,
        setInspectedItem,
        previewFile,
        setPreviewFile,
        shareTarget,
        setShareTarget,
        moveTarget,
        setMoveTarget,
        isNewFolderOpen,
        setIsNewFolderOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        refreshData
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error('useFiles must be used within a FileProvider');
  return context;
};
